import React, { useState } from 'react';
import { Conversation } from '@/types/messages';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (conv: Conversation) => void;
  currentUser: any;
  onOpenCreateGroup: () => void;
}

type TabType = 'ALL' | 'DIRECT' | 'GROUP' | 'UNREAD';

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUser,
  onOpenCreateGroup,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabType>('ALL');

  const filtered = conversations.filter((c) => {
    // Search match
    const nameMatch = c.name?.toLowerCase().includes(search.toLowerCase());
    const memberMatch = c.members.some((m) =>
      m.username.toLowerCase().includes(search.toLowerCase())
    );
    if (search && !nameMatch && !memberMatch) return false;

    // Tab filter
    if (tab === 'DIRECT') return c.type === 'DIRECT';
    if (tab === 'GROUP') return c.type === 'GROUP';
    if (tab === 'UNREAD') return c.unreadCount > 0;
    return true;
  });

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-indigo-500/15 flex flex-col h-full bg-black/20 backdrop-blur-md">
      {/* Top Header */}
      <div className="p-4 border-b border-indigo-500/15">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold gradient-text flex items-center gap-2">
            <span>💬</span> Tin nhắn
          </h1>
          <button
            onClick={onOpenCreateGroup}
            className="px-3 py-1.5 rounded-xl btn-anime text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Tạo nhóm chat"
          >
            <span>👥</span>
            <span>+ Nhóm</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            className="w-full pl-9 pr-3.5 py-2 input-anime rounded-xl text-xs"
          />
          <span className="absolute left-3 top-2.5 text-muted/50 text-xs">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-muted/50 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3 bg-black/30 p-1 rounded-xl border border-indigo-500/10">
          <button
            onClick={() => setTab('ALL')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'ALL'
                ? 'bg-indigo-600/40 text-foreground shadow-sm'
                : 'text-muted/60 hover:text-foreground'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTab('DIRECT')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'DIRECT'
                ? 'bg-indigo-600/40 text-foreground shadow-sm'
                : 'text-muted/60 hover:text-foreground'
            }`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => setTab('GROUP')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'GROUP'
                ? 'bg-indigo-600/40 text-foreground shadow-sm'
                : 'text-muted/60 hover:text-foreground'
            }`}
          >
            Nhóm
          </button>
          <button
            onClick={() => setTab('UNREAD')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'UNREAD'
                ? 'bg-indigo-600/40 text-foreground shadow-sm'
                : 'text-muted/60 hover:text-foreground'
            }`}
          >
            Chưa đọc
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-indigo-500/5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted/40 text-xs">
            {search ? (
              'Không tìm thấy cuộc trò chuyện phù hợp.'
            ) : tab === 'UNREAD' ? (
              'Không có tin nhắn chưa đọc.'
            ) : (
              <div>
                <p className="text-3xl mb-2">💌</p>
                <p>Chưa có cuộc trò chuyện nào.</p>
                <p className="mt-1">Hãy kết bạn hoặc tạo nhóm mới để bắt đầu!</p>
              </div>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv)}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
}
