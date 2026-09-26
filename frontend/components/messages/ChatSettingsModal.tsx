import React, { useState, useEffect } from 'react';

export interface ChatSettings {
  soundEnabled: boolean;
  previewEnabled: boolean;
  onlineStatusEnabled: boolean;
  desktopNotificationEnabled: boolean;
  sendOnEnter: boolean;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  soundEnabled: true,
  previewEnabled: true,
  onlineStatusEnabled: true,
  desktopNotificationEnabled: false,
  sendOnEnter: true,
};

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onUpdateSettings: (newSettings: ChatSettings) => void;
}

export default function ChatSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: ChatSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setLocalSettings(settings);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof ChatSettings, val: boolean) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vnnet_chat_settings', JSON.stringify(updated));
    }
  };

  const handleRequestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        handleChange('desktopNotificationEnabled', true);
      } else {
        handleChange('desktopNotificationEnabled', false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h2 className="text-base font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <span>⚙️</span> Cài đặt tin nhắn
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-white/5">
          {/* Message Preview */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>💬</span> Xem trước nội dung tin nhắn
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hiển thị đoạn trích tin nhắn trong cửa sổ thông báo
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={localSettings.previewEnabled}
                onChange={(e) => handleChange('previewEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Desktop Push Notifications */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>🖥️</span> Thông báo trên màn hình
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hiển thị thông báo trên góc màn hình desktop ngay cả khi ẩn tab
              </p>
            </div>
            {notificationPermission === 'granted' ? (
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input
                  type="checkbox"
                  checked={localSettings.desktopNotificationEnabled}
                  onChange={(e) => handleChange('desktopNotificationEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            ) : (
              <button
                type="button"
                onClick={handleRequestDesktopPermission}
                className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-semibold border border-sky-500/30 whitespace-nowrap ml-3"
              >
                Cấp quyền
              </button>
            )}
          </div>

          {/* Send on Enter */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>⌨️</span> Gửi tin bằng phím Enter
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nhấn Enter để gửi tin, Shift + Enter để xuống dòng
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3">
              <input
                type="checkbox"
                checked={localSettings.sendOnEnter}
                onChange={(e) => handleChange('sendOnEnter', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/50 dark:bg-black/20 border-t border-slate-200/80 dark:border-indigo-500/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
