'use client';

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { BankrollSummary } from '@/types';
import { motion } from 'framer-motion';

interface BankrollStatsProps {
  summary: BankrollSummary;
}

export function BankrollStats({ summary }: BankrollStatsProps) {
  const currency = summary.currency || 'USD';
  
  const stats = [
    {
      title: 'Total Balance',
      value: formatCurrency(summary.total_balance, currency),
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(summary.total_profit, currency),
      icon: summary.total_profit >= 0 ? TrendingUp : TrendingDown,
      color: summary.total_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.total_profit >= 0 
        ? 'bg-emerald-100 dark:bg-emerald-900/20' 
        : 'bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'ROI',
      value: formatPercent(summary.roi),
      icon: Target,
      color: summary.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.roi >= 0 
        ? 'bg-emerald-100 dark:bg-emerald-900/20' 
        : 'bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Active Bookies',
      value: summary.bookie_count.toString(),
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
