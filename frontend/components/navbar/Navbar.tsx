'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, removeAuthToken } from '@/lib/auth';
import NavSearch from './NavSearch';
import NavLinks from './NavLinks';
import NavActions from './NavActions';

export default function Navbar() {
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [senderNames, setSenderNames] = useState<Record<number, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

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
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-3 flex-1 md:flex-initial">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 shadow-lg"
          >
            <span className="text-white text-lg font-black tracking-tighter">VN</span>
          </Link>
          <NavSearch />
        </div>

        {/* Center: Navigation Links */}
        <NavLinks />

        {/* Right: Actions, Clock, Theme, Profile */}
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
        />
      </div>
    </nav>
  );
}
