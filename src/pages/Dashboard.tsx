import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { Plus, Trophy, Play, MoreVertical, LogOut, User, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const Dashboard = () => {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
    fetchMatches()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setMatches(data)
    setLoading(false)
  }

  const createMatch = () => {
    navigate('/match/setup')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-end border-b border-surface pb-6">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between items-center w-full mb-4">
             <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-2xl border border-surface-foreground/5 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                   <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Usuário</span>
                   <span className="text-xs font-black truncate max-w-[150px]">{user?.email}</span>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-text-muted hover:text-error transition-colors p-2"
                title="Sair"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Dashboard</h1>
            <p className="text-text-muted">Gerencie suas partidas ao vivo</p>
          </div>
        </div>
        <button 
          onClick={createMatch}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Nova Partida
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-text-muted">Carregando partidas...</div>
        ) : matches.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-surface">
            <Trophy className="mx-auto h-12 w-12 text-surface mb-4" />
            <p className="text-text-muted italic">Nenhuma partida encontrada.</p>
          </div>
        ) : (
          matches.map((match) => (
            <div 
              key={match.id}
              className="group relative bg-surface p-6 rounded-3xl border border-surface/50 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => navigate(`/match/${match.id}`)}
            >
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${match.status === 'live' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                   {match.status}
                </span>
                <button className="p-1 hover:bg-background rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center mb-8">
                 <div className="text-center flex-1">
                    <p className="text-xs font-bold uppercase text-text-muted mb-1">Time A</p>
                    <p className="text-3xl font-black text-primary">
                      {match.score?.games?.a ?? match.score?.teamA?.games ?? 0}
                    </p>
                 </div>
                 <div className="px-4 text-text-muted font-black italic">VS</div>
                 <div className="text-center flex-1">
                    <p className="text-xs font-bold uppercase text-text-muted mb-1">Time B</p>
                    <p className="text-3xl font-black text-accent">
                      {match.score?.games?.b ?? match.score?.teamB?.games ?? 0}
                    </p>
                 </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span>
                  Sets: {match.score?.sets?.filter((s:any) => s.a > s.b).length ?? match.score?.teamA?.sets ?? 0} 
                  - {match.score?.sets?.filter((s:any) => s.b > s.a).length ?? match.score?.teamB?.sets ?? 0}
                </span>
                <div className="flex gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}/stats`); }}
                    className="p-2 hover:bg-white/5 rounded-lg"
                   >
                      <BarChart3 className="w-3 h-3" />
                   </button>
                   <Play className="w-3 h-3 text-primary fill-primary" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
