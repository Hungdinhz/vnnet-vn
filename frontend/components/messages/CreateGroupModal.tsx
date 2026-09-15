import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Conversation } from '@/types/messages';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversation: Conversation) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await api.get('/friends/list');
        setFriends(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách bạn bè:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectFriend = (id: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFriends = friends.filter((f) => {
    const friendUser = f.friend || f;
    return friendUser.username?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên nhóm!');
      return;
    }
    if (selectedFriendIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/conversations/group', {
        name: name.trim(),
        memberIds: selectedFriendIds,
      });
      onGroupCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Lỗi tạo nhóm:', err);
      alert('Không thể tạo nhóm. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md bg-[#130E26] border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-indigo-500/15 flex items-center justify-between">
          <h2 className="text-lg font-bold gradient-text flex items-center gap-2">
            <span>👥</span> Tạo nhóm chat mới
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-semibold text-muted/80 mb-1">
              Tên nhóm <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hội Weeb VNNet..."
              className="w-full px-3.5 py-2.5 input-anime rounded-xl text-sm"
              autoFocus
            />
          </div>

          {/* Search Friends */}
          <div>
            <label className="block text-xs font-semibold text-muted/80 mb-1">
              Thêm thành viên ({selectedFriendIds.length} đã chọn)
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              className="w-full px-3.5 py-2 input-anime rounded-xl text-xs mb-2"
            />

            {/* Friends list */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <div className="text-center py-4 text-xs text-muted/50">
                  Đang tải danh sách bạn bè...
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted/40">
                  Không tìm thấy bạn bè nào.
                </div>
              ) : (
                filteredFriends.map((item) => {
                  const friend = item.friend || item;
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleSelectFriend(friend.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/20 border border-indigo-500/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/20 flex-shrink-0">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-indigo-600/30 text-secondary text-xs font-bold flex items-center justify-center">
                              {friend.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {friend.username}
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-indigo-500/40 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-500/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-white rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || selectedFriendIds.length === 0}
              className="px-5 py-2 btn-anime text-sm font-bold rounded-xl disabled:opacity-50 shadow-md"
            >
              {submitting ? 'Đang tạo...' : 'Tạo nhóm 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
