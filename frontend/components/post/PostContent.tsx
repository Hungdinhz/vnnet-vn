'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

interface PostContentProps {
  post: any;
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

export default function PostContent({ post }: PostContentProps) {
  return (
    <>
      {post.title && <h3 className="font-bold text-foreground mb-1 text-[16px]">{post.title}</h3>}
      <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

      {/* Post attachment image */}
      {post.image_url && (
        <div className="w-[calc(100%+2rem)] -mx-4 md:w-[calc(100%+2.5rem)] md:-mx-5 border-y border-indigo-500/10 overflow-hidden mb-3.5 bg-black/20 flex justify-center max-h-[500px]">
          <img
            src={post.image_url}
            alt="Đính kèm"
            className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* Shared Post Container */}
      {post.shared_post && (
        <div className="border border-indigo-500/15 rounded-xl p-3 mb-3 bg-white/[0.02]">
          <Link href={`/profile/${post.shared_post.owner?.id}`} className="flex items-center gap-2 mb-2 group">
            <Avatar
              src={post.shared_post.owner?.avatar_url}
              name={post.shared_post.owner?.username || 'U'}
              size="xs"
            />
            <div>
              <span className="font-semibold text-[13px] text-secondary group-hover:underline">
                {post.shared_post.owner?.username}
              </span>
              <span className="text-[10px] text-muted/40 ml-2">{formatDate(post.shared_post.created_at)}</span>
            </div>
          </Link>
          {post.shared_post.title && (
            <h4 className="font-semibold text-[14px] text-foreground mb-1">{post.shared_post.title}</h4>
          )}
          <p className="text-[13px] text-secondary/60 line-clamp-3 mb-2">{post.shared_post.content}</p>
          {post.shared_post.image_url && (
            <div className="rounded-lg overflow-hidden border border-indigo-500/10">
              <img src={post.shared_post.image_url} className="w-full max-h-[300px] object-cover" alt="Shared attachment" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
