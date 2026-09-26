import React, { useState } from 'react';
import { ChatMessage } from '@/types/messages';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isGroup: boolean;
  onReply: (message: ChatMessage) => void;
  onRecallRequest: (message: ChatMessage) => void;
  onImageClick: (url: string) => void;
}

export default function MessageBubble({
  message,
  isMine,
  isGroup,
  onReply,
  onRecallRequest,
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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName?: string | null) => {
    if (!fileName) return '📁';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📕';
    if (['doc', 'docx'].includes(ext || '')) return '📘';
    if (['xls', 'xlsx'].includes(ext || '')) return '📗';
    if (['ppt', 'pptx'].includes(ext || '')) return '📙';
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return '🗜️';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return '🎵';
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return '🎬';
    return '📄';
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
        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-slate-200 dark:border-indigo-500/25 mb-1 shadow-sm">
          {message.senderAvatarUrl ? (
            <img src={message.senderAvatarUrl} alt={message.senderUsername} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
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
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-black/50 hover:bg-slate-300 dark:hover:bg-black/70 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            title="Trả lời"
          >
            💬
          </button>
          <button
            onClick={() => onRecallRequest(message)}
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-black/50 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors shadow-sm"
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
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 ml-2">
            {message.senderUsername}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 shadow-md relative text-sm ${
            isMine
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white rounded-br-xs shadow-indigo-500/15'
              : 'bg-white dark:bg-[#1E1738] border border-slate-200 dark:border-indigo-500/25 text-slate-800 dark:text-[#EDE9FE] rounded-bl-xs shadow-sm'
          }`}
        >
          {/* Quoted reply banner if this message is a reply */}
          {message.replyToContent && (
            <div
              className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                isMine
                  ? 'bg-black/20 border-white/70 text-white/90'
                  : 'bg-slate-100 dark:bg-black/30 border-indigo-500 text-slate-600 dark:text-slate-300'
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
            <p className="italic text-slate-400 dark:text-slate-400 text-xs flex items-center gap-1.5 py-0.5">
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

              {/* File attachment if any */}
              {message.messageType === 'FILE' && message.fileUrl && (
                <div
                  className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 transition-all ${
                    isMine
                      ? 'bg-black/20 hover:bg-black/30 border border-white/20'
                      : 'bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 border border-slate-200 dark:border-indigo-500/20'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(message.fileName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isMine ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                      {message.fileName || 'Tài liệu đính kèm'}
                    </p>
                    {message.fileSize && (
                      <p className={`text-[10px] ${isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatFileSize(message.fileSize)}
                      </p>
                    )}
                  </div>
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={message.fileName || 'file'}
                    className={`p-2 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                      isMine
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title="Tải xuống tệp"
                  >
                    ⬇️
                  </a>
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
              isMine ? 'text-white/75' : 'text-slate-400 dark:text-slate-400'
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
            className="p-1.5 rounded-lg bg-slate-200 dark:bg-black/50 hover:bg-slate-300 dark:hover:bg-black/70 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            title="Trả lời"
          >
            💬
          </button>
        </div>
      )}
    </div>
  );
}
