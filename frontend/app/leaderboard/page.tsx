'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Trophy, TrendingUp, Target, Medal, Crown, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type Bet = Database['public']['Tables']['bets']['Row'];

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalBets: number;
  wonBets: number;
  totalProfit: number;
  winRate: number;
  settledBets: number;
}

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<'profit' | 'winrate'>('profit');

  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', sortBy],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const supabase = createClient();

      // Get all users with their bet stats
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, display_name, email');

      if (usersError || !users) return [];

      // Get stats for each user
      const leaderboardData = await Promise.all(
        users.map(async (user: { id: string, username: string, display_name: string | null, email: string }) => {
          const { data: bets } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', user.id)
            .returns<Bet[]>();

          const userBets = bets || [];
          const totalBets = userBets.length;
          const wonBets = userBets.filter(b => b.status === 'won').length;
          const settledBets = userBets.filter(b => b.status !== 'pending').length;
          const totalProfit = userBets.reduce((sum, b) => {
            if (b.status === 'won') return sum + (b.stake * b.odds - b.stake);
            if (b.status === 'lost') return sum - b.stake;
            return sum;
          }, 0);
          const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

          return {
            userId: user.id,
            username: user.username || user.display_name || user.email?.split('@')[0] || 'Anonymous',
            totalBets,
            wonBets,
            totalProfit,
            winRate,
            settledBets,
          };
        })
      );

      // Filter users with at least 5 settled bets
      const qualified = leaderboardData.filter(u => u.settledBets >= 5);

      // Sort based on selected criteria
      if (sortBy === 'profit') {
        return qualified.sort((a, b) => b.totalProfit - a.totalProfit);
      } else {
        return qualified.sort((a, b) => b.winRate - a.winRate);
      }
    },
  });

  // Get current user's rank
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-rank'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const currentUserRank = leaderboard?.findIndex(u => u.userId === currentUser?.id) ?? -1;
  const currentUserStats = currentUserRank >= 0 ? leaderboard?.[currentUserRank] : null;

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank + 1}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🏆 Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Top bettors ranked by performance
            </p>
          </div>

          {/* Sort Toggle */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setSortBy('profit')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'profit'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              💰 Profit
            </button>
            <button
              onClick={() => setSortBy('winrate')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'winrate'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              🎯 Win Rate
            </button>
          </div>
        </div>

        {/* Current User Stats */}
        {currentUserStats && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Rank</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      #{currentUserRank + 1}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentUserStats.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profit</p>
                    <p className={`text-xl font-bold ${
                      currentUserStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(currentUserStats.totalProfit)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bets</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentUserStats.totalBets}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>
              {sortBy === 'profit' ? '💰 Top Earners' : '🎯 Highest Win Rates'}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Minimum 5 settled bets required
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 20).map((user, index) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      user.userId === currentUser?.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.username}
                        {user.userId === currentUser?.id && (
                          <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.totalBets} bets • {user.wonBets} wins
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {user.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Profit</p>
                        <p className={`text-lg font-bold ${
                          user.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {user.totalProfit >= 0 ? '+' : ''}{formatCurrency(user.totalProfit)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  No qualified bettors yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Place at least 5 bets to appear on the leaderboard
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
