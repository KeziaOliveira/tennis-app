export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: {
          id: string
          tournament_id: string | null
          status: 'waiting' | 'live' | 'finished' | null
          score: any
          settings: any
          started_at: string | null
          paused_at: string | null
          elapsed: number | null
          is_running: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id?: string | null
          status?: 'waiting' | 'live' | 'finished' | null
          score?: any
          settings?: any
          started_at?: string | null
          paused_at?: string | null
          elapsed?: number | null
          is_running?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string | null
          status?: 'waiting' | 'live' | 'finished' | null
          score?: any
          settings?: any
          started_at?: string | null
          paused_at?: string | null
          elapsed?: number | null
          is_running?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      points: {
        Row: {
          id: string
          match_id: string
          winner: 'a' | 'b' | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          winner?: 'a' | 'b' | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          winner?: 'a' | 'b' | null
          type?: string | null
          created_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
