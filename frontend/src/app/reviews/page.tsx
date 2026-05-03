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
  ERROR: 'bg-red-50 border-red-300 text-red-900',
  WARNING: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  INFO: 'bg-blue-50 border-blue-300 text-blue-900',
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-700 bg-green-50'
  if (score >= 60) return 'text-yellow-800 bg-yellow-50'
  return 'text-red-700 bg-red-50'
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
      <header>
        <h1 className="text-2xl font-bold text-slate-900">AI Code Review</h1>
        <p className="text-slate-700 mt-1">Paste any code snippet and get instant AI-powered review with quality score, issues, and suggestions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleReview} className="space-y-3" aria-label="Code review form">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <label htmlFor="language-select" className="sr-only">Programming language</label>
              <select
                id="language-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="text-sm bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded text-slate-900"
                aria-label="Select programming language"
              >
                {['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'other'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCode(EXAMPLE_CODE)}
                className="text-xs text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1"
              >
                Load vulnerable example
              </button>
            </div>
            <label htmlFor="code-input" className="sr-only">Code to review</label>
            <textarea
              id="code-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full p-4 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset resize-none h-64 bg-slate-900 text-green-400"
              disabled={loading}
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                Reviewing code...
              </>
            ) : 'Run AI Code Review'}
          </button>
          {loading && (
            <div role="status" aria-live="polite" className="sr-only">
              AI is analyzing your code for quality, security, and performance issues
            </div>
          )}
        </form>

        <div className="space-y-3" aria-live="polite">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800 text-sm">{error}</div>
          )}

          {result && (
            <>
              <section
                aria-labelledby="score-heading"
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`text-4xl font-bold px-4 py-2 rounded-xl ${scoreColor(result.qualityScore)}`}
                  role="meter"
                  aria-valuenow={result.qualityScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Code quality score: ${result.qualityScore} out of 100`}
                >
                  {result.qualityScore}
                </div>
                <div>
                  <h2 id="score-heading" className="font-semibold text-slate-900">Quality Score</h2>
                  <p className="text-sm text-slate-700">out of 100</p>
                </div>
              </section>

              <section
                aria-labelledby="feedback-heading"
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <h3 id="feedback-heading" className="font-medium text-slate-900 mb-2">Overall Feedback</h3>
                <p className="text-sm text-slate-800">{result.overallFeedback}</p>
              </section>

              {result.issues.length > 0 && (
                <section
                  aria-labelledby="issues-heading"
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <h3 id="issues-heading" className="font-medium text-slate-900 mb-3">
                    Issues ({result.issues.length})
                  </h3>
                  <ul className="space-y-2" role="list">
                    {result.issues.map((issue, i) => (
                      <li
                        key={i}
                        className={`border rounded-lg p-3 text-sm ${severityColors[issue.severity] ?? ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" aria-label={`Severity: ${issue.severity}`}>
                            {issue.severity}
                          </span>
                          <span className="text-xs opacity-90">{issue.type}</span>
                          <span className="text-xs opacity-80 ml-auto">{issue.file}</span>
                        </div>
                        <p>{issue.message}</p>
                        {issue.suggestion && (
                          <p className="mt-1 opacity-90 italic">
                            <span className="font-medium not-italic">Suggestion: </span>
                            {issue.suggestion}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}

          {history.length > 0 && !result && (
            <section
              aria-labelledby="history-heading"
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <h3 id="history-heading" className="font-medium text-slate-900 mb-3">Recent Reviews</h3>
              <ul className="space-y-2" role="list">
                {history.slice(0, 5).map(r => (
                  <li key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-800">
                      {r.repoName === 'direct-review' ? 'Direct review' : r.repoName}
                    </span>
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded ${scoreColor(r.qualityScore)}`}
                      aria-label={`Quality score: ${r.qualityScore} out of 100`}
                    >
                      {r.qualityScore}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
