import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { supabase } from '../services/supabase/client'
import { Timer } from 'lucide-react'

const BG_MAP: Record<string, string> = {
  green:       '#00FF00',
  magenta:     '#FF00FF',
  blue:        '#0000FF',
  cyan:        '#00FFFF',
  pink:        '#FF00FF', // legacy alias
}

const Overlay = () => {
  const { matchId } = useParams()
  const [searchParams] = useSearchParams()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const bgParam = searchParams.get('bg') || 'green'
  const isTransparent = bgParam === 'transparent'
  const bgStyle = isTransparent ? {} : { backgroundColor: BG_MAP[bgParam] || '#00FF00' }

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
  const countries = match.settings?.players?.countries
  const flag = (code: string) => code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')

  return (
    <div className="min-h-screen p-8 flex items-start justify-start" style={bgStyle}>
      <div className="flex flex-col">
        
        {/* Timer - only visible if showFullStats is NOT true */}
        {!match?.settings?.showFullStats && (
          <div className="bg-[#FFF100] px-3 py-1 flex items-center gap-2 w-max mb-1 border-b-2 border-r-2 border-[#0B3B60]">
            <Timer className="w-5 h-5 text-black" />
            <span className="text-black font-black text-xl tracking-tighter">
              {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {match?.settings?.showFullStats ? (
           /* Full Match Summary Scoreboard (End of Match) */
           <div className="flex flex-col bg-[#0B3B60] border-2 border-white w-[600px] shadow-2xl">
             <div className="bg-white px-4 py-2 text-center">
               <h2 className="text-[#0B3B60] font-black uppercase text-xl">Estatísticas Finais da Partida</h2>
             </div>
             <div className="flex flex-col bg-[#0B3B60]">
               {match.settings?.fullStatsData?.map((stat: any, i: number) => (
                 <div key={stat.label} className={`flex text-center py-2 ${i % 2 === 0 ? 'bg-black/10' : ''}`}>
                    <div className="w-1/4 font-black text-lg text-white">{stat.valA}</div>
                    <div className="w-2/4 font-black text-sm uppercase tracking-widest text-white/90">{stat.label}</div>
                    <div className="w-1/4 font-black text-lg text-white">{stat.valB}</div>
                 </div>
               ))}
             </div>
             <div className="bg-[#FFF100] px-4 py-2 text-center">
                <span className="text-black font-black uppercase tracking-widest">{match.settings?.tournamentName || 'TORNEIO'}</span>
             </div>
           </div>
        ) : (
          /* Normal or Doubles Scoreboard Container */
          <div className="flex flex-col w-[600px] shadow-2xl">
             
             {/* TEAM A ROW */}
             <div className="flex items-stretch justify-between bg-[#0B3B60] border-2 border-white border-b-0 h-[64px]">
               <div className="flex flex-1 items-center">
                 {/* Colors */}
                 <div className="flex flex-col gap-1 px-2 h-full justify-center">
                   <div className="w-6 h-5 bg-[#00B050]" />
                   <div className="w-6 h-5 bg-[#FF7C2A]" />
                 </div>
                 {/* Names */}
                 <div className="flex flex-col justify-center px-2 py-1 leading-none">
                   <span className="text-white font-black text-xl uppercase tracking-tighter font-sans">
                     {countries?.teamA?.[0] && <span className="mr-1">{flag(countries.teamA[0])}</span>}{players.teamA[0]}
                   </span>
                   {players.teamA[1] && (
                     <span className="text-white font-black text-xl uppercase tracking-tighter font-sans mt-0.5">
                       {countries?.teamA?.[1] && <span className="mr-1">{flag(countries.teamA[1])}</span>}{players.teamA[1]}
                     </span>
                   )}
                 </div>
               </div>

               {/* Right Side Stats / Points */}
               <div className="flex items-center pr-1 gap-1">
                 {match?.settings?.activeStatPanel?.type === 'doubles' ? (
                   <div className="h-[56px] min-w-[200px] flex items-center justify-center bg-white rounded-sm px-4">
                     <span className="text-[#0B3B60] font-black text-[28px] tracking-tighter">{match.settings.activeStatPanel.teamAValue}</span>
                   </div>
                 ) : (
                   <>
                     {/* Serving Indicator */}
                     <div className="px-2">
                       <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                         <div className="w-4 h-4 border-2 border-[#0B3B60] rounded-full opacity-50" />
                       </div>
                     </div>
                     <div className="h-[56px] w-[56px] flex items-center justify-center bg-[#FFF100] rounded-sm">
                       <span className="text-black font-black text-4xl">{score.points.a}</span>
                     </div>
                     <div className="h-[56px] w-[48px] flex items-center justify-center bg-[#0B3B60] border-2 border-white rounded-sm">
                       <span className="text-white font-black text-4xl">{score.games.a}</span>
                     </div>
                     <div className="h-[56px] w-[48px] flex items-center justify-center bg-white rounded-sm">
                       <span className="text-[#0B3B60] font-black text-4xl">{score.sets.filter((s:any) => s.a > s.b).length}</span>
                     </div>
                   </>
                 )}
               </div>
             </div>

             {/* TEAM B ROW */}
             <div className="flex items-stretch justify-between bg-[#0B3B60] border-2 border-white h-[64px]">
               <div className="flex flex-1 items-center">
                 {/* Colors */}
                 <div className="flex flex-col gap-1 px-2 h-full justify-center">
                   <div className="w-6 h-5 bg-[#00B0F0]" />
                   <div className="w-6 h-5 bg-[#7030A0]" />
                 </div>
                 {/* Names */}
                 <div className="flex flex-col justify-center px-2 py-1 leading-none">
                   <span className="text-white font-black text-xl uppercase tracking-tighter font-sans">
                     {countries?.teamB?.[0] && <span className="mr-1">{flag(countries.teamB[0])}</span>}{players.teamB[0]}
                   </span>
                   {players.teamB[1] && (
                     <span className="text-white font-black text-xl uppercase tracking-tighter font-sans mt-0.5">
                       {countries?.teamB?.[1] && <span className="mr-1">{flag(countries.teamB[1])}</span>}{players.teamB[1]}
                     </span>
                   )}
                 </div>
               </div>

               {/* Right Side Stats / Points */}
               <div className="flex items-center pr-1 gap-1">
                 {match?.settings?.activeStatPanel?.type === 'doubles' ? (
                   <div className="h-[56px] min-w-[200px] flex items-center justify-center bg-white rounded-sm px-4">
                     <span className="text-[#0B3B60] font-black text-[28px] tracking-tighter">{match.settings.activeStatPanel.teamBValue}</span>
                   </div>
                 ) : (
                   <>
                     <div className="px-2 w-10"></div> {/* Empty space for serve indicator */}
                     <div className="h-[56px] w-[56px] flex items-center justify-center bg-[#FFF100] rounded-sm">
                       <span className="text-black font-black text-4xl">{score.points.b}</span>
                     </div>
                     <div className="h-[56px] w-[48px] flex items-center justify-center bg-[#0B3B60] border-2 border-white rounded-sm">
                       <span className="text-white font-black text-4xl">{score.games.b}</span>
                     </div>
                     <div className="h-[56px] w-[48px] flex items-center justify-center bg-white rounded-sm">
                       <span className="text-[#0B3B60] font-black text-4xl">{score.sets.filter((s:any) => s.b > s.a).length}</span>
                     </div>
                   </>
                 )}
               </div>
             </div>

             {/* Yellow Banner (Messages, Individual Stats, or Doubles Stat Name) */}
             {(match?.settings?.activeStatPanel?.type === 'doubles' || match?.settings?.activeStatPanel?.type === 'individual' || !!match?.settings?.activeMessage) && (
               <div className="bg-[#FFF100] px-4 py-1.5 w-full flex items-center justify-between border-2 border-t-0 border-white">
                 <span className="text-black font-black uppercase text-2xl tracking-tighter font-sans">
                   {match?.settings?.activeStatPanel?.type === 'doubles' && match.settings.activeStatPanel.statLabel}
                   {match?.settings?.activeStatPanel?.type === 'individual' && `${match.settings.activeStatPanel.statLabel} - ${match.settings.activeStatPanel.player}`}
                   {!!match?.settings?.activeMessage && match.settings.activeMessage}
                 </span>
                 {match?.settings?.activeStatPanel?.type === 'individual' && (
                   <span className="text-black font-black uppercase text-2xl tracking-tighter font-sans">
                     {match.settings.activeStatPanel.value}
                   </span>
                 )}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Overlay
