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
| **Sign in with Google** | Firebase Authentication gates every API call. Backend verifies Firebase ID tokens via `firebase-admin` over Application Default Credentials |

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
- Node.js 20+, npm
- Google Cloud project with billing enabled
- Firestore initialized (native mode, `us-central1`)
- Vertex AI API enabled
- Firebase enabled on the GCP project + Google sign-in provider enabled (see [docs/DOCUMENTATION.md → Authentication](docs/DOCUMENTATION.md#authentication))

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
# .env: GCP_PROJECT_ID, FIRESTORE_DATABASE=teampulse, PORT=3001

# Frontend env — fill in Firebase Web config from the Console
cp .env.example frontend/.env.local
# .env.local: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_APP_ID, etc.

gcloud auth application-default login   # one-time

cd backend && npm install && npm run dev    # :3001
cd frontend && npm install && npm run dev   # :3000
```

Open http://localhost:3000, sign in with Google, and the dashboard loads with insights.

### Deploy to Cloud Run (via Cloud Build)
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_BACKEND_URL=https://your-backend-url,_FIREBASE_API_KEY=...,_FIREBASE_APP_ID=...
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
