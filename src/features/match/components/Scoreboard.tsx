import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../../../services/supabase/client'
import { useMatchStore } from '../../../store/matchStore'
import { Trophy, ChevronLeft, Share2, Timer, Settings, Activity } from 'lucide-react'
import { useTheme } from '../../../theme/theme-provider'
import { toast } from 'sonner'
import StatsModal from './StatsModal'

const Scoreboard = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const { 
    score, 
    settings, 
    timer, 
    setMatch, 
    syncWithSupabase, 
    addPoint: addPointAction,
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
    toast.success('Link do Overlay copiado!', {
      description: 'Cole no OBS como fonte de navegador.'
    })
  }

  const addPoint = async (team: 'a' | 'b') => {
     await addPointAction(team)
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando partida...</div>

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-surface">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-1">ScoreBoard BT</span>
          <div 
            onClick={() => toggleTimer()}
            className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${timer.isRunning ? 'bg-error/10 text-error' : 'bg-surface text-text-muted hover:bg-surface/50'}`}
          >
            <Timer className={`w-4 h-4 ${timer.isRunning ? 'animate-pulse' : ''}`} />
            <span className="text-lg font-black font-mono leading-none tracking-tighter">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-surface rounded-full transition-colors">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="p-2 hover:bg-surface rounded-full transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scoreboard Area */}
      <main className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-surface/20">
        {/* Team A */}
        <div className="flex-1 flex flex-col relative overflow-hidden group">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Time A</h2>
          </div>
          
          <button 
            onClick={() => addPoint('a')}
            className="flex-1 flex flex-col items-center justify-center active:bg-primary/10 transition-colors"
          >
            <span className="text-[12rem] md:text-[20rem] font-black leading-none tracking-tighter text-primary drop-shadow-2xl">
              {score?.points?.a ?? 0}
            </span>
          </button>

          <div className="p-8 flex justify-between items-end border-t border-surface/10 bg-surface/5">
             <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Games</span>
                  <span className="text-5xl font-black leading-none">{score?.games?.a ?? 0}</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-6">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Sets</span>
                  <div className="flex gap-1">
                    {(score?.sets ?? []).map((s, i) => (
                      <span key={i} className={`text-2xl font-black ${s.a > s.b ? 'text-primary' : 'text-text-muted opacity-30'}`}>{s.a}</span>
                    ))}
                    {(score?.sets ?? []).length === 0 && <span className="text-2xl font-black text-text-muted opacity-20">0</span>}
                  </div>
                </div>
             </div>
             <Trophy className="w-8 h-8 text-primary/10" />
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 flex flex-col relative overflow-hidden group bg-surface/5">
          <div className="absolute top-4 right-4 flex items-center gap-2 flex-row-reverse">
            <div className="w-2 h-8 bg-accent rounded-full" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Time B</h2>
          </div>

          <button 
            onClick={() => addPoint('b')}
            className="flex-1 flex flex-col items-center justify-center active:bg-accent/10 transition-colors"
          >
            <span className="text-[12rem] md:text-[20rem] font-black leading-none tracking-tighter text-accent drop-shadow-2xl">
              {score?.points?.b ?? 0}
            </span>
          </button>

          <div className="p-8 flex justify-between items-end border-t border-surface/10 bg-surface/5">
             <Trophy className="w-8 h-8 text-accent/10" />
             <div className="flex gap-6 text-right">
                <div className="flex flex-col items-end border-r border-white/5 pr-6">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Sets</span>
                  <div className="flex gap-1">
                    {(score?.sets ?? []).map((s, i) => (
                      <span key={i} className={`text-2xl font-black ${s.b > s.a ? 'text-accent' : 'text-text-muted opacity-30'}`}>{s.b}</span>
                    ))}
                    {(score?.sets ?? []).length === 0 && <span className="text-2xl font-black text-text-muted opacity-20">0</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Games</span>
                  <span className="text-5xl font-black leading-none">{score?.games?.b ?? 0}</span>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="p-6 bg-surface grid grid-cols-4 gap-4 border-t border-surface shadow-2xl relative z-10">
         <button 
          onClick={copyOverlayLink}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-background hover:bg-background/50 border border-surface/50 transition-all hover:scale-105"
         >
            <Share2 className="w-5 h-5 mb-1 text-primary" />
            <span className="text-[10px] uppercase font-black tracking-tighter">Overlay</span>
         </button>
         
         <button 
          onClick={() => setIsStatsOpen(true)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-background hover:bg-background/50 border border-surface/50 transition-all hover:scale-105"
         >
            <Activity className="w-5 h-5 mb-1 text-success" />
            <span className="text-[10px] uppercase font-black tracking-tighter">Stats</span>
         </button>

         <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <span className="text-sm font-black uppercase italic">Undo</span>
         </button>

         <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-background hover:bg-background/50 border border-surface/50 transition-all hover:scale-105 text-error">
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase font-black tracking-tighter">Finish</span>
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
