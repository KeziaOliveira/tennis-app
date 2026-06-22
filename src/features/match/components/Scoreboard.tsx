import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../../../services/supabase/client'
import { useMatchStore } from '../../../store/matchStore'
import { ChevronLeft, Timer, Settings, Activity, BarChart3, RotateCcw, Menu, X } from 'lucide-react'
import { useTheme } from '../../../theme/theme-provider'
import { toast } from 'sonner'
import StatsModal from './StatsModal'

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M320 32C328.4 32 336.3 36.4 340.6 43.7L396.1 136.3L500.9 110C509.1 108 517.8 110.4 523.7 116.3C529.6 122.2 532 131 530 139.1L503.7 243.8L596.4 299.3C603.6 303.6 608.1 311.5 608.1 319.9C608.1 328.3 603.7 336.2 596.4 340.5L503.7 396.1L530 500.8C532 509 529.6 517.7 523.6 523.6C517.8 529.5 509 532 500.9 530L396.2 503.7L340.7 596.4C336.4 603.6 328.5 608.1 320.1 608.1C311.7 608.1 303.8 603.7 299.5 596.4L243.9 503.7L139.2 530C131 532 122.4 529.6 116.4 523.7C110.4 517.8 108 509 110 500.8L136.2 396.1L43.6 340.6C36.4 336.2 32 328.4 32 320C32 311.6 36.4 303.7 43.7 299.4L136.3 243.9L110 139.1C108 130.9 110.3 122.3 116.3 116.3C122.3 110.3 131 108 139.2 110L243.9 136.2L299.4 43.6L301.2 41C305.7 35.3 312.6 31.9 320 31.9zM320 176C240.5 176 176 240.5 176 320C176 399.5 240.5 464 320 464C399.5 464 464 399.5 464 320C464 240.5 399.5 176 320 176zM320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320C416 373 373 416 320 416z" />
  </svg>
)

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C388.8 576 451.3 548.8 497.3 504.6C504.6 497.6 506.7 486.7 502.6 477.5C498.5 468.3 488.9 462.6 478.8 463.4C473.9 463.8 469 464 464 464C362.4 464 280 381.6 280 280C280 207.9 321.5 145.4 382.1 115.2C391.2 110.7 396.4 100.9 395.2 90.8C394 80.7 386.6 72.5 376.7 70.3C358.4 66.2 339.4 64 320 64z" />
  </svg>
)

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/>
  </svg>
)

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z"/>
  </svg>
)

