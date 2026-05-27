import { Routes, Route, Navigate } from 'react-router'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import MatchSetup from './pages/MatchSetup'
import MatchStats from './pages/MatchStats'
import Scoreboard from './features/match/components/Scoreboard'
import Overlay from './pages/Overlay'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { Toaster } from 'sonner'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text transition-colors duration-300">
      <Toaster position="top-center" richColors />
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/" 
          element={session ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/match/setup" 
          element={session ? <MatchSetup /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/match/:matchId" 
          element={session ? <Scoreboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/match/:matchId/stats" 
          element={session ? <MatchStats /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/overlay/:matchId" 
          element={<Overlay />} 
        />
      </Routes>
    </div>
  )
}

export default App
