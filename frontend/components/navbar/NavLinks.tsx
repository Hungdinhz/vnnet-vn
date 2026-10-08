'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '🏠', label: 'Trang chủ', match: (p: string) => p === '/' },
    { href: '/friends', icon: '👥', label: 'Bạn bè', match: (p: string) => p === '/friends' },
    { href: '/games', icon: '🎮', label: 'Trò chơi', match: (p: string) => p === '/games' },
    { href: '/livestream', icon: '📺', label: 'Livestream', match: (p: string) => p === '/livestream' },
    { href: '/marketplace', icon: '🛒', label: 'Chợ', match: (p: string) => p === '/marketplace' },
  ];

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 flex-1 max-w-lg h-full">
      {navItems.map((item) => {
        const isActive = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-center flex-1 h-full border-b-[3px] transition-all duration-200 ${
              isActive
                ? 'border-transparent nav-active text-accent-primary'
                : 'border-transparent text-secondary hover:text-accent-primary hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title={item.label}
          >
            <span className="text-xl md:text-2xl">{item.icon}</span>
          </Link>
        );
      })}
    </div>
  );
}
