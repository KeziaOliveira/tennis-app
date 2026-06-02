import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../services/supabase/client'
import { ChevronLeft, Clock, Hash, Zap, Target, AlertTriangle, TrendingUp, Activity, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts'

export default function MatchStats() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [match, setMatch] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date().getTime())
  
  // Filters
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null)
  const [timeFilter, setTimeFilter] = useState<'all' | 15 | 30 | 60 | 90>('all')
  const [setFilter, setSetFilter] = useState<'all' | 1 | 2 | 3>('all')

  useEffect(() => {
    if (!matchId) return

    const fetchData = async () => {
      const [matchRes, statsRes] = await Promise.all([
        supabase.from('matches').select('*').eq('id', matchId).single(),
        supabase.from('points').select('*').eq('match_id', matchId).eq('type', 'stat').order('created_at', { ascending: true })
      ])

      if (matchRes.data) setMatch(matchRes.data)
      if (statsRes.data) setStats(statsRes.data)
      setLoading(false)
    }

    fetchData()
  }, [matchId])

  // Real-time duration updater
  useEffect(() => {
    if (match?.is_running) {
      const interval = setInterval(() => setCurrentTime(new Date().getTime()), 1000)
      return () => clearInterval(interval)
    }
  }, [match?.is_running])

  if (loading) return <div className="flex h-screen items-center justify-center font-black uppercase tracking-[0.3em] animate-pulse">Carregando Dashboard...</div>

  // Data processing
  const isDoubles = match?.settings?.type === 'doubles' || !match?.settings?.type
  const defaultTeamA = isDoubles ? ['Atleta 1 - Dupla 1', 'Atleta 2 - Dupla 1'] : ['Atleta 1 - Dupla 1']
  const defaultTeamB = isDoubles ? ['Atleta 1 - Dupla 2', 'Atleta 2 - Dupla 2'] : ['Atleta 1 - Dupla 2']

  const teamA = match?.settings?.players?.teamA?.length ? match.settings.players.teamA : defaultTeamA
  const teamB = match?.settings?.players?.teamB?.length ? match.settings.players.teamB : defaultTeamB

  const matchStartTimestamp = new Date(match?.created_at).getTime()

  // Apply filters
  const filteredStats = stats.filter(s => {
    const meta = s.metadata || {}
    
    if (setFilter !== 'all' && meta.set_number !== setFilter) return false
    
    if (timeFilter !== 'all') {
      const statTime = new Date(s.created_at).getTime()
      const diffMinutes = (statTime - matchStartTimestamp) / (1000 * 60)
      if (diffMinutes > timeFilter) return false
    }

    if (selectedPlayer) {
      if (meta.serving_player !== selectedPlayer && meta.returning_player !== selectedPlayer) return false
    } else if (selectedTeam) {
      const isTeamA = selectedTeam === 'A'
      const servingIsTeam = meta.serving_player && meta.serving_player.includes(`|${isTeamA ? 'A' : 'B'}`)
      const returningIsTeam = meta.returning_player && meta.returning_player.includes(`|${isTeamA ? 'A' : 'B'}`)
      if (!servingIsTeam && !returningIsTeam) return false
    }

    return true
  })

  // Calculate Real Duration
  const getRealDurationSeconds = () => {
    let seconds = match?.elapsed || 0
    if (match?.is_running && match?.started_at) {
       seconds += Math.floor((currentTime - new Date(match.started_at).getTime()) / 1000)
    }
    return seconds
  }
  
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const durationStr = formatTime(getRealDurationSeconds())

  // --- KPIs Calculations ---
  let totalRallies = filteredStats.length
  let totalAces = 0
  let totalWinners = 0
  let totalErrors = 0

  filteredStats.forEach(s => {
    const meta = s.metadata || {}
    const sa = meta.serving_action || ''
    const ra = meta.returning_action || ''

    if (sa === 'ACE') totalAces++
    if (sa.includes('VENC') || sa === 'ACE' || sa === 'SMASH IN') totalWinners++
    if (ra.includes('VENC') || ra === 'SMASH IN') totalWinners++
    if (sa.includes('ERRO') || sa.includes('OUT') || sa.includes('ERRADA') || sa.includes('FALTA')) totalErrors++
    if (ra.includes('ERRO') || ra.includes('OUT') || ra.includes('ERRADA') || ra.includes('FALTA')) totalErrors++
  })

  // --- Comparison Chart Data ---
  const actionStats: Record<string, { A: number, B: number }> = {}
  filteredStats.forEach(s => {
    const meta = s.metadata || {}
    const servingPlayer = meta.serving_player || ''
    const returningPlayer = meta.returning_player || ''
    const sa = meta.serving_action
    const ra = meta.returning_action

    if (sa && sa !== 'NONE') {
      if (!actionStats[sa]) actionStats[sa] = { A: 0, B: 0 }
      if (servingPlayer.includes('|A')) actionStats[sa].A -= 1
      else if (servingPlayer.includes('|B')) actionStats[sa].B += 1
    }

    if (ra && ra !== 'NONE') {
      if (!actionStats[ra]) actionStats[ra] = { A: 0, B: 0 }
      if (returningPlayer.includes('|A')) actionStats[ra].A -= 1
      else if (returningPlayer.includes('|B')) actionStats[ra].B += 1
    }
  })

  const comparisonData = Object.keys(actionStats)
    .map(action => ({
      name: action,
      A: actionStats[action].A,
      B: actionStats[action].B,
      total: Math.abs(actionStats[action].A) + actionStats[action].B
    }))
    .filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total)

  // --- Momentum Chart Data ---
  let accA = 0
  let accB = 0
  const momentumData = filteredStats.map((s, index) => {
    const meta = s.metadata || {}
    const sa = meta.serving_action || ''
    const ra = meta.returning_action || ''
    const sp = meta.serving_player || ''
    const rp = meta.returning_player || ''

    const isPositive = (action: string) => action.includes('VENC') || action === 'ACE' || action === 'SMASH IN'
    
    if (isPositive(sa)) {
      if (sp.includes('|A')) accA++
      else if (sp.includes('|B')) accB++
    }
    if (isPositive(ra)) {
      if (rp.includes('|A')) accA++
      else if (rp.includes('|B')) accB++
    }

    return {
      name: `Pt ${index + 1}`,
      'Dupla 1': accA,
      'Dupla 2': accB
    }
  })

  // --- Donut Chart Data ---
  const servingDist: Record<string, number> = {}
  filteredStats.forEach(s => {
    const sa = s.metadata?.serving_action
    if (sa && sa !== 'NONE') {
      servingDist[sa] = (servingDist[sa] || 0) + 1
    }
  })
  const donutData = Object.entries(servingDist)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const DONUT_COLORS = ['#0ea5e9', '#f59e0b', '#22c55e', '#ef4444', '#a855f7', '#ec4899', '#6366f1']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 backdrop-blur-md border border-text/10 p-3 rounded-xl shadow-xl">
          <p className="font-bold text-text mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-semibold" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name === 'A' ? 'Dupla 1' : entry.name === 'B' ? 'Dupla 2' : entry.name}:</span>
              <span>{Math.abs(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-500 text-text">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-4 rounded-[2rem] border border-text/5 shadow-xl">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/match/${matchId}`)} className="p-3 bg-text/5 hover:bg-text/10 rounded-2xl transition-all active:scale-95 border border-text/5 shadow-sm text-text">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-primary">Estatística do Jogo</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{match?.settings?.tournamentName || 'Resumo da Partida'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-2xl text-primary shadow-[0_0_15px_rgba(14,165,233,0.1)]">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="font-mono font-black text-xl tracking-tighter">{durationStr}</span>
          </div>
        </header>

        {/* Global Filters (Top Bar) */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 bg-surface p-2 rounded-[1.5rem] border border-text/5 flex flex-wrap gap-2 shadow-lg items-center">
            <button 
              onClick={() => { setSelectedPlayer(null); setSelectedTeam(null) }}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${!selectedPlayer && !selectedTeam ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text hover:bg-text/5'}`}
            >
              Visão Geral
            </button>
            <div className="w-[1px] h-6 bg-text/10 mx-1 hidden sm:block"></div>
            
            {/* Team Filters */}
            <button 
              onClick={() => { setSelectedTeam('A'); setSelectedPlayer(null) }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${selectedTeam === 'A' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9] border border-[#0ea5e9]/50' : 'text-text-muted hover:bg-text/5 border border-transparent'}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span> Dupla 1
            </button>
            <button 
              onClick={() => { setSelectedTeam('B'); setSelectedPlayer(null) }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${selectedTeam === 'B' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/50' : 'text-text-muted hover:bg-text/5 border border-transparent'}`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Dupla 2
            </button>

            {/* Set Filters */}
            <div className="flex-1"></div>
            <div className="flex bg-background rounded-xl p-1 border border-text/5">
              {(['all', 1, 2, 3] as const).map(s => (
                <button 
                  key={s}
                  onClick={() => setSetFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${setFilter === s ? 'bg-text/10 text-text' : 'text-text-muted hover:text-text'}`}
                >
                  {s === 'all' ? 'Todos' : `${s}º Set`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface/80 p-5 rounded-[2rem] border border-text/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-16 h-16" /></div>
            <div className="flex items-center gap-3 text-text-muted mb-2">
              <Hash className="w-4 h-4 text-text" />
              <h3 className="font-black uppercase text-[10px] tracking-widest">Total de Ralliés</h3>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-text">{totalRallies}</div>
          </div>

          <div className="bg-gradient-to-br from-[#0ea5e9]/10 to-transparent p-5 rounded-[2rem] border border-[#0ea5e9]/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-16 h-16 text-[#0ea5e9]" /></div>
            <div className="flex items-center gap-3 text-text-muted mb-2">
              <Zap className="w-4 h-4 text-[#0ea5e9]" />
              <h3 className="font-black uppercase text-[10px] tracking-widest">Aces</h3>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-text">{totalAces}</div>
          </div>

          <div className="bg-gradient-to-br from-[#22c55e]/10 to-transparent p-5 rounded-[2rem] border border-[#22c55e]/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-16 h-16 text-[#22c55e]" /></div>
            <div className="flex items-center gap-3 text-text-muted mb-2">
              <Target className="w-4 h-4 text-[#22c55e]" />
              <h3 className="font-black uppercase text-[10px] tracking-widest">Winners</h3>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-text">{totalWinners}</div>
          </div>

          <div className="bg-gradient-to-br from-[#ef4444]/10 to-transparent p-5 rounded-[2rem] border border-[#ef4444]/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle className="w-16 h-16 text-[#ef4444]" /></div>
            <div className="flex items-center gap-3 text-text-muted mb-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              <h3 className="font-black uppercase text-[10px] tracking-widest">Erros Não-Forçados</h3>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-text">{totalErrors}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Butterfly Comparison Chart */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-[2rem] border border-text/5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-text" />
                <h3 className="font-black uppercase italic tracking-tighter text-lg text-text">Comparação de Duplas</h3>
              </div>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-text">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0ea5e9]"></div> Dupla 1</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Dupla 2</span>
              </div>
            </div>
            
            {comparisonData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-muted italic text-sm py-12">Sem dados para os filtros selecionados.</div>
            ) : (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} horizontal={true} vertical={false} />
                    <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                      width={120} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#64748b', opacity: 0.1 }} />
                    <Bar dataKey="A" fill="#0ea5e9" stackId="stack" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="B" fill="#f59e0b" stackId="stack" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Donut Chart */}
          <div className="lg:col-span-1 bg-surface p-6 rounded-[2rem] border border-text/5 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-text" />
              <h3 className="font-black uppercase italic tracking-tighter text-lg text-text">Ações de Saque</h3>
            </div>
            
            {donutData.length === 0 ? (
               <div className="flex-1 flex items-center justify-center text-text-muted italic text-sm py-12">Sem dados de saque.</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Momentum Area Chart */}
          <div className="lg:col-span-3 bg-surface p-6 rounded-[2rem] border border-text/5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-text" />
                <h3 className="font-black uppercase italic tracking-tighter text-lg text-text">Momentum (Ações Positivas)</h3>
              </div>
            </div>

            {momentumData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-muted italic text-sm py-12">Aguardando início do jogo...</div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={momentumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#64748b', opacity: 0.1 }} />
                    <Area type="monotone" dataKey="Dupla 1" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorA)" />
                    <Area type="monotone" dataKey="Dupla 2" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
