import asyncio
import random
import subprocess
import sys
import platform
from fastapi import FastAPI
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi import Depends, HTTPException, status
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import time
import shlex
from sentinel_ai_classifier import classify_traffic as hybrid_classify, init_sentry
from fastapi import UploadFile, File, Form

# Optional dependency for Sentry model loading
try:
    import joblib  # type: ignore
    HAS_JOBLIB = True
except Exception:
    joblib = None
    HAS_JOBLIB = False

    # Help static type checkers: optional heavy libs used at runtime only
    from typing import TYPE_CHECKING
    if TYPE_CHECKING:
        import numpy  # type: ignore
        import shap  # type: ignore

    # Optional runtime holder for a loaded SHAP explainer (may be None)
    SENTRY_EXPLAINER: Any = None

# --- Configuration & State Management ---
app = FastAPI()

# Basic auth for admin endpoints
security = HTTPBasic()
ADMIN_USER = os.environ.get("SENTINEL_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("SENTINEL_ADMIN_PASS", "admin")

def require_admin(creds: HTTPBasicCredentials = Depends(security)):
    # simple constant-time comparison
    import secrets

    correct_user = secrets.compare_digest(creds.username, ADMIN_USER)
    correct_pass = secrets.compare_digest(creds.password, ADMIN_PASS)
    if not (correct_user and correct_pass):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized", headers={"WWW-Authenticate": "Basic"})
    return True

# Allow CORS for our Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state to simulate the system
# In a real system, this would be a more robust data store
state = {
    "active_flows": {},
    "classification_log": [],
    "policy_map": {},
    "investigations": [],
    "suggestions": [],
    "suggestion_counters": {},
    "metrics": {
        "high_prio": {"bandwidth": 0, "packets": 0},
        "video_stream": {"bandwidth": 0, "packets": 0},
        "best_effort": {"bandwidth": 0, "packets": 0},
        "low_prio": {"bandwidth": 0, "packets": 0},
    }
}

# Admin runtime flags
state.setdefault("admin", {})
state["admin"]["simulate_enabled"] = True
state["admin"]["llm_enabled"] = True
state["admin"]["llm_model"] = "mistral"

# Sentinel-QoS Policy Map: Connects AI classification to network action
POLICY_DEFINITIONS = {
    "Audio/Video Call": {"dscp_class": "EF", "dscp_value": "0x2e", "tc_class": "1:10", "metric_key": "high_prio"},
    "Gaming": {"dscp_class": "EF", "dscp_value": "0x2e", "tc_class": "1:10", "metric_key": "high_prio"},
    "Video Streaming": {"dscp_class": "AF41", "dscp_value": "0x22", "tc_class": "1:20", "metric_key": "video_stream"},
    "Browsing": {"dscp_class": "AF21", "dscp_value": "0x12", "tc_class": "1:30", "metric_key": "best_effort"},
    "File Download": {"dscp_class": "CS1", "dscp_value": "0x08", "tc_class": "1:40", "metric_key": "low_prio"},
    "Video Upload": {"dscp_class": "AF31", "dscp_value": "0x1a", "tc_class": "1:40", "metric_key": "low_prio"},
}
TRAFFIC_TYPES = list(POLICY_DEFINITIONS.keys())

# --- Pydantic Models for API Type Safety ---
class Flow(BaseModel):
    id: str
    source_ip: str
    dest_ip: str
    dest_port: int
    status: str
    app_type: Optional[str] = None

class LogEntry(BaseModel):
    timestamp: str
    message: str

class Policy(BaseModel):
    flow_id: str
    app_type: str
    dscp_class: str
    tc_class: str
    explanation: Optional[str] = None

class Metrics(BaseModel):
    high_prio: Dict[str, int]
    video_stream: Dict[str, int]
    best_effort: Dict[str, int]
    low_prio: Dict[str, int]


class Investigation(BaseModel):
    flow_id: str
    features: Dict[str, Any]
    sentry_prediction: Optional[str] = None
    sentry_confidence: Optional[float] = None
    vanguard_prediction: Optional[str] = None
    vanguard_confidence: Optional[float] = None
    vanguard_explanation: Optional[str] = None
    timestamp: str


class Suggestion(BaseModel):
    id: str
    profile_id: str
    suggested_app: str
    suggested_dscp: str
    suggested_tc: str
    rationale: str
    votes: int = 0
    status: str = "pending"  # pending | approved | denied


def _record_suggestion(profile_id: str, app: str, rationale: str):
    # Create or increment a suggestion counter for recurring patterns
    key = f"{profile_id}:{app}"
    cnt = state.get("suggestion_counters", {}).get(key, 0) + 1
    state.setdefault("suggestion_counters", {})[key] = cnt

    # If seen at least twice, propose a suggestion
    if cnt >= 2:
        sug_id = f"sugg_{int(time.time()*1000)}"
        suggestion = {
            "id": sug_id,
            "profile_id": profile_id,
            "suggested_app": app,
            "suggested_dscp": POLICY_DEFINITIONS.get(app, {}).get("dscp_class", "EF"),
            "suggested_tc": POLICY_DEFINITIONS.get(app, {}).get("tc_class", "1:10"),
            "rationale": rationale,
            "votes": cnt,
            "status": "pending",
        }
        # Avoid duplicates
        existing = [s for s in state.get("suggestions", []) if s["profile_id"] == profile_id and s["suggested_app"] == app]
        if not existing:
            state["suggestions"].insert(0, suggestion)
            state["classification_log"].insert(0, {"timestamp": "now", "message": f"New policy suggestion: {sug_id} for profile {profile_id} -> {app}"})
        return suggestion
    return None


@app.get("/suggestions")
async def list_suggestions():
    return state.get("suggestions", [])


@app.post("/suggestions/{sugg_id}/approve")
async def approve_suggestion(sugg_id: str):
    for s in state.get("suggestions", []):
        if s["id"] == sugg_id:
            s["status"] = "approved"
            # When approved, add to policy_map as a named policy (demo only)
            policy_key = f"policy_suggested_{sugg_id}"
            state["policy_map"][policy_key] = {"flow_id": policy_key, "app_type": s["suggested_app"], "dscp_class": s["suggested_dscp"], "tc_class": s["suggested_tc"], "explanation": s["rationale"]}
            state["classification_log"].insert(0, {"timestamp": "now", "message": f"Suggestion {sugg_id} approved and new policy {policy_key} created."})
            return s
    return {"error": "not found"}


@app.post("/suggestions/{sugg_id}/deny")
async def deny_suggestion(sugg_id: str):
    for s in state.get("suggestions", []):
        if s["id"] == sugg_id:
            s["status"] = "denied"
            state["classification_log"].insert(0, {"timestamp": "now", "message": f"Suggestion {sugg_id} denied."})
            return s
    return {"error": "not found"}


class SystemStatus(BaseModel):
    active_flows: List[Flow]
    classification_log: List[LogEntry]
    active_policies: List[Policy]
    metrics: Metrics
    investigations: List[Investigation]


# --- New models for two-stage classification ---
class FlowFeatures(BaseModel):
    source_ip: str
    dest_ip: str
    dest_port: int
    packet_count: int
    avg_pkt_len: float
    duration_seconds: float
    bytes_total: int
    protocol: Optional[str] = None


class ClassificationResult(BaseModel):
    flow_id: str
    app_type: str
    confidence: float
    explanation: Optional[str] = None
    engine: Optional[str] = None
    shap: Optional[Dict[str, float]] = None


# Helper to compute a SHAP mapping for a feature vector when explainer is available
def compute_shap_map(features: FlowFeatures) -> Optional[Dict[str, float]]:
    # Use optional SENTRY_EXPLAINER when available; otherwise use synthetic fallback
    if 'SENTRY_EXPLAINER' in globals() and globals().get('SENTRY_EXPLAINER') is None:
        # Synthetic deterministic fallback for demo purposes
        try:
            # Create deterministic pseudo-importances scaled from feature values
            import math
            seed_str = json.dumps(features.dict(), sort_keys=True)
            seed = abs(hash(seed_str)) % 1000
            def _sign(x):
                return 1 if (abs(hash(str(x) + str(seed))) % 2 == 0) else -1

            vals = {
                'packet_count': float(features.packet_count) * 1e-3,
                'avg_pkt_len': float(features.avg_pkt_len) * 1e-3,
                'duration_seconds': float(features.duration_seconds) * 0.1,
                'bytes_total': float(features.bytes_total) * 1e-6,
                'dest_port': float((features.dest_port % 1000)) * 1e-3,
            }
            # normalize into -1..1 range roughly
            maxv = max(abs(v) for v in vals.values()) or 1.0
            shap_map = {k: round(_sign(v) * (abs(v) / maxv), 6) for k, v in vals.items()}
            return shap_map
        except Exception:
            return None
    try:
        try:
            # optional import; some dev environments don't have numpy installed.
            # Use a local name _np and fall back to None when unavailable.
            import numpy as _np  # type: ignore[import]
        except Exception:
            _np = None

        # if either numpy or a loaded explainer is missing, bail out early
        if _np is None or ('SENTRY_EXPLAINER' in globals() and globals().get('SENTRY_EXPLAINER') is None):
            return None

        fv = _np.array([[
            features.packet_count,
            features.avg_pkt_len,
            features.duration_seconds,
            features.bytes_total,
            features.dest_port,
        ]])
        sv = None
        try:
            sv = SENTRY_EXPLAINER.shap_values(fv)
        except Exception:
            # some explainers use explainer(fv)
            try:
                res = SENTRY_EXPLAINER(fv)
                sv = getattr(res, 'values', None) or res
            except Exception:
                sv = None

        if sv is None:
            return None

        # Determine feature names
        feature_names = []
        try:
            if hasattr(SENTRY_EXPLAINER, 'feature_names') and getattr(SENTRY_EXPLAINER, 'feature_names') is not None:
                feature_names = list(getattr(SENTRY_EXPLAINER, 'feature_names'))
        except Exception:
            feature_names = []
        if not feature_names:
            feature_names = ['packet_count', 'avg_pkt_len', 'duration_seconds', 'bytes_total', 'dest_port']

        # Normalize shap values
        try:
            if isinstance(sv, list):
                arr = sv[0][0]
            else:
                arr = sv[0]
        except Exception:
            try:
                arr = _np.asarray(sv).ravel()
            except Exception:
                return None

        return {feature_names[i]: float(round(float(arr[i]), 6)) for i in range(min(len(feature_names), len(arr)))}
    except Exception:
        return None

# --- Core Simulation Logic ---
def apply_iptables_rule(source_ip: str, dest_ip: str, dest_port: int, dscp_class: str):
    """Simulate applying an iptables DSCP mark for a flow.

    On Linux with appropriate privileges this could run iptables/tc. For this
    prototype (and when running on macOS) we only log the intended action so
    the orchestrator remains runnable without root privileges.
    """
    msg = f"[SIM] Mark {source_ip}->{dest_ip}:{dest_port} as DSCP={dscp_class}"
    print(msg)
    # Keep a copy in the in-memory log for the frontend to show
    state["classification_log"].insert(0, {"timestamp": "now", "message": msg})
    # If running on Linux and the user wants to enable real marking, they can
    # replace this block with a subprocess call to iptables/tc and ensure sudo.


def sentry_predict(features: FlowFeatures) -> ClassificationResult:
    """Lightweight fast classifier (Sentry).

    Tries to use LightGBM if available (model file 'sentry_model.joblib').
    If not available, falls back to a fast heuristic that returns a label
    and a confidence score.
    """
    # Try to load a pre-trained model if present
    if HAS_JOBLIB and joblib is not None:
        try:
            model = None
            try:
                try:
                    model = joblib.load("sentry_model.joblib")
                except Exception:
                    model = joblib.load("sentry_model.pkl")
            except Exception:
                model = None
            if model is not None:
                # convert features to the expected feature vector
                fv = [
                    features.packet_count,
                    features.avg_pkt_len,
                    features.duration_seconds,
                    features.bytes_total,
                    features.dest_port,
                ]
                # model must implement predict_proba
                probs = model.predict_proba([fv])[0]
                best_idx = int(probs.argmax())
                label = model.classes_[best_idx]
                confidence = float(probs[best_idx])
                return ClassificationResult(flow_id="", app_type=label, confidence=confidence, engine=None)
        except Exception:
            # silent fallback to heuristic
            pass

    # Heuristic fallback logic
    # Video: large avg packet and sustained bytes
    if features.avg_pkt_len > 900 and features.packet_count > 50:
        return ClassificationResult(flow_id="", app_type="Video Streaming", confidence=0.98, engine=None)
    if features.packet_count > 2000 or features.bytes_total > 10_000_000:
        return ClassificationResult(flow_id="", app_type="File Download", confidence=0.995, engine=None)
    if features.dest_port in (3478, 5004, 5005):
        return ClassificationResult(flow_id="", app_type="Audio/Video Call", confidence=0.96, engine=None)
    # Default: lower confidence
    # Randomly pick a plausible label with medium confidence
    label = random.choice(TRAFFIC_TYPES)
    confidence = round(random.uniform(0.6, 0.93), 4)
    return ClassificationResult(flow_id="", app_type=label, confidence=confidence, engine=None)


def vanguard_query_llm(features: FlowFeatures, prompt_text: Optional[str] = None) -> ClassificationResult:
    """Query the Vanguard LLM (preferably Ollama/mistral) for an explanation.

    Attempts multiple strategies but falls back to a simulated response if no
    LLM runtime is available locally.
    """
    # Build a textual prompt from the features if not provided
    if not prompt_text:
        prompt = (
            f"You are an expert network analyst. Given the flow summary:\n"
            f"source_ip={features.source_ip}, dest_ip={features.dest_ip}, dest_port={features.dest_port}, "
            f"packet_count={features.packet_count}, avg_pkt_len={features.avg_pkt_len:.1f}, "
            f"duration_sec={features.duration_seconds:.2f}, bytes={features.bytes_total}.\n"
            "Provide a JSON object with keys: app_type (one of known types), confidence (0-1), explanation (short human-readable)."
        )
    else:
        prompt = prompt_text

    # Try Ollama via subprocess (if installed). Prefer local Genma/Gemma model then fall back to mistral.
    try:
        for model_name in ("genma2b", "genma-2b", "gemma:2b", "gemma2b", "mistral"):
            try:
                cmd = f"ollama eval --model={model_name} --json '{json.dumps({'prompt': prompt})}'"
                proc = subprocess.run(shlex.split(cmd), capture_output=True, text=True, timeout=60)
                if proc.returncode == 0 and proc.stdout:
                    out = proc.stdout.strip()
                    try:
                        parsed = json.loads(out)
                        # Expecting {app_type, confidence, explanation}
                        return ClassificationResult(
                            flow_id="",
                            app_type=parsed.get('app_type', 'Unknown'),
                            confidence=float(parsed.get('confidence', 0.0)),
                            explanation=parsed.get('explanation'),
                            engine="Vanguard",
                        )
                    except Exception:
                        # If output not JSON, include raw output as explanation
                        return ClassificationResult(flow_id="", app_type="Unknown", confidence=0.5, explanation=out[:1000], engine="Vanguard")
            except FileNotFoundError:
                # ollama not installed, try next model
                continue
            except subprocess.TimeoutExpired:
                # try next model name on timeout
                continue
    except Exception:
        # best-effort; fall back to simulated analysis
        pass

    # Fallback simulated LLM analysis
    chosen = random.choice(TRAFFIC_TYPES)
    explanation = (
        f"LLM-simulated analysis: observed average packet length {features.avg_pkt_len:.1f} bytes and "
        f"{features.packet_count} packets over {features.duration_seconds:.2f}s — likely {chosen}."
    )
    confidence = round(random.uniform(0.85, 0.99), 4)
    return ClassificationResult(flow_id="", app_type=chosen, confidence=confidence, explanation=explanation, engine=None)


async def simulate_traffic():
    """Main simulation loop to generate and classify traffic."""
    flow_counter = 0
    while True:
        await asyncio.sleep(random.uniform(2, 5))

        # respect admin toggle
        if not state.get("admin", {}).get("simulate_enabled", True):
            await asyncio.sleep(1)
            continue

        # Simulate a new flow appearing
        flow_counter += 1
        source_ip = f"192.168.1.{random.randint(100, 200)}"
        dest_ip = f"10.0.0.{random.randint(1, 254)}"
        dest_port = random.choice([80, 443, 3478, 5000, 8080, 9000])
        flow_id = f"flow_{flow_counter}"

        flow = {
            "id": flow_id,
            "source_ip": source_ip,
            "dest_ip": dest_ip,
            "dest_port": dest_port,
            "status": "Classifying...",
            "app_type": None,
        }

        # Save flow and log detection
        state["active_flows"][flow_id] = flow
        state["classification_log"].insert(0, {"timestamp": "now", "message": f"New flow detected: {source_ip} -> {dest_ip}"})

        # Simulate AI classification delay
        await asyncio.sleep(1.5)

        # Simulate AI model making a prediction
        predicted_app = random.choice(TRAFFIC_TYPES)
        confidence = random.uniform(0.92, 0.99)
        explanation = f"Synthetic Sentry classification (simulated)"
        state["classification_log"].insert(0, {
            "timestamp": "now",
            "message": f"Flow {flow_id} classified as [{predicted_app}] with {confidence:.2%} confidence.",
            "explanation": explanation,
            "engine": "Sentry",
        })

        # Apply the corresponding QoS policy (simulated)
        policy = POLICY_DEFINITIONS[predicted_app]
        apply_iptables_rule(source_ip, dest_ip, dest_port, policy["dscp_class"])

        # Update state with applied policy
        flow["status"] = "Policy Applied"
        flow["app_type"] = predicted_app
        # Mark that this simulated decision came from the fast Sentry path
        flow["engine"] = "Sentry"
        state["policy_map"][flow_id] = {
            "flow_id": flow_id,
            "app_type": predicted_app,
            "dscp_class": policy["dscp_class"],
            "tc_class": policy["tc_class"],
        }

        # Simulate traffic metrics
        metric_key = policy.get("metric_key")
        if metric_key and metric_key in state["metrics"]:
            state["metrics"][metric_key]["packets"] += random.randint(50, 200)
            state["metrics"][metric_key]["bandwidth"] += random.randint(1000, 5000)


@app.on_event("startup")
async def startup_event():
    # Start the background simulation task
    # initialize Sentry model (non-blocking if model missing)
    loop = asyncio.get_event_loop()
    # run init_sentry in executor to avoid blocking startup if joblib load is slow
    await loop.run_in_executor(None, init_sentry)
    asyncio.create_task(simulate_traffic())


# --- Admin endpoints (minimal) ---
@app.post("/admin/simulate")
async def set_simulation(enabled: bool = Form(...), authorized: bool = Depends(require_admin)):
    """Enable or disable background traffic simulation."""
    state.setdefault("admin", {})["simulate_enabled"] = bool(enabled)
    return {"simulate_enabled": state["admin"]["simulate_enabled"]}


@app.post("/admin/upload-model")
async def upload_model(file: UploadFile = File(...), authorized: bool = Depends(require_admin)):
    """Upload a sentry model payload (joblib/.pkl). Saves to working dir as sentry_model.pkl"""
    contents = await file.read()
    out_path = "sentry_model.pkl"
    try:
        with open(out_path, "wb") as fh:
            fh.write(contents)
        # Attempt to re-init sentry in executor
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, init_sentry)
        return {"saved": out_path}
    except Exception as e:
        return {"error": str(e)}


