import { create } from 'zustand'
import { supabase } from '../services/supabase/client'

export interface MatchScore {
  sets: { a: number, b: number }[]
  games: { a: number, b: number }
  points: { a: number, b: number }
}

export interface MatchSettings {
  type: 'singles' | 'doubles'
  tournamentName?: string
  noAd: boolean
  maxGames: number
  tiebreak: boolean
  statsEnabled: boolean
  timerEnabled: boolean
  saqueEnabled?: boolean
  autoOpenStats?: boolean
  players?: {
    teamA: string[]
    teamB: string[]
    countries?: { teamA: string[]; teamB: string[] } | null
  }
  activeMessage?: string | null
  activeStatPanel?: {
    type: 'individual' | 'doubles'
    statLabel: string
    player?: string
    teamAValue?: string
    teamBValue?: string
    value?: string
  } | null
  showFullStats?: boolean
  fullStatsData?: { label: string, valA: string, valB: string }[]
  isStatsSaved?: boolean
  overlayConfig?: {
    theme?: string
    position?: string
    scale?: number
    bgColor?: string
  }
}

export interface TimerState {
  startedAt: string | null
  pausedAt: string | null
  elapsed: number
  isRunning: boolean
}

interface MatchState {
  matchId: string | null
  score: MatchScore
  settings: MatchSettings
  timer: TimerState
  currentServer: string | null
  status: 'waiting' | 'live' | 'finished'
  
  // Actions
  setMatch: (matchId: string) => Promise<void>
  addPoint: (team: 'a' | 'b') => Promise<void>
  undoLastPoint: () => Promise<void>
  toggleTimer: () => Promise<void>
  resetTimer: () => Promise<void>
  finishMatch: () => Promise<void>
  setActiveMessage: (msg: string | null) => Promise<void>
  setActiveStatPanel: (stat: any) => Promise<void>
  setShowFullStats: (show: boolean) => Promise<void>
  saveStats: () => Promise<void>
  updateSettings: (settingsUpdate: Partial<MatchSettings>) => Promise<void>
  syncWithSupabase: (data: any) => void
}

const INITIAL_SCORE: MatchScore = {
  sets: [],
  games: { a: 0, b: 0 },
  points: { a: 0, b: 0 }
}

const INITIAL_SETTINGS: MatchSettings = {
  type: 'doubles',
  noAd: true,
  maxGames: 6,
  tiebreak: true,
  statsEnabled: true,
  timerEnabled: true
}

const INITIAL_TIMER: TimerState = {
  startedAt: null,
  pausedAt: null,
  elapsed: 0,
  isRunning: false
}

let messageTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  score: INITIAL_SCORE,
  settings: INITIAL_SETTINGS,
  timer: INITIAL_TIMER,
  currentServer: null,
  status: 'waiting',

  setMatch: async (matchId) => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (data) {
      // Defensive merging to prevent crashes with old data
      const dbScore = (data.score as any) || {}
      set({ 
        matchId,
        score: {
          sets: dbScore.sets || [],
          games: dbScore.games || { a: 0, b: 0 },
          points: dbScore.points || { a: 0, b: 0 }
        },
        settings: { ...INITIAL_SETTINGS, ...(data.settings as object || {}) },
        status: (data.status || 'waiting') as 'waiting' | 'live' | 'finished',
        timer: {
          startedAt: data.started_at,
          pausedAt: data.paused_at,
          elapsed: data.elapsed || 0,
          isRunning: data.is_running || false
        }
      })
    }
  },

  setActiveMessage: async (msg) => {
    const state = get()
    if (!state.matchId) return

    const newSettings = { ...state.settings, activeMessage: msg, activeStatPanel: null }
    set({ settings: newSettings })

    await supabase
      .from('matches')
      .update({ settings: newSettings as any })
      .eq('id', state.matchId)

    // Handle auto-hide
    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }
    
    if (msg) {
      // Log the message history in points table
      await supabase.from('points').insert({
        match_id: state.matchId,
        type: 'message',
        metadata: { text: msg }
      } as any)

      messageTimeout = setTimeout(() => {
        get().setActiveMessage(null);
      }, 7000); // Auto hide after 7 seconds
    }
  },

  setActiveStatPanel: async (stat) => {
    const state = get()
    if (!state.matchId) return

    const newSettings = { ...state.settings, activeStatPanel: stat, activeMessage: null }
    set({ settings: newSettings })

    await supabase
      .from('matches')
      .update({ settings: newSettings as any })
      .eq('id', state.matchId)

    if (messageTimeout) {
      clearTimeout(messageTimeout);
      messageTimeout = null;
    }
    
    if (stat) {
      messageTimeout = setTimeout(() => {
        get().setActiveStatPanel(null);
      }, 10000); // Auto hide after 10 seconds for stats
    }
  },

  setShowFullStats: async (show) => {
    const state = get()
    if (!state.matchId) return

    const newSettings = { ...state.settings, showFullStats: show }
    set({ settings: newSettings })

    await supabase
      .from('matches')
      .update({ settings: newSettings as any })
      .eq('id', state.matchId)
  },

  saveStats: async () => {
    const state = get()
    if (!state.matchId) return

    const newSettings = { ...state.settings, isStatsSaved: true }
    set({ settings: newSettings })

    await supabase
      .from('matches')
      .update({ settings: newSettings as any })
      .eq('id', state.matchId)
  },

  updateSettings: async (settingsUpdate) => {
    const state = get()
    if (!state.matchId) return

    const newSettings = { ...state.settings, ...settingsUpdate }
    set({ settings: newSettings })

    await supabase
      .from('matches')
      .update({ settings: newSettings as any })
      .eq('id', state.matchId)
  },

  addPoint: async (team) => {
    const state = get()
    if (!state.matchId || state.status === 'finished') return

    let newScore = JSON.parse(JSON.stringify(state.score))
    if (!newScore.points) newScore.points = { a: 0, b: 0 }
    if (!newScore.games) newScore.games = { a: 0, b: 0 }
    if (!newScore.sets) newScore.sets = []

    const noAd = state.settings?.noAd ?? true
    const maxGames = state.settings?.maxGames || 6
    const opp = team === 'a' ? 'b' : 'a'
    const p = newScore.points[team]
    const oppP = newScore.points[opp]

    const winGame = () => {
      newScore.points = { a: 0, b: 0 }
      newScore.games[team] += 1
      if (newScore.games[team] >= maxGames) {
        newScore.sets.push({ a: newScore.games.a, b: newScore.games.b })
        newScore.games = { a: 0, b: 0 }
      }
    }

    if (p === 0) newScore.points[team] = 15
    else if (p === 15) newScore.points[team] = 30
    else if (p === 30) newScore.points[team] = 40
    else if (p === 40) {
      if (noAd || oppP < 40) {
        winGame()
      } else if (oppP === 41) {
        // Opponent had advantage → back to deuce
        newScore.points[opp] = 40
      } else {
        // Both at 40 → this team gets advantage
        newScore.points[team] = 41
      }
    } else {
      // p === 41 (advantage) → win game
      winGame()
    }

    set({ score: newScore })

    await supabase
      .from('matches')
      .update({ score: newScore })
      .eq('id', state.matchId)

    await supabase.from('points').insert({
      match_id: state.matchId,
      winner: team,
      type: 'point',
      metadata: {
        set_number: state.score.sets.length + 1
      }
    } as any)
  },

  undoLastPoint: async () => {
    const state = get()
    if (!state.matchId || state.status === 'finished') return

    // 1. Find and delete the last point
    const { data: lastPoints } = await supabase
      .from('points')
      .select('id')
      .eq('match_id', state.matchId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastPoints && lastPoints.length > 0) {
      await supabase.from('points').delete().eq('id', lastPoints[0].id)
    }

    // 2. Fetch all remaining points
    const { data: allPoints } = await supabase
      .from('points')
      .select('winner')
      .eq('match_id', state.matchId)
      .order('created_at', { ascending: true })

    // 3. Reconstruct score
    let reconstructedScore: MatchScore = {
      sets: [],
      games: { a: 0, b: 0 },
      points: { a: 0, b: 0 }
    }

    const noAd = state.settings?.noAd ?? true
    const maxGames = state.settings?.maxGames || 6

    if (allPoints) {
      allPoints.forEach((pt: any) => {
        if (!pt.winner) return
        const t = pt.winner as 'a' | 'b'
        const opp = t === 'a' ? 'b' : 'a'
        const p = reconstructedScore.points[t]
        const oppP = reconstructedScore.points[opp]

        const winGame = () => {
          reconstructedScore.points = { a: 0, b: 0 }
          reconstructedScore.games[t] += 1
          if (reconstructedScore.games[t] >= maxGames) {
            reconstructedScore.sets.push({ a: reconstructedScore.games.a, b: reconstructedScore.games.b })
            reconstructedScore.games = { a: 0, b: 0 }
          }
        }

        if (p === 0) reconstructedScore.points[t] = 15
        else if (p === 15) reconstructedScore.points[t] = 30
        else if (p === 30) reconstructedScore.points[t] = 40
        else if (p === 40) {
          if (noAd || oppP < 40) { winGame() }
          else if (oppP === 41) { reconstructedScore.points[opp] = 40 }
          else { reconstructedScore.points[t] = 41 }
        } else {
          winGame()
        }
      })
    }

    set({ score: reconstructedScore })
    await supabase.from('matches').update({ score: reconstructedScore as any }).eq('id', state.matchId)
  },

  finishMatch: async () => {
    const state = get()
    if (!state.matchId) return

    const update = {
      status: 'finished' as const,
      is_running: false,
      paused_at: new Date().toISOString()
    }

    set((s) => ({
      status: 'finished',
      timer: { ...s.timer, isRunning: false }
    }))

    await supabase.from('matches').update(update).eq('id', state.matchId)
  },

  toggleTimer: async () => {
    const state = get()
    if (!state.matchId) return

    const now = new Date().toISOString()
    const isRunning = !state.timer.isRunning
    let update: any = { is_running: isRunning }

    if (isRunning) {
      update.started_at = now
      update.paused_at = null
    } else {
      update.paused_at = now
      if (state.timer.startedAt) {
        const diff = Math.floor((new Date(now).getTime() - new Date(state.timer.startedAt).getTime()) / 1000)
        update.elapsed = (state.timer.elapsed || 0) + diff
      }
    }

    set((s) => ({
      timer: {
        ...s.timer,
        isRunning,
        startedAt: isRunning ? now : s.timer.startedAt,
        pausedAt: isRunning ? null : now,
        elapsed: update.elapsed || s.timer.elapsed
      }
    }))

    await supabase.from('matches').update(update).eq('id', state.matchId)
  },

  resetTimer: async () => {
    const state = get()
    if (!state.matchId) return

    set((s) => ({
      timer: { ...s.timer, isRunning: false, elapsed: 0, startedAt: null, pausedAt: null }
    }))

    await supabase.from('matches').update({
      is_running: false,
      elapsed: 0,
      started_at: null,
      paused_at: null,
    }).eq('id', state.matchId)
  },

  syncWithSupabase: (data) => {
    const dbScore = data.score || {}
    set({
      score: {
        sets: dbScore.sets || [],
        games: dbScore.games || { a: 0, b: 0 },
        points: dbScore.points || { a: 0, b: 0 }
      },
      settings: { ...INITIAL_SETTINGS, ...(data.settings || {}) },
      status: (data.status || 'waiting') as 'waiting' | 'live' | 'finished',
      timer: {
        startedAt: data.started_at,
        pausedAt: data.paused_at,
        elapsed: data.elapsed || 0,
        isRunning: data.is_running || false
      }
    })
  }
}))
