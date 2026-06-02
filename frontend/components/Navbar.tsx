// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Hàm lấy thông báo
    const fetchNotifications = async () => {
      try {
        // TÙY CHỈNH: Nhớ check xem Backend của em là /notifications hay /notifications/ nhé
        const res = await api.get('/notifications'); 
        const unread = res.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Lỗi lấy thông báo:", error);
      }
    };

    fetchNotifications();
    // Tự động làm mới thông báo mỗi 30 giây (Tùy chọn)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          MạngXãHội
        </Link>

        {/* Khung tìm kiếm giả lập */}
        <div className="hidden md:block">
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>

        {/* Menu góc phải (Avatar user) */}
        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
            <span className="text-xl">🔔</span>
            {/* Cục màu đỏ hiển thị số lượng chưa đọc */}
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold">
            H
          </div>
        </div>
      </div>
    </nav>
  );
}