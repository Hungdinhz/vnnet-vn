// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';

export default function Home() {
  const router = useRouter();
  
  // State quản lý danh sách bài viết
  const [posts, setPosts] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý Form đăng bài mới
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Hàm tải bài viết (được tách ra để có thể gọi lại sau khi đăng bài xong)
  const fetchPosts = async () => {
    try {
      // TÙY CHỈNH: Đảm bảo đường dẫn này khớp với API lấy danh sách post của bạn
      const response = await api.get('/posts'); 
      setPosts(response.data); 
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPosts();
  }, [router]);

  // Hàm xử lý Đăng bài
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      // TÙY CHỈNH: Thay đổi URL nếu endpoint tạo bài viết của bạn khác
      await api.post('/posts', {
        title: newTitle,
        content: newContent
      });

      // Nếu thành công: Xóa rỗng form và gọi lại API để load bài viết mới nhất
      setNewTitle('');
      setNewContent('');
      fetchPosts(); 

    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert("Đăng bài thất bại, vui lòng thử lại!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Bảng tin 🚀</h1>

          {/* KHU VỰC ĐĂNG BÀI MỚI */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <input
                type="text"
                placeholder="Tiêu đề bài viết..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
              <textarea
                placeholder="Hôm nay bạn nghĩ gì?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPosting}
                  className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors ${
                    isPosting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>

          {/* KHU VỰC HIỂN THỊ DANH SÁCH BÀI VIẾT */}
          {isLoading ? (
            <div className="flex justify-center items-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-center text-gray-500 bg-white p-6 rounded-xl border shadow-sm">
                  Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!
                </p>
              ) : (
                // Đảo ngược mảng để bài viết mới nhất lên đầu (nếu Backend chưa sắp xếp)
                [...posts].reverse().map((post, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-sm">
                        {/* Lấy chữ cái đầu của tên làm Avatar */}
                        {(post.owner?.username || post.author_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {/* TÙY CHỈNH: Sửa lại tên trường chứa Username dựa theo cấu trúc API của bạn */}
                        <div className="font-bold text-gray-800">
                          {post.owner?.username || post.author_name || `User #${post.owner_id}`}
                        </div>
                        <div className="text-xs text-gray-500">Vừa xong</div>
                      </div>
                    </div>
                    
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h2>
                    <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}