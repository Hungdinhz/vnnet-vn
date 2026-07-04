// app/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

type SettingsTab = 'profile' | 'media' | 'security' | 'appearance' | 'privacy';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form States
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Appearance & Preferences
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [notifications, setNotifications] = useState({
    emailNotifs: true,
    postLikes: true,
    comments: true,
    friendRequests: true,
  });

  // Action Loading States
  const [isSaving, setIsSaving] = useState(false);
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
        setFullName(res.data.full_name || '');
        setBio(res.data.bio || '');
        setLocation(res.data.location || '');
        setWorkplace(res.data.workplace || '');
        setWebsite(res.data.website || '');
        setPhone(res.data.phone || '');
        setAvatarUrl(res.data.avatar_url || '');
        setCoverUrl(res.data.cover_url || '');
      } catch (err) {
        toast.error("Không thể tải thông tin người dùng");
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [router]);

  const handleUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (type === 'avatar') setAvatarUrl(r.data.url);
      else setCoverUrl(r.data.url);
      toast.success(`Đã cập nhật ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'} thành công!`);
    } catch {
      toast.error("Tải lên thất bại, vui lòng thử lại!");
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Tên đăng nhập không được để trống!");
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.put('/users/me', {
        username: username.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        workplace: workplace.trim(),
        website: website.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl
      });
      setCurrentUser(res.data);
      toast.success("✨ Cập nhật thông tin thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Lưu thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.put('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success("🔐 Đổi mật khẩu thành công!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: '👤', desc: 'Họ tên, tiểu sử, công việc & vị trí' },
    { id: 'media', label: 'Ảnh & Hình ảnh', icon: '🖼️', desc: 'Ảnh đại diện, ảnh bìa & xem trước' },
    { id: 'security', label: 'Bảo mật & Mật khẩu', icon: '🔐', desc: 'Đổi mật khẩu & trạng thái tài khoản' },
    { id: 'appearance', label: 'Giao diện & Trải nghiệm', icon: '🎨', desc: 'Chế độ tối/sáng & tùy chỉnh hệ thống' },
    { id: 'privacy', label: 'Quyền riêng tư & Thông báo', icon: '🛡️', desc: 'Quyền hiển thị & quản lý thông báo' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 max-w-5xl py-4 md:py-6 mx-auto w-full">
          
          {/* Header Banner */}
          <div className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden animate-slide-up border border-purple-500/15">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/25">
                  ⚙️
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight gradient-text">Cài đặt tài khoản</h1>
                  <p className="text-xs text-muted/70 mt-0.5">Quản lý hồ sơ cá nhân, ảnh thương hiệu và tùy chỉnh trải nghiệm VnNet</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-semibold w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Tài khoản đã xác thực</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card rounded-2xl p-16 flex flex-col justify-center items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
              <span className="text-sm text-muted/60 font-medium">Đang tải cấu hình...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Navigation Tabs */}
              <div className="lg:col-span-4 space-y-2">
                <div className="glass-card rounded-2xl p-3 border border-purple-500/10 space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-500/15 border border-purple-500/30 text-foreground font-semibold shadow-sm'
                          : 'hover:bg-white/[0.04] dark:hover:bg-white/[0.04] text-muted hover:text-foreground border border-transparent'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{tab.icon}</span>
                      <div>
                        <div className="text-sm font-medium leading-snug">{tab.label}</div>
                        <div className="text-[11px] text-muted/60 mt-0.5 line-clamp-1">{tab.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Profile Card Mini Preview Side Widget */}
                <div className="glass-card rounded-2xl p-4 border border-purple-500/10 space-y-3">
                  <span className="text-xs font-bold text-accent-purple/80 uppercase tracking-wider block">👁️ Xem trước thẻ hồ sơ</span>
                  <div className="rounded-xl overflow-hidden bg-black/20 border border-white/5 relative">
                    <div className="h-20 w-full bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-cyan-500/30 relative">
                      {coverUrl && <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-3 pt-0 relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background shadow-md -mt-7 mb-2 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" /> : getInitials(fullName || username)}
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{fullName || username || 'Tên hiển thị'}</h4>
                      <p className="text-[11px] text-accent-purple/80 font-mono">@{username || 'username'}</p>
                      {bio && <p className="text-xs text-muted/70 mt-1.5 line-clamp-2 italic">"{bio}"</p>}
                      
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-2 text-[10px] text-muted/60">
                        {location && <span className="flex items-center gap-1">📍 {location}</span>}
                        {workplace && <span className="flex items-center gap-1">💼 {workplace}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Tab Content */}
              <div className="lg:col-span-8">
                <div className="glass-card rounded-2xl p-6 border border-purple-500/10">

                  {/* TAB 1: PROFILE INFO */}
                  {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in">
                      <div className="border-b border-purple-500/10 pb-3 flex justify-between items-center">
                        <div>
                          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">👤 Thông tin cá nhân</h2>
                          <p className="text-xs text-muted/60">Cập nhật thông tin chi tiết được hiển thị trên trang cá nhân của bạn</p>
                        </div>
                        <button type="submit" disabled={isSaving} className="px-5 py-2 btn-anime rounded-xl text-xs font-bold shadow-md">
                          {isSaving ? "Đang lưu..." : "✨ Lưu thay đổi"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">Tên đăng nhập (Username) *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-xs text-muted/40 font-mono">@</span>
                            <input
                              type="text"
                              value={username}
                              onChange={e => setUsername(e.target.value)}
                              className="w-full pl-8 pr-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                              placeholder="v.d. hungdinhz"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">Họ và tên hiển thị</label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                            placeholder="v.d. Đinh Hùng"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-semibold text-accent-purple/80">Tiểu sử (Bio)</label>
                          <span className="text-[11px] text-muted/40">{bio.length}/150</span>
                        </div>
                        <textarea
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          rows={3}
                          maxLength={150}
                          className="w-full px-4 py-2.5 input-anime rounded-xl text-sm resize-none"
                          placeholder="Viết một lời giới thiệu ngắn ấn tượng về bản thân bạn..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-500/10">
                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">📍 Quê quán / Thành phố</label>
                          <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                            placeholder="v.d. Hà Nội, Việt Nam"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">💼 Nơi làm việc / Trường học</label>
                          <input
                            type="text"
                            value={workplace}
                            onChange={e => setWorkplace(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                            placeholder="v.d. Software Engineer tại VnNet"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">🌐 Website / Trang cá nhân</label>
                          <input
                            type="url"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">📞 Số điện thoại (Bảo mật)</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium"
                            placeholder="0988 xxx xxx"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-purple-500/10 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => router.push('/')}
                          className="px-5 py-2.5 text-xs font-bold text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors border border-purple-500/10"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-6 py-2.5 btn-anime rounded-xl text-xs font-bold shadow-lg"
                        >
                          {isSaving ? "Đang lưu..." : "✨ Lưu tất cả thay đổi"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: MEDIA (AVATAR & COVER) */}
                  {activeTab === 'media' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-purple-500/10 pb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">🖼️ Quản lý Ảnh đại diện & Ảnh bìa</h2>
                        <p className="text-xs text-muted/60">Tải lên hình ảnh sắc nét để tạo dấu ấn cá nhân trên mạng xã hội</p>
                      </div>

                      {/* Avatar Section */}
                      <div className="glass-card rounded-xl p-5 border border-purple-500/10">
                        <label className="block text-xs font-bold text-accent-purple uppercase tracking-wider mb-3">📸 Ảnh đại diện (Avatar)</label>
                        <div className="flex flex-col sm:flex-row items-center gap-5">
                          <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-white/[0.03] border-4 border-purple-500/20 shadow-xl relative group">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-2xl">
                                {getInitials(fullName || username)}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 text-center sm:text-left flex-1">
                            <p className="text-xs text-muted/70">Khuyên dùng ảnh hình vuông có dung lượng &lt; 5MB (JPG, PNG, WEBP)</p>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                              <label className="px-5 py-2.5 btn-anime rounded-xl cursor-pointer text-xs font-bold inline-flex items-center gap-2 shadow-md">
                                📷 {isUploadingAvatar ? "Đang tải lên..." : "Chọn ảnh mới"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'avatar')}
                                  className="hidden"
                                  disabled={isUploadingAvatar}
                                />
                              </label>
                              {avatarUrl && (
                                <button
                                  type="button"
                                  onClick={() => setAvatarUrl('')}
                                  className="px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-500/20"
                                >
                                  ✕ Gỡ bỏ ảnh
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cover Photo Section */}
                      <div className="glass-card rounded-xl p-5 border border-purple-500/10 space-y-3">
                        <label className="block text-xs font-bold text-accent-purple uppercase tracking-wider">🌄 Ảnh bìa (Cover Image)</label>
                        <div className="h-44 w-full rounded-xl overflow-hidden bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-cyan-900/20 relative flex items-center justify-center border border-purple-500/20 shadow-inner">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <span className="text-2xl block mb-1">🖼️</span>
                              <span className="text-muted/40 text-xs font-medium">Chưa thiết lập ảnh bìa cho trang cá nhân</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <label className="px-5 py-2.5 btn-anime rounded-xl cursor-pointer text-xs font-bold inline-flex items-center gap-2 shadow-md">
                            📷 {isUploadingCover ? "Đang tải lên..." : "Tải ảnh bìa mới"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'cover')}
                              className="hidden"
                              disabled={isUploadingCover}
                            />
                          </label>
                          {coverUrl && (
                            <button
                              type="button"
                              onClick={() => setCoverUrl('')}
                              className="text-xs font-semibold text-rose-400 hover:underline"
                            >
                              ✕ Xóa ảnh bìa
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-6 py-2.5 btn-anime rounded-xl text-xs font-bold shadow-lg"
                        >
                          {isSaving ? "Đang lưu..." : "✨ Cập nhật hình ảnh"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SECURITY & PASSWORD */}
                  {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-in">
                      <div className="border-b border-purple-500/10 pb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">🔐 Bảo mật & Mật khẩu</h2>
                        <p className="text-xs text-muted/60">Thay đổi mật khẩu đăng nhập để bảo vệ an toàn cho tài khoản</p>
                      </div>

                      {/* Account Email Info */}
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-accent-purple/80 block">Email tài khoản đăng ký</span>
                          <span className="text-sm font-bold text-foreground font-mono">{currentUser?.email || 'N/A'}</span>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold">✓ Đã xác thực</span>
                      </div>

                      {/* Change Password Form */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">Mật khẩu hiện tại *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                              placeholder="Nhập mật khẩu hiện tại"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3 text-xs text-muted/50 hover:text-foreground"
                            >
                              {showPassword ? "👁️ Ẩn" : "👁️ Hiện"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">Mật khẩu mới *</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                            placeholder="Ít nhất 6 ký tự"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-accent-purple/80 mb-1.5">Xác nhận mật khẩu mới *</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                            placeholder="Nhập lại mật khẩu mới"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-purple-500/10 flex justify-end">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="px-6 py-2.5 btn-anime rounded-xl text-xs font-bold shadow-lg"
                        >
                          {isChangingPassword ? "Đang xử lý..." : "🔒 Đổi mật khẩu"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 4: APPEARANCE & PREFERENCES */}
                  {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-purple-500/10 pb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">🎨 Giao diện & Trải nghiệm</h2>
                        <p className="text-xs text-muted/60">Tùy chỉnh phong cách hiển thị và chế độ màu sắc ưa thích</p>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-accent-purple uppercase tracking-wider">Chủ đề hiển thị (Theme)</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'dark', label: 'Chế độ Tối (Dark)', icon: '🌙', active: theme === 'dark' },
                            { id: 'light', label: 'Chế độ Sáng (Light)', icon: '☀️', active: theme === 'light' },
                            { id: 'system', label: 'Theo Hệ thống', icon: '💻', active: theme === 'system' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setTheme(t.id as any);
                                toast.success(`Đã chọn ${t.label}`);
                              }}
                              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                                t.active
                                  ? 'bg-purple-500/20 border-purple-500 text-foreground font-bold shadow-md'
                                  : 'bg-black/5 dark:bg-white/5 border-transparent text-muted hover:text-foreground'
                              }`}
                            >
                              <span className="text-2xl">{t.icon}</span>
                              <span className="text-xs">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-purple-500/10 space-y-4">
                        <label className="block text-xs font-bold text-accent-purple uppercase tracking-wider">Ngôn ngữ giao diện</label>
                        <select className="w-full px-4 py-2.5 input-anime rounded-xl text-sm font-medium bg-background">
                          <option value="vi">🇻🇳 Tiếng Việt (Mặc định)</option>
                          <option value="en">🇺🇸 English (US)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: PRIVACY & NOTIFICATIONS */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-purple-500/10 pb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">🛡️ Quyền riêng tư & Thông báo</h2>
                        <p className="text-xs text-muted/60">Kiểm soát ai có thể tương tác và nhận các thông báo quan trọng</p>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-accent-purple uppercase tracking-wider">Cấu hình nhận thông báo</label>
                        
                        {[
                          { key: 'emailNotifs', label: 'Thông báo qua Email', desc: 'Nhận email về các cập nhật tài khoản quan trọng' },
                          { key: 'postLikes', label: 'Lượt thích bài viết', desc: 'Thông báo khi ai đó thích bài viết của bạn' },
                          { key: 'comments', label: 'Bình luận mới', desc: 'Thông báo khi ai đó bình luận bài viết của bạn' },
                          { key: 'friendRequests', label: 'Lời mời kết bạn', desc: 'Thông báo khi có ai đó gửi lời mời kết bạn' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-purple-500/10">
                            <div>
                              <div className="text-xs font-bold text-foreground">{item.label}</div>
                              <div className="text-[11px] text-muted/60">{item.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={(notifications as any)[item.key]}
                              onChange={(e) => {
                                setNotifications({ ...notifications, [item.key]: e.target.checked });
                                toast.success("Đã cập nhật cài đặt thông báo!");
                              }}
                              className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
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
