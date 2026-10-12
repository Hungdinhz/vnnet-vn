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
  onToggleMobileSearch?: () => void;
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
  onToggleMobileSearch,
}: NavActionsProps) {
  return (
    <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
      {/* Mobile Search Toggle Button */}
      {onToggleMobileSearch && (
        <button
          onClick={onToggleMobileSearch}
          className="sm:hidden w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs flex-shrink-0 cursor-pointer"
          aria-label="Tìm kiếm"
        >
          🔍
        </button>
      )}

      {/* Theme Toggle */}
      <ThemeToggle className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-all focus:outline-none flex-shrink-0" />

      {/* Messages Icon (Desktop only - mobile has top nav tabs & drawer) */}
      <Link
        href="/messages"
        className="hidden md:flex relative cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 w-8 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 transition-all duration-200 border border-indigo-500/10 flex-shrink-0"
        title="Tin nhắn"
      >
        <span className="text-sm sm:text-base">💬</span>
        {unreadMessagesCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
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
      <div className="relative flex-shrink-0" ref={dropdownRef as any}>
        <button
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowNotifDropdown(false);
          }}
          className="flex items-center hover:brightness-110 transition-all focus:outline-none flex-shrink-0 cursor-pointer"
          aria-label="Tài khoản cá nhân"
        >
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username || 'User'}
              referrerPolicy="no-referrer"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover border border-indigo-500/20"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white flex items-center justify-center font-bold text-[9px] sm:text-xs shadow-sm">
              {(currentUser?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* User Dropdown Menu */}
        {showDropdown && (
          <div className="dropdown-mobile-full sm:w-72 sm:absolute sm:right-0 mt-2 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-3 z-50 animate-slide-up">
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
              className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 mx-2 rounded-lg transition-colors text-sm font-semibold text-left mt-2 focus:outline-none cursor-pointer"
            >
              <span className="text-lg">🚪</span> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
