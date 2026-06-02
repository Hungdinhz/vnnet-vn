// app/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';

export default function ProfilePage() {
  const { id } = useParams(); // Lấy cái ID trên đường dẫn (ví dụ: /profile/2 thì id = 2)
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Gọi API lấy thông tin của người dùng có id này
    const fetchProfile = async () => {
      try {
        // TÙY CHỈNH: Đảm bảo FastAPI có API GET /users/{id}
        const response = await api.get(`/users/${id}`);
        setProfileData(response.data);
      } catch (error) {
        console.error("Lỗi khi tải trang cá nhân:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, router]);

  // Hàm xử lý gửi lời mời kết bạn
  const handleAddFriend = async () => {
    try {
      // Gọi API thêm bạn bè vào bảng friendships
      await api.post(`/friends/request/${id}`);
      alert(`Đã gửi lời mời kết bạn đến ${profileData?.username}!`);
    } catch (error: any) {
      console.error("Lỗi kết bạn:", error);
      alert(error.response?.data?.detail || "Không thể gửi lời mời lúc này.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 p-6 max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center mt-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !profileData ? (
            <div className="text-center text-gray-500 mt-20">Không tìm thấy người dùng này.</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Ảnh bìa (Cover Photo) */}
              <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              {/* Phần thông tin User */}
              <div className="px-8 pb-8 relative">
                {/* Avatar */}
                <div className="absolute -top-16 w-32 h-32 bg-white rounded-full p-1 shadow-lg">
                  <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-5xl font-bold text-blue-600">
                    {(profileData.username || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="pt-20 flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profileData.username}</h1>
                    <p className="text-gray-500 mt-1">{profileData.email}</p>
                  </div>
                  
                  {/* Nút Thêm bạn bè */}
                  <button 
                    onClick={handleAddFriend}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    👋 Thêm bạn bè
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}