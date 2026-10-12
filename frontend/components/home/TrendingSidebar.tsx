'use client';

import React from 'react';
import Link from 'next/link';

interface TrendingSidebarProps {
  trendingTopics: any[];
}

export default function TrendingSidebar({ trendingTopics }: TrendingSidebarProps) {
  return (
    <div className="glass-card rounded-2xl p-4.5 border border-indigo-500/10">
      <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-3 flex items-center gap-1.5">
        🔥 Xu hướng cộng đồng
      </h4>
      {trendingTopics.length === 0 ? (
        <div className="text-center py-4 bg-black/10 dark:bg-white/[0.01] rounded-xl border border-indigo-500/5">
          <span className="text-base block mb-0.5">🏷️</span>
          <span className="text-[10px] text-muted">Chưa có xu hướng thảo luận nào</span>
        </div>
      ) : (
        <div className="space-y-2">
          {trendingTopics.map((topic, idx) => (
            <Link
              key={idx}
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              className="flex justify-between items-center hover:bg-indigo-500/10 p-2 -mx-1.5 rounded-xl transition-all cursor-pointer group"
            >
              <div>
                <div className="font-bold text-xs text-foreground group-hover:text-accent-primary transition-colors">
                  {topic.tag}
                </div>
                <div className="text-[9px] text-muted/60 mt-0.5">{topic.count} bài viết</div>
              </div>
              <span className="text-accent-primary text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ➔
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
