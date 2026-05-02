# TeamPulse — AI-Powered Team Coordination

> Built for PromptWars Hackathon, Chennai | Powered by Google Cloud

TeamPulse helps human teams coordinate better by turning the noise — meetings, PRs, scattered tasks — into clear, AI-structured action. Stop losing decisions in Slack threads. Stop discovering blockers after the deadline.

---

## What It Does

| Feature | How it works |
|---|---|
| **Meeting → Tasks** | Paste meeting notes or a Slack thread → AI extracts action items and creates structured tasks instantly |
| **Smart Task Creation** | Describe a task in plain English → AI assigns priority, effort estimate, and breaks it into subtasks |
| **AI Code Review** | Paste any code snippet → AI returns a quality score (0-100), security flags, and specific improvement suggestions |
| **Team Health Dashboard** | AI scans your task board and surfaces bottlenecks, overloaded team members, and at-risk deadlines before they become incidents |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                │
│              Dashboard / Tasks / Meetings / Reviews      │
│                    Cloud Run (HTTPS)                     │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│               Backend (Fastify + TypeScript)             │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Task Parser  │  │  Meeting     │  │  Code Review  │  │
│  │    Agent     │  │  Summarizer  │  │    Agent      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                 │                  │           │
│  ┌──────▼─────────────────▼──────────────────▼────────┐  │
│  │            Vertex AI — Gemini 1.5 Pro              │  │
│  │         (JSON mode for structured output)          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │  Bottleneck  │  │         Firestore DB             │  │
│  │   Detector   │  │  tasks / meetings / reviews      │  │
│  │    Agent     │  └──────────────────────────────────┘  │
│  └──────────────┘                                        │
│                    Cloud Run (HTTPS)                     │
└─────────────────────────────────────────────────────────┘
```

### Google Cloud Services
- **Cloud Run** — Backend + frontend containerized services
- **Vertex AI (Gemini 1.5 Pro)** — All 4 AI agents with JSON-mode structured output
- **Firestore** — Tasks, meetings, code reviews (real-time capable)
- **Cloud Build** — CI/CD pipeline — auto-deploys on push to `main`
- **Artifact Registry** — Docker image storage

---

## AI Agents

| Agent | Input | Output |
|---|---|---|
| **Task Parser** | Plain English description | Structured task: priority, effort, tags, subtasks |
| **Meeting Summarizer** | Raw meeting notes / chat | Action items with owners → auto-creates tasks |
| **Code Reviewer** | Code snippet or diff | Quality score, issue list, security flags |
| **Bottleneck Detector** | Team board snapshot | Risks, overloaded members, recommendations |

All agents use `responseMimeType: "application/json"` with a `responseSchema` — no regex parsing, no hallucinated formats.

---

## Quick Start

### Prerequisites
- Node.js 20+, pnpm
- Google Cloud project with billing enabled
- Firestore initialized (native mode, `us-central1`)
- Vertex AI API enabled

### Enable APIs
```bash
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

### Create Artifact Registry repo
```bash
gcloud artifacts repositories create teampulse \
  --repository-format=docker \
  --location=us-central1
```

### Local development
```bash
cp .env.example .env
# Fill in your GCP_PROJECT_ID

cd backend && pnpm install && pnpm dev
cd frontend && pnpm install && pnpm dev
```

### Deploy to Cloud Run (via Cloud Build)
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_BACKEND_URL=https://your-backend-url
```

### Seed demo data
```bash
cd backend && npx tsx ../scripts/seed.ts
```

---

## API Reference

### Tasks
```
POST   /api/tasks              Create task from plain text (AI-structured)
GET    /api/tasks?teamId=      List all tasks
GET    /api/tasks/:id          Get single task
PATCH  /api/tasks/:id          Update task status/assignee
```

### Meetings
```
POST   /api/meetings/parse     Parse meeting notes → extract tasks
```

### Code Reviews
```
POST   /api/reviews            Direct code review (paste snippet)
POST   /api/reviews/webhook    GitHub webhook receiver (HMAC verified)
GET    /api/reviews?teamId=    List recent reviews
```

### Insights
```
GET    /api/insights/team?teamId=    AI team health + bottleneck report
```

---

## Team

Built at PromptWars Hackathon, Chennai — May 2026
