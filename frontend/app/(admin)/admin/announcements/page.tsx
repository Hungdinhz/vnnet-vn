'use client';

import React, { useState } from 'react';
import { Megaphone, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';

export default function AdminAnnouncementsPage() {
  const [message, setMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isGlobal = !targetUserId.trim();
    const ok = confirm(
      isGlobal
        ? 'Xác nhận phát thông báo tới TOÀN BỘ người dùng đang hoạt động?'
        : `Xác nhận gửi thông báo trực tiếp tới người dùng #${targetUserId}?`
    );
    if (!ok) return;

    setSending(true);
    try {
      const res = await adminApi.post('/admin/announcements/broadcast', {
        message: message.trim(),
        target_user_id: isGlobal ? null : Number(targetUserId.trim()),
      });
      toast.success(res.data.message || 'Đã gửi thông báo thành công.');
      setMessage('');
      setTargetUserId('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Không thể gửi thông báo (chỉ ADMIN/SUPER_ADMIN được phép).';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-indigo-400" /> Thông báo Hệ thống
        </h1>
        <p className="text-sm text-slate-400">
          Gửi thông báo toàn hệ thống (bất đồng bộ) hoặc cảnh cáo trực tiếp tới 1 người dùng cụ thể
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4"
      >
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Mọi thông báo phát đi đều được ghi vĩnh viễn vào <strong>Nhật ký Kiểm toán</strong>.
            Để trống ô User ID nếu muốn phát cho toàn bộ người dùng ACTIVE.
          </span>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            ID người nhận (tùy chọn — bỏ trống để phát toàn hệ thống)
          </label>
          <input
            type="number"
            min={1}
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Ví dụ: 42"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Nội dung thông báo
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo bảo trì, cập nhật chính sách hoặc cảnh cáo..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Đang gửi...' : 'Phát thông báo'}
        </button>
      </form>
    </div>
  );
}
