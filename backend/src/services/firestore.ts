import { Firestore, FieldValue } from '@google-cloud/firestore'
import { config } from '../config.js'

export const db = new Firestore({
  projectId: config.gcpProjectId,
  databaseId: config.firestoreDatabase,
})

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Task {
  id?: string
  teamId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  estimatedHours: number
  assigneeId: string | null
  reporterId: string
  dueDate: string | null
  tags: string[]
  subtasks: { title: string; done: boolean }[]
  aiGenerated: boolean
  createdAt: FirebaseFirestore.Timestamp | null
  updatedAt: FirebaseFirestore.Timestamp | null
}

export interface Meeting {
  id?: string
  teamId: string
  rawText: string
  parsedAt: FirebaseFirestore.Timestamp | null
  actionItems: {
    title: string
    ownerId: string | null
    ownerName: string | null
    dueDate: string | null
    priority: TaskPriority
    taskId: string | null
  }[]
}

export interface CodeReview {
  id?: string
  teamId: string
  repoName: string
  prNumber: number
  prUrl: string
  qualityScore: number
  status: 'PENDING' | 'DONE' | 'FAILED'
  issues: {
    severity: 'ERROR' | 'WARNING' | 'INFO'
    type: string
    file: string
    line: number | null
    message: string
    suggestion: string
  }[]
  overallFeedback: string
  linkedTaskId: string | null
  createdAt: FirebaseFirestore.Timestamp | null
  completedAt: FirebaseFirestore.Timestamp | null
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const ref = db.collection('tasks').doc()
  const now = FieldValue.serverTimestamp()
  const data = { ...task, createdAt: now, updatedAt: now }
  await ref.set(data)
  return { ...task, id: ref.id, createdAt: null, updatedAt: null }
}

export async function listTasks(teamId: string, status?: TaskStatus): Promise<Task[]> {
  let query = db.collection('tasks').where('teamId', '==', teamId) as FirebaseFirestore.Query
  if (status) query = query.where('status', '==', status)
  const snap = await query.orderBy('createdAt', 'desc').limit(100).get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task))
}

export async function getTask(taskId: string): Promise<Task | null> {
  const doc = await db.collection('tasks').doc(taskId).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as Task
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  await db.collection('tasks').doc(taskId).update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function createMeeting(meeting: Omit<Meeting, 'id' | 'parsedAt'>): Promise<Meeting> {
  const ref = db.collection('meetings').doc()
  const data = { ...meeting, parsedAt: FieldValue.serverTimestamp() }
  await ref.set(data)
  return { ...meeting, id: ref.id, parsedAt: null }
}

export async function createCodeReview(review: Omit<CodeReview, 'id' | 'createdAt' | 'completedAt'>): Promise<CodeReview> {
  const ref = db.collection('codeReviews').doc()
  const now = FieldValue.serverTimestamp()
  const data = { ...review, createdAt: now, completedAt: now }
  await ref.set(data)
  return { ...review, id: ref.id, createdAt: null, completedAt: null }
}

export async function listCodeReviews(teamId: string): Promise<CodeReview[]> {
  const snap = await db.collection('codeReviews')
    .where('teamId', '==', teamId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CodeReview))
}

export async function getTasksByStatus(teamId: string): Promise<Record<TaskStatus, Task[]>> {
  const snap = await db.collection('tasks').where('teamId', '==', teamId).get()
  const result: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] }
  snap.docs.forEach(d => {
    const task = { id: d.id, ...d.data() } as Task
    result[task.status].push(task)
  })
  return result
}
