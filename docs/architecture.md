# Sentinel-QoS: System Architecture

This document outlines the production-grade architecture for the Sentinel-QoS system, covering inference patterns, model lifecycle, storage, security, observability, and scalability.

## Async / Fallback Patterns

The system is designed with a hybrid inference model to balance latency and accuracy.

- **Primary Path**: A synchronous, low-latency "fast path" using the **Sentry** model for immediate predictions.
- **Fallback Path A (Sync LLM)**: A simpler fallback where the API calls a small LLM or a managed Hugging Face endpoint synchronously. This approach is easier to implement but carries a risk of high latency impacting the client.
- **Fallback Path B (Async - *Recommended*)**: For large models or rate-limited APIs, the recommended pattern is to enqueue the request to an **SQS** queue. A dedicated LLM worker (running as a Kubernetes Job or AWS Fargate task) processes the queue, stores the result, and notifies the system.
- **LLM Failure Mitigation**: If the LLM call fails, the system will:
    - Return the original Sentry model result with a note like `explanation: "LLM unavailable"`.
    - Log an incident for monitoring.
    - Optionally, attempt a classification using a small, local heuristic or a pre-defined canned suggestion.

![pipeline architecture](https://github.com/user-attachments/assets/8b1444bb-ee76-4c38-ac8e-44e59bbdbbe0)

## Model Artifact Lifecycle

A robust lifecycle for ML models ensures reproducibility and safe deployments.

- **Storage**: All model artifacts are versioned and stored in **Amazon S3** (e.g., `s3://sentinel-qos/models/{sentry,vanguard}/v1.2/`).
- **CI/CD Pipeline**:
    1. After a model is trained, a CI/CD job pushes the artifact to S3.
    2. The model's metadata (version, path, performance metrics) is updated in a database.
- **Deployment Strategy**:
    - **Pull on Start**: A Kubernetes `initContainer` pulls the artifact from S3 at pod startup and places it onto a shared volume like **EFS**.
    - **Baked into Image**: For small and immutable models, the artifact can be included directly in the Docker image during the build process.
- **Hot-Swapping Models**: A `POST /admin/upload-model` endpoint allows for live model updates. The backend uploads the new artifact to S3 and triggers a rolling restart of the application pods or calls a dynamic reload endpoint to have the running service execute `joblib.load()` on the new model without a restart.

![WhatsApp Image 2025-08-30 at 00 41 36](https://github.com/user-attachments/assets/f1099ebf-d3e0-474d-8ad4-18deade8606e)

## Storage & State

The architecture is designed for stateless application pods with persistent external storage.

- **Ephemeral Pods**: Application pods are stateless. Model artifacts are mounted persistently via:
    - **EFS**: Shared across all pods for immediate access.
    - **Local FS**: Downloaded from S3 on startup for isolated copies.
- **Metadata Database**:
    - **RDS (Postgres)**: For structured data like suggestions, investigation logs, and model metadata.
    - **DynamoDB**: An alternative for high-scale, low-latency requirements.
- **Caching & Session Management**:
    - **Redis (ElastiCache)**: Used for caching classification results, rate limiting, and managing session state.
    - 
![WhatsApp Image 2025-08-30 at 00 41 35](https://github.com/user-attachments/assets/479bf57d-43ac-47de-a326-debed4c4a743)

## Security & Secrets

Security is implemented at every layer of the stack.

- **Network Isolation**: All components reside in private **VPC subnets**. The Application Load Balancer (ALB) is placed in a public subnet and enforces **HTTPS-only** traffic.
- **IAM Roles**: We use **IAM Roles for Service Accounts (IRSA)** to grant pods granular, key-less access to AWS resources like S3 and ECR.
- **Secrets Management**: Credentials like `HF_API_TOKEN` and database passwords are stored in **AWS Secrets Manager** and securely mounted into pods as environment variables or projected secrets.
- **API Authentication**:
    - Optional **JWT** or **API key** authentication for external API consumers.
    - Admin endpoints are secured with basic auth or a dedicated admin token.
- **Security Groups**: Network traffic is tightly controlled. Security groups are configured to only allow traffic from the ALB to the cluster and from the cluster to S3 via VPC endpoints.

![WhatsApp Image 2025-08-30 at 00 41 35 (1)](https://github.com/user-attachments/assets/b0fde4ae-24f2-47fd-b885-b225cdb01438)

## Observability, Health & Automation

A comprehensive observability stack ensures system health and provides operational insights.

- **Health Probes**: Liveness (`/health`) and readiness (`/status`) probes are configured for all pods.
- **Tracing**: **OpenTelemetry** with **AWS X-Ray** is used for end-to-end request tracing (frontend → API → LLM).
- **Metrics**: **Prometheus** scrapes application metrics (e.g., request counts, latency). **CloudWatch** or **Grafana** is used for alerting on error rates, latency spikes, and SQS queue depth.
- **Logging**: Application logs are written to `stdout` and collected by a **CloudWatch** agent or an **EFK** (Elasticsearch, Fluentd, Kibana) stack.
- **CI/CD**: **GitHub Actions** automates the workflow:
    1. Build the application's Docker image.
    2. Push the image to **ECR**.
    3. Update the Kubernetes deployment via **Helm** or **ArgoCD**.
- **Backups**: **RDS snapshots** and **S3 versioning** provide robust backups for the database and model artifacts.

![WhatsApp Image 2025-08-30 at 00 41 36 (1)](https://github.com/user-attachments/assets/3d2902ad-9569-4815-b7c8-73afcc6563f8)

## Autoscaling & Cost Controls

The system is designed to scale efficiently and manage costs.

- **EKS Autoscaling**:
    - **Horizontal Pod Autoscaler (HPA)** scales the API service based on CPU utilization or requests per second.
    - **Karpenter** provides rapid node autoscaling for the EKS cluster.
- **LLM Workers**:
    - For heavy models, a dedicated node group of **GPU instances** can be used, with scaling based on the SQS queue depth.
    - **AWS Fargate** is an option for serverless execution.
- **Cost Optimization**:
    - **Spot instances** are used for non-critical workloads like batch training jobs.
    - **On-demand** or **GPU instances** are reserved for real-time inference.
  
![WhatsApp Image 2025-08-30 at 00 41 36 (3)](https://github.com/user-attachments/assets/f4533e0f-2c73-4cc6-9a2b-55e262a03f13)

## API Contract

| Method | Endpoint                             | Description                                            |
| :----- | :----------------------------------- | :----------------------------------------------------- |
| `GET`  | `/status`                            | Returns the live health and metrics of the system.     |
| `POST` | `/classify`                          | Classifies a flow. Body contains `FlowFeatures` JSON.  |
| `POST` | `/simulate`                          | Triggers a background traffic simulation.              |
| `POST` | `/investigations/{id}/vanguard`      | Forces a detailed LLM analysis for a specific flow.    |
| `POST` | `/admin/upload-model`                | Multipart upload for a new Sentry model artifact.      |

![WhatsApp Image 2025-08-30 at 00 41 36 (2)](https://github.com/user-attachments/assets/d3d7d42d-7517-4dbf-8b78-7d34013381c5)

## Failure Modes & Mitigations

- **LLM Unavailable**: Fall back to the Sentry prediction and serve a lower-quality explanation.
- **Model Load Error**: Continue serving the previously loaded model version and trigger an alert for operators.
- **High LLM Latency**: Automatically switch to the asynchronous SQS queue path and return a `202 Accepted` response.
- **S3 Access Failure**: Use a cached model version stored on EFS or the local pod file system.
  
![WhatsApp Image 2025-08-30 at 00 41 37](https://github.com/user-attachments/assets/13d1204e-bcfd-4cc9-bea8-6897ea45aeb3)
