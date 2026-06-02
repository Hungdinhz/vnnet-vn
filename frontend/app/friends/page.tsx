// app/friends/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
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
      alert('Đã gửi lời mời kết bạn thành công!');
      setRequestedUserIds(prev => new Set(prev).add(friendId));
    } catch (error: any) {
      console.error('Lỗi kết bạn:', error);
      alert(error.response?.data?.detail || 'Không thể gửi lời mời kết bạn.');
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      alert('Đã chấp nhận lời mời kết bạn!');
      fetchPendingRequests();
      fetchFriendsList();
    } catch (error: any) {
      console.error('Lỗi chấp nhận lời mời:', error);
      alert(error.response?.data?.detail || 'Không thể chấp nhận lời mời.');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />

        <main className="flex-1 py-4 md:py-6 max-w-4xl mx-auto">
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">Bạn bè</h1>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'suggestions' 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Gợi ý kết bạn
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none relative ${
                  activeTab === 'requests' 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Lời mời kết bạn
                {pendingRequests.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'list' 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tất cả bạn bè
              </button>
            </div>
          </div>

          {/* Loader or Content */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 bg-white rounded-xl border shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'suggestions' ? (
            
            /* Suggestions Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {suggestedUsers.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border text-center text-gray-500 col-span-full shadow-sm">
                  Chưa có gợi ý bạn bè nào mới dành cho bạn.
                </div>
              ) : (
                suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    
                    {/* Fake Header Background */}
                    <div className="h-20 bg-gradient-to-r from-blue-400 to-indigo-500" />
                    
                    <div className="p-4 flex flex-col items-center text-center -mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center">
                        <Link href={`/profile/${user.id}`} className="relative w-16 h-16 bg-white rounded-full p-1 shadow-md mb-2 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-gray-900 text-[15px] hover:text-blue-600 hover:underline">
                          {user.username}
                        </Link>
                        <p className="text-xs text-gray-500 truncate max-w-[180px] mt-0.5 mb-4">{user.email}</p>
                      </div>

                      {requestedUserIds.has(user.id) ? (
                        <button
                          disabled
                          className="w-full py-2 bg-gray-200 text-gray-500 font-bold rounded-lg text-xs shadow-sm transition-colors border cursor-not-allowed"
                        >
                          Đã gửi yêu cầu
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors border-b border-blue-800"
                        >
                          Thêm bạn bè
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
                <div className="bg-white p-10 rounded-xl border text-center text-gray-500 shadow-sm">
                  Bạn không có lời mời kết bạn nào đang chờ.
                </div>
              ) : (
                pendingRequests.map((r: any) => (
                  <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full text-white flex items-center justify-center font-bold shadow-sm">
                        {getInitials(r.sender_username)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{r.sender_username}</h3>
                        <p className="text-xs text-gray-500">Yêu cầu kết bạn gửi cho bạn</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => alert('Từ chối lời mời này')}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
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
                <div className="bg-white p-8 rounded-xl border text-center text-gray-500 col-span-full shadow-sm">
                  Bạn chưa kết nối với người bạn nào. Hãy gửi lời mời tới bạn bè nhé!
                </div>
              ) : (
                friends.map((user: any, idx: number) => (
                  <div key={user.id || idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    
                    {/* Fake Header Background */}
                    <div className="h-20 bg-gradient-to-r from-teal-400 to-blue-500" />
                    
                    <div className="p-4 flex flex-col items-center text-center -mt-10 flex-1 justify-between">
                      <div className="flex flex-col items-center">
                        <Link href={`/profile/${user.id}`} className="relative w-16 h-16 bg-white rounded-full p-1 shadow-md mb-2 hover:opacity-90 transition-opacity">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                              {getInitials(user.username)}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="font-bold text-gray-900 text-[15px] hover:text-blue-600 hover:underline">
                          {user.username}
                        </Link>
                        <p className="text-xs text-gray-500 truncate max-w-[180px] mt-0.5 mb-4">{user.email}</p>
                      </div>

                      <button 
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors border"
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <FriendsContent />
    </Suspense>
  );
}