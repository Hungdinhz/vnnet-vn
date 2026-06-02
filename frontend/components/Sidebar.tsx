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
    { name: 'Cài đặt', icon: '⚙️', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-gray-50 h-[calc(100vh-3.5rem)] sticky top-14 hidden md:block overflow-y-auto p-3">
      <div className="flex flex-col gap-1">
        
        {/* User profile shortcut (Facebook style) */}
        {currentUser && (
          <Link 
            href={`/profile/${currentUser.id}`}
            className={`flex items-center gap-3 p-2.5 hover:bg-gray-200/60 rounded-xl transition-all ${
              pathname === `/profile/${currentUser.id}` ? 'bg-gray-200/80 font-semibold' : 'text-gray-800'
            }`}
          >
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.username} 
                className="w-9 h-9 rounded-full object-cover border shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {getInitials(currentUser.username)}
              </div>
            )}
            <span className="font-medium text-[15px] truncate">{currentUser.username}</span>
          </Link>
        )}

        <hr className="my-2 border-gray-200 mx-2" />

        {/* Regular menu items */}
        {menuItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={index} 
              href={item.path}
              className={`flex items-center gap-3 p-2.5 hover:bg-gray-200/60 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-gray-700 font-medium'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[15px]">{item.name}</span>
            </Link>
          );
        })}

        <hr className="my-2 border-gray-200 mx-2" />
        
        {/* Decorative shortcuts */}
        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Phím tắt của bạn
        </div>
        <div className="text-xs text-gray-400 px-3 py-2 leading-relaxed">
          © 2026 Mạng xã hội vnnet. Phát triển dựa trên Spring Boot & Next.js.
        </div>
      </div>
    </aside>
  );
}