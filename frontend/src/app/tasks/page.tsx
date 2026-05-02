'use client'

import { useEffect, useState } from 'react'
import { api, type Task } from '@/lib/api'

const statusCols: { key: Task['status']; label: string; color: string }[] = [
  { key: 'TODO', label: 'To Do', color: 'border-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500' },
  { key: 'BLOCKED', label: 'Blocked', color: 'border-orange-500' },
  { key: 'DONE', label: 'Done', color: 'border-green-500' },
]

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const loadTasks = () => {
    setLoading(true)
    api.getTasks()
      .then(setTasks)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTasks() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return
    setCreating(true)
    setError(null)
    setStatusMessage('AI is parsing your task description...')
    try {
      const task = await api.createTask(description)
      setDescription('')
      setStatusMessage(`Task created: ${task.title}`)
      loadTasks()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (id: string, status: Task['status'], title: string) => {
    setStatusMessage(`Moving "${title}" to ${status.replace('_', ' ')}`)
    await api.updateTask(id, { status })
    loadTasks()
  }

  const byStatus = (status: Task['status']) => tasks.filter(t => t.status === status)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
        <p className="text-slate-700 mt-1">Describe a task in plain English — AI handles the structure</p>
      </header>

      <div className="sr-only" role="status" aria-live="polite">{statusMessage}</div>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4" aria-label="Create new task">
        <label htmlFor="task-description" className="sr-only">
          Task description
        </label>
        <div className="flex gap-3">
          <input
            id="task-description"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe a task... e.g. 'Add OAuth login with Google, needs refresh tokens'"
            className="flex-1 text-sm border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
            disabled={creating}
            aria-describedby="task-description-help"
          />
          <button
            type="submit"
            disabled={creating || !description.trim()}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {creating ? 'AI Parsing...' : '+ Create Task'}
          </button>
        </div>
        <p id="task-description-help" className="sr-only">
          AI will analyze your description and assign priority, effort, and subtasks
        </p>
      </form>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-700" role="status" aria-live="polite">Loading tasks...</div>
      ) : (
        <section aria-labelledby="board-heading">
          <h2 id="board-heading" className="sr-only">Task board organized by status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusCols.map(col => (
              <section
                key={col.key}
                aria-labelledby={`col-${col.key}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className={`border-t-4 ${col.color} px-4 py-3 flex items-center justify-between`}>
                  <h3 id={`col-${col.key}`} className="font-semibold text-slate-800 text-sm">
                    {col.label}
                  </h3>
                  <span
                    className="bg-slate-100 text-slate-800 text-xs rounded-full px-2 py-0.5 font-medium"
                    aria-label={`${byStatus(col.key).length} tasks`}
                  >
                    {byStatus(col.key).length}
                  </span>
                </div>
                <ul className="p-3 space-y-2 min-h-[200px]" role="list">
                  {byStatus(col.key).map(task => (
                    <li key={task.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 leading-tight">{task.title}</p>
                        {task.aiGenerated && (
                          <span
                            className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shrink-0 font-medium"
                            aria-label="AI generated"
                            title="AI generated"
                          >
                            AI
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
                        aria-label={`Priority: ${task.priority}`}
                      >
                        {task.priority}
                      </span>
                      {task.estimatedHours > 0 && (
                        <span className="text-xs text-slate-700 ml-2" aria-label={`Estimated ${task.estimatedHours} hours`}>
                          {task.estimatedHours}h
                        </span>
                      )}
                      {task.subtasks.length > 0 && (
                        <div className="mt-2 text-xs text-slate-700">
                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks completed
                        </div>
                      )}
                      <div className="mt-2 flex gap-1 flex-wrap" role="group" aria-label="Move task to">
                        {statusCols
                          .filter(s => s.key !== col.key)
                          .map(s => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => handleStatusChange(task.id, s.key, task.title)}
                              className="text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              aria-label={`Move ${task.title} to ${s.label}`}
                            >
                              <span aria-hidden="true">→</span> {s.label}
                            </button>
                          ))}
                      </div>
                    </li>
                  ))}
                  {byStatus(col.key).length === 0 && (
                    <li className="text-xs text-slate-600 text-center py-4 list-none">No tasks</li>
                  )}
                </ul>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
