import React from 'react';
import { Conversation } from '@/types/messages';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: any;
  onBack?: () => void;
  onOpenGroupInfo: () => void;
  onOpenChatSettings?: () => void;
}

export default function ChatHeader({
  conversation,
  currentUser,
  onBack,
  onOpenGroupInfo,
  onOpenChatSettings,
}: ChatHeaderProps) {
  const isGroup = conversation.type === 'GROUP';

  // For 1-1 chat, check if partner is online
  const partner = !isGroup
    ? conversation.members.find((m) => m.userId !== currentUser?.id)
    : null;

  const isOnline = partner ? partner.isOnline : false;

  const getInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => {
          if (isGroup) {
            onOpenGroupInfo();
          } else if (onOpenChatSettings) {
            onOpenChatSettings();
          }
        }}
        title={isGroup ? 'Xem thông tin & cài đặt nhóm' : 'Xem thông tin cuộc trò chuyện'}
      >
        {/* Back button on mobile */}
        {onBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mr-1 transition-colors"
            title="Quay lại"
          >
            ←
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl}
              alt={conversation.name || 'Chat'}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center font-bold text-white border border-slate-200 dark:border-slate-600 shadow-sm">
              {isGroup ? '👥' : getInitials(conversation.name)}
            </div>
          )}

          {/* Online badge for 1-1 */}
          {!isGroup && (
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                isOnline ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-500'
              }`}
            />
          )}
        </div>

        {/* Title & Status */}
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-[15px] flex items-center gap-1.5">
            <span>{conversation.name || 'Cuộc trò chuyện'}</span>
            {isGroup && (
              <span className="text-[10px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/25">
                Nhóm
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium">
            {isGroup ? (
              <span className="text-slate-500 dark:text-slate-400">
                {conversation.members.length} thành viên • Cài đặt
              </span>
            ) : isOnline ? (
              <span className="text-emerald-500 font-semibold">Đang hoạt động</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Không hoạt động</span>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        {isGroup && (
          <button
            onClick={onOpenGroupInfo}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Cài đặt & Thành viên nhóm"
          >
            ⚙️
          </button>
        )}
        {!isGroup && onOpenChatSettings && (
          <button
            onClick={onOpenChatSettings}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Cài đặt cuộc trò chuyện"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
