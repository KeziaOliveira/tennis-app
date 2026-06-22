import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../services/supabase/client'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMatchStore, type MatchSettings } from '../../../store/matchStore'

interface StatsModalProps {
  matchId: string
  isOpen: boolean
  onClose: () => void
  settings: MatchSettings
  currentSet: number
}

const SERVING_ACTIONS = [
  'ACE', 'ERRO SAQUE', 'WINNER', 'ACELERADA', 'SMASH IN', 'SMASH OUT',
  'E.N.F.', 'LOB VENCEDOR', 'LOB FORA', 'CURTA VENCEDORA', 'CURTA ERRADA',
]

const RETURNING_ACTIONS = [
  'E.N.F.', 'ERRO DEVOL.', 'WINNER DEVOL.', 'WINNER', 'SMASH IN', 'SMASH OUT',
  'ACELERADA', 'LOB VENC.', 'LOB FORA', 'CURTA VENC.', 'CURTA ERRADA', 'NONE',
]

// BREAK POINT e IGUAIS removidos: não são calculáveis a partir dos dados de ação registrados
const OV_STATS_LIST = [
  'ACE', 'ACELERADA', 'CURTA ERRADA', 'CURTA VENCEDORA',
  'ERRO DE SAQUE', 'ERROS DE DEVOLUÇÃO', 'ERROS NÃO FORÇADOS',
  'LOB ERRADO', 'LOB VENCEDOR', 'PONTOS MARCADOS', 'SAQUES CONFIRMADOS',
  'WINNER', 'WINNER DE DEVOLUÇÃO',
]

const OV_MESSAGES_LIST = [
  'BREAK POINT', 'NOME DO TORNEIO', 'PONTO DO GAME', 'PONTO DO JOGO',
  'SET ENCERRADO', 'SET POINT', 'SUPER TIE-BREAK', 'TIE-BREAK', 'TROCA DE LADO',
]

