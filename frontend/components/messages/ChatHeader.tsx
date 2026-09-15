import React from 'react';
import { Conversation } from '@/types/messages';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: any;
  onBack?: () => void;
  onOpenGroupInfo: () => void;
}

export default function ChatHeader({
  conversation,
  currentUser,
  onBack,
  onOpenGroupInfo,
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
    <div className="px-4 py-3 border-b border-indigo-500/15 flex items-center justify-between bg-black/25 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Back button on mobile */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-white mr-1"
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
              className="w-10 h-10 rounded-full object-cover border border-indigo-500/30"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white border border-indigo-500/30 shadow-sm">
              {isGroup ? '👥' : getInitials(conversation.name)}
            </div>
          )}

          {/* Online badge for 1-1 */}
          {!isGroup && (
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                isOnline ? 'bg-emerald-400' : 'bg-gray-400'
              }`}
            />
          )}
        </div>

        {/* Title & Status */}
        <div>
          <div className="font-bold text-foreground text-[15px] flex items-center gap-1.5">
            <span>{conversation.name || 'Cuộc trò chuyện'}</span>
            {isGroup && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Nhóm
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium">
            {isGroup ? (
              <span className="text-muted/70">
                {conversation.members.length} thành viên
              </span>
            ) : isOnline ? (
              <span className="text-emerald-400">Đang hoạt động</span>
            ) : (
              <span className="text-muted/60">Không hoạt động</span>
            )}
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        {isGroup && (
          <button
            onClick={onOpenGroupInfo}
            className="p-2 rounded-xl hover:bg-white/10 text-muted hover:text-white transition-colors"
            title="Thông tin nhóm"
          >
            ⚙️
          </button>
        )}
      </div>
    </div>
  );
}
