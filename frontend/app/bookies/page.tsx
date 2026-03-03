'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BookieCard } from '@/components/bookies/BookieCard';
import { AddBookieModal } from '@/components/bookies/AddBookieModal';
import { Button } from '@/components/ui/Button';
import { bookiesAPI } from '@/lib/api';
import type { Bookie } from '@/types';

export default function BookiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);

  const { data: bookies, isLoading } = useQuery({
    queryKey: ['bookies'],
    queryFn: async () => (await bookiesAPI.getAll()).data,
  });

  const handleEdit = (bookie: Bookie) => {
    setSelectedBookie(bookie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBookie(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bookies</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your betting platforms</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-5 h-5" />}>
            Add Bookie
          </Button>
        </div>

        {/* Bookies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-6 h-48 border border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : bookies && bookies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookies.map((bookie: any) => (
              <BookieCard key={bookie.id} bookie={bookie} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-1">No bookies yet</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first bookie to start tracking your bets
            </p>
            <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-5 h-5" />}>
              Add Your First Bookie
            </Button>
          </div>
        )}
      </div>

      <AddBookieModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        bookie={selectedBookie}
      />
    </DashboardLayout>
  );
}
