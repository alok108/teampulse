import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { SignInGate } from '@/components/SignInGate'
import { NavUser } from '@/components/NavUser'

export const metadata: Metadata = {
  title: 'TeamPulse — AI Team Coordination',
  description: 'AI-powered team coordination that transforms meetings into tasks and surfaces bottlenecks before they become missed deadlines.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Skip to main content
          </a>
          <header>
            <nav
              aria-label="Main navigation"
              className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">TP</span>
                </div>
                <span className="font-semibold text-slate-900 text-lg">TeamPulse</span>
                <span className="text-xs text-slate-600 ml-1">built at PromptWars Chennai by Alok Kumar</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-700">
                <ul className="flex items-center gap-6" role="list">
                  <li>
                    <a href="/dashboard" className="hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1 py-0.5">
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="/tasks" className="hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1 py-0.5">
                      Tasks
                    </a>
                  </li>
                  <li>
                    <a href="/meetings" className="hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1 py-0.5">
                      Meetings
                    </a>
                  </li>
                  <li>
                    <a href="/reviews" className="hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded px-1 py-0.5">
                      Code Reviews
                    </a>
                  </li>
                </ul>
                <NavUser />
              </div>
            </nav>
          </header>
          <main id="main-content">
            <SignInGate>{children}</SignInGate>
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
