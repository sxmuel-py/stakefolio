'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Minus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BankrollStats } from '@/components/bankroll/BankrollStats';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { bankrollAPI, bookiesAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BankrollPage() {
  const queryClient = useQueryClient();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bookie_id: '',
    amount: '',
    description: '',
  });

  const { data: summary } = useQuery({
    queryKey: ['bankroll-summary'],
    queryFn: async () => (await bankrollAPI.getSummary()).data,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await bankrollAPI.getTransactions()).data,
  });

  const { data: bookies } = useQuery({
    queryKey: ['bookies'],
    queryFn: async () => (await bookiesAPI.getAll()).data,
  });

  const depositMutation = useMutation({
    mutationFn: (data: any) => bankrollAPI.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankroll-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      toast.success('Deposit successful!');
      setIsDepositModalOpen(false);
      setFormData({ bookie_id: '', amount: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Deposit failed');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => bankrollAPI.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankroll-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      toast.success('Withdrawal successful!');
      setIsWithdrawModalOpen(false);
      setFormData({ bookie_id: '', amount: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    },
  });

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    depositMutation.mutate({
      bookie_id: formData.bookie_id,
      amount: parseFloat(formData.amount),
      description: formData.description,
    });
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    withdrawMutation.mutate({
      bookie_id: formData.bookie_id,
      amount: parseFloat(formData.amount),
      description: formData.description,
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit' || type === 'bet_win') {
      return <ArrowDownCircle className="w-5 h-5 text-emerald-500" />;
    }
    return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bankroll</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your betting funds</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsWithdrawModalOpen(true)} 
              leftIcon={<Minus className="w-5 h-5" />}
              className="flex-1 md:flex-none"
            >
              Withdraw
            </Button>
            <Button 
              onClick={() => setIsDepositModalOpen(true)} 
              leftIcon={<Plus className="w-5 h-5" />}
              className="flex-1 md:flex-none"
            >
              Deposit
            </Button>
          </div>
        </div>

        {/* Stats */}
        {summary && (
          <div>
            <BankrollStats summary={summary} />
          </div>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.bookie?.name} • {formatDateTime(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Balance: {formatCurrency(transaction.balance_after)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">No transactions yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Make your first deposit to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Deposit Funds">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bookie
            </label>
            <select
              value={formData.bookie_id}
              onChange={(e) => setFormData({ ...formData, bookie_id: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Select a bookie</option>
              {bookies?.map((bookie: any) => (
                <option key={bookie.id} value={bookie.id}>
                  {bookie.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <Input
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsDepositModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={depositMutation.isPending} className="flex-1">
              Deposit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Withdraw Funds">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bookie
            </label>
            <select
              value={formData.bookie_id}
              onChange={(e) => setFormData({ ...formData, bookie_id: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Select a bookie</option>
              {bookies?.map((bookie: any) => (
                <option key={bookie.id} value={bookie.id}>
                  {bookie.name} - {formatCurrency(bookie.current_balance)}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <Input
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsWithdrawModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={withdrawMutation.isPending} className="flex-1">
              Withdraw
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
