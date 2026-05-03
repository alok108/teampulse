'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'

export function SignInGate({ children }: { children: ReactNode }) {
  const { user, loading, signIn } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold">TP</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Sign in to TeamPulse</h1>
          <p className="text-sm text-slate-500 mb-6">
            Use your Google account to access the team dashboard.
          </p>
          <button
            onClick={() => {
              signIn().catch((err) => {
                console.error('sign-in failed', err)
              })
            }}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
