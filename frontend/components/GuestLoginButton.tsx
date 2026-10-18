// components/GuestLoginButton.tsx
"use client";

import React from 'react';
import { UserCheck } from 'lucide-react';

interface GuestLoginButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function GuestLoginButton({
  onClick,
  disabled = false,
  className = '',
  label = 'Tài khoản khách',
}: GuestLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-200 dark:border-slate-700/80 bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 flex items-center justify-center gap-2.5 cursor-pointer text-center group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className="w-5 h-5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
        <UserCheck className="w-3.5 h-3.5" />
      </div>
      <span>{label}</span>
    </button>
  );
}
