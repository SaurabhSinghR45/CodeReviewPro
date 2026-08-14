# ⚡ CodeReviewPro — Autonomous Multi-Agent Code Intelligence Platform

> **Production-grade AI code review, AppSec vulnerability audit, and complexity profiling platform powered by parallel autonomous agents, FastAPI, React 19, and Tailwind CSS.**

---

## 🌟 Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │   CodeReviewPro Studio (React 19 + Monaco)   │
                        │   - 3-Way Theme Engine (Dark / Light / Auto) │
                        │   - Command Palette (Ctrl+K / ⌘K)            │
                        │   - 5-Axis SVG Health Radar Chart            │
                        └──────────────────────┬───────────────────────┘
                                               │ (POST /review)
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │        FastAPI Async Backend Core            │
                        │        (Universal GitHub Repo Inspector)     │
                        └──────────────────────┬───────────────────────┘
                                               │
                                      (asyncio.gather)
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
        ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
        │  🎨 Style & Syntax   │   │   🐛 Logic & Bugs    │   │  🛡️ AppSec Auditor  │
        │  PEP8 / Lint / Naming│   │  Edge Cases & Nulls  │   │  OWASP & CWE Matrix  │
        └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
                    │                          │                          │
                    └──────────────────────────┼──────────────────────────┘
                                               │
                                               ▼
                                   ┌──────────────────────┐
                                   │  ⚡ O(n) Performance │
                                   │  Big-O / Allocations │
                                   └───────────┬──────────┘
                                               │
                                               ▼
                                   ┌──────────────────────┐
                                   │ 📝 Staff Synthesizer │
                                   │ Executive PR Summary │
                                   └───────────┬──────────┘
                                               │
                                               ▼
                                   ┌──────────────────────┐
                                   │ 💾 SQLite Database   │
                                   │ Persistent Audit Log │
                                   └──────────────────────┘
```

---

## 🚀 Key Features

* 🤖 **4-Agent Parallel Architecture**: Concurrent execution of Style, Logic Bug, AppSec (OWASP/CWE), and Algorithmic Performance agents with a Staff Synthesis review.
* ⚡ **Linear & Raycast Inspired UI/UX**: High-density developer workbench with keyboard shortcuts (`Ctrl+K`, `Ctrl+Enter`).
* 🌓 **3-Way Theme Engine**: Seamless switching between **Dark Obsidian**, **Light Studio**, and **System Default** modes.
* 📊 **5-Axis SVG Health Radar**: Visual polygon mapping of Security, Logic, Style, Performance, and Architecture scores.
* 🐙 **Universal GitHub Engine**: Automatic ingestion for root repos, branches, pull requests, and multi-file tree selection.
* 🩹 **Side-by-Side Git Diff Fixes**: Interactive syntax-highlighted before/after fix patches with 1-click clipboard export.
* 💾 **Persistent Audit Log & SaaS Analytics**: SQLite database recording review metrics, vulnerability breakdowns, and health grades.

---

## 🛠️ Tech Stack

* **Backend**: Python 3.13+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2, HTTPX
* **Frontend**: React 19, Vite, Tailwind CSS v4, Monaco Editor, Lucide Icons
* **Database**: SQLite (SQLAlchemy)
* **Testing**: Pytest (100% test pass suite)

---

## ⚙️ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Deployment
```bash
docker-compose up --build
```
Access the application at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

---

## 🧪 Testing Suite
```bash
cd backend
pytest
```
