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
* 🛡️ **Principal Remediation Agent**: Generates 100% complete, compilable, and optimized solutions matching LeetCode standard 4/8/12-space indentation.
* 🔍 **Interactive Source Code Inspector**: Directly editable split-pane code editor with smooth +/- 1% width slider and synchronized line-gutter scrolling.
* 🎨 **Dynamic LCS Diff Engine**: Longest Common Subsequence diff comparison highlighting original mistakes (🔴), corrected logic (🟢), and newly added logic lines (🔵) while keeping common code clean.
* 📝 **DSA Problem Statement & Image Pipeline**: Unified input for LeetCode / GFG problem statements, examples, constraints, and diagram screenshot attachments via upload or `Ctrl+V` clipboard paste.
* 📋 **Dual-Mode Code Export**: Instant 1-click **`Copy Code`** (clean production/interview code without comments) and **`With Comments`** (full docstring explanations).
* 🔐 **Google OAuth & User Data Isolation**: Secure Clerk & Google OAuth login with email-scoped database isolation.
* ⚡ **Linear & Raycast Inspired UI/UX**: High-density developer workbench with keyboard shortcuts (`Ctrl+K`, `Ctrl+Enter`).
* 🌓 **3-Way Theme Engine**: Seamless switching between **Dark Obsidian**, **Light Studio**, and **System Default** modes.
* 📊 **5-Axis SVG Health Radar**: Visual polygon mapping of Security, Logic, Style, Performance, and Architecture scores.
* 🐙 **Universal GitHub Engine**: Automatic ingestion for root repos, branches, pull requests, and multi-file tree selection.
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

---

## 📅 5-Day Development & Release Roadmap

* **Day 1**: `feat(auth): add Google OAuth login and user data isolation`
  - Integrated Clerk & Google OAuth with JWT auth middleware.
  - User-scoped database isolation ensuring private audit histories.
* **Day 2**: `feat(agents): add exact line anchor prompts and DSA problem context pipeline`
  - Exact line-number anchored prompts across Style, Bug, Sec, and Perf agents.
  - Single-field DSA Problem Statement, Examples, and Constraints parser with screenshot support.
* **Day 3**: `feat(ui): add side-by-side code inspector, state persistence and custom width slider`
  - Split-pane code editor with smooth 1% width adjustment and synchronized gutter scrolling.
  - Zero-data-loss state persistence across navigation tabs.
* **Day 4**: `feat(remediation): add 100% compilable remediation agent, LeetCode formatting, and semantic diff view`
  - Autonomous Principal Remediation Agent generating 100% compilable, optimal DSA code.
  - Dynamic LCS Diff Engine with 3-way color-coded line comparison (Red: Errors, Green: Fixes, Blue: Extra Helper Lines).
  - 1-Click clean code copy (`Copy Code` vs `With Comments`).
* **Day 5**: `feat(analytics): add developer productivity metrics, multi-format report exports, and team benchmarking`
  - Automated PR summary Markdown generation with one-click clipboard sync.
  - Multi-format audit exports including formatted PDF/Print layout and raw JSON artifacts.
  - Interactive SaaS developer analytics dashboard with historical code health grading trends and vulnerability distributions.

#   C o d e R e v i e w P r o