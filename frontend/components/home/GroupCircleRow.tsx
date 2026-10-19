'use client';

import React from 'react';
import Link from 'next/link';
import { getValidGroupCover, handleGroupImageError } from '@/lib/groupUtils';

interface GroupCircleRowProps {
  myGroups: any[];
}

export default function GroupCircleRow({ myGroups }: GroupCircleRowProps) {
  if (!myGroups || myGroups.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 mb-5 border border-indigo-500/10">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-accent-purple/80">
          👥 Nhóm của bạn ({myGroups.length})
        </span>
        <Link href="/groups" className="text-[11px] text-accent-primary font-semibold hover:underline">
          Tất cả nhóm
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1.5 scrollbar-thin">
        {myGroups.map((group) => {
          const cover = getValidGroupCover(group.coverUrl || group.cover_url, group.name);
          return (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer w-16"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20 group-hover:border-accent-primary group-hover:scale-105 transition-all avatar-glow relative bg-gradient-to-br from-indigo-600/20 to-indigo-500/20 flex items-center justify-center font-bold text-white text-sm">
                <img 
                  src={cover} 
                  alt={group.name} 
                  onError={(e) => handleGroupImageError(e, group.name)}
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="text-[10px] font-semibold text-center text-muted group-hover:text-foreground transition-colors truncate w-full">
                {group.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
