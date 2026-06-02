// app/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import PostCard from '@/components/PostCard';

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // States for Editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setProfileData(response.data);
      setNewBio(response.data.bio || '');
    } catch (error) {
      console.error("Lỗi khi tải thông tin trang cá nhân:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await api.get(`/posts/user/${id}`);
      setPosts(response.data || []);
    } catch (error) {
      console.error("Lỗi khi tải bài viết của user:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load current user context
    const fetchSelf = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUserId(res.data.id);
      } catch (err) {
        console.error("Lỗi tải self user:", err);
      }
    };

    fetchSelf();
    fetchProfile();
    fetchUserPosts();
  }, [id, router]);

  const handleAddFriend = async () => {
    try {
      await api.post(`/friends/request/${id}`);
      alert(`Đã gửi lời mời kết bạn đến ${profileData?.username}!`);
    } catch (error: any) {
      console.error("Lỗi kết bạn:", error);
      alert(error.response?.data?.detail || "Không thể gửi lời mời kết bạn.");
    }
  };

  const handleSaveBio = async () => {
    if (isSavingBio) return;
    setIsSavingBio(true);
    try {
      const res = await api.put('/users/me', {
        bio: newBio
      });
      setProfileData(res.data);
      setIsEditingBio(false);
      alert("Cập nhật tiểu sử thành công!");
    } catch (err: any) {
      console.error("Lỗi cập nhật tiểu sử:", err);
      alert(err.response?.data?.detail || "Cập nhật tiểu sử thất bại.");
    } finally {
      setIsSavingBio(false);
    }
  };

  // Upload Avatar image
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // Step 1: Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = uploadRes.data.url;

      // Step 2: Save URL to profile
      const res = await api.put('/users/me', {
        avatar_url: url
      });
      setProfileData(res.data);
      alert("Đã cập nhật ảnh đại diện thành công!");
      // Reload window to update all elements like Navbar / Sidebar
      window.location.reload();
    } catch (err) {
      console.error("Lỗi cập nhật ảnh đại diện:", err);
      alert("Cập nhật ảnh đại diện thất bại!");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Upload Cover image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setIsUploadingCover(true);
    try {
      // Step 1: Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const url = uploadRes.data.url;

      // Step 2: Save URL to profile
      const res = await api.put('/users/me', {
        cover_url: url
      });
      setProfileData(res.data);
      alert("Đã cập nhật ảnh bìa thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật ảnh bìa:", err);
      alert("Cập nhật ảnh bìa thất bại!");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const isOwnProfile = currentUserId !== null && Number(id) === currentUserId;
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        <main className="flex-1 p-0 md:p-4 max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center mt-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !profileData ? (
            <div className="text-center text-gray-500 mt-20 font-semibold bg-white p-10 rounded-xl border">
              Không tìm thấy người dùng này hoặc tài khoản đã bị khóa.
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Profile Card Header (Facebook style cover & avatar overlap) */}
              <div className="bg-white rounded-b-xl border-x border-b border-gray-200 shadow-sm overflow-hidden">
                
                {/* Cover Image */}
                <div className="h-64 md:h-80 bg-gradient-to-r from-blue-500 to-indigo-600 relative group">
                  {profileData.cover_url ? (
                    <img 
                      src={profileData.cover_url} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />
                  )}

                  {/* Upload Cover Photo Button (Owner only) */}
                  {isOwnProfile && (
                    <label className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-lg shadow-md cursor-pointer transition-colors flex items-center gap-1.5 border">
                      📷 {isUploadingCover ? "Đang tải lên..." : "Chỉnh sửa ảnh bìa"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCoverUpload}
                        className="hidden" 
                        disabled={isUploadingCover}
                      />
                    </label>
                  )}
                </div>

                {/* Overlap Layout Section */}
                <div className="px-6 pb-6 relative">
                  <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-10 gap-4 mb-4">
                    
                    {/* Avatar Container */}
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
                      <div className="relative w-36 h-36 md:w-40 md:h-40 bg-white rounded-full p-1.5 shadow-xl flex-shrink-0 group">
                        {profileData.avatar_url ? (
                          <img 
                            src={profileData.avatar_url} 
                            alt={profileData.username} 
                            className="w-full h-full bg-blue-100 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-6xl font-bold text-white shadow-inner">
                            {getInitials(profileData.username)}
                          </div>
                        )}

                        {/* Upload Avatar Overlay (Owner only) */}
                        {isOwnProfile && (
                          <label className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white text-xs font-bold gap-1 border-4 border-white">
                            <span>📷</span>
                            <span>{isUploadingAvatar ? "Đang tải..." : "Cập nhật"}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleAvatarUpload}
                              className="hidden" 
                              disabled={isUploadingAvatar}
                            />
                          </label>
                        )}
                      </div>

                      {/* User title */}
                      <div className="md:mb-3">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{profileData.username}</h1>
                        <p className="text-sm font-semibold text-gray-500 mt-0.5">{profileData.email}</p>
                      </div>
                    </div>

                    {/* Friend request buttons */}
                    <div className="md:mb-4">
                      {isOwnProfile ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setIsEditingBio(!isEditingBio)}
                            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors text-sm shadow-sm flex items-center gap-1.5 border"
                          >
                            ✏️ {isEditingBio ? "Đóng chỉnh sửa" : "Chỉnh sửa tiểu sử"}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={handleAddFriend}
                          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md text-sm border-b-2 border-blue-800"
                        >
                          👋 Thêm bạn bè
                        </button>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-100 my-4" />

                  {/* Bio Description Area */}
                  <div className="max-w-2xl">
                    {isEditingBio ? (
                      <div className="space-y-2">
                        <textarea 
                          value={newBio}
                          onChange={(e) => setNewBio(e.target.value)}
                          placeholder="Viết một lời giới thiệu ngắn về bản thân..."
                          maxLength={150}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setIsEditingBio(false)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                          >
                            {isSavingBio ? "Đang lưu..." : "Lưu"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center md:text-left">
                        {profileData.bio ? (
                          <div className="text-sm font-medium text-gray-700 bg-gray-50 px-4 py-3 rounded-lg border inline-block leading-relaxed">
                            💡 {profileData.bio}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">Chưa có tiểu sử nào được thiết lập.</div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Layout splits into two columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                
                {/* Left column: User intro card */}
                <div className="md:col-span-4 space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-[17px] mb-3">Giới thiệu</h3>
                    <div className="space-y-3.5 text-[14px]">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <span>📧</span>
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <span>🎂</span>
                        <span>Tham gia vào tháng 6, 2026</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <span>🔒</span>
                        <span>Tài khoản chính thức</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual placeholder card for photos */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-900 text-[17px]">Ảnh</h3>
                      <button className="text-xs text-blue-600 hover:underline font-semibold">Xem tất cả ảnh</button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {posts.filter(p => p.image_url).slice(0, 6).map((post, idx) => (
                        <div key={post.id || idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                          <img src={post.image_url} alt="Grid photo" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                      {posts.filter(p => p.image_url).length === 0 && (
                        <div className="col-span-full py-6 text-center text-xs text-gray-400">Không có ảnh nào.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column: User posts feed */}
                <div className="md:col-span-8 space-y-4">
                  
                  {/* Feed Section Title */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-[17px]">Bài viết</h3>
                    <div className="flex gap-2">
                      <button className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                        ⚙️ Bộ lọc
                      </button>
                    </div>
                  </div>

                  {/* List of user posts */}
                  {isLoadingPosts ? (
                    <div className="flex justify-center py-12 bg-white rounded-xl border shadow-sm">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center text-gray-500 bg-white p-12 rounded-xl border shadow-sm">
                      <div className="text-3xl mb-2">📝</div>
                      <p className="font-semibold text-gray-800">Chưa đăng tải bài viết nào.</p>
                      <p className="text-sm text-gray-500 mt-1">Người dùng này chưa chia sẻ gì trên trang cá nhân.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post, idx) => (
                        <PostCard 
                          key={post.id || idx} 
                          post={post}
                          onPostDeleted={fetchUserPosts}
                          onPostUpdated={fetchUserPosts}
                        />
                      ))}
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}