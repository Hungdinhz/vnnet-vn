import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/types/messages';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface DirectChatInfoModalProps {
  conversation: Conversation | null;
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onUpdateConversation?: (updated: Conversation) => void;
  onDeleteConversation?: (convId: number) => void;
}

export default function DirectChatInfoModal({
  conversation,
  currentUser,
  isOpen,
  onClose,
  onOpenSettings,
  onUpdateConversation,
  onDeleteConversation,
}: DirectChatInfoModalProps) {
  const router = useRouter();

  const partner = conversation?.members.find((m) => m.userId !== currentUser?.id);
  const partnerName = partner?.nickname || partner?.username || conversation?.name || 'Người dùng';
  const partnerAvatar = partner?.avatarUrl || conversation?.avatarUrl;
  const isOnline = partner?.isOnline;

  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(partner?.nickname || '');
  const [savingNick, setSavingNick] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (partner) {
      setNickInput(partner.nickname || '');
      setIsEditingNick(false);
    }
  }, [partner?.nickname]);

  if (!isOpen || !conversation) return null;

  const handleViewProfile = () => {
    onClose();
    const targetUserId = partner?.userId || (partner as any)?.id;
    if (targetUserId) {
      router.push(`/profile/${targetUserId}`);
    } else if (partner?.username) {
      router.push(`/profile/${partner.username}`);
    }
  };

  const handleSaveNickname = async () => {
    if (!partner) return;
    setSavingNick(true);
    try {
      const res = await api.put(`/conversations/${conversation.id}/members/${partner.userId}/nickname`, {
        nickname: nickInput.trim(),
      });
      if (onUpdateConversation) {
        onUpdateConversation(res.data);
      }
      setIsEditingNick(false);
    } catch (err) {
      console.error('Lỗi đặt biệt danh:', err);
    } finally {
      setSavingNick(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center sm:p-4 animate-fade-in">
      <div className="w-full h-full sm:h-auto sm:max-w-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-0 sm:border border-slate-200 dark:border-slate-700 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col sm:max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-base font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <span>⚙️</span> Cài đặt cuộc trò chuyện
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* User Profile Card */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-sky-400 shadow-md mb-2.5">
              {partnerAvatar ? (
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sky-500 text-white text-2xl font-bold flex items-center justify-center">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${
                  isOnline ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
              />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{partnerName}</h3>
            <p className="text-xs font-medium mt-0.5">
              {isOnline ? (
                <span className="text-emerald-500">Đang hoạt động</span>
              ) : (
                <span className="text-slate-400">Không hoạt động</span>
              )}
            </p>
          </div>

          {/* Nickname setting section */}
          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>🏷️</span> Biệt danh
              </span>
              {!isEditingNick && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNick(true);
                    setNickInput(partner?.nickname || '');
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline"
                >
                  {partner?.nickname ? 'Chỉnh sửa' : 'Đặt biệt danh'}
                </button>
              )}
            </div>

            {isEditingNick ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={nickInput}
                  onChange={(e) => setNickInput(e.target.value)}
                  placeholder="Nhập biệt danh..."
                  className="flex-1 px-3 py-1.5 border border-sky-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNickname();
                    if (e.key === 'Escape') setIsEditingNick(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveNickname}
                  disabled={savingNick}
                  className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {savingNick ? '...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNick(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {partner?.nickname ? (
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    "{partner.nickname}" <span className="font-normal text-slate-400">(@{partner.username})</span>
                  </span>
                ) : (
                  <span className="italic text-slate-400">Chưa đặt biệt danh cho người này</span>
                )}
              </div>
            )}
          </div>

          {/* Action List */}
          <div className="space-y-2">
            <button
              onClick={handleViewProfile}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              <span className="text-lg">👤</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Xem trang cá nhân
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đến trang cá nhân của {partnerName}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              <span className="text-lg">🔔</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Cài đặt thông báo & tin nhắn
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Âm thanh, xem trước và thông báo màn hình
                </div>
              </div>
            </button>

            {/* Delete Conversation Section */}
            {!isConfirmingDelete ? (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-left transition-colors border border-red-500/20 text-red-600 dark:text-red-400"
              >
                <span className="text-lg">🗑️</span>
                <div>
                  <div className="text-xs font-bold">
                    Xóa cuộc trò chuyện (ở phía bạn)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Xóa toàn bộ tin nhắn phía bạn. Đối phương vẫn giữ cuộc trò chuyện.
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl space-y-2.5 animate-scale-up">
                <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span>⚠️</span> Xác nhận xóa cuộc trò chuyện?
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Toàn bộ tin nhắn trước đây sẽ bị xóa ở phía bạn (đối phương vẫn còn). Nếu sau này bạn hoặc đối phương gửi tin nhắn mới, cuộc trò chuyện sẽ tự động xuất hiện lại.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={async () => {
                      if (!conversation) return;
                      setIsDeleting(true);
                      try {
                        if (onDeleteConversation) {
                          onDeleteConversation(conversation.id);
                        } else {
                          await api.delete(`/conversations/${conversation.id}`);
                        }
                        onClose();
                      } catch (err) {
                        console.error('Lỗi xóa cuộc trò chuyện:', err);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa phía tôi'}
                  </button>
                </div>
              </div>
            )}

            {/* Block User Section */}
            {!isConfirmingBlock ? (
              <button
                onClick={() => setIsConfirmingBlock(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-left transition-colors border border-red-500/20 text-red-600 dark:text-red-400"
              >
                <span className="text-lg">🚫</span>
                <div>
                  <div className="text-xs font-bold">
                    Chặn người dùng này
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Không hiển thị bài viết, tin nhắn và thông tin của người này với bạn nữa.
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl space-y-2.5 animate-scale-up">
                <div className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span>🚫</span> Xác nhận chặn {partnerName}?
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Khi chặn, đối phương sẽ không thể gửi tin nhắn cho bạn và toàn bộ nội dung của hai bên sẽ bị ẩn đối với nhau.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    disabled={isBlocking}
                    onClick={() => setIsConfirmingBlock(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isBlocking}
                    onClick={async () => {
                      if (!partner) return;
                      setIsBlocking(true);
                      try {
                        await api.post(`/users/${partner.userId}/block`);
                        toast.success(`Đã chặn ${partnerName}`);
                        if (onDeleteConversation && conversation) {
                          onDeleteConversation(conversation.id);
                        }
                        onClose();
                      } catch (err: any) {
                        toast.error(err.response?.data?.detail || 'Không thể chặn người dùng.');
                      } finally {
                        setIsBlocking(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isBlocking ? 'Đang chặn...' : 'Xác nhận chặn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
