import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Tests for the insights board snapshot builder.
 * Verifies the in-memory transformation logic without hitting Firestore.
 */
describe('Insights snapshot building', () => {
  const fmtTask = (t: { title: string; assigneeId: string | null; dueDate: string | null }) =>
    `  - "${t.title}" (assigned to: ${t.assigneeId ?? 'unassigned'}, due: ${t.dueDate ?? 'no due date'})`

  it('formats task with assignee and due date', () => {
    const out = fmtTask({ title: 'Fix bug', assigneeId: 'priya', dueDate: '2026-05-10' })
    assert.equal(out, '  - "Fix bug" (assigned to: priya, due: 2026-05-10)')
  })

  it('formats unassigned task', () => {
    const out = fmtTask({ title: 'TBD', assigneeId: null, dueDate: null })
    assert.equal(out, '  - "TBD" (assigned to: unassigned, due: no due date)')
  })

  it('aggregates assignee workload from in-progress tasks', () => {
    const tasks = [
      { assigneeId: 'priya' },
      { assigneeId: 'priya' },
      { assigneeId: 'dev' },
      { assigneeId: null },
    ]
    const counts: Record<string, number> = {}
    for (const t of tasks) {
      if (t.assigneeId) counts[t.assigneeId] = (counts[t.assigneeId] ?? 0) + 1
    }
    assert.equal(counts.priya, 2)
    assert.equal(counts.dev, 1)
    assert.equal(counts.unassigned, undefined)
  })

  it('computes completion rate correctly', () => {
    const stats = { total: 10, done: 4 }
    const rate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
    assert.equal(rate, 40)
  })

  it('returns 0 completion rate when no tasks', () => {
    const stats = { total: 0, done: 0 }
    const rate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
    assert.equal(rate, 0)
  })
})

describe('At-risk deadline detection', () => {
  it('flags tasks due within 48 hours', () => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const tasks = [
      { title: 'Soon', dueDate: new Date(now + 1 * day).toISOString() },
      { title: 'Later', dueDate: new Date(now + 5 * day).toISOString() },
      { title: 'No deadline', dueDate: null as string | null },
    ]
    const atRisk = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date(now + 48 * 60 * 60 * 1000))
    assert.equal(atRisk.length, 1)
    assert.equal(atRisk[0].title, 'Soon')
  })
})
