"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { getValidGroupCover, handleGroupImageError, generateDefaultGroupCover } from '@/lib/groupUtils';

export default function GroupDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'requests' | 'settings'>('feed');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Post composer state
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedPostImage, setSelectedPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group settings state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editRequiresApproval, setEditRequiresApproval] = useState(false);
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCurrentUser();
      fetchGroupDetails();
      fetchGroupPosts();
      fetchGroupMembers();
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
      const data = res.data;
      setGroup(data);
      setEditName(data.name || '');
      setEditDescription(data.description || '');
      setEditCoverUrl(data.coverUrl || data.cover_url || '');
      setEditRequiresApproval(Boolean(data.requiresApproval ?? data.requires_approval));
      setEditIsPrivate(Boolean(data.isPrivate ?? data.is_private));

      // If user is admin/creator, load join requests
      const isCreatorUser = currentUser?.id && (data.creatorId === currentUser.id || data.creator_id === currentUser.id);
      const isAdminUser = data.userRole === 'ADMIN' || data.user_role === 'ADMIN';
      if (isCreatorUser || isAdminUser) {
        fetchJoinRequests();
      }
    } catch (error) {
      console.error(error);
      toast.error('Không tìm thấy nhóm');
      router.push('/groups');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/groups/${id}/posts`);
      setPosts(res.data || []);
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
      setMembers(res.data || []);
    } catch (error) {
      console.error("Lỗi tải thành viên:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchJoinRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await api.get(`/groups/${id}/requests`);
      setJoinRequests(res.data || []);
    } catch (error) {
      console.error("Lỗi tải yêu cầu tham gia:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleTabChange = (tab: 'feed' | 'members' | 'requests' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'members') {
      fetchGroupMembers();
    } else if (tab === 'requests') {
      fetchJoinRequests();
    }
  };

  const handleJoinOrLeave = async () => {
    try {
      if (isMember && !isCreator) {
        if (!confirm(`Bạn có chắc chắn muốn rời nhóm "${group.name}" không?`)) {
          return;
        }
        await api.delete(`/groups/${id}/leave`);
        toast.success('Đã rời nhóm');
      } else if (!isMember) {
        const res = await api.post(`/groups/${id}/join`);
        if (res.data?.status === 'PENDING') {
          toast.success('📨 Đã gửi yêu cầu tham gia nhóm! Vui lòng chờ trưởng nhóm duyệt.');
        } else {
          toast.success('🎉 Đã tham gia nhóm thành công!');
        }
      }
      await Promise.all([fetchGroupDetails(), fetchGroupMembers()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCancelJoinRequest = async () => {
    try {
      await api.delete(`/groups/${id}/join-request`);
      toast.success('Đã hủy yêu cầu tham gia nhóm');
      await fetchGroupDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy yêu cầu');
    }
  };

  const handleApproveRequest = async (requestId: number, username: string) => {
    try {
      await api.post(`/groups/${id}/requests/${requestId}/approve`);
      toast.success(`🎉 Đã duyệt "${username}" vào nhóm!`);
      await Promise.all([fetchGroupDetails(), fetchGroupMembers(), fetchJoinRequests()]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể phê duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async (requestId: number, username: string) => {
    try {
      await api.post(`/groups/${id}/requests/${requestId}/reject`);
      toast.success(`Đã từ chối yêu cầu của "${username}"`);
      await fetchJoinRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu');
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedPostImage(null);
      setPostImagePreview(null);
    }
  };

  const handleRemovePostImage = () => {
    setSelectedPostImage(null);
    setPostImagePreview(null);
    const fileInput = document.getElementById('group-post-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) {
      toast.error('Vui lòng nhập nội dung!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let uploadedImageUrl = null;
      if (selectedPostImage) {
        setIsUploadingPostImage(true);
        const fd = new FormData();
        fd.append("file", selectedPostImage);
        const uploadRes = await api.post("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data?.url || null;
      }

      await api.post('/posts', {
        title: newTitle || 'Bài viết trong nhóm',
        content: newContent,
        image_url: uploadedImageUrl,
        imageUrl: uploadedImageUrl,
        group_id: Number(id)
      });
      
      toast.success('Đăng bài thành công!');
      setNewTitle('');
      setNewContent('');
      handleRemovePostImage();
      setIsComposing(false);
      fetchGroupPosts();
      fetchGroupDetails();
    } catch (error) {
      console.error("Lỗi đăng bài:", error);
      toast.error('Có lỗi xảy ra khi đăng bài');
    } finally {
      setIsSubmitting(false);
      setIsUploadingPostImage(false);
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
        name: editName.trim(),
        description: editDescription.trim(),
        coverUrl: editCoverUrl.trim(),
        requiresApproval: editRequiresApproval,
        requires_approval: editRequiresApproval,
        isPrivate: editIsPrivate,
        is_private: editIsPrivate,
      });
      setGroup(res.data);
      setEditRequiresApproval(Boolean(res.data?.requiresApproval ?? res.data?.requires_approval ?? false));
      setEditIsPrivate(Boolean(res.data?.isPrivate ?? res.data?.is_private ?? false));
      toast.success('Đã lưu thông tin nhóm thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi lưu thông tin');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data?.url) {
        setEditCoverUrl(res.data.url);
        toast.success("Tải ảnh bìa lên thành công!");
      }
    } catch {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploadingCover(false);
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

  const isCreator = Boolean(
    currentUser?.id && Number(group?.creatorId ?? group?.creator_id) === Number(currentUser?.id)
  );
  const isMember = Boolean(
    group?.isJoined ||
    group?.joined ||
    group?.is_joined ||
    isCreator ||
    (currentUser?.id && members.some((m: any) => Number(m.userId ?? m.user_id ?? m.id) === Number(currentUser?.id)))
  );
  const isAdmin = Boolean(group?.userRole === 'ADMIN' || group?.user_role === 'ADMIN');
  const isAdminOrCreator = isCreator || isAdmin;
  const isJoinedOrCreator = isMember || isCreator;
  const isPending = Boolean(group?.joinRequestStatus === 'PENDING' || group?.join_request_status === 'PENDING');
  const groupRequiresApproval = Boolean(group?.requiresApproval ?? group?.requires_approval ?? false);
  const groupIsPrivate = Boolean(group?.isPrivate ?? group?.is_private ?? false);

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
            <div className="h-48 md:h-64 relative bg-black/10">
              <img 
                src={getValidGroupCover(group.coverUrl || group.cover_url, group.name)} 
                alt={group.name} 
                onError={(e) => handleGroupImageError(e, group.name)}
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="p-4 md:p-6 relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{group.name}</h1>
                    {groupIsPrivate ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-600/15 text-purple-400 border border-purple-500/30">
                        🔒 Nhóm riêng tư
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        🌍 Nhóm công khai
                      </span>
                    )}
                    {groupRequiresApproval ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        ⏳ Cần phê duyệt
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        🔓 Tham gia tự do
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted/70">
                    <span className="flex items-center gap-1.5">
                      <span>👥</span> {group.memberCount ?? group.member_count ?? members.length ?? 1} thành viên
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>📝</span> {group.postCount ?? group.post_count ?? posts.length ?? 0} bài viết
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {isCreator ? (
                    <div className="px-5 py-2 rounded-lg font-bold text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                      👑 Trưởng nhóm
                    </div>
                  ) : isMember ? (
                    <button 
                      onClick={handleJoinOrLeave}
                      className="px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      🚪 Rời nhóm
                    </button>
                  ) : isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 rounded-lg font-bold text-xs bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
                        ⏳ Đang chờ trưởng nhóm duyệt
                      </div>
                      <button
                        onClick={handleCancelJoinRequest}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                        title="Hủy yêu cầu tham gia"
                      >
                        Hủy yêu cầu
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleJoinOrLeave}
                      className="px-6 py-2 rounded-lg font-bold text-sm btn-anime cursor-pointer"
                    >
                      {groupRequiresApproval ? '📨 Yêu cầu tham gia' : '👋 Tham gia nhóm'}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-muted">
                {group.description || "Nhóm chưa có mô tả."}
              </div>

              {/* Group Tabs */}
              <div className="flex items-center gap-2 mt-6 border-t border-indigo-500/10 pt-4 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => handleTabChange('feed')}
                  className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'feed'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                      : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  💬 Thảo luận
                </button>
                <button
                  onClick={() => handleTabChange('members')}
                  className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                      : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  👥 Thành viên ({group.memberCount ?? group.member_count ?? members.length})
                </button>

                {isAdminOrCreator && (
                  <button
                    onClick={() => handleTabChange('requests')}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'requests'
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                        : 'text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>⏳ Duyệt yêu cầu</span>
                    {joinRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                        {joinRequests.length}
                      </span>
                    )}
                  </button>
                )}

                {isAdminOrCreator && (
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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
                    <p className="flex items-center gap-1.5 font-medium">
                      <span>{groupIsPrivate ? '🔒' : '🌍'}</span>
                      <span>
                        {groupIsPrivate 
                          ? 'Nhóm riêng tư (chỉ thành viên mới có thể xem bài viết)' 
                          : 'Nhóm công khai (tất cả mọi người đều có thể xem bài viết)'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span>{groupRequiresApproval ? '⏳' : '🔓'}</span>
                      <span>
                        {groupRequiresApproval 
                          ? 'Chế độ tham gia: Cần trưởng nhóm phê duyệt' 
                          : 'Chế độ tham gia: Tự do tham gia bất cứ lúc nào'}
                      </span>
                    </p>
                    <p>⏰ Đã tạo vào {new Date(group.createdAt).toLocaleDateString('vi-VN')}</p>
                    {(group.userRole || group.user_role || isCreator || isMember) && (
                      <p className="pt-2 border-t border-indigo-500/10 font-medium text-accent-purple">
                        Vai trò của bạn: {isCreator ? '👑 Trưởng nhóm' : (group.userRole === 'ADMIN' || group.user_role === 'ADMIN') ? '🛡️ Quản trị viên' : '👤 Thành viên'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Col: Feed */}
              <div className="md:col-span-8 space-y-4">
                {groupIsPrivate && !isJoinedOrCreator ? (
                  <div className="glass-card rounded-2xl p-8 sm:p-12 text-center space-y-4 border border-indigo-500/20 shadow-xl animate-fade-in">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-4xl shadow-inner">
                      🔒
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">Đây là nhóm riêng tư</h3>
                    <p className="text-sm text-muted/80 max-w-md mx-auto leading-relaxed">
                      Nội dung và tất cả các bài viết thảo luận trong nhóm này chỉ hiển thị đối với các thành viên. Hãy tham gia nhóm để xem các bài viết và cùng thảo luận với mọi người!
                    </p>
                    <div className="pt-2 flex justify-center">
                      {isPending ? (
                        <div className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-2">
                          ⏳ Yêu cầu tham gia của bạn đang chờ phê duyệt
                        </div>
                      ) : (
                        <button
                          onClick={handleJoinOrLeave}
                          className="px-8 py-3 rounded-xl font-bold text-sm btn-anime shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center gap-2"
                        >
                          {groupRequiresApproval ? '📨 Gửi yêu cầu tham gia nhóm' : '👋 Tham gia nhóm ngay'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
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

                        {/* Image Preview if selected */}
                        {postImagePreview && (
                          <div className="relative border border-indigo-500/20 rounded-xl overflow-hidden max-h-[280px] bg-black/25 flex justify-center shadow-inner group">
                            <img src={postImagePreview} alt="Preview bài viết" className="max-w-full h-auto object-contain max-h-[280px]" />
                            <button
                              type="button"
                              onClick={handleRemovePostImage}
                              className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs transition-colors border border-white/20"
                              title="Xóa ảnh"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-indigo-500/10">
                          <label 
                            htmlFor="group-post-file-upload" 
                            className="flex items-center gap-1.5 cursor-pointer px-3.5 py-2 rounded-lg border border-indigo-500/20 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-accent-purple transition-all select-none"
                          >
                            <span className="text-sm">📷</span>
                            <span>{selectedPostImage ? 'Đổi ảnh khác' : 'Thêm hình ảnh'}</span>
                            <input 
                              id="group-post-file-upload" 
                              type="file" 
                              accept="image/*" 
                              onChange={handlePostImageChange} 
                              className="hidden" 
                              disabled={isSubmitting || isUploadingPostImage}
                            />
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsComposing(false);
                                handleRemovePostImage();
                              }}
                              className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                            >
                              Hủy
                            </button>
                            <button 
                              type="submit" 
                              disabled={isSubmitting || isUploadingPostImage || !newContent.trim()}
                              className="px-6 py-2 btn-anime rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                            >
                              {isSubmitting || isUploadingPostImage ? 'Đang đăng bài...' : '✨ Đăng bài'}
                            </button>
                          </div>
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
                  </>
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
                    const isMemberCreator = m.userId === group.creatorId;
                    const isMemberAdmin = m.role === 'ADMIN';
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
                              {isMemberCreator ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">👑 Trưởng nhóm</span>
                              ) : isMemberAdmin ? (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">🛡️ Quản trị viên</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted font-medium">👤 Thành viên</span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Admin Action Controls */}
                        {isAdminOrCreator && !isMemberCreator && !isSelf && (
                          <div className="flex items-center gap-2">
                            {isMemberAdmin ? (
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

          {/* TAB 3: JOIN REQUESTS (ADMIN/CREATOR ONLY) */}
          {activeTab === 'requests' && isAdminOrCreator && (
            <div className="glass-card rounded-xl p-4 md:p-6 space-y-4 animate-slide-up">
              <div className="border-b border-indigo-500/10 pb-4">
                <h2 className="text-xl font-bold text-foreground">Yêu cầu tham gia nhóm</h2>
                <p className="text-xs text-muted">
                  Phê duyệt hoặc từ chối các yêu cầu muốn tham gia vào nhóm này
                </p>
              </div>

              {isLoadingRequests ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div></div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-12 text-muted/60 space-y-2">
                  <span className="text-3xl block">✨</span>
                  <p className="text-sm font-semibold text-foreground">Không có yêu cầu chờ duyệt nào</p>
                  <p className="text-xs">Tất cả yêu cầu tham gia đã được xử lý xong.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-all"
                    >
                      <Link href={`/profile/${req.userId}`} className="flex items-center gap-3 group">
                        {req.avatarUrl ? (
                          <img src={req.avatarUrl} alt={req.username} className="w-12 h-12 rounded-full object-cover border border-indigo-500/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                            {req.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground group-hover:text-accent-purple transition-colors">
                            {req.username}
                          </div>
                          <div className="text-xs text-muted/60">
                            Yêu cầu vào {req.createdAt ? new Date(req.createdAt).toLocaleString('vi-VN') : 'gần đây'}
                          </div>
                          {req.bio && <div className="text-[11px] text-muted truncate max-w-xs">{req.bio}</div>}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleApproveRequest(req.id, req.username)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          ✓ Chấp nhận
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id, req.username)}
                          className="px-3.5 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-muted rounded-lg text-xs font-semibold transition-all"
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GROUP SETTINGS (ADMIN ONLY) */}
          {activeTab === 'settings' && isAdminOrCreator && (
            <div className="glass-card rounded-xl p-4 md:p-6 space-y-6 animate-slide-up">
              <div>
                <h2 className="text-xl font-bold text-foreground">Quản lý & Cài đặt nhóm</h2>
                <p className="text-xs text-muted mt-0.5">Chỉnh sửa thông tin nhóm, quyền tham gia hoặc thực hiện các thao tác quản trị</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5 border-b border-indigo-500/10 pb-6">
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
                    rows={3}
                    className="w-full px-4 py-2.5 input-anime rounded-lg text-sm resize-none"
                  />
                </div>

                {/* Group Join Policy Setting */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Chế độ tham gia nhóm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setEditRequiresApproval(false)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        !editRequiresApproval
                          ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                          : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>🔓</span>
                        <span>Tham gia tự do</span>
                      </div>
                      <p className="text-xs text-muted/70 leading-relaxed">
                        Bất kỳ thành viên nào cũng có thể tham gia nhóm ngay lập tức bất cứ lúc nào.
                      </p>
                    </div>

                    <div
                      onClick={() => setEditRequiresApproval(true)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        editRequiresApproval
                          ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                          : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>🔒</span>
                        <span>Phê duyệt thành viên</span>
                      </div>
                      <p className="text-xs text-muted/70 leading-relaxed">
                        Người khác gửi yêu cầu tham gia, trưởng nhóm hoặc quản trị viên phải chấp nhận mới được vào nhóm.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Group Privacy Setting */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Quyền riêng tư của nhóm</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setEditIsPrivate(false)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        !editIsPrivate
                          ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                          : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>🌍</span>
                        <span>Nhóm công khai</span>
                      </div>
                      <p className="text-xs text-muted/70 leading-relaxed">
                        Tất cả mọi người đều có thể tìm thấy nhóm và xem các bài viết thảo luận trong nhóm.
                      </p>
                    </div>

                    <div
                      onClick={() => setEditIsPrivate(true)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        editIsPrivate
                          ? 'bg-indigo-500/10 border-indigo-500 text-foreground shadow-sm'
                          : 'bg-black/5 dark:bg-white/[0.02] border-indigo-500/10 text-muted hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        <span>🔒</span>
                        <span>Nhóm riêng tư</span>
                      </div>
                      <p className="text-xs text-muted/70 leading-relaxed">
                        Chỉ những thành viên đã vào nhóm mới có thể xem các bài viết thảo luận.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover Image Setting */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-foreground">Ảnh bìa nhóm (Cover Image)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCoverUrl('');
                        toast.success('Đã đặt lại ảnh bìa mặc định theo tên nhóm');
                      }}
                      className="text-xs text-accent-purple hover:underline font-bold"
                    >
                      🔄 Đặt lại ảnh mặc định
                    </button>
                  </div>

                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="text"
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      placeholder="Để trống để dùng ảnh bìa tự động theo tên nhóm..."
                      className="flex-1 px-4 py-2.5 input-anime rounded-lg text-sm"
                    />
                    <label className="px-4 py-2.5 btn-anime rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap">
                      {isUploadingCover ? "Đang tải..." : "📁 Tải ảnh từ máy"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadCover} 
                        disabled={isUploadingCover}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Cover Preview */}
                  <div className="h-32 rounded-lg overflow-hidden border border-indigo-500/20 relative">
                    <img 
                      src={getValidGroupCover(editCoverUrl, editName || group.name)} 
                      alt="Preview" 
                      onError={(e) => handleGroupImageError(e, editName || group.name)}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] backdrop-blur-sm">
                      {editCoverUrl ? 'Ảnh bìa tùy chỉnh' : 'Ảnh bìa mặc định theo tên nhóm'}
                    </div>
                  </div>
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
              {isCreator && (
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
