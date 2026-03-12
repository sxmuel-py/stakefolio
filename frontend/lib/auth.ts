import { createClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  username?: string;
  display_name?: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string, username: string, fullName: string) {
  const supabase = createClient();
  
  // Create the auth user - database trigger will create profile automatically
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: fullName,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  return authData;
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  // Demo account bypass
  if (email === 'test@example.com' && password === 'test1234') {
    // Set a cookie that survives page reloads and middleware checks
    if (typeof window !== 'undefined') {
      document.cookie = "demo_access=true; path=/; max-age=3600; SameSite=Lax";
    }
    
    return { 
      user: { 
        id: 'demo-user-id', 
        email: 'test@example.com',
        user_metadata: { username: 'test_user', display_name: 'Test person' }
      }, 
      session: { access_token: 'demo-token' } 
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  // Clear demo cookie
  if (typeof window !== 'undefined') {
    document.cookie = "demo_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  // Demo bypass
  if (typeof window !== 'undefined' && document.cookie.includes('demo_access=true')) {
    return { 
      id: 'demo-user-id', 
      email: 'test@example.com',
      user_metadata: { username: 'test_user', display_name: 'Test person' }
    } as any;
  }

  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Reset password for a user
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

/**
 * Get user profile from public.users table
 */
export async function getUserProfile(userId: string) {
  if (userId === 'demo-user-id') {
    return {
      id: 'demo-user-id',
      username: 'test_user',
      display_name: 'Test person',
      preferred_currency: 'USD',
      is_public: true,
      created_at: new Date().toISOString()
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('users') as any)
    // @ts-ignore - Supabase type inference issue
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string) {
  const supabase = createClient();
  const { data, error } = await (supabase
    .from('users') as any)
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange((event: any, session: any) => {
    callback(session?.user ?? null);
  });
}
