import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { supabase } from '../services/supabase/client'
import { Timer } from 'lucide-react'
import { useTheme } from '../theme/theme-provider'

const Overlay = () => {
  const { matchId } = useParams()
  const [searchParams] = useSearchParams()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const { theme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkTheme = () => {
      if (theme === 'dark') {
        setIsDarkMode(true)
      } else if (theme === 'light') {
        setIsDarkMode(false)
      } else {
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }

    checkTheme()

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches)
      }
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [theme])

  const bgParam = searchParams.get('bg')
  const getBgClass = () => {
    if (bgParam === 'green') return 'bg-[#00FF00]'
    if (bgParam === 'pink') return 'bg-[#FF00FF]'
    if (bgParam === 'transparent') return 'bg-transparent'
    
    // Default Chroma Key background based on theme mode
    return isDarkMode ? 'bg-[#FF00FF]' : 'bg-[#00FF00]'
  }

  useEffect(() => {
    if (!matchId) return

    const fetchMatch = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()
      
      if (data) setMatch(data)
      setLoading(false)
    }

    fetchMatch()

    const channel = supabase
      .channel(`overlay-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          setMatch(payload.new)
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
    if (match?.is_running && match?.started_at) {
      interval = setInterval(() => {
        const start = new Date(match.started_at).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((now - start) / 1000)
        setElapsedSeconds((match.elapsed || 0) + diff)
      }, 1000)
    } else {
      setElapsedSeconds(match?.elapsed || 0)
    }
    return () => clearInterval(interval)
  }, [match?.is_running, match?.started_at, match?.elapsed])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || !match) return null

  const score = match.score || { sets: [], games: { a: 0, b: 0 }, points: { a: 0, b: 0 } }
  const players = match.settings?.players || { teamA: ['Time A'], teamB: ['Time B'] }

  return (
    <div className={`min-h-screen flex flex-col gap-2 p-8 ${getBgClass()} transition-colors duration-500`}>
      {/* Timer Bar */}
      {match.settings?.timerEnabled && (
        <div className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-t-xl border border-white/10 border-b-0 w-max self-start shadow-2xl">
          <Timer className={`w-3.5 h-3.5 text-primary ${match.is_running ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-black font-mono tracking-tighter text-white">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="ml-2 px-2 py-0.5 rounded bg-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">Live</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {/* Team A Row */}
        <div className="flex items-center bg-slate-900/95 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 shadow-2xl h-18 w-[450px]">
          <div className="w-2.5 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
          <div className="flex-1 px-5 flex flex-col justify-center">
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Equipe A</span>
            <div className="font-black italic uppercase text-xl tracking-tighter text-white truncate">
              {players.teamA.join(' / ')}
            </div>
          </div>
          <div className="flex h-full">
            <div className="flex flex-col items-center justify-center w-14 bg-white/5 border-l border-white/10">
                <span className="text-[10px] font-black opacity-40 text-white">SET</span>
                <span className="font-black text-xl text-primary">{score.sets.filter((s:any) => s.a > s.b).length}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-14 bg-white/5 border-l border-white/10">
                <span className="text-[10px] font-black opacity-40 text-white">GM</span>
                <span className="font-black text-xl text-primary">{score.games.a}</span>
            </div>
            <div className="flex items-center justify-center w-24 bg-primary/20 border-l border-primary/30">
                <span className="text-4xl font-black italic text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]">{score.points.a}</span>
            </div>
          </div>
        </div>

        {/* Team B Row */}
        <div className="flex items-center bg-slate-900/95 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 shadow-2xl h-18 w-[450px]">
          <div className="w-2.5 h-full bg-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />
          <div className="flex-1 px-5 flex flex-col justify-center">
            <span className="text-[10px] font-black text-accent/60 uppercase tracking-widest leading-none mb-1">Equipe B</span>
            <div className="font-black italic uppercase text-xl tracking-tighter text-white truncate">
              {players.teamB.join(' / ')}
            </div>
          </div>
          <div className="flex h-full">
            <div className="flex flex-col items-center justify-center w-14 bg-white/5 border-l border-white/10">
                <span className="text-[10px] font-black opacity-40 text-white">SET</span>
                <span className="font-black text-xl text-accent">{score.sets.filter((s:any) => s.b > s.a).length}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-14 bg-white/5 border-l border-white/10">
                <span className="text-[10px] font-black opacity-40 text-white">GM</span>
                <span className="font-black text-xl text-accent">{score.games.b}</span>
            </div>
            <div className="flex items-center justify-center w-24 bg-accent/20 border-l border-accent/30">
                <span className="text-4xl font-black italic text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]">{score.points.b}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overlay
