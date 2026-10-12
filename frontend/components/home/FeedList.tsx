'use client';

import React from 'react';
import PostCard from '@/components/PostCard';
import Spinner from '@/components/ui/Spinner';

interface FeedListProps {
  posts: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNext: boolean;
  lastPostRef: (node: HTMLDivElement | null) => void;
  onRefresh: () => void;
}

export default function FeedList({
  posts,
  isLoading,
  isLoadingMore,
  hasNext,
  lastPostRef,
  onRefresh,
}: FeedListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 glass-card rounded-2xl gap-3 border border-indigo-500/10">
        <Spinner size="lg" color="border-accent-purple border-t-transparent" />
        <span className="text-xs text-muted/60 font-semibold">Đang chuẩn bị bảng tin của bạn...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center glass-card p-12 rounded-2xl border border-indigo-500/10">
        <div className="text-4xl mb-3">📰</div>
        <p className="font-extrabold text-foreground">Bảng tin trống</p>
        <p className="text-xs text-muted/50 mt-1">
          Chưa có bài viết phù hợp hiển thị. Hãy kết bạn hoặc tham gia nhóm nhé! ✨
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post, index) => (
        <PostCard
          key={post.id || index}
          post={post}
          onPostDeleted={onRefresh}
          onPostUpdated={onRefresh}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasNext && (
        <div ref={lastPostRef} className="flex justify-center items-center py-6">
          {isLoadingMore ? (
            <div className="flex items-center gap-3 bg-indigo-500/15 border border-indigo-500/20 px-5 py-3 rounded-full shadow-md">
              <Spinner size="sm" color="border-accent-purple border-t-transparent" />
              <span className="text-xs text-muted font-bold">Đang tải thêm câu chuyện...</span>
            </div>
          ) : (
            <div className="h-4"></div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasNext && posts.length > 0 && (
        <div className="text-center py-6">
          <div className="glass-card inline-flex items-center gap-2 px-6 py-3 rounded-full border border-indigo-500/10">
            <span className="text-sm">✨</span>
            <span className="text-xs text-muted font-bold">Bạn đã xem hết các bài viết mới nhất</span>
          </div>
        </div>
      )}
    </div>
  );
}
