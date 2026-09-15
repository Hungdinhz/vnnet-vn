import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Conversation, ConversationMember } from '@/types/messages';

interface GroupInfoModalProps {
  conversation: Conversation | null;
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateConversation: (conv: Conversation) => void;
  onLeaveSuccess: () => void;
}

export default function GroupInfoModal({
  conversation,
  currentUser,
  isOpen,
  onClose,
  onUpdateConversation,
  onLeaveSuccess,
}: GroupInfoModalProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (showAddMembers) {
      api.get('/friends/list')
        .then((res) => setFriends(res.data || []))
        .catch((e) => console.error(e));
    }
  }, [showAddMembers]);

  if (!isOpen || !conversation) return null;

  const currentMember = conversation.members.find((m) => m.userId === currentUser?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const handleAddMembers = async () => {
    if (selectedFriendIds.length === 0) return;
    setLoadingAdd(true);
    try {
      const res = await api.post(`/conversations/${conversation.id}/members`, {
        memberIds: selectedFriendIds,
      });
      onUpdateConversation(res.data);
      setShowAddMembers(false);
      setSelectedFriendIds([]);
    } catch (err) {
      console.error('Lỗi thêm thành viên:', err);
      alert('Không thể thêm thành viên. Vui lòng thử lại!');
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await api.delete(`/conversations/${conversation.id}/members/${userId}`);
      const updatedMembers = conversation.members.filter((m) => m.userId !== userId);
      onUpdateConversation({ ...conversation, members: updatedMembers });
    } catch (err) {
      console.error('Lỗi xóa thành viên:', err);
      alert('Không thể xóa thành viên!');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Bạn có chắc chắn muốn rời nhóm này?')) return;
    try {
      await api.post(`/conversations/${conversation.id}/leave`);
      onLeaveSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi rời nhóm:', err);
      alert('Không thể rời nhóm!');
    }
  };

  const existingMemberIds = new Set(conversation.members.map((m) => m.userId));
  const candidateFriends = friends.filter((f) => {
    const friendUser = f.friend || f;
    return !existingMemberIds.has(friendUser.id);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md bg-[#130E26] border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-indigo-500/15 flex items-center justify-between">
          <h2 className="text-base font-bold gradient-text flex items-center gap-2">
            <span>⚙️</span> Cài đặt & Thông tin nhóm
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Group details */}
          <div className="flex flex-col items-center text-center pb-3 border-b border-indigo-500/10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-indigo-500/30 mb-2">
              {conversation.avatarUrl ? (
                <img src={conversation.avatarUrl} alt={conversation.name || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                '👥'
              )}
            </div>
            <h3 className="font-bold text-lg text-foreground">{conversation.name}</h3>
            <p className="text-xs text-muted/60 mt-0.5">{conversation.members.length} thành viên</p>
          </div>

          {/* Add member section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted/80">Thành viên</span>
              <button
                type="button"
                onClick={() => setShowAddMembers((prev) => !prev)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {showAddMembers ? 'Đóng' : '+ Thêm người'}
              </button>
            </div>

            {showAddMembers && (
              <div className="p-3 bg-black/20 rounded-xl border border-indigo-500/15 mb-3 space-y-2">
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {candidateFriends.length === 0 ? (
                    <p className="text-xs text-muted/40 text-center py-2">
                      Không còn bạn bè nào để thêm.
                    </p>
                  ) : (
                    candidateFriends.map((item) => {
                      const friend = item.friend || item;
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          onClick={() =>
                            setSelectedFriendIds((prev) =>
                              isSelected ? prev.filter((id) => id !== friend.id) : [...prev, friend.id]
                            )
                          }
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <span>{friend.username}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-indigo-500/30 text-indigo-500"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
                {candidateFriends.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddMembers}
                    disabled={loadingAdd || selectedFriendIds.length === 0}
                    className="w-full py-1.5 btn-anime text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    {loadingAdd ? 'Đang thêm...' : 'Xác nhận thêm'}
                  </button>
                )}
              </div>
            )}

            {/* Member list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {conversation.members.map((member) => {
                const isUser = member.userId === currentUser?.id;
                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/10 hover:bg-white/5 border border-indigo-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-indigo-500/20">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-indigo-600/30 text-secondary text-xs font-bold flex items-center justify-center">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-background" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <span>{member.username}</span>
                          {isUser && <span className="text-[10px] text-muted/50">(Bạn)</span>}
                        </div>
                        <span className="text-[10px] text-muted/50">
                          {member.role === 'ADMIN' ? '👑 Trưởng nhóm' : 'Thành viên'}
                        </span>
                      </div>
                    </div>

                    {/* Admin can remove others */}
                    {isAdmin && !isUser && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-xs text-red-400/80 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Xóa khỏi nhóm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave group */}
          <div className="pt-2 border-t border-indigo-500/10">
            <button
              onClick={handleLeaveGroup}
              className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>🚪</span> Rời khỏi nhóm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
