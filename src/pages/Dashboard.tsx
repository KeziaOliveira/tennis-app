import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { Plus, LogOut, BarChart3, Timer, User as UserIcon, Settings } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { toast } from 'sonner'

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

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M451.5 160C434.9 160 418.8 164.5 404.7 172.7C388.9 156.7 370.5 143.3 350.2 133.2C378.4 109.2 414.3 96 451.5 96C537.9 96 608 166 608 252.5C608 294 591.5 333.8 562.2 363.1L491.1 434.2C461.8 463.5 422 480 380.5 480C294.1 480 224 410 224 323.5C224 322 224 320.5 224.1 319C224.6 301.3 239.3 287.4 257 287.9C274.7 288.4 288.6 303.1 288.1 320.8C288.1 321.7 288.1 322.6 288.1 323.4C288.1 374.5 329.5 415.9 380.6 415.9C405.1 415.9 428.6 406.2 446 388.8L517.1 317.7C534.4 300.4 544.2 276.8 544.2 252.3C544.2 201.2 502.8 159.8 451.7 159.8zM307.2 237.3C305.3 236.5 303.4 235.4 301.7 234.2C289.1 227.7 274.7 224 259.6 224C235.1 224 211.6 233.7 194.2 251.1L123.1 322.2C105.8 339.5 96 363.1 96 387.6C96 438.7 137.4 480.1 188.5 480.1C205 480.1 221.1 475.7 235.2 467.5C251 483.5 269.4 496.9 289.8 507C261.6 530.9 225.8 544.2 188.5 544.2C102.1 544.2 32 474.2 32 387.7C32 346.2 48.5 306.4 77.8 277.1L148.9 206C178.2 176.7 218 160.2 259.5 160.2C346.1 160.2 416 230.8 416 317.1C416 318.4 416 319.7 416 321C415.6 338.7 400.9 352.6 383.2 352.2C365.5 351.8 351.6 337.1 352 319.4C352 318.6 352 317.9 352 317.1C352 283.4 334 253.8 307.2 237.5z" />
  </svg>
)

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/>
  </svg>
)

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z"/>
  </svg>
)

