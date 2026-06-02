// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import PostCard from '@/components/PostCard';

export default function Home() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null); // Thêm state lưu file
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPosts();
  }, [router]);

  // Hàm xử lý Đăng bài MỚI (Có hỗ trợ ảnh)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    // THÊM DÒNG NÀY ĐỂ CHECK XEM REACT CÓ NHẬN ĐƯỢC FILE KHÔNG
    console.log("File đang được chọn là:", file);
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsPosting(true);
    try {
      let uploadedImageUrl = null;

      // Bước 1: Upload ảnh trước nếu người dùng có chọn file
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        // --- ĐẶT BẪY Ở ĐÂY ---
        console.log("Toàn bộ dữ liệu Upload trả về:", uploadRes);
        
        // Đề phòng trường hợp file axios.ts của em đã cấu hình tự động trích xuất data
        // Chỉ cần lấy đúng từ trong data ra là TypeScript sẽ im lặng
          uploadedImageUrl = uploadRes.data.url;
        
        console.log("Link ảnh bóc tách được:", uploadedImageUrl);
      }

      // Bước 2: Tạo bài viết với link ảnh
      await api.post('/posts', {
        title: newTitle,
        content: newContent,
        image_url: uploadedImageUrl // Thêm trường này
      });

      // Nếu thành công: Xóa rỗng form
      setNewTitle('');
      setNewContent('');
      setFile(null);
      // Hack nhỏ: Đặt lại giá trị của input file
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
              
              {/* KHU VỰC CHỌN ẢNH */}
              <div className="flex items-center justify-between">
                <input 
                  id="file-upload"
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                <button
                  type="submit"
                  disabled={isPosting}
                  className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors whitespace-nowrap ml-4 ${
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
                [...posts].map((post, index) => (
                  <PostCard key={post.id || index} post={post} /> 
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}