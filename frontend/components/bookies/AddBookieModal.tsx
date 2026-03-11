'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookiesAPI, SUPPORTED_CURRENCIES } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Bookie } from '@/types';

interface BookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookie?: Bookie | null;
}

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', 
  '#10B981', '#EF4444', '#6366F1', '#14B8A6'
];

export function AddBookieModal({ isOpen, onClose, bookie }: BookieModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!bookie;
  
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    initial_deposit: '',
    currency: 'USD',
    color: '#3B82F6',
    notes: '',
  });

  useEffect(() => {
    if (bookie) {
      setFormData({
        name: bookie.name,
        website: bookie.website || '',
        initial_deposit: bookie.initial_deposit.toString(),
        currency: bookie.currency || 'USD',
        color: bookie.color,
        notes: bookie.notes || '',
      });
    } else {
      setFormData({
        name: '',
        website: '',
        initial_deposit: '',
        currency: 'USD',
        color: '#3B82F6',
        notes: '',
      });
    }
  }, [bookie, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: any) => bookiesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      toast.success('Bookie added successfully!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to add bookie');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => bookiesAPI.update(bookie!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookies'] });
      toast.success('Bookie updated successfully!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update bookie');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      initial_deposit: parseFloat(formData.initial_deposit) || 0,
      // Set current_balance to initial_deposit if creating new bookie
      ...(isEditing ? {} : { current_balance: parseFloat(formData.initial_deposit) || 0 }),
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Bookie' : 'Add New Bookie'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Bookie Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Website (optional)"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Initial Deposit"
            type="number"
            step="0.01"
            value={formData.initial_deposit}
            onChange={(e) => setFormData({ ...formData, initial_deposit: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-full transition-all ${
                  formData.color === color ? 'ring-4 ring-emerald-500 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={createMutation.isPending || updateMutation.isPending} 
            className="flex-1"
          >
            {isEditing ? 'Update' : 'Add'} Bookie
          </Button>
        </div>
      </form>
    </Modal>
  );
}
