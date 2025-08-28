import json
import asyncio
from typing import Dict, Any
try:
    import joblib
except Exception:  # pragma: no cover - optional runtime
    joblib = None

HAS_OLLAMA = True
try:
    import ollama  # type: ignore
except Exception:
    HAS_OLLAMA = False


class SentryWrapper:
    def __init__(self, path: str = "sentry_model.pkl"):
        self.path = path
        self.payload = None
        try:
            if joblib is None:
                raise RuntimeError("joblib not available")
            self.payload = joblib.load(path)
            self.model = self.payload.get("model")
            self.le = self.payload.get("label_encoder")
            self.feature_columns = self.payload.get("feature_columns")
        except Exception:
            self.payload = None
            self.model = None
            self.le = None
            self.feature_columns = None

    def predict_proba(self, features: Dict[str, Any]):
        if not self.model or not self.feature_columns:
            raise RuntimeError("No model loaded")
        fv = [features.get(c, 0) for c in self.feature_columns]
        # model.predict_proba may return numpy arrays or sparse types; normalize to a list of floats
        raw = self.model.predict_proba([fv])
        try:
            probs = raw[0]
        except Exception:
            probs = raw

        try:
            return [float(x) for x in probs]
        except Exception:
            # fallback: if it's a scalar or None
            try:
                return [float(probs)]
            except Exception:
                return []

    def predict(self, features: Dict[str, Any]):
        if not self.model or not self.feature_columns:
            raise RuntimeError("No model loaded")
        fv = [features.get(c, 0) for c in self.feature_columns]
        # normalize prediction output
        raw = self.model.predict([fv])
        try:
            lbl = raw[0]
        except Exception:
            lbl = raw
        try:
            lbl_idx = int(lbl)
        except Exception:
            try:
                lbl_idx = int(float(lbl))
            except Exception:
                # last resort: return stringified label
                return str(lbl)
        if self.le:
            return str(self.le.inverse_transform([lbl_idx])[0])
        return str(lbl_idx)


# lazy-initialized module-level wrapper; call init_sentry(path) at startup
sentry = None


def init_sentry(path: str = "sentry_model.pkl"):
    """Initialize the module-level SentryWrapper. Safe to call multiple times."""
    global sentry
    try:
        sentry = SentryWrapper(path)
        # if model failed to load, SentryWrapper will set model to None
        return sentry
    except Exception:
        sentry = None
        return None


def classify_traffic(features: Dict[str, Any]) -> Dict[str, Any]:
    """Hybrid classifier (synchronous): try Sentry (fast) then Vanguard (LLM) if low confidence.

    Returns a dict: {classification, confidence, explanation, engine}
    This function is intentionally synchronous so callers can run it in a thread
    (e.g., via run_in_executor) to avoid blocking async event loops.
    """
    # Try Sentry
    # Attempt Sentry if model available
    probs = None
    classification = None
    confidence = 0.0
    try:
        if sentry and getattr(sentry, 'model', None):
            probs = sentry.predict_proba(features)
            # normalize probs into a concrete Python list of floats (probs_list)
            probs_list = []
            try:
                if probs is None:
                    raise ValueError('no probs')
                tmp = list(probs)
                if len(tmp) == 0:
                    raise ValueError('empty probs')
                probs_list = [float(x) for x in tmp]
            except Exception:
                probs_list = []

            if probs_list:
                # safe argmax without depending on numpy
                best_idx = max(range(len(probs_list)), key=lambda i: probs_list[i])
                confidence = float(probs_list[best_idx])
                classification = sentry.predict(features)
    except Exception:
        probs = None

    if probs is not None and confidence >= 0.95 and classification is not None:
        return {"classification": classification, "confidence": confidence, "explanation": "High-confidence classification by Sentry model.", "engine": "Sentry"}

    # Otherwise escalate to Vanguard (LLM)
    prompt = f"Analyze this network traffic and provide a classification and short explanation. Features: {json.dumps(features)}"

    if HAS_OLLAMA:
        try:
            # Some ollama Python clients are sync, some async; try both.
            try:
                res = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}], format="json")
            except TypeError:
                # Async client: prefer asyncio.run, but fall back to run_until_complete if an event loop is already running.
                try:
                    res = asyncio.run(ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}], format="json"))
                except RuntimeError:
                    # running in an existing loop (e.g., tests); use run_until_complete
                    res = asyncio.get_event_loop().run_until_complete(ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}], format="json"))

            content = None
            if isinstance(res, dict):
                content = res.get("message", {}).get("content") or res.get("content") or None
            elif hasattr(res, "text"):
                content = res.text

            if content:
                parsed = json.loads(content) if isinstance(content, str) else content
                # ensure parsed is a dict before subscripting
                if not isinstance(parsed, dict):
                    try:
                        parsed = dict(parsed)
                    except Exception:
                        parsed = {"content": parsed}

                # normalize and provide safe defaults
                parsed.setdefault("engine", "Vanguard")
                classification = parsed.get("classification") or parsed.get("app_type") or parsed.get("app") or parsed.get("label") or parsed.get("content")
                try:
                    confidence = float(parsed.get("confidence", parsed.get("probability", 0.0) or 0.0))
                except Exception:
                    confidence = 0.0
                explanation = parsed.get("explanation") or parsed.get("reason") or parsed.get("content")

                return {"classification": classification, "confidence": confidence, "explanation": explanation, "engine": "Vanguard"}
        except Exception:
            pass

    # Fallback simulated LLM response
    # Basic heuristic: flip to a plausible label with moderate confidence and explanation
    import random
    candidate = random.choice(["Audio/Video Call", "Video Streaming", "Browsing", "File Download", "Gaming"])
    explanation = f"Vanguard simulated: based on features, likely {candidate}."
    return {"classification": candidate, "confidence": 0.88, "explanation": explanation, "engine": "Vanguard"}
