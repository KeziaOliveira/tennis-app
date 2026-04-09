import { useState } from 'react'
import { supabase } from '../services/supabase/client'
import { Trophy } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(error.message)
    else setMessage('Verifique seu e-mail!')
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-surface p-8 shadow-2xl border border-surface/50">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-black italic uppercase tracking-tighter">ScoreBoard BT</h2>
          <p className="mt-2 text-sm text-text-muted">Gestão profissional de placares</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              required
              className="w-full rounded-2xl bg-background border-none p-4 text-sm focus:ring-2 focus:ring-primary transition-all"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full rounded-2xl bg-background border-none p-4 text-sm focus:ring-2 focus:ring-primary transition-all"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && <p className="text-center text-xs text-error">{message}</p>}

          <div className="flex flex-col gap-3">
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-2xl bg-primary p-4 text-sm font-black uppercase italic text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Entrar
            </button>
            <button
              disabled={loading}
              onClick={handleSignUp}
              type="button"
              className="w-full rounded-2xl bg-surface p-4 text-sm font-black uppercase italic text-text border border-surface-foreground/10 hover:bg-surface/50 transition-all"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
