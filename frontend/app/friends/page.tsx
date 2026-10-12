// app/friends/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import api from '@/lib/axios';

function FriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'requests' | 'sent' | 'list'>('suggestions');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendshipMap, setFriendshipMap] = useState<Record<number, number>>({}); // userId -> friendshipId
  const [isLoading, setIsLoading] = useState(false);
  const [confirmUnfriend, setConfirmUnfriend] = useState<number | null>(null); // userId to confirm unfriend

  // Read tab parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests' || tabParam === 'suggestions' || tabParam === 'sent' || tabParam === 'list') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    // Initial fetch of pending and sent counts for badges
    api.get('/friends/requests').then(r => setPendingRequests(r.data || [])).catch(() => {});
    api.get('/friends/sent-requests').then(r => {
      const list = r.data || [];
      setSentRequests(list);
      const sIds = new Set<number>(list.map((item: any) => Number(item.friend_id || item.friendId)));
      setRequestedUserIds(sIds);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (activeTab === 'suggestions') fetchSuggestedUsers();
    if (activeTab === 'requests') fetchPendingRequests();
    if (activeTab === 'sent') fetchSentRequests();
    if (activeTab === 'list') fetchFriendsList();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [requestedUserIds, setRequestedUserIds] = useState<Set<number>>(new Set());

  const fetchSuggestedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/friends/suggestions');
      setSuggestedUsers(res.data || []);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách gợi ý:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/friends/requests');
      setPendingRequests(res.data || []);
    } catch (error: any) {
      console.error('Lỗi khi tải lời mời:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/friends/sent-requests');
      const list = res.data || [];
      setSentRequests(list);
      const sIds = new Set<number>(list.map((item: any) => Number(item.friend_id || item.friendId)));
      setRequestedUserIds(prev => new Set([...prev, ...sIds]));
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách lời mời đã gửi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriendsList = async () => {
    setIsLoading(true);
    try {
      const [friendsRes, meRes] = await Promise.all([api.get('/friends/list'), api.get('/users/me')]);
      const friendships = Array.isArray(friendsRes.data) ? friendsRes.data : [];
      const me = meRes.data;

      if (!me || !me.id) {
        setFriends([]);
        setIsLoading(false);
        return;
      }

      // Build friendship map: friendUserId -> friendshipId
      const fMap: Record<number, number> = {};
      const friendIds = friendships.map((f: any) => {
        const friendUserId = f.user_id === me.id ? f.friend_id : f.user_id;
        fMap[friendUserId] = f.id;
        return friendUserId;
      });
      setFriendshipMap(fMap);

      const uniqueIds = Array.from(new Set(
        friendIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id))
      ));

      if (uniqueIds.length === 0) {
        setFriends([]);
      } else {
        const detailsPromises = uniqueIds.map((id: number) =>
          api.get(`/users/${id}`)
            .then(r => r.data)
            .catch(err => {
              console.error(`Không lấy được user ${id}:`, err);
              return null;
            })
        );

        const details = await Promise.all(detailsPromises);
        setFriends(details.filter(Boolean));
      }
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.post(`/friends/request/${friendId}`);
      toast.success('Đã gửi lời mời kết bạn thành công!');
      setRequestedUserIds(prev => new Set(prev).add(friendId));
      api.get('/friends/sent-requests').then(r => setSentRequests(r.data || [])).catch(() => {});
    } catch (error: any) {
      console.error('Lỗi kết bạn:', error);
      toast.error(error.response?.data?.detail || 'Không thể gửi lời mời kết bạn.');
    }
  };

  const handleCancelSentRequest = async (requestId: number, receiverId?: number) => {
    try {
      await api.delete(`/friends/request/${requestId}`);
      toast.success('Đã hủy lời mời kết bạn');
      setSentRequests(prev => prev.filter(r => r.id !== requestId));
      if (receiverId) {
        setRequestedUserIds(prev => {
          const next = new Set(prev);
          next.delete(receiverId);
          return next;
        });
      }
    } catch (error: any) {
      console.error('Lỗi hủy lời mời:', error);
      toast.error(error.response?.data?.detail || 'Không thể hủy lời mời.');
    }
  };

  const handleCancelSentRequestByUser = async (userId: number) => {
    try {
      await api.delete(`/friends/request/user/${userId}`);
      toast.success('Đã hủy lời mời kết bạn');
      setRequestedUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setSentRequests(prev => prev.filter(r => (r.friend_id !== userId && r.friendId !== userId)));
    } catch (error: any) {
      console.error('Lỗi hủy lời mời:', error);
      toast.error(error.response?.data?.detail || 'Không thể hủy lời mời.');
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      toast.success('Đã chấp nhận lời mời kết bạn!');
      fetchPendingRequests();
      fetchFriendsList();
    } catch (error: any) {
      console.error('Lỗi chấp nhận lời mời:', error);
      toast.error(error.response?.data?.detail || 'Không thể chấp nhận lời mời.');
    }
  };

  // Từ chối lời mời kết bạn — gọi API thực
  const handleReject = async (requestId: number) => {
    try {
      await api.delete(`/friends/request/${requestId}`);
      toast.success('Đã từ chối lời mời kết bạn');
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      console.error('Lỗi từ chối lời mời:', error);
      toast.error(error.response?.data?.detail || 'Không thể từ chối lời mời.');
    }
  };

  // Hủy kết bạn — gọi API thực
  const handleUnfriend = async (userId: number) => {
    const friendshipId = friendshipMap[userId];
    if (!friendshipId) {
      toast.error('Không tìm thấy thông tin kết bạn');
      return;
    }
    try {
      await api.delete(`/friends/${friendshipId}`);
      toast.success('Đã hủy kết bạn');
      setFriends(prev => prev.filter(f => f.id !== userId));
      setConfirmUnfriend(null);
    } catch (error: any) {
      console.error('Lỗi hủy kết bạn:', error);
      toast.error(error.response?.data?.detail || 'Không thể hủy kết bạn.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />

        <main className="flex-1 py-4 md:py-6 max-w-4xl mx-auto">
          
          <div className="glass-card rounded-xl p-3 sm:p-4 mb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold gradient-text mb-3 sm:mb-4 tracking-tight">Bạn bè</h1>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 xs:gap-2 border-b border-indigo-500/10 pb-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 xs:px-4 xs:py-2 rounded-xl font-bold text-xs xs:text-sm transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'suggestions' 
                    ? 'bg-indigo-500/15 text-accent-primary shadow-sm' 
                    : 'text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                ✨ Gợi ý <span className="hidden xs:inline">kết bạn</span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 xs:px-4 xs:py-2 rounded-xl font-bold text-xs xs:text-sm transition-all focus:outline-none cursor-pointer relative ${
                  activeTab === 'requests' 
                    ? 'bg-indigo-500/15 text-accent-primary shadow-sm' 
                    : 'text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                📩 Lời mời <span className="hidden xs:inline">kết bạn</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-1.5 badge-anime">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 xs:px-4 xs:py-2 rounded-xl font-bold text-xs xs:text-sm transition-all focus:outline-none cursor-pointer relative ${
                  activeTab === 'sent' 
                    ? 'bg-indigo-500/15 text-accent-primary shadow-sm' 
                    : 'text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                📤 Đã gửi <span className="hidden xs:inline">lời mời</span>
                {sentRequests.length > 0 && (
                  <span className="ml-1.5 badge-anime">
                    {sentRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 xs:px-4 xs:py-2 rounded-xl font-bold text-xs xs:text-sm transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'list' 
                    ? 'bg-indigo-500/15 text-accent-primary shadow-sm' 
                    : 'text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                💫 Tất cả <span className="hidden xs:inline">bạn bè</span>
                {friends.length > 0 && (
                  <span className="ml-1 text-[11px] opacity-75">
                    ({friends.length})
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Loader or Content */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 glass-card rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : activeTab === 'suggestions' ? (
            
            /* Suggestions Grid */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4">
              {suggestedUsers.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center text-muted/50 col-span-full">
                  Chưa có gợi ý bạn bè nào mới dành cho bạn.
                </div>
              ) : (
                suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300">
                    
                    {/* Header Background */}
                    <div className="h-12 xs:h-16 sm:h-20 bg-gradient-to-r from-indigo-600/30 via-indigo-500/20 to-slate-500/15" />
                    
                    <div className="p-2.5 xs:p-3 sm:p-4 flex flex-col items-center text-center -mt-7 xs:-mt-8 sm:-mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center w-full min-w-0">
                        <Link href={`/profile/${user.id}`} className="relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-background rounded-full p-0.5 sm:p-1 shadow-md mb-1.5 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-sm xs:text-lg sm:text-xl font-bold text-secondary">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-foreground text-xs xs:text-sm sm:text-[15px] hover:text-accent-primary transition-colors truncate max-w-full">
                          {user.username}
                        </Link>
                        <p className="text-[10px] xs:text-xs text-muted/40 truncate max-w-full mt-0.5 mb-2 sm:mb-3">{user.email}</p>
                      </div>

                      {requestedUserIds.has(user.id) ? (
                        <div className="w-full flex gap-1.5">
                          <span className="flex-1 py-1.5 xs:py-2 bg-indigo-500/10 text-indigo-400 font-bold rounded-lg text-[10px] xs:text-xs text-center border border-indigo-500/20 select-none flex items-center justify-center">
                            Đã gửi
                          </span>
                          <button
                            onClick={() => handleCancelSentRequestByUser(user.id)}
                            className="px-2.5 py-1.5 xs:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-[10px] xs:text-xs transition-colors border border-red-500/20 cursor-pointer"
                            title="Hủy lời mời kết bạn"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="w-full py-1.5 xs:py-2 btn-anime rounded-lg text-[10px] xs:text-xs shadow-sm font-bold cursor-pointer"
                        >
                          ✨ Thêm bạn
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'requests' ? (
            
            /* Requests Tab */
            <div className="space-y-2.5 sm:space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="glass-card p-10 rounded-xl text-center text-muted/50">
                  Bạn không có lời mời kết bạn nào đang chờ.
                </div>
              ) : (
                pendingRequests.map((r: any) => (
                  <div key={r.id} className="glass-card glass-card-hover p-3 sm:p-4 rounded-xl flex flex-col xs:flex-row xs:items-center justify-between gap-3 transition-all duration-300">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full text-white flex items-center justify-center font-bold text-xs sm:text-base shadow-lg shrink-0">
                        {getInitials(r.sender_username)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground text-xs sm:text-sm truncate">{r.sender_username}</h3>
                        <p className="text-[10px] sm:text-xs text-muted/40 truncate">Yêu cầu kết bạn gửi cho bạn</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full xs:w-auto shrink-0">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="flex-1 xs:flex-initial px-3 sm:px-5 py-1.5 sm:py-2 btn-anime rounded-lg text-xs font-bold"
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="flex-1 xs:flex-initial px-3 sm:px-5 py-1.5 sm:py-2 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg font-semibold text-xs transition-colors border border-indigo-500/10"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'sent' ? (
            
            /* Sent Requests Tab */
            <div className="space-y-2.5 sm:space-y-3">
              {sentRequests.length === 0 ? (
                <div className="glass-card p-10 rounded-xl text-center text-muted/50">
                  Bạn chưa gửi lời mời kết bạn nào đang chờ phản hồi.
                </div>
              ) : (
                sentRequests.map((r: any) => {
                  const targetUserId = r.friend_id || r.friendId;
                  const username = r.receiver_username || r.receiverUsername || 'Người dùng';
                  const avatarUrl = r.receiver_avatar_url || r.receiverAvatarUrl;
                  const email = r.receiver_email || r.receiverEmail;

                  return (
                    <div key={r.id} className="glass-card glass-card-hover p-3 sm:p-4 rounded-xl flex flex-col xs:flex-row xs:items-center justify-between gap-3 transition-all duration-300">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <Link href={`/profile/${targetUserId}`} className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-base shadow-lg">
                              {getInitials(username)}
                            </div>
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/profile/${targetUserId}`} className="font-bold text-foreground text-xs sm:text-sm hover:text-accent-primary transition-colors truncate block">
                            {username}
                          </Link>
                          <p className="text-[10px] sm:text-xs text-muted/40 truncate">
                            {email || "Đang chờ người dùng này chấp nhận lời mời"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full xs:w-auto shrink-0">
                        <Link
                          href={`/profile/${targetUserId}`}
                          className="flex-1 xs:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary rounded-lg font-bold text-xs transition-colors border border-indigo-500/10 text-center"
                        >
                          Trang cá nhân
                        </Link>
                        <button
                          onClick={() => handleCancelSentRequest(r.id, targetUserId)}
                          className="flex-1 xs:flex-initial px-3 sm:px-5 py-1.5 sm:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-bold text-xs transition-colors border border-red-500/20 cursor-pointer"
                        >
                          ✕ Hủy lời mời
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            
            /* Friends List Grid */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4">
              {friends.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center text-muted/50 col-span-full">
                  Bạn chưa kết nối với người bạn nào. Hãy gửi lời mời tới bạn bè nhé!
                </div>
              ) : (
                friends.map((user: any, idx: number) => (
                  <div key={user.id || idx} className="glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300">
                    
                    {/* Header Background */}
                    <div className="h-12 xs:h-16 sm:h-20 bg-gradient-to-r from-indigo-600/25 via-indigo-500/20 to-slate-500/15" />
                    
                    <div className="p-2.5 xs:p-3 sm:p-4 flex flex-col items-center text-center -mt-7 xs:-mt-8 sm:-mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center w-full min-w-0">
                        <Link href={`/profile/${user.id}`} className="relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 bg-background rounded-full p-0.5 sm:p-1 shadow-md mb-1.5 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-sm xs:text-lg sm:text-xl font-bold text-secondary">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-foreground text-xs xs:text-sm sm:text-[15px] hover:text-accent-primary transition-colors truncate max-w-full">
                          {user.username}
                        </Link>
                        <p className="text-[10px] xs:text-xs text-muted/40 truncate max-w-full mt-0.5 mb-2 sm:mb-3">{user.email}</p>
                      </div>

                      <div className="w-full space-y-1.5 sm:space-y-2">
                        <button 
                          onClick={() => router.push(`/profile/${user.id}`)}
                          className="w-full py-1.5 xs:py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-secondary font-bold rounded-lg text-[10px] xs:text-xs transition-colors border border-indigo-500/10"
                        >
                          Trang cá nhân
                        </button>
                        
                        {/* Unfriend button with confirmation */}
                        {confirmUnfriend === user.id ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUnfriend(user.id)}
                              className="flex-1 py-1.5 xs:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-[10px] xs:text-xs transition-colors border border-red-500/20"
                            >
                              ✓ Hủy
                            </button>
                            <button
                              onClick={() => setConfirmUnfriend(null)}
                              className="flex-1 py-1.5 xs:py-2 bg-black/5 dark:bg-white/5 text-muted/50 font-bold rounded-lg text-[10px] xs:text-xs transition-colors border border-indigo-500/10"
                            >
                              Đóng
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmUnfriend(user.id)}
                            className="w-full py-1 xs:py-1.5 hover:bg-red-500/10 text-muted/40 hover:text-red-400 font-semibold rounded-lg text-[10px] xs:text-xs transition-colors"
                          >
                            Hủy kết bạn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <FriendsContent />
    </Suspense>
  );
}
