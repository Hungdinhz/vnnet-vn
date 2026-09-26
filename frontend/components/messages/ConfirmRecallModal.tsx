import React from 'react';
import { ChatMessage } from '@/types/messages';

interface ConfirmRecallModalProps {
  message: ChatMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (messageId: number) => void;
  isProcessing?: boolean;
}

export default function ConfirmRecallModal({
  message,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: ConfirmRecallModalProps) {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xl animate-scale-up text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center text-xl flex-shrink-0">
            🗑️
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Thu hồi tin nhắn?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hành động này không thể hoàn tác
            </p>
          </div>
        </div>

        {/* Message preview snippet */}
        <div className="my-3 p-3 bg-slate-100 dark:bg-black/30 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
          <span className="font-semibold text-sky-600 dark:text-sky-400 block mb-0.5">
            Tin nhắn của bạn:
          </span>
          <p className="italic text-slate-700 dark:text-slate-300 line-clamp-2">
            {message.content ? `"${message.content}"` : message.fileName ? `📎 [File] ${message.fileName}` : '[Hình ảnh]'}
          </p>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Tin nhắn sẽ bị gỡ bỏ với tất cả mọi người trong cuộc trò chuyện này.
        </p>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(message.id)}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-md shadow-red-500/20 transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Đang thu hồi...' : 'Thu hồi tin nhắn'}
          </button>
        </div>
      </div>
    </div>
  );
}
