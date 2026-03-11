import { createClient } from './supabase/client';
import { Database } from '@/types/supabase';

type Bookie = Database['public']['Tables']['bookies']['Row'];
type Bet = Database['public']['Tables']['bets']['Row'];
type BankrollTransaction = Database['public']['Tables']['bankroll_transactions']['Row'];
type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];

// Currency utilities
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];

// Fetch live exchange rates from API (optional)
async function fetchLiveExchangeRate(from: string, to: string): Promise<number | null> {
  try {
    // Option 1: Free API - exchangerate-api.com (1500 requests/month free)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );
    const data = await response.json();
    return data.rates[to] || null;

    // Option 2: Alternative - fixer.io (100 requests/month free)
    // Requires API key in .env: NEXT_PUBLIC_FIXER_API_KEY
    // const apiKey = process.env.NEXT_PUBLIC_FIXER_API_KEY;
    // const response = await fetch(
    //   `https://api.fixer.io/latest?access_key=${apiKey}&base=${from}&symbols=${to}`
    // );
    // const data = await response.json();
    // return data.rates[to] || null;
  } catch (error) {
    console.warn('Failed to fetch live exchange rate:', error);
    return null;
  }
}

// Get exchange rate between two currencies
export async function getExchangeRate(
  from: string, 
  to: string,
  useLiveRates: boolean = false
): Promise<number> {
  if (from === to) return 1;

  // Try to fetch live rate if enabled
  if (useLiveRates) {
    const liveRate = await fetchLiveExchangeRate(from, to);
    if (liveRate) return liveRate;
  }
  
  // Fallback to database rates
  const supabase = createClient();
  const { data, error } = await (supabase
    .from('exchange_rates') as any)
    .select('rate')
    .eq('from_currency', from)
    .eq('to_currency', to)
    .single();

  if (error || !data) {
    console.warn(`Exchange rate not found for ${from} to ${to}, using 1`);
    return 1;
  }

  return parseFloat((data as any).rate.toString());
}

// Convert amount from one currency to another
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  useLiveRates: boolean = false
): Promise<number> {
  const rate = await getExchangeRate(from, to, useLiveRates);
  return amount * rate;
}

// Update exchange rates in database (can be called periodically)
export async function updateExchangeRates(): Promise<void> {
  const supabase = createClient();
  const currencies = ['USD', 'EUR', 'GBP', 'NGN'];

  for (const from of currencies) {
    for (const to of currencies) {
      if (from === to) continue;

      const rate = await fetchLiveExchangeRate(from, to);
      if (rate) {
        await (supabase
          .from('exchange_rates') as any)
          .upsert({
            from_currency: from,
            to_currency: to,
            rate,
            updated_at: new Date().toISOString(),
          });
      }
    }
  }
}

// Get currency symbol
export function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return currency?.symbol || '$';
}

// Bookies API
export const bookiesAPI = {
  getAll: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await (supabase
      .from('bookies') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data };
  },

  getOne: async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bookies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  },

  create: async (bookieData: Database['public']['Tables']['bookies']['Insert']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await (supabase
      .from('bookies') as any)
      .insert({ ...bookieData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  update: async (id: string, bookieData: Database['public']['Tables']['bookies']['Update']) => {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('bookies') as any)
      .update(bookieData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data };
  },

  delete: async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('bookies')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: null };
  },
};

// Bets API
export const betsAPI = {
  getAll: async (params?: { status?: string; bookie_id?: string }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = (supabase
      .from('bets') as any)
      .select('*, bookie:bookies(*)')
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.bookie_id) {
      query = query.eq('bookie_id', params.bookie_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },

  getOne: async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('bets')
      .select('*, bookie:bookies(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data };
  },

  create: async (betData: Database['public']['Tables']['bets']['Insert']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await (supabase
      .from('bets') as any)
      .insert({ ...betData, user_id: user.id })
      .select('*, bookie:bookies(*)')
      .single();

    if (error) throw error;
    return { data };
  },

  updateStatus: async (id: number, status: string) => {
    const supabase = createClient();
    const { data, error } = await (supabase
      .from('bets') as any)
      .update({ status })
      .eq('id', id)
      .select('*, bookie:bookies(*)')
      .single();

    if (error) throw error;
    return { data };
  },

  getStats: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: betsData, error } = await (supabase
      .from('bets') as any)
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    const bets = betsData as any[];

    const stats = {
      total_bets: bets.length,
      won_bets: bets.filter(b => b.status === 'won').length,
      lost_bets: bets.filter(b => b.status === 'lost').length,
      pending_bets: bets.filter(b => b.status === 'pending').length,
      total_staked: bets.reduce((sum, b) => sum + (b.stake || 0), 0),
      total_profit: bets.reduce((sum, b) => sum + (b.profit || 0), 0),
      win_rate: bets.length > 0 
        ? (bets.filter(b => b.status === 'won').length / bets.filter(b => b.status !== 'pending').length) * 100 
        : 0,
    };

    return { data: stats };
  },
};

// Bankroll API
export const bankrollAPI = {
  deposit: async (data: { bookie_id: string; amount: number; description?: string }) => {
    const supabase = createClient();
    
    const { data: result, error } = await (supabase as any).rpc('handle_bankroll_transaction', {
      p_bookie_id: data.bookie_id,
      p_amount: data.amount,
      p_type: 'deposit',
      p_description: data.description
    });

    if (error) throw error;
    return { data: result };
  },

  withdraw: async (data: { bookie_id: string; amount: number; description?: string }) => {
    const supabase = createClient();
    
    const { data: result, error } = await (supabase as any).rpc('handle_bankroll_transaction', {
      p_bookie_id: data.bookie_id,
      p_amount: -data.amount,
      p_type: 'withdraw',
      p_description: data.description
    });

    if (error) throw error;
    return { data: result };
  },

  getTransactions: async (params?: { bookie_id?: string }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = (supabase
      .from('bankroll_transactions') as any)
      .select('*, bookie:bookies(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (params?.bookie_id) {
      query = query.eq('bookie_id', params.bookie_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data };
  },

  getSummary: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's preferred currency
    const { data: userData } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', user.id)
      .single();

    const preferredCurrency = (userData as any)?.preferred_currency || 'USD';

    // Get all bookies with their currencies
    const { data: bookiesData } = await (supabase
      .from('bookies') as any)
      .select('current_balance, currency')
      .eq('user_id', user.id);

    const bookies = bookiesData as any[];

    // Convert all balances to preferred currency
    // Set useLiveRates to true if you want real-time rates
    const useLiveRates = false; // Change to true for live rates
    
    let totalBalanceConverted = 0;
    if (bookies) {
      for (const bookie of bookies) {
        const balance = bookie.current_balance || 0;
        const bookieCurrency = bookie.currency || 'USD';
        const converted = await convertCurrency(balance, bookieCurrency, preferredCurrency, useLiveRates);
        totalBalanceConverted += converted;
      }
    }

    // Get all transactions
    const { data: transactionsData } = await (supabase
      .from('bankroll_transactions') as any)
      .select('amount, type')
      .eq('user_id', user.id);

    const transactions = transactionsData as any[];

    const total_deposited = transactions?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const total_withdrawn = transactions?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0) || 0;
    const total_profit = totalBalanceConverted - (total_deposited - total_withdrawn);
    const roi = total_deposited > 0 ? (total_profit / total_deposited) * 100 : 0;
    const bookie_count = bookies?.length || 0;

    return {
      data: {
        total_balance: totalBalanceConverted,
        total_deposited,
        total_withdrawn,
        total_profit,
        roi,
        bookie_count,
        currency: preferredCurrency,
      },
    };
  },
};
