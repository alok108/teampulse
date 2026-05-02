'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

const EXAMPLE_NOTES = `Sprint planning meeting - May 2, 2026

Attendees: Alok, Priya, Dev, Sanjay

Discussion:
- We need to fix the login timeout bug that users have been reporting. Priya will handle this by end of week.
- The mobile app needs dark mode support. Dev will start this on Monday.
- Database migration for the new schema should be done before the release next Thursday. Sanjay owns this.
- We agreed to move to weekly releases instead of bi-weekly.
- Need to write API documentation for the new endpoints. Alok will do this.
- Performance testing should happen before any production deploy going forward.`

interface ParseResult {
  meetingId: string
  summary: string
  keyDecisions: string[]
  actionItems: { title: string; ownerName: string | null; priority: string }[]
  tasksCreated: number
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

export default function MeetingsPage() {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.parseMeeting(notes)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Meeting → Tasks</h1>
        <p className="text-slate-700 mt-1">Paste your meeting notes or Slack thread. AI extracts action items and creates tasks automatically.</p>
      </header>

      <form onSubmit={handleParse} className="space-y-4" aria-label="Parse meeting notes">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <label htmlFor="meeting-notes" className="text-sm font-medium text-slate-800">
              Meeting Notes
            </label>
            <button
              type="button"
              onClick={() => setNotes(EXAMPLE_NOTES)}
              className="text-xs text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1"
            >
              Load example
            </button>
          </div>
          <textarea
            id="meeting-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Paste meeting notes, Slack thread, or any conversation text here..."
            className="w-full p-4 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset resize-none h-52"
            disabled={loading}
            aria-describedby="notes-help"
          />
          <p id="notes-help" className="sr-only">AI will extract action items and create tasks for them</p>
        </div>

        <button
          type="submit"
          disabled={loading || !notes.trim()}
          className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Extracting action items...
            </>
          ) : 'Extract Tasks with AI'}
        </button>
        {loading && (
          <div role="status" aria-live="polite" className="sr-only">
            AI is analyzing your meeting notes and extracting action items
          </div>
        )}
      </form>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800 text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-4" aria-live="polite">
          <section
            aria-labelledby="summary-heading"
            className="bg-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <h2 id="summary-heading" className="font-semibold text-blue-900 mb-1">AI Summary</h2>
            <p className="text-sm text-blue-900">{result.summary}</p>
          </section>

          {result.keyDecisions.length > 0 && (
            <section
              aria-labelledby="decisions-heading"
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <h2 id="decisions-heading" className="font-semibold text-slate-900 mb-2">Key Decisions</h2>
              <ul className="space-y-1">
                {result.keyDecisions.map((d, i) => (
                  <li key={i} className="text-sm text-slate-800 flex items-start gap-2">
                    <span className="text-slate-600 mt-0.5 shrink-0" aria-hidden="true">•</span>{d}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="actions-heading"
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="actions-heading" className="font-semibold text-slate-900">
                Action Items ({result.actionItems.length})
              </h2>
              <span className="text-sm text-green-700 font-medium" aria-label={`${result.tasksCreated} tasks were created automatically`}>
                {result.tasksCreated} tasks created
              </span>
            </div>
            <ul className="space-y-2" role="list">
              {result.actionItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityColors[item.priority] ?? ''}`}
                    aria-label={`Priority: ${item.priority}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-sm text-slate-900 flex-1">{item.title}</span>
                  {item.ownerName && (
                    <span
                      className="text-xs text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full shrink-0"
                      aria-label={`Owner: ${item.ownerName}`}
                    >
                      @{item.ownerName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-3">
            <a
              href="/tasks"
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              View All Tasks
            </a>
            <button
              type="button"
              onClick={() => { setResult(null); setNotes('') }}
              className="border border-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Parse Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
