// components/PostCard.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface PostProps {
  post: any;
  onPostDeleted?: () => void;
  onPostUpdated?: () => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Vừa xong";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    }).format(date);
  } catch (e) {
    return "Đăng gần đây";
  }
};

export default function PostCard({ post, onPostDeleted, onPostUpdated }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const [showComments, setShowComments] = useState(false); 
  const [comments, setComments] = useState<any[]>([]); 
  const [newComment, setNewComment] = useState(''); 
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for replying to a comment
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyingToUsername, setReplyingToUsername] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSharing(true);
    try {
      await api.post('/posts', {
        title: `Đã chia sẻ bài viết của ${post.owner?.username || 'một người dùng'}`,
        content: shareContent || "Hãy xem bài viết này!",
        shared_post_id: post.id
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

  // Fetch self user ID to determine permissions
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

  // Close card menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (isLoadingLike) return;
    setIsLoadingLike(true);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    try {
      await api.post(`/posts/${post.id}/like`);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev: number) => Math.max(0, prev - 1));
      } else {
        setIsLiked(true);
        setLikeCount((prev: number) => prev + 1);
      }
    } catch (error: any) {
      console.error("Lỗi khi like bài viết:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCommentLike = async (commentId: number, currentLiked: boolean) => {
    try {
      await api.post(`/posts/${post.id}/comments/${commentId}/like`);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            is_liked: !currentLiked,
            likes_count: currentLiked ? Math.max(0, (c.likes_count || 0) - 1) : (c.likes_count || 0) + 1
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Lỗi khi like bình luận:", err);
    }
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
  };

  const handleReplyClick = (commentId: number, username: string) => {
    setReplyingToId(commentId);
    setReplyingToUsername(username);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyingToUsername(null);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/posts/${post.id}/comments`, {
        content: newComment,
        parent_id: replyingToId
      });

      // Reload comments
      const commentsRes = await api.get(`/posts/${post.id}/comments`);
      setComments(commentsRes.data);
      setNewComment('');
      cancelReply();
      
      // Update comment count on post if callback is available
      if (onPostUpdated) onPostUpdated();
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
        content: editContent
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

  const isOwner = currentUserId !== null && (post.owner_id === currentUserId || post.owner?.id === currentUserId);

  return (
    <div className="glass-card glass-card-hover rounded-xl p-4 md:p-5 relative transition-all duration-300 animate-slide-up">
      
      {/* Header section */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <Link href={`/profile/${post.owner_id || post.owner?.id}`} className="flex items-center gap-3 group">
          {post.owner?.avatar_url ? (
            <img 
              src={post.owner.avatar_url} 
              alt={post.owner.username} 
              className="w-10 h-10 rounded-full object-cover avatar-glow group-hover:brightness-110 transition-all"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold shadow-lg group-hover:shadow-purple-500/30 transition-shadow">
              {(post.owner?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <div className="font-bold text-foreground group-hover:text-accent-purple transition-colors text-[15px] flex items-center gap-1.5">
              {post.owner?.username || `User #${post.owner_id}`}
              {isOwner && (
                <span className="text-[10px] bg-purple-500/20 text-accent-purple font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">Bạn</span>
              )}
            </div>
            <div className="text-xs text-muted/50 flex items-center gap-1">
              <span>{formatDate(post.created_at)}</span>
              <span>•</span>
              <span title="Công khai">🌏</span>
            </div>
          </div>
        </Link>

        {/* Options Menu for Owner */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 text-muted/60 flex items-center justify-center focus:outline-none transition-colors"
            >
              •••
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 glass-card rounded-lg py-1.5 z-40 animate-slide-up">
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 text-secondary text-sm font-medium flex items-center gap-2"
                >
                  ✏️ Chỉnh sửa bài viết
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400 text-sm font-medium flex items-center gap-2"
                >
                  🗑️ Xóa bài viết
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editing View */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-3 mb-4">
          <input 
            type="text" 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-1.5 input-anime rounded-lg text-sm font-semibold"
            placeholder="Tiêu đề bài viết..."
            required
          />
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-1.5 input-anime rounded-lg text-sm resize-none"
            placeholder="Nội dung bài viết..."
            required
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 text-xs font-semibold text-muted/60 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSavingEdit}
              className="px-4 py-1.5 text-xs font-semibold btn-anime rounded-lg"
            >
              {isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      ) : (
        /* Regular View */
        <>
          {post.title && <h3 className="font-bold text-foreground mb-1 text-[16px]">{post.title}</h3>}
          <p className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

          {/* Post attachment image */}
          {post.image_url && (
            <div className="w-[calc(100%+2rem)] -mx-4 md:w-[calc(100%+2.5rem)] md:-mx-5 border-y border-purple-500/10 overflow-hidden mb-3.5 bg-black/20 flex justify-center max-h-[500px]">
              <img 
                src={post.image_url} 
                alt="Đính kèm" 
                className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          )}

          {/* Shared Post Container */}
          {post.shared_post && (
            <div className="border border-purple-500/15 rounded-xl p-3 mb-3 bg-white/[0.02]">
              <Link href={`/profile/${post.shared_post.owner?.id}`} className="flex items-center gap-2 mb-2 group">
                {post.shared_post.owner?.avatar_url ? (
                  <img 
                    src={post.shared_post.owner.avatar_url} 
                    alt={post.shared_post.owner.username} 
                    className="w-6 h-6 rounded-full object-cover border border-purple-500/20"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full flex items-center justify-center font-bold text-[10px] text-secondary">
                    {(post.shared_post.owner?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-[13px] text-secondary group-hover:underline">
                    {post.shared_post.owner?.username}
                  </span>
                  <span className="text-[10px] text-muted/40 ml-2">{formatDate(post.shared_post.created_at)}</span>
                </div>
              </Link>
              {post.shared_post.title && <h4 className="font-semibold text-[14px] text-foreground mb-1">{post.shared_post.title}</h4>}
              <p className="text-[13px] text-secondary/60 line-clamp-3 mb-2">{post.shared_post.content}</p>
              {post.shared_post.image_url && (
                <div className="rounded-lg overflow-hidden border border-purple-500/10">
                  <img src={post.shared_post.image_url} className="w-full max-h-[300px] object-cover" alt="Shared attachment" />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Stats counter */}
      <div className="flex items-center justify-between text-xs text-muted/50 pb-3 border-b border-purple-500/10 mb-2 px-1">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <>
              <span className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full text-white text-[10px] font-bold shadow-sm">❤️</span>
              <span className="font-medium text-pink-300/70">{likeCount} lượt thích</span>
            </>
          )}
        </div>
        <div className="cursor-pointer hover:underline hover:text-accent-purple transition-colors" onClick={toggleComments}>
          {post.comments_count ?? comments.length} bình luận
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around border-b border-purple-500/10 pb-1.5 mb-2.5">
        <button 
          onClick={handleLike}
          disabled={isLoadingLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none ${
            isLiked 
              ? 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20' 
              : 'text-accent-purple/60 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-secondary'
          }`}
        >
          <span className={`text-lg ${likeAnimating ? 'animate-heart-pop' : ''}`}>{isLiked ? '❤️' : '🤍'}</span>
          <span>Thích</span>
        </button>

        <button 
          onClick={toggleComments}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none ${
            showComments 
              ? 'text-accent-purple bg-purple-500/10 hover:bg-purple-500/20' 
              : 'text-accent-purple/60 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-secondary'
          }`}
        >
          <span className="text-lg">💬</span>
          <span>Bình luận</span>
        </button>

        {!isOwner && (
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none text-accent-purple/60 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-secondary"
          >
            <span className="text-lg">↪️</span>
            <span>Chia sẻ</span>
          </button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3.5 pt-1.5 animate-slide-up">
          
          {/* Create comment form */}
          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2">
            {replyingToId && (
              <div className="text-[11px] text-muted/50 flex items-center gap-1 ml-10">
                <span>Đang trả lời <b className="text-accent-purple">{replyingToUsername}</b></span>
                <button type="button" onClick={cancelReply} className="text-pink-400 hover:underline">Hủy</button>
              </div>
            )}
            <div className="flex gap-2">
              {post.owner?.avatar_url ? (
                <img 
                  src={post.owner.avatar_url} 
                  alt="My avatar" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 avatar-glow"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full text-secondary flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ME
                </div>
              )}
              <div className="flex-1 flex input-anime rounded-2xl items-center px-3 py-1.5">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingToId ? `Phản hồi ${replyingToUsername}...` : "Viết bình luận..."}
                  className="flex-1 bg-transparent border-0 text-[13px] focus:outline-none py-1 placeholder-purple-500/40 text-foreground"
                  required
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="text-muted font-bold hover:text-pink-400 transition-colors disabled:opacity-30 focus:outline-none text-xs px-2"
                >
                  {isSubmitting ? "Gửi..." : "Đăng"}
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-xs text-muted/40 py-1.5">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
          ) : (
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {comments.filter(c => !c.parent_id).map((comment) => (
                <div key={comment.id} className="space-y-2">
                  {/* Top-level comment */}
                  <div className="flex gap-2.5 items-start">
                    <Link href={`/profile/${comment.userId || comment.owner?.id}`} className="flex-shrink-0">
                      {comment.owner?.avatar_url ? (
                        <img 
                          src={comment.owner.avatar_url} 
                          alt={comment.owner.username} 
                          className="w-8 h-8 rounded-full object-cover border border-purple-500/20 shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-accent-purple">
                          {(comment.owner?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="bg-white/[0.05] px-3.5 py-2 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-sm relative group border border-purple-500/10">
                        <Link 
                          href={`/profile/${comment.userId || comment.owner?.id}`}
                          className="font-bold text-[13px] text-secondary hover:underline block mb-0.5"
                        >
                           {comment.owner?.username || `User #${comment.userId}`}
                        </Link>
                        <span className="text-[13px] text-foreground/70 leading-snug whitespace-pre-wrap">{comment.content}</span>
                        
                        {/* Comment like count floating bubble */}
                        {comment.likes_count > 0 && (
                          <div className="absolute -bottom-2 -right-2 bg-background px-1.5 py-0.5 rounded-full border border-purple-500/20 shadow-sm flex items-center gap-1 text-[10px] text-pink-300/70">
                            <span>❤️</span>
                            <span>{comment.likes_count}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-muted/40 ml-3.5 mt-1 flex gap-3">
                        <button 
                          onClick={() => handleCommentLike(comment.id, comment.is_liked)}
                          className={`hover:underline ${comment.is_liked ? 'text-pink-400' : ''}`}
                        >
                          Thích
                        </button>
                        <button 
                          onClick={() => handleReplyClick(comment.id, comment.owner?.username)}
                          className="hover:underline"
                        >
                          Phản hồi
                        </button>
                        <span className="font-normal">Vừa xong</span>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comments.filter(c => c.parent_id === comment.id).map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 items-start ml-10 mt-2">
                      <Link href={`/profile/${reply.userId || reply.owner?.id}`} className="flex-shrink-0">
                        {reply.owner?.avatar_url ? (
                          <img 
                            src={reply.owner.avatar_url} 
                            alt={reply.owner.username} 
                            className="w-7 h-7 rounded-full object-cover border border-purple-500/20 shadow-sm"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-accent-purple">
                            {(reply.owner?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <div className="bg-white/[0.05] px-3 py-1.5 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-sm relative group border border-purple-500/10">
                          <Link 
                            href={`/profile/${reply.userId || reply.owner?.id}`}
                            className="font-bold text-[12px] text-secondary hover:underline block mb-0.5"
                          >
                             {reply.owner?.username || `User #${reply.userId}`}
                          </Link>
                          <span className="text-[12px] text-foreground/70 leading-snug whitespace-pre-wrap">{reply.content}</span>
                          
                          {reply.likes_count > 0 && (
                            <div className="absolute -bottom-2 -right-2 bg-background px-1.5 py-0.5 rounded-full border border-purple-500/20 shadow-sm flex items-center gap-1 text-[9px] text-pink-300/70">
                              <span>❤️</span>
                              <span>{reply.likes_count}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-semibold text-muted/40 ml-3.5 mt-1 flex gap-3">
                          <button 
                            onClick={() => handleCommentLike(reply.id, reply.is_liked)}
                            className={`hover:underline ${reply.is_liked ? 'text-pink-400' : ''}`}
                          >
                            Thích
                          </button>
                          <button 
                            onClick={() => handleReplyClick(comment.id, reply.owner?.username)}
                            className="hover:underline"
                          >
                            Phản hồi
                          </button>
                          <span className="font-normal">Vừa xong</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="border-b border-purple-500/10 px-4 py-3 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold text-foreground">Chia sẻ bài viết</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 flex items-center justify-center text-muted/60 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-4">
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Hãy nói gì đó về bài viết này..."
                className="w-full px-3 py-2 input-anime rounded-lg resize-none text-sm mb-4"
                rows={3}
              />
              
              {/* Preview of the shared post */}
              <div className="border border-purple-500/10 rounded-lg p-3 bg-white/[0.02] opacity-80 pointer-events-none mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-[13px] text-secondary">{post.owner?.username}</div>
                </div>
                {post.title && <h4 className="font-semibold text-[13px] text-foreground mb-1">{post.title}</h4>}
                <p className="text-[12px] text-accent-purple/50 line-clamp-2">{post.content}</p>
              </div>

              <button
                type="submit"
                disabled={isSharing}
                className="w-full py-2 btn-anime rounded-lg text-sm shadow-sm"
              >
                {isSharing ? "Đang chia sẻ..." : "✨ Chia sẻ ngay"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
