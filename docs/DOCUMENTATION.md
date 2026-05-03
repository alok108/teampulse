# TeamPulse — Complete Project Documentation

> AI-Powered Team Coordination · PromptWars Hackathon, Chennai · May 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [AI Agents](#ai-agents)
7. [Firestore Data Models](#firestore-data-models)
8. [API Reference](#api-reference)
9. [Authentication](#authentication)
10. [CI/CD & Deployment](#cicd--deployment)
11. [Environment Configuration](#environment-configuration)
12. [Scripts & Tooling](#scripts--tooling)
13. [Known Caveats](#known-caveats)

---

## Overview

**TeamPulse** transforms the noise of team work — meetings, PRs, scattered tasks — into clear, AI-structured action. It uses **Gemini 2.5 Flash** via Vertex AI to power four specialized AI agents that parse tasks, summarize meetings, review code, and detect workflow bottlenecks.

### Core Features

| Feature | Description |
|---|---|
| **Meeting → Tasks** | Paste meeting notes → AI extracts action items and auto-creates structured tasks |
| **Smart Task Creation** | Describe a task in plain English → AI assigns priority, effort, tags, subtasks |
| **AI Code Review** | Paste code → AI returns quality score (0–100), security flags, improvement suggestions |
| **Team Health Dashboard** | AI scans the task board and surfaces bottlenecks, overloaded members, at-risk deadlines |

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TailwindCSS 3 |
| Backend | Fastify 4, TypeScript, Zod validation |
| AI | Vertex AI — Gemini 2.5 Flash (JSON structured output) |
| Database | Google Cloud Firestore (Native mode) |
| Infra | Cloud Run, Cloud Build, Artifact Registry |
| Monorepo | pnpm workspaces |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                    │
│           Dashboard / Tasks / Meetings / Reviews          │
│                   Cloud Run (HTTPS)                       │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────┐
│              Backend (Fastify + TypeScript)                │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │ Task Parser  │  │   Meeting     │  │ Code Review  │   │
│  │    Agent     │  │  Summarizer   │  │    Agent     │   │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘   │
│         │                 │                   │           │
│  ┌──────▼─────────────────▼───────────────────▼────────┐  │
│  │           Vertex AI — Gemini 2.5 Flash              │  │
│  │        (JSON mode for structured output)            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │  Bottleneck  │  │         Firestore DB             │   │
│  │   Detector   │  │  tasks / meetings / codeReviews  │   │
│  └──────────────┘  └──────────────────────────────────┘   │
│                   Cloud Run (HTTPS)                       │
└──────────────────────────────────────────────────────────┘
```

**Data flow:** Frontend → REST API → Fastify route → AI Agent (Gemini) → Firestore → JSON response.

---

## Project Structure

```
promptWars/
├── .env.example              # Root env template
├── .github/workflows/ci.yml  # GitHub Actions CI
├── .gitignore
├── README.md
├── cloudbuild.yaml           # Google Cloud Build pipeline
├── firestore.rules           # Firestore security rules
├── pnpm-workspace.yaml       # Monorepo workspace config
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Fastify server entrypoint
│       ├── config.ts          # Environment config
│       ├── agents/            # AI Agent modules
│       │   ├── prompts.ts     # System prompts for all 4 agents
│       │   ├── taskParser.ts
│       │   ├── meetingSummarizer.ts
│       │   ├── codeReviewer.ts
│       │   └── bottleneckDetector.ts
│       ├── routes/            # HTTP route handlers
│       │   ├── health.ts
│       │   ├── tasks.ts
│       │   ├── meetings.ts
│       │   ├── reviews.ts
│       │   └── insights.ts
│       └── services/          # Shared services
│           ├── gemini.ts      # Vertex AI client wrapper
│           └── firestore.ts   # Firestore client + data access layer
│
├── frontend/
│   ├── Dockerfile
│   ├── next.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── src/
│       ├── lib/
│       │   └── api.ts          # API client (fetch wrapper + types)
│       └── app/
│           ├── globals.css     # Tailwind base + custom vars
│           ├── layout.tsx      # Root layout + nav bar
│           ├── page.tsx        # / → redirects to /dashboard
│           ├── dashboard/page.tsx  # Team health dashboard
│           ├── tasks/page.tsx      # Kanban task board
│           ├── meetings/page.tsx   # Meeting parser
│           └── reviews/page.tsx    # Code review tool
│
└── scripts/
    ├── seed.ts                # Demo data seeder (Firestore)
    └── setup-gcp.sh           # One-time GCP project setup
```

---

## Backend

### Entrypoint — [index.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/index.ts)

Fastify server with CORS enabled. Registers 5 route plugins under the `/api` prefix (except `/health`). Listens on `0.0.0.0:8080`.

### Configuration — [config.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/config.ts)

| Key | Default | Description |
|---|---|---|
| `port` | `8080` | Server port |
| `gcpProjectId` | `promptwars-chennai-495105` | GCP project |
| `gcpRegion` | `us-central1` | GCP region |
| `vertexAiLocation` | `us-central1` | Vertex AI region |
| `firestoreDatabase` | `teampulse` | Firestore database name |
| `githubWebhookSecret` | `""` | HMAC secret for GitHub webhooks |
| `geminiModel` | `gemini-2.5-flash` | AI model identifier |

### Services

#### Gemini Service — [gemini.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/services/gemini.ts)

Generic `callAgent<T>()` function that sends a system prompt + user input to Gemini with a JSON response schema. All 4 agents call this single function. Uses `@google/genai` SDK with Vertex AI mode.

#### Firestore Service — [firestore.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/services/firestore.ts)

Data access layer with typed interfaces and CRUD functions:

| Function | Collection | Description |
|---|---|---|
| `createTask()` | `tasks` | Create with server timestamps |
| `listTasks()` | `tasks` | Filter by teamId + optional status, ordered by createdAt desc, limit 100 |
| `getTask()` | `tasks` | Single document by ID |
| `updateTask()` | `tasks` | Partial update with auto-updated timestamp |
| `createMeeting()` | `meetings` | Store parsed meeting with action items |
| `createCodeReview()` | `codeReviews` | Store review result |
| `listCodeReviews()` | `codeReviews` | By teamId, limit 20 |
| `getTasksByStatus()` | `tasks` | Returns `Record<TaskStatus, Task[]>` for insights |

### Routes

#### Health — [health.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/routes/health.ts)

`GET /health` → `{ status: "ok", version: "1.0.0", timestamp }`.

#### Tasks — [tasks.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/routes/tasks.ts)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/tasks` | AI-parse a plain-text description into a structured task |
| `GET` | `/api/tasks?teamId=&status=` | List tasks (status filter optional) |
| `GET` | `/api/tasks/:id` | Get single task |
| `PATCH` | `/api/tasks/:id` | Update status, assignee, or dueDate |

Request validation uses Zod schemas (`CreateTaskBody`, `UpdateTaskBody`).

#### Meetings — [meetings.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/routes/meetings.ts)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/meetings/parse` | Parse meeting notes → extract action items → optionally auto-create tasks |

Accepts `rawText`, `teamId`, `reporterId`, and `createTasks` (default: true). Returns summary, key decisions, action items, and IDs of created tasks.

#### Reviews — [reviews.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/routes/reviews.ts)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/reviews` | Direct code review — paste a snippet |
| `POST` | `/api/reviews/webhook` | GitHub webhook receiver (HMAC-verified) |
| `GET` | `/api/reviews?teamId=` | List recent reviews |

The webhook handler verifies `x-hub-signature-256` using `crypto.timingSafeEqual`. Currently uses PR metadata as input (fetching actual diffs from GitHub API is a TODO).

#### Insights — [insights.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/routes/insights.ts)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/insights/team?teamId=` | AI-powered team health + bottleneck analysis |

Builds a text snapshot of the task board (counts per status, blocked tasks, workload per assignee, at-risk deadlines) and sends it to the Bottleneck Detector agent. Returns the AI report plus computed stats (completion rate, etc).

### Dockerfile — [Dockerfile](file:///Users/alok/Sites/alokation/promptWars/backend/Dockerfile)

Multi-stage build:
1. **Builder**: `node:20-alpine`, installs deps, runs `tsc`
2. **Runner**: Copies compiled `dist/` + production deps, runs `node dist/index.js`

---

## Frontend

### Framework

Next.js 14 with the **App Router** (`src/app/`). Uses TailwindCSS 3 for styling. Output mode is `standalone` for Docker deployment.

### Config Files

| File | Purpose |
|---|---|
| [next.config.mjs](file:///Users/alok/Sites/alokation/promptWars/frontend/next.config.mjs) | `NEXT_PUBLIC_API_URL` env var, `standalone` output |
| [tailwind.config.ts](file:///Users/alok/Sites/alokation/promptWars/frontend/tailwind.config.ts) | Content paths + custom `brand` color palette |
| [tsconfig.json](file:///Users/alok/Sites/alokation/promptWars/frontend/tsconfig.json) | `@/*` path alias → `./src/*` |

### API Client — [api.ts](file:///Users/alok/Sites/alokation/promptWars/frontend/src/lib/api.ts)

Centralized fetch wrapper with typed methods. Hardcoded `TEAM_ID = 'demo-team'`. Methods:

| Method | Endpoint | Description |
|---|---|---|
| `api.getTasks()` | `GET /api/tasks` | Fetch all tasks |
| `api.createTask(desc)` | `POST /api/tasks` | AI-create a task |
| `api.updateTask(id, updates)` | `PATCH /api/tasks/:id` | Update task |
| `api.parseMeeting(text)` | `POST /api/meetings/parse` | Parse meeting notes |
| `api.reviewCode(code, lang)` | `POST /api/reviews` | Run code review |
| `api.getInsights()` | `GET /api/insights/team` | Get team health |
| `api.getReviews()` | `GET /api/reviews` | List past reviews |

### Pages

#### Layout — [layout.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/layout.tsx)

Root layout with a top navigation bar (Dashboard, Tasks, Meetings, Code Reviews). SEO metadata set.

#### Home — [page.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/page.tsx)

Server-side redirect: `/` → `/dashboard`.

#### Dashboard — [dashboard/page.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/dashboard/page.tsx)

Client component. Loads insights + tasks in parallel on mount. Shows:
- **Stats row** — Total / To Do / In Progress / Blocked / Done
- **AI Health Report** — health score, blocked tasks, recommendations
- **Quick Actions** — links to Meetings and Reviews
- **Completion rate** bar
- **Recent Tasks** list (top 5)

#### Tasks — [tasks/page.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/tasks/page.tsx)

Client component. **Kanban board** with 4 columns (TODO, IN_PROGRESS, BLOCKED, DONE). Features:
- AI-powered task creation input (plain English → structured task)
- Quick status transitions via buttons on each card
- Priority badges, effort hours, subtask progress

#### Meetings — [meetings/page.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/meetings/page.tsx)

Client component. Textarea for pasting meeting notes (with "Load example" prefill). On submit:
- Shows AI summary
- Lists key decisions
- Shows extracted action items with priority + owner
- Displays count of auto-created tasks

#### Reviews — [reviews/page.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/reviews/page.tsx)

Client component. Side-by-side layout:
- **Left**: Code input (dark-themed textarea) with language selector and "Load vulnerable example"
- **Right**: Quality score, overall feedback, issue list (severity-colored cards), recent review history

### Dockerfile — [Dockerfile](file:///Users/alok/Sites/alokation/promptWars/frontend/Dockerfile)

Multi-stage build:
1. **Builder**: `node:20-alpine`, installs deps, builds Next.js (`standalone` output)
2. **Runner**: Non-root `nextjs` user, copies standalone build + static assets, runs `node server.js` on port 8080

---

## AI Agents

All agents share the same pattern: **system prompt** + **user input** + **JSON response schema** → Gemini returns structured JSON.

### System Prompts — [prompts.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/agents/prompts.ts)

| Agent | Persona | Key Rules |
|---|---|---|
| **Task Parser** | Experienced PM/tech lead | Assess priority by urgency/impact, realistic effort, 2–5 subtasks for complex work |
| **Meeting Summarizer** | Meticulous technical scribe | Extract only concrete action items, infer due dates from context |
| **Code Reviewer** | Senior software engineer | 0–100 quality score, severity levels (ERROR/WARNING/INFO), be constructive |
| **Bottleneck Detector** | Engineering manager | Focus on actionable risks, don't invent problems |

### Agent Modules

Each agent module defines:
1. **TypeScript interface** for the response
2. **JSON schema** using `@google/genai` `Type` enum
3. **Export function** that calls `callAgent<T>()`

| File | Function | Input | Output |
|---|---|---|---|
| [taskParser.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/agents/taskParser.ts) | `parseTask(desc)` | Plain text | `ParsedTask` (title, desc, priority, hours, tags, subtasks) |
| [meetingSummarizer.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/agents/meetingSummarizer.ts) | `parseMeetingNotes(text)` | Meeting notes | `MeetingSummary` (actionItems, keyDecisions, summary) |
| [codeReviewer.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/agents/codeReviewer.ts) | `reviewCode(code)` | Code/diff | `CodeReviewResult` (score, issues, feedback, securityFlags) |
| [bottleneckDetector.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/agents/bottleneckDetector.ts) | `detectBottlenecks(snapshot)` | Board text | `BottleneckReport` (blocked, overloaded, atRisk, recommendations, healthScore) |

---

## Firestore Data Models

### `tasks` Collection

| Field | Type | Description |
|---|---|---|
| `teamId` | `string` | Team identifier |
| `title` | `string` | Task title |
| `description` | `string` | Full description |
| `status` | `enum` | `TODO` / `IN_PROGRESS` / `BLOCKED` / `DONE` |
| `priority` | `enum` | `LOW` / `MEDIUM` / `HIGH` / `CRITICAL` |
| `estimatedHours` | `number` | Effort estimate |
| `assigneeId` | `string?` | Assigned user ID |
| `reporterId` | `string` | Creator |
| `dueDate` | `string?` | ISO date |
| `tags` | `string[]` | Labels |
| `subtasks` | `array` | `[{ title, done }]` |
| `aiGenerated` | `boolean` | Whether AI created this |
| `createdAt` | `Timestamp` | Server timestamp |
| `updatedAt` | `Timestamp` | Server timestamp |

### `meetings` Collection

| Field | Type | Description |
|---|---|---|
| `teamId` | `string` | Team identifier |
| `rawText` | `string` | Original meeting notes |
| `parsedAt` | `Timestamp` | When AI parsed |
| `actionItems` | `array` | `[{ title, ownerId, ownerName, dueDate, priority, taskId }]` |

### `codeReviews` Collection

| Field | Type | Description |
|---|---|---|
| `teamId` | `string` | Team identifier |
| `repoName` | `string` | Repository (or `"direct-review"`) |
| `prNumber` | `number` | PR number (0 for direct) |
| `prUrl` | `string` | PR URL |
| `qualityScore` | `number` | 0–100 |
| `status` | `enum` | `PENDING` / `DONE` / `FAILED` |
| `issues` | `array` | `[{ severity, type, file, line, message, suggestion }]` |
| `overallFeedback` | `string` | Summary |
| `linkedTaskId` | `string?` | Associated task |
| `createdAt` | `Timestamp` | Server timestamp |
| `completedAt` | `Timestamp?` | Completion time |

### `teams` Collection (seed only)

| Field | Type |
|---|---|
| `name` | `string` |
| `memberIds` | `string[]` |
| `createdAt` | `Timestamp` |

---

## API Reference

### Health
```
GET /health → { status, version, timestamp }
```

### Tasks
```
POST   /api/tasks                   Create task (AI-parsed from description)
  Body: { description, teamId, reporterId?, assigneeId? }

GET    /api/tasks?teamId=&status=   List tasks (status optional)
GET    /api/tasks/:id               Get single task
PATCH  /api/tasks/:id               Update task
  Body: { status?, assigneeId?, dueDate? }
```

### Meetings
```
POST   /api/meetings/parse          Parse meeting notes → extract action items
  Body: { rawText, teamId, reporterId?, createTasks? }
  Response: { meetingId, summary, keyDecisions, actionItems, tasksCreated, taskIds }
```

### Code Reviews
```
POST   /api/reviews                 Direct code review
  Body: { code, language?, teamId, linkedTaskId? }

POST   /api/reviews/webhook         GitHub webhook (HMAC verified)
  Headers: x-hub-signature-256

GET    /api/reviews?teamId=         List recent reviews
```

### Insights
```
GET    /api/insights/team?teamId=   AI team health report
  Response: { blockedTasks, overloadedMembers, atRiskDeadlines,
              recommendations, healthScore, summary, stats }
```

> All `/api/*` routes require `Authorization: Bearer <Firebase ID token>`. `GET /health` is open. Missing/invalid token → 401.

---

## Authentication

Firebase Authentication with Google sign-in. Backend verifies ID tokens via `firebase-admin`; frontend uses the Firebase Web SDK.

### Backend

- [services/firebaseAuth.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/services/firebaseAuth.ts) — Initializes `firebase-admin` with Application Default Credentials and exposes `verifyIdToken(token)`.
- [plugins/auth.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/plugins/auth.ts) — Fastify `preHandler` hook (`authHook`). Reads `Authorization: Bearer <token>`, verifies it, attaches `req.user = { uid, email }`. Returns 401 on missing or invalid token.
- [index.ts](file:///Users/alok/Sites/alokation/promptWars/backend/src/index.ts) — Registers `authHook` directly on the encapsulated `/api` scope so it applies to every protected route. `/health` stays unauthenticated.
- [index.ts global error handler](file:///Users/alok/Sites/alokation/promptWars/backend/src/index.ts) — Replaces opaque 500s with the underlying error message + code, so failures (Firestore/Vertex AI/auth) surface in the response body.

### Frontend

- [lib/firebase.ts](file:///Users/alok/Sites/alokation/promptWars/frontend/src/lib/firebase.ts) — `initializeApp` from `NEXT_PUBLIC_FIREBASE_*` env vars. Exports `auth` and `googleProvider`.
- [lib/auth.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/lib/auth.tsx) — `AuthProvider` (React Context) + `useAuth()` hook. Subscribes to `onIdTokenChanged`, exposes `{ user, loading, signIn, signOut }`. On mount it calls `setTokenGetter` from `api.ts` so every request includes the current ID token.
- [lib/api.ts](file:///Users/alok/Sites/alokation/promptWars/frontend/src/lib/api.ts) — `apiFetch` awaits the registered token-getter and attaches `Authorization: Bearer <idToken>` to every request. Provider-agnostic — the auth layer can be swapped without touching API call sites.
- [components/SignInGate.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/components/SignInGate.tsx) — Full-page gate. While `loading`, shows a spinner. When unauthenticated, shows a single "Sign in with Google" button. When signed in, renders `children`.
- [components/NavUser.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/components/NavUser.tsx) — Email + sign-out control rendered next to the nav links.
- [app/layout.tsx](file:///Users/alok/Sites/alokation/promptWars/frontend/src/app/layout.tsx) — Wraps the app in `<AuthProvider>` and renders `<SignInGate>` around `<main>`.

### Tenancy

`teamId` stays hardcoded to `demo-team` in this hackathon scope. Auth gates the API but doesn't yet derive `teamId` from `req.user.uid` — switching to per-user team membership later is a single-route change.

### One-time Firebase setup

The existing GCP project (`promptwars-chennai-495105`) is now Firebase-enabled with a Web App registered — done programmatically via the Firebase Management API (`projects:addFirebase` and `projects/{id}/webApps`). The remaining manual step is enabling Google as a sign-in provider:

1. https://console.firebase.google.com/project/promptwars-chennai-495105/authentication/providers
2. Click **Get started** → **Google** → toggle **Enable** → set support email → **Save**.

After that, copy the four `firebaseConfig` values from **Project settings → Your apps → Web** into `frontend/.env.local`. The current Web App is named "TeamPulse Web".

---

## CI/CD & Deployment

### GitHub Actions — [ci.yml](file:///Users/alok/Sites/alokation/promptWars/.github/workflows/ci.yml)

Runs on push/PR to `main`. Two parallel jobs:
- **Backend**: `npm ci --ignore-scripts` → `npm run typecheck` → `npm test`
- **Frontend**: `npm ci --ignore-scripts` → `npm run typecheck` → `npm test`

Tests use Node's built-in test runner (`node --test`). 31 tests cover agent schemas, request validation, health endpoint, insights snapshot building, deadline detection, GitHub webhook signature verification (backend) and API client URL building, status formatting, health/quality score thresholds (frontend).

### Google Cloud Build — [cloudbuild.yaml](file:///Users/alok/Sites/alokation/promptWars/cloudbuild.yaml)

6-step pipeline:

1. **build-backend** — Docker build → `us-central1-docker.pkg.dev/$PROJECT_ID/teampulse/backend:$SHORT_SHA`
2. **push-backend** — Push image to Artifact Registry
3. **deploy-backend** — Deploy to Cloud Run (`teampulse-backend`, 1Gi RAM, 1 CPU, min 1 / max 10 instances)
4. **build-frontend** — Docker build
5. **push-frontend** — Push image
6. **deploy-frontend** — Deploy to Cloud Run (`teampulse-frontend`, 512Mi RAM, 1 CPU, min 1 / max 5 instances)

**Trigger command:**
```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_BACKEND_URL=https://your-backend-url,_FIREBASE_API_KEY=...,_FIREBASE_APP_ID=...
```

**Substitutions (cloudbuild.yaml):**
- `_BACKEND_URL` — Cloud Run backend URL, baked into the frontend bundle as `NEXT_PUBLIC_API_URL`. Defaults to the deployed Cloud Run URL.
- `_FIREBASE_API_KEY`, `_FIREBASE_APP_ID` — From Firebase Console → Project settings → Your apps → Web. Required for the deployed frontend to authenticate.
- `_FIREBASE_AUTH_DOMAIN` — Defaults to `promptwars-chennai-495105.firebaseapp.com`.

The frontend Dockerfile takes these as `ARG`s and bakes them into the Next.js bundle at build time (they are public values, safe to embed).

### Firestore Rules — [firestore.rules](file:///Users/alok/Sites/alokation/promptWars/firestore.rules)

> [!WARNING]
> Currently **open access** (`allow read, write: if true`). This is a hackathon configuration. The backend uses a service account (ADC) which bypasses these rules anyway. **Must be tightened before production.**

---

## Environment Configuration

### Root — `.env.example` (backend + shared)

```env
GCP_PROJECT_ID=promptwars-chennai-495105
APP_NAME=TeamPulse
GCP_REGION=us-central1
VERTEX_AI_LOCATION=us-central1
# Created with: gcloud firestore databases create --database=teampulse --location=us-central1
FIRESTORE_DATABASE=teampulse
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret_here
PORT=3001
```

The backend reads this via `node --env-file=.env` for local dev. ADC (Application Default Credentials) is used for both Vertex AI and Firestore — no service-account JSON needed locally. Run `gcloud auth application-default login` once.

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001

# Copy these four from Firebase Console → Project settings → Your apps → Web
NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=promptwars-chennai-495105.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=promptwars-chennai-495105
NEXT_PUBLIC_FIREBASE_APP_ID=<appId>
```

Firebase Web SDK config values are public — they identify the project, they don't authorize access. Real authorization happens via the ID token signed by Firebase Auth.

---

## Scripts & Tooling

### GCP Setup — [setup-gcp.sh](file:///Users/alok/Sites/alokation/promptWars/scripts/setup-gcp.sh)

One-time script to bootstrap the GCP project:
- Sets project + account
- Enables APIs (Run, Vertex AI, Firestore, Cloud Build, Artifact Registry, Cloud Tasks, Secret Manager)
- Creates Artifact Registry repo
- Grants IAM roles to Cloud Build and Compute service accounts

### Demo Seed — [seed.ts](file:///Users/alok/Sites/alokation/promptWars/scripts/seed.ts)

```bash
cd backend && npx tsx ../scripts/seed.ts
```

Seeds Firestore with:
- 1 demo team (`demo-team`) with 4 members
- 8 sample tasks (various statuses, priorities, with subtasks)
- 1 sample code review (with SQL injection finding)

### Monorepo — [pnpm-workspace.yaml](file:///Users/alok/Sites/alokation/promptWars/pnpm-workspace.yaml)

```yaml
packages:
  - 'backend'
  - 'frontend'
```

---

## Known Caveats

> [!WARNING]
> - **Firestore rules are wide open** — backend uses ADC and bypasses rules anyway, but must be locked down before any client-direct Firestore access.
> - **GitHub webhook** only uses PR metadata, not the actual diff (production TODO).
> - **`TEAM_ID` is hardcoded** to `demo-team` in the frontend API client and not derived from `req.user.uid` server-side. Auth gates the API but tenancy is single-team.
> - **No error retry logic** on Gemini calls — a transient Vertex AI failure surfaces as a 500 (with the underlying message thanks to the global error handler).
