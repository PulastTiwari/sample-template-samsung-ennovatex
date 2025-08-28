#!/usr/bin/env bash
# Helper script to upload dataset to Hugging Face using the Python helper script.
# Usage: HF_TOKEN=<token> ./scripts/push_dataset.sh Pulast/sentry_training_data

set -euo pipefail
REPO_ID=${1:-}
if [ -z "$REPO_ID" ]; then
  echo "Usage: $0 <repo-id> [--private]"
  exit 1
fi
PRIVATE_FLAG=${2:-}

# Ensure HF_TOKEN is set
if [ -z "${HF_TOKEN:-}" ]; then
  echo "Please export HF_TOKEN with your Hugging Face token (https://huggingface.co/settings/tokens)"
  exit 1
fi

python3 scripts/push_dataset_to_hf.py --repo-id "$REPO_ID" --file src/training_data.csv --card dataset_card/README.md ${PRIVATE_FLAG}
