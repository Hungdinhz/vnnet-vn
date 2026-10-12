'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

interface FriendsSidebarProps {
  friendsList: any[];
}

export default function FriendsSidebar({ friendsList }: FriendsSidebarProps) {
  return (
    <div className="glass-card rounded-2xl p-4.5 border border-indigo-500/10">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center gap-1.5">
          👥 Bạn bè ({friendsList.length})
        </h4>
        <Link href="/friends" className="text-[10px] text-accent-primary hover:underline font-bold">
          Xem tất cả
        </Link>
      </div>

      {friendsList.length === 0 ? (
        <div className="text-center py-5 bg-black/10 dark:bg-white/[0.01] rounded-xl border border-indigo-500/5">
          <span className="text-xl block mb-1">🤝</span>
          <span className="text-[11px] text-muted block">Bạn chưa có người bạn nào</span>
          <Link href="/friends" className="text-[10px] text-accent-purple font-bold hover:underline block mt-1.5">
            Tìm bạn bè mới ➔
          </Link>
        </div>
      ) : (
        <div
          className={`space-y-2.5 pr-1 ${
            friendsList.length > 10 ? 'max-h-[380px] overflow-y-auto scrollbar-thin' : ''
          }`}
        >
          {friendsList.map((friend, idx) => {
            const friendId = friend.friend_id || friend.id;
            const friendName = friend.friend_username || friend.username;
            const friendAvatar = friend.friend_avatar_url || friend.avatar_url;
            return (
              <Link
                key={friendId || idx}
                href={`/profile/${friendId}`}
                className="flex items-center justify-between hover:bg-indigo-500/10 p-2 -mx-1.5 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={friendAvatar}
                    name={friendName}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-foreground group-hover:text-accent-primary transition-colors truncate">
                      {friendName}
                    </div>
                    <div className="text-[9px] text-emerald-400/80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Bạn bè
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-accent-purple bg-indigo-500/10 px-2 py-0.5 rounded-full group-hover:bg-indigo-500/20 flex-shrink-0">
                  Xem
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
