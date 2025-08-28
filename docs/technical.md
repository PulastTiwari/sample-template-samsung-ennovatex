# Technical Documentation

This document provides technical details for the Sentinel-QoS project, prepared for the Samsung EnnovateX submission.

## 1. Approach & Novelty

- Problem: Classify per-UE network flows into application categories (Video streaming, Audio/Video calls, Gaming, Uploads, Browsing, Texting, etc.) to enable differentiated QoS.
- Approach: Two-stage inference pipeline:
  - Sentry: a lightweight LightGBM classifier for low-latency per-flow predictions.
  - Vanguard: an LLM-based fallback for ambiguous/low-confidence flows that requires interpretability and richer reasoning.
- Novelty: Combines a fast, deployable ML model with an explainable fallback that provides human-readable rationales; integrates with network control hooks for policy enforcement.

## 2. Technical Stack

- Frontend: Next.js (app-router), TypeScript, Tailwind CSS — `frontend/`
- Backend: FastAPI (uvicorn) — `backend/`
- Model training: Python, scikit-learn / LightGBM — `train_sentry.py` (repo root)
- Model artifact format: joblib payload `sentry_model.pkl` (contains `model`, `label_encoder`, `feature_columns`)
- Dev & Deployment: Docker, docker-compose (dev), Vercel (frontend production)

## 3. Architecture

- Client (Browser) ↔ Frontend (Next.js) ↔ Backend (FastAPI)
- Backend loads Sentry model from `data/archive/sentry_model.pkl` and serves `/classify`.
- Low-confidence results get forwarded to Vanguard (LLM) via `vanguard_query_llm` for explanation and final label.

See `docs/architecture.mmd` for a mermaid component diagram (if present).

## 4. How to run locally

Prereqs: Python 3.11+, pnpm, Docker (optional)

1. Backend (venv):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.orchestrator:app --reload --host 0.0.0.0 --port 8000
```

2. Frontend (dev):

```bash
cd frontend
pnpm install
pnpm dev
```

3. Or run both with docker-compose (dev):

```bash
docker compose -f docker-compose.dev.yml up --build
```

## 5. Key files & their purpose

- `backend/orchestrator.py` — FastAPI app, endpoints: `/classify`, `/status`, `/admin/*`, and orchestration functions (`sentry_predict`, `vanguard_query_llm`).
- `frontend/lib/api.ts` — Frontend API wrapper that uses `NEXT_PUBLIC_API_URL`.
- `train_sentry.py` — Training script that produces `sentry_model.pkl`.
- `data/archive/sentry_model.pkl` — Trained model artifact used by backend.
- `models/publish_to_hf.sh` and `models/sentry_model_publish/` — helper and metadata for publishing the model to Hugging Face.

## 6. Models & Datasets

- Sentry model: `models/sentry_model_publish/README.md` contains the model card and usage instructions. The model is published under MIT.
- Training dataset (in workspace): `training_data.csv` — consider publishing to Hugging Face and link here if required.

## 7. Evaluation

- Training script prints accuracy and can produce `confusion_matrix.png` for analysis.
- For demo, we include a sample dataset and the saved model evaluated on a hold-out test split.

## 8. Limitations & Next steps

- Current storage: models in repo; recommend moving to S3/Hugging Face model hub.
- For production: add persistent DB (Postgres) for investigations, Redis queue for async Vanguard jobs, authentication for admin endpoints, and rate limiting.

## 9. Contact

- For questions about this submission, contact: <Team leader email>
