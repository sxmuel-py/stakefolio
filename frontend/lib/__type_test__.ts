// This file tests that the Database types are correctly loaded
import { Database } from '@/types/supabase';
import { createClient } from './supabase/client';

// Test that exchange_rates table exists
type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];

// Test that bookies has currency
type Bookie = Database['public']['Tables']['bookies']['Row'];
const testCurrency: Bookie['currency'] = 'USD';

// Test that users has preferred_currency  
type User = Database['public']['Tables']['users']['Row'];
const testPreferredCurrency: User['preferred_currency'] = 'EUR';

// Test that createClient returns properly typed client
const supabase = createClient();

async function testTypes() {
  // This should work without errors
  const { data } = await supabase.from('exchange_rates').select('*');
  const { data: bookies } = await supabase.from('bookies').select('*');
  const { data: users } = await supabase.from('users').select('*');
  
  if (data && data.length > 0) {
    console.log(data[0].rate); // Should have rate property
  }
  
  if (bookies && bookies.length > 0) {
    console.log(bookies[0].currency); // Should have currency property
  }
  
  if (users && users.length > 0) {
    console.log(users[0].preferred_currency); // Should have preferred_currency property
  }
}

export {};
