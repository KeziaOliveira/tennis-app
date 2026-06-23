import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../services/supabase/client'
import { ChevronLeft, Users, Flag, Settings, Play, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z" />
  </svg>
)

const FlagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" {...props}>
    <path d="M144 88C144 74.7 133.3 64 120 64C106.7 64 96 74.7 96 88L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 452L224.3 431.9C265.4 421.6 308.9 426.4 346.8 445.3C391 467.4 442.3 470.1 488.5 452.7L523.2 439.7C535.7 435 544 423.1 544 409.7L544 130C544 107 519.8 92 499.2 102.3L489.6 107.1C443.3 130.3 388.8 130.3 342.5 107.1C307.4 89.5 267.1 85.1 229 94.6L144 116L144 88zM144 165.5L240.6 141.3C267.6 134.6 296.1 137.7 321 150.1C375.9 177.5 439.7 179.8 496 156.9L496 398.7L471.6 407.8C437.9 420.4 400.4 418.5 368.2 402.4C320 378.3 264.9 372.3 212.6 385.3L144 402.5L144 165.5z" />
  </svg>
)

const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'PE', name: 'Peru' },
  { code: 'US', name: 'EUA' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'IT', name: 'Itália' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'NL', name: 'Holanda' },
]

const BR_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
]

const STATE_CODES = new Set(BR_STATES.map(s => s.code))

const flag = (code: string) => {
  if (STATE_CODES.has(code.toUpperCase())) return '🇧🇷'
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
}

