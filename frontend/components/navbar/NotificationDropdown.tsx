'use client';

import React from 'react';
import Link from 'next/link';

interface NotificationDropdownProps {
  notifications: any[];
  unreadCount: number;
  showNotifDropdown: boolean;
  setShowNotifDropdown: (show: boolean) => void;
  notifRef: React.RefObject<HTMLDivElement | null>;
  senderNames: Record<number, string>;
  onMarkAsRead: (id: number) => void;
  onMarkAllRead: () => void;
  onCloseOtherDropdowns: () => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  showNotifDropdown,
  setShowNotifDropdown,
  notifRef,
  senderNames,
  onMarkAsRead,
  onMarkAllRead,
  onCloseOtherDropdowns,
}: NotificationDropdownProps) {
  const getNotifText = (notif: any) => {
    const senderName = senderNames[notif.sender_id] || 'Ai đó';
    switch (notif.type) {
      case 'like':
        return { icon: '❤️', text: `${senderName} đã thích bài viết của bạn` };
      case 'comment':
        return { icon: '💬', text: `${senderName} đã bình luận bài viết của bạn` };
      case 'friend_request':
        return { icon: '👋', text: `${senderName} đã gửi lời mời kết bạn` };
      case 'friend_accept':
        return { icon: '🤝', text: `${senderName} đã chấp nhận lời mời kết bạn` };
      case 'comment_like':
        return { icon: '👍', text: `${senderName} đã thích bình luận của bạn` };
      case 'message':
        return { icon: '💬', text: `${senderName} đã gửi cho bạn một tin nhắn mới` };
      default:
        return { icon: '🔔', text: `${senderName} đã tương tác với bạn` };
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
    } catch {
      return '';
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={notifRef as any}>
      <button
        onClick={() => {
          setShowNotifDropdown(!showNotifDropdown);
          onCloseOtherDropdowns();
        }}
        className="relative cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 transition-all duration-200 border border-transparent dark:border-indigo-500/10 focus:outline-none flex-shrink-0"
        aria-label="Thông báo"
      >
        <span className="text-xs sm:text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] px-0.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center border border-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile Backdrop Overlay */}
      {showNotifDropdown && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
          onClick={() => setShowNotifDropdown(false)}
          aria-hidden="true"
        />
      )}

      {/* Notifications Dropdown */}
      {showNotifDropdown && (
        <div className="fixed top-12 left-2 right-2 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-96 sm:mt-2 bg-background border border-indigo-500/20 shadow-2xl rounded-2xl py-2 z-50 animate-slide-up max-h-[75vh] sm:max-h-[480px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-indigo-500/10">
            <h3 className="font-bold text-foreground text-sm sm:text-[15px] flex items-center gap-1.5">
              <span>🔔</span> <span>Thông báo</span>
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[11px] text-accent-primary hover:text-accent-primary/80 font-semibold transition-colors"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              {/* Close button for mobile */}
              <button
                onClick={() => setShowNotifDropdown(false)}
                className="sm:hidden w-6 h-6 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted hover:text-foreground text-xs flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-indigo-500/5">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
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
                      if (!notif.is_read) onMarkAsRead(notif.id);
                      setShowNotifDropdown(false);
                    }}
                    className={`flex items-start gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                      !notif.is_read ? 'bg-indigo-500/[0.07]' : ''
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-base sm:text-lg shrink-0 border border-indigo-500/10">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <p
                        className={`text-xs sm:text-[13px] leading-snug break-words ${
                          !notif.is_read ? 'text-foreground font-semibold' : 'text-secondary'
                        }`}
                      >
                        {text}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-muted/50 mt-0.5">{formatTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm shadow-indigo-500/50"></div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
