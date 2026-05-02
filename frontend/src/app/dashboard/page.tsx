'use client'

import { useEffect, useState } from 'react'
import { api, type InsightReport, type Task } from '@/lib/api'

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const healthColor = (score: number) => {
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
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
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500">Analyzing team health...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load dashboard: {error}
      </div>
    </div>
  )

  const recentTasks = tasks.slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Dashboard</h1>
        <p className="text-slate-500 mt-1">AI-powered visibility into your team's workflow</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tasks', value: report?.stats.total ?? 0, color: 'text-slate-900' },
          { label: 'To Do', value: report?.stats.todo ?? 0, color: 'text-slate-600' },
          { label: 'In Progress', value: report?.stats.inProgress ?? 0, color: 'text-blue-600' },
          { label: 'Blocked', value: report?.stats.blocked ?? 0, color: 'text-orange-600' },
          { label: 'Done', value: report?.stats.done ?? 0, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Health Report */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">AI Team Health Report</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Health Score:</span>
              <span className={`text-xl font-bold ${healthColor(report?.healthScore ?? 0)}`}>
                {report?.healthScore ?? '—'}/100
              </span>
            </div>
          </div>

          {report?.summary && (
            <p className="text-slate-600 text-sm mb-4 bg-slate-50 rounded-lg p-3">{report.summary}</p>
          )}

          {(report?.blockedTasks?.length ?? 0) > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-orange-700 mb-2">Blocked Tasks</h3>
              <ul className="space-y-1">
                {report!.blockedTasks.map((t, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">●</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(report?.recommendations?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-sm font-medium text-blue-700 mb-2">AI Recommendations</h3>
              <ul className="space-y-1">
                {report!.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-1">Meeting → Tasks</h3>
            <p className="text-blue-100 text-sm mb-3">Paste meeting notes and let AI extract action items</p>
            <a href="/meetings" className="bg-white text-blue-600 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-50 transition-colors inline-block">
              Parse Meeting
            </a>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Code Review</h3>
            <p className="text-slate-500 text-sm mb-3">Get AI review on any code snippet instantly</p>
            <a href="/reviews" className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors inline-block">
              Review Code
            </a>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Completion Rate</h3>
            <div className="w-full bg-slate-200 rounded-full h-3 mt-2">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${report?.stats.completionRate ?? 0}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-1">{report?.stats.completionRate ?? 0}% tasks completed</p>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Tasks</h2>
          <a href="/tasks" className="text-sm text-blue-600 hover:underline">View all →</a>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-slate-400 text-sm">No tasks yet. <a href="/tasks" className="text-blue-600 hover:underline">Create your first task</a></p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="text-sm text-slate-900 flex-1">{task.title}</span>
                <span className="text-xs text-slate-400">{task.status.replace('_', ' ')}</span>
                {task.aiGenerated && <span className="text-xs text-blue-400">AI</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
