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

- [YouTube link — public or unlisted]

---

## Project Artefacts

- **Technical Documentation** - `docs/` (All technical details must live inside the `docs` folder in markdown files.)
- **Source Code** - `src/` (All source code required to run the project should be present in the `src` folder. This repository also contains a `backend/` and `sentinel-qos-dashboard/` frontend.)
- **Models Used** - https://huggingface.co/Pulast/sentry-qos-sentry-model
- **Models Published** - https://huggingface.co/Pulast/sentry-qos-sentry-model
- **Datasets Used** - [Links to any datasets used; ensure license compatibility]
- **Datasets Published** - [Links to any datasets you publish to Hugging Face]

---

## Quick start (local)

Backend (FastAPI):

1. Create and activate a Python virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.orchestrator:app --reload --port 8000
```

1. Start the Python backend

```bash
# Create a virtual env and activate it
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # ensure fastapi, uvicorn, etc.
python -m uvicorn orchestrator:app --reload --port 8000
```

2. Start the frontend

```bash
cd sentinel-qos-dashboard
pnpm install
pnpm dev
# or npm/yarn equivalent
```

3. Open http://localhost:3000

Environment variables

- `NEXT_PUBLIC_API_URL` (optional) — override backend URL (defaults to http://localhost:8000)

Contributing
Please read `CONTRIBUTING.md` for contribution guidelines and `CODE_OF_CONDUCT.md` for community expectations.

---

## Submission Notes

- [Any additional notes for the reviewers, if necessary]

## Contact

- **Team Palt**
- [Email addresses or other contact information for team members]
