import asyncio
import random
import subprocess
import sys
import platform
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import time
import shlex
from sentinel_ai_classifier import classify_traffic as hybrid_classify, init_sentry

# Optional dependency for Sentry model loading
try:
    import joblib  # type: ignore
    HAS_JOBLIB = True
except Exception:
    joblib = None
    HAS_JOBLIB = False

# --- Configuration & State Management ---
app = FastAPI()

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

    # Try Ollama via subprocess (if installed). Use environment variable to select model.
    try:
        ollama_model = os.environ.get("OLLAMA_MODEL", "mistral")
        payload = {"prompt": prompt}
        # Pass arguments as a list to avoid shell quoting/escaping issues
        proc = subprocess.run([
            "ollama",
            "eval",
            "--model",
            ollama_model,
            "--json",
            json.dumps(payload),
        ], capture_output=True, text=True, timeout=30)

        if proc.returncode == 0 and proc.stdout:
            out = proc.stdout.strip()
            try:
                parsed = json.loads(out)
                # Expecting {app_type, confidence, explanation}
                return ClassificationResult(
                    flow_id="",
                    app_type=parsed.get("app_type", "Unknown"),
                    confidence=float(parsed.get("confidence", 0.0)),
                    explanation=parsed.get("explanation"),
                    engine="Vanguard",
                )
            except Exception:
                # If output not JSON, include raw output as explanation
                return ClassificationResult(flow_id="", app_type="Unknown", confidence=0.5, explanation=out[:1000], engine="Vanguard")
    except FileNotFoundError:
        # ollama not installed or not on PATH
        pass
    except Exception:
        # Any other error (timeout, permission) -> fall back to simulated LLM
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
        if sentry_res.confidence >= 0.95:
            explanation = f"Sentry auto-accepted (conf={sentry_res.confidence:.2f})"
            policy = POLICY_DEFINITIONS.get(sentry_res.app_type, None)
            if policy:
                state["policy_map"][flow_id] = {"flow_id": flow_id, "app_type": sentry_res.app_type, "dscp_class": policy["dscp_class"], "tc_class": policy["tc_class"], "explanation": explanation}
                apply_iptables_rule(features.source_ip, features.dest_ip, features.dest_port, policy["dscp_class"])
            state["active_flows"][flow_id] = {"id": flow_id, "source_ip": features.source_ip, "dest_ip": features.dest_ip, "dest_port": features.dest_port, "status": "Policy Applied", "app_type": sentry_res.app_type}
            state["classification_log"].insert(0, {"timestamp": "now", "message": f"Sentry classified {flow_id} as {sentry_res.app_type} ({sentry_res.confidence:.2f})"})
            return ClassificationResult(flow_id=flow_id, app_type=sentry_res.app_type, confidence=sentry_res.confidence, explanation=explanation, engine="Sentry")

        vanguard_res = vanguard_query_llm(features)
        vanguard_res.flow_id = flow_id
        investigation = {
            "flow_id": flow_id,
            "features": features.dict(),
            "sentry_prediction": sentry_res.app_type,
            "sentry_confidence": sentry_res.confidence,
            "vanguard_prediction": vanguard_res.app_type,
            "vanguard_confidence": vanguard_res.confidence,
            "vanguard_explanation": vanguard_res.explanation,
            "timestamp": "now",
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
        return ClassificationResult(flow_id=flow_id, app_type=vanguard_res.app_type, confidence=vanguard_res.confidence, explanation=vanguard_res.explanation, engine="Vanguard")

    # If classifier returned a dict-like result
    if isinstance(result, dict):
        app_type = result.get("classification") or result.get("app_type") or "Unknown"
        confidence = float(result.get("confidence", 0.0))
        explanation = result.get("explanation")
        engine = result.get("engine") or "Vanguard"

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
        return ClassificationResult(flow_id=flow_id, app_type=str(app_type), confidence=confidence, explanation=explanation, engine=str(engine))

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


# Server-Sent Events endpoint to stream Vanguard analysis progress
@app.get("/investigations/{flow_id}/vanguard/stream")
async def vanguard_stream(flow_id: str):
    async def event_generator():
        # Try to locate existing investigation features
        features_obj = None
        for inv in state.get("investigations", []):
            if inv.get("flow_id") == flow_id:
                features_obj = inv.get("features")
                break

        # Fallback to active flow data if investigation missing
        if not features_obj:
            af = state.get("active_flows", {}).get(flow_id)
            if af:
                # Create minimal features when we have only flow record
                features_obj = {
                    "source_ip": af.get("source_ip", "0.0.0.0"),
                    "dest_ip": af.get("dest_ip", "0.0.0.0"),
                    "dest_port": int(af.get("dest_port", 0)),
                    "packet_count": 10,
                    "avg_pkt_len": 250.0,
                    "duration_seconds": 1.0,
                    "bytes_total": 1000,
                }

        # Final fallback synthetic features
        if not features_obj:
            features_obj = {
                "source_ip": "0.0.0.0",
                "dest_ip": "0.0.0.0",
                "dest_port": 0,
                "packet_count": 5,
                "avg_pkt_len": 200.0,
                "duration_seconds": 0.5,
                "bytes_total": 500,
            }

        # Emit started event
        yield f"data: {json.dumps({'event': 'started', 'message': 'Starting Vanguard analysis'})}\n\n"
        await asyncio.sleep(0.1)

        # Emit running event
        yield f"data: {json.dumps({'event': 'running', 'message': 'Querying LLM (Vanguard) - this may take a few seconds'})}\n\n"

        # Run the potentially-blocking LLM call in an executor
        loop = asyncio.get_event_loop()
        try:
            features = FlowFeatures(**features_obj)
            vres = await loop.run_in_executor(None, lambda: vanguard_query_llm(features))
            # Save investigation record
            investigation = {
                'flow_id': flow_id,
                'features': features.dict(),
                'sentry_prediction': None,
                'sentry_confidence': None,
                'vanguard_prediction': vres.app_type,
                'vanguard_confidence': vres.confidence,
                'vanguard_explanation': vres.explanation,
                'timestamp': 'now',
            }
            state.setdefault('investigations', []).insert(0, investigation)
            # Emit final result
            yield f"data: {json.dumps({'event': 'result', 'app_type': vres.app_type, 'confidence': vres.confidence, 'explanation': vres.explanation})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get('/admin/llm-health')
async def llm_health():
    """Return simple health info about the LLM runtime and configured model."""
    ollama_path = None
    try:
        # Check if ollama is available
        proc = subprocess.run(['which', 'ollama'], capture_output=True, text=True, timeout=2)
        if proc.returncode == 0:
            ollama_path = proc.stdout.strip()
    except Exception:
        ollama_path = None

    model = os.environ.get('OLLAMA_MODEL', None)
    model_present = False
    try:
        if ollama_path and model:
            proc = subprocess.run(['ollama', 'ls'], capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and model in proc.stdout:
                model_present = True
    except Exception:
        model_present = False

    return {
        'ollama_installed': bool(ollama_path),
        'ollama_path': ollama_path,
        'model_configured': bool(model),
        'model_name': model,
        'model_present': model_present,
    }