"use client";

import React from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '@/types/game';
import { Trophy, Medal, Flame } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  currentUserId?: number;
  emptyMessage?: string;
}

export default function Leaderboard({
  entries,
  isLoading = false,
  currentUserId,
  emptyMessage = 'Chưa có bảng xếp hạng cho trò chơi này.'
}: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-xl bg-surface-hover/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20" />
              <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
              <div className="w-24 h-4 rounded bg-indigo-500/20" />
            </div>
            <div className="w-16 h-5 rounded bg-indigo-500/20" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-10 px-4 text-text-muted">
        <Trophy className="w-10 h-10 mx-auto text-indigo-400/40 mb-2" />
        <p className="text-sm">{emptyMessage}</p>
        <p className="text-xs text-text-muted/60 mt-1">Hãy là người đầu tiên ghi tên lên bảng vàng!</p>
      </div>
    );
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-sm border border-amber-500/40 shadow-sm shadow-amber-500/30">
            🥇
          </span>
        );
      case 2:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 font-extrabold text-sm border border-slate-400/40 shadow-sm shadow-slate-300/30">
            🥈
          </span>
        );
      case 3:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-extrabold text-sm border border-amber-700/40 shadow-sm shadow-amber-700/30">
            🥉
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-full text-text-muted font-bold text-xs bg-surface-hover/60 border border-indigo-500/10">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div className="divide-y divide-indigo-500/10">
      {entries.map((entry) => {
        const isMe = currentUserId && entry.user.id === currentUserId;
        const isTop3 = entry.rank <= 3;

        return (
          <div
            key={`${entry.rank}-${entry.user.id}`}
            className={`flex items-center justify-between p-3.5 transition-colors ${
              isMe
                ? 'bg-indigo-500/15 border-l-4 border-indigo-500 font-medium'
                : isTop3
                ? 'bg-surface-hover/40 hover:bg-surface-hover/70'
                : 'hover:bg-surface-hover/30'
            }`}
          >
            {/* Rank & User */}
            <div className="flex items-center gap-3 min-w-0">
              {getRankBadge(entry.rank)}

              <Link href={`/profile/${entry.user.id}`} className="flex items-center gap-2.5 min-w-0 group">
                <img
                  src={entry.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + entry.user.username}
                  alt={entry.user.username}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-500/30 group-hover:border-indigo-400 transition-colors"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground group-hover:text-indigo-400 truncate">
                      {entry.user.username}
                    </p>
                    {isMe && (
                      <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.2 rounded-md">
                        Bạn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted">
                    {entry.total_plays} lượt chơi
                  </p>
                </div>
              </Link>
            </div>

            {/* Score */}
            <div className="text-right pl-3">
              <div className="flex items-center justify-end gap-1 text-sm font-bold text-indigo-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{entry.high_score.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-text-muted">điểm kỷ lục</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
