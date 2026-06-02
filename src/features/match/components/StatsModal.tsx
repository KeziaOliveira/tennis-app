import { useState } from 'react'
import { supabase } from '../../../services/supabase/client'
import { X, User } from 'lucide-react'
import { toast } from 'sonner'
import type { MatchSettings } from '../../../store/matchStore'

interface StatsModalProps {
  matchId: string
  isOpen: boolean
  onClose: () => void
  settings: MatchSettings
  currentSet: number
}

const SERVING_ACTIONS = [
  'ACE',
  'ERRO SAQUE',
  'WINNER',
  'ACELERADA',
  'SMASH IN',
  'SMASH OUT',
  'E.N.F.',
  'LOB VENCEDOR',
  'LOB FORA',
  'CURTA VENCEDORA',
  'CURTA ERRADA',
]

const RETURNING_ACTIONS = [
  'E.N.F.',
  'ERRO DEVOL.',
  'WINNER DEVOL.',
  'WINNER',
  'SMASH IN',
  'SMASH OUT',
  'ACELERADA',
  'LOB VENC.',
  'LOB FORA',
  'CURTA VENC.',
  'CURTA ERRADA',
  'NONE',
]

export default function StatsModal({ matchId, isOpen, onClose, settings, currentSet }: StatsModalProps) {
  const [loading, setLoading] = useState(false)

  const [servingPlayer, setServingPlayer] = useState<string | null>(null)
  const [servingAction, setServingAction] = useState<string | null>(null)
  const [returningPlayer, setReturningPlayer] = useState<string | null>(null)
  const [returningAction, setReturningAction] = useState<string>('NONE')

  if (!isOpen) return null

  // Build flat player list with team label
  const isDoubles = settings?.type === 'doubles' || !settings?.type

  const defaultTeamA = isDoubles ? ['Atleta 1 - Dupla 1', 'Atleta 2 - Dupla 1'] : ['Atleta 1 - Dupla 1']
  const defaultTeamB = isDoubles ? ['Atleta 1 - Dupla 2', 'Atleta 2 - Dupla 2'] : ['Atleta 1 - Dupla 2']

  const teamA = settings?.players?.teamA?.length ? settings.players.teamA : defaultTeamA
  const teamB = settings?.players?.teamB?.length ? settings.players.teamB : defaultTeamB

  interface Player {
    name: string
    team: 'A' | 'B'
    index: number
  }

  const allPlayers: Player[] = [
    ...teamA.map((name, i) => ({ name, team: 'A' as const, index: i })),
    ...teamB.map((name, i) => ({ name, team: 'B' as const, index: i })),
  ]

  const handleConfirm = async () => {
    if (!servingPlayer) return toast.error('Selecione o atleta no saque')
    if (!servingAction) return toast.error('Selecione a ação do sacador')
    if (!returningPlayer) return toast.error('Selecione o atleta em execução')

    setLoading(true)
    const { error } = await supabase.from('points').insert({
      match_id: matchId,
      winner: null,
      type: 'stat',
      stroke_type: servingAction.toLowerCase().replace(/[\s.]/g, '_'),
      metadata: {
        set_number: currentSet,
        serving_player: servingPlayer,
        serving_action: servingAction,
        returning_player: returningPlayer,
        returning_action: returningAction,
      },
    } as any)

    setLoading(false)

    if (error) {
      toast.error('Erro ao salvar estatística')
    } else {
      toast.success('Ação registrada!')
      // Reset state for next entry
      setServingPlayer(null)
      setServingAction(null)
      setReturningPlayer(null)
      setReturningAction('NONE')
      onClose()
    }
  }

  const PlayerPill = ({
    player,
    selected,
    onSelect,
    variant,
  }: {
    player: Player
    selected: boolean
    onSelect: () => void
    variant: 'blue' | 'orange'
  }) => (
    <button
      onClick={onSelect}
      className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all border-2 whitespace-nowrap w-full ${
        variant === 'blue'
          ? selected 
            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
            : 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
          : selected
            ? 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/30'
            : 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/30'
      }`}
    >
      <User className="w-3 h-3 shrink-0" />
      <span className="truncate">{player.name}</span>
    </button>
  )

  const ActionChip = ({
    label,
    selected,
    onSelect,
  }: {
    label: string
    selected: boolean
    onSelect: () => void
  }) => (
    <button
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight border transition-all ${
        selected
          ? 'bg-primary text-primary-foreground border-primary shadow-md'
          : 'bg-background border-white/5 text-text-muted hover:bg-white/5 hover:border-white/10'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-surface w-full max-w-4xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Registrar Ação</h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              {settings?.tournamentName || 'Partida'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* ── SECTION 1: SERVING PLAYER ── */}
          <div className="space-y-4">
            <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-primary">
              Atleta no saque:
            </p>

            {/* Player pills */}
            <div className={`grid gap-2 ${allPlayers.length === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {allPlayers.map((p) => (
                <PlayerPill
                  key={`serve-${p.team}-${p.index}`}
                  player={p}
                  selected={servingPlayer === `${p.name}|${p.team}${p.index}`}
                  onSelect={() => setServingPlayer(`${p.name}|${p.team}${p.index}`)}
                  variant="blue"
                />
              ))}
            </div>

            {/* Serving actions */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {SERVING_ACTIONS.map((action) => (
                <ActionChip
                  key={action}
                  label={action}
                  selected={servingAction === action}
                  onSelect={() => setServingAction(action)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5" />

          {/* ── SECTION 2: RETURNING PLAYER ── */}
          <div className="space-y-4">
            <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-accent">
              Atleta em execução:
            </p>

            {/* Player pills */}
            <div className={`grid gap-2 ${allPlayers.length === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {allPlayers.map((p) => (
                <PlayerPill
                  key={`return-${p.team}-${p.index}`}
                  player={p}
                  selected={returningPlayer === `${p.name}|${p.team}${p.index}`}
                  onSelect={() => setReturningPlayer(`${p.name}|${p.team}${p.index}`)}
                  variant="orange"
                />
              ))}
            </div>

            {/* Returning actions */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {RETURNING_ACTIONS.map((action) => (
                <ActionChip
                  key={action}
                  label={action}
                  selected={returningAction === action}
                  onSelect={() => setReturningAction(action)}
                />
              ))}
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground p-5 rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
