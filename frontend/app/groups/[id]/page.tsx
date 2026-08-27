"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';
import Link from 'next/link';

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'settings'>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Post composer state
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group settings state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCurrentUser();
      fetchGroupDetails();
      fetchGroupPosts();
    }
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/users/me');
      setCurrentUser(res.data);
    } catch (e) {
      console.log("Not logged in");
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
      setEditName(res.data.name || '');
      setEditDescription(res.data.description || '');
      setEditCoverUrl(res.data.coverUrl || '');
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy nhóm');
      router.push('/groups');
    }
  };

  const fetchGroupPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/groups/${id}/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await api.get(`/groups/${id}/members`);
      setMembers(res.data);
    } catch (error) {
      console.error("Lỗi tải thành viên:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleTabChange = (tab: 'feed' | 'members' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'members') {
      fetchGroupMembers();
    }
  };

  const handleJoinOrLeave = async () => {
    try {
      if (group.isJoined) {
        await api.delete(`/groups/${id}/leave`);
        toast.success('Đã rời nhóm');
      } else {
        await api.post(`/groups/${id}/join`);
        toast.success('Đã tham gia nhóm');
      }
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error('Vui lòng nhập nội dung!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.post('/posts', {
        title: newTitle || 'Bài viết trong nhóm',
        content: newContent,
        group_id: Number(id)
      });
      
      toast.success('Đăng bài thành công!');
      setNewTitle('');
      setNewContent('');
      setIsComposing(false);
      fetchGroupPosts();
      fetchGroupDetails();
    } catch (error) {
      console.error("Lỗi đăng bài:", error);
      toast.error('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    try {
      await api.put(`/groups/${id}/members/${targetUserId}/role`, { role: newRole });
      toast.success(newRole === 'ADMIN' ? 'Đã thăng cấp Quản trị viên!' : 'Đã chuyển thành Thành viên');
      fetchGroupMembers();
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thay đổi vai trò');
    }
  };

  const handleRemoveMember = async (targetUserId: number, username: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${username}" khỏi nhóm?`)) return;
    try {
      await api.delete(`/groups/${id}/members/${targetUserId}`);
      toast.success('Đã xóa thành viên khỏi nhóm');
      fetchGroupMembers();
      fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa thành viên');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await api.put(`/groups/${id}`, {
        name: editName,
        description: editDescription,
        coverUrl: editCoverUrl
      });
      setGroup(res.data);
      toast.success('Đã lưu thông tin nhóm thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi lưu thông tin');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa nhóm này vĩnh viễn không? Hành động này không thể hoàn tác!')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Đã xóa nhóm');
      router.push('/groups');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa nhóm');
    }
  };

  const isAdminOrCreator = group?.userRole === 'ADMIN' || group?.creatorId === currentUser?.id;
  const isJoinedOrCreator = group?.isJoined || group?.creatorId === currentUser?.id;

  const filteredMembers = members.filter(m => 
    m.username?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (isLoading && !group) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-60px)]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          
          {/* Group Header */}
          <div className="glass-card rounded-xl overflow-hidden mb-6 animate-slide-up">
            <div className="h-48 md:h-64 relative">
              {group.coverUrl ? (
                <img src={group.coverUrl} alt={group.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-accent-purple/30 to-accent-pink/20" />
              )}
            </div>
            <div className="p-4 md:p-6 relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">{group.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted/70">
                    <span className="flex items-center gap-1.5">
                      <span>👥</span> {group.memberCount} thành viên
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>📝</span> {group.postCount} bài viết
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {group.creatorId === currentUser?.id ? (
                    <div className="px-5 py-2 rounded-lg font-bold text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                      👑 Trưởng nhóm
                    </div>
                  ) : (
                    <button 
                      onClick={handleJoinOrLeave}
                      className={`px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${
                        isJoinedOrCreator 
                          ? 'bg-black/5 dark:bg-white/5 border border-indigo-500/20 text-secondary hover:bg-black/10 dark:hover:bg-white/10' 
                          : 'btn-anime'
                      }`}
                    >
                      {isJoinedOrCreator ? '✅ Đã tham gia' : '👋 Tham gia nhóm'}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-muted">
                {group.description || "Nhóm chưa có mô tả."}
              </div>

              {/* Group Tabs */}
              <div className="flex items-center gap-2 mt-6 border-t border-indigo-500/10 pt-4">
                <button
                  onClick={() => handleTabChange('feed')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'feed'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                      : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  💬 Thảo luận
                </button>
                <button
                  onClick={() => handleTabChange('members')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                      : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  👥 Thành viên ({group.memberCount})
                </button>
                {isAdminOrCreator && (
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === 'settings'
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                        : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    ⚙️ Quản lý nhóm
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: FEED / DISCUSSION */}
          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Col: Info */}
              <div className="md:col-span-4 space-y-4 hidden md:block">
                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-bold text-foreground mb-3 text-[15px]">Giới thiệu nhóm</h3>
                  <div className="text-sm text-muted/80 space-y-2">
                    <p>🌎 Nhóm công khai (tất cả mọi người có thể xem)</p>
                    <p>⏰ Đã tạo vào {new Date(group.createdAt).toLocaleDateString('vi-VN')}</p>
                    {group.userRole && (
                      <p className="pt-2 border-t border-indigo-500/10 font-medium text-accent-purple">
                        Vai trò của bạn: {group.creatorId === currentUser?.id ? '👑 Trưởng nhóm' : group.userRole === 'ADMIN' ? '🛡️ Quản trị viên' : '👤 Thành viên'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Feed */}
              <div className="md:col-span-8 space-y-4">
                {isJoinedOrCreator ? (
                  <div className="glass-card rounded-xl p-4 mb-4">
                    {!isComposing ? (
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0">
                          {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div 
                          onClick={() => setIsComposing(true)}
                          className="flex-1 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-indigo-500/10 text-accent-purple/60 rounded-full cursor-pointer transition-colors text-[15px]"
                        >
                          Viết gì đó vào nhóm này...
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCreatePost} className="space-y-3 animate-slide-up">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-foreground">Tạo bài viết mới</div>
                          <button type="button" onClick={() => setIsComposing(false)} className="text-muted/60 hover:text-foreground">✕</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Tiêu đề (tùy chọn)..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full px-3 py-1.5 input-anime rounded-lg text-sm font-semibold"
                        />
                        <textarea
                          placeholder="Nội dung bài viết..."
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 input-anime rounded-lg resize-none text-[15px]"
                          required
                        />
                        <div className="flex justify-end pt-2">
                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-6 py-2 btn-anime rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Đang đăng...' : '✨ Đăng bài'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="glass-card rounded-xl p-4 text-center text-sm text-muted/60">
                    Bạn cần tham gia nhóm để đăng bài.
                  </div>
                )}

                {/* Posts Feed */}
                {isLoading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div></div>
                ) : posts.length === 0 ? (
                  <div className="text-center glass-card p-10 rounded-xl">
                    <div className="text-3xl mb-2">📰</div>
                    <p className="font-semibold text-foreground">Chưa có bài viết nào.</p>
                    <p className="text-sm text-muted mt-1">Hãy là người đầu tiên chia sẻ trong nhóm!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onPostDeleted={fetchGroupPosts}
                      onPostUpdated={fetchGroupPosts}
                    /> 
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERS LIST */}
          {activeTab === 'members' && (
            <div className="glass-card rounded-xl p-4 md:p-6 space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Danh sách thành viên</h2>
                  <p className="text-xs text-muted">Tổng cộng {group.memberCount} thành viên trong nhóm</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm thành viên..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="px-4 py-2 input-anime rounded-lg text-sm w-full sm:w-64"
                />
              </div>

              {isLoadingMembers ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div></div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-10 text-muted">Không tìm thấy thành viên phù hợp.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((m) => {
                    const isCreator = m.userId === group.creatorId;
                    const isAdmin = m.role === 'ADMIN';
                    const isSelf = m.userId === currentUser?.id;

                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
                        <Link href={`/profile/${m.userId}`} className="flex items-center gap-3 group">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.username} className="w-12 h-12 rounded-full object-cover border border-indigo-500/20" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                              {m.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground group-hover:text-accent-purple transition-colors flex items-center gap-2">
                              <span>{m.username}</span>
                              {isSelf && <span className="text-xs text-muted font-normal">(Bạn)</span>}
                            </div>
                            <div className="text-xs text-muted/70 flex items-center gap-2 mt-0.5">
                              {isCreator ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">👑 Trưởng nhóm</span>
                              ) : isAdmin ? (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">🛡️ Quản trị viên</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted font-medium">👤 Thành viên</span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Admin Action Controls */}
                        {isAdminOrCreator && !isCreator && !isSelf && (
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <button
                                onClick={() => handleUpdateRole(m.userId, 'MEMBER')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/5 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-muted transition-all"
                                title="Hạ cấp xuống Thành viên"
                              >
                                👤 Hạ cấp
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateRole(m.userId, 'ADMIN')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-accent-purple transition-all"
                                title="Thăng cấp lên Quản trị viên"
                              >
                                🛡️ Thăng QTV
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(m.userId, m.username)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                              title="Xóa thành viên khỏi nhóm"
                            >
                              ✕ Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GROUP SETTINGS (ADMIN ONLY) */}
          {activeTab === 'settings' && isAdminOrCreator && (
            <div className="glass-card rounded-xl p-4 md:p-6 space-y-6 animate-slide-up">
              <div>
                <h2 className="text-xl font-bold text-foreground">Quản lý & Cài đặt nhóm</h2>
                <p className="text-xs text-muted mt-0.5">Chỉnh sửa thông tin nhóm hoặc thực hiện các thao tác quản trị</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 border-b border-indigo-500/10 pb-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">Tên nhóm</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 input-anime rounded-lg text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">Mô tả nhóm</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 input-anime rounded-lg text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">URL Ảnh bìa (Cover Image)</label>
                  <input
                    type="text"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 input-anime rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 btn-anime rounded-lg text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {isSavingSettings ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              {group.creatorId === currentUser?.id && (
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-red-500 mb-2">Vùng nguy hiểm</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div>
                      <div className="font-bold text-foreground text-sm">Xóa nhóm này</div>
                      <div className="text-xs text-muted">Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu nhóm và không thể khôi phục.</div>
                    </div>
                    <button
                      onClick={handleDeleteGroup}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors shadow-md shadow-red-500/20"
                    >
                      🗑️ Xóa nhóm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

