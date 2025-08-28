# Running Sentinel-QoS with Docker

Prerequisites:

- Docker and docker-compose installed
- (Optional) Ensure `data/archive/sentry_model.pkl` and `label_encoder.pkl` exist if you want the backend to load the trained model.

Build and run:

```bash
# from repo root
docker compose build --pull
docker compose up -d
```

Access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

Notes:

- The backend image copies model files from `data/archive` into the container; ensure they exist before building.
- For development, mount volumes instead of copying in Dockerfile.
