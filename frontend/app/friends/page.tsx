// app/friends/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';

export default function FriendsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'requests' | 'list'>('suggestions');
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load data for the active tab
    if (activeTab === 'suggestions') fetchSuggestedUsers();
    if (activeTab === 'requests') fetchPendingRequests();
    if (activeTab === 'list') fetchFriendsList();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchSuggestedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setSuggestedUsers(res.data || []);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
      alert(error.response?.data?.detail || 'Không thể tải danh sách người dùng.');
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
      alert(error.response?.data?.detail || 'Không thể tải lời mời.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriendsList = async () => {
    setIsLoading(true);
    try {
      // Lấy danh sách friendships rồi map sang user info của người bạn
      const [friendsRes, meRes] = await Promise.all([api.get('/friends/list'), api.get('/users/me')]);
      const friendships = Array.isArray(friendsRes.data) ? friendsRes.data : [];
      const me = meRes.data;

      if (!me || !me.id) {
        console.error('Không lấy được thông tin user hiện tại:', meRes);
        alert('Không thể xác thực người dùng. Vui lòng đăng nhập lại.');
        setFriends([]);
        setIsLoading(false);
        return;
      }

      const friendIds = friendships.map((f: any) => (f.user_id === me.id ? f.friend_id : f.user_id));
      // Chuẩn hóa và loại bỏ ID không hợp lệ (undefined, null, NaN, ...)
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
              console.error(`Không lấy được user ${id}:`, err?.response?.data || err);
              return null;
            })
        );

        const details = await Promise.all(detailsPromises);
        setFriends(details.filter(Boolean));
      }
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách bạn bè:', error);
      alert(error.response?.data?.detail || 'Không thể tải danh sách bạn bè.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.post(`/friends/request/${friendId}`);
      alert('Đã gửi lời mời kết bạn thành công!');
      setSuggestedUsers(prev => prev.filter(u => u.id !== friendId));
    } catch (error: any) {
      console.error('Lỗi kết bạn:', error);
      alert(error.response?.data?.detail || 'Không thể gửi lời mời lúc này.');
    }
  };

  const handleAccept = async (requestId: number) => {
    try {
      await api.post(`/friends/accept/${requestId}`);
      alert('Đã chấp nhận lời mời.');
      // Refresh lists
      fetchPendingRequests();
      fetchFriendsList();
    } catch (error: any) {
      console.error('Lỗi khi chấp nhận lời mời:', error);
      alert(error.response?.data?.detail || 'Không thể chấp nhận lời mời.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />

        <main className="flex-1 p-6 max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Mạng lưới bạn bè</h1>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`${activeTab === 'suggestions' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded-lg font-medium shadow-sm`}
              >
                Gợi ý
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded-lg font-medium shadow-sm`}
              >
                Lời mời
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded-lg font-medium shadow-sm`}
              >
                Danh sách
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'suggestions' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedUsers.length === 0 ? (
                <p className="text-gray-500 col-span-full">Chưa có gợi ý bạn bè nào mới.</p>
              ) : (
                suggestedUsers.map((user, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mb-3 shadow-sm">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className="w-full py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      Thêm bạn bè
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'requests' ? (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500">Bạn không có lời mời nào đang chờ.</p>
              ) : (
                pendingRequests.map((r: any) => (
                  <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{r.sender_username}</h3>
                      <p className="text-sm text-gray-500">Yêu cầu kết bạn</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-sm"
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => alert('Từ chối chức năng chưa triển khai')}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.length === 0 ? (
                <p className="text-gray-500 col-span-full">Bạn chưa có bạn bè nào.</p>
              ) : (
                friends.map((user: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full text-white flex items-center justify-center text-2xl font-bold mb-3 shadow-sm">
                      {(user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                    <button className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg">Xem trang cá nhân</button>
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