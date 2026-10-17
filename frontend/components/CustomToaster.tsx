'use client';

import React from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

export default function CustomToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t} style={{ ...t.style, padding: 0 }}>
          {({ icon, message }) => (
            <div
              onClick={() => toast.dismiss(t.id)}
              className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-black/10 dark:shadow-black/50 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-w-[280px] max-w-md select-none"
            >
              {/* Status Icon */}
              <div className="shrink-0 flex items-center justify-center">
                {t.type === 'success' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {t.type === 'error' && (
                  <div className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {t.type === 'loading' && (
                  <div className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center text-xs animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </div>
                )}
                {t.type !== 'success' && t.type !== 'error' && t.type !== 'loading' && (
                  <div className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center text-xs">
                    {icon || <Info className="w-4 h-4" />}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                {message}
              </div>

              {/* Clickable Close Button */}
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1 shrink-0"
                  title="Đóng thông báo"
                  aria-label="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
