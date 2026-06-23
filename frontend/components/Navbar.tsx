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

  const navItems = [
    { href: '/', icon: '🏠', label: 'Trang chủ', match: (p: string) => p === '/' },
    { href: '/friends', icon: '👥', label: 'Bạn bè', match: (p: string) => p === '/friends' },
    { href: '/games', icon: '🎮', label: 'Trò chơi', match: (p: string) => p === '/games' },
    { href: '/livestream', icon: '📺', label: 'Livestream', match: (p: string) => p === '/livestream' },
    { href: '/marketplace', icon: '🛒', label: 'Chợ', match: (p: string) => p === '/marketplace' },
  ];

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-3 flex-1 md:flex-initial">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300 shadow-lg">
            <span className="text-white text-lg font-black tracking-tighter">VN</span>
          </Link>
          <div className="relative max-w-xs w-full hidden sm:block">
            <span className="absolute inset-y-0 left-3 flex items-center text-purple-400/60">
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm trên VnNet..." 
              className="input-anime rounded-full pl-9 pr-4 py-2 text-sm w-60 transition-all focus:w-64"
            />
          </div>
        </div>

        {/* Center: Navigation Icons */}
        <div className="flex items-center justify-center gap-1 md:gap-2 flex-1 max-w-lg h-full">
          {navItems.map((item) => {
            const isActive = item.match(pathname);
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center justify-center flex-1 h-full border-b-[3px] transition-all duration-200 ${
                  isActive 
                    ? 'border-transparent nav-active text-purple-300' 
                    : 'border-transparent text-purple-400/50 hover:text-purple-300 hover:bg-white/5'
                }`}
                title={item.label}
              >
                <span className="text-xl md:text-2xl">{item.icon}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Actions & Profile Menu */}
        <div className="flex items-center space-x-2 md:space-x-3">
          
          {/* Messages Icon */}
          <Link href="/messages" className="relative cursor-pointer hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 transition-all duration-200 border border-purple-500/10">
            <span className="text-lg">💬</span>
          </Link>

          {/* Notifications Icon */}
          <Link href="/friends?tab=requests" className="relative cursor-pointer hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 transition-all duration-200 border border-purple-500/10">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 badge-anime animate-pulse border-2 border-[#0F0B1E]">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 hover:brightness-110 transition-all focus:outline-none"
            >
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.username} 
                  className="w-10 h-10 rounded-full object-cover avatar-glow"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold shadow-lg avatar-glow">
                  {getInitials(currentUser?.username)}
                </div>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 glass-card rounded-xl py-3 z-50 animate-slide-up">
                <Link 
                  href="/profile" 
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 mx-2 rounded-lg transition-colors"
                >
                  {currentUser?.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.username} 
                      className="w-12 h-12 rounded-full object-cover avatar-glow"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center text-lg font-bold">
                      {getInitials(currentUser?.username)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-bold text-[#F0E6FF]">{currentUser?.username || "Người dùng"}</div>
                    <div className="text-xs text-purple-400/60">Xem trang cá nhân của bạn</div>
                  </div>
                </Link>

                <hr className="my-2 border-purple-500/10 mx-4" />

                <Link 
                  href="/friends"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-purple-200"
                >
                  <span className="text-lg">👥</span> Bạn bè
                </Link>

                <Link 
                  href="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-purple-200"
                >
                  <span className="text-lg">⚙️</span> Cài đặt
                </Link>

                <button 
                  onClick={handleLogout}
                  className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 hover:bg-rose-500/10 text-rose-400 mx-2 rounded-lg transition-colors text-sm font-semibold text-left mt-2 focus:outline-none"
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