const CountryPicker = ({
  value, onChange, hasError = false,
}: {
  value: string; onChange: (v: string) => void; hasError?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-[3.75rem] h-[50px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all gap-0.5 ${
          value
            ? 'bg-background border-text/15 text-text hover:border-text/30'
            : hasError
            ? 'bg-error/5 border-error/40 text-error/50 hover:border-error/60'
            : 'bg-background border-text/8 text-text-muted/40 hover:border-text/20 hover:text-text-muted'
        }`}
      >
        {value ? (
          <>
            <span className="text-xl leading-none">{flag(value)}</span>
            <span className="text-[8px] font-black tracking-widest text-text-muted">{value}</span>
          </>
        ) : (
          <FlagIcon className="w-5 h-5 fill-current opacity-25" />
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-surface rounded-2xl border border-text/10 shadow-2xl overflow-hidden w-52 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-72 overflow-y-auto">
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-xs font-black text-text-muted hover:bg-text/5 transition-colors flex items-center gap-3"
            >
              <span className="text-base opacity-40">🌐</span>
              <span>Nenhum</span>
            </button>
            <div className="h-px bg-text/5 mx-3" />
            <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted/50">Países</p>
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code); setOpen(false) }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                  value === c.code
                    ? 'bg-primary/10 text-primary'
                    : 'text-text hover:bg-text/5'
                }`}
              >
                <span className="text-xl leading-none">{flag(c.code)}</span>
                <span className="font-bold flex-1 text-left text-xs">{c.name}</span>
                <span className="text-[10px] font-black text-text-muted/60">{c.code}</span>
              </button>
            ))}
            <div className="h-px bg-text/5 mx-3 mt-1" />
            <p className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted/50">Estados Brasileiros</p>
            {BR_STATES.map(s => (
              <button
                key={s.code}
                onClick={() => { onChange(s.code); setOpen(false) }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                  value === s.code
                    ? 'bg-primary/10 text-primary'
                    : 'text-text hover:bg-text/5'
                }`}
              >
                <span className="text-xl leading-none">🇧🇷</span>
                <span className="font-bold flex-1 text-left text-xs">{s.name}</span>
                <span className="text-[10px] font-black text-text-muted/60">{s.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Toggle = ({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
      active
        ? 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.12)]'
        : 'bg-background/60 border-text/8 text-text-muted hover:border-text/20 hover:text-text'
    }`}
  >
    <span className={`w-3 h-3 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-text/20'}`}>
      {active && <span className="w-1 h-1 rounded-full bg-white" />}
    </span>
    {label}
  </button>
)

interface TeamState { p1: string; c1: string; p2: string; c2: string }

export default function MatchSetup() {
  const navigate = useNavigate()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [allPlayers, setAllPlayers] = useState<any[]>([])

  const [tournamentName, setTournamentName] = useState('')
  const [type, setType] = useState<'singles' | 'doubles'>('doubles')
  const [teamA, setTeamA] = useState<TeamState>({ p1: '', c1: '', p2: '', c2: '' })
  const [teamB, setTeamB] = useState<TeamState>({ p1: '', c1: '', p2: '', c2: '' })
  const [settings, setSettings] = useState({
    noAd: true, maxGames: 6, tiebreak: true,
    statsEnabled: true, timerEnabled: true, saqueEnabled: true, autoOpenStats: false,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('id, name')
    if (data) setAllPlayers(data)
  }

  const getOrCreatePlayer = async (name: string) => {
    if (!name.trim()) return null
    const existing = allPlayers.find(p => p.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing.id
    const { data } = await supabase.from('players').insert({ name: name.trim() }).select().single()
    return data?.id ?? null
  }

  const activePlayers = [
    { name: teamA.p1, country: teamA.c1 },
    ...(type === 'doubles' ? [{ name: teamA.p2, country: teamA.c2 }] : []),
    { name: teamB.p1, country: teamB.c1 },
    ...(type === 'doubles' ? [{ name: teamB.p2, country: teamB.c2 }] : []),
  ]
  const anyCountrySet = activePlayers.some(p => p.country !== '')
  const allCountriesSet = activePlayers.every(p => p.country !== '')
  const countriesIncomplete = anyCountrySet && !allCountriesSet

  const needsFlag = (country: string) => countriesIncomplete && country === ''

  const handleStartMatch = async () => {
    if (!teamA.p1.trim()) return toast.error('Informe pelo menos o Jogador 1 do Time A')
    if (!teamB.p1.trim()) return toast.error('Informe pelo menos o Jogador 1 do Time B')
    if (countriesIncomplete) return toast.error('Defina o país de todos os jogadores ou deixe todos em branco')

    setLoading(true)
    try {
      await getOrCreatePlayer(teamA.p1)
      if (type === 'doubles') await getOrCreatePlayer(teamA.p2)
      await getOrCreatePlayer(teamB.p1)
      if (type === 'doubles') await getOrCreatePlayer(teamB.p2)

      let tournamentId = null
      const { data: tourney } = await supabase.from('tournaments').select('id').limit(1).single()
      if (tourney) tournamentId = tourney.id

      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          tournament_id: tournamentId,
          status: 'live',
          settings: {
            ...settings,
            type,
            tournamentName: tournamentName.trim() || 'Arena Central',
            players: {
              teamA: [teamA.p1, ...(type === 'doubles' ? [teamA.p2] : [])].filter(Boolean),
              teamB: [teamB.p1, ...(type === 'doubles' ? [teamB.p2] : [])].filter(Boolean),
              countries: anyCountrySet ? {
                teamA: [teamA.c1, ...(type === 'doubles' ? [teamA.c2] : [])],
                teamB: [teamB.c1, ...(type === 'doubles' ? [teamB.c2] : [])],
              } : null,
            },
          },
          score: { sets: [], games: { a: 0, b: 0 }, points: { a: 0, b: 0 } },
        })
        .select()
        .single()

      if (error) throw error
      toast.success('Partida iniciada!')
      navigate(`/match/${match.id}`)
    } catch (err: any) {
      toast.error('Erro ao criar partida: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full bg-background rounded-2xl border border-text/8 px-4 py-3.5 text-sm font-bold text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all`

  return (
    <div className="min-h-screen bg-background">
      {/* Header — same as Dashboard */}
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-surface/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <TrophyIcon className="w-5 h-5 fill-current text-primary" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-text">
              Scoreboard<span className="text-primary">BT</span>
            </span>
          </button>

          <div className="flex items-center gap-1">
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
            <button
              onClick={() => navigate('/')}
              className="p-2.5 hover:bg-surface rounded-xl transition-all hover:scale-105 active:scale-95 text-text-muted hover:text-primary"
              title="Voltar ao Dashboard"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">Novo Evento</h1>
            <p className="text-base text-text-muted font-medium">Configure os times e regras da partida</p>
          </div>
          <button
            onClick={handleStartMatch}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 bg-primary text-primary-foreground px-8 py-3.5 rounded-3xl font-black uppercase italic text-base shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 whitespace-nowrap sm:w-auto w-full"
          >
            {loading ? (
              <span className="animate-pulse">Criando...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Iniciar Partida
              </>
            )}
          </button>
        </div>

        {/* Row 1: Tournament name + Match type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <section className="md:col-span-2 bg-surface rounded-[1.75rem] border border-text/5 p-6 space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              <TrophyIcon className="w-3.5 h-3.5 fill-current text-primary" />
              Nome do Torneio
            </label>
            <input
              placeholder="Ex: Copa Arena Beach, Open BT..."
              className={inputCls}
              value={tournamentName}
              onChange={e => setTournamentName(e.target.value)}
            />
          </section>

          <section className="bg-surface rounded-[1.75rem] border border-text/5 p-6 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              <Users className="w-3.5 h-3.5" />
              Modalidade
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['singles', 'doubles'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3 rounded-2xl font-black uppercase italic tracking-tight text-sm transition-all border-2 ${
                    type === t
                      ? 'bg-primary/10 border-primary/50 text-primary shadow-[0_0_16px_rgba(var(--primary-rgb),0.15)]'
                      : 'bg-background/60 border-text/8 text-text-muted hover:border-text/20 hover:text-text'
                  }`}
                >
                  {t === 'singles' ? 'Simples' : 'Duplas'}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Row 2: Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="bg-surface rounded-[1.75rem] border border-text/5 p-6 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Flag className="w-3.5 h-3.5" />
              Time A
            </label>
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input list="players" placeholder="Jogador 1" className={inputCls}
                  value={teamA.p1} onChange={e => setTeamA({ ...teamA, p1: e.target.value })} />
                <CountryPicker value={teamA.c1} onChange={v => setTeamA({ ...teamA, c1: v })} hasError={needsFlag(teamA.c1)} />
              </div>
              {type === 'doubles' && (
                <div className="flex gap-2">
                  <input list="players" placeholder="Jogador 2" className={inputCls}
                    value={teamA.p2} onChange={e => setTeamA({ ...teamA, p2: e.target.value })} />
                  <CountryPicker value={teamA.c2} onChange={v => setTeamA({ ...teamA, c2: v })} hasError={needsFlag(teamA.c2)} />
                </div>
              )}
            </div>
          </section>

          <section className="bg-surface rounded-[1.75rem] border border-text/5 p-6 space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              <Flag className="w-3.5 h-3.5" />
              Time B
            </label>
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input list="players" placeholder="Jogador 1" className={`${inputCls} focus:border-accent/50 focus:ring-accent/10`}
                  value={teamB.p1} onChange={e => setTeamB({ ...teamB, p1: e.target.value })} />
                <CountryPicker value={teamB.c1} onChange={v => setTeamB({ ...teamB, c1: v })} hasError={needsFlag(teamB.c1)} />
              </div>
              {type === 'doubles' && (
                <div className="flex gap-2">
                  <input list="players" placeholder="Jogador 2" className={`${inputCls} focus:border-accent/50 focus:ring-accent/10`}
                    value={teamB.p2} onChange={e => setTeamB({ ...teamB, p2: e.target.value })} />
                  <CountryPicker value={teamB.c2} onChange={v => setTeamB({ ...teamB, c2: v })} hasError={needsFlag(teamB.c2)} />
                </div>
              )}
            </div>
          </section>
        </div>

        <datalist id="players">
          {allPlayers.map(p => <option key={p.id} value={p.name} />)}
        </datalist>

        {/* Row 3: Rules */}
        <section className="bg-surface rounded-[1.75rem] border border-text/5 p-6 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
            <Settings className="w-3.5 h-3.5" />
            Regras da Partida
          </label>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1 bg-background rounded-2xl border border-text/8 p-1">
              {[6, 8].map(n => (
                <button key={n} onClick={() => setSettings({ ...settings, maxGames: n })}
                  className={`px-4 py-2 text-xs font-black uppercase italic rounded-xl transition-all ${
                    settings.maxGames === n ? 'bg-primary/15 text-primary shadow-sm' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {n} Games
                </button>
              ))}
            </div>
            <Toggle active={settings.noAd} onToggle={() => setSettings({ ...settings, noAd: !settings.noAd })} label="No-Ad" />
            <Toggle active={settings.tiebreak} onToggle={() => setSettings({ ...settings, tiebreak: !settings.tiebreak })} label="Tiebreak" />
            <Toggle active={settings.saqueEnabled} onToggle={() => setSettings({ ...settings, saqueEnabled: !settings.saqueEnabled })} label="Saque" />
            <Toggle active={settings.statsEnabled} onToggle={() => setSettings({ ...settings, statsEnabled: !settings.statsEnabled, autoOpenStats: false })} label="Stats" />
            {settings.statsEnabled && (
              <Toggle active={settings.autoOpenStats} onToggle={() => setSettings({ ...settings, autoOpenStats: !settings.autoOpenStats })} label="Stats por Ponto" />
            )}
            <Toggle active={settings.timerEnabled} onToggle={() => setSettings({ ...settings, timerEnabled: !settings.timerEnabled })} label="Timer" />
          </div>
        </section>
      </main>
    </div>
  )
}
