import { useState } from 'react'
import { supabase } from '../services/supabase/client'
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/>
  </svg>
)

const Login = () => {
  const [isRegister, setIsRegister] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.')
          setIsForgotPassword(false)
        }
      } else if (isRegister) {
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres.')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        })

        if (error) {
          toast.error(error.message)
        } else if (data?.user && !data?.session) {
          toast.info('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.')
          setIsRegister(false)
        } else {
          toast.success('Conta criada e conectada com sucesso!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          toast.error(error.message)
        } else {
          toast.success('Bem-vindo de volta!')
        }
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-surface p-8 shadow-2xl border border-surface-foreground/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:rotate-6 transition-transform duration-300">
            <TrophyIcon className="h-8 w-8 fill-current" />
          </div>
          <h2 className="mt-6 text-3xl font-black italic uppercase tracking-tighter text-text">
            {isForgotPassword ? 'Recuperar Senha' : <>Scoreboard<span className="text-primary">BT</span></>}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {isForgotPassword ? 'Digite seu e-mail para receber as instruções' : 'Gestão profissional de placares'}
          </p>
        </div>

        {/* Tab Selection (Hidden during password recovery) */}
        {!isForgotPassword && (
          <div className="flex p-1 bg-background rounded-2xl border border-surface-foreground/5 relative z-10">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                toast.dismiss()
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase italic tracking-wider rounded-xl transition-all ${
                !isRegister
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true)
                toast.dismiss()
              }}
              className={`flex-1 py-2.5 text-xs font-black uppercase italic tracking-wider rounded-xl transition-all ${
                isRegister
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        <form className="mt-6 space-y-5 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isRegister && !isForgotPassword && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required={isRegister}
                  className="w-full rounded-2xl bg-background border border-surface-foreground/5 py-4 pl-11 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Nome do Operador"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                className="w-full rounded-2xl bg-background border border-surface-foreground/5 py-4 pl-11 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {!isForgotPassword && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-muted">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full rounded-2xl bg-background border border-surface-foreground/5 py-4 pl-11 pr-12 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {!isRegister && !isForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  toast.dismiss()
                }}
                className="text-xs font-black uppercase italic tracking-wider text-primary hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase italic text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>
                {isForgotPassword
                  ? 'Enviar E-mail'
                  : isRegister
                  ? 'Criar Minha Conta'
                  : 'Entrar no Sistema'}
              </span>
            )}
          </button>

          {isForgotPassword && (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false)
                toast.dismiss()
              }}
              className="w-full text-center text-xs font-black uppercase italic tracking-wider text-text-muted hover:text-text cursor-pointer mt-4"
            >
              Voltar para o login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default Login
