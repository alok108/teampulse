'use client'

import { useEffect, useState } from 'react'
import { api, type CodeReview } from '@/lib/api'

const EXAMPLE_CODE = `async function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id;
  const result = await db.execute(query);
  console.log("Got user: " + JSON.stringify(result));
  return result[0];
}

// Called with: getUser(req.params.id)`

const severityColors: Record<string, string> = {
  ERROR: 'bg-red-50 border-red-200 text-red-800',
  WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  INFO: 'bg-blue-50 border-blue-200 text-blue-800',
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export default function ReviewsPage() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [result, setResult] = useState<CodeReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<CodeReview[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getReviews().then(setHistory).catch(() => {})
  }, [])

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const review = await api.reviewCode(code, language)
      setResult(review)
      setHistory(h => [review, ...h])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to run code review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Code Review</h1>
        <p className="text-slate-500 mt-1">Paste any code snippet and get instant AI-powered review with quality score, issues, and suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <form onSubmit={handleReview} className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="text-sm bg-transparent focus:outline-none text-slate-700"
              >
                {['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'other'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCode(EXAMPLE_CODE)}
                className="text-xs text-blue-600 hover:underline"
              >
                Load vulnerable example
              </button>
            </div>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full p-4 text-sm font-mono text-slate-700 focus:outline-none resize-none h-64 bg-slate-900 text-green-400"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reviewing code...
              </>
            ) : 'Run AI Code Review'}
          </button>
        </form>

        {/* Result */}
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
          )}

          {result && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`text-4xl font-bold px-4 py-2 rounded-xl ${scoreColor(result.qualityScore)}`}>
                  {result.qualityScore}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Quality Score</div>
                  <div className="text-sm text-slate-500">out of 100</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-medium text-slate-900 mb-2">Overall Feedback</h3>
                <p className="text-sm text-slate-600">{result.overallFeedback}</p>
              </div>

              {result.issues.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Issues ({result.issues.length})</h3>
                  <div className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <div key={i} className={`border rounded-lg p-3 text-sm ${severityColors[issue.severity] ?? ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{issue.severity}</span>
                          <span className="text-xs opacity-75">{issue.type}</span>
                          <span className="text-xs opacity-60 ml-auto">{issue.file}</span>
                        </div>
                        <p>{issue.message}</p>
                        {issue.suggestion && (
                          <p className="mt-1 opacity-80 italic">Suggestion: {issue.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {history.length > 0 && !result && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-medium text-slate-900 mb-3">Recent Reviews</h3>
              <div className="space-y-2">
                {history.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-700">{r.repoName === 'direct-review' ? 'Direct review' : r.repoName}</span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${scoreColor(r.qualityScore)}`}>{r.qualityScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
