'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, removeAuthToken } from '@/lib/auth';
import NavSearch from './NavSearch';
import NavLinks from './NavLinks';
import NavActions from './NavActions';
import MobileNavTabs from './MobileNavTabs';
import MobileDrawer from './MobileDrawer';
import MobileSearchDrawer from './MobileSearchDrawer';

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

  // Mobile state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  useEffect(() => {
    setIsDrawerOpen(false);
    setShowMobileSearch(false);
  }, [pathname]);

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
    removeAuthToken();
    router.push('/login');
  };

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full">
      {/* Row 1: Top Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 h-11 sm:h-12 md:h-14 flex items-center justify-between gap-1 sm:gap-2 md:gap-3">
        {/* Left: Hamburger (Mobile), Logo, Clock & Desktop Search */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
          {/* Hamburger 3 gạch for Mobile */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-colors text-xs sm:text-base flex items-center justify-center focus:outline-none flex-shrink-0 cursor-pointer"
            aria-label="Mở menu"
            title="Menu"
          >
            ☰
          </button>

          <Link
            href="/"
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 shadow-sm flex-shrink-0"
          >
            <span className="text-white text-[10px] sm:text-xs font-black tracking-tighter">VN</span>
          </Link>

          {/* Real-time Clock - Compact on mobile */}
          {currentTime && (
            <div className="h-7 sm:h-8 flex items-center px-2 rounded-full bg-indigo-500/10 dark:bg-white/[0.04] border border-indigo-500/15 font-mono select-none flex-shrink-0">
              <span className="text-[10px] sm:text-xs font-black tracking-tight text-accent-primary leading-tight whitespace-nowrap">
                {currentTime.slice(0, 5)}
                <span className="hidden xs:inline">{currentTime.slice(5)}</span>
              </span>
              <span className="hidden sm:inline-block ml-1 text-[9px] text-muted font-sans font-medium leading-none whitespace-nowrap">
                {currentDateStr}
              </span>
            </div>
          )}

          <NavSearch />
        </div>

        {/* Center: Navigation Links (Desktop only) */}
        <NavLinks />

        {/* Right: Actions, Mobile Search Button, Theme, Profile */}
        <NavActions
          currentTime={currentTime}
          currentDateStr={currentDateStr}
          unreadMessagesCount={unreadMessagesCount}
          unreadCount={unreadCount}
          notifications={notifications}
          senderNames={senderNames}
          showNotifDropdown={showNotifDropdown}
          setShowNotifDropdown={setShowNotifDropdown}
          notifRef={notifRef}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          dropdownRef={dropdownRef}
          currentUser={currentUser}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllRead={handleMarkAllRead}
          onLogout={handleLogout}
          onToggleMobileSearch={() => setShowMobileSearch(!showMobileSearch)}
        />
      </div>

      {/* Row 2: Top Mobile Navigation Tabs (Nằm ngay dưới thanh header đầu tiên - Ảnh 4) */}
      <MobileNavTabs
        pathname={pathname}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Mobile Search Input Drawer (Dropdown trượt xuống khi bấm kính lúp) */}
      <MobileSearchDrawer
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />

      {/* Mobile Drawer (Menu 3 gạch trượt từ bên trái) */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        pathname={pathname}
        unreadMessagesCount={unreadMessagesCount}
        onLogout={handleLogout}
      />
    </nav>
  );
}
