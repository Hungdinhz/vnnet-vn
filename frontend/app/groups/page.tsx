"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getValidGroupCover, handleGroupImageError, generateDefaultGroupCover } from '@/lib/groupUtils';

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupRequiresApproval, setNewGroupRequiresApproval] = useState(false);
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const [myGroupsRes, suggestedRes] = await Promise.all([
        api.get('/groups/me'),
        api.get('/groups')
      ]);
      setMyGroups(myGroupsRes.data);
      setSuggestedGroups(suggestedRes.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhóm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        requiresApproval: newGroupRequiresApproval,
        requires_approval: newGroupRequiresApproval,
        isPrivate: newGroupIsPrivate,
        is_private: newGroupIsPrivate
      });
      toast.success('🎉 Tạo nhóm thành công!');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupRequiresApproval(false);
      setNewGroupIsPrivate(false);
      fetchGroups(); // Tải lại danh sách
    } catch (error) {
      toast.error('❌ Có lỗi xảy ra khi tạo nhóm');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      const res = await api.post(`/groups/${groupId}/join`);
      if (res.data?.status === 'PENDING') {
        toast.success('📨 Đã gửi yêu cầu tham gia! Vui lòng chờ trưởng nhóm phê duyệt.');
      } else {
        toast.success('🎉 Đã tham gia nhóm!');
      }
      fetchGroups(); // Tải lại để cập nhật danh sách
    } catch (error: any) {
      toast.error(error.response?.data?.message || '❌ Có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-extrabold gradient-text">🏘️ Nhóm</h1>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 btn-anime rounded-lg text-xs"
              >
                ➕ Tạo nhóm mới
              </button>
            </div>
            <p className="text-sm text-muted/50">Tham gia các nhóm cùng sở thích và kết nối với cộng đồng</p>
          </div>

          <div className="glass-card rounded-xl p-4 mb-6">
            <h2 className="font-bold text-secondary mb-4 text-sm">📌 Nhóm của bạn</h2>
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-purple"></div></div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-8 text-muted/50 text-sm italic">Bạn chưa tham gia nhóm nào. Hãy khám phá các nhóm bên dưới!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map(group => (
                  <Link key={group.id} href={`/groups/${group.id}`} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group/card block">
                    <div className="h-28 relative bg-black/10">
                      <img 
                        src={getValidGroupCover(group.coverUrl || group.cover_url, group.name)} 
                        alt={group.name} 
                        onError={(e) => handleGroupImageError(e, group.name)}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {Boolean(group.isPrivate ?? group.is_private) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/85 text-white backdrop-blur-sm shadow-sm">
                            🔒 Riêng tư
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/85 text-white backdrop-blur-sm shadow-sm">
                            🌍 Công khai
                          </span>
                        )}
                        {Boolean(group.requiresApproval ?? group.requires_approval) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/85 text-white backdrop-blur-sm shadow-sm">
                            ⏳ Cần duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/85 text-white backdrop-blur-sm shadow-sm">
                            🔓 Tự do
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground text-[14px] mb-1 truncate">{group.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted/70 mb-2">
                        <span>👥 {group.memberCount ?? group.member_count ?? 1} thành viên</span>
                        <span>📝 {group.postCount ?? group.post_count ?? 0} bài viết</span>
                      </div>
                      <p className="text-xs text-muted truncate">{group.description || "Chưa có mô tả"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-4 mb-4">
            <h2 className="font-bold text-secondary mb-3 text-sm">✨ Gợi ý nhóm cho bạn</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-purple"></div></div>
            ) : suggestedGroups.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted/50 text-sm italic">Chưa có nhóm nào mới để gợi ý cho bạn.</div>
            ) : (
              suggestedGroups.map(group => {
                const isPending = group.joinRequestStatus === 'PENDING' || group.join_request_status === 'PENDING';
                return (
                  <div key={group.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group/card">
                    <div className="h-28 relative bg-black/10">
                      <img 
                        src={getValidGroupCover(group.coverUrl || group.cover_url, group.name)} 
                        alt={group.name} 
                        onError={(e) => handleGroupImageError(e, group.name)}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {Boolean(group.isPrivate ?? group.is_private) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600/85 text-white backdrop-blur-sm shadow-sm">
                            🔒 Riêng tư
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/85 text-white backdrop-blur-sm shadow-sm">
                            🌍 Công khai
                          </span>
                        )}
                        {Boolean(group.requiresApproval ?? group.requires_approval) ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/85 text-white backdrop-blur-sm shadow-sm">
                            ⏳ Cần duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/85 text-white backdrop-blur-sm shadow-sm">
                            🔓 Tự do
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <Link href={`/groups/${group.id}`} className="hover:underline">
                        <h3 className="font-bold text-foreground text-[14px] mb-1 truncate">{group.name}</h3>
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted/70 mb-3">
                        <span>👥 {group.memberCount ?? group.member_count ?? 1} thành viên</span>
                      </div>
                      <p className="text-xs text-muted truncate mb-4">{group.description || "Chưa có mô tả"}</p>
                      
                      {isPending ? (
                        <div className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-semibold text-center">
                          ⏳ Đang chờ duyệt
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleJoinGroup(group.id)}
                          className="w-full py-2 btn-anime rounded-lg text-xs font-semibold"
                        >
                          {Boolean(group.requiresApproval ?? group.requires_approval) ? '📨 Yêu cầu tham gia' : 'Tham gia nhóm'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Modal Tạo nhóm */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card rounded-xl shadow-xl w-full sm:max-w-lg overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="border-b border-indigo-500/10 px-4 py-3 flex items-center justify-between bg-black/5 dark:bg-white/[0.02]">
              <h3 className="font-bold text-foreground">Tạo nhóm mới</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">Tên nhóm <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên nhóm..." 
                  className="w-full px-3 py-2.5 input-anime rounded-lg text-sm text-foreground focus:outline-none placeholder-muted/50"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">Mô tả nhóm (Tùy chọn)</label>
                <textarea 
                  placeholder="Nhóm này dùng để làm gì?" 
                  rows={2}
                  className="w-full px-3 py-2.5 input-anime rounded-lg text-sm text-foreground focus:outline-none resize-none placeholder-muted/50"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              {/* Group Join Policy Option */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-2">Chế độ tham gia nhóm</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setNewGroupRequiresApproval(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      !newGroupRequiresApproval
                        ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                        : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <span>🔓</span>
                      <span>Tham gia tự do</span>
                    </div>
                    <p className="text-[11px] text-muted/70 leading-relaxed">
                      Bất kỳ ai cũng có thể tham gia nhóm ngay lập tức mà không cần chờ duyệt.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewGroupRequiresApproval(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      newGroupRequiresApproval
                        ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                        : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <span>🔒</span>
                      <span>Cần phê duyệt</span>
                    </div>
                    <p className="text-[11px] text-muted/70 leading-relaxed">
                      Người khác gửi yêu cầu, trưởng nhóm phải chấp nhận mới được vào nhóm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Privacy Option */}
              <div>
                <label className="block text-xs font-semibold text-secondary mb-2">Quyền riêng tư của nhóm</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setNewGroupIsPrivate(false)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      !newGroupIsPrivate
                        ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                        : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <span>🌍</span>
                      <span>Nhóm công khai</span>
                    </div>
                    <p className="text-[11px] text-muted/70 leading-relaxed">
                      Tất cả mọi người đều có thể tìm thấy nhóm và xem các bài viết thảo luận.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewGroupIsPrivate(true)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      newGroupIsPrivate
                        ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                        : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <span>🔒</span>
                      <span>Nhóm riêng tư</span>
                    </div>
                    <p className="text-[11px] text-muted/70 leading-relaxed">
                      Chỉ những thành viên đã vào nhóm mới có thể xem các bài viết thảo luận.
                    </p>
                  </div>
                </div>
              </div>

              {/* Default Cover Image Preview & Note */}
              <div className="p-3 rounded-xl bg-black/10 dark:bg-white/[0.02] border border-indigo-500/10">
                <div className="text-[11px] font-semibold text-accent-purple mb-1.5 flex items-center gap-1">
                  <span>🖼️</span> Ảnh bìa mặc định theo tên nhóm
                </div>
                <div className="h-28 rounded-lg overflow-hidden relative border border-indigo-500/20 mb-2">
                  <img 
                    src={generateDefaultGroupCover(newGroupName || 'Tên nhóm của bạn')} 
                    alt="Default Cover Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-muted leading-relaxed">
                  Ảnh bìa tự động hiển thị tên nhóm. Sau khi tạo, trưởng nhóm có thể tải ảnh bìa riêng từ máy lên bất kỳ lúc nào trong phần cài đặt.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:flex-1 py-2.5 rounded-lg text-sm font-semibold text-muted bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="w-full sm:flex-1 py-2.5 btn-anime rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Đang tạo..." : "Tạo nhóm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
