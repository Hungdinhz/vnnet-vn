// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import PostCard from '@/components/PostCard';

export default function Home() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts'); 
      setPosts(response.data); 
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const res = await api.get('/users');
      // Lọc bỏ user hiện tại nếu có
      if (currentUser) {
        setSuggestedUsers((res.data || []).filter((u: any) => u.id !== currentUser.id).slice(0, 5));
      } else {
        setSuggestedUsers((res.data || []).slice(0, 5));
      }
    } catch (err) {
      console.error("Lỗi tải gợi ý bạn bè:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi tải self user:", err);
      }
    };

    fetchMe();
    fetchPosts();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchSuggestedUsers();
    }
  }, [currentUser]);

  // Handle image preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsPosting(true);
    try {
      let uploadedImageUrl = null;

      // Step 1: Upload image to Cloudinary if file exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      // Step 2: Create post
      await api.post('/posts', {
        title: newTitle || "Bài viết mới",
        content: newContent,
        image_url: uploadedImageUrl 
      });

      // Clear form
      setNewTitle('');
      setNewContent('');
      setFile(null);
      setImagePreview(null);
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchPosts(); 
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert("Đăng bài thất bại, vui lòng thử lại!");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.post(`/friends/request/${friendId}`);
      alert('Đã gửi lời mời kết bạn!');
      setSuggestedUsers(prev => prev.filter(u => u.id !== friendId));
    } catch (err: any) {
      console.error("Lỗi kết bạn:", err);
      alert(err.response?.data?.detail || "Gửi lời mời thất bại");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Center: News Feed */}
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto">
          
          {/* Post publisher (Facebook Style "What's on your mind?") */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
            <div className="flex gap-3 items-center mb-3">
              {currentUser?.avatar_url ? (
                <img 
                  src={currentUser.avatar_url} 
                  alt={currentUser.username} 
                  className="w-10 h-10 rounded-full object-cover border"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold">
                  {getInitials(currentUser?.username)}
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  {currentUser?.username || "Người dùng"}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>🌎 Công khai</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <input
                type="text"
                placeholder="Tiêu đề bài viết (tùy chọn)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
              />
              <textarea
                placeholder={`${currentUser?.username ? currentUser.username : "Hùng"} ơi, bạn đang nghĩ gì thế?`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[15px] placeholder-gray-500"
                required
              />

              {/* Image attachment preview */}
              {imagePreview && (
                <div className="relative border border-gray-100 rounded-lg overflow-hidden max-h-[300px] bg-gray-50 flex justify-center">
                  <img src={imagePreview} alt="Preview" className="max-w-full h-auto object-contain max-h-[300px]" />
                  <button 
                    type="button"
                    onClick={() => { setFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm focus:outline-none transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <hr className="border-gray-100" />
              
              <div className="flex items-center justify-between">
                {/* Photo attachment icon button */}
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors text-gray-600">
                  <span className="text-xl">🖼️</span>
                  <span className="text-sm font-semibold">Ảnh/Video</span>
                  <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isPosting || !newContent.trim()}
                  className={`px-8 py-2 rounded-lg text-white font-bold text-sm shadow-sm transition-all ${
                    isPosting || !newContent.trim()
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                  }`}
                >
                  {isPosting ? 'Đang đăng...' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed container */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center text-gray-500 bg-white p-10 rounded-xl border shadow-sm">
                  <div className="text-3xl mb-2">📰</div>
                  <p className="font-semibold text-gray-800">Chưa có bài viết nào.</p>
                  <p className="text-sm text-gray-500 mt-1">Hãy bắt đầu chia sẻ câu chuyện đầu tiên!</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <PostCard 
                    key={post.id || index} 
                    post={post} 
                    onPostDeleted={fetchPosts}
                    onPostUpdated={fetchPosts}
                  /> 
                ))
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar: Suggestions & Sponsored */}
        <aside className="w-72 hidden lg:block py-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {/* Sponsored card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Được tài trợ</h4>
            <div className="flex gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors cursor-pointer">
              <div className="w-24 h-16 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-700 text-xs text-center p-1 border">
                Spring Boot Core
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <span className="font-semibold text-xs text-gray-900 leading-tight">Khóa học Java Spring Boot thực chiến</span>
                <span className="text-[10px] text-gray-500 mt-0.5">vnnet.academy</span>
              </div>
            </div>
          </div>

          {/* Suggestions block */}
          {suggestedUsers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người bạn có thể biết</h4>
                <Link href="/friends" className="text-xs text-blue-600 hover:underline font-semibold">Xem tất cả</Link>
              </div>

              <div className="space-y-3.5">
                {suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="flex items-center justify-between gap-2">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 group">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.username} 
                          className="w-9 h-9 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-200 transition-colors">
                          {getInitials(user.username)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-xs text-gray-900 group-hover:underline max-w-[110px] truncate">{user.username}</div>
                        <div className="text-[9px] text-gray-500 truncate max-w-[110px]">{user.email}</div>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-semibold text-[11px] rounded-full transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>➕</span> Kết bạn
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}