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

  const { data, error } = await (query as any);
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
  const { data: bookieData, error: bookieError } = await (supabase
    .from('bookies') as any)
    .select('current_balance')
    .eq('id', bookieId)
    .single();

  if (bookieError) throw bookieError;
  const currentBookie = bookieData as any;

  const balanceBefore = currentBookie.current_balance;
  const balanceAfter = balanceBefore + amount;

  // Update bookie balance
  const { error: updateError } = await (supabase
    .from('bookies') as any)
    .update({ current_balance: balanceAfter })
    .eq('id', bookieId);

  if (updateError) throw updateError;

  // Create transaction record
  const { data, error } = await (supabase
    .from('bankroll_transactions') as any)
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
  const { data: bookieData, error: bookieError } = await (supabase
    .from('bookies') as any)
    .select('current_balance')
    .eq('id', bookieId)
    .single();

  if (bookieError) throw bookieError;
  const currentBookie = bookieData as any;

  const balanceBefore = currentBookie.current_balance;
  
  if (balanceBefore < amount) {
    throw new Error('Insufficient balance');
  }

  const balanceAfter = balanceBefore - amount;

  // Update bookie balance
  const { error: updateError } = await (supabase
    .from('bookies') as any)
    .update({ current_balance: balanceAfter })
    .eq('id', bookieId);

  if (updateError) throw updateError;

  // Create transaction record
  const { data, error } = await (supabase
    .from('bankroll_transactions') as any)
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
  const { data: bookiesData, error: bookiesError } = await (supabase
    .from('bookies') as any)
    .select('current_balance, initial_deposit');

  if (bookiesError) throw bookiesError;
  const bookies = bookiesData as any[];

  // Get all bets
  const { data: betsData, error: betsError } = await (supabase
    .from('bets') as any)
    .select('profit, status');

  if (betsError) throw betsError;

  const bets = betsData as any[];
  const totalBalance = bookies.reduce((sum, b) => sum + (b.current_balance || 0), 0);
  const totalDeposited = bookies.reduce((sum, b) => sum + (b.initial_deposit || 0), 0);
  const totalProfit = (bets || [])
    .filter((b: any) => b.status !== 'pending')
    .reduce((sum: number, b: any) => sum + (b.profit || 0), 0);

  return {
    totalBalance,
    totalDeposited,
    totalProfit,
    roi: totalDeposited > 0 ? (totalProfit / totalDeposited) * 100 : 0,
    bookieCount: bookies.length,
  };
}
