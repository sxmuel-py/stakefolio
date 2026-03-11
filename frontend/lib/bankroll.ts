import { createClient } from './supabase/client';
import { Database } from '@/types/supabase';

type Transaction = Database['public']['Tables']['bankroll_transactions']['Row'];

/**
 * Get all transactions for the current user
 */
export async function getTransactions(bookieId?: string) {
  const supabase = createClient();
  let query = supabase
    .from('bankroll_transactions')
    .select('*, bookies(name, color)')
    .order('created_at', { ascending: false });

  if (bookieId) {
    query = query.eq('bookie_id', bookieId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create a deposit transaction
 */
export async function createDeposit(bookieId: string, amount: number, description?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current bookie balance
  const { data: bookie, error: bookieError } = await supabase
    .from('bookies')
    .select('current_balance')
    .eq('id', bookieId)
    .single();

  if (bookieError) throw bookieError;

  const balanceBefore = bookie.current_balance;
  const balanceAfter = balanceBefore + amount;

  // Update bookie balance
  const { error: updateError } = await supabase
    .from('bookies')
    .update({ current_balance: balanceAfter })
    .eq('id', bookieId);

  if (updateError) throw updateError;

  // Create transaction record
  const { data, error } = await supabase
    .from('bankroll_transactions')
    .insert({
      user_id: user.id,
      bookie_id: bookieId,
      type: 'deposit',
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: description || 'Deposit',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * Create a withdrawal transaction
 */
export async function createWithdrawal(bookieId: string, amount: number, description?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current bookie balance
  const { data: bookie, error: bookieError } = await supabase
    .from('bookies')
    .select('current_balance')
    .eq('id', bookieId)
    .single();

  if (bookieError) throw bookieError;

  const balanceBefore = bookie.current_balance;
  
  if (balanceBefore < amount) {
    throw new Error('Insufficient balance');
  }

  const balanceAfter = balanceBefore - amount;

  // Update bookie balance
  const { error: updateError } = await supabase
    .from('bookies')
    .update({ current_balance: balanceAfter })
    .eq('id', bookieId);

  if (updateError) throw updateError;

  // Create transaction record
  const { data, error } = await supabase
    .from('bankroll_transactions')
    .insert({
      user_id: user.id,
      bookie_id: bookieId,
      type: 'withdraw',
      amount: -amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: description || 'Withdrawal',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

/**
 * Get bankroll summary for the current user
 */
export async function getBankrollSummary() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all bookies
  const { data: bookies, error: bookiesError } = await supabase
    .from('bookies')
    .select('current_balance, initial_deposit');

  if (bookiesError) throw bookiesError;

  // Get all bets
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('profit, status');

  if (betsError) throw betsError;

  const totalBalance = bookies.reduce((sum, b) => sum + b.current_balance, 0);
  const totalDeposited = bookies.reduce((sum, b) => sum + b.initial_deposit, 0);
  const totalProfit = bets
    .filter(b => b.status !== 'pending')
    .reduce((sum, b) => sum + (b.profit || 0), 0);

  return {
    totalBalance,
    totalDeposited,
    totalProfit,
    roi: totalDeposited > 0 ? (totalProfit / totalDeposited) * 100 : 0,
    bookieCount: bookies.length,
  };
}
