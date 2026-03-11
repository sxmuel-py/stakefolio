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
      users: {
        Row: {
          id: string
          email: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          total_profit: number
          total_bets: number
          win_rate: number
          created_at: string
          updated_at: string
          preferred_currency: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          total_profit?: number
          total_bets?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
          preferred_currency?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          total_profit?: number
          total_bets?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
          preferred_currency?: string
        }
      }
      bookies: {
        Row: {
          id: string
          user_id: string
          name: string
          website: string | null
          current_balance: number
          initial_deposit: number
          color: string
          notes: string | null
          created_at: string
          updated_at: string
          currency: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          website?: string | null
          current_balance?: number
          initial_deposit?: number
          color?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          currency?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          website?: string | null
          current_balance?: number
          initial_deposit?: number
          color?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          currency?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          bookie_id: string
          description: string
          bet_type: string
          stake: number
          odds: number
          status: string
          potential_win: number | null
          actual_return: number
          profit: number | null
          placed_at: string
          settled_at: string | null
          notes: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bookie_id: string
          description: string
          bet_type?: string
          stake: number
          odds: number
          status?: string
          potential_win?: number | null
          actual_return?: number
          profit?: number | null
          placed_at?: string
          settled_at?: string | null
          notes?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bookie_id?: string
          description?: string
          bet_type?: string
          stake?: number
          odds?: number
          status?: string
          potential_win?: number | null
          actual_return?: number
          profit?: number | null
          placed_at?: string
          settled_at?: string | null
          notes?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bankroll_transactions: {
        Row: {
          id: string
          user_id: string
          bookie_id: string | null
          type: string
          amount: number
          balance_before: number | null
          balance_after: number | null
          description: string | null
          related_bet_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bookie_id?: string | null
          type: string
          amount: number
          balance_before?: number | null
          balance_after?: number | null
          description?: string | null
          related_bet_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bookie_id?: string | null
          type?: string
          amount?: number
          balance_before?: number | null
          balance_after?: number | null
          description?: string | null
          related_bet_id?: string | null
          created_at?: string
        }
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      betting_tips: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          sport: string | null
          odds: number | null
          stake_recommendation: number | null
          confidence_level: number | null
          status: string
          is_premium: boolean
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          sport?: string | null
          odds?: number | null
          stake_recommendation?: number | null
          confidence_level?: number | null
          status?: string
          is_premium?: boolean
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          sport?: string | null
          odds?: number | null
          stake_recommendation?: number | null
          confidence_level?: number | null
          status?: string
          is_premium?: boolean
          likes_count?: number
          comments_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      tip_likes: {
        Row: {
          id: string
          tip_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          tip_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          tip_id?: string
          user_id?: string
          created_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: number
          from_currency: string
          to_currency: string
          rate: number
          updated_at: string
        }
        Insert: {
          id?: number
          from_currency: string
          to_currency: string
          rate: number
          updated_at?: string
        }
        Update: {
          id?: number
          from_currency?: string
          to_currency?: string
          rate?: number
          updated_at?: string
        }
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
  }
}
