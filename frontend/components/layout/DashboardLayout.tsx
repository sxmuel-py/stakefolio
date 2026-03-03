'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Trophy,
  Sparkles,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import AIChatWidget from '@/components/ai/AIChatWidget';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Best Picks', href: '/picks', icon: Sparkles },
  { name: 'Bets', href: '/bets', icon: TrendingUp },
  { name: 'Bookies', href: '/bookies', icon: Wallet },
  { name: 'Bankroll', href: '/bankroll', icon: BarChart3 },
  { name: 'History', href: '/history', icon: Clock },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Fetch current user data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async (): Promise<any> => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      // Get user profile from users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      return profile || { username: authUser.email?.split('@')[0], email: authUser.email, display_name: authUser.email?.split('@')[0] };
    },
  });

  // Fetch recent notifications (bets + transactions)
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      // Fetch recent bets
      const { data: bets } = await supabase
        .from('bets')
        .select('*, bookie:bookies(*)')
        .eq('user_id', authUser.id)
        .order('placed_at', { ascending: false })
        .limit(3);

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('bankroll_transactions')
        .select('*, bookie:bookies(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine and sort by date
      const combined = [
        ...(bets || []).map(bet => ({
          ...bet,
          type: 'bet',
          date: new Date(bet.placed_at),
        })),
        ...(transactions || []).map(tx => ({
          ...tx,
          type: 'transaction',
          date: new Date(tx.created_at),
        })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

      return combined;
    },
  });

  // Fetch user stats for AI
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', authUser.id);

      const settled = bets?.filter(b => b.status !== 'pending') || [];
      const won = settled.filter(b => b.status === 'won').length;
      const totalProfit = settled.reduce((sum, b) => sum + (parseFloat(b.profit) || 0), 0);
      const totalStaked = settled.reduce((sum, b) => sum + parseFloat(b.stake), 0);

      return {
        totalBets: bets?.length || 0,
        winRate: settled.length > 0 ? (won / settled.length * 100).toFixed(1) : 0,
        totalProfit: totalProfit.toFixed(2),
        roi: totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : 0,
      };
    },
  });

  // Fetch recent bets for AI context
  const { data: recentBets } = useQuery({
    queryKey: ['recent-bets-ai'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];

      const { data } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', authUser.id)
        .order('placed_at', { ascending: false })
        .limit(10);

      return data || [];
    },
  });

  // Debounced search function
  React.useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const query = searchQuery.toLowerCase();
      const results: any[] = [];

      try {
        // Search bets
        const { data: bets } = await supabase
          .from('bets')
          .select('*, bookie:bookies(name)')
          .eq('user_id', authUser.id)
          .or(`description.ilike.%${query}%,status.ilike.%${query}%`)
          .limit(5);

        if (bets) {
          results.push(...bets.map(bet => ({
            ...bet,
            type: 'bet',
            title: bet.description,
            subtitle: `${bet.bookie?.name} • $${bet.stake} @ ${bet.odds}x`,
            href: '/bets',
          })));
        }

        // Search bookies
        const { data: bookies } = await supabase
          .from('bookies')
          .select('*')
          .eq('user_id', authUser.id)
          .or(`name.ilike.%${query}%,website.ilike.%${query}%`)
          .limit(5);

        if (bookies) {
          results.push(...bookies.map(bookie => ({
            ...bookie,
            type: 'bookie',
            title: bookie.name,
            subtitle: bookie.website || `Balance: $${bookie.current_balance}`,
            href: '/bookies',
          })));
        }

        // Search transactions
        const { data: transactions } = await supabase
          .from('bankroll_transactions')
          .select('*, bookie:bookies(name)')
          .eq('user_id', authUser.id)
          .or(`description.ilike.%${query}%,type.ilike.%${query}%`)
          .limit(5);

        if (transactions) {
          results.push(...transactions.map(tx => ({
            ...tx,
            type: 'transaction',
            title: tx.description || tx.type,
            subtitle: `${tx.bookie?.name} • $${Math.abs(tx.amount)}`,
            href: '/bankroll',
          })));
        }

        setSearchResults(results);
        setShowSearchResults(results.length > 0 || searchQuery.trim().length > 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close search results on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key to close search
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Stakefolio</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-medium transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search */}
              <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md relative">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bets, bookies, transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl outline-none transition-all"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 max-h-96 overflow-y-auto"
                  >
                    {searchResults.length > 0 ? (
                      <div className="p-2">
                        {/* Group by type */}
                        {['bet', 'bookie', 'transaction'].map(type => {
                          const items = searchResults.filter(r => r.type === type);
                          if (items.length === 0) return null;

                          const typeLabels: Record<string, string> = {
                            bet: 'Bets',
                            bookie: 'Bookies',
                            transaction: 'Transactions',
                          };

                          const typeIcons: Record<string, any> = {
                            bet: TrendingUp,
                            bookie: Wallet,
                            transaction: BarChart3,
                          };

                          const Icon = typeIcons[type];

                          return (
                            <div key={type} className="mb-3 last:mb-0">
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Icon className="w-3 h-3" />
                                {typeLabels[type]}
                              </div>
                              {items.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    router.push(item.href);
                                    setShowSearchResults(false);
                                    setSearchQuery('');
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {item.subtitle}
                                  </p>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : searchQuery.trim() ? (
                      <div className="p-8 text-center">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                          No results found
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Try searching for something else
                        </p>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                >
                  <Bell className="w-6 h-6" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Recent Activity
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((item: any) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setNotificationsOpen(false);
                                router.push(item.type === 'bet' ? '/bets' : '/bankroll');
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {item.type === 'bet' ? (
                                  <div className={`w-2 h-2 mt-2 rounded-full ${
                                    item.status === 'won' ? 'bg-emerald-500' :
                                    item.status === 'lost' ? 'bg-red-500' :
                                    'bg-amber-500'
                                  }`}></div>
                                ) : (
                                  <div className={`w-2 h-2 mt-2 rounded-full ${
                                    item.type === 'deposit' ? 'bg-blue-500' : 'bg-purple-500'
                                  }`}></div>
                                )}
                                <div className="flex-1">
                                  {item.type === 'bet' ? (
                                    <>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.description}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {item.bookie?.name} • ${item.stake} @ {item.odds}x
                                      </p>
                                      <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'won'
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : item.status === 'lost'
                                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {item.bookie?.name} • ${Math.abs(item.amount)}
                                      </p>
                                      <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                        item.type === 'deposit'
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                      }`}>
                                        {item.description || (item.type === 'deposit' ? 'Deposit' : 'Withdrawal')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                              No notifications
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              Your recent activity will appear here
                            </p>
                          </div>
                        )}
                      </div>
                      {notifications && notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              router.push('/history');
                            }}
                            className="w-full text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                          >
                            View all activity
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </div>

              <button className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.username || user?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || 'Loading...'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 pb-24 md:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* AI Chat Widget */}
        <AIChatWidget userStats={userStats} betHistory={recentBets} />
      </div>
    </div>
  );
}