const IconBtn = ({
  onClick,
  label,
  color = 'default',
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  label: string
  color?: 'default' | 'primary' | 'error'
  children: React.ReactNode
}) => {
  const colorCls =
    color === 'primary' ? 'text-primary hover:bg-primary/10 hover:text-primary' :
    color === 'error'   ? 'text-error hover:bg-error/10 hover:text-error' :
                          'text-text-muted hover:bg-white/8 hover:text-text'
  return (
    <div className="relative group/tip">
      <button
        onClick={onClick}
        className={`p-2 rounded-xl transition-all cursor-pointer hover:scale-110 active:scale-90 ${colorCls}`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded-lg bg-surface border border-text/10 shadow-lg text-[9px] font-bold text-text-muted whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
        {label}
      </span>
    </div>
  )
}

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
    const bg = localStorage.getItem('scoreboard-bt-overlay') || 'green'
    const link = `${window.location.origin}/overlay/${match.id}?bg=${bg}`
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

  const deleteMatch = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja realmente apagar esta partida permanentemente?')) return

    try {
      // First delete dependent points
      await supabase.from('points').delete().eq('match_id', match.id)
      
      // Then delete the match itself
      const { error } = await supabase.from('matches').delete().eq('id', match.id)
      if (error) throw error

      onRefresh()
      toast.success('Partida removida!')
    } catch (err: any) {
      toast.error('Erro ao apagar a partida: ' + (err.message || err))
    }
  }

  return (
    <div
      className="group relative bg-surface p-6 rounded-3xl border border-surface/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-xl"
      onClick={() => navigate(`/match/${match.id}`)}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Left: Tournament Name and Timer */}
        <div className="flex flex-col gap-1.5 min-w-0 pr-2">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-70 truncate">
            {match.settings?.tournamentName || 'Arena Central'}
          </span>
          <div className="flex items-center gap-1.5 text-text-muted">
             <Timer className="w-3.5 h-3.5" />
             <span className="text-xs font-mono font-bold">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Right: Badge only */}
        <div className="flex items-center justify-end">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center ${match.status === 'live' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
            {match.status === 'live' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-2"></span>
                {match.status}
              </>
            ) : (
              match.status
            )}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
         <div className="text-center flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-text-muted mb-1 truncate">
              {match.settings?.players?.teamA?.join(' / ') || 'Time A'}
            </p>
            <p className="text-4xl font-black text-primary">
              {match.score?.games?.a ?? match.score?.teamA?.games ?? 0}
            </p>
         </div>
         <div className="px-4 text-text-muted font-black italic opacity-20">VS</div>
         <div className="text-center flex-1 min-w-0">
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
          {' - '}{match.score?.sets?.filter((s:any) => s.b > s.a).length ?? match.score?.teamB?.sets ?? 0}
        </span>
        <div className="flex gap-0.5">
          <IconBtn onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.id}/stats`) }} label="Estatísticas">
            <BarChart3 className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn onClick={copyOverlay} label="Copiar Overlay" color="primary">
            <LinkIcon className="w-3.5 h-3.5 fill-current" />
          </IconBtn>
          {match.status === 'live' && (
            <IconBtn onClick={finishMatch} label="Finalizar Partida" color="error">
              <TrophyIcon className="w-3.5 h-3.5 fill-current" />
            </IconBtn>
          )}
          <IconBtn onClick={deleteMatch} label="Apagar Partida" color="error">
            <TrashIcon className="w-3.5 h-3.5 fill-current" />
          </IconBtn>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showSavedStatsOnly, setShowSavedStatsOnly] = useState(false)
  const navigate = useNavigate()
  const [selectedStat, setSelectedStat] = useState<any>(null)

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
    const { data } = await supabase
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
    <div className="min-h-screen bg-background">
      {/* ── Premium sticky top bar ── */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-surface/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <TrophyIcon className="w-5 h-5 fill-current text-primary" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-text">Scoreboard<span className="text-primary">BT</span></span>
          </div>

          {/* Right: user pill + settings gear + logout */}
          <div className="flex items-center gap-1">
            {/* User pill (display only) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-white/5 mr-1">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-black truncate max-w-[120px]">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
              </span>
            </div>

            {/* Settings gear — navigates to /settings page */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2.5 hover:bg-surface rounded-xl transition-all hover:scale-105 active:scale-95 text-text-muted hover:text-primary"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-text-muted hover:text-error hover:bg-error/5 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Page title & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Dashboard</h1>
            <p className="text-base text-text-muted font-medium">Controle central de partidas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowSavedStatsOnly(!showSavedStatsOnly)}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-3xl font-black uppercase italic transition-all ${
                showSavedStatsOnly 
                  ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg shadow-primary/20' 
                  : 'bg-surface text-text border-2 border-surface-foreground/5 hover:border-surface-foreground/20'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              {showSavedStatsOnly ? 'TODAS AS PARTIDAS' : 'ESTATÍSTICAS SALVAS'}
            </button>
            <button
              onClick={createMatch}
              className="flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-3xl font-black uppercase italic shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap text-lg"
            >
              <Plus className="w-6 h-6" />
              Nova Partida
            </button>
          </div>
        </div>

        {/* Matches / Stats Grid */}
        {!showSavedStatsOnly ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full py-20 text-center text-text-muted font-bold italic animate-pulse">Sincronizando partidas...</div>
            ) : matches.length === 0 ? (
              <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-surface bg-surface/5">
                <TrophyIcon className="mx-auto h-16 w-16 text-surface mb-6 opacity-20 fill-current" />
                <p className="text-text-muted font-black uppercase tracking-widest italic">
                   Nenhuma partida registrada
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard key={match.id} match={match} onRefresh={fetchMatches} />
              ))
            )}
          </div>
        ) : (
          <div className="bg-surface border border-text/10 rounded-3xl overflow-hidden shadow-xl">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-text/5 border-b border-text/10 text-text-muted text-[10px] font-black uppercase tracking-widest">
                       <th className="px-6 py-4">Torneio</th>
                       <th className="px-6 py-4">Data</th>
                       <th className="px-6 py-4">Duração</th>
                       <th className="px-6 py-4">Placar</th>
                       <th className="px-6 py-4">Métrica Salva</th>
                       <th className="px-6 py-4">Contexto</th>
                       <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-text/5 text-sm font-semibold">
                    {matches.flatMap(m => (m.settings?.saved_stats || []).map((s: any) => ({ match: m, stat: s }))).length === 0 ? (
                       <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-text-muted italic font-bold">Nenhuma estatística salva encontrada.</td>
                       </tr>
                    ) : (
                       matches.flatMap(m => (m.settings?.saved_stats || []).map((s: any) => ({ match: m, stat: s }))).map(({match, stat}: any, idx) => {
                          const date = new Date(match.created_at).toLocaleDateString()
                          
                          // Format elapsed time
                          const elapsed = match.elapsed || 0
                          const mins = Math.floor(elapsed / 60)
                          const secs = elapsed % 60
                          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

                          return (
                            <tr key={`${match.id}-${stat.id}-${idx}`} className="hover:bg-text/5 transition-colors group cursor-pointer" onClick={() => setSelectedStat({ match, stat })}>
                               <td className="px-6 py-4 font-black italic uppercase text-primary truncate max-w-[150px]">{match.settings?.tournamentName || 'Partida Sem Nome'}</td>
                               <td className="px-6 py-4 text-text-muted">{date}</td>
                               <td className="px-6 py-4 font-mono">{timeStr}</td>
                               <td className="px-6 py-4 font-black">
                                  <span className="text-primary">{match.score?.games?.a ?? match.score?.teamA?.games ?? 0}</span>
                                  <span className="mx-1 text-text-muted opacity-50">x</span>
                                  <span className="text-accent">{match.score?.games?.b ?? match.score?.teamB?.games ?? 0}</span>
                               </td>
                               <td className="px-6 py-4 font-black text-text uppercase">{stat.label}</td>
                               <td className="px-6 py-4 text-text-muted uppercase text-xs truncate max-w-[200px]">{stat.context}</td>
                               <td className="px-6 py-4 text-right">
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedStat({ match, stat }); }} className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-black uppercase hover:bg-primary/20 transition-all">Ver</button>
                               </td>
                            </tr>
                          )
                       })
                    )}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>

      {/* Selected Stat Modal */}
      {selectedStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-surface w-full max-w-lg rounded-[2rem] border border-text/10 shadow-2xl p-8 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-black italic uppercase text-text">Estatística Salva</h2>
                 <button onClick={() => setSelectedStat(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-text/5 hover:bg-text/10 text-text transition-colors">✕</button>
              </div>
              
              <div className="space-y-4">
                 <div className="bg-text/5 p-4 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Torneio / Partida</p>
                    <p className="font-bold text-lg text-primary">{selectedStat.match.settings?.tournamentName || 'Partida Sem Nome'}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-text/5 p-4 rounded-xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Métrica</p>
                       <p className="font-black text-xl text-text">{selectedStat.stat.label}</p>
                    </div>
                    <div className="bg-text/5 p-4 rounded-xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Data Salva</p>
                       <p className="font-bold text-text">{new Date(selectedStat.stat.timestamp).toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="bg-text/5 p-4 rounded-xl border border-primary/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Contexto e Valor</p>
                    <div className="flex justify-between items-end">
                       <p className="font-black italic uppercase text-text max-w-[60%]">{selectedStat.stat.context}</p>
                       <p className="text-4xl font-black text-primary">{selectedStat.stat.value}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex justify-end">
                 <button onClick={() => setSelectedStat(null)} className="px-6 py-3 bg-text/10 hover:bg-text/20 rounded-xl font-black uppercase text-sm transition-colors">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
