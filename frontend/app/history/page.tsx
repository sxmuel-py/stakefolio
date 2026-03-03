'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { betsAPI, bankrollAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function HistoryPage() {
  const [dateRange, setDateRange] = useState('all'); // all, week, month, year

  // Fetch all bets
  const { data: bets, isLoading: betsLoading } = useQuery({
    queryKey: ['all-bets'],
    queryFn: async () => (await betsAPI.getAll()).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['bankroll-summary'],
    queryFn: async () => (await bankrollAPI.getSummary()).data,
  });

  // Process data for charts
  const profitOverTime = bets
    ?.filter((bet: any) => bet.status !== 'pending')
    .map((bet: any, index: number) => {
      const profit = bet.status === 'won' 
        ? bet.stake * bet.odds - bet.stake 
        : -bet.stake;
      
      return {
        date: formatDate(bet.placed_at),
        profit: parseFloat(profit.toFixed(2)),
        cumulative: bets
          .slice(0, index + 1)
          .filter((b: any) => b.status !== 'pending')
          .reduce((sum: number, b: any) => {
            const p = b.status === 'won' ? b.stake * b.odds - b.stake : -b.stake;
            return sum + p;
          }, 0),
      };
    }) || [];

  // Bookie performance
  const bookieStats = bets?.reduce((acc: any, bet: any) => {
    if (bet.status === 'pending') return acc;
    
    const bookieName = bet.bookie?.name || 'Unknown';
    if (!acc[bookieName]) {
      acc[bookieName] = { name: bookieName, profit: 0, bets: 0, won: 0 };
    }
    
    const profit = bet.status === 'won' 
      ? bet.stake * bet.odds - bet.stake 
      : -bet.stake;
    
    acc[bookieName].profit += profit;
    acc[bookieName].bets += 1;
    if (bet.status === 'won') acc[bookieName].won += 1;
    
    return acc;
  }, {});

  const bookieData = Object.values(bookieStats || {}).map((stat: any) => ({
    name: stat.name,
    profit: parseFloat(stat.profit.toFixed(2)),
    winRate: ((stat.won / stat.bets) * 100).toFixed(1),
  }));

  // Status distribution
  const statusData = [
    { name: 'Won', value: bets?.filter((b: any) => b.status === 'won').length || 0, color: '#10B981' },
    { name: 'Lost', value: bets?.filter((b: any) => b.status === 'lost').length || 0, color: '#EF4444' },
    { name: 'Pending', value: bets?.filter((b: any) => b.status === 'pending').length || 0, color: '#F59E0B' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              History & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your betting performance over time
            </p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Profit Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Cumulative Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bookie Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Bookie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bookieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bet Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Bet Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Best Streak</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {(() => {
                          if (!bets || bets.length === 0) return '0 wins';
                          
                          // Sort bets by placed_at date
                          const sortedBets = [...bets]
                            .filter((b: any) => b.status !== 'pending')
                            .sort((a: any, b: any) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());
                          
                          let maxStreak = 0;
                          let currentStreak = 0;
                          
                          sortedBets.forEach((bet: any) => {
                            if (bet.status === 'won') {
                              currentStreak++;
                              maxStreak = Math.max(maxStreak, currentStreak);
                            } else {
                              currentStreak = 0;
                            }
                          });
                          
                          return `${maxStreak} ${maxStreak === 1 ? 'win' : 'wins'}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Bet Size</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(
                          (bets || []).reduce((sum: number, b: any) => sum + parseFloat(b.stake), 0) / ((bets?.length || 1) || 1),
                          summary?.currency
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Best Bookie</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {bookieData[0]?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Bookie</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Stake</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Odds</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {betsLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
                    </tr>
                  ) : bets && bets.length > 0 ? (
                    bets.slice(0, 20).map((bet: any) => {
                      const profit = bet.status === 'won' 
                        ? bet.stake * bet.odds - bet.stake 
                        : bet.status === 'lost' 
                        ? -bet.stake 
                        : 0;
                      
                      return (
                        <tr key={bet.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(bet.placed_at)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                            {bet.description}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {bet.bookie?.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                            {formatCurrency(bet.stake, bet.bookie?.currency)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                            {bet.odds}x
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              bet.status === 'won' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : bet.status === 'lost'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {bet.status}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-semibold ${
                            profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit, bet.bookie?.currency)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">No bets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