@app.get("/admin/llm-health")
async def llm_health():
    """Lightweight public health endpoint for the local LLM runtime used by Vanguard.

    Returns a small JSON object: { ollama_installed: bool, model_present: bool, models: [name...] }
    This endpoint is intentionally public (no admin auth) because the frontend polls it to show status.
    """
    try:
        # Check for ollama by invoking `ollama ls` and parsing output heuristically.
        proc = subprocess.run(["ollama", "ls"], capture_output=True, text=True, timeout=6)
        if proc.returncode != 0:
            return {"ollama_installed": True, "model_present": False, "models": []}

        out = (proc.stdout or "").strip()
        if not out:
            return {"ollama_installed": True, "model_present": False, "models": []}

        names = []
        for line in out.splitlines():
            line = line.strip()
            if not line:
                continue
            # Skip header lines that contain 'NAME' or 'ID'
            if line.upper().startswith("NAME") or line.upper().startswith("ID"):
                continue
            parts = line.split()
            if parts:
                names.append(parts[0])

        return {"ollama_installed": True, "model_present": len(names) > 0, "models": names}
    except FileNotFoundError:
        return {"ollama_installed": False, "model_present": False, "models": []}
    except Exception:
        return {"ollama_installed": True, "model_present": False, "models": []}


@app.get("/admin/llm-settings")
async def get_llm_settings(authorized: bool = Depends(require_admin)):
    admin = state.get("admin", {})
    return {"llm_enabled": admin.get("llm_enabled", True), "llm_model": admin.get("llm_model", "mistral")}


