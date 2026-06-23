import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { supabase } from '../services/supabase/client'
import { ChevronLeft, Clock, Hash, Zap, Target, AlertTriangle, TrendingUp, Activity, Users, MessageSquare, Bookmark } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts'
import { toast } from 'sonner'
import { useMatchStore } from '../store/matchStore'
import { useTheme } from '../theme/theme-provider'

// Action strings exactly as recorded by StatsModal
const WINNER_SA = new Set(['ACE', 'WINNER', 'SMASH IN', 'LOB VENCEDOR', 'CURTA VENCEDORA', 'ACELERADA'])
const WINNER_RA = new Set(['WINNER', 'WINNER DEVOL.', 'SMASH IN', 'LOB VENC.', 'CURTA VENC.', 'ACELERADA'])
const ERROR_SA  = new Set(['ERRO SAQUE', 'E.N.F.', 'SMASH OUT', 'LOB FORA', 'CURTA ERRADA'])
const ERROR_RA  = new Set(['ERRO DEVOL.', 'E.N.F.', 'SMASH OUT', 'LOB FORA', 'CURTA ERRADA'])

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
  
  // Messages state
  const [showMessages, setShowMessages] = useState(false)
  const { setActiveMessage } = useMatchStore()
  const { colorTheme, theme } = useTheme()
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9')
  const [accentColor, setAccentColor] = useState('#f59e0b')

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    setPrimaryColor(style.getPropertyValue('--color-primary').trim() || '#0ea5e9')
    setAccentColor(style.getPropertyValue('--color-accent').trim() || '#f59e0b')
  }, [colorTheme, theme])

  useEffect(() => {
    if (!matchId) return

    const fetchData = async () => {
      const [matchRes, statsRes] = await Promise.all([
        supabase.from('matches').select('*').eq('id', matchId).single(),
        supabase.from('points').select('*').eq('match_id', matchId).in('type', ['stat', 'message']).order('created_at', { ascending: true })
      ])

      if (matchRes.data) setMatch(matchRes.data)
      if (statsRes.data) setStats(statsRes.data)
      setLoading(false)
    }

    fetchData()

    // Real-time subscription to keep match settings in sync
    const channel = supabase
      .channel(`matchstats-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => { setMatch(payload.new) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
  const teamLabelA = isDoubles ? 'Dupla 1' : 'Time A'
  const teamLabelB = isDoubles ? 'Dupla 2' : 'Time B'
  const defaultTeamA = isDoubles ? ['Atleta 1 - Dupla 1', 'Atleta 2 - Dupla 1'] : ['Atleta 1 - Dupla 1']
  const defaultTeamB = isDoubles ? ['Atleta 1 - Dupla 2', 'Atleta 2 - Dupla 2'] : ['Atleta 1 - Dupla 2']

  const teamA = match?.settings?.players?.teamA?.length ? match.settings.players.teamA : defaultTeamA
  const teamB = match?.settings?.players?.teamB?.length ? match.settings.players.teamB : defaultTeamB

  const matchStartTimestamp = new Date(match?.created_at).getTime()

  // Apply filters
  const filteredStats = stats.filter(s => {
    if (s.type === 'message') return false // Filter out messages from main stats
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
    if (WINNER_SA.has(sa)) totalWinners++
    if (WINNER_RA.has(ra)) totalWinners++
    if (ERROR_SA.has(sa)) totalErrors++
    if (ERROR_RA.has(ra)) totalErrors++
  })

  // --- Comparison Chart Data ---
  // 3 modes:
  //  - General (no team/player selected): Dupla 1 vs Dupla 2
  //  - Team mode (team selected, no player): Player 0 vs Player 1 within that team
  //  - Player mode (specific player selected): Saque vs Devolucao for that player
  const isPlayerMode = !!selectedPlayer
  const isTeamMode = !!selectedTeam && !selectedPlayer

  // Determine the player IDs for intra-team comparison
  const teamAPlayers = teamA.map((name: string, i: number) => `${name}|A${i}`)
  const teamBPlayers = teamB.map((name: string, i: number) => `${name}|B${i}`)

  const actionStats: Record<string, { A: number, B: number }> = {}
  filteredStats.forEach(s => {
    const meta = s.metadata || {}
    const servingPlayer = meta.serving_player || ''
    const returningPlayer = meta.returning_player || ''
    const sa = meta.serving_action
    const ra = meta.returning_action

    if (isPlayerMode) {
      // Saque vs Devolucao for the selected player
      if (sa && sa !== 'NONE' && servingPlayer === selectedPlayer) {
        if (!actionStats[sa]) actionStats[sa] = { A: 0, B: 0 }
        actionStats[sa].A -= 1
      }
      if (ra && ra !== 'NONE' && returningPlayer === selectedPlayer) {
        if (!actionStats[ra]) actionStats[ra] = { A: 0, B: 0 }
        actionStats[ra].B += 1
      }
    } else if (isTeamMode) {
      // Intra-team: Player 0 (left) vs Player 1 (right)
      const currentTeamPlayers = selectedTeam === 'A' ? teamAPlayers : teamBPlayers
      const p0 = currentTeamPlayers[0]
      const p1 = currentTeamPlayers[1]

      if (sa && sa !== 'NONE') {
        if (!actionStats[sa]) actionStats[sa] = { A: 0, B: 0 }
        if (servingPlayer === p0) actionStats[sa].A -= 1
        else if (servingPlayer === p1) actionStats[sa].B += 1
      }
      if (ra && ra !== 'NONE') {
        if (!actionStats[ra]) actionStats[ra] = { A: 0, B: 0 }
        if (returningPlayer === p0) actionStats[ra].A -= 1
        else if (returningPlayer === p1) actionStats[ra].B += 1
      }
    } else {
      // General: Dupla 1 (A) vs Dupla 2 (B)
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

  // Chart labels & colors
  const selectedPlayerName = selectedPlayer ? selectedPlayer.split('|')[0] : null

  let chartLabelA: string
  let chartLabelB: string
  let chartColorA: string
  let chartColorB: string
  let chartTitle: string
  let chartSubtitle: string | null = null

  if (isPlayerMode) {
    chartLabelA = 'Saque'
    chartLabelB = 'Devolução'
    chartColorA = primaryColor
    chartColorB = '#22c55e'
    chartTitle = 'Saque vs Devolução'
    chartSubtitle = selectedPlayerName
  } else if (isTeamMode) {
    const currentPlayers = selectedTeam === 'A' ? teamA : teamB
    chartLabelA = currentPlayers[0] || 'Atleta 1'
    chartLabelB = currentPlayers[1] || 'Atleta 2'
    chartColorA = selectedTeam === 'A' ? primaryColor : accentColor
    chartColorB = selectedTeam === 'A' ? primaryColor + 'aa' : accentColor + 'aa'
    chartTitle = selectedTeam === 'A' ? `${teamLabelA} — por Atleta` : `${teamLabelB} — por Atleta`
  } else {
    chartLabelA = teamLabelA
    chartLabelB = teamLabelB
    chartColorA = primaryColor
    chartColorB = accentColor
    chartTitle = 'Comparação de Duplas'
  }

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
      [teamLabelA]: accA,
      [teamLabelB]: accB
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
              <span>
                {entry.name === 'A' ? chartLabelA : entry.name === 'B' ? chartLabelB : entry.name}:
              </span>
              <span>{Math.abs(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const handleShowOverlayStat = async (label: string, value: number) => {
    if (!matchId || !match) return
    const contextName = selectedPlayerName || (selectedTeam ? (selectedTeam === 'A' ? teamLabelA : teamLabelB) : 'Geral')
    
    // Se for time especifico, exibe o painel de duplas
    if (selectedTeam && !selectedPlayer) {
      const currentTeamPlayers = selectedTeam === 'A' ? teamAPlayers : teamBPlayers
      
      let val0 = 0, val1 = 0
      
      filteredStats.forEach(s => {
         const meta = s.metadata || {}
         const sa = meta.serving_action || ''
         const ra = meta.returning_action || ''
         const sp = meta.serving_player || ''
         const rp = meta.returning_player || ''
         
         const isP0 = (p: string) => p === currentTeamPlayers[0]
         const isP1 = (p: string) => p === currentTeamPlayers[1]

         const isWinner = (a: string) => a.includes('VENC') || a === 'ACE' || a === 'SMASH IN'
         const isError = (a: string) => a.includes('ERRO') || a.includes('OUT') || a.includes('ERRADA') || a.includes('FALTA')
         
         if (label === 'ACES' && sa === 'ACE') {
            if (isP0(sp)) val0++; if (isP1(sp)) val1++;
         }
         if (label === 'WINNERS') {
            if (isWinner(sa)) { if (isP0(sp)) val0++; if (isP1(sp)) val1++; }
            if (isWinner(ra)) { if (isP0(rp)) val0++; if (isP1(rp)) val1++; }
         }
         if (label === 'ERROS') {
            if (isError(sa)) { if (isP0(sp)) val0++; if (isP1(sp)) val1++; }
            if (isError(ra)) { if (isP0(rp)) val0++; if (isP1(rp)) val1++; }
         }
         if (label === 'RALLIES') {
            val0++; val1++;
         }
      })

      if (label === 'RALLIES') {
         val0 = totalRallies; val1 = totalRallies;
      }

      const newSettings = {
        ...match.settings,
        activeStatPanel: {
          type: 'doubles',
          statLabel: `${label} - ${selectedTeam === 'A' ? teamLabelA : teamLabelB}`,
          teamAValue: val0.toString(),
          teamBValue: val1.toString()
        },
        showFullStats: false,
        activeMessage: null
      }
      await supabase.from('matches').update({ settings: newSettings as any }).eq('id', matchId)
    } else {
      const newSettings = {
        ...match.settings,
        activeStatPanel: {
          type: 'individual',
          statLabel: label,
          player: contextName,
          value: value.toString()
        },
        showFullStats: false,
        activeMessage: null
      }
      await supabase.from('matches').update({ settings: newSettings as any }).eq('id', matchId)
    }

    toast.success(`Estatística enviada ao overlay!`)

    // Auto-hide after 15 seconds
    setTimeout(async () => {
       const { data } = await supabase.from('matches').select('settings').eq('id', matchId).single()
       if (data && data.settings) {
         const updatedSettings = { ...data.settings, activeStatPanel: null }
         await supabase.from('matches').update({ settings: updatedSettings as any }).eq('id', matchId)
       }
    }, 15000)
  }

  const handleHideOverlayStat = async () => {
    if (!matchId || !match) return
    const newSettings = { ...match.settings, activeStatPanel: null, showFullStats: false }
    await supabase.from('matches').update({ settings: newSettings as any }).eq('id', matchId)
    toast.success('Estatística removida do overlay.')
  }

  const handleSaveAnalysis = async () => {
    if (!matchId || !match) return
    const teamA = (match.settings?.players?.teamA || ['Time A']).join(' & ')
    const teamB = (match.settings?.players?.teamB || ['Time B']).join(' & ')
    const totalStats = stats.filter((s) => s.type === 'stat').length
    const entry = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      label: 'Análise do Jogo',
      context: `${teamA} vs ${teamB}`,
      value: totalStats.toString(),
    }
    const newSettings = {
      ...match.settings,
      saved_stats: [...(match.settings?.saved_stats || []), entry],
    }
    await supabase.from('matches').update({ settings: newSettings as any }).eq('id', matchId)
    setMatch({ ...match, settings: newSettings })
    toast.success('Análise salva!')
  }

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500 text-text">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-surface/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(`/match/${matchId}`)} className="p-1.5 hover:bg-surface rounded-xl transition-all active:scale-90 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black italic uppercase tracking-tighter text-primary leading-none">Análise do Jogo</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted truncate">{match?.settings?.tournamentName || 'Resumo da Partida'}</p>
          </div>
          <button
            onClick={handleSaveAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-text/10 hover:border-primary/40 hover:bg-primary/5 text-text-muted hover:text-primary transition-all shrink-0"
            title="Salvar análise"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wide hidden sm:inline">Salvar</span>
          </button>
          {(match?.settings?.activeStatPanel || match?.settings?.showFullStats) && (
            <div className="flex items-center gap-1.5 bg-success/10 border border-success/30 px-2.5 py-1 rounded-xl text-success text-[9px] font-black uppercase tracking-wide shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Overlay Ativo
            </div>
          )}
          {match?.settings?.timerEnabled !== false && (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-primary shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono font-black text-sm tracking-tighter">{durationStr}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Match Settings Summary */}
        <div className="flex flex-wrap gap-2 px-1">
          {[
            { label: match?.settings?.type === 'singles' ? 'Simples' : 'Duplas', color: 'text-primary bg-primary/10 border-primary/20' },
            { label: `${match?.settings?.maxGames || 6} Games`, color: 'text-text-muted bg-text/5 border-text/10' },
            { label: match?.settings?.noAd ? 'No-Ad' : 'Advantage', color: 'text-text-muted bg-text/5 border-text/10' },
            match?.settings?.tiebreak !== false && { label: 'Tiebreak', color: 'text-text-muted bg-text/5 border-text/10' },
            match?.settings?.timerEnabled === false && { label: 'Sem Timer', color: 'text-text-muted/50 bg-text/3 border-text/8' },
            match?.settings?.saqueEnabled === false && { label: 'Sem Saque', color: 'text-text-muted/50 bg-text/3 border-text/8' },
            match?.settings?.statsEnabled === false && { label: 'Stats Off', color: 'text-error/60 bg-error/5 border-error/10' },
          ].filter(Boolean).map((b: any) => (
            <span key={b.label} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>

        {/* Global Filters (Top Bar) */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 bg-surface p-2 rounded-[1.5rem] border border-text/5 flex flex-wrap gap-2 shadow-lg items-center">
            <button 
              onClick={() => { setSelectedPlayer(null); setSelectedTeam(null); setShowMessages(false) }}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${!selectedPlayer && !selectedTeam && !showMessages ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text hover:bg-text/5'}`}
            >
              Visão Geral
            </button>
            <div className="w-[1px] h-6 bg-text/10 mx-1 hidden sm:block"></div>

            {/* Team Filters */}
            <button
              onClick={() => { setSelectedTeam('A'); setSelectedPlayer(null); setShowMessages(false) }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                selectedTeam === 'A' && !showMessages
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'text-text-muted hover:bg-text/5 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-primary"></span> {teamLabelA}
            </button>

            {selectedTeam === 'A' && !showMessages && teamA.map((name, i) => {
              const pid = `${name}|A${i}`
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPlayer(selectedPlayer === pid ? null : pid)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-1.5 ${
                    selectedPlayer === pid
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30'
                      : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                  }`}
                >
                  <span className="truncate max-w-[80px]">{name}</span>
                </button>
              )
            })}

            <button
              onClick={() => { setSelectedTeam('B'); setSelectedPlayer(null); setShowMessages(false) }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                selectedTeam === 'B' && !showMessages
                  ? 'bg-accent/20 text-accent border border-accent/50'
                  : 'text-text-muted hover:bg-text/5 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-accent"></span> {teamLabelB}
            </button>

            {selectedTeam === 'B' && !showMessages && teamB.map((name, i) => {
              const pid = `${name}|B${i}`
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPlayer(selectedPlayer === pid ? null : pid)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border flex items-center gap-1.5 ${
                    selectedPlayer === pid
                      ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/30'
                      : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
                  }`}
                >
                  <span className="truncate max-w-[80px]">{name}</span>
                </button>
              )
            })}

            <button 
              onClick={() => { setShowMessages(true); setSelectedPlayer(null); setSelectedTeam(null) }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${showMessages ? 'bg-[#FFEA00]/20 text-[#FFEA00] border border-[#FFEA00]/50' : 'text-text-muted hover:bg-text/5 border border-transparent'}`}
            >
              <MessageSquare className="w-3 h-3" /> Mensagens
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

          <div className="bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-[2rem] border border-primary/20 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="w-16 h-16 text-primary" /></div>
            <div className="flex items-center gap-3 text-text-muted mb-2">
              <Zap className="w-4 h-4 text-primary" />
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
                <div>
                  <h3 className="font-black uppercase italic tracking-tighter text-lg text-text">
                    {isPlayerMode ? `Saque vs Devolução` : 'Comparação de Duplas'}
                  </h3>
                  {isPlayerMode && selectedPlayerName && (
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{selectedPlayerName}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-text">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColorA }}></div> {chartLabelA}</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColorB }}></div> {chartLabelB}</span>
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
                    <Bar dataKey="A" fill={chartColorA} stackId="stack" radius={8} />
                    <Bar dataKey="B" fill={chartColorB} stackId="stack" radius={8} />
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
                      cornerRadius={8}
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
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
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
                    <Area type="monotone" dataKey={teamLabelA} stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorA)" />
                    <Area type="monotone" dataKey={teamLabelB} stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {showMessages && (
          <div className="bg-surface p-8 rounded-[2rem] border border-text/5 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            {/* Messages Panel - History View */}
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-[#FFEA00]" />
              <h3 className="font-black uppercase italic tracking-tighter text-2xl text-text">Histórico de Mensagens</h3>
            </div>
            
            <div className="space-y-3">
              {stats.filter(s => s.type === 'message').length === 0 ? (
                <div className="text-center py-12 text-text-muted italic">
                  Nenhuma mensagem foi exibida nesta partida ainda.
                </div>
              ) : (
                stats.filter(s => s.type === 'message').map((msg, index) => {
                  const date = new Date(msg.created_at)
                  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  
                  return (
                    <div key={msg.id || index} className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-text/5 hover:border-[#FFEA00]/30 transition-colors">
                      <div className="flex-shrink-0 text-xs font-mono font-bold text-text-muted bg-surface px-3 py-1.5 rounded-lg">
                        {timeString}
                      </div>
                      <div className="text-sm font-black uppercase tracking-widest text-[#FFEA00]">
                        {msg.metadata?.text}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
