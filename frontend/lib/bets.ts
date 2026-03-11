import { createClient } from './supabase/client';
import { Database } from '@/types/supabase';

type Bet = Database['public']['Tables']['bets']['Row'];
type BetInsert = Database['public']['Tables']['bets']['Insert'];
type BetUpdate = Database['public']['Tables']['bets']['Update'];

/**
 * Get all bets for the current user
 */
export async function getBets(filters?: {
  bookieId?: string;
  status?: string;
  limit?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from('bets')
    .select('*, bookies(name, color)')
    .order('placed_at', { ascending: false });

  if (filters?.bookieId) {
    query = query.eq('bookie_id', filters.bookieId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get a single bet by ID
 */
export async function getBet(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bets')
    .select('*, bookies(name, color)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new bet
 */
export async function createBet(bet: BetInsert) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bets')
    .insert({
      ...bet,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

/**
 * Update a bet
 */
export async function updateBet(id: string, updates: BetUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

/**
 * Update bet status (won/lost/void)
 */
export async function updateBetStatus(id: string, status: 'won' | 'lost' | 'void') {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bets')
    .update({ 
      status,
      settled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}

/**
 * Delete a bet
 */
export async function deleteBet(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('bets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get betting statistics for the current user
 */
export async function getBetStats() {
  const supabase = createClient();
  const { data: bets, error } = await supabase
    .from('bets')
    .select('*');

  if (error) throw error;

  const totalBets = bets.length;
  const pendingBets = bets.filter(b => b.status === 'pending').length;
  const settledBets = bets.filter(b => b.status !== 'pending');
  const wonBets = bets.filter(b => b.status === 'won').length;
  const lostBets = bets.filter(b => b.status === 'lost').length;
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0);

  return {
    totalBets,
    pendingBets,
    wonBets,
    lostBets,
    winRate: settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0,
    totalStaked,
    totalProfit,
    roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
  };
}

/**
 * Get shared bets from the community
 */
export async function getSharedBets(limit = 20) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bets')
    .select('*, users(username, display_name, avatar_url)')
    .eq('is_shared', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Toggle bet sharing status
 */
export async function toggleBetSharing(id: string, isShared: boolean) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bets')
    .update({ is_shared: isShared })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Bet;
}
