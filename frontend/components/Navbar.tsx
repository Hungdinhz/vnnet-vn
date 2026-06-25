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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [senderNames, setSenderNames] = useState<Record<number, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

    fetchUserData();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const notifs = res.data || [];
      setNotifications(notifs);
      const unread = notifs.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);

      // Fetch sender names for notifications
      const senderIds = [...new Set(notifs.map((n: any) => n.sender_id).filter(Boolean))] as number[];
      const newNames: Record<number, string> = {};
      for (const sid of senderIds) {
        if (!senderNames[sid]) {
          try {
            const uRes = await api.get(`/users/${sid}`);
            newNames[sid] = uRes.data.username || `User ${sid}`;
          } catch {
            newNames[sid] = `User ${sid}`;
          }
        }
      }
      if (Object.keys(newNames).length > 0) {
        setSenderNames(prev => ({ ...prev, ...newNames }));
      }
    } catch (err) {
      console.error("Lỗi lấy thông báo:", err);
    }
  };

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.is_read);
    for (const n of unreadNotifs) {
      try { await api.put(`/notifications/${n.id}/read`); } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getNotifText = (notif: any) => {
    const senderName = senderNames[notif.sender_id] || 'Ai đó';
    switch (notif.type) {
      case 'like': return { icon: '❤️', text: `${senderName} đã thích bài viết của bạn` };
      case 'comment': return { icon: '💬', text: `${senderName} đã bình luận bài viết của bạn` };
      case 'friend_request': return { icon: '👋', text: `${senderName} đã gửi lời mời kết bạn` };
      case 'friend_accept': return { icon: '🤝', text: `${senderName} đã chấp nhận lời mời kết bạn` };
      case 'comment_like': return { icon: '👍', text: `${senderName} đã thích bình luận của bạn` };
      default: return { icon: '🔔', text: `${senderName} đã tương tác với bạn` };
    }
  };

  const getNotifLink = (notif: any) => {
    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'comment_like':
        return '/'; // Go to feed where they can see the post
      case 'friend_request':
        return '/friends?tab=requests';
      case 'friend_accept':
        return `/profile/${notif.sender_id}`;
      default:
        return '/';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày`;
    } catch { return ''; }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
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

          {/* Notifications Icon + Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowDropdown(false); }}
              className="relative cursor-pointer hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 transition-all duration-200 border border-purple-500/10 focus:outline-none"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 badge-anime animate-pulse border-2 border-[#0F0B1E]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-96 glass-card rounded-xl py-2 z-50 animate-slide-up max-h-[480px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-purple-500/10">
                  <h3 className="font-bold text-purple-100 text-[15px]">🔔 Thông báo</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold transition-colors"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-3xl mb-2">🔕</div>
                      <p className="text-sm text-purple-400/40">Chưa có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notif) => {
                      const { icon, text } = getNotifText(notif);
                      const link = getNotifLink(notif);
                      return (
                        <Link
                          key={notif.id}
                          href={link}
                          onClick={() => {
                            if (!notif.is_read) handleMarkAsRead(notif.id);
                            setShowNotifDropdown(false);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-purple-500/5 ${
                            !notif.is_read ? 'bg-purple-500/5' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-lg flex-shrink-0 border border-purple-500/10">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug ${!notif.is_read ? 'text-purple-100 font-semibold' : 'text-purple-300/70'}`}>
                              {text}
                            </p>
                            <p className="text-[11px] text-purple-400/40 mt-0.5">{formatTimeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 flex-shrink-0 mt-1.5"></div>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => { setShowDropdown(!showDropdown); setShowNotifDropdown(false); }}
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