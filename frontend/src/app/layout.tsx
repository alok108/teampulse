import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TeamPulse — AI Team Coordination',
  description: 'AI-powered team coordination that transforms meetings into tasks and surfaces bottlenecks before they become missed deadlines.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TP</span>
            </div>
            <span className="font-semibold text-slate-900 text-lg">TeamPulse</span>
            <span className="text-xs text-slate-400 ml-1">by PromptWars Chennai</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
            <a href="/tasks" className="hover:text-blue-600 transition-colors">Tasks</a>
            <a href="/meetings" className="hover:text-blue-600 transition-colors">Meetings</a>
            <a href="/reviews" className="hover:text-blue-600 transition-colors">Code Reviews</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
