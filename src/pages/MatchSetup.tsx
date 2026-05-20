import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../services/supabase/client'
import { Users, User, Settings, Play, ChevronLeft, Flag } from 'lucide-react'
import { toast } from 'sonner'

export default function MatchSetup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [allPlayers, setAllPlayers] = useState<any[]>([])

  // State for form
  const [type, setType] = useState<'singles' | 'doubles'>('doubles')
  const [teamA, setTeamA] = useState({ p1: '', p2: '' })
  const [teamB, setTeamB] = useState({ p1: '', p2: '' })
  const [settings, setSettings] = useState({
    noAd: true,
    maxGames: 6,
    tiebreak: true,
    statsEnabled: true,
    timerEnabled: true
  })

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('id, name')
    if (data) setAllPlayers(data)
  }

  const getOrCreatePlayer = async (name: string) => {
    if (!name.trim()) return null
    
    // Check if player exists in our loaded list
    const existing = allPlayers.find(p => p.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id

    // Create new
    const { data, error } = await supabase
      .from('players')
      .insert({ name: name.trim() })
      .select()
      .single()
    
    if (data) return data.id
    return null
  }

  const handleStartMatch = async () => {
    setLoading(true)
    try {
      // 1. Get/Create Players
      const p1a = await getOrCreatePlayer(teamA.p1)
      const p2a = type === 'doubles' ? await getOrCreatePlayer(teamA.p2) : null
      const p1b = await getOrCreatePlayer(teamB.p1)
      const p2b = type === 'doubles' ? await getOrCreatePlayer(teamB.p2) : null

      // For now, we'll just use the first tournament available or create one
      let tournamentId = null
      const { data: tourney } = await supabase.from('tournaments').select('id').limit(1).single()
      if (tourney) tournamentId = tourney.id

      // 2. Create Match
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          status: 'live',
          settings: {
            ...settings,
            type,
            players: {
              teamA: [teamA.p1, teamA.p2].filter(Boolean),
              teamB: [teamB.p1, teamB.p2].filter(Boolean)
            }
          },
          score: {
            sets: [],
            games: { a: 0, b: 0 },
            points: { a: 0, b: 0 }
          }
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Partida iniciada com sucesso!')
      navigate(`/match/${match.id}`)
    } catch (error: any) {
      toast.error('Erro ao iniciar partida: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter cursor-default">Configurar Partida</h1>
            <p className="text-text-muted">Defina as equipes e regras do jogo</p>
          </div>
        </header>

        <section className="bg-surface rounded-3xl p-8 border border-white/5 shadow-xl space-y-8">
          {/* Game Type */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Users className="w-4 h-4" /> Tipo de Jogo
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setType('singles')}
                className={`p-4 rounded-2xl font-bold transition-all border-2 ${type === 'singles' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-transparent text-text-muted hover:bg-white/5'}`}
              >
                Simples
              </button>
              <button 
                onClick={() => setType('doubles')}
                className={`p-4 rounded-2xl font-bold transition-all border-2 ${type === 'doubles' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-transparent text-text-muted hover:bg-white/5'}`}
              >
                Dupla
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Team A */}
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Flag className="w-4 h-4" /> Time A
              </label>
              <div className="space-y-3">
                <input 
                  list="players"
                  placeholder="Jogador 1"
                  className="w-full bg-background border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                  value={teamA.p1}
                  onChange={(e) => setTeamA({ ...teamA, p1: e.target.value })}
                />
                {type === 'doubles' && (
                  <input 
                    list="players"
                    placeholder="Jogador 2"
                    className="w-full bg-background border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                    value={teamA.p2}
                    onChange={(e) => setTeamA({ ...teamA, p2: e.target.value })}
                  />
                )}
              </div>
            </div>

            {/* Team B */}
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Flag className="w-4 h-4" /> Time B
              </label>
              <div className="space-y-3">
                <input 
                  list="players"
                  placeholder="Jogador 1"
                  className="w-full bg-background border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent transition-all"
                  value={teamB.p1}
                  onChange={(e) => setTeamB({ ...teamB, p1: e.target.value })}
                />
                {type === 'doubles' && (
                  <input 
                    list="players"
                    placeholder="Jogador 2"
                    className="w-full bg-background border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent transition-all"
                    value={teamB.p2}
                    onChange={(e) => setTeamB({ ...teamB, p2: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>

          <datalist id="players">
            {allPlayers.map(p => <option key={p.id} value={p.name} />)}
          </datalist>

          {/* Settings */}
          <div className="space-y-4 pt-4 border-t border-white/5">
             <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
               <Settings className="w-4 h-4" /> Regras da Partida
             </label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => setSettings({ ...settings, noAd: !settings.noAd })}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${settings.noAd ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-transparent border-white/5 text-text-muted'}`}
                >
                  {settings.noAd ? 'No-Ad Active' : 'Advantage'}
                </button>
                <div className="flex items-center bg-background rounded-xl border border-white/5 p-1">
                   <button 
                    onClick={() => setSettings({ ...settings, maxGames: 6 })}
                    className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${settings.maxGames === 6 ? 'bg-white/10 text-text' : 'text-text-muted'}`}
                   >
                    6 Games
                   </button>
                   <button 
                    onClick={() => setSettings({ ...settings, maxGames: 8 })}
                    className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-lg transition-all ${settings.maxGames === 8 ? 'bg-white/10 text-text' : 'text-text-muted'}`}
                   >
                    8 Games
                   </button>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, statsEnabled: !settings.statsEnabled })}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${settings.statsEnabled ? 'bg-success/5 border-success/30 text-success' : 'bg-transparent border-white/5 text-text-muted'}`}
                >
                  Stats {settings.statsEnabled ? 'On' : 'Off'}
                </button>
             </div>
          </div>
        </section>

        <button 
          onClick={handleStartMatch}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground p-6 rounded-3xl font-black uppercase italic text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? 'Criando Partida...' : (
            <>
              INICIAR PARTIDA <Play className="w-6 h-6 fill-current" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
