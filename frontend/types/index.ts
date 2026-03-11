export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Bookie {
  id: number;
  user_id: number;
  name: string;
  website?: string;
  current_balance: number;
  initial_deposit: number;
  color: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BetStatus = 'pending' | 'won' | 'lost' | 'void';
export type BetType = 'single' | 'accumulator' | 'system';

export interface Bet {
  id: number;
  user_id: number;
  bookie_id: number;
  description: string;
  bet_type: BetType;
  stake: number;
  odds: number;
  status: BetStatus;
  potential_win: number;
  actual_return: number;
  profit: number;
  placed_at: string;
  settled_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  bookie?: Bookie;
}

export type TransactionType = 'deposit' | 'withdraw' | 'transfer' | 'bet_win' | 'bet_loss';

export interface BankrollTransaction {
  id: number;
  user_id: number;
  bookie_id?: number;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  related_bet_id?: number;
  created_at: string;
  bookie?: Bookie;
}

export interface BetStats {
  total_bets: number;
  pending_bets: number;
  won_bets: number;
  lost_bets: number;
  total_staked: number;
  total_returns: number;
  total_profit: number;
  win_rate: number;
  roi: number;
}

export interface BankrollSummary {
  total_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_profit: number;
  roi: number;
  bookie_count: number;
}
