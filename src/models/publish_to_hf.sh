#!/usr/bin/env bash
set -euo pipefail

# publish_to_hf.sh - helper to push the Sentry model payload to Hugging Face Hub
# Usage:
#   export HF_USER=your-hf-username
#   ./models/publish_to_hf.sh

HF_USER=${HF_USER:-"YOUR_HF_USERNAME"}
REPO_NAME="${HF_USER}/sentry-qos-sentry-model"
LOCAL_DIR="./hf_${HF_USER}_sentry_model"

# Paths relative to repository root (script lives in repo root under /models)
SRC_MODEL_PATH="./data/archive/sentry_model.pkl"
SRC_ENCODER_PATH="./data/archive/label_encoder.pkl"

if [ "${HF_USER}" = "YOUR_HF_USERNAME" ]; then
  echo "Set HF_USER environment variable to your Hugging Face username, e.g.:"
  echo "  export HF_USER=yourusername"
  exit 1
fi

# Preflight: check prerequisites
if ! command -v git &>/dev/null; then
  echo "git not found. Install git first." >&2
  exit 1
fi
if ! command -v git-lfs &>/dev/null; then
  echo "git-lfs not found. Install git-lfs (brew install git-lfs) and run 'git lfs install'." >&2
  exit 1
fi
if ! command -v huggingface-cli &>/dev/null; then
  echo "huggingface-cli not found. Install via 'pip install huggingface-hub'." >&2
  exit 1
fi

# Ensure model files exist
if [ ! -f "${SRC_MODEL_PATH}" ]; then
  echo "Model file not found at ${SRC_MODEL_PATH}. Run training or copy the model there first." >&2
  exit 1
fi

# Login (interactive)
echo "Ensure you are logged into the Hugging Face CLI (run: huggingface-cli login)"

# Create repo (idempotent)
huggingface-cli repo create "${REPO_NAME}" --type model --private false || true

# Clone remote repo
rm -rf "${LOCAL_DIR}"
git clone "https://huggingface.co/${REPO_NAME}" "${LOCAL_DIR}"

# Copy artifacts and metadata
cp "${SRC_MODEL_PATH}" "${LOCAL_DIR}/sentry_model.pkl"
if [ -f "${SRC_ENCODER_PATH}" ]; then
  cp "${SRC_ENCODER_PATH}" "${LOCAL_DIR}/label_encoder.pkl"
fi
cp "./models/sentry_model_publish/README.md" "${LOCAL_DIR}/README.md"
cp "./models/sentry_model_publish/LICENSE" "${LOCAL_DIR}/LICENSE"

cd "${LOCAL_DIR}"

# Track model binary with git-lfs
git lfs track "*.pkl" || true
# Ensure .gitattributes is added
git add .gitattributes || true

git add --all
if git diff --staged --quiet; then
  echo "No changes to commit. The model repo is up to date."
else
  git commit -m "Add Sentry model and metadata"
  git push
fi

echo "Published to https://huggingface.co/${REPO_NAME}"
