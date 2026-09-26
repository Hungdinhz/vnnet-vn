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

interface FriendItem {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export default function GroupInfoModal({
  conversation,
  currentUser,
  isOpen,
  onClose,
  onUpdateConversation,
  onLeaveSuccess,
}: GroupInfoModalProps) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(conversation?.name || '');
  const [savingName, setSavingName] = useState(false);

  // In-modal confirmation state (NO window.confirm!)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'REMOVE' | 'LEAVE';
    userId?: number;
    username?: string;
  } | null>(null);

  useEffect(() => {
    if (conversation) {
      setEditName(conversation.name || '');
      setIsEditingName(false);
    }
  }, [conversation]);

  useEffect(() => {
    if (showAddMembers) {
      api.get('/friends/list')
        .then((res) => {
          const raw = res.data || [];
          const normalized: FriendItem[] = raw
            .map((f: any) => ({
              id: f.friend_id ?? f.friendId ?? f.friend?.id ?? f.user_id ?? f.id,
              username: f.friend_username ?? f.friendUsername ?? f.username ?? f.friend?.username ?? 'Bạn bè',
              avatarUrl: f.friend_avatar_url ?? f.friendAvatarUrl ?? f.avatarUrl ?? f.friend?.avatarUrl ?? null,
            }))
            .filter((f: FriendItem) => f.id != null);
          setFriends(normalized);
        })
        .catch((e) => console.error(e));
    }
  }, [showAddMembers]);

  if (!isOpen || !conversation) return null;

  const currentMember = conversation.members.find((m) => m.userId === currentUser?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const handleRenameGroup = async () => {
    if (!editName.trim() || editName.trim() === conversation?.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await api.put(`/conversations/${conversation.id}`, {
        name: editName.trim(),
      });
      onUpdateConversation(res.data);
      setIsEditingName(false);
    } catch (err) {
      console.error('Lỗi đổi tên nhóm:', err);
      setErrorMessage('Không thể đổi tên nhóm!');
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedFriendIds.length === 0) return;
    setLoadingAdd(true);
    setErrorMessage(null);
    try {
      const res = await api.post(`/conversations/${conversation.id}/members`, {
        memberIds: selectedFriendIds,
      });
      onUpdateConversation(res.data);
      setShowAddMembers(false);
      setSelectedFriendIds([]);
    } catch (err: any) {
      console.error('Lỗi thêm thành viên:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể thêm thành viên. Vui lòng thử lại!');
    } finally {
      setLoadingAdd(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'REMOVE' && confirmAction.userId) {
      try {
        await api.delete(`/conversations/${conversation.id}/members/${confirmAction.userId}`);
        const updatedMembers = conversation.members.filter((m) => m.userId !== confirmAction.userId);
        onUpdateConversation({ ...conversation, members: updatedMembers });
        setConfirmAction(null);
      } catch (err) {
        console.error('Lỗi xóa thành viên:', err);
        setErrorMessage('Không thể xóa thành viên!');
      }
    } else if (confirmAction.type === 'LEAVE') {
      try {
        await api.post(`/conversations/${conversation.id}/leave`);
        setConfirmAction(null);
        onLeaveSuccess();
        onClose();
      } catch (err) {
        console.error('Lỗi rời nhóm:', err);
        setErrorMessage('Không thể rời nhóm!');
      }
    }
  };

  const existingMemberIds = new Set(conversation.members.map((m) => m.userId));
  const candidateFriends = friends.filter((f) => !existingMemberIds.has(f.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h2 className="text-base font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <span>⚙️</span> Cài đặt & Thành viên nhóm
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Error banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Inline Confirmation Card (if any active) */}
          {confirmAction && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl text-xs space-y-2.5 animate-scale-up">
              <div className="font-bold text-red-600 dark:text-red-400 text-sm flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  {confirmAction.type === 'LEAVE'
                    ? 'Xác nhận rời khỏi nhóm?'
                    : `Xác nhận xóa ${confirmAction.username || 'thành viên'}?`}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {confirmAction.type === 'LEAVE'
                  ? 'Bạn sẽ không thể xem hoặc nhận tin nhắn mới từ nhóm này nữa.'
                  : 'Thành viên này sẽ bị xóa khỏi nhóm và không thể tiếp tục trò chuyện.'}
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={executeConfirmAction}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          )}

          {/* Group details */}
          <div className="flex flex-col items-center text-center pb-3 border-b border-slate-200/80 dark:border-slate-600">
            <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-slate-200 dark:border-slate-600 mb-2">
              {conversation.avatarUrl ? (
                <img src={conversation.avatarUrl} alt={conversation.name || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                '👥'
              )}
            </div>
            
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1.5 border border-sky-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameGroup();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <button
                  onClick={handleRenameGroup}
                  disabled={savingName}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 text-sm font-bold"
                >
                  {savingName ? '...' : '✓'}
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setEditName(conversation?.name || ''); }}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <h3
                className="font-bold text-lg text-slate-900 dark:text-white cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-1.5"
                onClick={() => setIsEditingName(true)}
                title="Nhấn để đổi tên nhóm"
              >
                {conversation.name}
                <span className="text-xs text-slate-400">✏️</span>
              </h3>
            )}
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{conversation.members.length} thành viên</p>
          </div>

          {/* Add member section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Thành viên ({conversation.members.length})</span>
              <button
                type="button"
                onClick={() => setShowAddMembers((prev) => !prev)}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 font-bold"
              >
                {showAddMembers ? 'Đóng' : '+ Thêm người'}
              </button>
            </div>

            {showAddMembers && (
              <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-sky-500/15 mb-3 space-y-2">
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {candidateFriends.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Không còn bạn bè nào để thêm.
                    </p>
                  ) : (
                    candidateFriends.map((friend) => {
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          onClick={() =>
                            setSelectedFriendIds((prev) =>
                              isSelected ? prev.filter((id) => id !== friend.id) : [...prev, friend.id]
                            )
                          }
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 cursor-pointer text-xs"
                        >
                          <span className="text-slate-800 dark:text-slate-200">{friend.username}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 dark:border-sky-500/30 text-sky-600"
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
                    className="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg disabled:opacity-50"
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
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-black/10 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/60 dark:border-sky-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-sky-500/20">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-sky-600/30 text-sky-500 dark:text-secondary text-xs font-bold flex items-center justify-center">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white dark:border-background" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{member.username}</span>
                          {isUser && <span className="text-[10px] text-slate-400">(Bạn)</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {member.role === 'ADMIN' ? '👑 Trưởng nhóm' : 'Thành viên'}
                        </span>
                      </div>
                    </div>

                    {/* Admin can remove others */}
                    {isAdmin && !isUser && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'REMOVE',
                            userId: member.userId,
                            username: member.username,
                          })
                        }
                        className="text-xs text-red-500/80 hover:text-red-600 dark:hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors font-bold"
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

          {/* Leave group button */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setConfirmAction({ type: 'LEAVE' })}
              className="w-full py-2.5 rounded-xl border border-red-400/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>🚪</span> Rời khỏi nhóm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
