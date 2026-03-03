'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bookies', label: 'Bookies', icon: Wallet },
    { href: '/bets', label: 'Bets', icon: TrendingUp },
    { href: '/bankroll', label: 'Bankroll', icon: DollarSign },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className="glass-card sticky top-4 mx-4 mb-6 rounded-ios-lg z-40">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-ios bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              BetManager Pro
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 rounded-ios transition-all duration-200',
                    'flex items-center gap-2',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-ios"
                      transition={{ type: 'spring', duration: 0.6 }}
                    />
                  )}
                  <item.icon className="w-5 h-5 relative z-10" />
                  <span className="font-medium relative z-10 hidden sm:block">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-ios text-dark-600 dark:text-dark-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
