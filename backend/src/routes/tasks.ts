import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { parseTask } from '../agents/taskParser.js'
import { createTask, listTasks, getTask, updateTask, type TaskStatus } from '../services/firestore.js'

const CreateTaskBody = z.object({
  description: z.string().min(5),
  teamId: z.string(),
  reporterId: z.string().optional().default('anonymous'),
  assigneeId: z.string().nullable().optional().default(null),
})

const UpdateTaskBody = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
})

export async function taskRoutes(app: FastifyInstance) {
  // POST /tasks — AI parses description into structured task
  app.post('/tasks', async (req, reply) => {
    const body = CreateTaskBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { description, teamId, reporterId, assigneeId } = body.data
    const parsed = await parseTask(description)

    const task = await createTask({
      teamId,
      title: parsed.title,
      description: parsed.description,
      status: 'TODO',
      priority: parsed.priority,
      estimatedHours: parsed.estimatedHours,
      assigneeId: assigneeId ?? null,
      reporterId,
      dueDate: null,
      tags: parsed.tags,
      subtasks: parsed.subtasks,
      aiGenerated: true,
    })

    return reply.status(201).send({ data: task })
  })

  // GET /tasks?teamId=&status=
  app.get('/tasks', async (req, reply) => {
    const { teamId, status } = req.query as { teamId?: string; status?: string }
    if (!teamId) return reply.status(400).send({ error: 'teamId is required' })
    const tasks = await listTasks(teamId, status as TaskStatus | undefined)
    return { data: tasks }
  })

  // GET /tasks/:id
  app.get('/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const task = await getTask(id)
    if (!task) return reply.status(404).send({ error: 'Task not found' })
    return { data: task }
  })

  // PATCH /tasks/:id
  app.patch('/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = UpdateTaskBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const existing = await getTask(id)
    if (!existing) return reply.status(404).send({ error: 'Task not found' })
    await updateTask(id, body.data)
    return { data: { ...existing, ...body.data } }
  })
}
