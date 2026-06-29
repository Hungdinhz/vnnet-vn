// app/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
        setUsername(res.data.username || '');
        setBio(res.data.bio || '');
        setAvatarUrl(res.data.avatar_url || '');
        setCoverUrl(res.data.cover_url || '');
      } catch (err) { router.push('/login'); }
      finally { setIsLoading(false); }
    };
    fetchMe();
  }, [router]);

  const handleUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingCover(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (type === 'avatar') setAvatarUrl(r.data.url);
      else setCoverUrl(r.data.url);
      toast.success(`Tải lên ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'} thành công!`);
    } catch { toast.error("Tải lên thất bại!"); }
    finally { if (type === 'avatar') setIsUploadingAvatar(false); else setIsUploadingCover(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast.error("Tên không được để trống!"); return; }
    setIsSaving(true);
    try {
      const res = await api.put('/users/me', { username, bio, avatar_url: avatarUrl, cover_url: coverUrl });
      setCurrentUser(res.data);
      toast.success("Cập nhật thành công!");
      window.location.reload();
    } catch (err: any) { toast.error(err.response?.data?.detail || "Lưu thất bại!"); }
    finally { setIsSaving(false); }
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#0F0B1E] text-[#E8E0F0]">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-purple-500/10 pb-4">
              <span className="text-2xl">⚙️</span>
              <h1 className="text-xl font-bold gradient-text">Cài đặt tài khoản</h1>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-purple-300/70 mb-1.5">Tên hiển thị</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 input-anime rounded-lg text-sm font-medium" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-300/70 mb-1.5">Tiểu sử</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150} className="w-full px-4 py-2 input-anime rounded-lg text-sm resize-none" />
                  <div className="flex justify-between mt-1"><span className="text-[11px] text-purple-400/30">Giới thiệu ngắn</span><span className="text-[11px] text-purple-400/30">{bio.length}/150</span></div>
                </div>

                {/* Avatar Upload - No URL display */}
                <div className="border-t border-purple-500/10 pt-4">
                  <label className="block text-sm font-semibold text-purple-300/70 mb-2">Ảnh đại diện</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.03] border-2 border-purple-500/20">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full flex items-center justify-center font-bold text-purple-200 text-xl">{getInitials(username)}</div>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="px-5 py-2.5 btn-anime rounded-lg cursor-pointer text-xs font-bold inline-flex items-center gap-2 w-fit">
                        📷 {isUploadingAvatar ? "Đang tải lên..." : "Chọn ảnh đại diện"}
                        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')} className="hidden" disabled={isUploadingAvatar} />
                      </label>
                      {avatarUrl && (
                        <button type="button" onClick={() => setAvatarUrl('')} className="text-[11px] text-rose-400/60 hover:text-rose-400 transition-colors text-left">
                          ✕ Xóa ảnh đại diện
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Upload - No URL display */}
                <div className="border-t border-purple-500/10 pt-4">
                  <label className="block text-sm font-semibold text-purple-300/70 mb-2">Ảnh bìa</label>
                  <div className="h-36 w-full rounded-xl overflow-hidden bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-cyan-500/20 mb-3 flex items-center justify-center border border-purple-500/10">
                    {coverUrl ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" /> : <span className="text-purple-400/30 text-xs font-medium">Chưa thiết lập ảnh bìa</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="px-5 py-2.5 btn-anime rounded-lg cursor-pointer text-xs font-bold inline-flex items-center gap-2 w-fit flex-shrink-0">
                      📷 {isUploadingCover ? "Đang tải lên..." : "Chọn ảnh bìa"}
                      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')} className="hidden" disabled={isUploadingCover} />
                    </label>
                    {coverUrl && (
                      <button type="button" onClick={() => setCoverUrl('')} className="text-[11px] text-rose-400/60 hover:text-rose-400 transition-colors">
                        ✕ Xóa ảnh bìa
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-purple-500/10 pt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => router.push('/')} className="px-5 py-2 text-sm font-semibold text-purple-400/50 hover:bg-white/5 rounded-lg transition-colors border border-purple-500/10">Hủy</button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2 btn-anime rounded-lg text-sm">{isSaving ? "Đang lưu..." : "✨ Lưu thay đổi"}</button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
