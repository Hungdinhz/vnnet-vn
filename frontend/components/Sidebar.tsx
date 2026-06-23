// components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/axios';

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi lấy user trong Sidebar:", err);
      }
    };
    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const menuItems = [
    { name: 'Bảng tin', icon: '🏠', path: '/' },
    { name: 'Bạn bè', icon: '👥', path: '/friends' },
    { name: 'Tin nhắn', icon: '💬', path: '/messages' },
    { name: 'Trò chơi', icon: '🎮', path: '/games' },
    { name: 'Livestream', icon: '📺', path: '/livestream' },
    { name: 'Chợ', icon: '🛒', path: '/marketplace' },
    { name: 'Nhóm', icon: '🏘️', path: '/groups' },
  ];

  const secondaryItems = [
    { name: 'Cài đặt', icon: '⚙️', path: '/settings' },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-3.5rem)] sticky top-14 hidden md:block overflow-y-auto p-3">
      <div className="flex flex-col gap-1">
        
        {/* User profile shortcut */}
        {currentUser && (
          <Link 
            href={`/profile/${currentUser.id}`}
            className={`flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-xl transition-all ${
              pathname === `/profile/${currentUser.id}` ? 'sidebar-active font-semibold' : 'text-purple-200'
            }`}
          >
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.username} 
                className="w-9 h-9 rounded-full object-cover avatar-glow"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-lg">
                {getInitials(currentUser.username)}
              </div>
            )}
            <span className="font-medium text-[15px] truncate text-[#F0E6FF]">{currentUser.username}</span>
          </Link>
        )}

        <hr className="my-2 border-purple-500/10 mx-2" />

        {/* Main menu items */}
        {menuItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'sidebar-active text-purple-200 font-semibold' 
                  : 'text-purple-300/70 font-medium hover:bg-white/5 hover:text-purple-200'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}

        <hr className="my-2 border-purple-500/10 mx-2" />

        {/* Secondary items */}
        {secondaryItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'sidebar-active text-purple-200 font-semibold' 
                  : 'text-purple-300/70 font-medium hover:bg-white/5 hover:text-purple-200'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}

        <hr className="my-2 border-purple-500/10 mx-2" />
        
        {/* Footer */}
        <div className="px-3 py-2 text-xs text-purple-500/40 leading-relaxed">
          <span className="gradient-text font-semibold">VnNet</span> © 2026 ✨
          <br />
          <span className="text-purple-500/30">Mạng xã hội thế hệ mới</span>
        </div>
      </div>
    </aside>
  );
}