@app.post("/admin/llm-settings")
async def set_llm_settings(llm_enabled: bool = Form(...), llm_model: str = Form(...), authorized: bool = Depends(require_admin)):
    state.setdefault("admin", {})["llm_enabled"] = bool(llm_enabled)
    state["admin"]["llm_model"] = str(llm_model)
    return {"llm_enabled": state["admin"]["llm_enabled"], "llm_model": state["admin"]["llm_model"]}


@app.post("/classify", response_model=ClassificationResult)
async def classify_flow(features: FlowFeatures):
    """Two-stage classification endpoint using the external hybrid classifier.

    Returns ClassificationResult with app_type, confidence, explanation and engine.
    """
    flow_id = f"manual_{int(time.time()*1000)}"

    # Call the hybrid classifier implemented in sentinel_ai_classifier
    try:
        # hybrid_classify is synchronous now; run it in a thread to avoid blocking the event loop.
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: hybrid_classify(features.dict()))
    except Exception:
        # As a fallback, run the existing sentry + vanguard flow
        sentry_res = sentry_predict(features)
        shap_map = compute_shap_map(features)
        if sentry_res.confidence >= 0.95:
            explanation = f"Sentry auto-accepted (conf={sentry_res.confidence:.2f})"
            policy = POLICY_DEFINITIONS.get(sentry_res.app_type, None)
            if policy:
                state["policy_map"][flow_id] = {"flow_id": flow_id, "app_type": sentry_res.app_type, "dscp_class": policy["dscp_class"], "tc_class": policy["tc_class"], "explanation": explanation}
                apply_iptables_rule(features.source_ip, features.dest_ip, features.dest_port, policy["dscp_class"])
            state["active_flows"][flow_id] = {"id": flow_id, "source_ip": features.source_ip, "dest_ip": features.dest_ip, "dest_port": features.dest_port, "status": "Policy Applied", "app_type": sentry_res.app_type}
            state["classification_log"].insert(0, {"timestamp": "now", "message": f"Sentry classified {flow_id} as {sentry_res.app_type} ({sentry_res.confidence:.2f})"})
            return ClassificationResult(flow_id=flow_id, app_type=sentry_res.app_type, confidence=sentry_res.confidence, explanation=explanation, engine="Sentry", shap=shap_map)

        vanguard_res = vanguard_query_llm(features)
        vanguard_res.flow_id = flow_id
        shap_map = compute_shap_map(features)
        investigation = {
            "flow_id": flow_id,
            "features": features.dict(),
            "sentry_prediction": sentry_res.app_type,
            "sentry_confidence": sentry_res.confidence,
            "vanguard_prediction": vanguard_res.app_type,
            "vanguard_confidence": vanguard_res.confidence,
            "vanguard_explanation": vanguard_res.explanation,
            "timestamp": "now",
            "shap": shap_map,
        }
        state["investigations"].insert(0, investigation)
        profile_id = f"profile_{hash(json.dumps(features.dict(), sort_keys=True)) & 0xffffffff}"
        _record_suggestion(profile_id, vanguard_res.app_type, vanguard_res.explanation or "")
        policy = POLICY_DEFINITIONS.get(vanguard_res.app_type, None)
        if policy:
            state["policy_map"][flow_id] = {"flow_id": flow_id, "app_type": vanguard_res.app_type, "dscp_class": policy["dscp_class"], "tc_class": policy["tc_class"], "explanation": vanguard_res.explanation}
            apply_iptables_rule(features.source_ip, features.dest_ip, features.dest_port, policy["dscp_class"])
        state["active_flows"][flow_id] = {"id": flow_id, "source_ip": features.source_ip, "dest_ip": features.dest_ip, "dest_port": features.dest_port, "status": "Policy Applied", "app_type": vanguard_res.app_type}
        state["classification_log"].insert(0, {"timestamp": "now", "message": f"Vanguard classified {flow_id} as {vanguard_res.app_type} ({vanguard_res.confidence:.2f}) - {vanguard_res.explanation}"})
        return ClassificationResult(flow_id=flow_id, app_type=vanguard_res.app_type, confidence=vanguard_res.confidence, explanation=vanguard_res.explanation, engine="Vanguard", shap=shap_map)

    # If classifier returned a dict-like result
    if isinstance(result, dict):
        app_type = result.get("classification") or result.get("app_type") or "Unknown"
        confidence = float(result.get("confidence", 0.0))
        explanation = result.get("explanation")
        engine = result.get("engine") or "Vanguard"

        # Attempt to compute SHAP values if Sentry explainer and model were used
        shap_map = None
        try:
            if engine == 'Sentry':
                shap_map = compute_shap_map(features)
        except Exception:
            shap_map = None

        # Log and record investigation if from Vanguard
        if engine == "Vanguard":
            investigation = {
                "flow_id": flow_id,
                "features": features.dict(),
                "sentry_prediction": None,
                "sentry_confidence": None,
                "vanguard_prediction": app_type,
                "vanguard_confidence": confidence,
                "vanguard_explanation": explanation,
                "timestamp": "now",
                "shap": shap_map,
            }
            state["investigations"].insert(0, investigation)
            profile_id = f"profile_{hash(json.dumps(features.dict(), sort_keys=True)) & 0xffffffff}"
            _record_suggestion(profile_id, str(app_type), explanation or "")

        # Apply policy if available
        policy = POLICY_DEFINITIONS.get(str(app_type), None)
        if policy:
            state["policy_map"][flow_id] = {"flow_id": flow_id, "app_type": app_type, "dscp_class": policy["dscp_class"], "tc_class": policy["tc_class"], "explanation": explanation}
            apply_iptables_rule(features.source_ip, features.dest_ip, features.dest_port, policy["dscp_class"])

        state["active_flows"][flow_id] = {"id": flow_id, "source_ip": features.source_ip, "dest_ip": features.dest_ip, "dest_port": features.dest_port, "status": "Policy Applied", "app_type": str(app_type)}
        state["classification_log"].insert(0, {"timestamp": "now", "message": f"Hybrid classified {flow_id} as {app_type} ({confidence:.2f}) via {engine}"})
        # Include shap mapping in the response when available
        return ClassificationResult(flow_id=flow_id, app_type=str(app_type), confidence=confidence, explanation=explanation, engine=str(engine), shap=shap_map)

