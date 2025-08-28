#!/usr/bin/env python3
"""
Upload a CSV dataset and a dataset card to Hugging Face (repo_type='dataset').

Usage:
  export HF_TOKEN="<your_token>"
  python scripts/push_dataset_to_hf.py --repo-id Pulast/sentry_training_data --file src/training_data.csv

The script creates the dataset repo if it doesn't exist and uploads the CSV and README.md (dataset card).
"""

import os
import argparse
from huggingface_hub import HfApi, create_repo, upload_file


def main():
    parser = argparse.ArgumentParser(description="Upload dataset to Hugging Face")
    parser.add_argument("--repo-id", required=True, help="Repo id, e.g. Pulast/sentry_training_data")
    parser.add_argument("--file", required=True, help="Path to the dataset file (csv)")
    parser.add_argument("--card", default="dataset_card/README.md", help="Path to dataset card (README.md) to upload")
    parser.add_argument("--private", action="store_true", help="Create the dataset repo as private")
    args = parser.parse_args()

    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    if not token:
        print("Error: set HF_TOKEN environment variable with your Hugging Face access token")
        print("Get a token at https://huggingface.co/settings/tokens")
        return

    api = HfApi()

    # Create repo (if it already exists, exist_ok=True avoids exception)
    print(f"Ensuring dataset repo exists: {args.repo_id}")
    try:
        create_repo(repo_id=args.repo_id, token=token, repo_type="dataset", private=args.private, exist_ok=True)
    except Exception as e:
        print(f"Warning: create_repo returned error (may already exist): {e}")

    # Upload the main dataset file
    if not os.path.exists(args.file):
        print(f"Error: dataset file not found: {args.file}")
        return

    print(f"Uploading dataset file: {args.file} -> {args.repo_id}")
    try:
        upload_file(
            path_or_fileobj=args.file,
            path_in_repo=os.path.basename(args.file),
            repo_id=args.repo_id,
            repo_type="dataset",
            token=token,
        )
        print("Dataset file uploaded.")
    except Exception as e:
        print(f"Error uploading dataset file: {e}")
        return

    # Upload the dataset card if present
    if os.path.exists(args.card):
        print(f"Uploading dataset card: {args.card} -> README.md")
        try:
            upload_file(
                path_or_fileobj=args.card,
                path_in_repo="README.md",
                repo_id=args.repo_id,
                repo_type="dataset",
                token=token,
            )
            print("Dataset card uploaded.")
        except Exception as e:
            print(f"Error uploading dataset card: {e}")
    else:
        print(f"No dataset card found at {args.card}; skipping card upload.")

    print("Done. Check https://huggingface.co/datasets/" + args.repo_id)


if __name__ == "__main__":
    main()
