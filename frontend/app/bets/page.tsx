'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { betsAPI, bookiesAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function BetsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [formData, setFormData] = useState({
    bookie_id: '',
    description: '',
    stake: '',
    odds: '',
    notes: '',
  });

  const { data: bets, isLoading } = useQuery({
    queryKey: ['bets'],
    queryFn: async () => (await betsAPI.getAll()).data,
  });

  const { data: bookies } = useQuery({
    queryKey: ['bookies'],
    queryFn: async () => (await bookiesAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => betsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      queryClient.invalidateQueries({ queryKey: ['bet-stats'] });
      toast.success('Bet added successfully!');
      setIsAddModalOpen(false);
      setFormData({ bookie_id: '', description: '', stake: '', odds: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add bet');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      betsAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      queryClient.invalidateQueries({ queryKey: ['bet-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bankroll-summary'] });
      toast.success('Bet status updated!');
      setSelectedBet(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      bookie_id: parseInt(formData.bookie_id),
      stake: parseFloat(formData.stake),
      odds: parseFloat(formData.odds),
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'lost':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'lost':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bets</h1>
            <p className="text-gray-600 dark:text-gray-400">Track and manage your betting history</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<Plus className="w-5 h-5" />}>
            Add Bet
          </Button>
        </div>

        {/* Bets List */}
        <Card>
          <CardHeader>
            <CardTitle>Betting History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : bets && bets.length > 0 ? (
              <div className="space-y-3">
                {bets.map((bet: any) => (
                  <div
                    key={bet.id}
                    onClick={() => setSelectedBet(bet)}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all border border-transparent hover:border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(bet.status)}
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {bet.description}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bet.bookie?.name} • Stake: {formatCurrency(bet.stake)} • Odds: {bet.odds.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDateTime(bet.placed_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bet.status)}`}>
                          {bet.status}
                        </span>
                        {bet.status !== 'pending' && (
                          <p className={`mt-2 font-bold ${bet.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(bet.profit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">No bets yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add your first bet to start tracking your portfolio
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Bet Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Bet">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Bet Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stake"
              type="number"
              step="0.01"
              value={formData.stake}
              onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
              required
            />

            <Input
              label="Odds"
              type="number"
              step="0.01"
              value={formData.odds}
              onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} className="flex-1">
              Add Bet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bet Details Modal */}
      {selectedBet && (
        <Modal isOpen={!!selectedBet} onClose={() => setSelectedBet(null)} title="Bet Details">
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedBet.description}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedBet.bookie?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stake</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(selectedBet.stake)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Odds</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedBet.odds.toFixed(2)}
                </p>
              </div>
            </div>

            {selectedBet.status === 'pending' && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="danger"
                  onClick={() => updateStatusMutation.mutate({ id: selectedBet.id, status: 'lost' })}
                  className="flex-1"
                >
                  Mark as Lost
                </Button>
                <Button
                  onClick={() => updateStatusMutation.mutate({ id: selectedBet.id, status: 'won' })}
                  className="flex-1"
                >
                  Mark as Won
                </Button>
              </div>
            )}

            {selectedBet.status !== 'pending' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit/Loss</p>
                <p className={`text-2xl font-bold ${selectedBet.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedBet.profit)}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
