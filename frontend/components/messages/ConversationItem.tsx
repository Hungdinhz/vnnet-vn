import React from 'react';
import { Conversation } from '@/types/messages';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUser: any;
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  currentUser,
}: ConversationItemProps) {
  const isGroup = conversation.type === 'GROUP';

  // Partner for 1-1
  const partner = !isGroup
    ? conversation.members.find((m) => m.userId !== currentUser?.id)
    : null;

  const isOnline = partner ? partner.isOnline : false;

  const getInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      if (isToday) {
        return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
      }
      return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d);
    } catch {
      return '';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left relative ${
        isSelected
          ? 'bg-indigo-500/15 border-l-4 border-indigo-500'
          : 'border-l-4 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.avatarUrl ? (
          <img
            src={conversation.avatarUrl}
            alt={conversation.name || 'Chat'}
            className="w-12 h-12 rounded-full object-cover border border-indigo-500/20"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 text-secondary rounded-full flex items-center justify-center font-bold border border-indigo-500/20 text-base">
            {isGroup ? '👥' : getInitials(conversation.name)}
          </div>
        )}

        {/* Online dot for 1-1 */}
        {!isGroup && isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
            <span>{conversation.name || 'Cuộc trò chuyện'}</span>
            {isGroup && (
              <span className="text-[10px] text-muted/60">👥</span>
            )}
          </span>
          <span className="text-[10px] text-muted/50 flex-shrink-0 ml-1">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <p
            className={`text-xs truncate ${
              conversation.unreadCount > 0
                ? 'text-foreground font-semibold'
                : 'text-muted/60'
            }`}
          >
            {conversation.lastMessageSenderName && isGroup
              ? `${conversation.lastMessageSenderName}: `
              : ''}
            {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
          </p>

          {/* Unread badge */}
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
