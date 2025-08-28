---
language: "en"
tags:
  - lightgbm
  - classification
  - network-qos
  - sentinel-qos
license: mit
datasets:
  - Pulast/sentry-training-data
metrics:
  - name: accuracy
    type: accuracy
widget:
  - type: model-card
---

# Sentry QoS Model (LightGBM)

This repository folder contains the Sentry classifier trained for the Sentinel-QoS project.

Model purpose

- Classify per-flow traffic into application categories (e.g., Video Streaming, Audio/Video Call, Browsing, File Download, Gaming) so the network can apply differentiated QoS policies.

Included files (expected)

- `sentry_model.pkl` — joblib payload containing keys: `model`, `label_encoder`, `feature_columns`.
- `label_encoder.pkl` — optional separate label encoder (if saved).
- `LICENSE` — MIT license for this model.
- `README.md` — this model card.

How to use (example)

```python
import joblib

# Load the payload (joblib saved dict)
payload = joblib.load("sentry_model.pkl")
model = payload.get("model")
le = payload.get("label_encoder")
feature_columns = payload.get("feature_columns")

# Example feature dict (match training features)
features = {
    "packet_count": 120,
    "avg_pkt_len": 850.0,
    "duration_seconds": 12.3,
    "bytes_total": 850000,
    "dest_port": 8000,
}

fv = [features.get(c, 0) for c in feature_columns]
pred_idx = model.predict([fv])[0]
if le is not None:
    label = le.inverse_transform([int(pred_idx)])[0]
else:
    label = str(pred_idx)

print("Predicted app type:", label)
```

Training & provenance

- Training script: `train_sentry.py` in repo root. It uses LightGBM and saves a joblib payload (`sentry_model.pkl`) containing the model, label encoder, and feature column list.
- Data: `training_data.csv` (project root) is the canonical CSV used by the trainer.
- Recommended minimum data and evaluation: the project README suggests larger datasets (50k+ samples) for robust results; run `python train_sentry.py --csv training_data.csv --out sentry_model.pkl --plot` to reproduce.

Evaluation

- The training script prints test accuracy and can optionally save a confusion matrix `confusion_matrix.png` with `--plot`.

Limitations & intended use

- Intended for demo/hackathon usage in network QoS classification. Treat predictions as advisory; do not auto-apply critical network policies without human review in production.
- Model depends on the feature set used during training; mismatched features may produce invalid results.

License

- This model is published under the MIT License (see `LICENSE`).

Contact

- See the repository `README.md` for author and project details.
