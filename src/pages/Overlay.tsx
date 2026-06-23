import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { supabase } from '../services/supabase/client'

const BG_MAP: Record<string, string> = {
  green:   '#00FF00',
  magenta: '#FF00FF',
  blue:    '#0000FF',
  cyan:    '#00FFFF',
  pink:    '#FF00FF',
}

export const OVERLAY_THEMES: Record<string, { bg: string; accent: string; accentText: string; label: string }> = {
  'navy-yellow': { bg: '#0B3B60', accent: '#FFF100', accentText: '#000000', label: 'Padrão'  },
  'black-white': { bg: '#111111', accent: '#f8fafc', accentText: '#111111', label: 'P&B'     },
  'dark-green':  { bg: '#052e16', accent: '#4ade80', accentText: '#052e16', label: 'Verde'   },
  'purple-cyan': { bg: '#1e1b4b', accent: '#22d3ee', accentText: '#1e1b4b', label: 'Roxo'   },
  'dark-orange': { bg: '#1c1917', accent: '#fb923c', accentText: '#1c1917', label: 'Laranja' },
}

const POSITIONS: Record<string, { outer: React.CSSProperties; origin: string }> = {
  'top-left':    { outer: { alignItems: 'flex-start', justifyContent: 'flex-start' }, origin: 'top left'    },
  'top-right':   { outer: { alignItems: 'flex-start', justifyContent: 'flex-end'   }, origin: 'top right'   },
  'center':      { outer: { alignItems: 'center',     justifyContent: 'center'     }, origin: 'center'      },
  'bottom-left': { outer: { alignItems: 'flex-end',   justifyContent: 'flex-start' }, origin: 'bottom left' },
  'bottom-right':{ outer: { alignItems: 'flex-end',   justifyContent: 'flex-end'   }, origin: 'bottom right'},
}

const W = 500

