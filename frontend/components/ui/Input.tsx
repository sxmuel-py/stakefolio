'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value !== '');
    props.onChange?.(e);
  };

  return (
    <div className="relative w-full">
      <input
        {...props}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          'w-full px-4 py-3 rounded-ios',
          'bg-white/90 dark:bg-gray-800/90',
          'text-gray-900 dark:text-white',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          'border-2 border-gray-200 dark:border-gray-700',
          'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'backdrop-blur-sm',
          'transition-all duration-200',
          error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          label && 'pt-6',
          className
        )}
      />
      {label && (
        <label
          className={cn(
            'absolute transition-all duration-200 pointer-events-none',
            'text-gray-600 dark:text-gray-400',
            // Adjust left position if there's left padding for icon
            className?.includes('pl-10') ? 'left-10' : 'left-4',
            isFocused || hasValue
              ? 'top-2 text-xs text-primary-600 dark:text-primary-400 font-medium'
              : 'top-3.5 text-base'
          )}
        >
          {label}
        </label>
      )}
      {error && (
        <p className="mt-1 text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
