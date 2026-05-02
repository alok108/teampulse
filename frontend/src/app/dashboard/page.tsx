'use client'

import { useEffect, useState } from 'react'
import { api, type InsightReport, type Task } from '@/lib/api'

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

const healthColor = (score: number) => {
  if (score >= 70) return 'text-green-700'
  if (score >= 40) return 'text-yellow-700'
  return 'text-red-700'
}

export default function Dashboard() {
  const [report, setReport] = useState<InsightReport | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.getInsights(), api.getTasks()])
      .then(([r, t]) => { setReport(r); setTasks(t) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div
      className="p-8 flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-slate-700">Analyzing team health...</p>
        <span className="sr-only">Loading dashboard data, please wait</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800">
        Failed to load dashboard: {error}
      </div>
    </div>
  )

  const recentTasks = tasks.slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-700 mt-1">AI-powered visibility into your team&apos;s workflow</p>
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Task statistics</h2>
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-4" role="list">
          {[
            { label: 'Total Tasks', value: report?.stats.total ?? 0, color: 'text-slate-900' },
            { label: 'To Do', value: report?.stats.todo ?? 0, color: 'text-slate-700' },
            { label: 'In Progress', value: report?.stats.inProgress ?? 0, color: 'text-blue-700' },
            { label: 'Blocked', value: report?.stats.blocked ?? 0, color: 'text-orange-700' },
            { label: 'Done', value: report?.stats.done ?? 0, color: 'text-green-700' },
          ].map(stat => (
            <li
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <div className={`text-3xl font-bold ${stat.color}`} aria-hidden="true">{stat.value}</div>
              <div className="text-sm text-slate-700 mt-1">{stat.label}</div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section
          aria-labelledby="health-heading"
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="health-heading" className="font-semibold text-slate-900">AI Team Health Report</h2>
            <div className="flex items-center gap-2" role="status" aria-label={`Team health score ${report?.healthScore ?? 0} out of 100`}>
              <span className="text-sm text-slate-700">Health Score:</span>
              <span className={`text-xl font-bold ${healthColor(report?.healthScore ?? 0)}`} aria-hidden="true">
                {report?.healthScore ?? '—'}/100
              </span>
            </div>
          </div>

          {report?.summary && (
            <p className="text-slate-800 text-sm mb-4 bg-slate-50 rounded-lg p-3">{report.summary}</p>
          )}

          {(report?.blockedTasks?.length ?? 0) > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-orange-800 mb-2">Blocked Tasks</h3>
              <ul className="space-y-1">
                {report!.blockedTasks.map((t, i) => (
                  <li key={i} className="text-sm text-slate-800 flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5" aria-hidden="true">●</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(report?.recommendations?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-medium text-blue-800 mb-2">AI Recommendations</h3>
              <ul className="space-y-1">
                {report!.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-slate-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5" aria-hidden="true">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside aria-label="Quick actions" className="space-y-4">
          <div className="bg-blue-700 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-1">Meeting → Tasks</h3>
            <p className="text-blue-50 text-sm mb-3">Paste meeting notes and let AI extract action items</p>
            <a
              href="/meetings"
              className="bg-white text-blue-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-50 transition-colors inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
            >
              Parse Meeting
            </a>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Code Review</h3>
            <p className="text-slate-700 text-sm mb-3">Get AI review on any code snippet instantly</p>
            <a
              href="/reviews"
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Review Code
            </a>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Completion Rate</h3>
            <div
              className="w-full bg-slate-200 rounded-full h-3 mt-2"
              role="progressbar"
              aria-valuenow={report?.stats.completionRate ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Task completion rate"
            >
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${report?.stats.completionRate ?? 0}%` }}
              />
            </div>
            <p className="text-sm text-slate-700 mt-1">{report?.stats.completionRate ?? 0}% tasks completed</p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="recent-tasks-heading" className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-tasks-heading" className="font-semibold text-slate-900">Recent Tasks</h2>
          <a
            href="/tasks"
            className="text-sm text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1"
          >
            View all <span aria-hidden="true">→</span>
            <span className="sr-only">View all tasks</span>
          </a>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-slate-600 text-sm">No tasks yet. <a href="/tasks" className="text-blue-700 hover:underline">Create your first task</a></p>
        ) : (
          <ul className="space-y-2" role="list">
            {recentTasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
                  aria-label={`Priority: ${task.priority}`}
                >
                  {task.priority}
                </span>
                <span className="text-sm text-slate-900 flex-1">{task.title}</span>
                <span className="text-xs text-slate-700" aria-label={`Status: ${task.status.replace('_', ' ')}`}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.aiGenerated && (
                  <span
                    className="text-xs text-blue-700 font-medium"
                    aria-label="AI generated task"
                    title="AI generated"
                  >
                    AI
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
