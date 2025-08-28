# Backend Dockerfile - FastAPI (uvicorn)
FROM python:3.11-slim

# Create app user
RUN useradd -m appuser || true
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY backend/ ./backend
# Copy model artifacts (if present) into working dir
COPY data/archive/sentry_model.pkl ./
COPY data/archive/label_encoder.pkl ./

# Expose port
EXPOSE 8000

USER appuser

CMD ["uvicorn", "backend.orchestrator:app", "--host", "0.0.0.0", "--port", "8000"]
