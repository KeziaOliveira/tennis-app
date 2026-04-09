import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '../services/supabase/client'
import { Timer } from 'lucide-react'

const Overlay = () => {
  const { matchId } = useParams()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

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

  return (
    <div className="flex flex-col gap-2 p-8 bg-transparent">
      {/* Timer Bar */}
      {match.settings?.timerEnabled && (
        <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-md px-4 py-1 rounded-t-lg border border-white/10 border-b-0 w-max self-start shadow-xl">
          <Timer className={`w-3 h-3 text-primary ${match.is_running ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-black font-mono tracking-tighter text-text">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {/* Team A Row */}
        <div className="flex items-center bg-surface/90 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 shadow-2xl h-16 w-[400px]">
          <div className="w-2 h-full bg-primary" />
          <div className="flex-1 px-4 font-black italic uppercase text-lg tracking-tighter truncate">
            Time A
          </div>
          <div className="flex h-full">
            <div className="flex flex-col items-center justify-center w-12 bg-white/5 border-l border-white/5">
                <span className="text-[10px] font-bold opacity-50">SET</span>
                <span className="font-black text-primary">{score.sets.filter((s:any) => s.a > s.b).length}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-12 bg-white/5 border-l border-white/5">
                <span className="text-[10px] font-bold opacity-50">GM</span>
                <span className="font-black text-primary">{score.games.a}</span>
            </div>
            <div className="flex items-center justify-center w-20 bg-primary/20 border-l border-primary/30">
                <span className="text-3xl font-black italic text-primary">{score.points.a}</span>
            </div>
          </div>
        </div>

        {/* Team B Row */}
        <div className="flex items-center bg-surface/90 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 shadow-2xl h-16 w-[400px]">
          <div className="w-2 h-full bg-accent" />
          <div className="flex-1 px-4 font-black italic uppercase text-lg tracking-tighter truncate">
            Time B
          </div>
          <div className="flex h-full">
            <div className="flex flex-col items-center justify-center w-12 bg-white/5 border-l border-white/5">
                <span className="text-[10px] font-bold opacity-50">SET</span>
                <span className="font-black text-accent">{score.sets.filter((s:any) => s.b > s.a).length}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-12 bg-white/5 border-l border-white/5">
                <span className="text-[10px] font-bold opacity-50">GM</span>
                <span className="font-black text-accent">{score.games.b}</span>
            </div>
            <div className="flex items-center justify-center w-20 bg-accent/20 border-l border-accent/30">
                <span className="text-3xl font-black italic text-accent">{score.points.b}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overlay
