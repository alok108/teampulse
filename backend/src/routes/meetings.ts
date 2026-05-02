import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { parseMeetingNotes } from '../agents/meetingSummarizer.js'
import { createMeeting, createTask } from '../services/firestore.js'

const ParseMeetingBody = z.object({
  rawText: z.string().min(20),
  teamId: z.string(),
  reporterId: z.string().optional().default('anonymous'),
  createTasks: z.boolean().optional().default(true),
})

export async function meetingRoutes(app: FastifyInstance) {
  // POST /meetings/parse — extract action items and optionally create tasks
  app.post('/meetings/parse', async (req, reply) => {
    const body = ParseMeetingBody.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { rawText, teamId, reporterId, createTasks: shouldCreateTasks } = body.data
    const summary = await parseMeetingNotes(rawText)

    const createdTaskIds: string[] = []

    if (shouldCreateTasks && summary.actionItems.length > 0) {
      const taskPromises = summary.actionItems.map(item =>
        createTask({
          teamId,
          title: item.title,
          description: item.title,
          status: 'TODO',
          priority: item.priority,
          estimatedHours: 0,
          assigneeId: null,
          reporterId,
          dueDate: item.dueDate ?? null,
          tags: ['meeting-action-item'],
          subtasks: [],
          aiGenerated: true,
        })
      )
      const tasks = await Promise.all(taskPromises)
      createdTaskIds.push(...tasks.map(t => t.id!))
    }

    const meeting = await createMeeting({
      teamId,
      rawText,
      actionItems: summary.actionItems.map((item, i) => ({
        title: item.title,
        ownerId: null,
        ownerName: item.ownerName,
        dueDate: item.dueDate,
        priority: item.priority,
        taskId: createdTaskIds[i] ?? null,
      })),
    })

    return reply.status(201).send({
      data: {
        meetingId: meeting.id,
        summary: summary.summary,
        keyDecisions: summary.keyDecisions,
        actionItems: summary.actionItems,
        tasksCreated: createdTaskIds.length,
        taskIds: createdTaskIds,
      },
    })
  })
}
