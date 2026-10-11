# 🔍 Reviewer — Multi-Agent AI Code Review Assistant

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Autonomous multi-agent code analysis engine designed to review pull requests and source code the way human engineering teams do.**

---

## 💡 Overview

When human teams review code, different specialists inspect different dimensions: senior engineers look for architectural style, QA and domain specialists probe for edge-case bugs, and security engineers scan for vulnerabilities.

**Reviewer** replaces the standard single-prompt LLM pattern with a **concurrent multi-agent architecture**. Instead of overwhelming a single prompt with conflicting evaluation criteria, incoming code is analyzed in parallel by three specialized agents (**Style**, **Bugs**, **Security**). A fourth **Summary Agent** then synthesizes all discrete findings into an executive-level, prioritized review report.

---

## 🚀 Key Features

- **⚡ Concurrent Multi-Agent Pipeline:** Dispatches code simultaneously across specialized LLM agents for lower latency and domain-focused precision.
- **🎨 Style & Clean Code Agent:** Flags naming anti-patterns, readability issues, architectural smells, and idiomatic convention violations.
- **🐛 Bug & Edge-Case Agent:** Identifies logical flaws, off-by-one errors, null reference hazards, resource leaks, and unhandled exceptions.
- **🛡️ Security & Vulnerability Agent:** Scans for OWASP Top 10 risks, injection vulnerabilities, unvalidated inputs, insecure deserialization, and exposed credentials.
- **📋 Consensus Summary Agent:** Aggregates findings, deduplicates overlapping issues, calculates severity scores, and delivers actionable recommendations.
- **🔗 Direct GitHub Integration:** Fetch and analyze single file URLs (`blob/...`) or entire Pull Requests (`pull/...`) directly via the GitHub API.
- **📝 Raw Code Input:** Quick-paste editor support for instant ad-hoc code evaluation across multiple languages.
- **📜 Persistent Audit History:** Stores past reviews with structured JSON findings in SQLite/PostgreSQL for tracking code health over time.

---

## 🏛️ System Architecture

```
                             ┌───────────────────────────────┐
                             │   React + Tailwind Frontend   │
                             └──────────────┬────────────────┘
                                            │ HTTP (REST)
                                            ▼
                             ┌───────────────────────────────┐
                             │       FastAPI Gateway         │
                             └──────────────┬────────────────┘
                                            │
                                  [Source Code Dispatcher]
                                  (GitHub API / Raw Code)
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │ (Parallel Execution)  │                       │
                    ▼                       ▼                       ▼
         ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │     Style Agent     │ │      Bug Agent      │ │   Security Agent    │
         │   (PEP/Idiomatic)   │ │  (Logic & Runtime)  │ │   (OWASP & CVEs)    │
         └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                                            ▼
                             ┌───────────────────────────────┐
                             │     Summary / Merge Agent     │
                             │ (Prioritization & Synthesis)  │
                             └──────────────┬────────────────┘
                                            │
                                   ┌────────┴────────┐
                                   ▼                 ▼
                          ┌─────────────────┐ ┌──────────────┐
                          │ SQLite/Postgres │ │ JSON Payload │
                          │ (Persistence)   │ │ to Frontend  │
                          └─────────────────┘ └──────────────┘
```

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+) |
| **AI / Orchestration** | [Google Gemini 2.5](https://ai.google.dev/) via `google-generativeai` |
| **Database & ORM** | [SQLAlchemy](https://www.sqlalchemy.org/) + SQLite (PostgreSQL compatible) |
| **Validation** | [Pydantic v2](https://docs.pydantic.dev/) |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose |
| **Testing** | [pytest](https://docs.pytest.org/) (Comprehensive mocked test suite) |

---

## 📂 Project Structure

```text
├── backend/
│   ├── main.py              # FastAPI app initialization & middleware
│   ├── config.py            # Centralized environment configuration
│   ├── database.py          # SQLAlchemy engine & session factory
│   ├── models.py            # Database models (Review schema)
│   ├── schemas.py           # Pydantic request & response schemas
│   ├── orchestrator.py      # Async agent orchestrator
│   ├── github_fetcher.py    # GitHub API integration (Blob & PR fetcher)
│   ├── agents/
│   │   ├── base_agent.py    # Base LLM interaction layer
│   │   ├── style_agent.py   # Code style & readability reviewer
│   │   ├── bug_agent.py     # Functional bug detector
│   │   ├── security_agent.py# Security & vulnerability auditor
│   │   └── summary_agent.py # Executive report synthesis agent
│   ├── routes/
│   │   └── review.py        # API endpoint definitions
│   ├── tests/               # Automated unit & integration tests
│   ├── Dockerfile           # Backend container definition
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application component
│   │   ├── api.js           # REST API client
│   │   ├── components/      # UI components (Form, Pipeline, Results, History)
│   │   └── index.css        # Tailwind styling & animations
│   ├── Dockerfile           # Frontend container definition
│   └── package.json         # Node.js dependencies & scripts
├── docker-compose.yml       # Multi-service orchestration
└── README.md                # Project documentation
```

---

## ⚙️ Quick Start

### Prerequisites
- **Python:** 3.10+
- **Node.js:** 18+
- **Google Gemini API Key:** [Get an API key here](https://aistudio.google.com/app/apikey)

---

### Option 1: Run with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/code-review-assistant.git
   cd code-review-assistant
   ```

2. **Configure backend environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Add your GEMINI_API_KEY in backend/.env
   cd ..
   ```

3. **Start the containers:**
   ```bash
   docker compose up --build
   ```

- **Frontend:** `http://localhost:5173`
- **Backend API Docs:** `http://localhost:8000/docs`

---

### Option 2: Run Locally (Manual Setup)

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# Start backend server
uvicorn main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` with Swagger docs at `/docs`.

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API Key for agent prompts |
| `GITHUB_TOKEN` | Optional | `""` | GitHub Personal Access Token (for private repos & higher rate limits) |
| `DATABASE_URL` | Optional | `sqlite:///./reviews.db` | SQLAlchemy connection string (SQLite or PostgreSQL) |
| `MODEL_NAME` | Optional | `gemini-2.5-flash` | Gemini model variant to use |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Optional | `http://localhost:8000` | Target URL of the backend API service |

---

## 📡 API Reference

Interactive OpenAPI documentation is automatically available at `http://localhost:8000/docs`.

### Key Endpoints

| Method | Endpoint | Description | Payload Example |
|---|---|---|---|
| `POST` | `/review` | Submit code or GitHub link for review | `{"raw_code": "def foo():...", "language": "python"}` |
| `GET` | `/reviews` | Retrieve recent review history | — |
| `GET` | `/reviews/{id}` | Retrieve detailed findings for a review | — |
| `GET` | `/health` | Health check endpoint | — |

#### Sample Review Request
```bash
curl -X POST "http://localhost:8000/review" \
  -H "Content-Type: application/json" \
  -d '{
    "raw_code": "import os\ndef run_cmd(user_input):\n    os.system(user_input)",
    "language": "python"
  }'
```

---

## 🧪 Testing

The test suite validates agent parsers, route handlers, error cases, and GitHub fetchers using mocked responses. Tests do not require active API keys or external network requests.

```bash
cd backend
pytest -v
```

---

## 🚢 Production Deployment

- **Backend:** Deploy as a Docker container on [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), or [AWS ECS]. Ensure `GEMINI_API_KEY` and a persistent `DATABASE_URL` (e.g., PostgreSQL) are configured in environment variables.
- **Frontend:** Build production assets (`npm run build`) and deploy to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages]. Ensure `VITE_API_URL` points to your deployed backend domain.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
