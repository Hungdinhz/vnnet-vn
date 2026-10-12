'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  pathname: string;
  unreadMessagesCount: number;
  onLogout: () => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  currentUser,
  pathname,
  unreadMessagesCount,
  onLogout,
}: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const drawerMenuItems = [
    { name: 'Bảng tin', icon: '🏠', path: '/' },
    { name: 'Bạn bè', icon: '👥', path: '/friends' },
    { name: 'Tin nhắn', icon: '💬', path: '/messages', badge: unreadMessagesCount },
    { name: 'Trò chơi', icon: '🎮', path: '/games' },
    { name: 'Livestream', icon: '📺', path: '/livestream' },
    { name: 'Chợ', icon: '🛒', path: '/marketplace' },
    { name: 'Nhóm', icon: '🏘️', path: '/groups' },
    { name: 'Bản đồ', icon: '🗺️', path: '/map' },
    { name: 'Cài đặt', icon: '⚙️', path: '/settings' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] xs:w-[320px] bg-background/98 backdrop-blur-2xl border-r border-indigo-500/20 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md">
              VN
            </div>
            <div>
              <span className="font-extrabold text-base gradient-text">VnNet</span>
              <span className="block text-[10px] text-muted font-medium">Mạng xã hội thế hệ mới</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* User Profile Card in Drawer */}
        {currentUser && (
          <Link
            href={`/profile/${currentUser.id}`}
            onClick={onClose}
            className="flex items-center gap-3 p-3 mx-3 mt-3 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 transition-all group"
          >
            <Avatar
              src={currentUser.avatar_url}
              name={currentUser.username}
              size="md"
              glow
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-foreground group-hover:text-accent-primary transition-colors truncate">
                {currentUser.username}
              </div>
              <div className="text-[11px] text-muted truncate">
                {currentUser.email || 'Xem trang cá nhân'}
              </div>
            </div>
            <span className="text-xs text-accent-primary">➔</span>
          </Link>
        )}

        {/* Drawer Menu Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {drawerMenuItems.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={index}
                href={item.path}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'sidebar-active text-foreground font-semibold bg-indigo-500/10'
                    : 'text-secondary font-medium hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[14px]">{item.name}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer with Logout */}
        <div className="p-3 border-t border-indigo-500/10 space-y-2">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors text-sm font-semibold text-left cursor-pointer"
          >
            <span className="text-lg">🚪</span>
            <span>Đăng xuất</span>
          </button>
          <div className="px-3 py-1 text-[11px] text-muted text-center">
            <span className="gradient-text font-bold">VnNet</span> © 2026 ✨
          </div>
        </div>
      </div>
    </>
  );
}
