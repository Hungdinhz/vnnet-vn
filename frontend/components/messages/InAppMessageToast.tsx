import React, { useEffect, useRef } from 'react';

export interface InAppNotification {
  conversationId: number;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl: string | null;
  conversationName?: string | null;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileName?: string | null;
  count: number;
  timestamp: Date;
}

interface InAppMessageToastProps {
  notifications: InAppNotification[];
  onDismiss: (conversationId: number) => void;
  onOpenConversation: (conversationId: number) => void;
  previewEnabled?: boolean;
}

// Notification sound removed as requested
export function playNotificationChime() {
  // Sound disabled
}

export default function InAppMessageToast({
  notifications,
  onDismiss,
  onOpenConversation,
  previewEnabled = true,
}: InAppMessageToastProps) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => {
        return (
          <div
            key={notif.conversationId}
            onClick={() => onOpenConversation(notif.conversationId)}
            className="pointer-events-auto bg-white/95 dark:bg-slate-800/95 border border-sky-500/25 dark:border-slate-600 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-all duration-200 animate-slide-up flex items-start gap-3 relative group"
          >
            {/* Avatar with unread count badge */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-sky-500/30">
                {notif.senderAvatarUrl ? (
                  <img
                    src={notif.senderAvatarUrl}
                    alt={notif.senderUsername}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-sky-500 text-white font-bold text-sm flex items-center justify-center">
                    {notif.senderUsername?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Badge +1, +2 etc */}
              {notif.count > 1 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-sky-500 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
                  +{notif.count}
                </span>
              )}
            </div>

            {/* Notification Text */}
            <div className="flex-1 min-w-0 pr-5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {notif.senderUsername}
                </span>
                {notif.count > 1 && (
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                    ({notif.count} tin mới)
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {!previewEnabled ? (
                  <span className="italic text-slate-400">Đã gửi cho bạn một tin nhắn</span>
                ) : notif.messageType === 'IMAGE' ? (
                  <span>📷 [Hình ảnh]</span>
                ) : notif.messageType === 'FILE' ? (
                  <span>📎 [Tệp] {notif.fileName || 'Tài liệu'}</span>
                ) : (
                  notif.content || '...'
                )}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notif.conversationId);
              }}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
