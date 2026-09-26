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

// Web Audio API chime sound generator
export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: B5 (higher chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.1);
    gain2.gain.setValueAtTime(0.18, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (e) {
    // Audio context not allowed or failed, silently ignore
  }
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
            className="pointer-events-auto bg-white/95 dark:bg-[#150F2C]/95 border border-indigo-500/25 dark:border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-all duration-200 animate-slide-up flex items-start gap-3 relative group"
          >
            {/* Avatar with unread count badge */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-500/30">
                {notif.senderAvatarUrl ? (
                  <img
                    src={notif.senderAvatarUrl}
                    alt={notif.senderUsername}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center">
                    {notif.senderUsername?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Badge +1, +2 etc */}
              {notif.count > 1 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-md animate-bounce">
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
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
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
