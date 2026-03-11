'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils';
import { bookiesAPI, convertCurrency, getCurrencySymbol } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import type { Bookie } from '@/types';

interface BookieCardProps {
  bookie: Bookie;
  onEdit?: (bookie: Bookie) => void;
}

export function BookieCard({ bookie, onEdit }: BookieCardProps) {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const [convertedBalance, setConvertedBalance] = useState<number | null>(null);
  
  const profit = bookie.current_balance - bookie.initial_deposit;
  const roi = bookie.initial_deposit > 0 ? (profit / bookie.initial_deposit) * 100 : 0;
  const isProfit = profit >= 0;

  // Get user's preferred currency
  const { data: preferredCurrency } = useQuery({
    queryKey: ['user-currency'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'USD';
      
      const { data } = await supabase
        .from('users')
        .select('preferred_currency')
        .eq('id', user.id)
        .single();
      
      return data?.preferred_currency || 'USD';
    },
  });

  // Convert balance if currencies differ
  useEffect(() => {
    const convert = async () => {
      if (preferredCurrency && bookie.currency && preferredCurrency !== bookie.currency) {
        const converted = await convertCurrency(
          bookie.current_balance,
          bookie.currency,
          preferredCurrency
        );
        setConvertedBalance(converted);
      } else {
        setConvertedBalance(null);
      }
    };
    convert();
  }, [bookie.current_balance, bookie.currency, preferredCurrency]);

  const deleteMutation = useMutation({
    mutationFn: () => bookiesAPI.delete(bookie.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      toast.success('Bookie deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete bookie');
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${bookie.name}? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.(bookie);
  };

  const bookieCurrency = bookie.currency || 'USD';

  return (
    <Card hover>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: bookie.color }}
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {bookie.name}
              </h3>
            </div>
            {bookie.website && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {bookie.website}
              </p>
            )}
          </div>
          
          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                >
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete</span>
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Current Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Balance
            </span>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(bookie.current_balance, bookieCurrency)}
              </span>
              {convertedBalance !== null && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  ≈ {formatCurrency(convertedBalance, preferredCurrency)}
                </p>
              )}
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Profit/Loss
            </span>
            <div className="flex items-center gap-1">
              {isProfit ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`font-semibold ${
                  isProfit ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {isProfit ? '+' : ''}{formatCurrency(profit, bookieCurrency)}
              </span>
            </div>
          </div>

          {/* ROI */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
            <span
              className={`font-semibold ${
                isProfit ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
            </span>
          </div>
        </div>

        {bookie.notes && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {bookie.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
