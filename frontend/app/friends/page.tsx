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

  const [activeTab, setActiveTab] = useState<'suggestions' | 'requests' | 'list'>('suggestions');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Read tab parameter if present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests' || tabParam === 'suggestions' || tabParam === 'list') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (activeTab === 'suggestions') fetchSuggestedUsers();
    if (activeTab === 'requests') fetchPendingRequests();
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

      const friendIds = friendships.map((f: any) => (f.user_id === me.id ? f.friend_id : f.user_id));
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
    } catch (error: any) {
      console.error('Lỗi kết bạn:', error);
      toast.error(error.response?.data?.detail || 'Không thể gửi lời mời kết bạn.');
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
          
          <div className="glass-card rounded-xl p-4 mb-4">
            <h1 className="text-2xl font-extrabold gradient-text mb-4 tracking-tight">Bạn bè</h1>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-purple-500/10 pb-2">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'suggestions' 
                    ? 'bg-purple-500/15 text-accent-purple shadow-sm' 
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-accent-purple'
                }`}
              >
                ✨ Gợi ý kết bạn
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none relative ${
                  activeTab === 'requests' 
                    ? 'bg-purple-500/15 text-accent-purple shadow-sm' 
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-accent-purple'
                }`}
              >
                📩 Lời mời kết bạn
                {pendingRequests.length > 0 && (
                  <span className="ml-1.5 badge-anime">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'list' 
                    ? 'bg-purple-500/15 text-accent-purple shadow-sm' 
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 hover:text-accent-purple'
                }`}
              >
                💫 Tất cả bạn bè
              </button>
            </div>
          </div>

          {/* Loader or Content */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 glass-card rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : activeTab === 'suggestions' ? (
            
            /* Suggestions Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestedUsers.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center text-muted/50 col-span-full">
                  Chưa có gợi ý bạn bè nào mới dành cho bạn.
                </div>
              ) : (
                suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300">
                    
                    {/* Header Background */}
                    <div className="h-20 bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-cyan-500/20" />
                    
                    <div className="p-4 flex flex-col items-center text-center -mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center">
                        <Link href={`/profile/${user.id}`} className="relative w-16 h-16 bg-background rounded-full p-1 shadow-md mb-2 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full flex items-center justify-center text-xl font-bold text-secondary">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-foreground text-[15px] hover:text-pink-300 transition-colors">
                          {user.username}
                        </Link>
                        <p className="text-xs text-muted/40 truncate max-w-[180px] mt-0.5 mb-4">{user.email}</p>
                      </div>

                      {requestedUserIds.has(user.id) ? (
                        <button
                          disabled
                          className="w-full py-2 bg-black/5 dark:bg-white/5 text-muted/50 font-bold rounded-lg text-xs shadow-sm transition-colors border border-purple-500/10 cursor-not-allowed"
                        >
                          Đã gửi yêu cầu
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="w-full py-2 btn-anime rounded-lg text-xs shadow-sm"
                        >
                          ✨ Thêm bạn bè
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'requests' ? (
            
            /* Requests Tab */
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="glass-card p-10 rounded-xl text-center text-muted/50">
                  Bạn không có lời mời kết bạn nào đang chờ.
                </div>
              ) : (
                pendingRequests.map((r: any) => (
                  <div key={r.id} className="glass-card glass-card-hover p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold shadow-lg">
                        {getInitials(r.sender_username)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{r.sender_username}</h3>
                        <p className="text-xs text-muted/40">Yêu cầu kết bạn gửi cho bạn</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="px-5 py-2 btn-anime rounded-lg text-xs"
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => toast.success('Đã từ chối lời mời này')}
                        className="px-5 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 text-accent-purple/70 rounded-lg font-semibold text-xs transition-colors border border-purple-500/10"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            
            /* Friends List Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {friends.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center text-muted/50 col-span-full">
                  Bạn chưa kết nối với người bạn nào. Hãy gửi lời mời tới bạn bè nhé!
                </div>
              ) : (
                friends.map((user: any, idx: number) => (
                  <div key={user.id || idx} className="glass-card glass-card-hover rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300">
                    
                    {/* Header Background */}
                    <div className="h-20 bg-gradient-to-r from-cyan-600/30 via-purple-500/30 to-pink-500/20" />
                    
                    <div className="p-4 flex flex-col items-center text-center -mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center">
                        <Link href={`/profile/${user.id}`} className="relative w-16 h-16 bg-background rounded-full p-1 shadow-md mb-2 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/50 to-cyan-500/50 rounded-full flex items-center justify-center text-xl font-bold text-secondary">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-foreground text-[15px] hover:text-pink-300 transition-colors">
                          {user.username}
                        </Link>
                        <p className="text-xs text-muted/40 truncate max-w-[180px] mt-0.5 mb-4">{user.email}</p>
                      </div>

                      <button 
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="w-full py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 text-secondary font-bold rounded-lg text-xs transition-colors border border-purple-500/10"
                      >
                        Xem trang cá nhân
                      </button>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <FriendsContent />
    </Suspense>
  );
}
