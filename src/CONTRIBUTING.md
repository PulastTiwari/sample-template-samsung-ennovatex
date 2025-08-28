# Contributing

Thanks for considering contributing to Project Sentinel-QoS.

- Fork the repo and create a feature branch.
- Run linting and tests before submitting a PR.
- Keep changes small and focused. Add tests for new behavior.
- Ensure TypeScript and Python types are correct.
- For UI changes, prefer using the existing `components/ui/*` design system.

Developer setup
- Frontend: `cd sentinel-qos-dashboard && pnpm install && pnpm dev`
- Backend: use a Python virtualenv and `pip install -r requirements.txt`, then `python -m uvicorn orchestrator:app --reload --port 8000`

Issue & PR template: open issues against `main` branch and reference the relevant component paths.