const Scoreboard = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const { 
    score, 
    settings, 
    status,
    timer, 
    setMatch, 
    syncWithSupabase, 
    addPoint: addPointAction,
    undoLastPoint,
    finishMatch,
    toggleTimer,
    resetTimer
  } = useMatchStore()
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [servingTeam, setServingTeam] = useState<'a' | 'b' | null>(null)
  const [confirmModal, setConfirmModal] = useState<'reset' | 'finish' | 'timer' | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleServe = (team: 'a' | 'b', e: React.MouseEvent) => {
    e.stopPropagation()
    setServingTeam(prev => prev === team ? null : team)
  }

  useEffect(() => {
    if (!matchId) return

    const initMatch = async () => {
      await setMatch(matchId)
      setLoading(false)
    }

    initMatch()

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          syncWithSupabase(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  // Timer Effect
  useEffect(() => {
    let interval: any
    if (timer.isRunning && timer.startedAt) {
      interval = setInterval(() => {
        const start = new Date(timer.startedAt!).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((now - start) / 1000)
        setElapsedSeconds(timer.elapsed + diff)
      }, 1000)
    } else {
      setElapsedSeconds(timer.elapsed)
    }
    return () => clearInterval(interval)
  }, [timer.isRunning, timer.startedAt, timer.elapsed])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyOverlayLink = () => {
    const link = `${window.location.origin}/overlay/${matchId}`
    navigator.clipboard.writeText(link)
    toast.success('Link do Overlay copiado!')
  }

  const handleFinish = async () => {
    await finishMatch()
    toast.success('Partida finalizada!')
    navigate('/')
  }

  const handleUndo = async () => {
    await undoLastPoint()
    toast.success('Último ponto removido')
  }

  const handleResetTimer = async () => {
    await resetTimer()
    toast.success('Timer zerado')
  }

  const players = settings?.players || { teamA: ['Time A'], teamB: ['Time B'] }
  const countries = settings?.players?.countries
  const flag = (code: string) => code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
  const displayPts = (pts: number) => pts === 41 ? 'AD' : (pts ?? 0)

  if (loading) return <div className="flex h-screen items-center justify-center font-black animate-pulse uppercase tracking-[0.3em]">Sincronizando...</div>

  return (
    <div className="flex flex-col bg-background overflow-hidden select-none" style={{ height: '100dvh', minHeight: 0 }}>
      {/* Header */}
      <header className="shrink-0 bg-surface/30 backdrop-blur-md border-b border-surface sticky top-0 z-20">
        {/* Linha 1: título */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-surface/50">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-surface rounded-xl transition-all active:scale-90 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[11px] font-black text-primary uppercase tracking-[0.25em] opacity-60 truncate">
            {settings?.tournamentName || 'Arena Central'}
          </span>
        </div>

        {/* Linha 2: controles */}
        <div className="flex items-center gap-2 px-3 py-2">
          {settings?.timerEnabled !== false ? (
            <>
              <div
                onClick={() => status !== 'finished' && toggleTimer()}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl cursor-pointer transition-all border flex-1 ${timer.isRunning ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-surface border-text/5 text-text-muted hover:bg-surface/60'}`}
              >
                <Timer className={`w-4 h-4 shrink-0 ${timer.isRunning ? 'animate-pulse' : ''}`} />
                <span className="text-base font-black font-mono leading-none tracking-tighter text-text">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <button
                onClick={() => setConfirmModal('timer')}
                className="p-2 rounded-xl cursor-pointer transition-all border bg-error/10 border-error/20 text-error hover:bg-error/20 active:scale-90 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-surface rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5 fill-current text-accent" />
            ) : (
              <MoonIcon className="w-5 h-5 fill-current text-secondary" />
            )}
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 hover:bg-surface rounded-xl transition-colors active:scale-90 shrink-0">
            <Settings className="w-5 h-5 opacity-40" />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-surface rounded-xl transition-colors active:scale-90 shrink-0">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scoreboard Area */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface/20 relative">
        {/* Active Message Banner */}
        {settings?.activeMessage && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-95 fade-in duration-300 w-full max-w-xl px-4 pointer-events-none">
            <div className="bg-[#FFEA00]/90 backdrop-blur-md text-black/90 font-black uppercase italic tracking-tighter text-2xl md:text-3xl py-3 px-8 text-center rounded-2xl shadow-[0_10px_40px_rgba(255,234,0,0.3)] border border-[#FFEA00]/50">
              {settings.activeMessage}
            </div>
          </div>
        )}
        {/* Team A */}
        <div className="flex-1 min-h-0 flex flex-row relative overflow-hidden">
          {/* Info column (esquerda) */}
          <div className="flex flex-col px-4 pt-4 pb-4 justify-between w-2/5 min-w-0">
            <div className="flex flex-col gap-1.5">
              {players.teamA.map((name: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] shrink-0" />
                  {countries?.teamA?.[i] && (
                    <span className="text-base leading-none shrink-0">{flag(countries.teamA[i])}</span>
                  )}
                  <span className="font-black uppercase italic tracking-tighter text-text text-base md:text-xl truncate">
                    {name}
                  </span>
                </div>
              ))}
              {settings?.saqueEnabled !== false && (
                <button
                  onClick={(e) => toggleServe('a', e)}
                  className={`mt-1 self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                    servingTeam === 'a'
                      ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_rgba(var(--primary-rgb),0.2)]'
                      : 'bg-transparent text-text-muted/40 border-text/8 hover:text-text-muted hover:border-text/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full transition-colors ${servingTeam === 'a' ? 'bg-primary' : 'bg-text-muted/20'}`} />
                  Saque
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Games</span>
                <span className="text-3xl md:text-5xl font-black leading-none text-text">{score?.games?.a ?? 0}</span>
              </div>
              <div className="flex flex-col border-l border-text/5 pl-3">
                <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Sets</span>
                <div className="flex gap-1.5">
                  {(score?.sets ?? []).map((s, i) => (
                    <span key={i} className={`text-xl md:text-3xl font-black ${s.a > s.b ? 'text-primary' : 'text-text-muted opacity-20'}`}>{s.a}</span>
                  ))}
                  {(score?.sets ?? []).length === 0 && <span className="text-xl md:text-3xl font-black text-text-muted opacity-10">0</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Score button (direita) */}
          <button
            onClick={() => addPointAction('a')}
            disabled={status === 'finished'}
            className="flex-1 flex items-center justify-center active:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <span className="text-[6rem] sm:text-[9rem] md:text-[11rem] lg:text-[17rem] font-black leading-none tracking-tighter text-primary drop-shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]">
              {displayPts(score?.points?.a ?? 0)}
            </span>
          </button>
        </div>

        {/* Team B */}
        <div className="flex-1 min-h-0 flex flex-row relative overflow-hidden bg-surface/5">
          {/* Score button (esquerda — espelho do time A) */}
          <button
            onClick={() => addPointAction('b')}
            disabled={status === 'finished'}
            className="flex-1 flex items-center justify-center active:bg-accent/10 transition-colors disabled:opacity-50"
          >
            <span className="text-[6rem] sm:text-[9rem] md:text-[11rem] lg:text-[17rem] font-black leading-none tracking-tighter text-accent drop-shadow-[0_20px_50px_rgba(var(--accent-rgb),0.3)]">
              {displayPts(score?.points?.b ?? 0)}
            </span>
          </button>

          {/* Info column (direita) */}
          <div className="flex flex-col px-4 pt-4 pb-4 justify-between w-2/5 min-w-0 items-end">
            <div className="flex flex-col gap-1.5 items-end">
              {players.teamB.map((name: string, i: number) => (
                <div key={i} className="flex items-center gap-2 flex-row-reverse">
                  <div className="w-2 h-6 bg-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] shrink-0" />
                  {countries?.teamB?.[i] && (
                    <span className="text-base leading-none shrink-0">{flag(countries.teamB[i])}</span>
                  )}
                  <span className="font-black uppercase italic tracking-tighter text-text text-base md:text-xl truncate">
                    {name}
                  </span>
                </div>
              ))}
              {settings?.saqueEnabled !== false && (
                <button
                  onClick={(e) => toggleServe('b', e)}
                  className={`mt-1 self-end flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${
                    servingTeam === 'b'
                      ? 'bg-accent/15 text-accent border-accent/30 shadow-[0_0_8px_rgba(var(--accent-rgb),0.2)]'
                      : 'bg-transparent text-text-muted/40 border-text/8 hover:text-text-muted hover:border-text/20'
                  }`}
                >
                  Saque
                  <span className={`w-2 h-2 rounded-full transition-colors ${servingTeam === 'b' ? 'bg-accent' : 'bg-text-muted/20'}`} />
                </button>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <div className="flex flex-col items-end border-r border-text/5 pr-3">
                <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Sets</span>
                <div className="flex gap-1.5">
                  {(score?.sets ?? []).map((s, i) => (
                    <span key={i} className={`text-xl md:text-3xl font-black ${s.b > s.a ? 'text-accent' : 'text-text-muted opacity-20'}`}>{s.b}</span>
                  ))}
                  {(score?.sets ?? []).length === 0 && <span className="text-xl md:text-3xl font-black text-text-muted opacity-10">0</span>}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Games</span>
                <span className="text-3xl md:text-5xl font-black leading-none text-text">{score?.games?.b ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>


      {matchId && (
        <StatsModal
          matchId={matchId}
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          settings={settings}
          currentSet={(score?.sets?.length || 0) + 1}
        />
      )}

      {/* Hamburger Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[2rem] border-t border-text/10 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-text/15" />
            </div>
            <div className="flex items-center justify-between px-6 pt-2 pb-3">
              <h2 className="text-sm font-black uppercase italic tracking-tighter">Ações</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-text/5 rounded-full transition-colors">
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>
            <div className="px-4 space-y-1.5" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => { copyOverlayLink(); setIsMenuOpen(false) }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-background hover:bg-background/60 border border-text/5 transition-all active:scale-[0.98]"
              >
                <LinkIcon className="w-5 h-5 fill-current text-primary shrink-0" />
                <span className="font-black uppercase text-sm tracking-tight">Copiar link do overlay</span>
              </button>

              {settings?.statsEnabled !== false && (
                <button
                  onClick={() => { setIsStatsOpen(true); setIsMenuOpen(false) }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-background hover:bg-background/60 border border-text/5 transition-all active:scale-[0.98]"
                >
                  <Activity className="w-5 h-5 text-success shrink-0" />
                  <span className="font-black uppercase text-sm tracking-tight">Estatísticas</span>
                </button>
              )}

              <button
                onClick={() => { navigate(`/match/${matchId}/stats`); setIsMenuOpen(false) }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-background hover:bg-background/60 border border-text/5 transition-all active:scale-[0.98]"
              >
                <BarChart3 className="w-5 h-5 text-accent shrink-0" />
                <span className="font-black uppercase text-sm tracking-tight">Análises</span>
              </button>

              <div className="h-px bg-text/8 my-1" />

              <button
                onClick={() => { setConfirmModal('reset'); setIsMenuOpen(false) }}
                disabled={status === 'finished'}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-background hover:bg-text/5 border border-text/5 transition-all active:scale-[0.98] disabled:opacity-30"
              >
                <RotateCcw className="w-5 h-5 text-text-muted shrink-0" />
                <span className="font-black uppercase text-sm tracking-tight">Resetar placar</span>
              </button>

              <button
                onClick={() => { setConfirmModal('finish'); setIsMenuOpen(false) }}
                disabled={status === 'finished'}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-error/10 hover:bg-error/20 border border-error/20 transition-all active:scale-[0.98] text-error disabled:opacity-30"
              >
                <TrophyIcon className="w-5 h-5 fill-current shrink-0" />
                <span className="font-black uppercase text-sm tracking-tight">Finalizar partida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="bg-surface w-full max-w-sm rounded-[2rem] border border-text/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${confirmModal === 'finish' || confirmModal === 'timer' ? 'bg-error/10' : 'bg-text/5'}`}>
                {confirmModal === 'finish'
                  ? <TrophyIcon className="w-8 h-8 fill-current text-error" />
                  : confirmModal === 'timer'
                  ? <RotateCcw className="w-7 h-7 text-error" />
                  : <RotateCcw className="w-7 h-7 text-text-muted" />
                }
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-text mb-2">
                {confirmModal === 'finish' ? 'Finalizar Partida' : confirmModal === 'timer' ? 'Zerar Timer' : 'Resetar Placar'}
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {confirmModal === 'finish'
                  ? 'A partida será encerrada definitivamente. Esta ação não pode ser revertida.'
                  : confirmModal === 'timer'
                  ? 'O cronômetro será zerado e pausado. As estatísticas da partida não serão afetadas.'
                  : 'O placar registrado será reiniciado. Esta ação não pode ser desfeita.'
                }
              </p>
            </div>

            <div className="flex gap-3 px-8 pb-8">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl bg-text/5 hover:bg-text/10 text-text font-black uppercase text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const action = confirmModal
                  setConfirmModal(null)
                  if (action === 'finish') {
                    await handleFinish()
                  } else if (action === 'timer') {
                    await handleResetTimer()
                  } else {
                    await handleUndo()
                  }
                }}
                className={`flex-1 py-3 rounded-xl font-black uppercase text-sm transition-all shadow-lg ${
                  confirmModal === 'finish' || confirmModal === 'timer'
                    ? 'bg-error hover:bg-error/90 text-white shadow-error/20'
                    : 'bg-text/80 hover:bg-text text-background shadow-text/10'
                }`}
              >
                {confirmModal === 'finish' ? 'Finalizar' : confirmModal === 'timer' ? 'Zerar' : 'Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scoreboard
