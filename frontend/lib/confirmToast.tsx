'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

interface ConfirmToastOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'danger' | 'success' | 'primary';
}

/**
 * Hiển thị toast tương tác đẹp mắt với các nút bấm Xác nhận / Hủy
 */
export function showConfirmToast({
  title = 'Xác nhận hành động',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ConfirmToastOptions) {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up opacity-100 scale-100' : 'opacity-0 scale-95'
        } transition-all duration-200 w-full max-w-sm p-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl space-y-3 pointer-events-auto`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/15 text-rose-500'
                : variant === 'success'
                ? 'bg-emerald-500/15 text-emerald-500'
                : 'bg-sky-500/15 text-sky-400'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-4 h-4" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              if (onCancel) onCancel();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              await onConfirm();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'btn-anime shadow-sky-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: 'top-center',
    }
  );
}
