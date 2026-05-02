'use client'

import { useEffect, useState } from 'react'
import { api, type Task } from '@/lib/api'

const statusCols: { key: Task['status']; label: string; color: string }[] = [
  { key: 'TODO', label: 'To Do', color: 'border-slate-300' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-400' },
  { key: 'BLOCKED', label: 'Blocked', color: 'border-orange-400' },
  { key: 'DONE', label: 'Done', color: 'border-green-400' },
]

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    try {
      await api.createTask(description)
      setDescription('')
      loadTasks()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (id: string, status: Task['status']) => {
    await api.updateTask(id, { status })
    loadTasks()
  }

  const byStatus = (status: Task['status']) => tasks.filter(t => t.status === status)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
        <p className="text-slate-500 mt-1">Describe a task in plain English — AI handles the structure</p>
      </div>

      {/* Create Task */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe a task... e.g. 'Add OAuth login with Google, needs refresh tokens and session persistence'"
          className="flex-1 text-sm border border-slate-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !description.trim()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {creating ? 'AI Parsing...' : '+ Create Task'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCols.map(col => (
            <div key={col.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`border-t-4 ${col.color} px-4 py-3 flex items-center justify-between`}>
                <span className="font-semibold text-slate-700 text-sm">{col.label}</span>
                <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5 font-medium">
                  {byStatus(col.key).length}
                </span>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {byStatus(col.key).map(task => (
                  <div key={task.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 leading-tight">{task.title}</p>
                      {task.aiGenerated && (
                        <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded shrink-0">AI</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.estimatedHours > 0 && (
                      <span className="text-xs text-slate-400 ml-2">{task.estimatedHours}h</span>
                    )}
                    {task.subtasks.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks
                      </div>
                    )}
                    {/* Quick status move */}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {statusCols
                        .filter(s => s.key !== col.key)
                        .map(s => (
                          <button
                            key={s.key}
                            onClick={() => handleStatusChange(task.id, s.key)}
                            className="text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                          >
                            → {s.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {byStatus(col.key).length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
