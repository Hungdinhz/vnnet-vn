"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!getAuthToken()) return;
      try {
        const res = await api.get('/conversations');
        const convs = res.data || [];
        const total = convs.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
        setUnreadMessages(total);
      } catch (err) {
        console.error("Error fetching unread count", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleCreatePost = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/';
    }
  };

  const navItems = [
    { href: '/', icon: '🏠', label: 'Trang chủ' },
    { href: '/friends', icon: '👥', label: 'Bạn bè' },
  ];
  const rightItems = [
    { href: '/messages', icon: '💬', label: 'Tin nhắn', badge: unreadMessages },
    { href: '/profile', icon: '👤', label: 'Hồ sơ' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-nav border-t border-indigo-500/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[60px] px-2 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full relative transition-colors ${
                isActive ? 'text-accent-primary' : 'text-muted hover:text-secondary'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-primary"></span>
              )}
            </Link>
          );
        })}

        {/* Center FAB */}
        <div className="flex flex-col items-center justify-center w-16 h-full relative -top-5">
          <button
            onClick={handleCreatePost}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95 transition-all border-4 border-background"
          >
            ➕
          </button>
          <span className="text-[10px] font-medium text-muted mt-1">Tạo bài</span>
        </div>

        {rightItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full relative transition-colors ${
                isActive ? 'text-accent-primary' : 'text-muted hover:text-secondary'
              }`}
            >
              <div className="relative">
                <span className="text-xl mb-1 block">{item.icon}</span>
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-primary"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
