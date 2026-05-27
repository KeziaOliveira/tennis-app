import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../../../services/supabase/client'
import { useMatchStore } from '../../../store/matchStore'
import { ChevronLeft, Share2, Timer, Settings, Activity } from 'lucide-react'
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
    toggleTimer 
  } = useMatchStore()
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

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
    if (!confirm('Finalizar partida definitivamente?')) return
    await finishMatch()
    toast.success('Partida finalizada!')
    navigate('/')
  }

  const handleUndo = async () => {
    await undoLastPoint()
    toast.success('Último ponto removido')
  }

  const players = settings?.players || { teamA: ['Time A'], teamB: ['Time B'] }

  if (loading) return <div className="flex h-screen items-center justify-center font-black animate-pulse uppercase tracking-[0.3em]">Sincronizando...</div>

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-surface bg-surface/30 backdrop-blur-md sticky top-0 z-20">
        <button onClick={() => navigate('/')} className="p-3 hover:bg-surface rounded-2xl transition-all active:scale-90">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1 opacity-50">
            {settings?.tournamentName || 'Arena Central'}
          </span>
          <div 
            onClick={() => status !== 'finished' && toggleTimer()}
            className={`flex items-center gap-3 px-5 py-2 rounded-2xl cursor-pointer transition-all border shadow-lg ${timer.isRunning ? 'bg-primary/10 border-primary/50 text-primary shadow-primary/10' : 'bg-surface border-white/5 text-text-muted hover:bg-surface/50'}`}
          >
            <Timer className={`w-4 h-4 ${timer.isRunning ? 'animate-pulse text-primary' : ''}`} />
            <span className="text-xl font-black font-mono leading-none tracking-tighter">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="p-3 hover:bg-surface rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5 fill-current text-accent" />
            ) : (
              <MoonIcon className="w-5 h-5 fill-current text-secondary" />
            )}
          </button>
          <button className="p-3 hover:bg-surface rounded-2xl transition-colors">
            <Settings className="w-5 h-5 opacity-40" />
          </button>
        </div>
      </header>

      {/* Main Scoreboard Area */}
      <main className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface/20">
        {/* Team A */}
        <div className="flex-1 flex flex-col relative overflow-hidden group">
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="w-2.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter truncate max-w-[300px]">
              {players.teamA.join(' / ')}
            </h2>
          </div>
          
          <button 
            onClick={() => addPointAction('a')}
            disabled={status === 'finished'}
            className="flex-1 flex flex-col items-center justify-center active:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <span className="text-[12rem] md:text-[22rem] font-black leading-none tracking-tighter text-primary drop-shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]">
              {score?.points?.a ?? 0}
            </span>
          </button>

          <div className="p-8 flex justify-between items-end border-t border-surface/10 bg-surface/5">
             <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Games</span>
                  <span className="text-6xl font-black leading-none">{score?.games?.a ?? 0}</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-8">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Sets</span>
                  <div className="flex gap-2">
                    {(score?.sets ?? []).map((s, i) => (
                      <span key={i} className={`text-3xl font-black ${s.a > s.b ? 'text-primary' : 'text-text-muted opacity-20'}`}>{s.a}</span>
                    ))}
                    {(score?.sets ?? []).length === 0 && <span className="text-3xl font-black text-text-muted opacity-10">0</span>}
                  </div>
                </div>
             </div>
             <TrophyIcon className="w-10 h-10 text-primary/5 fill-current" />
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 flex flex-col relative overflow-hidden group bg-surface/5">
          <div className="absolute top-6 right-6 flex items-center gap-3 flex-row-reverse text-right">
            <div className="w-2.5 h-10 bg-accent rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter truncate max-w-[300px]">
              {players.teamB.join(' / ')}
            </h2>
          </div>

          <button 
            onClick={() => addPointAction('b')}
            disabled={status === 'finished'}
            className="flex-1 flex flex-col items-center justify-center active:bg-accent/10 transition-colors disabled:opacity-50"
          >
            <span className="text-[12rem] md:text-[22rem] font-black leading-none tracking-tighter text-accent drop-shadow-[0_20px_50px_rgba(var(--accent-rgb),0.3)]">
              {score?.points?.b ?? 0}
            </span>
          </button>

          <div className="p-8 flex justify-between items-end border-t border-surface/10 bg-surface/5">
             <TrophyIcon className="w-10 h-10 text-accent/5 fill-current" />
             <div className="flex gap-8 text-right">
                <div className="flex flex-col items-end border-r border-white/5 pr-8">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Sets</span>
                  <div className="flex gap-2">
                    {(score?.sets ?? []).map((s, i) => (
                      <span key={i} className={`text-3xl font-black ${s.b > s.a ? 'text-accent' : 'text-text-muted opacity-20'}`}>{s.b}</span>
                    ))}
                    {(score?.sets ?? []).length === 0 && <span className="text-3xl font-black text-text-muted opacity-10">0</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1 opacity-50">Games</span>
                  <span className="text-6xl font-black leading-none">{score?.games?.b ?? 0}</span>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-4 bg-surface grid grid-cols-4 gap-6 border-t border-surface shadow-[0_-20px_60px_rgba(0,0,0,0.3)] relative z-20">
         <button 
          onClick={copyOverlayLink}
          className="flex flex-col items-center justify-center p-4 rounded-3xl bg-background hover:bg-background/80 border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-lg"
         >
            <Share2 className="w-6 h-6 mb-2 text-primary" />
            <span className="text-[10px] uppercase font-black tracking-widest leading-none">Overlay</span>
         </button>
         
         <button 
          onClick={() => setIsStatsOpen(true)}
          className="flex flex-col items-center justify-center p-4 rounded-3xl bg-background hover:bg-background/80 border border-white/5 transition-all hover:scale-105 active:scale-95 shadow-lg"
         >
            <Activity className="w-6 h-6 mb-2 text-success" />
            <span className="text-[10px] uppercase font-black tracking-widest leading-none">Stats</span>
         </button>

         <button 
            onClick={handleUndo}
            disabled={status === 'finished'}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-800 text-white shadow-xl border border-white/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
         >
            <span className="text-lg font-black uppercase italic tracking-tighter">Resetar placar</span>
         </button>

         <button 
            onClick={handleFinish}
            disabled={status === 'finished'}
            className="flex flex-col items-center justify-center p-4 rounded-3xl bg-background hover:bg-error/10 border border-error/20 transition-all hover:scale-105 active:scale-95 text-error shadow-xl disabled:opacity-20"
         >
            <TrophyIcon className="w-6 h-6 mb-2 fill-current" />
            <span className="text-[10px] uppercase font-black tracking-widest leading-none">Finish</span>
         </button>
      </footer>

      {matchId && (
        <StatsModal 
          matchId={matchId} 
          isOpen={isStatsOpen} 
          onClose={() => setIsStatsOpen(false)} 
        />
      )}
    </div>
  )
}

export default Scoreboard
