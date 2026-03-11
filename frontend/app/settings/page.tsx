'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Bell, Shield, Palette, DollarSign } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Fetch user's current preferred currency
  const { data: user } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setSelectedCurrency(data.preferred_currency || 'USD');
      }
      return data;
    },
  });

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('users')
        .update({ preferred_currency: currency })
        .eq('id', authUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-currency'] });
      queryClient.invalidateQueries({ queryKey: ['bankroll-summary'] });
      toast.success('Currency preference updated!');
    },
    onError: () => {
      toast.error('Failed to update currency preference');
    },
  });

  const handleSaveCurrency = () => {
    updateCurrencyMutation.mutate(selectedCurrency);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Currency Preference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle>Currency Preference</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Choose your preferred currency for displaying totals. Individual bookies can still use different currencies.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full max-w-md px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleSaveCurrency}
                isLoading={updateCurrencyMutation.isPending}
                disabled={selectedCurrency === (user?.preferred_currency || 'USD')}
              >
                Save Currency Preference
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Other Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Update your profile information and manage your account details
              </p>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Configure how you receive notifications and alerts
              </p>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Manage your password and security preferences
              </p>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Appearance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Customize the look and feel of your dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
