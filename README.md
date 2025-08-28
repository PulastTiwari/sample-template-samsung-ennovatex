# Project Sentinel-QoS

## Samsung EnnovateX 2025 AI Challenge Submission - Project: Sentinel-QoS

### Problem Statement

- [Classify User Application Traffic at the Network in a Multi-UE Connected Scenario
  Applications are affected differently under varying traffic conditions, channel states, and coverage scenarios. If the traffic of each UE can be categorized into broader categories, such as Video Streaming, Audio Calls, Video Calls, Gaming, Video Uploads, browsing, texting etc. that can enable the Network to serve a differentiated and curated QoS for each type of traffic. Develop an AI model to analyze a traffic pattern and predict the application category with high accuracy.]

### Team name

- [Palt]

### Team members (Names)

- Member 1: [Pulast S Tiwari]
- Member 2: [Sarthak Vats]
- Member 3: [Yash Kumar]

### Demo Video Link

- [YouTube link — public or unlisted]

---

## Project Artefacts

- **Technical Documentation** - `docs/` (All technical details must live inside the `docs` folder in markdown files.)
- **Source Code** - `src/` (All source code required to run the project should be present in the `src` folder. This repository also contains a `backend/` and `sentinel-qos-dashboard/` frontend.)
- **Models Used** - https://huggingface.co/Pulast/sentry-qos-sentry-model
- **Models Published** - https://huggingface.co/Pulast/sentry-qos-sentry-model
- **Datasets Used** - [Links to any datasets used; ensure license compatibility]
- **Datasets Published** - [Links to any datasets you publish to Hugging Face]

---

## Quick start (local)

Backend (FastAPI):

1. Create and activate a Python virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.orchestrator:app --reload --port 8000
```

1. Start the Python backend

```bash
# Create a virtual env and activate it
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # ensure fastapi, uvicorn, etc.
python -m uvicorn orchestrator:app --reload --port 8000
```

2. Start the frontend

```bash
cd sentinel-qos-dashboard
pnpm install
pnpm dev
# or npm/yarn equivalent
```

3. Open http://localhost:3000

Environment variables

- `NEXT_PUBLIC_API_URL` (optional) — override backend URL (defaults to http://localhost:8000)

Contributing
Please read `CONTRIBUTING.md` for contribution guidelines and `CODE_OF_CONDUCT.md` for community expectations.

---

## Submission Notes

- [Any additional notes for the reviewers, if necessary]

## Contact

- **Team Palt**
- [Email addresses or other contact information for team members]