const Overlay = () => {
  const { matchId } = useParams()
  const [searchParams] = useSearchParams()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const bgParam = searchParams.get('bg')

  useEffect(() => {
    if (!matchId) return
    const fetchMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (data) setMatch(data)
      setLoading(false)
    }
    fetchMatch()
    const channel = supabase
      .channel(`overlay-${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, (payload) => setMatch(payload.new))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (match?.is_running && match?.started_at) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(match.started_at).getTime()) / 1000)
        setElapsedSeconds((match.elapsed || 0) + diff)
      }, 1000)
    } else {
      setElapsedSeconds(match?.elapsed || 0)
    }
    return () => clearInterval(interval)
  }, [match?.is_running, match?.started_at, match?.elapsed])

  if (loading || !match) return null

  /* ── Config do overlay ── */
  const cfg            = match.settings?.overlayConfig || {}
  const theme          = OVERLAY_THEMES[cfg.theme] || OVERLAY_THEMES['navy-yellow']
  const bgColorId      = cfg.bgColor || bgParam || 'green'
  const isTransparent  = bgColorId === 'transparent'
  const bgStyle        = isTransparent ? {} : { backgroundColor: BG_MAP[bgColorId] || '#00FF00' }
  const scale          = cfg.scale || 1.0
  const pos            = POSITIONS[cfg.position] || POSITIONS['top-left']
  const isRightAligned = cfg.position === 'top-right' || cfg.position === 'bottom-right'

  const score     = match.score || { sets: [], games: { a: 0, b: 0 }, points: { a: 0, b: 0 } }
  const players   = match.settings?.players || { teamA: ['Time A'], teamB: ['Time B'] }
  const countries = match.settings?.players?.countries
  const serving   = score.serving as 'a' | 'b' | null | undefined
  const isDoubles = !!(players.teamA?.[1] || players.teamB?.[1])

  const BR_STATE_CODES = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'])
  const flag = (code: string) => {
    if (BR_STATE_CODES.has(code.toUpperCase())) return '🇧🇷'
    return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('')
  }

  const displayPts = (pts: number) => pts === 41 ? 'AD' : String(pts ?? 0)

  const setsA = (score.sets as any[]).filter(s => s.a > s.b).length
  const setsB = (score.sets as any[]).filter(s => s.b > s.a).length

  const hasBanner =
    match?.settings?.activeStatPanel?.type === 'doubles' ||
    match?.settings?.activeStatPanel?.type === 'individual' ||
    !!match?.settings?.activeMessage

  const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')
  const ss = (elapsedSeconds % 60).toString().padStart(2, '0')

  /* ── Pills de pontuação ── */
  const ScorePills = ({ team }: { team: 'a' | 'b' }) => {
    const pts   = team === 'a' ? score.points.a : score.points.b
    const games = team === 'a' ? score.games.a  : score.games.b
    const sets  = team === 'a' ? setsA : setsB

    return (
      <div className="flex items-center gap-2 shrink-0">
        {/* Serve dot */}
        <div className="w-4 flex items-center justify-center">
          {serving === team && (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: theme.accent, boxShadow: `0 0 10px 4px ${theme.accent}88` }}
            />
          )}
        </div>
        {/* Pontos */}
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 54, height: 50, background: theme.accent }}
        >
          <span className="font-black leading-none" style={{ fontSize: 32, letterSpacing: '-0.04em', color: theme.accentText }}>
            {displayPts(pts)}
          </span>
        </div>
        {/* Games */}
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 46, height: 50, background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)' }}
        >
          <span className="text-white font-black leading-none" style={{ fontSize: 32, letterSpacing: '-0.04em' }}>
            {games}
          </span>
        </div>
        {/* Sets */}
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 46, height: 50, background: 'rgba(255,255,255,0.92)' }}
        >
          <span className="font-black leading-none" style={{ fontSize: 32, letterSpacing: '-0.04em', color: theme.bg }}>
            {sets}
          </span>
        </div>
      </div>
    )
  }

  /* ── Nomes do time ── */
  const TeamNames = ({ names, teamCountries }: { names: string[], teamCountries?: string[] }) => {
    const sz = isDoubles ? 16 : 21
    return (
      <div className="flex-1 flex flex-col justify-center gap-[3px] min-w-0 pr-3">
        {names.filter(Boolean).map((name, i) => (
          <span
            key={i}
            className="text-white font-black italic uppercase leading-none truncate"
            style={{ fontSize: sz, letterSpacing: '-0.03em' }}
          >
            {teamCountries?.[i] && (
              <span className="not-italic mr-1.5" style={{ fontSize: sz - 2 }}>
                {flag(teamCountries[i])}
              </span>
            )}
            {name}
          </span>
        ))}
      </div>
    )
  }

  const showFullStats = !!match?.settings?.showFullStats
  const activePos = showFullStats ? POSITIONS['center'] : pos

  return (
    <div
      className="min-h-screen p-8 flex"
      style={{ ...bgStyle, ...activePos.outer }}
    >
      <div
        className="flex flex-col items-start gap-2"
        style={{ transform: `scale(${scale})`, transformOrigin: activePos.origin }}
      >
        {/* ── Timer ── */}
        {!showFullStats && match.settings?.timerEnabled !== false && (
          <div
            className={`flex items-center px-4 py-1.5 ${isRightAligned ? 'self-end' : 'self-start'}`}
            style={{ background: theme.accent, borderRadius: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
          >
            <span
              className="font-black font-mono leading-none select-none"
              style={{ fontSize: 19, letterSpacing: '-0.04em', color: theme.accentText }}
            >
              {mm}:{ss}
            </span>
          </div>
        )}

        {/* ══ Full Stats Panel ══ */}
        {showFullStats ? (
          <div
            className="flex flex-col overflow-hidden"
            style={{
              width: W,
              borderRadius: 18,
              background: theme.bg,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.12)',
            }}
          >
            {/* Title */}
            <div className="flex items-center justify-center px-5 py-2.5" style={{ background: theme.accent }}>
              <span className="font-black uppercase tracking-[0.2em] leading-none" style={{ fontSize: 13, color: theme.accentText }}>
                SCOREBOARD<span style={{ fontStyle: 'italic', letterSpacing: 0 }}>BT</span>
              </span>
            </div>

            {/* Players + set scores */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
              {/* Team A — accent color */}
              <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                {players.teamA.filter(Boolean).map((name, i) => (
                  <span key={i} className="font-black italic uppercase truncate" style={{ fontSize: 10, letterSpacing: '0.08em', color: theme.accent }}>
                    {name}
                  </span>
                ))}
              </div>
              {/* Set scores */}
              {(score.sets as any[]).length > 0 && (
                <div className="flex gap-3 shrink-0">
                  {(score.sets as any[]).map((s: any, i: number) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="font-black leading-none" style={{ fontSize: 17, letterSpacing: '-0.04em', color: theme.accent }}>{s.a}</span>
                      <span className="font-black leading-none" style={{ fontSize: 17, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.75)' }}>{s.b}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Team B — white */}
              <div className="flex-1 flex flex-col gap-0.5 items-end min-w-0">
                {players.teamB.filter(Boolean).map((name, i) => (
                  <span key={i} className="font-black italic uppercase truncate" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)' }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {match.settings?.fullStatsData?.map((stat: any, i: number) => (
              <div
                key={stat.label}
                className="flex items-center"
                style={{ background: i % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'transparent' }}
              >
                {/* Team A value — accent tinted cell */}
                <div
                  className="flex-1 flex items-center justify-center py-3"
                  style={{ background: `${theme.accent}18` }}
                >
                  <span className="font-black leading-none" style={{ fontSize: 28, letterSpacing: '-0.04em', color: theme.accent }}>{stat.valA}</span>
                </div>
                {/* Label */}
                <div className="flex-1 text-center font-black italic uppercase py-3" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>
                  {stat.label}
                </div>
                {/* Team B value — white tinted cell */}
                <div
                  className="flex-1 flex items-center justify-center py-3"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <span className="font-black leading-none text-white" style={{ fontSize: 28, letterSpacing: '-0.04em' }}>{stat.valB}</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center px-4 py-2" style={{ background: theme.accent }}>
              <span className="font-black italic uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: theme.accentText }}>
                {match.settings?.tournamentName || 'TORNEIO'}
              </span>
            </div>
          </div>

        ) : (

          /* ══ Placar principal ══ */
          <div
            className="flex flex-col overflow-hidden"
            style={{
              width: W,
              borderRadius: 18,
              background: theme.bg,
              boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(255,255,255,0.12)',
            }}
          >
            {/* Cabeçalho */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: 'rgba(0,0,0,0.28)' }}
            >
              <span className="text-white/40 font-black italic uppercase" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                {match.settings?.tournamentName || ''}
              </span>
              <div className="flex items-center gap-2" style={{ paddingRight: 2 }}>
                <div style={{ width: 16 }} />
                <div style={{ width: 54 }} className="text-center">
                  <span className="text-white/35 font-black uppercase" style={{ fontSize: 8, letterSpacing: '0.2em' }}>PTS</span>
                </div>
                <div style={{ width: 46 }} className="text-center">
                  <span className="text-white/35 font-black uppercase" style={{ fontSize: 8, letterSpacing: '0.2em' }}>G</span>
                </div>
                <div style={{ width: 46 }} className="text-center">
                  <span className="text-white/35 font-black uppercase" style={{ fontSize: 8, letterSpacing: '0.2em' }}>S</span>
                </div>
              </div>
            </div>

            {/* Time A */}
            <div className="flex items-center px-4 py-3" style={{ minHeight: 70 }}>
              <TeamNames names={players.teamA} teamCountries={countries?.teamA} />
              {match?.settings?.activeStatPanel?.type === 'doubles' ? (
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ height: 50, minWidth: 190, paddingInline: 20, background: 'rgba(255,255,255,0.92)' }}
                >
                  <span className="font-black leading-none" style={{ fontSize: 28, letterSpacing: '-0.04em', color: theme.bg }}>
                    {match.settings.activeStatPanel.teamAValue}
                  </span>
                </div>
              ) : (
                <ScorePills team="a" />
              )}
            </div>

            {/* Separador */}
            <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

            {/* Time B */}
            <div className="flex items-center px-4 py-3" style={{ minHeight: 70 }}>
              <TeamNames names={players.teamB} teamCountries={countries?.teamB} />
              {match?.settings?.activeStatPanel?.type === 'doubles' ? (
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ height: 50, minWidth: 190, paddingInline: 20, background: 'rgba(255,255,255,0.92)' }}
                >
                  <span className="font-black leading-none" style={{ fontSize: 28, letterSpacing: '-0.04em', color: theme.bg }}>
                    {match.settings.activeStatPanel.teamBValue}
                  </span>
                </div>
              ) : (
                <ScorePills team="b" />
              )}
            </div>
          </div>
        )}

        {/* ── Banner ativo ── */}
        {hasBanner && !showFullStats && (
          <div
            className="flex items-center justify-between px-4 shrink-0"
            style={{
              width: W,
              height: 46,
              borderRadius: 14,
              background: theme.accent,
              boxShadow: `0 8px 28px ${theme.accent}44`,
            }}
          >
            <span
              className="font-black italic uppercase leading-none truncate"
              style={{ fontSize: 19, letterSpacing: '-0.02em', color: theme.accentText }}
            >
              {match?.settings?.activeStatPanel?.type === 'doubles' && match.settings.activeStatPanel.statLabel}
              {match?.settings?.activeStatPanel?.type === 'individual' && `${match.settings.activeStatPanel.statLabel} — ${match.settings.activeStatPanel.player}`}
              {!!match?.settings?.activeMessage && match.settings.activeMessage}
            </span>
            {match?.settings?.activeStatPanel?.type === 'individual' && (
              <span
                className="font-black leading-none shrink-0 ml-4"
                style={{ fontSize: 32, letterSpacing: '-0.04em', color: theme.accentText }}
              >
                {match.settings.activeStatPanel.value}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Overlay
