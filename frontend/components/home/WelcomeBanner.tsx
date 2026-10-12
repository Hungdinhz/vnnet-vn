'use client';

import React from 'react';
import Link from 'next/link';

interface WelcomeBannerProps {
  username?: string;
  myGroupsCount: number;
}

export default function WelcomeBanner({ username, myGroupsCount }: WelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="glass-card rounded-2xl p-5 mb-5 relative overflow-hidden border border-indigo-500/10 shadow-lg animate-slide-up">
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-accent-primary/15 to-accent-secondary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            {getGreeting()},{' '}
            <span className="gradient-text">{username || 'Bạn'}</span>! ✨
          </h2>
          <p className="text-xs text-muted/70 mt-1 font-medium">
            Chào mừng bạn quay trở lại với VnNet. Cập nhật bảng tin ngay nào!
          </p>
        </div>
        <div className="text-3xl animate-float">🚀</div>
      </div>

      {/* Quick stats mini row */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-indigo-500/10 text-center">
        <div className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-indigo-500/5">
          <span className="block text-xs font-bold text-accent-purple">👥 Bạn bè</span>
          <span className="text-sm font-extrabold font-mono mt-0.5 block">Đang kết nối</span>
        </div>
        <div className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-indigo-500/5">
          <span className="block text-xs font-bold text-accent-primary">🏘️ Nhóm</span>
          <span className="text-sm font-extrabold font-mono mt-0.5 block">{myGroupsCount} đã tham gia</span>
        </div>
        <Link
          href="/groups"
          className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer block"
        >
          <span className="block text-xs font-bold text-indigo-400">➕ Khám phá</span>
          <span className="text-xs font-semibold text-muted mt-1 block">Tìm nhóm mới</span>
        </Link>
      </div>
    </div>
  );
}
