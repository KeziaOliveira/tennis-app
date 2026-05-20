import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { Plus, Play, Share2, LogOut, User, BarChart3, Timer, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/>
  </svg>
)

const MatchCard = ({ match, onRefresh }: { match: any, onRefresh: () => void }) => {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let interval: any
    if (match.is_running && match.started_at) {
      interval = setInterval(() => {
        const start = new Date(match.started_at).getTime()
        const now = new Date().getTime()
        const diff = Math.floor((now - start) / 1000)
        setElapsed((match.elapsed || 0) + diff)
      }, 1000)
    } else {
      setElapsed(match.elapsed || 0)
    }
    return () => clearInterval(interval)
  }, [match.is_running, match.started_at, match.elapsed])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const copyOverlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    const link = `${window.location.origin}/overlay/${match.id}`
    navigator.clipboard.writeText(link)
    toast.success('Link do Overlay copiado!')
  }

  const finishMatch = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente finalizar esta partida?')) return
    
    await supabase.from('matches').update({ 
      status: 'finished', 
      is_running: false,
      paused_at: new Date().toISOString()
    }).eq('id', match.id)
    
    onRefresh()
    toast.success('Partida finalizada!')
  }

  return (
    <div 
      className="group relative bg-surface p-6 rounded-3xl border border-surface/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-xl"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-1">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-max ${match.status === 'live' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
             {match.status}
          </span>
          <div className="flex items-center gap-1.5 text-text-muted mt-1">
             <Timer className="w-3 h-3" />
             <span className="text-xs font-mono font-bold">{formatTime(elapsed)}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copyOverlay} className="p-2 hover:bg-background rounded-xl transition-colors text-primary" title="Copiar Overlay">
            <Share2 className="w-4 h-4" />
          </button>
          {match.status === 'live' && (
            <button onClick={finishMatch} className="p-2 hover:bg-background rounded-xl transition-colors text-error" title="Finalizar Partida">
              <TrophyIcon className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
         <div className="text-center flex-1">
            <p className="text-[10px] font-black uppercase text-text-muted mb-1 truncate">
              {match.settings?.players?.teamA?.join(' / ') || 'Time A'}
            </p>
            <p className="text-4xl font-black text-primary">
              {match.score?.games?.a ?? match.score?.teamA?.games ?? 0}
            </p>
         </div>
         <div className="px-4 text-text-muted font-black italic opacity-20">VS</div>
         <div className="text-center flex-1">
            <p className="text-[10px] font-black uppercase text-text-muted mb-1 truncate">
              {match.settings?.players?.teamB?.join(' / ') || 'Time B'}
            </p>
            <p className="text-4xl font-black text-accent">
              {match.score?.games?.b ?? match.score?.teamB?.games ?? 0}
            </p>
         </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest pt-4 border-t border-white/5">
        <span>
          Sets: {match.score?.sets?.filter((s:any) => s.a > s.b).length ?? match.score?.teamA?.sets ?? 0} 
          - {match.score?.sets?.filter((s:any) => s.b > s.a).length ?? match.score?.teamB?.sets ?? 0}
        </span>
        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}/stats`); }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
           >
              <BarChart3 className="w-3 h-3" />
           </button>
           <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Play className="w-3 h-3 text-primary fill-primary" />
           </button>
        </div>
      </div>
    </div>
  )
}

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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-surface pb-8">
        <div className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center w-full">
             <div className="flex items-center gap-3 bg-surface px-5 py-2.5 rounded-2xl border border-white/5 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                   <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] leading-none mb-1">Operador</span>
                   <span className="text-sm font-black truncate max-w-[200px] leading-none">{user?.email?.split('@')[0]}</span>
                </div>
             </div>
             <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-text-muted hover:text-error transition-all p-3 hover:bg-error/5 rounded-2xl"
                title="Sair"
             >
                <LogOut className="w-5 h-5" />
             </button>
          </div>
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Dashboard</h1>
            <p className="text-base text-text-muted font-medium">Controle central de torneio</p>
          </div>
        </div>
        <button 
          onClick={createMatch}
          className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-3xl font-black uppercase italic shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap text-lg"
        >
          <Plus className="w-6 h-6" />
          Novo Evento
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-text-muted font-bold italic animate-pulse">Sincronizando partidas...</div>
        ) : matches.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-surface bg-surface/5">
            <TrophyIcon className="mx-auto h-16 w-16 text-surface mb-6 opacity-20 fill-current" />
            <p className="text-text-muted font-black uppercase tracking-widest italic">Nenhuma partida registrada</p>
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard key={match.id} match={match} onRefresh={fetchMatches} />
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
