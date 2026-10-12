'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

interface MobileNavTabsProps {
  pathname: string;
  unreadMessagesCount: number;
}

export default function MobileNavTabs({ pathname, unreadMessagesCount }: MobileNavTabsProps) {
  const router = useRouter();

  const handleCreatePost = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (textarea) textarea.focus();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="md:hidden border-t border-indigo-500/10 bg-background/95 backdrop-blur-md w-full">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-5 h-9 xs:h-10 sm:h-11 px-0.5">
        {/* 1. Trang chủ */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center relative transition-all ${
            pathname === '/'
              ? 'text-accent-primary font-bold'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span className="text-sm xs:text-base leading-none">🏠</span>
          <span className="hidden xs:block text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium">Trang chủ</span>
          {pathname === '/' && (
            <span className="absolute bottom-0 inset-x-2 h-0.5 bg-accent-primary rounded-full" />
          )}
        </Link>

        {/* 2. Bạn bè */}
        <Link
          href="/friends"
          className={`flex flex-col items-center justify-center relative transition-all ${
            pathname === '/friends'
              ? 'text-accent-primary font-bold'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span className="text-sm xs:text-base leading-none">👥</span>
          <span className="hidden xs:block text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium">Bạn bè</span>
          {pathname === '/friends' && (
            <span className="absolute bottom-0 inset-x-2 h-0.5 bg-accent-primary rounded-full" />
          )}
        </Link>

        {/* 3. Tạo bài (Center Action Button) */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleCreatePost}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.45)] active:scale-90 hover:brightness-110 transition-all cursor-pointer flex-shrink-0"
            title="Tạo bài viết"
            aria-label="Tạo bài viết"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Tin nhắn */}
        <Link
          href="/messages"
          className={`flex flex-col items-center justify-center relative transition-all ${
            pathname === '/messages'
              ? 'text-accent-primary font-bold'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <div className="relative leading-none">
            <span className="text-sm xs:text-base leading-none">💬</span>
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[13px] h-[13px] px-0.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-background">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </div>
          <span className="hidden xs:block text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium">Tin nhắn</span>
          {pathname === '/messages' && (
            <span className="absolute bottom-0 inset-x-2 h-0.5 bg-accent-primary rounded-full" />
          )}
        </Link>

        {/* 5. Hồ sơ */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center relative transition-all ${
            pathname.startsWith('/profile')
              ? 'text-accent-primary font-bold'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <span className="text-sm xs:text-base leading-none">👤</span>
          <span className="hidden xs:block text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-medium">Hồ sơ</span>
          {pathname.startsWith('/profile') && (
            <span className="absolute bottom-0 inset-x-2 h-0.5 bg-accent-primary rounded-full" />
          )}
        </Link>
      </div>
    </div>
  );
}
