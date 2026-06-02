// components/PostCard.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

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

  const [showComments, setShowComments] = useState(false); 
  const [comments, setComments] = useState<any[]>([]); 
  const [newComment, setNewComment] = useState(''); 
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editContent, setEditContent] = useState(post.content || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/posts/${post.id}/comments`, {
        content: newComment
      });

      // Reload comments list from server to get accurate username/avatar
      const commentsRes = await api.get(`/posts/${post.id}/comments`);
      setComments(commentsRes.data);
      setNewComment('');
      
      // Update comment count on post if callback is available
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
      alert("Không thể gửi bình luận lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      alert("Xóa bài viết thành công!");
      if (onPostDeleted) {
        onPostDeleted();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Lỗi xóa bài viết:", err);
      alert(err.response?.data?.detail || "Xóa bài viết thất bại.");
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
      alert("Cập nhật bài viết thành công!");
      if (onPostUpdated) {
        onPostUpdated();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Lỗi sửa bài viết:", err);
      alert(err.response?.data?.detail || "Cập nhật thất bại.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const isOwner = currentUserId !== null && (post.owner_id === currentUserId || post.owner?.id === currentUserId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-4 md:p-5 relative">
      
      {/* Header section */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <Link href={`/profile/${post.owner_id || post.owner?.id}`} className="flex items-center gap-3 group">
          {post.owner?.avatar_url ? (
            <img 
              src={post.owner.avatar_url} 
              alt={post.owner.username} 
              className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm group-hover:brightness-95 transition-all"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-white flex items-center justify-center font-bold shadow-sm group-hover:opacity-90 transition-opacity">
              {(post.owner?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          
          <div>
            <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-[15px] flex items-center gap-1.5">
              {post.owner?.username || `User #${post.owner_id}`}
              {isOwner && (
                <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100">Bạn</span>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>{formatDate(post.created_at)}</span>
              <span>•</span>
              <span title="Công khai">🌎</span>
            </div>
          </div>
        </Link>

        {/* Options Menu for Owner */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center focus:outline-none transition-colors"
            >
              •••
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1.5 z-40">
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2"
                >
                  ✏️ Chỉnh sửa bài viết
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2"
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
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            placeholder="Tiêu đề bài viết..."
            required
          />
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            placeholder="Nội dung bài viết..."
            required
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSavingEdit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400"
            >
              {isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      ) : (
        /* Regular View */
        <>
          {post.title && <h3 className="font-bold text-gray-900 mb-1 text-[16px]">{post.title}</h3>}
          <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

          {/* Post attachment image */}
          {post.image_url && (
            <div className="w-[calc(100%+2rem)] -mx-4 md:w-[calc(100%+2.5rem)] md:-mx-5 border-y border-gray-100 overflow-hidden mb-3.5 bg-gray-50 flex justify-center max-h-[500px]">
              <img 
                src={post.image_url} 
                alt="Đính kèm" 
                className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          )}
        </>
      )}

      {/* Stats counter */}
      <div className="flex items-center justify-between text-xs text-gray-500 pb-3 border-b border-gray-100 mb-2 px-1">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <>
              <span className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full text-white text-[9px] font-bold shadow-sm">👍</span>
              <span className="font-medium">{likeCount} lượt thích</span>
            </>
          )}
        </div>
        <div className="cursor-pointer hover:underline" onClick={toggleComments}>
          {post.comments_count ?? comments.length} bình luận
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around border-b border-gray-100 pb-1.5 mb-2.5">
        <button 
          onClick={handleLike}
          disabled={isLoadingLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none ${
            isLiked 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-lg">{isLiked ? '👍' : '👍'}</span>
          <span>Thích</span>
        </button>

        <button 
          onClick={toggleComments}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none ${
            showComments 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-lg">💬</span>
          <span>Bình luận</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3.5 pt-1.5 animate-in fade-in duration-200">
          
          {/* Create comment form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            {post.owner?.avatar_url ? (
              <img 
                src={post.owner.avatar_url} 
                alt="My avatar" 
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                ME
              </div>
            )}
            <div className="flex-1 flex bg-gray-100 rounded-full items-center px-3 py-1 focus-within:ring-2 focus-within:ring-blue-400">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận công khai..."
                className="flex-1 bg-transparent border-0 text-sm focus:outline-none py-1 placeholder-gray-500"
                required
              />
              <button 
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors disabled:opacity-30 focus:outline-none text-xs px-2"
              >
                {isSubmitting ? "Gửi..." : "Đăng"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-1.5">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</div>
          ) : (
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {comments.map((comment, idx) => (
                <div key={comment.id || idx} className="flex gap-2.5 items-start">
                  <Link href={`/profile/${comment.userId || comment.owner?.id}`} className="flex-shrink-0">
                    {comment.owner?.avatar_url ? (
                      <img 
                        src={comment.owner.avatar_url} 
                        alt={comment.owner.username} 
                        className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {(comment.owner?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <div className="bg-gray-100 px-3.5 py-2 rounded-2xl rounded-tl-none inline-block max-w-[90%] shadow-sm">
                      <Link 
                        href={`/profile/${comment.userId || comment.owner?.id}`}
                        className="font-bold text-xs text-gray-900 hover:underline block mb-0.5"
                      >
                         {comment.owner?.username || `User #${comment.userId}`}
                      </Link>
                      <span className="text-[13px] text-gray-800 leading-snug whitespace-pre-wrap">{comment.content}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 ml-3.5 mt-1">
                      <span>Thích</span> • <span>Phản hồi</span> • <span>Vừa xong</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}