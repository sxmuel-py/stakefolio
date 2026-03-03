'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, Trophy, Clock, Target, Star, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function BestPicksPage() {
  const [selectedFilter, setSelectedFilter] = useState<'ai' | 'trending' | 'top'>('ai');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  // Fetch trending community bets
  const { data: trendingBets, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-bets'],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('bets')
        .select(`
          *,
          user:users(username, display_name),
          bookie:bookies(name)
        `)
        .eq('status', 'pending')
        .gte('placed_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('odds', { ascending: false })
        .limit(20);

      return data || [];
    },
  });

  // Fetch top performers' bets
  const { data: topPerformerBets, isLoading: topLoading } = useQuery({
    queryKey: ['top-performer-bets'],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data: topUsers } = await supabase
        .from('users')
        .select('id, username, display_name')
        .limit(10);

      if (!topUsers) return [];

      const { data: bets } = await supabase
        .from('bets')
        .select(`
          *,
          user:users(username, display_name),
          bookie:bookies(name)
        `)
        .in('user_id', topUsers.map(u => u.id))
        .eq('status', 'pending')
        .gte('placed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('stake', { ascending: false })
        .limit(20);

      return bets || [];
    },
  });

  const filters = [
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'trending', label: 'Trending Now', icon: TrendingUp },
    { id: 'top', label: 'Top Players', icon: Trophy },
  ];

  const sports = [
    { id: 'all', label: 'All Sports' },
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
  ];

  const currentData = selectedFilter === 'trending' ? trendingBets : 
                     selectedFilter === 'top' ? topPerformerBets : [];

  const isLoading = trendingLoading || topLoading;

  // Calculate win probability (mock for now - can be enhanced with AI)
  const calculateProbability = (odds: number) => {
    const impliedProb = (1 / odds) * 100;
    return Math.min(Math.round(impliedProb), 95);
  };

  // Get confidence level based on odds and stake
  const getConfidence = (odds: number, stake: number) => {
    if (odds >= 2.0 && stake >= 50) return 'high';
    if (odds >= 1.5 && stake >= 30) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'high') return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
    if (confidence === 'medium') return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Best Picks Today
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered predictions and community insights
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Sport Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedSport === sport.id
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>

        {/* Predictions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400">
            <div className="col-span-4">Match</div>
            <div className="col-span-2 text-center">Probability</div>
            <div className="col-span-2 text-center">Prediction</div>
            <div className="col-span-2 text-center">Odds</div>
            <div className="col-span-2 text-center">Confidence</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                  <div className="col-span-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                </div>
              ))
            ) : currentData && currentData.length > 0 ? (
              currentData.map((bet: any, index: number) => {
                const probability = calculateProbability(bet.odds);
                const confidence = getConfidence(bet.odds, bet.stake);
                
                return (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                  >
                    {/* Match Info */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {bet.user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {bet.description}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {bet.bookie?.name} • {bet.user?.display_name || bet.user?.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Probability */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {probability}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Win chance
                        </div>
                      </div>
                    </div>

                    {/* Prediction Badge */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-semibold">
                        {bet.bet_type || 'Win'}
                      </span>
                    </div>

                    {/* Odds */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {parseFloat(bet.odds).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ${parseFloat(bet.stake).toFixed(0)} stake
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                          {confidence.toUpperCase()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No picks available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Check back later for new predictions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6" />
              <span className="text-sm opacity-90">Total Picks</span>
            </div>
            <div className="text-3xl font-bold">{currentData?.length || 0}</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm opacity-90">Avg Confidence</span>
            </div>
            <div className="text-3xl font-bold">
              {currentData && currentData.length > 0 
                ? Math.round(currentData.reduce((acc: number, bet: any) => 
                    acc + calculateProbability(bet.odds), 0) / currentData.length)
                : 0}%
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6" />
              <span className="text-sm opacity-90">High Confidence</span>
            </div>
            <div className="text-3xl font-bold">
              {currentData?.filter((bet: any) => 
                getConfidence(bet.odds, bet.stake) === 'high'
              ).length || 0}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
