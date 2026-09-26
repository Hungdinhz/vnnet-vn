import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Conversation } from '@/types/messages';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversation: Conversation) => void;
}

interface FriendItem {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSelectedFriendIds([]);
    setName('');
    setSearch('');

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await api.get('/friends/list');
        const rawList = res.data || [];
        const normalized: FriendItem[] = rawList
          .map((f: any) => ({
            id: f.friend_id ?? f.friendId ?? f.friend?.id ?? f.user_id ?? f.id,
            username: f.friend_username ?? f.friendUsername ?? f.username ?? f.friend?.username ?? 'Bạn bè',
            avatarUrl: f.friend_avatar_url ?? f.friendAvatarUrl ?? f.avatarUrl ?? f.friend?.avatarUrl ?? null,
          }))
          .filter((f: FriendItem) => f.id != null);

        setFriends(normalized);
      } catch (err) {
        console.error('Lỗi lấy danh sách bạn bè:', err);
        setErrorMessage('Không thể tải danh sách bạn bè.');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectFriend = (id: number) => {
    setErrorMessage(null);
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên nhóm!');
      return;
    }
    if (selectedFriendIds.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.post('/conversations/group', {
        name: name.trim(),
        memberIds: selectedFriendIds,
      });
      onGroupCreated(res.data);
      onClose();
    } catch (err: any) {
      console.error('Lỗi tạo nhóm:', err);
      setErrorMessage(
        err.response?.data?.message || 'Không thể tạo nhóm. Vui lòng thử lại!'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h2 className="text-lg font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <span>👥</span> Tạo nhóm chat mới
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Error message banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Tên nhóm <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="VD: Nhóm bạn thân..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
              autoFocus
            />
          </div>

          {/* Search Friends */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Chọn thành viên ({selectedFriendIds.length} đã chọn)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-slate-600 rounded-xl text-xs mb-2.5 focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100"
            />

            {/* Selected chips preview */}
            {selectedFriendIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-600">
                {selectedFriendIds.map((id) => {
                  const friend = friends.find((f) => f.id === id);
                  if (!friend) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/15 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-medium border border-sky-500/20"
                    >
                      <span>{friend.username}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectFriend(id)}
                        className="hover:text-red-500 font-bold ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Friends list */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Đang tải danh sách bạn bè...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  {friends.length === 0
                    ? 'Bạn chưa có người bạn nào. Hãy kết bạn trước khi tạo nhóm!'
                    : 'Không tìm thấy bạn bè phù hợp.'}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleSelectFriend(friend.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
                              {friend.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {friend.username}
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || selectedFriendIds.length === 0}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 shadow-md"
            >
              {submitting ? 'Đang tạo...' : 'Tạo nhóm 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
