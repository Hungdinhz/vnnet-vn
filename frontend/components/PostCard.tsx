// components/PostCard.tsx
"use client";

import { useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

interface PostProps {
  post: any;
}

const formatDate = (dateString: string) => {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(date);
};

export default function PostCard({ post }: PostProps) {
  //console.log(post)
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  const [showComments, setShowComments] = useState(false); 
  const [comments, setComments] = useState<any[]>([]); 
  const [newComment, setNewComment] = useState(''); 
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (isLoadingLike) return;
    setIsLoadingLike(true);
    try {
      await api.post(`/posts/${post.id}/like`);
      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev: number) => prev - 1);
      } else {
        setIsLiked(true);
        setLikeCount((prev: number) => prev + 1);
      }
    } catch (error: any) {
      console.error("Lỗi khi thả tim:", error);
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

      const createdComment = response.data.id ? response.data : {
        id: Date.now(),
        content: newComment,
        user_id: "Tôi", 
      };

      setComments([...comments, createdComment]); 
      setNewComment(''); 
    } catch (error) {
      console.error("Lỗi khi gửi bình luận:", error);
      alert("Không thể gửi bình luận lúc này!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/profile/${post.owner_id || post.owner?.id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-sm group-hover:opacity-80 transition-opacity">
            {(post.owner?.username || 'U').charAt(0).toUpperCase()}
          </div>
          
          <div>
            <div className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              {post.owner?.username || `User #${post.owner_id}`}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(post.created_at)} 
            </div>
          </div>
        </Link>
      </div>
      
      <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
      <p className="text-gray-700 whitespace-pre-line mb-4">{post.content}</p>

      {/* TÍNH NĂNG MỚI: HIỂN THỊ ẢNH NẾU BÀI VIẾT CÓ URL ẢNH */}
      {post.image_url && (
        <img 
          src={post.image_url} 
          alt="Post attachment" 
          className="w-full h-auto rounded-lg mb-4 object-cover border border-gray-100 max-h-[500px]"
        />
      )}

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
        <button 
          onClick={handleLike}
          disabled={isLoadingLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            isLiked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {isLiked ? '❤️' : '🤍'} 
          <span>{likeCount} Thích</span>
        </button>

        <button 
          onClick={toggleComments}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            showComments ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          💬 <span>{post.comments_count ?? 0} Bình luận</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
            <button 
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              Gửi
            </button>
          </form>

          {isLoadingComments ? (
            <div className="text-center text-sm text-gray-500 py-2">Đang tải bình luận...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-2">Chưa có bình luận nào.</div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-600">
                    {(comment.owner?.username || comment.user_id || 'U').toString().charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-gray-50 px-4 py-2 rounded-2xl rounded-tl-none border border-gray-100 max-w-[85%]">
                    <span className="font-semibold text-sm text-gray-800 block mb-0.5">
                       {comment.owner?.username || `User #${comment.user_id}`}
                    </span>
                    <span className="text-sm text-gray-700">{comment.content}</span>
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