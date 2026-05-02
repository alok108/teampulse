const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const TEAM_ID = 'demo-team'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedHours: number
  assigneeId: string | null
  tags: string[]
  subtasks: { title: string; done: boolean }[]
  dueDate: string | null
  aiGenerated: boolean
}

export interface InsightReport {
  blockedTasks: string[]
  overloadedMembers: { name: string; taskCount: number }[]
  atRiskDeadlines: string[]
  recommendations: string[]
  healthScore: number
  summary: string
  stats: {
    total: number
    todo: number
    inProgress: number
    blocked: number
    done: number
    completionRate: number
  }
}

export interface CodeReview {
  id: string
  repoName: string
  prNumber: number
  qualityScore: number
  status: string
  issues: { severity: string; type: string; message: string; suggestion: string; file: string }[]
  overallFeedback: string
}

export const api = {
  getTasks: () => apiFetch<Task[]>(`/api/tasks?teamId=${TEAM_ID}`),

  createTask: (description: string) =>
    apiFetch<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ description, teamId: TEAM_ID, reporterId: 'demo-user' }),
    }),

  updateTask: (id: string, updates: Partial<Task>) =>
    apiFetch<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  parseMeeting: (rawText: string) =>
    apiFetch<{
      meetingId: string
      summary: string
      keyDecisions: string[]
      actionItems: { title: string; ownerName: string | null; priority: string }[]
      tasksCreated: number
    }>('/api/meetings/parse', {
      method: 'POST',
      body: JSON.stringify({ rawText, teamId: TEAM_ID, createTasks: true }),
    }),

  reviewCode: (code: string, language: string) =>
    apiFetch<CodeReview>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ code, language, teamId: TEAM_ID }),
    }),

  getInsights: () => apiFetch<InsightReport>(`/api/insights/team?teamId=${TEAM_ID}`),

  getReviews: () => apiFetch<CodeReview[]>(`/api/reviews?teamId=${TEAM_ID}`),
}
