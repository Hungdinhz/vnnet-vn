"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create group modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
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
        name: newGroupName,
        description: newGroupDesc
      });
      toast.success('🎉 Tạo nhóm thành công!');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups(); // Tải lại danh sách
    } catch (error) {
      toast.error('❌ Có lỗi xảy ra khi tạo nhóm');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      toast.success('🎉 Đã tham gia nhóm!');
      fetchGroups(); // Tải lại để cập nhật danh sách
    } catch (error) {
      toast.error('❌ Có lỗi xảy ra');
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
                    <div className="h-28 relative">
                      {group.coverUrl ? (
                        <img src={group.coverUrl} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent-purple/30 to-accent-pink/20" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-foreground text-[14px] mb-1 truncate">{group.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted/70 mb-2">
                        <span>👥 {group.memberCount} thành viên</span>
                        <span>📝 {group.postCount} bài viết</span>
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
              suggestedGroups.map(group => (
                <div key={group.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group/card">
                  <div className="h-28 relative">
                    {group.coverUrl ? (
                      <img src={group.coverUrl} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent-purple/30 to-accent-pink/20" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground text-[14px] mb-1 truncate">{group.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted/70 mb-3">
                      <span>👥 {group.memberCount} thành viên</span>
                    </div>
                    <p className="text-xs text-muted truncate mb-4">{group.description || "Chưa có mô tả"}</p>
                    <button 
                      onClick={() => handleJoinGroup(group.id)}
                      className="w-full py-2 btn-anime rounded-lg text-xs font-semibold"
                    >
                      Tham gia nhóm
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal Tạo nhóm */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="border-b border-indigo-500/10 px-4 py-3 flex items-center justify-between bg-black/5 dark:bg-white/[0.02]">
              <h3 className="font-bold text-foreground">Tạo nhóm mới</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-4">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-secondary mb-1.5">Tên nhóm</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên nhóm..." 
                  className="w-full px-3 py-2.5 input-anime rounded-lg text-sm text-foreground focus:outline-none placeholder-muted/50"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-secondary mb-1.5">Mô tả (Tùy chọn)</label>
                <textarea 
                  placeholder="Nhóm này dùng để làm gì?" 
                  rows={3}
                  className="w-full px-3 py-2.5 input-anime rounded-lg text-sm text-foreground focus:outline-none resize-none placeholder-muted/50"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-muted bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="flex-1 py-2.5 btn-anime rounded-lg text-sm font-semibold disabled:opacity-50"
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
