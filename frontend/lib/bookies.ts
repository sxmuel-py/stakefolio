import { createClient } from './supabase/client';
import { Database } from '@/types/supabase';

type Bookie = Database['public']['Tables']['bookies']['Row'];
type BookieInsert = Database['public']['Tables']['bookies']['Insert'];
type BookieUpdate = Database['public']['Tables']['bookies']['Update'];

/**
 * Get all bookies for the current user
 */
export async function getBookies() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bookies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Bookie[];
}

/**
 * Get a single bookie by ID
 */
export async function getBookie(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bookies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Bookie;
}

/**
 * Create a new bookie
 */
export async function createBookie(bookie: BookieInsert) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bookies')
    .insert({
      ...bookie,
      user_id: user.id,
      current_balance: bookie.initial_deposit || 0,
    })
    .select()
    .single();

  if (error) throw error;

  // Create initial deposit transaction if there's an initial deposit
  if (bookie.initial_deposit && bookie.initial_deposit > 0) {
    await supabase.from('bankroll_transactions').insert({
      user_id: user.id,
      bookie_id: data.id, // data.id is string UUID
      type: 'deposit',
      amount: bookie.initial_deposit,
      balance_before: 0,
      balance_after: bookie.initial_deposit,
      description: 'Initial deposit',
    });
  }

  return data as Bookie;
}

/**
 * Update a bookie
 */
export async function updateBookie(id: string, updates: BookieUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bookies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Bookie;
}

/**
 * Delete a bookie
 */
export async function deleteBookie(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('bookies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get bookie statistics
 */
export async function getBookieStats(bookieId: string) {
  const supabase = createClient();
  const { data: bets, error } = await supabase
    .from('bets')
    .select('*')
    .eq('bookie_id', bookieId);

  if (error) throw error;

  const totalBets = bets.length;
  const settledBets = bets.filter(b => b.status !== 'pending');
  const wonBets = bets.filter(b => b.status === 'won').length;
  const totalProfit = bets.reduce((sum, bet) => sum + (bet.profit || 0), 0);

  return {
    totalBets,
    wonBets,
    winRate: settledBets.length > 0 ? (wonBets / settledBets.length) * 100 : 0,
    totalProfit,
    roi: settledBets.length > 0 
      ? (totalProfit / settledBets.reduce((sum, bet) => sum + bet.stake, 0)) * 100 
      : 0,
  };
}
