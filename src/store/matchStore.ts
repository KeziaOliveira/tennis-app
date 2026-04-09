import { create } from 'zustand'
import { supabase } from '../services/supabase/client'

export interface MatchScore {
  sets: { a: number, b: number }[]
  games: { a: number, b: number }
  points: { a: number, b: number }
}

export interface MatchSettings {
  type: 'singles' | 'doubles'
  noAd: boolean
  maxGames: number
  tiebreak: boolean
  statsEnabled: boolean
  timerEnabled: boolean
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

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  score: INITIAL_SCORE,
  settings: INITIAL_SETTINGS,
  timer: INITIAL_TIMER,
  currentServer: null,
  status: 'waiting',

  setMatch: async (matchId) => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (data) {
      // Defensive merging to prevent crashes with old data
      const dbScore = data.score || {}
      set({ 
        matchId,
        score: {
          sets: dbScore.sets || [],
          games: dbScore.games || { a: 0, b: 0 },
          points: dbScore.points || { a: 0, b: 0 }
        },
        settings: { ...INITIAL_SETTINGS, ...(data.settings || {}) },
        status: data.status,
        timer: {
          startedAt: data.started_at,
          pausedAt: data.paused_at,
          elapsed: data.elapsed || 0,
          isRunning: data.is_running || false
        }
      })
    }
  },

  addPoint: async (team) => {
    const state = get()
    if (!state.matchId) return

    let newScore = JSON.parse(JSON.stringify(state.score))
    
    // Ensure structure exists
    if (!newScore.points) newScore.points = { a: 0, b: 0 }
    if (!newScore.games) newScore.games = { a: 0, b: 0 }
    if (!newScore.sets) newScore.sets = []

    const teamKey = team
    const otherKey = team === 'a' ? 'b' : 'a'

    // Simple Tennis logic for Beach Tennis (No Ad)
    // Points: 0 -> 15 -> 30 -> 40 -> Game
    const p = newScore.points[teamKey]
    if (p === 0) newScore.points[teamKey] = 15
    else if (p === 15) newScore.points[teamKey] = 30
    else if (p === 30) newScore.points[teamKey] = 40
    else {
      // Game won
      newScore.points = { a: 0, b: 0 }
      newScore.games[teamKey] += 1
      
      // Set Check
      if (newScore.games[teamKey] >= (state.settings?.maxGames || 6)) {
         newScore.sets.push({ a: newScore.games.a, b: newScore.games.b })
         newScore.games = { a: 0, b: 0 }
      }
    }

    set({ score: newScore })

    await supabase
      .from('matches')
      .update({ score: newScore })
      .eq('id', state.matchId)

    await supabase.from('points').insert({
      match_id: state.matchId,
      winner: null,
      type: 'point'
    })
  },

  undoLastPoint: async () => {
    // Basic undo (WIP)
    console.log('Undo not fully implemented yet')
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

  syncWithSupabase: (data) => {
    const dbScore = data.score || {}
    set({
      score: {
        sets: dbScore.sets || [],
        games: dbScore.games || { a: 0, b: 0 },
        points: dbScore.points || { a: 0, b: 0 }
      },
      settings: data.settings || INITIAL_SETTINGS,
      status: data.status,
      timer: {
        startedAt: data.started_at,
        pausedAt: data.paused_at,
        elapsed: data.elapsed || 0,
        isRunning: data.is_running || false
      }
    })
  }
}))
