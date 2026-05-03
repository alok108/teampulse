'use client'

import { useAuth } from '@/lib/auth'

export function NavUser() {
  const { user, signOut } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
      <span className="text-xs text-slate-500 hidden sm:block">{user.email ?? user.displayName}</span>
      <button
        onClick={() => {
          signOut().catch((err) => {
            console.error('sign-out failed', err)
          })
        }}
        className="text-xs text-slate-600 hover:text-blue-600 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
