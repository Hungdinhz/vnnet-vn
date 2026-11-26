'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Flag, CheckCircle2, EyeOff, Ban, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminReportItem, SpringPage } from '@/types/admin';

export default function AdminReportsPage() {
  const { admin } = useAdminAuth();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<AdminReportItem | null>(null);
  const [action, setAction] = useState('HIDE_CONTENT');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (targetFilter) params.set('targetType', targetFilter);
      const res = await adminApi.get<SpringPage<AdminReportItem>>(`/admin/reports?${params}`);
      setReports(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Không thể tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, targetFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolving) return;
    setBusy(true);
    try {
      await adminApi.post(`/admin/reports/${resolving.id}/resolve`, {
        action,
        resolution_note: note,
        suspend_hours: 24,
      });
      toast.success(`Đã xử lý báo cáo #${resolving.id} (${action})`);
      setResolving(null);
      setNote('');
      loadReports();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Không thể xử lý báo cáo.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const canHardActions = admin?.role === 'ADMIN' || admin?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hàng đợi Báo cáo Vi phạm</h1>
          <p className="text-sm text-slate-400">
            Xử lý tập trung các báo cáo từ cộng đồng — tự động đóng các báo cáo trùng lặp
          </p>
        </div>
        <button
          onClick={loadReports}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">PENDING (Chờ xử lý)</option>
          <option value="RESOLVED">RESOLVED (Đã xử lý)</option>
          <option value="DISMISSED">DISMISSED (Bác bỏ)</option>
        </select>

        <select
          value={targetFilter}
          onChange={(e) => {
            setPage(0);
            setTargetFilter(e.target.value);
          }}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">Tất cả đối tượng</option>
          <option value="POST">Bài viết (POST)</option>
          <option value="COMMENT">Bình luận (COMMENT)</option>
          <option value="USER">Người dùng (USER)</option>
          <option value="GROUP">Hội nhóm (GROUP)</option>
          <option value="MARKETPLACE_ITEM">Chợ (MARKETPLACE_ITEM)</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-500 text-sm">
            Đang tải báo cáo...
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-500 text-sm">
            Không có báo cáo nào phù hợp bộ lọc.
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    <Flag className="h-3 w-3" /> {r.reason_category}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {r.target_type} #{r.target_id}
                  </span>
                  <span className="text-slate-400">
                    Báo cáo bởi <strong>@{r.reporter_username}</strong> ·{' '}
                    {new Date(r.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-white font-medium break-words">{r.target_preview}</p>
                {r.description && (
                  <p className="text-xs text-slate-400">Mô tả: {r.description}</p>
                )}
                {r.action_taken && (
                  <p className="text-xs text-emerald-400">
                    Đã xử lý: {r.action_taken} {r.resolution_note ? `— ${r.resolution_note}` : ''}
                  </p>
                )}
              </div>

              {r.status === 'PENDING' ? (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setResolving(r);
                      setAction(r.target_type === 'USER' ? 'SUSPEND_USER' : 'HIDE_CONTENT');
                      setNote('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Xử lý
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-400 shrink-0">
                  {r.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Trước
          </button>
          <span className="text-slate-400">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}

      {resolving && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleResolve}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-white">Xử lý báo cáo #{resolving.id}</h3>
            <p className="text-xs text-slate-400">{resolving.target_preview}</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Hành động</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="DISMISS">Bác bỏ báo cáo (Không vi phạm)</option>
                {resolving.target_type !== 'USER' && (
                  <option value="HIDE_CONTENT">Ẩn nội dung vi phạm (Soft-hide)</option>
                )}
                {resolving.target_type !== 'USER' && canHardActions && (
                  <option value="DELETE_CONTENT">Xóa vĩnh viễn nội dung</option>
                )}
                <option value="WARN_USER">Gửi cảnh cáo tới người đăng</option>
                <option value="SUSPEND_USER">Tạm khóa tài khoản người đăng (24 giờ)</option>
                {canHardActions && (
                  <option value="BAN_USER">Khóa vĩnh viễn tài khoản người đăng</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ghi chú xử lý</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú lý do xử lý (lưu vào Audit Log)..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolving(null)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs bg-slate-800 text-slate-300 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" /> Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
              >
                {action.includes('BAN') ? (
                  <Ban className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                Thực thi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
