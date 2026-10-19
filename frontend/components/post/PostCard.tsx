'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostReactions from './PostReactions';
import PostComments from './PostComments';
import PostEditForm from './PostEditForm';
import ShareModal from './ShareModal';

export interface PostProps {
  post: any;
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
}

export default function PostCard({ post, onPostDeleted, onPostUpdated }: PostProps) {
  // Reaction states
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [myReaction, setMyReaction] = useState<string | null>(post.my_reaction || null);
  const [reactionsSummary, setReactionsSummary] = useState<Record<string, number>>(post.reactions_summary || {});
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Comments states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState<number>(post.comments_count ?? 0);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const [commentMentionedUserIds, setCommentMentionedUserIds] = useState<number[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef<HTMLInputElement>(null);

  // User & permissions
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchSelf = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUserId(res.data.id);
      } catch (err) {
        console.error("Lỗi lấy self user trong PostCard:", err);
      }
    };
    fetchSelf();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReaction = async (reactionType: string = 'like') => {
    if (isLoadingLike) return;
    setIsLoadingLike(true);
    setLikeAnimating(true);
    setShowReactionPicker(false);
    setTimeout(() => setLikeAnimating(false), 400);

    try {
      await api.post(`/posts/${post.id}/like?type=${reactionType}`);
      if (myReaction === reactionType) {
        setMyReaction(null);
        setIsLiked(false);
        setLikeCount((prev: number) => Math.max(0, prev - 1));
        setReactionsSummary(prev => {
          const updated = { ...prev };
          if (updated[reactionType]) {
            updated[reactionType]--;
            if (updated[reactionType] <= 0) delete updated[reactionType];
          }
          return updated;
        });
      } else {
        const oldReaction = myReaction;
        setMyReaction(reactionType);
        setIsLiked(true);
        if (!oldReaction) {
          setLikeCount((prev: number) => prev + 1);
        }
        setReactionsSummary(prev => {
          const updated = { ...prev };
          if (oldReaction && updated[oldReaction]) {
            updated[oldReaction]--;
            if (updated[oldReaction] <= 0) delete updated[oldReaction];
          }
          updated[reactionType] = (updated[reactionType] || 0) + 1;
          return updated;
        });
      }
    } catch (error) {
      console.error("Lỗi khi react bài viết:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleReactionHover = () => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    setShowReactionPicker(true);
  };

  const handleReactionLeave = () => {
    reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(false), 300);
  };

  const toggleComments = async () => {
    const willShow = !showComments;
    setShowComments(willShow);

    if (willShow && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const response = await api.get(`/posts/${post.id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
      } finally {
        setIsLoadingComments(false);
      }
    }

    if (willShow && friendsList.length === 0) {
      api.get('/friends/list').then(r => setFriendsList(r.data || [])).catch(() => {});
    }
  };

  const handleCommentLike = async (commentId: number, currentLiked: boolean) => {
    try {
      await api.post(`/posts/${post.id}/comments/${commentId}/like`);
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              is_liked: !currentLiked,
              likes_count: currentLiked ? Math.max(0, (c.likes_count || 0) - 1) : (c.likes_count || 0) + 1,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Lỗi khi like bình luận:", err);
    }
  };

  const handleReplyClick = (commentId: number, username?: string, userId?: number) => {
    setReplyingToId(commentId);
    setReplyingToUsername(username || null);
    if (username) {
      setNewComment(`@${username} `);
      if (userId) {
        setCommentMentionedUserIds([userId]);
      }
    }
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyingToUsername(null);
    setNewComment('');
    setCommentMentionedUserIds([]);
    setShowMentionDropdown(false);
  };

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const words = val.split(' ');
    const lastWord = words[words.length - 1] || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const selectMentionFriend = (friend: any) => {
    const friendId = friend.friend_user_id || friend.friend_id || friend.id;
    const friendName = friend.friend_username || friend.username;
    const words = newComment.split(' ');
    words.pop();
    const updated = [...words, `@${friendName} `].join(' ').trimStart();
    setNewComment(updated);
    setCommentMentionedUserIds(prev => Array.from(new Set([...prev, friendId])));
    setShowMentionDropdown(false);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${post.id}/comments`, {
        content: newComment,
        parent_id: replyingToId,
        mentioned_user_ids: commentMentionedUserIds,
      });

      const commentsRes = await api.get(`/posts/${post.id}/comments`);
      setComments(commentsRes.data);
      setLocalCommentsCount(prev => prev + 1);
      setNewComment('');
      setCommentMentionedUserIds([]);
      cancelReply();
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
      toast.error("Không thể gửi bình luận lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success("Xóa bài viết thành công!");
      if (onPostDeleted) {
        onPostDeleted();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Lỗi xóa bài viết:", err);
      toast.error(err.response?.data?.detail || "Xóa bài viết thất bại.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    setIsSavingEdit(true);
    try {
      await api.put(`/posts/${post.id}`, {
        title: editTitle,
        content: editContent,
      });
      setIsEditing(false);
      toast.success("Cập nhật bài viết thành công!");
      if (onPostUpdated) {
        onPostUpdated();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Lỗi sửa bài viết:", err);
      toast.error(err.response?.data?.detail || "Cập nhật thất bại.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSharing(true);
    try {
      await api.post('/posts', {
        title: `Đã chia sẻ bài viết của ${post.owner?.username || 'một người dùng'}`,
        content: shareContent || "Hãy xem bài viết này!",
        shared_post_id: post.id,
      });
      setShowShareModal(false);
      setShareContent('');
      toast.success("Đã chia sẻ bài viết thành công!");
      if (onPostUpdated) onPostUpdated();
    } catch (err: any) {
      console.error("Lỗi khi chia sẻ:", err);
      toast.error(err.response?.data?.detail || "Chia sẻ thất bại.");
    } finally {
      setIsSharing(false);
    }
  };

  const isOwner = currentUserId !== null && (post.owner_id === currentUserId || post.owner?.id === currentUserId);

  return (
    <div className="glass-card glass-card-hover rounded-xl p-3.5 sm:p-4 md:p-5 relative transition-all duration-300 animate-slide-up w-full max-w-full overflow-hidden">
      <PostHeader
        post={post}
        isOwner={isOwner}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        menuRef={menuRef}
        onStartEdit={() => setIsEditing(true)}
        onDeletePost={handleDeletePost}
      />

      {isEditing ? (
        <PostEditForm
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editContent={editContent}
          setEditContent={setEditContent}
          isSavingEdit={isSavingEdit}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <PostContent post={post} />
      )}

      <PostReactions
        post={post}
        isOwner={isOwner}
        likeCount={likeCount}
        localCommentsCount={localCommentsCount}
        myReaction={myReaction}
        isLoadingLike={isLoadingLike}
        likeAnimating={likeAnimating}
        showReactionPicker={showReactionPicker}
        showComments={showComments}
        onReaction={handleReaction}
        onReactionHover={handleReactionHover}
        onReactionLeave={handleReactionLeave}
        onToggleComments={toggleComments}
        onOpenShare={() => setShowShareModal(true)}
      />

      {showComments && (
        <PostComments
          post={post}
          comments={comments}
          isLoadingComments={isLoadingComments}
          newComment={newComment}
          isSubmitting={isSubmitting}
          replyingToId={replyingToId}
          replyingToUsername={replyingToUsername}
          friendsList={friendsList}
          showMentionDropdown={showMentionDropdown}
          mentionQuery={mentionQuery}
          commentInputRef={commentInputRef}
          onCommentInputChange={handleCommentInputChange}
          onSelectMentionFriend={selectMentionFriend}
          onCommentSubmit={handleCommentSubmit}
          onCancelReply={cancelReply}
          onReplyClick={handleReplyClick}
          onCommentLike={handleCommentLike}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          post={post}
          shareContent={shareContent}
          setShareContent={setShareContent}
          isSharing={isSharing}
          onSubmit={handleShareSubmit}
        />
      )}
    </div>
  );
}
