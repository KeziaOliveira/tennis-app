import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../services/supabase/client'
import { Trophy, ChevronLeft, Activity, Users, BarChart3 } from 'lucide-react'

export default function MatchStats() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [match, setMatch] = useState<any>(null)

  useEffect(() => {
    if (!matchId) return

    const fetchData = async () => {
      const [matchRes, statsRes] = await Promise.all([
        supabase.from('matches').select('*').eq('id', matchId).single(),
        supabase.from('points').select('*').eq('match_id', matchId)
      ])

      if (matchRes.data) setMatch(matchRes.data)
      if (statsRes.data) setStats(statsRes.data)
      setLoading(false)
    }

    fetchData()
  }, [matchId])

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando estatísticas...</div>

  // Basic calculation logic
  const totalPoints = stats.filter(s => s.type === 'stat' || s.type === 'point').length
  const strokeCounts = stats.reduce((acc: any, s: any) => {
    if (s.stroke_type) {
      acc[s.stroke_type] = (acc[s.stroke_type] || 0) + 1
    }
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(`/match/${matchId}`)} className="p-2 hover:bg-surface rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Estatísticas</h1>
            <p className="text-text-muted">Desempenho da Partida</p>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Card */}
          <div className="md:col-span-1 bg-surface rounded-3xl p-6 border border-white/5 space-y-4">
             <div className="flex items-center gap-3 text-primary mb-6">
                <BarChart3 className="w-6 h-6" />
                <h3 className="font-black uppercase italic">Resumo Geral</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                   <span className="text-xs font-bold text-text-muted uppercase">Total de Pontos</span>
                   <span className="text-2xl font-black">{totalPoints}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                   <span className="text-xs font-bold text-text-muted uppercase">Duração</span>
                   <span className="text-2xl font-black">{match?.elapsed || 0}s</span>
                </div>
             </div>
          </div>

          {/* Stroke Distribution */}
          <div className="md:col-span-2 bg-surface rounded-3xl p-6 border border-white/5">
             <div className="flex items-center gap-3 text-success mb-6">
                <Activity className="w-6 h-6" />
                <h3 className="font-black uppercase italic">Distribuição de Jogadas</h3>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(strokeCounts).map(([type, count]: [string, any]) => (
                  <div key={type} className="bg-background rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase text-text-muted mb-1">{type.replace('_', ' ')}</span>
                    <span className="text-3xl font-black text-primary">{count}</span>
                  </div>
                ))}

                {Object.keys(strokeCounts).length === 0 && (
                   <div className="col-span-full py-10 text-center text-text-muted italic text-sm">
                      Nenhuma estatística detalhada registrada ainda.
                   </div>
                )}
             </div>
          </div>
        </main>
      </div>
    </div>
  )
}
