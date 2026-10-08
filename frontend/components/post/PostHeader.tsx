'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

interface PostHeaderProps {
  post: any;
  isOwner: boolean;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onStartEdit: () => void;
  onDeletePost: () => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Vừa xong";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return "Đăng gần đây";
  }
};

export default function PostHeader({
  post,
  isOwner,
  showMenu,
  setShowMenu,
  menuRef,
  onStartEdit,
  onDeletePost,
}: PostHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3.5">
      <div className="flex items-center gap-3 group">
        <Link href={`/profile/${post.owner_id}`}>
          <Avatar
            src={post.owner?.avatar_url}
            name={post.owner?.username || 'U'}
            size="md"
            glow
            className="group-hover:brightness-110 transition-all cursor-pointer"
          />
        </Link>

        <div>
          <div className="font-bold text-foreground group-hover:text-accent-purple transition-colors text-[15px] flex items-center gap-1.5 flex-wrap">
            <Link href={`/profile/${post.owner_id}`} className="hover:underline">
              {post.owner?.username || `User #${post.owner_id}`}
            </Link>
            {isOwner && (
              <span className="text-[10px] bg-indigo-500/20 text-accent-purple font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Bạn
              </span>
            )}
            {post.group_id && (
              <>
                <span className="text-muted/60 text-xs mx-0.5">▶</span>
                <Link href={`/groups/${post.group_id}`} className="hover:underline text-accent-purple">
                  {post.group_name || `Nhóm #${post.group_id}`}
                </Link>
              </>
            )}
            {post.mentioned_users && post.mentioned_users.length > 0 && (
              <span className="text-muted/60 text-xs font-normal">
                — cùng với{' '}
                {post.mentioned_users.map((u: any, i: number) => (
                  <span key={u.id}>
                    <Link href={`/profile/${u.id}`} className="font-bold text-accent-purple hover:underline">
                      {u.username}
                    </Link>
                    {i < post.mentioned_users.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </span>
            )}
          </div>
          <div className="text-xs text-muted/50 flex items-center gap-1">
            <span>{formatDate(post.created_at)}</span>
            <span>•</span>
            <span title={post.visibility === 'friends' ? 'Bạn bè' : post.visibility === 'private' ? 'Chỉ mình tôi' : 'Công khai'}>
              {post.visibility === 'friends' ? '👥' : post.visibility === 'private' ? '🔒' : '🌏'}
            </span>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="relative" ref={menuRef as any}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted/60 flex items-center justify-center focus:outline-none transition-colors"
          >
            •••
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 glass-card rounded-lg py-1.5 z-40 animate-slide-up shadow-xl">
              <button
                onClick={() => {
                  onStartEdit();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 text-secondary text-sm font-medium flex items-center gap-2"
              >
                ✏️ Chỉnh sửa bài viết
              </button>
              <button
                onClick={onDeletePost}
                className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-2"
              >
                🗑️ Xóa bài viết
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
