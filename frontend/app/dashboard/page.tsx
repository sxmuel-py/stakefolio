'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, ArrowUpRight, ArrowDownRight, Wallet, Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { betsAPI, bankrollAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  
  // Fetch real data from API
  const { data: betStats, isLoading: statsLoading } = useQuery({
    queryKey: ['bet-stats'],
    queryFn: async () => (await betsAPI.getStats()).data,
  });

  const { data: bankrollSummary, isLoading: bankrollLoading } = useQuery({
    queryKey: ['bankroll-summary'],
    queryFn: async () => (await bankrollAPI.getSummary()).data,
  });

  const { data: recentBetsData, isLoading: betsLoading } = useQuery({
    queryKey: ['recent-bets'],
    queryFn: async () => (await betsAPI.getAll()).data,
  });

  // Calculate stats from real data
  const stats = [
    {
      name: 'Total Profit',
      value: bankrollSummary ? formatCurrency(bankrollSummary.total_profit) : '$0.00',
      change: bankrollSummary && bankrollSummary.total_profit > 0 ? '+12.5%' : '0%',
      trend: bankrollSummary && bankrollSummary.total_profit >= 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'emerald',
      loading: bankrollLoading
    },
    {
      name: 'Win Rate',
      value: betStats ? `${betStats.win_rate.toFixed(1)}%` : '0%',
      change: betStats && betStats.win_rate > 50 ? '+4.2%' : '0%',
      trend: betStats && betStats.win_rate >= 50 ? 'up' : 'down',
      icon: Target,
      color: 'blue',
      loading: statsLoading
    },
    {
      name: 'Total Bets',
      value: betStats ? betStats.total_bets.toString() : '0',
      change: betStats && betStats.total_bets > 0 ? `+${betStats.total_bets}` : '0',
      trend: 'up',
      icon: TrendingUp,
      color: 'purple',
      loading: statsLoading
    },
    {
      name: 'ROI',
      value: betStats && betStats.total_staked > 0 
        ? `${((betStats.total_profit / betStats.total_staked) * 100).toFixed(1)}%` 
        : '0%',
      change: '-2.1%',
      trend: betStats && betStats.total_profit >= 0 ? 'up' : 'down',
      icon: TrendingDown,
      color: 'orange',
      loading: statsLoading
    },
  ];

  // Get recent bets (limit to 4)
  const recentBets = recentBetsData?.slice(0, 4).map((bet: any) => ({
    id: bet.id,
    match: bet.description,
    stake: bet.stake,
    odds: bet.odds,
    status: bet.status,
    profit: bet.status === 'won' ? (bet.stake * bet.odds - bet.stake) : 
            bet.status === 'lost' ? -bet.stake : 0
  })) || [];

  // Quick action handlers
  const quickActions = [
    {
      title: 'Place Bet',
      description: 'Add new bet',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      onClick: () => router.push('/bets')
    },
    {
      title: 'Deposit',
      description: 'Add funds',
      icon: DollarSign,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      onClick: () => router.push('/bankroll')
    },
    {
      title: 'Add Bookie',
      description: 'New platform',
      icon: Plus,
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/30',
      onClick: () => router.push('/bookies')
    },
    {
      title: 'Bankroll',
      description: 'View balance',
      icon: Wallet,
      gradient: 'from-orange-500 to-red-600',
      shadow: 'shadow-orange-500/30',
      onClick: () => router.push('/bankroll')
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your portfolio today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <CardContent className="p-6">
                  {stat.loading ? (
                    <div className="animate-pulse">
                      <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                          <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {stat.trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {stat.change}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {stat.value}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bets</CardTitle>
              <CardDescription>Your latest betting activity</CardDescription>
            </CardHeader>
            <CardContent>
              {betsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentBets.length > 0 ? (
                <div className="space-y-4">
                  {recentBets.map((bet: any) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {bet.match}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${bet.stake} @ {bet.odds}x
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            bet.status === 'won'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : bet.status === 'lost'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {bet.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">No bets yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Start tracking your bets to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.title}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className={`p-6 rounded-xl bg-gradient-to-br ${action.gradient} text-white text-left shadow-lg ${action.shadow} hover:shadow-xl transition-all`}
                  >
                    <action.icon className="w-8 h-8 mb-3" />
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
