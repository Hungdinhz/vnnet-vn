// app/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';

export default function SettingsPage() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Temp upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

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
        setUsername(res.data.username || '');
        setBio(res.data.bio || '');
        setAvatarUrl(res.data.avatar_url || '');
        setCoverUrl(res.data.cover_url || '');
      } catch (err) {
        console.error("Lỗi tải self user trong Settings:", err);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAvatarUrl(uploadRes.data.url);
      alert("Tải lên ảnh đại diện thành công!");
    } catch (err) {
      console.error("Lỗi tải lên ảnh đại diện:", err);
      alert("Tải lên ảnh đại diện thất bại!");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCoverUrl(uploadRes.data.url);
      alert("Tải lên ảnh bìa thành công!");
    } catch (err) {
      console.error("Lỗi tải lên ảnh bìa:", err);
      alert("Tải lên ảnh bìa thất bại!");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("Tên người dùng không được để trống!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.put('/users/me', {
        username,
        bio,
        avatar_url: avatarUrl,
        cover_url: coverUrl
      });
      setCurrentUser(res.data);
      alert("Cập nhật cài đặt tài khoản thành công!");
      // Reload page to reflect user changes in Navbar & Sidebar
      window.location.reload();
    } catch (err: any) {
      console.error("Lỗi lưu cài đặt:", err);
      alert(err.response?.data?.detail || "Lưu cài đặt thất bại!");
    } finally {
      setIsSaving(false);
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
        
        {/* Center Content */}
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-xl font-bold text-gray-900">Cài đặt tài khoản</h1>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên hiển thị (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Tên này sẽ hiển thị trên trang cá nhân và các bài viết của bạn.</p>
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiểu sử (Bio)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Viết vài dòng giới thiệu bản thân..."
                    rows={3}
                    maxLength={150}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[11px] text-gray-500">Giới thiệu ngắn xuất hiện dưới ảnh đại diện.</span>
                    <span className="text-[11px] text-gray-400">{bio.length}/150</span>
                  </div>
                </div>

                {/* Avatar upload section */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh đại diện (Avatar)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border shadow-inner flex-shrink-0 relative group bg-gray-100 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-lg">
                          {getInitials(username)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg shadow-sm border cursor-pointer transition-colors w-fit">
                        📁 {isUploadingAvatar ? "Đang tải..." : "Chọn ảnh mới"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                      </label>
                      <input 
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Hoặc dán URL ảnh đại diện..."
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Cover image upload section */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh bìa (Cover Image)</label>
                  <div className="space-y-3">
                    <div className="h-32 w-full rounded-lg overflow-hidden border shadow-inner bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-center justify-center">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/60 text-xs font-medium">Chưa thiết lập ảnh bìa</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg shadow-sm border cursor-pointer transition-colors w-fit flex-shrink-0">
                        📁 {isUploadingCover ? "Đang tải..." : "Chọn ảnh mới"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                          disabled={isUploadingCover}
                        />
                      </label>
                      <input 
                        type="text"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="Hoặc dán URL ảnh bìa..."
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="border-t pt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
                  >
                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
