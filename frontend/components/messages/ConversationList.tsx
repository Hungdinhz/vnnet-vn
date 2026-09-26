import React, { useState } from 'react';
import { Conversation } from '@/types/messages';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (conv: Conversation) => void;
  currentUser: any;
  onOpenCreateGroup: () => void;
  onOpenSettings: () => void;
}

type TabType = 'ALL' | 'DIRECT' | 'GROUP' | 'UNREAD';

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUser,
  onOpenCreateGroup,
  onOpenSettings,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabType>('ALL');

  // Deduplicate conversations (especially DIRECT chats with same partner)
  const uniqueConversations: Conversation[] = [];
  const seenDirectPartnerIds = new Set<number>();
  const seenIds = new Set<number>();

  for (const c of conversations) {
    if (seenIds.has(c.id)) continue;
    seenIds.add(c.id);

    if (c.type === 'DIRECT') {
      const partner = c.members.find((m) => m.userId !== currentUser?.id);
      if (partner) {
        if (seenDirectPartnerIds.has(partner.userId)) {
          continue; // Skip duplicate direct conversation
        }
        seenDirectPartnerIds.add(partner.userId);
      }
    }
    uniqueConversations.push(c);
  }

  const filtered = uniqueConversations.filter((c) => {
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
    <div className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-slate-700 flex flex-col h-full bg-white/90 dark:bg-slate-800">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Cài đặt tin nhắn"
            >
              ⚙️
            </button>
            <h1 className="text-xl font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <span>💬</span> Tin nhắn
            </h1>
          </div>
          <button
            onClick={onOpenCreateGroup}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Tạo nhóm chat mới"
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
            className="w-full pl-9 pr-7 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button
            onClick={() => setTab('ALL')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'ALL'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTab('DIRECT')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'DIRECT'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bạn bè
          </button>
          <button
            onClick={() => setTab('GROUP')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'GROUP'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nhóm
          </button>
          <button
            onClick={() => setTab('UNREAD')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === 'UNREAD'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chưa đọc
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
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
