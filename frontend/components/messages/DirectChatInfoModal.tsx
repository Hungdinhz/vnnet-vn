import React from 'react';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/types/messages';

interface DirectChatInfoModalProps {
  conversation: Conversation | null;
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function DirectChatInfoModal({
  conversation,
  currentUser,
  isOpen,
  onClose,
  onOpenSettings,
}: DirectChatInfoModalProps) {
  const router = useRouter();

  if (!isOpen || !conversation) return null;

  const partner = conversation.members.find((m) => m.userId !== currentUser?.id);
  const partnerName = partner?.username || conversation.name || 'Người dùng';
  const partnerAvatar = partner?.avatarUrl || conversation.avatarUrl;
  const isOnline = partner?.isOnline;

  const handleViewProfile = () => {
    onClose();
    if (partner?.username) {
      router.push(`/profile/${partner.username}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
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