const OV_WINNER_SA = new Set(['ACE', 'WINNER', 'SMASH IN', 'LOB VENCEDOR', 'CURTA VENCEDORA', 'ACELERADA'])
const OV_WINNER_RA = new Set(['WINNER', 'WINNER DEVOL.', 'SMASH IN', 'LOB VENC.', 'CURTA VENC.', 'ACELERADA'])
const OV_ERROR_SA  = new Set(['ERRO SAQUE', 'E.N.F.', 'SMASH OUT', 'LOB FORA', 'CURTA ERRADA'])
const OV_ERROR_RA  = new Set(['ERRO DEVOL.', 'E.N.F.', 'SMASH OUT', 'LOB FORA', 'CURTA ERRADA'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcOvStat(stats: any[], statLabel: string, playerFilter?: string, teamFilter?: 'A' | 'B', setFilter?: 'JOGO' | 1 | 2 | 3): number {
  const filtered = stats.filter(s => {
    if (setFilter && setFilter !== 'JOGO' && s.metadata?.set_number !== setFilter) return false
    if (playerFilter) {
      if (s.metadata?.serving_player !== playerFilter && s.metadata?.returning_player !== playerFilter) return false
    } else if (teamFilter) {
      const sp = s.metadata?.serving_player || ''
      const rp = s.metadata?.returning_player || ''
      if (!sp.includes(`|${teamFilter}`) && !rp.includes(`|${teamFilter}`)) return false
    }
    return true
  })

  const isMe = (p: string) =>
    playerFilter ? p === playerFilter : teamFilter ? p.includes(`|${teamFilter}`) : true

  let count = 0
  filtered.forEach(s => {
    const sa = s.metadata?.serving_action || ''
    const ra = s.metadata?.returning_action || ''
    const sp = s.metadata?.serving_player || ''
    const rp = s.metadata?.returning_player || ''
    switch (statLabel) {
      case 'ACE': if (sa === 'ACE' && isMe(sp)) count++; break
      case 'ACELERADA':
        if (sa === 'ACELERADA' && isMe(sp)) count++
        if (ra === 'ACELERADA' && isMe(rp)) count++; break
      case 'CURTA ERRADA':
        if (sa === 'CURTA ERRADA' && isMe(sp)) count++
        if (ra === 'CURTA ERRADA' && isMe(rp)) count++; break
      case 'CURTA VENCEDORA':
        if (sa === 'CURTA VENCEDORA' && isMe(sp)) count++
        if ((ra === 'CURTA VENC.' || ra === 'CURTA VENCEDORA') && isMe(rp)) count++; break
      case 'ERRO DE SAQUE':
      case 'ERROS DE SAQUE':
        if (sa === 'ERRO SAQUE' && isMe(sp)) count++; break
      case 'ERROS DE DEVOLUÇÃO': if (ra === 'ERRO DEVOL.' && isMe(rp)) count++; break
      case 'ERROS NÃO FORÇADOS':
        if (sa === 'E.N.F.' && isMe(sp)) count++
        if (ra === 'E.N.F.' && isMe(rp)) count++; break
      case 'LOB ERRADO':
        if (sa === 'LOB FORA' && isMe(sp)) count++
        if (ra === 'LOB FORA' && isMe(rp)) count++; break
      case 'LOB VENCEDOR':
        if (sa === 'LOB VENCEDOR' && isMe(sp)) count++
        if ((ra === 'LOB VENC.' || ra === 'LOB VENCEDOR') && isMe(rp)) count++; break
      case 'SAQUES CONFIRMADOS': if (OV_WINNER_SA.has(sa) && isMe(sp)) count++; break
      case 'WINNER':
        if (OV_WINNER_SA.has(sa) && isMe(sp)) count++
        if (OV_WINNER_RA.has(ra) && isMe(rp)) count++; break
      case 'WINNER DE DEVOLUÇÃO':
        if ((ra === 'WINNER DEVOL.' || ra === 'WINNER') && isMe(rp)) count++; break
      case 'PONTOS MARCADOS':
        if ((OV_WINNER_SA.has(sa) || OV_ERROR_RA.has(ra)) && isMe(sp)) count++
        if ((OV_WINNER_RA.has(ra) || OV_ERROR_SA.has(sa)) && isMe(rp)) count++; break
    }
  })
  return count
}

export default function StatsModal({ matchId, isOpen, onClose, settings, currentSet }: StatsModalProps) {
  const [loading, setLoading] = useState(false)

  // Registrar tab
  const [servingPlayer, setServingPlayer] = useState<string | null>(null)
  const [servingAction, setServingAction] = useState<string | null>(null)
  const [returningPlayer, setReturningPlayer] = useState<string | null>(null)
  const [returningAction, setReturningAction] = useState<string>('NONE')

  const [activeTab, setActiveTab] = useState<'registrar' | 'overlay'>('registrar')

  // Overlay tab
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [overlayStatRows, setOverlayStatRows] = useState<any[]>([])
  const [ovLoading, setOvLoading] = useState(false)
  const [ovMode, setOvMode] = useState<'DUPLA' | 'ATLETA' | 'MENSAGENS'>('DUPLA')
  const [ovSelectedPlayer, setOvSelectedPlayer] = useState<string | null>(null)
  const [ovSelectedTeam, setOvSelectedTeam] = useState<'A' | 'B' | null>(null)
  const [ovSelectedStat, setOvSelectedStat] = useState<string | null>(null)
  const [ovSetFilter, setOvSetFilter] = useState<'JOGO' | 1 | 2 | 3>('JOGO')
  const [ovSending, setOvSending] = useState(false)
  const [lastSentLabel, setLastSentLabel] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [sentDuration, setSentDuration] = useState<number | null>(null)
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null)
  const [autoFlash, setAutoFlash] = useState(() => localStorage.getItem('statsAutoFlash') === 'true')

  const { setActiveMessage, setActiveStatPanel, setShowFullStats } = useMatchStore()

  // Reload stats every time overlay tab becomes active
  useEffect(() => {
    if (activeTab === 'overlay' && isOpen) {
      setOvLoading(true)
      supabase.from('points')
        .select('*')
        .eq('match_id', matchId)
        .eq('type', 'stat')
        .order('created_at', { ascending: true })
        .then(({ data }) => { setOverlayStatRows(data || []); setOvLoading(false) })
    }
  }, [activeTab, isOpen, matchId])

  // Countdown ticker for active overlay items
  useEffect(() => {
    if (!sentAt || !sentDuration) { setRemainingSecs(null); return }
    const update = () => {
      const r = Math.ceil((sentAt + sentDuration - Date.now()) / 1000)
      setRemainingSecs(r > 0 ? r : null)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [sentAt, sentDuration])

  // Pre-compute stat preview values for all stats given current filters
  const statPreviews = useMemo<Record<string, string>>(() => {
    if (ovMode === 'MENSAGENS' || !overlayStatRows.length) return {}
    return Object.fromEntries(
      OV_STATS_LIST.map(stat => {
        let label: string
        if (ovMode === 'ATLETA' && ovSelectedPlayer) {
          label = calcOvStat(overlayStatRows, stat, ovSelectedPlayer, undefined, ovSetFilter).toString()
        } else if (ovMode === 'DUPLA' && ovSelectedTeam) {
          label = calcOvStat(overlayStatRows, stat, undefined, ovSelectedTeam, ovSetFilter).toString()
        } else {
          const a = calcOvStat(overlayStatRows, stat, undefined, 'A', ovSetFilter)
          const b = calcOvStat(overlayStatRows, stat, undefined, 'B', ovSetFilter)
          label = `${a}–${b}`
        }
        return [stat, label]
      })
    )
  }, [overlayStatRows, ovMode, ovSelectedPlayer, ovSelectedTeam, ovSetFilter])

  if (!isOpen) return null

  const isDoubles = settings?.type === 'doubles' || !settings?.type
  const defaultTeamA = isDoubles ? ['Atleta 1 - Dupla 1', 'Atleta 2 - Dupla 1'] : ['Atleta 1 - Dupla 1']
  const defaultTeamB = isDoubles ? ['Atleta 1 - Dupla 2', 'Atleta 2 - Dupla 2'] : ['Atleta 1 - Dupla 2']
  const teamA = settings?.players?.teamA?.length ? settings.players.teamA : defaultTeamA
  const teamB = settings?.players?.teamB?.length ? settings.players.teamB : defaultTeamB
  const teamLabelA = isDoubles ? 'Dupla 1' : 'Time A'
  const teamLabelB = isDoubles ? 'Dupla 2' : 'Time B'

  interface Player { name: string; team: 'A' | 'B'; index: number }
  const allPlayers: Player[] = [
    ...teamA.map((name, i) => ({ name, team: 'A' as const, index: i })),
    ...teamB.map((name, i) => ({ name, team: 'B' as const, index: i })),
  ]

  // ── Registrar handler ─────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!servingPlayer) return toast.error('Selecione o atleta no saque')
    if (!servingAction) return toast.error('Selecione a ação do sacador')

    setLoading(true)
    const { error } = await supabase.from('points').insert({
      match_id: matchId,
      type: 'stat',
      metadata: {
        set_number: currentSet,
        serving_player: servingPlayer,
        serving_action: servingAction,
        returning_player: returningPlayer,
        returning_action: returningAction,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    setLoading(false)
    if (error) {
      toast.error('Erro ao salvar estatística')
    } else {
      toast.success('Ação registrada!')
      if (autoFlash && servingAction && !settings?.showFullStats) {
        await setActiveMessage(servingAction)
        setLastSentLabel(servingAction)
        setSentAt(Date.now())
        setSentDuration(7000)
      }
      setServingPlayer(null); setServingAction(null); setReturningPlayer(null); setReturningAction('NONE')
      if (!autoFlash) onClose()
    }
  }

  // ── Overlay handlers ──────────────────────────────────────────────────────

  const handleOvShow = async () => {
    if (ovMode === 'MENSAGENS') {
      if (!ovSelectedStat) return toast.error('Selecione uma mensagem')
      setOvSending(true)
      const msgText = ovSelectedStat === 'NOME DO TORNEIO'
        ? (settings?.tournamentName || 'Partida')
        : ovSelectedStat
      await setActiveMessage(msgText)
      setOvSending(false)
      toast.success('Mensagem enviada para o overlay!')
      setLastSentLabel(msgText)
      setSentAt(Date.now())
      setSentDuration(7000)
      setOvSelectedStat(null)
      onClose()
      return
    }

    if (!ovSelectedStat) return toast.error('Selecione uma estatística')
    setOvSending(true)

    if (ovMode === 'DUPLA') {
      const valA = (!ovSelectedTeam || ovSelectedTeam === 'A')
        ? calcOvStat(overlayStatRows, ovSelectedStat, undefined, 'A', ovSetFilter) : 0
      const valB = (!ovSelectedTeam || ovSelectedTeam === 'B')
        ? calcOvStat(overlayStatRows, ovSelectedStat, undefined, 'B', ovSetFilter) : 0
      const label = ovSelectedTeam
        ? `${ovSelectedStat} – ${ovSelectedTeam === 'A' ? teamLabelA : teamLabelB}`
        : ovSelectedStat
      await setActiveStatPanel({ type: 'doubles', statLabel: label, teamAValue: valA.toString(), teamBValue: valB.toString() })
    } else {
      if (ovSelectedPlayer) {
        const val = calcOvStat(overlayStatRows, ovSelectedStat, ovSelectedPlayer, undefined, ovSetFilter)
        const playerName = ovSelectedPlayer.split('|')[0]
        await setActiveStatPanel({ type: 'individual', statLabel: ovSelectedStat, player: playerName, value: val.toString() })
      } else {
        const valA = calcOvStat(overlayStatRows, ovSelectedStat, undefined, 'A', ovSetFilter)
        const valB = calcOvStat(overlayStatRows, ovSelectedStat, undefined, 'B', ovSetFilter)
        await setActiveStatPanel({ type: 'doubles', statLabel: ovSelectedStat, teamAValue: valA.toString(), teamBValue: valB.toString() })
      }
    }

    setOvSending(false)
    toast.success('Estatística enviada para o overlay!')
    setLastSentLabel(ovSelectedStat)
    setSentAt(Date.now())
    setSentDuration(10000)
    onClose()
  }

  const handleOvClear = async () => {
    await setActiveStatPanel(null)
    await setActiveMessage(null)
    setLastSentLabel(null)
    setSentAt(null)
    setSentDuration(null)
    toast.success('Overlay limpo')
  }

  const handleOvFullStats = async () => {
    if (settings?.showFullStats) {
      await setShowFullStats(false)
      toast.success('Placar final removido')
      return
    }

    if (overlayStatRows.length === 0) {
      toast.error('Sem estatísticas registradas para gerar o placar final')
      return
    }

    let acesA = 0, acesB = 0, winnersA = 0, winnersB = 0, errorsA = 0, errorsB = 0, pointsA = 0, pointsB = 0
    overlayStatRows.forEach(s => {
      const sa = s.metadata?.serving_action || ''
      const ra = s.metadata?.returning_action || ''
      const sp = s.metadata?.serving_player || ''
      const rp = s.metadata?.returning_player || ''
      const isA = (p: string) => p.includes('|A')
      const isB = (p: string) => p.includes('|B')
      if (sa === 'ACE') { if (isA(sp)) acesA++; if (isB(sp)) acesB++ }
      if (OV_WINNER_SA.has(sa)) { if (isA(sp)) winnersA++; if (isB(sp)) winnersB++ }
      if (OV_WINNER_RA.has(ra)) { if (isA(rp)) winnersA++; if (isB(rp)) winnersB++ }
      if (OV_ERROR_SA.has(sa))  { if (isA(sp)) errorsA++;  if (isB(sp)) errorsB++ }
      if (OV_ERROR_RA.has(ra))  { if (isA(rp)) errorsA++;  if (isB(rp)) errorsB++ }
      if (OV_WINNER_SA.has(sa) || OV_ERROR_RA.has(ra)) { if (isA(sp)) pointsA++; else if (isB(sp)) pointsB++ }
      if (OV_WINNER_RA.has(ra) || OV_ERROR_SA.has(sa)) { if (isA(rp)) pointsA++; else if (isB(rp)) pointsB++ }
    })

    const fullStatsData = [
      { label: 'Pontos Feitos', valA: pointsA.toString(),  valB: pointsB.toString() },
      { label: 'Aces',          valA: acesA.toString(),    valB: acesB.toString() },
      { label: 'Winners',       valA: winnersA.toString(), valB: winnersB.toString() },
      { label: 'Erros',         valA: errorsA.toString(),  valB: errorsB.toString() },
    ]

    const newSettings = { ...settings, showFullStats: true, fullStatsData, activeStatPanel: null, activeMessage: null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('matches').update({ settings: newSettings as any }).eq('id', matchId)
    toast.success('Placar final enviado para o overlay!')
    setLastSentLabel('Placar Final')
    setSentAt(Date.now())
    setSentDuration(null)
  }

  // ── Sub-components ────────────────────────────────────────────────────────

  const PlayerPill = ({ player, selected, onSelect, variant }: {
    player: Player; selected: boolean; onSelect: () => void; variant: 'blue' | 'orange'
  }) => (
    <button
      onClick={onSelect}
      className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all border-2 whitespace-nowrap w-full ${
        variant === 'blue'
          ? selected ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
          : selected ? 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/30' : 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/30'
      }`}
    >
      <span className="truncate">{player.name}</span>
    </button>
  )

  const ActionChip = ({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) => (
    <button
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight border transition-all ${
        selected ? 'bg-text/15 text-text border-text/25' : 'bg-background border-white/8 text-text-muted hover:bg-white/5 hover:border-white/15 hover:text-text'
      }`}
    >
      {label}
    </button>
  )

  // ── Status pill values ────────────────────────────────────────────────────

  const isLive = !!(settings?.activeStatPanel || settings?.showFullStats || settings?.activeMessage)
  const liveLabel = settings?.showFullStats
    ? 'Placar Final'
    : settings?.activeMessage
      ? `"${settings.activeMessage.substring(0, 18)}"`
      : (settings?.activeStatPanel?.statLabel ?? '')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4">
      <div className="fixed inset-0 md:static md:inset-auto md:h-auto md:max-h-[90vh] bg-surface w-full max-w-4xl rounded-none md:rounded-[2.5rem] shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-2 md:px-8 md:pt-8 md:pb-4 shrink-0">
          <div>
            <h2 className="text-base md:text-xl font-black italic uppercase tracking-tighter leading-tight">Painel de Estatística do Jogo</h2>
            <p className="hidden md:block text-[11px] text-text-muted mt-0.5">{settings?.tournamentName || 'Partida'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-5 md:px-8 gap-2 border-b border-white/5 pb-2 md:pb-4 shrink-0">
          <button
            onClick={() => setActiveTab('registrar')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-tight md:tracking-widest transition-all whitespace-nowrap ${activeTab === 'registrar' ? 'bg-text/10 text-text border border-text/20' : 'text-text-muted hover:bg-text/5'}`}
          >
            <span className="sm:hidden">Pontuação</span>
            <span className="hidden sm:inline">Registrar Ponto</span>
          </button>
          <button
            onClick={() => setActiveTab('overlay')}
            className={`flex items-center px-3 py-1.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-tight md:tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'overlay' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-text-muted hover:bg-text/5'
            }`}
          >
            Overlay
          </button>

          {/* Live / last-sent status pill */}
          {isLive ? (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-success/10 border border-success/20 text-success text-[8px] md:text-[9px] font-black uppercase tracking-tight whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
              <span className="truncate max-w-[80px] md:max-w-none">{liveLabel}</span>
              {remainingSecs !== null && (
                <span className="opacity-50 font-normal ml-0.5">{remainingSecs}s</span>
              )}
            </div>
          ) : lastSentLabel && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-surface border border-secondary/20 text-text-muted text-[8px] md:text-[9px] font-black uppercase tracking-tight whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted/40 shrink-0" />
              <span className="truncate max-w-[80px] md:max-w-none">{lastSentLabel.substring(0, 22)}</span>
            </div>
          )}
        </div>

        {/* ── Registrar Ponto ── */}
        {activeTab === 'registrar' && (
          <div className="px-5 sm:px-8 pb-6 space-y-4 pt-4 overflow-y-auto flex-1">
              <div className="md:grid md:grid-cols-2 md:gap-0">
                <div className="space-y-2 md:pr-5">
                  <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-text-muted">Atleta no saque:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allPlayers.map((p) => (
                      <PlayerPill
                        key={`serve-${p.team}-${p.index}`}
                        player={p}
                        selected={servingPlayer === `${p.name}|${p.team}${p.index}`}
                        onSelect={() => setServingPlayer(`${p.name}|${p.team}${p.index}`)}
                        variant={p.team === 'A' ? 'blue' : 'orange'}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {SERVING_ACTIONS.map((action) => (
                      <ActionChip key={action} label={action} selected={servingAction === action} onSelect={() => setServingAction(action)} />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5 my-4 md:hidden" />

                <div className="space-y-2 md:pl-5 md:border-l md:border-white/8">
                  <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-text-muted">Atleta em execução:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allPlayers.map((p) => (
                      <PlayerPill
                        key={`return-${p.team}-${p.index}`}
                        player={p}
                        selected={returningPlayer === `${p.name}|${p.team}${p.index}`}
                        onSelect={() => setReturningPlayer(`${p.name}|${p.team}${p.index}`)}
                        variant={p.team === 'A' ? 'blue' : 'orange'}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {RETURNING_ACTIONS.map((action) => (
                      <ActionChip key={action} label={action} selected={returningAction === action} onSelect={() => setReturningAction(action)} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-flash toggle */}
              <div className="flex items-center justify-between px-1 pt-1">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-text">Auto-exibir no overlay</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Envia a ação ao overlay automaticamente</p>
                </div>
                <button
                  onClick={() => {
                    const next = !autoFlash
                    setAutoFlash(next)
                    localStorage.setItem('statsAutoFlash', String(next))
                  }}
                  className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${autoFlash ? 'bg-primary' : 'bg-text/15'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${autoFlash ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground p-3 rounded-xl font-black uppercase italic text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Confirmar Registro'}
              </button>
          </div>
        )}

        {/* ── Overlay Control ── */}
          {activeTab === 'overlay' && (
            <div className="px-5 sm:px-8 pt-4 pb-4 flex-1 min-h-0 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">

              {/* Mode selector */}
              <div className="flex items-center gap-2">
                {(['DUPLA', 'ATLETA', 'MENSAGENS'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setOvMode(m); setOvSelectedPlayer(null); setOvSelectedTeam(null); setOvSelectedStat(null) }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      ovMode === m
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-text-muted border-text/8 hover:bg-text/5'
                    }`}
                  >
                    {m === 'DUPLA' ? (isDoubles ? 'Duplas' : 'Times') : m === 'ATLETA' ? 'Atleta' : 'Mensagem'}
                  </button>
                ))}
              </div>

              {/* Player picker (ATLETA mode) */}
              {ovMode === 'ATLETA' && (
                <div className={`grid gap-2 ${allPlayers.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                  {allPlayers.map(p => {
                    const pid = `${p.name}|${p.team}${p.index}`
                    const isA = p.team === 'A'
                    const sel = ovSelectedPlayer === pid
                    return (
                      <button
                        key={pid}
                        onClick={() => setOvSelectedPlayer(sel ? null : pid)}
                        className={`py-2 px-2 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border truncate ${
                          sel
                            ? isA ? 'bg-primary border-primary text-primary-foreground' : 'bg-accent border-accent text-accent-foreground'
                            : isA ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20' : 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20'
                        }`}
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Team picker (DUPLA mode) */}
              {ovMode === 'DUPLA' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setOvSelectedTeam(ovSelectedTeam === 'A' ? null : 'A')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      ovSelectedTeam === 'A' ? 'bg-primary text-primary-foreground border-primary' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {teamLabelA}
                  </button>
                  <button
                    onClick={() => setOvSelectedTeam(ovSelectedTeam === 'B' ? null : 'B')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                      ovSelectedTeam === 'B' ? 'bg-accent text-accent-foreground border-accent' : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                    }`}
                  >
                    {teamLabelB}
                  </button>
                </div>
              )}

              {/* MENSAGENS mode: grid + custom text */}
              {ovMode === 'MENSAGENS' ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {OV_MESSAGES_LIST.map((msg) => (
                      <button
                        key={msg}
                        onClick={() => setOvSelectedStat(ovSelectedStat === msg ? null : msg)}
                        className={`p-3 rounded-xl border-2 text-xs font-black uppercase tracking-tight transition-all text-left ${
                          ovSelectedStat === msg
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-surface-foreground/5 bg-background text-text-muted hover:border-surface-foreground/20 hover:text-text'
                        }`}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="OU DIGITE UMA MENSAGEM PERSONALIZADA..."
                    value={ovSelectedStat && !OV_MESSAGES_LIST.includes(ovSelectedStat) ? ovSelectedStat : ''}
                    onChange={(e) => setOvSelectedStat(e.target.value.toUpperCase() || null)}
                    className="w-full bg-background border-2 border-surface-foreground/5 rounded-xl p-3 text-sm font-black uppercase tracking-tight text-text placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              ) : (
                /* Stats list + Set filter */
                <div className="flex gap-3 flex-1 min-h-0">
                  <div className="shrink-0 bg-background rounded-xl border border-text/8 p-2 flex flex-col gap-0.5">
                    {(['JOGO', 1, 2, 3] as const).map(s => (
                      <label key={String(s)} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-text/5 transition-colors text-[10px] font-bold whitespace-nowrap">
                        <input type="radio" name="ovSet" checked={ovSetFilter === s} onChange={() => setOvSetFilter(s)} className="w-3 h-3 accent-primary" />
                        {s === 'JOGO' ? 'Jogo' : `${s}º Set`}
                      </label>
                    ))}
                  </div>

                  <div className="flex-1 min-h-0 bg-background rounded-xl border border-text/8 overflow-y-auto">
                    {ovLoading ? (
                      <div className="flex items-center justify-center h-full text-[10px] text-text-muted uppercase tracking-widest animate-pulse py-8">Carregando...</div>
                    ) : (
                      OV_STATS_LIST.map(stat => (
                        <label key={stat} className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-text/5 transition-colors text-[10px] font-black uppercase tracking-tight border-b border-text/5 last:border-0">
                          <input
                            type="radio"
                            name="ovStat"
                            checked={ovSelectedStat === stat}
                            onChange={() => setOvSelectedStat(stat)}
                            className="w-3 h-3 accent-primary shrink-0"
                          />
                          <span className="flex-1">{stat}</span>
                          {statPreviews[stat] !== undefined && (
                            <span className={`text-[10px] font-black tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${ovSelectedStat === stat ? 'bg-primary/20 text-primary' : 'bg-text/8 text-text-muted'}`}>
                              {statPreviews[stat]}
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleOvClear}
                  className="px-4 py-3 rounded-xl bg-error/10 text-error border border-error/20 font-black uppercase text-[10px] tracking-widest hover:bg-error/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
                <button
                  onClick={handleOvShow}
                  disabled={ovSending || !ovSelectedStat || !!settings?.showFullStats}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-black uppercase italic text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {ovSending ? 'Enviando...' : <><span className="sm:hidden">Mostrar</span><span className="hidden sm:inline">Mostrar no Overlay</span></>}
                </button>
                <button
                  onClick={handleOvFullStats}
                  className={`px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border active:scale-95 ${
                    settings?.showFullStats
                      ? 'bg-error/10 text-error border-error/20 hover:bg-error/20'
                      : 'bg-text/8 text-text border-text/10 hover:bg-text/15'
                  }`}
                >
                  {settings?.showFullStats ? 'Ocultar' : 'Placar Final'}
                </button>
              </div>

            </div>
          )}

      </div>
    </div>
  )
}
