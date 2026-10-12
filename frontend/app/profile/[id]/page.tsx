// app/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [isProcessingFriendAction, setIsProcessingFriendAction] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [postFilter, setPostFilter] = useState<'all' | 'media' | 'popular' | 'latest'>('all');

  const filteredPosts = posts.filter(post => {
    if (postFilter === 'media') return Boolean(post.image_url || post.video_url);
    return true;
  }).sort((a, b) => {
    if (postFilter === 'popular') return (b.likes_count || b.likes || 0) - (a.likes_count || a.likes || 0);
    if (postFilter === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const fetchProfile = async () => {
    try {
      const r = await api.get(`/users/${id}`);
      setProfileData(r.data);
      setNewBio(r.data.bio || '');
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchUserPosts = async () => {
    try {
      const r = await api.get(`/posts/user/${id}`);
      setPosts(r.data || []);
    } catch (e) { console.error(e); }
    finally { setIsLoadingPosts(false); }
  };

  const fetchFriendshipStatus = async (targetId: number, myId: number) => {
    try {
      const res = await api.get(`/friends/status/${targetId}`);
      const data = res.data;
      if (data && data.status) {
        setFriendshipStatus(data.status);
        setFriendshipId(data.friendship_id || null);
        setRequestId(data.request_id || null);
        return;
      }
    } catch (e) {
      console.error('Không thể lấy /friends/status, thử qua /friends/list:', e);
    }
    // Fallback qua /friends/list
    try {
      const fRes = await api.get('/friends/list');
      const friendships = fRes.data || [];
      const matched = friendships.find((f: any) =>
        (f.user_id === myId && f.friend_id === targetId) ||
        (f.friend_id === myId && f.user_id === targetId)
      );
      if (matched) {
        setFriendshipStatus('accepted');
        setFriendshipId(matched.id);
      } else {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const fetchSelf = async () => {
      try { 
        const r = await api.get('/users/me'); 
        const myId = r.data.id;
        setCurrentUserId(myId); 
        const targetId = Number(id);
        if (targetId && targetId !== myId) {
          await fetchFriendshipStatus(targetId, myId);
        }
      } catch (e) { console.error(e); }
    };
    fetchSelf(); fetchProfile(); fetchUserPosts(); fetchActivity();
  }, [id, router]);

  const fetchActivity = async () => {
    try {
      const r = await api.get(`/users/${id}/activity`);
      setActivityData(r.data || []);
    } catch (e) { console.error('Activity error:', e); }
  };

  const handleAddFriend = async () => {
    setIsProcessingFriendAction(true);
    try {
      const res = await api.post(`/friends/request/${id}`);
      toast.success('Đã gửi lời mời kết bạn!');
      setFriendshipStatus('pending_sent');
      if (res.data?.id) {
        setRequestId(res.data.id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Không thể gửi lời mời kết bạn.");
    } finally {
      setIsProcessingFriendAction(false);
    }
  };

  const handleCancelRequest = async () => {
    setIsProcessingFriendAction(true);
    try {
      if (requestId) {
        await api.delete(`/friends/request/${requestId}`);
      } else {
        await api.delete(`/friends/request/user/${id}`);
      }
      toast.success('Đã hủy lời mời kết bạn');
      setFriendshipStatus('none');
      setRequestId(null);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Không thể hủy lời mời.');
    } finally {
      setIsProcessingFriendAction(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId) return;
    setIsProcessingFriendAction(true);
    try {
      const res = await api.post(`/friends/accept/${requestId}`);
      toast.success('Đã chấp nhận lời mời kết bạn!');
      setFriendshipStatus('accepted');
      if (res.data?.id) {
        setFriendshipId(res.data.id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Không thể chấp nhận lời mời.');
    } finally {
      setIsProcessingFriendAction(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestId) return;
    setIsProcessingFriendAction(true);
    try {
      await api.delete(`/friends/request/${requestId}`);
      toast.success('Đã từ chối lời mời kết bạn');
      setFriendshipStatus('none');
      setRequestId(null);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Không thể từ chối lời mời.');
    } finally {
      setIsProcessingFriendAction(false);
    }
  };

  const handleUnfriend = async () => {
    if (!friendshipId) return;
    setIsProcessingFriendAction(true);
    try {
      await api.delete(`/friends/${friendshipId}`);
      toast.success('Đã hủy kết bạn');
      setFriendshipStatus('none');
      setFriendshipId(null);
      setShowUnfriendConfirm(false);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Không thể hủy kết bạn');
    } finally {
      setIsProcessingFriendAction(false);
    }
  };

  const handleSaveBio = async () => {
    if (isSavingBio) return;
    setIsSavingBio(true);
    try { const r = await api.put('/users/me', { bio: newBio }); setProfileData(r.data); setIsEditingBio(false); toast.success("Cập nhật thành công!"); }
    catch (e: any) { toast.error(e.response?.data?.detail || "Lỗi"); }
    finally { setIsSavingBio(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0]; if (!file) return;
    if (type === 'avatar') setIsUploadingAvatar(true); else setIsUploadingCover(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const ur = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const body = type === 'avatar' ? { avatar_url: ur.data.url } : { cover_url: ur.data.url };
      const r = await api.put('/users/me', body);
      setProfileData(r.data); toast.success("Cập nhật thành công!");
      if (type === 'avatar') window.location.reload();
    } catch { toast.error("Tải lên thất bại!"); }
    finally { if (type === 'avatar') setIsUploadingAvatar(false); else setIsUploadingCover(false); }
  };

  const isOwnProfile = currentUserId !== null && Number(id) === currentUserId;
  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-0 md:p-4 max-w-5xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : !profileData ? (
            <div className="text-center text-indigo-400/50 mt-20 font-semibold glass-card p-10 rounded-xl">Không tìm thấy người dùng.</div>
          ) : (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="glass-card rounded-b-xl overflow-hidden">
                <div className="h-44 xs:h-52 sm:h-64 md:h-80 bg-gradient-to-r from-indigo-600/50 via-indigo-500/35 to-slate-500/25 relative group">
                  {profileData.cover_url ? <img src={profileData.cover_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-indigo-600/50 via-indigo-500/35 to-slate-500/25" />}
                  {isOwnProfile && (
                    <div className="absolute top-3 right-3 sm:bottom-4 sm:right-4 z-20">
                      <input 
                        id="profile-cover-upload"
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleUpload(e, 'cover')} 
                        className="hidden" 
                        disabled={isUploadingCover} 
                      />
                      <label 
                        htmlFor="profile-cover-upload"
                        className="bg-black/50 backdrop-blur-md hover:bg-black/70 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-white/20 shadow-lg select-none pointer-events-auto"
                      >
                        <span>📷</span>
                        <span>{isUploadingCover ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="px-4 sm:px-6 pb-6 relative">
                  <div className="flex flex-col md:flex-row md:items-end justify-between -mt-12 xs:-mt-14 sm:-mt-16 md:-mt-10 gap-3 sm:gap-4 mb-4">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-3 sm:gap-4 text-center md:text-left">
                      <div className="relative w-24 h-24 xs:w-28 xs:h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-background rounded-full p-1 sm:p-1.5 shadow-xl flex-shrink-0 group z-10">
                        {profileData.avatar_url ? (
                          <img src={profileData.avatar_url} alt={profileData.username} className="w-full h-full rounded-full object-cover avatar-glow" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl sm:text-6xl font-bold text-white">{getInitials(profileData.username)}</div>
                        )}
                        {isOwnProfile && (
                          <label className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold gap-1 border-2 sm:border-4 border-[#0F0B1E]">
                            <span>📷</span><span>{isUploadingAvatar ? "Đang tải..." : "Cập nhật"}</span>
                            <input type="file" accept="image/*" onChange={e => handleUpload(e, 'avatar')} className="hidden" disabled={isUploadingAvatar} />
                          </label>
                        )}
                      </div>
                      <div className="md:mb-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">{profileData.username}</h1>
                        <p className="text-xs sm:text-sm font-semibold text-indigo-400/50 mt-0.5">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="md:mb-4">
                      {isOwnProfile ? (
                        <button onClick={() => setIsEditingBio(!isEditingBio)} className="w-full md:w-auto px-6 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-1.5 border border-indigo-500/20">
                          ✏️ {isEditingBio ? "Đóng" : "Chỉnh sửa tiểu sử"}
                        </button>
                      ) : friendshipStatus === 'accepted' ? (
                        <div className="flex flex-col md:flex-row items-center gap-2">
                          {showUnfriendConfirm ? (
                            <>
                              <button onClick={handleUnfriend} disabled={isProcessingFriendAction} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg text-sm border border-red-500/30 transition-colors">✓ Xác nhận hủy kết bạn</button>
                              <button onClick={() => setShowUnfriendConfirm(false)} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-black/5 dark:bg-white/5 text-muted/50 font-bold rounded-lg text-sm border border-indigo-500/10 transition-colors">Không</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setShowUnfriendConfirm(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-sm border border-red-500/20 shadow-sm transition-colors cursor-pointer">❌ Hủy kết bạn</button>
                              <button onClick={() => router.push(`/messages?userId=${id}`)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 btn-anime rounded-lg text-sm shadow-md">💬 Nhắn tin</button>
                            </>
                          )}
                        </div>
                      ) : friendshipStatus === 'pending_sent' ? (
                        <div className="flex flex-col md:flex-row items-center gap-2">
                          <button
                            onClick={handleCancelRequest}
                            disabled={isProcessingFriendAction}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-secondary font-bold rounded-lg text-sm border border-indigo-500/20 transition-all cursor-pointer"
                            title="Nhấp để hủy lời mời đã gửi"
                          >
                            <span>⏳</span>
                            <span>Đã gửi lời mời (Hủy)</span>
                          </button>
                        </div>
                      ) : friendshipStatus === 'pending_received' ? (
                        <div className="flex flex-col md:flex-row items-center gap-2">
                          <button
                            onClick={handleAcceptRequest}
                            disabled={isProcessingFriendAction}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 btn-anime rounded-lg text-sm shadow-md font-bold cursor-pointer"
                          >
                            ✓ Chấp nhận
                          </button>
                          <button
                            onClick={handleRejectRequest}
                            disabled={isProcessingFriendAction}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg text-sm font-semibold border border-indigo-500/10 transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddFriend}
                          disabled={isProcessingFriendAction}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 btn-anime rounded-lg text-sm shadow-md font-bold cursor-pointer"
                        >
                          👋 Thêm bạn bè
                        </button>
                      )}
                    </div>
                  </div>
                  <hr className="border-indigo-500/10 my-4" />
                  <div className="max-w-2xl">
                    {isEditingBio ? (
                      <div className="space-y-2">
                        <textarea value={newBio} onChange={e => setNewBio(e.target.value)} placeholder="Viết giới thiệu..." maxLength={150} rows={2} className="w-full px-3 py-2 input-anime rounded-lg text-sm resize-none" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIsEditingBio(false)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-indigo-300/70 rounded-lg text-xs font-semibold">Hủy</button>
                          <button onClick={handleSaveBio} disabled={isSavingBio} className="px-4 py-1.5 btn-anime rounded-lg text-xs">{isSavingBio ? "Đang lưu..." : "✨ Lưu"}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center md:text-left">
                        {profileData.bio ? <div className="text-sm font-medium text-secondary/70 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-3 rounded-lg border border-indigo-500/10 inline-block">💡 {profileData.bio}</div>
                        : <div className="text-xs text-muted/30 italic">Chưa có tiểu sử.</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-4 space-y-4">
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="font-bold text-foreground text-[17px] mb-3">Giới thiệu</h3>
                    <div className="space-y-3.5 text-[14px]">
                      <div className="flex items-center gap-2.5 text-secondary/60"><span>📧</span><span>{profileData.email}</span></div>
                      <div className="flex items-center gap-2.5 text-secondary/60"><span>🎂</span><span>Tham gia tháng 6, 2026</span></div>
                      <div className="flex items-center gap-2.5 text-secondary/60"><span>✨</span><span>Tài khoản chính thức</span></div>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-foreground text-[17px]">Ảnh</h3>
                      <button className="text-xs text-accent-primary hover:underline font-semibold">Xem tất cả</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {posts.filter(p => p.image_url).slice(0, 6).map((post, idx) => (
                        <div key={post.id || idx} className="aspect-square bg-white/[0.03] rounded-lg overflow-hidden border border-indigo-500/10">
                          <img src={post.image_url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                      {posts.filter(p => p.image_url).length === 0 && <div className="col-span-full py-6 text-center text-xs text-indigo-400/30">Không có ảnh.</div>}
                    </div>
                  </div>

                  {/* Activity Chart */}
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="font-bold text-foreground text-[17px] mb-3 flex items-center gap-2">📊 Tần suất hoạt động</h3>
                    {activityData.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted/30">Đang tải dữ liệu...</div>
                    ) : (
                      <>
                        <div className="flex items-end gap-[2px] h-24 mb-2">
                          {activityData.map((d: any, i: number) => {
                            const total = (d.posts || 0) + (d.comments || 0) + (d.likes || 0);
                            const maxVal = Math.max(...activityData.map((x: any) => (x.posts || 0) + (x.comments || 0) + (x.likes || 0)), 1);
                            const pct = (total / maxVal) * 100;
                            const dayOfWeek = new Date(d.date).getDay();
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[9px] text-secondary px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  {d.date.slice(5)} • {total} HĐ
                                </div>
                                <div 
                                  className={`w-full rounded-t-sm transition-all duration-200 group-hover:brightness-125 ${
                                    total === 0 ? 'bg-black/5 dark:bg-white/5' :
                                    pct > 60 ? 'bg-gradient-to-t from-indigo-500 to-indigo-500' :
                                    pct > 30 ? 'bg-gradient-to-t from-indigo-500/80 to-indigo-400/60' :
                                    'bg-indigo-500/40'
                                  }`}
                                  style={{ height: total === 0 ? '2px' : `${Math.max(pct, 8)}%` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted/30">
                          <span>30 ngày trước</span>
                          <span>Hôm nay</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/50">
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Bài viết: {activityData.reduce((s: number, d: any) => s + (d.posts || 0), 0)}</div>
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Bình luận: {activityData.reduce((s: number, d: any) => s + (d.comments || 0), 0)}</div>
                          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Lượt thích: {activityData.reduce((s: number, d: any) => s + (d.likes || 0), 0)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="glass-card p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-[16px] sm:text-[17px]">Bài viết</h3>
                      <span className="text-xs text-muted/60 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full font-semibold">
                        {filteredPosts.length}
                      </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
                      {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'latest', label: 'Mới nhất' },
                        { key: 'media', label: 'Có ảnh' },
                        { key: 'popular', label: 'Nhiều tim' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setPostFilter(item.key as any)}
                          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                            postFilter === item.key
                              ? 'bg-accent-primary text-white shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isLoadingPosts ? (
                    <div className="flex justify-center py-12 glass-card rounded-xl"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="text-center glass-card p-10 sm:p-12 rounded-xl">
                      <div className="text-3xl mb-2">📝</div>
                      <p className="font-semibold text-foreground">
                        {postFilter === 'all' ? 'Chưa có bài viết nào.' : 'Không có bài viết phù hợp bộ lọc.'}
                      </p>
                      <p className="text-sm text-muted/40 mt-1">
                        {postFilter === 'all' ? 'Người dùng chưa chia sẻ gì.' : 'Hãy thử chọn bộ lọc "Tất cả".'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map((post, idx) => (
                        <PostCard key={post.id || idx} post={post} onPostDeleted={fetchUserPosts} onPostUpdated={fetchUserPosts} />
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