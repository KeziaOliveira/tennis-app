import { useState } from 'react'
import { supabase } from '../../../services/supabase/client'
import { X, User, MessageSquare, Trash2 } from 'lucide-react'
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

const ATLETA_STATS = [
  'ACE', 'ACELERADA', 'BREAK POINT', 'CURTA ERRADA', 'CURTA VENCEDORA',
  'ERRO DE SAQUE', 'ERROS DE DEVOLUÇÃO', 'ERROS NÃO FORÇADOS', 'IGUAIS (40 X 40)',
  'LOB ERRADO', 'LOB VENCEDOR', 'PONTOS MARCADOS', 'SAQUES CONFIRMADOS',
  'WINNER', 'WINNER DE DEVOLUÇÃO'
]

const DUPLA_STATS = [
  'ACE', 'BREAK POINT', 'ERROS NÃO FORÇADOS', 'PONTOS MARCADOS', 'WINNER',
  'ERROS DE SAQUE', 'ERROS DE DEVOLUÇÃO'
]

export default function StatsModal({ matchId, isOpen, onClose, settings, currentSet }: StatsModalProps) {
  const [loading, setLoading] = useState(false)

  const [servingPlayer, setServingPlayer] = useState<string | null>(null)
  const [servingAction, setServingAction] = useState<string | null>(null)
  const [returningPlayer, setReturningPlayer] = useState<string | null>(null)
  const [returningAction, setReturningAction] = useState<string>('NONE')
  const [activeTab, setActiveTab] = useState<'registrar' | 'mensagens'>('registrar')
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  
  const { setActiveMessage } = useMatchStore()

  if (!isOpen) return null

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
      <div className="bg-surface w-full max-w-4xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4 shrink-0">
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Painel de Estatística do Jogo</h2>
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

        {/* Tabs */}
        <div className="flex px-8 gap-4 border-b border-white/5 pb-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('registrar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'registrar'
                ? 'bg-white/10 text-white border border-white/30'
                : 'text-text-muted hover:bg-white/5'
            }`}
          >
            Registrar Ponto
          </button>
          <button
            onClick={() => setActiveTab('mensagens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'mensagens'
                ? 'bg-[#FFEA00]/20 text-[#FFEA00] border border-[#FFEA00]/30'
                : 'text-text-muted hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Mensagens
          </button>
        </div>

        <div className="px-8 pb-6 space-y-4 pt-4 overflow-y-auto flex-1">
          {activeTab === 'registrar' && (
            <>
              <div className="space-y-2">
                <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-primary">Atleta no saque:</p>
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
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {SERVING_ACTIONS.map((action) => (
                    <ActionChip key={action} label={action} selected={servingAction === action} onSelect={() => setServingAction(action)} />
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-2">
                <p className="text-xs text-center font-black uppercase tracking-[0.2em] text-accent">Atleta em execução:</p>
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
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {RETURNING_ACTIONS.map((action) => (
                    <ActionChip key={action} label={action} selected={returningAction === action} onSelect={() => setReturningAction(action)} />
                  ))}
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground p-3 rounded-xl font-black uppercase italic text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Salvando...' : 'Confirmar Registro'}
              </button>
            </>
          )}

          {activeTab === 'mensagens' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'BREAK POINT',
                  'NOME DO TORNEIO',
                  'PONTO DO GAME',
                  'PONTO DO JOGO',
                  'SET ENCERRADO',
                  'SET POINT',
                  'SUPER TIE-BREAK',
                  'TIE-BREAK',
                  'TROCA DE LADO'
                ].map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-3 rounded-xl border-2 text-xs font-black uppercase tracking-tight transition-all ${
                      selectedMessage === msg
                        ? 'border-[#FFEA00] bg-[#FFEA00]/20 text-[#FFEA00] shadow-[0_0_15px_rgba(255,234,0,0.2)]'
                        : 'border-surface-foreground/5 bg-background text-text-muted hover:border-surface-foreground/20 hover:text-text'
                    }`}
                  >
                    {msg}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="OU DIGITE UMA MENSAGEM PERSONALIZADA..."
                  value={
                    selectedMessage &&
                    ![
                      'BREAK POINT', 'NOME DO TORNEIO', 'PONTO DO GAME', 'PONTO DO JOGO',
                      'SET ENCERRADO', 'SET POINT', 'SUPER TIE-BREAK', 'TIE-BREAK', 'TROCA DE LADO',
                    ].includes(selectedMessage)
                      ? selectedMessage
                      : ''
                  }
                  onChange={(e) => setSelectedMessage(e.target.value.toUpperCase())}
                  className="w-full bg-background border-2 border-surface-foreground/5 rounded-xl p-3 text-sm font-black uppercase tracking-tight text-text placeholder:text-text-muted focus:outline-none focus:border-[#FFEA00] focus:ring-1 focus:ring-[#FFEA00] transition-all"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={async () => {
                    if (settings?.showFullStats) {
                       toast.error('Desative o placar final primeiro!')
                       return
                    }
                    if (!selectedMessage) return toast.error('Selecione ou digite uma mensagem')
                    setLoading(true)
                    await setActiveMessage(selectedMessage)
                    setLoading(false)
                    toast.success('Mensagem enviada para a tela!')
                    setSelectedMessage(null)
                    onClose()
                  }}
                  disabled={loading || !selectedMessage || settings?.showFullStats}
                  className="flex-1 bg-[#FFEA00] text-black p-3 rounded-xl font-black uppercase italic text-sm shadow-lg shadow-[#FFEA00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {loading ? 'Enviando...' : 'Mostrar na Tela'}
                </button>

                <button
                  onClick={async () => {
                    setLoading(true)
                    await setActiveMessage(null)
                    setSelectedMessage(null)
                    setLoading(false)
                    toast.success('Mensagem removida!')
                    onClose()
                  }}
                  disabled={loading}
                  className="px-6 bg-error/10 text-error border border-error/20 rounded-xl font-black uppercase tracking-widest flex flex-col items-center justify-center hover:bg-error/20 active:scale-95 transition-all"
                >
                  <Trash2 className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px]">Limpar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
