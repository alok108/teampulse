import type { FastifyInstance } from 'fastify'
import { detectBottlenecks } from '../agents/bottleneckDetector.js'
import { getTasksByStatus } from '../services/firestore.js'

export async function insightRoutes(app: FastifyInstance) {
  // GET /insights/team?teamId= — AI-powered team health + bottleneck analysis
  app.get('/insights/team', async (req, reply) => {
    const { teamId } = req.query as { teamId?: string }
    if (!teamId) return reply.status(400).send({ error: 'teamId is required' })

    const tasksByStatus = await getTasksByStatus(teamId)

    const totalTasks = Object.values(tasksByStatus).reduce((sum, arr) => sum + arr.length, 0)
    const doneCount = tasksByStatus.DONE.length
    const blockedCount = tasksByStatus.BLOCKED.length
    const inProgressCount = tasksByStatus.IN_PROGRESS.length

    // Build a text snapshot for the AI agent
    const assigneeCounts: Record<string, number> = {}
    for (const task of tasksByStatus.IN_PROGRESS) {
      if (task.assigneeId) {
        assigneeCounts[task.assigneeId] = (assigneeCounts[task.assigneeId] ?? 0) + 1
      }
    }

    const fmtTask = (t: { title: string; assigneeId: string | null; dueDate: string | null }) =>
      `  - "${t.title}" (assigned to: ${t.assigneeId ?? 'unassigned'}, due: ${t.dueDate ?? 'no due date'})`

    const snapshot = `
Team Task Board Snapshot:
- TODO: ${tasksByStatus.TODO.length} tasks
- IN_PROGRESS: ${inProgressCount} tasks
- BLOCKED: ${blockedCount} tasks
- DONE: ${doneCount} tasks
- Total: ${totalTasks} tasks

Blocked tasks:
${tasksByStatus.BLOCKED.map(fmtTask).join('\n') || '  None'}

In-progress tasks:
${tasksByStatus.IN_PROGRESS.map(fmtTask).join('\n') || '  None'}

Assignee workload (in-progress tasks):
${Object.entries(assigneeCounts).map(([id, count]) => `  - ${id}: ${count} tasks`).join('\n') || '  No assignments'}

At-risk tasks (due within 48h with no progress):
${tasksByStatus.IN_PROGRESS.filter(t => t.dueDate && new Date(t.dueDate) < new Date(Date.now() + 48 * 60 * 60 * 1000)).map(t => `  - "${t.title}" due ${t.dueDate}`).join('\n') || '  None identified'}
`.trim()

    const report = await detectBottlenecks(snapshot)

    return {
      data: {
        ...report,
        stats: {
          total: totalTasks,
          todo: tasksByStatus.TODO.length,
          inProgress: inProgressCount,
          blocked: blockedCount,
          done: doneCount,
          completionRate: totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0,
        },
      },
    }
  })
}
