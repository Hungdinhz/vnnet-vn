"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Post composer state
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchGroupDetails();
    fetchGroupPosts();
  }, [params.id]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/api/users/me');
      setCurrentUser(res.data);
    } catch (e) {
      console.log("Not logged in");
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const res = await api.get(`/groups/${params.id}`);
      setGroup(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy nhóm');
      router.push('/groups');
    }
  };

  const fetchGroupPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/groups/${params.id}/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrLeave = async () => {
    try {
      if (group.isJoined) {
        await api.delete(`/groups/${params.id}/leave`);
        toast.success('Đã rời nhóm');
      } else {
        await api.post(`/groups/${params.id}/join`);
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
        group_id: Number(params.id)
      });
      
      toast.success('Đăng bài thành công!');
      setNewTitle('');
      setNewContent('');
      setIsComposing(false);
      fetchGroupPosts(); // Tải lại feed nhóm
      fetchGroupDetails(); // Update post count
    } catch (error) {
      console.error("Lỗi đăng bài:", error);
      toast.error('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <button 
                    onClick={handleJoinOrLeave}
                    className={`px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all ${
                      group.isJoined 
                        ? 'bg-black/5 dark:bg-white/5 border border-purple-500/20 text-secondary hover:bg-black/10 dark:hover:bg-white/10' 
                        : 'btn-anime'
                    }`}
                  >
                    {group.isJoined ? '✅ Đã tham gia' : '👋 Tham gia nhóm'}
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted">
                {group.description || "Nhóm chưa có mô tả."}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Col: Info / Rules (Mocked for now) */}
            <div className="md:col-span-4 space-y-4 hidden md:block">
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-bold text-foreground mb-3 text-[15px]">Giới thiệu nhóm</h3>
                <div className="text-sm text-muted/80 space-y-2">
                  <p>🌎 Nhóm công khai (tất cả mọi người có thể xem)</p>
                  <p>⏰ Đã tạo vào {new Date(group.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Feed */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Post Composer (Only if joined) */}
              {group.isJoined ? (
                <div className="glass-card rounded-xl p-4 mb-4">
                  {!isComposing ? (
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0">
                        {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div 
                        onClick={() => setIsComposing(true)}
                        className="flex-1 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-purple-500/10 text-accent-purple/60 rounded-full cursor-pointer transition-colors text-[15px]"
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
                          className="px-6 py-2 btn-anime rounded-lg text-sm font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
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
        </main>
      </div>
    </div>
  );
}
