'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { ThemeToggle } from '../ThemeToggle';
import NotificationDropdown from './NotificationDropdown';

interface NavActionsProps {
  currentTime: string;
  currentDateStr: string;
  unreadMessagesCount: number;
  unreadCount: number;
  notifications: any[];
  senderNames: Record<number, string>;
  showNotifDropdown: boolean;
  setShowNotifDropdown: (show: boolean) => void;
  notifRef: React.RefObject<HTMLDivElement | null>;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  currentUser: any;
  onMarkAsRead: (id: number) => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
}

export default function NavActions({
  currentTime,
  currentDateStr,
  unreadMessagesCount,
  unreadCount,
  notifications,
  senderNames,
  showNotifDropdown,
  setShowNotifDropdown,
  notifRef,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  currentUser,
  onMarkAsRead,
  onMarkAllRead,
  onLogout,
}: NavActionsProps) {
  return (
    <div className="flex items-center space-x-2 md:space-x-3">
      {/* Real-time Clock */}
      {currentTime && (
        <div className="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-indigo-500/10 font-mono select-none">
          <span className="text-xs font-black tracking-wider text-accent-primary leading-tight">
            {currentTime}
          </span>
          <span className="text-[9px] text-muted font-sans font-medium leading-none">
            {currentDateStr}
          </span>
        </div>
      )}

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Messages Icon */}
      <Link
        href="/messages"
        className="relative cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 transition-all duration-200 border border-slate-200 dark:border-slate-700"
        title="Tin nhắn"
      >
        <span className="text-lg">💬</span>
        {unreadMessagesCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
          </span>
        )}
      </Link>

      {/* Notifications Icon + Dropdown */}
      <NotificationDropdown
        notifications={notifications}
        unreadCount={unreadCount}
        showNotifDropdown={showNotifDropdown}
        setShowNotifDropdown={setShowNotifDropdown}
        notifRef={notifRef}
        senderNames={senderNames}
        onMarkAsRead={onMarkAsRead}
        onMarkAllRead={onMarkAllRead}
        onCloseOtherDropdowns={() => setShowDropdown(false)}
      />

      {/* User Profile Menu */}
      <div className="relative" ref={dropdownRef as any}>
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowNotifDropdown(false);
          }}
          className="flex items-center space-x-1 hover:brightness-110 transition-all focus:outline-none"
        >
          <Avatar
            src={currentUser?.avatar_url}
            name={currentUser?.username || 'U'}
            size="md"
            glow
          />
        </button>

        {/* User Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-72 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-3 z-50 animate-slide-up">
            <Link
              href="/profile"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors"
            >
              <Avatar
                src={currentUser?.avatar_url}
                name={currentUser?.username || 'U'}
                size="md"
                glow
              />
              <div className="text-left">
                <div className="font-bold text-foreground">{currentUser?.username || "Người dùng"}</div>
                <div className="text-xs text-muted">Xem trang cá nhân của bạn</div>
              </div>
            </Link>

            <hr className="my-2 border-indigo-500/10 mx-4" />

            <Link
              href="/friends"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-secondary"
            >
              <span className="text-lg">👥</span> Bạn bè
            </Link>

            <Link
              href="/settings"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-secondary"
            >
              <span className="text-lg">⚙️</span> Cài đặt
            </Link>

            <button
              onClick={onLogout}
              className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 mx-2 rounded-lg transition-colors text-sm font-semibold text-left mt-2 focus:outline-none"
            >
              <span className="text-lg">🚪</span> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
