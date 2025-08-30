## Deployment Guide (short)

This document explains how to deploy the Sentinel-QoS project: host the backend (FastAPI) and deploy the frontend to Vercel.

1. Frontend (Vercel)

- The frontend app lives in `src/frontend`. Vercel should build from that folder.
- We previously configured the build to run in `src/frontend` (pnpm lockfile exists there). Ensure your Vercel Project Settings do not override commands. Recommended project-level settings if prompted:

  - Framework Preset: Next.js
  - Build & Output Settings:
    - Install Command: `pnpm --prefix src/frontend install`
    - Build Command: `pnpm --prefix src/frontend build`
    - Output Directory: leave default for Next.js

- Set required environment variables in Vercel (Project > Settings > Environment Variables). Important env vars for this project:
  - `NEXT_PUBLIC_API_URL` — URL of the hosted backend (e.g. `https://my-backend.example.com`)
  - Any other frontend runtime keys (check `src/frontend/.env` or code for additional names)

2. Backend (FastAPI) — recommended approaches

Option A — Deploy as container (recommended for production)

- Build and push a Docker image to a container registry (Docker Hub, GHCR, or a cloud registry).
- Use a host that supports containers: Render, Fly.io, Railway, AWS ECS/Fargate, or a VM with Docker Compose.

Example quick flow (Render / Fly / Railway have similar steps):

- Build and push image locally:

  ```bash
  docker build -t your-repo/sentinel-qos:latest -f src/backend/Dockerfile .
  docker push your-repo/sentinel-qos:latest
  ```

- Configure the service in the host of choice to pull the image and expose port `8000`.
- Set environment variables in the host (see below). You can use the same values as in `.env.example`.

Option B — Deploy with Docker Compose (dev / self-hosted)

- Run locally or on a VM:
  ```bash
  docker-compose up --build
  ```

Option C — Deploy as serverless/app service (quick dev)

- Use Railway/Render/Heroku to deploy the Python app from the repo. Ensure startup command runs Uvicorn: `uvicorn orchestrator:app --host 0.0.0.0 --port 8000`.

3. Required environment variables (examples — use secrets in production)

- `ADMIN_USERNAME` — username for admin UI
- `ADMIN_PASSWORD` — secure password
- `LLM_MODEL` — name of local LLM model (if used)
- `LLM_BASE_URL` — URL to your LLM runtime (Ollama/Gemma)
- `SENTRY_MODEL_PATH` — path or URL to `sentry_model.pkl` if not bundled

4. Set `NEXT_PUBLIC_API_URL` in Vercel to the backend's public URL after the backend is running.

5. Verify the deployment

- Frontend: visit the Vercel URL and confirm the dashboard loads and API calls succeed (open browser devtools network tab).
- Backend: check `GET /health` or `GET /status` endpoints (e.g., `curl https://<backend>/health`).

6. Troubleshooting tips

- If Vercel build fails with pnpm frozen-lockfile: make sure Vercel runs pnpm install in `src/frontend` (we previously set install/build commands in root config). If you removed root vercel.json, set the same commands in the Vercel UI.
- If frontend can't reach backend, verify `NEXT_PUBLIC_API_URL` is correct and CORS allowed on backend.

7. Security

- Do not commit secrets to the repo. Use Vercel env variables or your host's secret store.

If you'd like, I can also add a small GitHub Actions workflow that builds the frontend and runs basic smoke tests before Vercel deploy.
