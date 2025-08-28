### **Important Instructions**:

- Click on _"Use this template"_ button and _"Create a new repository"_ in your github account for submission.
  <img width="1262" height="93" alt="Screenshot 2025-08-15 at 5 59 49 AM" src="https://github.com/user-attachments/assets/b72d5afd-ba07-4da1-ac05-a373b3168b6a" />

- Add one of the following open source licenses - [MIT](https://opensource.org/licenses/MIT), [Apache 2.0](https://opensource.org/licenses/Apache-2.0) or [BSD 3-Clause](https://opensource.org/licenses/BSD-3-Clause) to your submission repository.
- Once your repository is ready for **evaluation** send an email to ennovatex.io@samsung.com with the subject - "AI Challenge Submission - Team name" and the body of the email must contain only the Team Name, Team Leader Name & your GitHub project repository link.
- All submission project materials outlined below must be added to the github repository and nothing should be attached in the submission email.
- In case of any query, please feel free to reach out to us at ennovatex.io@samsung.com

#### Evaluation Criteria

| Project Aspect                           | %   |
| ---------------------------------------- | --- |
| Novelty of Approach                      | 25% |
| Technical implementation & Documentation | 25% |
| UI/UX Design or User Interaction Design  | 15% |
| Ethical Considerations & Scalability     | 10% |
| Demo Video (10 mins max)                 | 25% |

**-------------------------- Your Project README.md should start from here -----------------------------**

# Samsung EnnovateX 2025 AI Challenge Submission - Project: Sentinel-QoS

### Problem Statement

- Classify User Application Traffic at the Network in a Multi-UE Connected Scenario

### Team name

- Palt

### Team members (Names)

- Pulast S Tiwari
- Sarthak Vats
- Yash Kumar

### Demo Video Link

- [Demo Video - Sentinel QoS Network Traffic Classification](https://www.youtube.com/watch?v=YOUR_VIDEO_ID) _(To be updated)_

---

## System Overview

**Sentinel-QoS** is an advanced network traffic classification system that combines machine learning and large language models to provide real-time quality of service monitoring and intelligent traffic analysis in multi-user environments.

### Key Features

- 🎯 **Hybrid AI Classification**: LightGBM (Sentry) + LLM (Vanguard) fallback system
- 📊 **Real-time Monitoring**: Live traffic analysis with interactive dashboard
- 🔍 **Intelligent Investigation**: AI-powered root cause analysis and suggestions
- 🎮 **Interactive Simulation**: What-if scenarios for network planning
- 🛡️ **Enterprise Ready**: Docker deployment with health monitoring
- 🌐 **Modern UI**: Responsive Next.js dashboard with dark/light themes

---

## Project Artefacts

- **Technical Documentation** - [`docs/`](docs/) - Comprehensive technical documentation including system architecture, API documentation, and deployment guides
- **Source Code** - [`src/`](src/) - Complete source code with organized backend and frontend components
  - **Backend API** - [`src/backend/`](src/backend/) - FastAPI server with ML model integration
  - **Frontend Dashboard** - [`src/frontend/`](src/frontend/) - Next.js React application with real-time monitoring
- **Machine Learning Models** - [Hugging Face Model Repository](https://huggingface.co/Pulast/sentry-qos-sentry-model)
- **Published Models** - [Sentry Model on Hugging Face](https://huggingface.co/Pulast/sentry-qos-sentry-model)
- **Training Data** - [`training_data.csv`](training_data.csv) - Synthetic network traffic dataset for model training
- **Training Data** - [Pulast/sentry_training_data](https://huggingface.co/datasets/Pulast/sentry_training_data) - Synthetic network traffic dataset (published on Hugging Face)
- **Model Artifacts** - [`models/`](models/) - Trained model files and publishing scripts
- **Deployment Configuration** - Docker Compose files, Vercel configuration, and CI/CD workflows

---

## Quick start (local)

### Prerequisites

- Python 3.8+
- Node.js 18+
- pnpm (recommended) or npm

### Backend (FastAPI)

1. Navigate to backend directory and set up environment:

```bash
cd src/backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Start the FastAPI backend:

```bash
python -m uvicorn orchestrator:app --reload --port 8000
```

### Frontend (Next.js)

1. Navigate to frontend directory and install dependencies:

```bash
cd src/frontend
pnpm install  # or npm install
```

2. Start the development server:

```bash
pnpm dev  # or npm run dev
```

3. Open http://localhost:3000 in your browser

### Docker Deployment (Recommended)

For easy deployment, use Docker Compose:

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build
```

### Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:

- `NEXT_PUBLIC_API_URL` — Backend API URL (default: http://localhost:8000)
- `ADMIN_USERNAME` — Admin dashboard username
- `ADMIN_PASSWORD` — Admin dashboard password
- `LLM_MODEL` — Ollama model for LLM classification
- `LLM_BASE_URL` — Ollama server URL

### Downloading the dataset programmatically

You can load the published dataset directly from Hugging Face in a few ways.

Using the Hugging Face `datasets` library (recommended):

```python
from datasets import load_dataset

# load the dataset as a DatasetDict and convert to pandas
ds = load_dataset("Pulast/sentry_training_data")
df = ds["train"].to_pandas()
```

Or download the raw CSV (useful for scripts):

```python
import requests

url = "https://huggingface.co/datasets/Pulast/sentry_training_data/resolve/main/training_data.csv"
resp = requests.get(url)
resp.raise_for_status()
open("training_data.csv", "wb").write(resp.content)
```

## Architecture & Technology Stack

### Backend

- **FastAPI** - High-performance async API framework
- **LightGBM** - Primary traffic classification model (Sentry)
- **Ollama + Gemma** - LLM fallback system (Vanguard) for complex cases
- **Scikit-learn** - Data preprocessing and model pipeline
- **Pandas** - Data manipulation and analysis

### Frontend

- **Next.js 14** - React framework with app router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first styling
- **Shadcn/ui** - Beautiful and accessible UI components
- **Chart.js** - Interactive data visualization

### Deployment

- **Docker & Docker Compose** - Containerized deployment
- **Vercel** - Frontend hosting with CI/CD
- **GitHub Actions** - Automated testing and deployment

Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) for community expectations.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Submission Notes

This project demonstrates a novel hybrid AI approach to network traffic classification, combining the speed and efficiency of traditional ML models with the reasoning capabilities of large language models. The system is designed for real-world deployment with comprehensive monitoring, intuitive UI/UX, and ethical AI considerations including model transparency and fair resource allocation.

## Contact

- **Team Palt**
- **Team Leader**: Pulast S Tiwari
- **Members**: Sarthak Vats, Yash Kumar
- **Repository**: [github.com/PulastTiwari/sample-template-samsung-ennovatex](https://github.com/PulastTiwari/sample-template-samsung-ennovatex)