# --- API Endpoints ---
@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Endpoint for the frontend to poll for real-time updates."""
    return {
        "active_flows": list(state["active_flows"].values()),
        "classification_log": state["classification_log"][:10], # Return last 10 logs
    "active_policies": list(state["policy_map"].values()),
    "metrics": state["metrics"],
    "investigations": state.get("investigations", [])
    }


@app.get("/", include_in_schema=False)
async def root():
    """Simple root endpoint to make visiting http://host:8000/ friendly.

    Returns a small JSON payload so the base path doesn't return a 404.
    """
    return {"status": "ok", "detail": "Sentinel backend running"}


@app.post("/investigations/{flow_id}/vanguard")
async def run_vanguard_analysis(flow_id: str):
    """Trigger Vanguard (LLM) analysis for a given flow_id and return the natural-language explanation.

    This endpoint tries to find the investigation entry first, then falls back to active_flows.
    It uses the existing vanguard_query_llm helper which will attempt to call Ollama if available
    or return a simulated analysis otherwise.
    """
    # Find the investigation by flow_id
    inv = None
    for i in state.get("investigations", []):
        if i.get("flow_id") == flow_id:
            inv = i
            break

    # If not an investigation, check active flows
    features = None
    if inv is not None:
        feats = inv.get("features")
        try:
            features = FlowFeatures(**feats)
        except Exception:
            features = None
    else:
        f = state.get("active_flows", {}).get(flow_id)
        if f:
            # Attempt to synthesize FlowFeatures from active flow record
            try:
                features = FlowFeatures(
                    source_ip=f.get("source_ip", "0.0.0.0"),
                    dest_ip=f.get("dest_ip", "0.0.0.0"),
                    dest_port=int(f.get("dest_port", 0)),
                    packet_count=int(f.get("packet_count", 0)),
                    avg_pkt_len=float(f.get("avg_pkt_len", 0.0)),
                    duration_seconds=float(f.get("duration_seconds", 0.0)),
                    bytes_total=int(f.get("bytes_total", 0)),
                )
            except Exception:
                features = None

    if features is None:
        raise HTTPException(status_code=404, detail="Flow or investigation not found or missing features")

    # Respect admin toggle for LLM
    if not state.get("admin", {}).get("llm_enabled", True):
        raise HTTPException(status_code=503, detail="Vanguard LLM is disabled by admin")

    # Run LLM analysis in executor to avoid blocking
    loop = asyncio.get_event_loop()
    try:
        vres = await loop.run_in_executor(None, lambda: vanguard_query_llm(features))
        # Attach flow id
        vres.flow_id = flow_id
        return {"flow_id": flow_id, "app_type": vres.app_type, "confidence": vres.confidence, "explanation": vres.explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

# --- Simulation API for interactive what-if scenarios ---
class SimulationParams(BaseModel):
    video_percentage: float = 50.0
    total_volume_gb: int = 1


@app.post("/simulate")
async def run_simulation(params: SimulationParams):
    """Generate synthetic traffic according to params and return aggregated classification counts.

    The implementation is intentionally conservative in sample count to remain responsive
    in demo environments. It uses `sentry_predict` (fast heuristic / model) when possible
    and falls back to the hybrid classifier for variety.
    """
    try:
        import numpy as _np  # type: ignore
    except Exception:
        _np = None

    # Decide number of synthetic flows to generate (bounded)
    requested = max(10, int(params.total_volume_gb * 100))
    num_samples = min(2000, requested)

    video_share = float(max(0.0, min(100.0, params.video_percentage))) / 100.0
    video_samples = int(round(num_samples * video_share))
    other_samples = num_samples - video_samples

    samples = []

    def make_video_feature(i):
        # Video tends to have large avg packet length and sustained bytes
        return FlowFeatures(
            source_ip=f"192.168.100.{(i % 240) + 10}",
            dest_ip=f"10.1.0.{(i % 240) + 1}",
            dest_port=int(8000 + (i % 1000)),
            packet_count=int(100 + (i % 500)),
            avg_pkt_len=float(800 + (i % 400)),
            duration_seconds= max(1.0, float((i % 60) + 5)),
            bytes_total=int((800 + (i % 400)) * (100 + (i % 500))),
        )

    def make_other_feature(i):
        # Browsing / mixed traffic
        return FlowFeatures(
            source_ip=f"192.168.200.{(i % 240) + 10}",
            dest_ip=f"10.2.0.{(i % 240) + 1}",
            dest_port=int(80 + (i % 6000)),
            packet_count=int(10 + (i % 300)),
            avg_pkt_len=float(200 + (i % 300)),
            duration_seconds= max(0.2, float((i % 30) + 1)),
            bytes_total=int((200 + (i % 300)) * (10 + (i % 300))),
        )

    for i in range(video_samples):
        samples.append(make_video_feature(i))
    for i in range(other_samples):
        samples.append(make_other_feature(i + video_samples))

    # Run classifier for each sample (use sentry_predict for speed when possible)
    counts: Dict[str, int] = {}
    loop = asyncio.get_event_loop()

    def classify_sample(feature: FlowFeatures):
        try:
            # Prefer sentry_predict fast path
            res = sentry_predict(feature)
            label = res.app_type if res and res.app_type else 'Unknown'
        except Exception:
            try:
                # Fallback to hybrid classifier module (may call LLM but kept minimal)
                r = hybrid_classify(feature.dict())
                if isinstance(r, dict):
                    label = r.get('classification') or r.get('app_type') or 'Unknown'
                else:
                    label = getattr(r, 'app_type', 'Unknown')
            except Exception:
                label = 'Unknown'
        return label

    # Run classification in a threadpool for responsiveness
    try:
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=8) as exc:
            futs = [loop.run_in_executor(exc, classify_sample, s) for s in samples]
            for f in asyncio.as_completed(futs):
                try:
                    lbl = await f
                except Exception:
                    lbl = 'Unknown'
                counts[lbl] = counts.get(lbl, 0) + 1
    except Exception:
        # Synchronous fallback if executor fails
        for s in samples:
            lbl = classify_sample(s)
            counts[lbl] = counts.get(lbl, 0) + 1

    return {"simulation_results": counts, "num_samples": num_samples}