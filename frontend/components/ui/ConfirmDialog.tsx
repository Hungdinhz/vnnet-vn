'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'success' | 'warning' | 'primary';
  icon?: React.ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDestructive = false,
  variant,
  icon,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actualVariant = variant || (isDestructive ? 'danger' : 'primary');

  const getVariantStyles = () => {
    switch (actualVariant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/15 text-rose-500 border border-rose-500/30',
          defaultIcon: <Trash2 className="w-6 h-6" />,
          btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
          defaultIcon: <CheckCircle2 className="w-6 h-6" />,
          btnConfirm: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
          btnConfirm: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30',
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-sky-500/15 text-sky-500 border border-sky-500/30',
          defaultIcon: <HelpCircle className="w-6 h-6" />,
          btnConfirm: 'btn-anime shadow-lg shadow-sky-500/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5 sm:p-6 space-y-4 animate-scale-up">
        {/* Header with Icon Badge & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
              {icon || styles.defaultIcon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${styles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
