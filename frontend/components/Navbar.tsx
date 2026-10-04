// components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, removeAuthToken } from '@/lib/auth';
import { ThemeToggle } from './ThemeToggle';

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current user and notifications
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const fetchUserData = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err: any) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Lỗi lấy thông tin user:", err);
        }
      }
    };

    fetchUserData();
    fetchNotifications();

    const interval = setInterval(() => {
      if (getAuthToken()) {
        fetchNotifications();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    if (!getAuthToken()) return;
    try {
      const res = await api.get('/notifications');
      const notifs = res.data || [];
      setNotifications(notifs);
      const unread = notifs.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);

      // Đồng thời cập nhật số tin nhắn chưa đọc cho icon tin nhắn
      try {
        const convRes = await api.get('/conversations');
        const convs = convRes.data || [];
        const totalUnreadMsg = convs.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnreadMsg);
      } catch {}

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

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(value.trim())}&type=all&size=5`);
        setSearchResults(res.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
      case 'message': return { icon: '💬', text: `${senderName} đã gửi cho bạn một tin nhắn mới` };
      default: return { icon: '🔔', text: `${senderName} đã tương tác với bạn` };
    }
  };

  const getNotifLink = (notif: any) => {
    switch (notif.type) {
      case 'like':
      case 'comment':
      case 'comment_like':
        return '/';
      case 'friend_request':
        return '/friends?tab=requests';
      case 'friend_accept':
        return `/profile/${notif.sender_id}`;
      case 'message':
        return '/messages';
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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeAuthToken();
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

  const drawerMenuItems = [
    { name: 'Bảng tin', icon: '🏠', path: '/' },
    { name: 'Bạn bè', icon: '👥', path: '/friends' },
    { name: 'Tin nhắn', icon: '💬', path: '/messages', badge: unreadMessagesCount },
    { name: 'Trò chơi', icon: '🎮', path: '/games' },
    { name: 'Livestream', icon: '📺', path: '/livestream' },
    { name: 'Chợ', icon: '🛒', path: '/marketplace' },
    { name: 'Nhóm', icon: '🏘️', path: '/groups' },
    { name: 'Bản đồ', icon: '🗺️', path: '/map' },
    { name: 'Cài đặt', icon: '⚙️', path: '/settings' },
  ];

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full">
      {/* Row 1: Top Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto px-1.5 xs:px-2.5 sm:px-4 h-11 sm:h-14 flex items-center justify-between gap-1 sm:gap-3">
        
        {/* Left: Hamburger (Mobile), Logo, Clock & Desktop Search */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Hamburger 3 gạch for Mobile */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-colors text-xs sm:text-base flex items-center justify-center focus:outline-none flex-shrink-0"
            aria-label="Mở menu"
            title="Menu"
          >
            ☰
          </button>

          <Link href="/" className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 shadow-sm flex-shrink-0">
            <span className="text-white text-[10px] sm:text-xs font-black tracking-tighter">VN</span>
          </Link>

          {/* Real-time Clock - Compact on mobile */}
          {currentTime && (
            <div className="h-6 sm:h-8 flex items-center px-1.5 xs:px-2 rounded-lg bg-indigo-500/10 dark:bg-white/[0.04] border border-indigo-500/15 font-mono select-none flex-shrink-0">
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-black tracking-tight text-accent-primary leading-tight whitespace-nowrap">
                {currentTime.slice(0, 5)}
                <span className="hidden xs:inline">{currentTime.slice(5)}</span>
              </span>
              <span className="hidden sm:inline-block ml-1 text-[9px] text-muted font-sans font-medium leading-none whitespace-nowrap">
                {currentDateStr}
              </span>
            </div>
          )}

          {/* Search with Dropdown for Desktop */}
          <div className="relative max-w-xs w-full hidden sm:block ml-1" ref={searchRef}>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted/60 z-10">
                🔍
              </span>
              <input 
                type="text" 
                placeholder="Tìm kiếm trên VnNet..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchSubmit}
                onFocus={() => { if (searchResults && searchQuery.trim().length >= 2) setShowSearchDropdown(true); }}
                className="input-anime rounded-full pl-9 pr-4 py-2 text-sm w-full sm:w-60 transition-all sm:focus:w-64"
              />
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && searchResults && (
              <div className="absolute left-2 sm:left-0 top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-2 z-50 animate-slide-up max-h-[480px] overflow-hidden flex flex-col">
                
                {/* Users section */}
                {searchResults.users && searchResults.users.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
                      👤 Người dùng ({searchResults.total_users})
                    </div>
                    {searchResults.users.map((user: any) => (
                      <Link
                        key={`user-${user.id}`}
                        href={`/profile/${user.id}`}
                        onClick={() => setShowSearchDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-sm font-bold text-secondary">
                            {getInitials(user.username)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">{user.username}</div>
                          <div className="text-[11px] text-muted truncate">{user.email}</div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {/* Posts section */}
                {searchResults.posts && searchResults.posts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider border-t border-indigo-500/10 mt-1">
                      📝 Bài viết ({searchResults.total_posts})
                    </div>
                    {searchResults.posts.map((post: any) => (
                      <div
                        key={`post-${post.id}`}
                        onClick={() => { setShowSearchDropdown(false); router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg flex-shrink-0 border border-indigo-500/10">
                          📄
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">{post.title || 'Bài viết'}</div>
                          <div className="text-[11px] text-muted truncate">{post.content?.substring(0, 60)}{post.content?.length > 60 ? '...' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* No results */}
                {(!searchResults.users || searchResults.users.length === 0) && (!searchResults.posts || searchResults.posts.length === 0) && (
                  <div className="py-8 text-center">
                    <div className="text-2xl mb-1">🔍</div>
                    <p className="text-sm text-muted">Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                )}

                {/* View all results link */}
                {((searchResults.total_users || 0) > 0 || (searchResults.total_posts || 0) > 0) && (
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => setShowSearchDropdown(false)}
                    className="block text-center py-2.5 text-xs font-bold text-accent-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-indigo-500/10 mt-1"
                  >
                    Xem tất cả kết quả →
                  </Link>
                )}

                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute top-2 right-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Icons */}
        <div className="hidden md:flex items-center justify-center gap-1 md:gap-2 flex-1 max-w-lg h-full">
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

        {/* Right: Actions & Profile Menu */}
        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
          
          {/* Mobile Search Toggle Button */}
          <button 
            className="sm:hidden w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs flex-shrink-0"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Tìm kiếm"
          >
            🔍
          </button>

          {/* Theme Toggle - Always visible on top */}
          <ThemeToggle className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-all focus:outline-none flex-shrink-0" />
          
          {/* Messages Icon (Desktop only - mobile has top nav tabs & drawer) */}
          <Link href="/messages" className="hidden md:flex relative cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 transition-all duration-200 border border-slate-200 dark:border-slate-700 flex-shrink-0" title="Tin nhắn">
            <span className="text-base sm:text-lg">💬</span>
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </Link>

          {/* Notifications Icon + Dropdown */}
          <div className="relative flex-shrink-0" ref={notifRef}>
            <button 
              onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowDropdown(false); }}
              className="relative cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 transition-all duration-200 border border-indigo-500/10 focus:outline-none flex-shrink-0"
            >
              <span className="text-xs sm:text-sm">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] px-0.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-background">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="dropdown-mobile-full sm:w-96 sm:absolute sm:right-0 mt-2 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-2 z-50 animate-slide-up max-h-[480px] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-indigo-500/10">
                  <h3 className="font-bold text-foreground text-[15px]">🔔 Thông báo</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-accent-primary hover:text-accent-primary/80 font-semibold transition-colors"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 max-h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="text-3xl mb-2">🔕</div>
                      <p className="text-sm text-muted">Chưa có thông báo nào</p>
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
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-indigo-500/5 ${
                            !notif.is_read ? 'bg-indigo-500/5' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-lg flex-shrink-0 border border-indigo-500/10">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug ${!notif.is_read ? 'text-foreground font-semibold' : 'text-secondary'}`}>
                              {text}
                            </p>
                            <p className="text-[11px] text-muted/40 mt-0.5">{formatTimeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5"></div>
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
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => { setShowDropdown(!showDropdown); setShowNotifDropdown(false); }}
              className="flex items-center hover:brightness-110 transition-all focus:outline-none flex-shrink-0"
            >
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.username} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover avatar-glow"
                />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white flex items-center justify-center font-bold text-[9px] sm:text-xs shadow-sm avatar-glow">
                  {getInitials(currentUser?.username)}
                </div>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showDropdown && (
              <div className="dropdown-mobile-full sm:w-72 sm:absolute sm:right-0 mt-2 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-3 z-50 animate-slide-up">
                <Link 
                  href="/profile" 
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors"
                >
                  {currentUser?.avatar_url ? (
                    <img 
                      src={currentUser.avatar_url} 
                      alt={currentUser.username} 
                      className="w-12 h-12 rounded-full object-cover avatar-glow"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full text-white flex items-center justify-center text-lg font-bold">
                      {getInitials(currentUser?.username)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-bold text-foreground">{currentUser?.username || "Người dùng"}</div>
                    <div className="text-xs text-muted">Xem trang cá nhân của bạn</div>
                  </div>
                </Link>

                <hr className="my-2 border-indigo-500/10 mx-4" />

                <Link 
                  href="/friends"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-secondary"
                >
                  <span className="text-lg">👥</span> Bạn bè
                </Link>

                <Link 
                  href="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 mx-2 rounded-lg transition-colors text-sm font-medium text-left text-secondary"
                >
                  <span className="text-lg">⚙️</span> Cài đặt
                </Link>

                <button 
                  onClick={handleLogout}
                  className="w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 mx-2 rounded-lg transition-colors text-sm font-semibold text-left mt-2 focus:outline-none"
                >
                  <span className="text-lg">🚪</span> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Top Mobile Navigation Tabs (Nằm ngay dưới thanh header đầu tiên) */}
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
              onClick={() => {
                if (pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
                  if (textarea) textarea.focus();
                } else {
                  router.push('/');
                }
              }}
              className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xs sm:text-sm shadow-[0_0_10px_rgba(99,102,241,0.4)] active:scale-90 transition-all font-bold"
              title="Tạo bài viết"
              aria-label="Tạo bài viết"
            >
              ➕
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

      {/* Mobile Search Input Drawer (Dropdown below navbar) */}
      {showMobileSearch && (
        <div className="sm:hidden px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-indigo-500/15 animate-slide-up">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted/60 z-10">
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm người dùng, bài viết..." 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchSubmit}
              autoFocus
              className="input-anime rounded-full pl-9 pr-8 py-2 text-sm w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {/* Mobile search results preview */}
          {showSearchDropdown && searchResults && (
            <div className="mt-2 w-full bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-2 max-h-[350px] overflow-y-auto">
              {/* Users */}
              {searchResults.users && searchResults.users.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase">👤 Người dùng ({searchResults.total_users})</div>
                  {searchResults.users.map((user: any) => (
                    <Link
                      key={`m-user-${user.id}`}
                      href={`/profile/${user.id}`}
                      onClick={() => { setShowSearchDropdown(false); setShowMobileSearch(false); }}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-xs font-bold text-secondary">
                          {getInitials(user.username)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground truncate">{user.username}</div>
                        <div className="text-[10px] text-muted truncate">{user.email}</div>
                      </div>
                    </Link>
                  ))}
                </>
              )}
              {/* Posts */}
              {searchResults.posts && searchResults.posts.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase border-t border-indigo-500/10 mt-1">📝 Bài viết ({searchResults.total_posts})</div>
                  {searchResults.posts.map((post: any) => (
                    <div
                      key={`m-post-${post.id}`}
                      onClick={() => { 
                        setShowSearchDropdown(false); 
                        setShowMobileSearch(false);
                        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); 
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="text-base">📄</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground truncate">{post.title || 'Bài viết'}</div>
                        <div className="text-[10px] text-muted truncate">{post.content?.substring(0, 50)}...</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {((searchResults.total_users || 0) > 0 || (searchResults.total_posts || 0) > 0) && (
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                  onClick={() => { setShowSearchDropdown(false); setShowMobileSearch(false); }}
                  className="block text-center py-2 text-xs font-bold text-accent-primary hover:bg-black/5 dark:hover:bg-white/5 border-t border-indigo-500/10 mt-1"
                >
                  Xem tất cả kết quả →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer (3-gạch menu) - Slide-in from Left */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] transition-opacity duration-300 md:hidden ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Container */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] xs:w-[320px] bg-background/98 backdrop-blur-2xl border-r border-indigo-500/20 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-indigo-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md">
              VN
            </div>
            <div>
              <span className="font-extrabold text-base gradient-text">VnNet</span>
              <span className="block text-[10px] text-muted font-medium">Mạng xã hội thế hệ mới</span>
            </div>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground transition-colors"
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* User Profile Card in Drawer */}
        {currentUser && (
          <Link 
            href={`/profile/${currentUser.id}`}
            onClick={() => setIsDrawerOpen(false)}
            className="flex items-center gap-3 p-3 mx-3 mt-3 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 transition-all group"
          >
            {currentUser.avatar_url ? (
              <img 
                src={currentUser.avatar_url} 
                alt={currentUser.username} 
                className="w-10 h-10 rounded-full object-cover avatar-glow flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
                {getInitials(currentUser.username)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-foreground group-hover:text-accent-primary transition-colors truncate">
                {currentUser.username}
              </div>
              <div className="text-[11px] text-muted truncate">
                {currentUser.email || 'Xem trang cá nhân'}
              </div>
            </div>
            <span className="text-xs text-accent-primary">➔</span>
          </Link>
        )}

        {/* Drawer Menu Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {drawerMenuItems.map((item, index) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={index}
                href={item.path}
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'sidebar-active text-foreground font-semibold bg-indigo-500/10'
                    : 'text-secondary font-medium hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[14px]">{item.name}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer with Logout */}
        <div className="p-3 border-t border-indigo-500/10 space-y-2">
          <button 
            onClick={() => {
              setIsDrawerOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors text-sm font-semibold text-left"
          >
            <span className="text-lg">🚪</span>
            <span>Đăng xuất</span>
          </button>
          <div className="px-3 py-1 text-[11px] text-muted text-center">
            <span className="gradient-text font-bold">VnNet</span> © 2026 ✨
          </div>
        </div>
      </div>
    </nav>
  );
}
