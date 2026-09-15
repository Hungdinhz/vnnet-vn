import React, { useState } from 'react';
import { ChatMessage } from '@/types/messages';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isGroup: boolean;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: number) => void;
  onImageClick: (url: string) => void;
}

export default function MessageBubble({
  message,
  isMine,
  isGroup,
  onReply,
  onDelete,
  onImageClick,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
    } catch {
      return '';
    }
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div
      className={`group flex items-end gap-2 my-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for other users in group or 1-1 */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-indigo-500/20 mb-1">
          {message.senderAvatarUrl ? (
            <img src={message.senderAvatarUrl} alt={message.senderUsername} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-indigo-600/40 text-secondary text-xs font-bold flex items-center justify-center">
              {getInitials(message.senderUsername)}
            </div>
          )}
        </div>
      )}

      {/* Action buttons (Reply, Recall) for mine */}
      {isMine && showActions && !message.isDeleted && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center text-xs">
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-muted hover:text-white transition-colors"
            title="Trả lời"
          >
            💬
          </button>
          <button
            onClick={() => onDelete(message.id)}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-red-500/30 text-muted hover:text-red-400 transition-colors"
            title="Thu hồi tin nhắn"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Bubble container */}
      <div className="flex flex-col max-w-[75%] sm:max-w-[65%]">
        {/* Sender name in group chat for other users */}
        {!isMine && isGroup && (
          <span className="text-[11px] font-semibold text-indigo-400/90 mb-1 ml-2">
            {message.senderUsername}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-md relative text-sm ${
            isMine
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white rounded-br-xs'
              : 'glass-card bg-black/30 dark:bg-white/5 border border-indigo-500/15 text-foreground rounded-bl-xs'
          }`}
        >
          {/* Quoted reply banner if this message is a reply */}
          {message.replyToContent && (
            <div
              className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                isMine
                  ? 'bg-black/20 border-white/60 text-white/90'
                  : 'bg-black/10 dark:bg-white/5 border-indigo-400 text-muted'
              }`}
            >
              <div className="font-bold text-[11px] opacity-80">
                {message.replyToSenderUsername || 'Tin nhắn'}
              </div>
              <p className="truncate text-[11px]">{message.replyToContent}</p>
            </div>
          )}

          {/* Deleted message state */}
          {message.isDeleted ? (
            <p className="italic text-muted/60 text-xs flex items-center gap-1.5 py-0.5">
              <span>🚫</span> {message.content || 'Tin nhắn đã được thu hồi'}
            </p>
          ) : (
            <>
              {/* Image attachment if any */}
              {message.imageUrl && (
                <div className="mb-2 overflow-hidden rounded-xl cursor-pointer">
                  <img
                    src={message.imageUrl}
                    alt="Ảnh gửi kèm"
                    className="max-h-64 w-auto rounded-xl object-cover hover:scale-105 transition-transform duration-300"
                    onClick={() => onImageClick(message.imageUrl!)}
                  />
                </div>
              )}

              {/* Text content */}
              {message.content && (
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )}
            </>
          )}

          {/* Time & Read status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
              isMine ? 'text-white/70' : 'text-muted/60'
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isMine && !message.isDeleted && (
              <span title={message.isRead ? 'Đã xem' : 'Đã gửi'}>
                {message.isRead ? (
                  <span className="text-cyan-300 font-bold">✓✓</span>
                ) : (
                  <span>✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons (Reply) for other users */}
      {!isMine && showActions && !message.isDeleted && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center text-xs">
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-muted hover:text-white transition-colors"
            title="Trả lời"
          >
            💬
          </button>
        </div>
      )}
    </div>
  );
}
