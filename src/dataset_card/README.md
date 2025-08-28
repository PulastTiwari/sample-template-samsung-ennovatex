# Sentinel QoS Training Dataset

This dataset contains synthetic network traffic features used to train the Sentry LightGBM classifier in the Sentinel-QoS project.

Files

- `training_data.csv` — Tabular CSV with per-flow/session features and a target label.

Published dataset

- Hugging Face: https://huggingface.co/datasets/Pulast/sentry_training_data

Columns (example)

- `src_ip`, `dst_ip`, `src_port`, `dst_port`
- `protocol` — e.g., TCP/UDP
- `bytes`, `packets`, `duration`
- `app_label` — human-readable application class (e.g., Video, Gaming, Browsing)
- `target` — numeric label used for model training

---
title: "Sentinel QoS Training Dataset"
tags:
	- network
	- qos
	- synthetic
license: mit
---

# Sentinel QoS Training Dataset

This dataset contains synthetic network traffic features used to train the Sentry LightGBM classifier in the Sentinel-QoS project.

Files

- `training_data.csv` — Tabular CSV with per-flow/session features and a target label.

Published dataset

- Hugging Face: https://huggingface.co/datasets/Pulast/sentry_training_data

Columns (example)

- `src_ip`, `dst_ip`, `src_port`, `dst_port`
- `protocol` — e.g., TCP/UDP
- `bytes`, `packets`, `duration`
- `app_label` — human-readable application class (e.g., Video, Gaming, Browsing)
- `target` — numeric label used for model training

Usage

- Load this CSV into pandas and follow the preprocessing pipeline in `src/backend` to reproduce training.

License

- This dataset is synthetic and is released under the MIT license (see project LICENSE).
