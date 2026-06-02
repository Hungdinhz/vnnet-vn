// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current user and notifications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        const unread = res.data.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
      }
    };

    fetchUserData();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">
            <span className="text-white text-2xl font-extrabold tracking-tighter">f</span>
          </Link>
          <div className="relative max-w-xs w-full hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm trên Facebook..." 
              className="bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60 transition-all focus:w-64"
            />
          </div>
        </div>

        {/* Center: Navigation Icons (Facebook style) */}
        <div className="flex items-center justify-center gap-1 md:gap-4 flex-1 max-w-md h-full">
          <Link 
            href="/" 
            className={`flex items-center justify-center flex-1 h-full border-b-4 hover:bg-gray-50 transition-colors ${
              pathname === '/' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            title="Trang chủ"
          >
            <span className="text-xl md:text-2xl">🏠</span>
          </Link>
          
          <Link 
            href="/friends" 
            className={`flex items-center justify-center flex-1 h-full border-b-4 hover:bg-gray-50 transition-colors ${
              pathname === '/friends' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            title="Bạn bè"
          >
            <span className="text-xl md:text-2xl">👥</span>
          </Link>

          <Link 
            href="/profile" 
            className={`flex items-center justify-center flex-1 h-full border-b-4 hover:bg-gray-50 transition-colors ${
              pathname.startsWith('/profile') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            title="Trang cá nhân"
          >
            <span className="text-xl md:text-2xl">👤</span>
          </Link>
        </div>

        {/* Right: Actions & Profile Menu */}
        <div className="flex items-center space-x-2 md:space-x-3">
          
          {/* Notifications Icon */}
          <Link href="/friends?tab=requests" className="relative cursor-pointer hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 transition-colors">
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 hover:brightness-95 transition-all focus:outline-none"
            >
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.username} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold shadow-sm">
                  {getInitials(currentUser?.username)}
                </div>
              )}
            </button>

            {/* Facebook style User Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 text-gray-800 z-50 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-150">
                <Link 
                  href="/profile" 
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 mx-2 rounded-lg transition-colors"
                >
                  {currentUser?.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.username} 
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white flex items-center justify-center text-lg font-bold">
                      {getInitials(currentUser?.username)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{currentUser?.username || "Người dùng"}</div>
                    <div className="text-xs text-gray-500">Xem trang cá nhân của bạn</div>
                  </div>
                </Link>

                <hr className="my-2 border-gray-100" />

                <Link 
                  href="/friends"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 mx-2 rounded-lg transition-colors text-sm font-medium text-left"
                >
                  <span className="text-lg">👥</span> Bạn bè
                </Link>

                <button 
                  onClick={handleLogout}
                  className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 mx-2 rounded-lg transition-colors text-sm font-semibold text-left mt-2 focus:outline-none"
                >
                  <span className="text-lg">🚪</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}