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
      players: {
        Row: {
          id: string
          name: string
          country: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          country?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string | null
          created_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          tournament_id: string | null
          status: 'waiting' | 'live' | 'finished'
          current_server: string | null
          score: Json
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          tournament_id?: string | null
          status?: 'waiting' | 'live' | 'finished'
          current_server?: string | null
          score?: Json
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string | null
          status?: 'waiting' | 'live' | 'finished'
          current_server?: string | null
          score?: Json
          settings?: Json
          created_at?: string
        }
      }
      points: {
        Row: {
          id: string
          match_id: string | null
          server: string | null
          winner: string | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          match_id?: string | null
          server?: string | null
          winner?: string | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string | null
          server?: string | null
          winner?: string | null
          type?: string | null
          created_at?: string
        }
      }
    }
  }
}
