'use client';

import React from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

interface PostCommentsProps {
  post: any;
  comments: any[];
  isLoadingComments: boolean;
  newComment: string;
  isSubmitting: boolean;
  replyingToId: number | null;
  replyingToUsername: string | null;
  friendsList: any[];
  showMentionDropdown: boolean;
  mentionQuery: string;
  commentInputRef: React.RefObject<HTMLInputElement | null>;
  onCommentInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectMentionFriend: (friend: any) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  onReplyClick: (commentId: number, username?: string, userId?: number) => void;
  onCommentLike: (commentId: number, currentLiked: boolean) => void;
}

const formatCommentTime = (dateString: string) => {
  if (!dateString) return "Vừa xong";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return "Vừa xong";
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return "Vừa xong";
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date);
  } catch {
    return "Vừa xong";
  }
};

const renderCommentContent = (content: string) => {
  if (!content) return null;
  const parts = content.split(/(@[a-zA-Z0-9_\p{L}]+)/gu);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-accent-primary font-bold hover:underline">
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function PostComments({
  post,
  comments,
  isLoadingComments,
  newComment,
  isSubmitting,
  replyingToId,
  replyingToUsername,
  friendsList,
  showMentionDropdown,
  mentionQuery,
  commentInputRef,
  onCommentInputChange,
  onSelectMentionFriend,
  onCommentSubmit,
  onCancelReply,
  onReplyClick,
  onCommentLike,
}: PostCommentsProps) {
  return (
    <div className="space-y-3.5 pt-1.5 animate-slide-up">
      {/* Create comment form */}
      <form onSubmit={onCommentSubmit} className="flex flex-col gap-2">
        {replyingToId && (
          <div className="text-[11px] text-muted/50 flex items-center gap-1 ml-10">
            <span>
              Đang trả lời <b className="text-accent-purple">{replyingToUsername}</b>
            </span>
            <button type="button" onClick={onCancelReply} className="text-indigo-400 hover:underline">
              Hủy
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Avatar
            src={post.owner?.avatar_url}
            name="ME"
            size="sm"
            className="flex-shrink-0"
          />
          <div className="flex-1 relative">
            <div className="flex input-anime rounded-2xl items-center px-3 py-1.5">
              <input
                ref={commentInputRef as any}
                type="text"
                value={newComment}
                onChange={onCommentInputChange}
                placeholder={replyingToId ? `Phản hồi ${replyingToUsername}...` : "Viết bình luận (@ để tag bạn bè)..."}
                className="flex-1 bg-transparent border-0 text-[13px] focus:outline-none py-1 placeholder-indigo-500/40 text-foreground"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="text-muted font-bold hover:text-indigo-400 transition-colors disabled:opacity-30 focus:outline-none text-xs px-2"
              >
                {isSubmitting ? "Gửi..." : "Đăng"}
              </button>
            </div>

            {/* Mention Suggestion Dropdown */}
            {showMentionDropdown && friendsList.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-64 glass-card rounded-xl py-1.5 shadow-2xl z-50 animate-slide-up max-h-48 overflow-y-auto border border-indigo-500/20">
                <div className="px-3 py-1 text-[10px] text-muted font-bold uppercase tracking-wider">
                  Gợi ý bạn bè (@)
                </div>
                {friendsList
                  .filter(f => {
                    const name = (f.friend_username || f.username || '').toLowerCase();
                    return name.includes(mentionQuery);
                  })
                  .slice(0, 5)
                  .map(friend => {
                    const fid = friend.friend_id || friend.id;
                    const fname = friend.friend_username || friend.username;
                    const favatar = friend.friend_avatar_url || friend.avatar_url;
                    return (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => onSelectMentionFriend(friend)}
                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Avatar src={favatar} name={fname || 'U'} size="xs" />
                        <span className="text-xs font-semibold text-foreground truncate">@{fname}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comments List */}
      {isLoadingComments ? (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center text-xs text-muted/40 py-1.5">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
          {comments
            .filter(c => !c.parent_id)
            .map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Top-level comment */}
                <div className="flex gap-2.5 items-start">
                  <Link href={`/profile/${comment.userId || comment.owner?.id}`} className="flex-shrink-0">
                    <Avatar
                      src={comment.owner?.avatar_url}
                      name={comment.owner?.username || 'U'}
                      size="sm"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="bg-white/[0.05] px-3.5 py-2 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-sm relative group border border-indigo-500/10">
                      <Link
                        href={`/profile/${comment.userId || comment.owner?.id}`}
                        className="font-bold text-[13px] text-secondary hover:underline block mb-0.5"
                      >
                        {comment.owner?.username || `User #${comment.userId}`}
                      </Link>
                      <span className="text-[13px] text-foreground/70 leading-snug whitespace-pre-wrap">
                        {renderCommentContent(comment.content)}
                      </span>

                      {comment.likes_count > 0 && (
                        <div className="absolute -bottom-2 -right-2 bg-background px-1.5 py-0.5 rounded-full border border-indigo-500/20 shadow-sm flex items-center gap-1 text-[10px] text-indigo-300/70">
                          <span>❤️</span>
                          <span>{comment.likes_count}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-muted/40 ml-3.5 mt-1 flex gap-3">
                      <button
                        onClick={() => onCommentLike(comment.id, comment.is_liked)}
                        className={`hover:underline ${comment.is_liked ? 'text-indigo-400' : ''}`}
                      >
                        Thích
                      </button>
                      <button
                        onClick={() =>
                          onReplyClick(
                            comment.id,
                            comment.owner?.username,
                            comment.userId || comment.owner?.id
                          )
                        }
                        className="hover:underline"
                      >
                        Phản hồi
                      </button>
                      <span className="font-normal">{formatCommentTime(comment.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comments
                  .filter(c => c.parent_id === comment.id)
                  .map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 items-start ml-10 mt-2">
                      <Link href={`/profile/${reply.userId || reply.owner?.id}`} className="flex-shrink-0">
                        <Avatar
                          src={reply.owner?.avatar_url}
                          name={reply.owner?.username || 'U'}
                          size="xs"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-white/[0.05] px-3 py-1.5 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-sm relative group border border-indigo-500/10">
                          <Link
                            href={`/profile/${reply.userId || reply.owner?.id}`}
                            className="font-bold text-[12px] text-secondary hover:underline block mb-0.5"
                          >
                            {reply.owner?.username || `User #${reply.userId}`}
                          </Link>
                          <span className="text-[12px] text-foreground/70 leading-snug whitespace-pre-wrap">
                            {renderCommentContent(reply.content)}
                          </span>

                          {reply.likes_count > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-background px-1.5 py-0.5 rounded-full border border-indigo-500/20 shadow-sm flex items-center gap-1 text-[9px] text-indigo-300/70">
                              <span>❤️</span>
                              <span>{reply.likes_count}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-muted/40 ml-3.5 mt-1 flex gap-3">
                          <button
                            onClick={() => onCommentLike(reply.id, reply.is_liked)}
                            className={`hover:underline ${reply.is_liked ? 'text-indigo-400' : ''}`}
                          >
                            Thích
                          </button>
                          <button
                            onClick={() =>
                              onReplyClick(
                                comment.id,
                                reply.owner?.username,
                                reply.userId || reply.owner?.id
                              )
                            }
                            className="hover:underline"
                          >
                            Phản hồi
                          </button>
                          <span className="font-normal">{formatCommentTime(reply.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
