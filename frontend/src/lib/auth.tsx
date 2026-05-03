'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { onIdTokenChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { setTokenGetter } from './api'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTokenGetter(() => auth.currentUser?.getIdToken() ?? Promise.resolve(null))
    const unsub = onIdTokenChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleSignIn = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut(auth)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
