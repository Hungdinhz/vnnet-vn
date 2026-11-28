'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { AdminAuditLogItem, SpringPage } from '@/types/admin';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '25' });
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      if (targetFilter) params.set('targetType', targetFilter);
      const res = await adminApi.get<SpringPage<AdminAuditLogItem>>(`/admin/audit-logs?${params}`);
      setLogs(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Không thể tải nhật ký kiểm toán.');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Nhật ký Kiểm toán (Audit Log)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bản ghi bất biến (append-only) lưu vết toàn bộ thao tác của đội ngũ quản trị
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={actionFilter}
          onChange={(e) => {
            setPage(0);
            setActionFilter(e.target.value);
          }}
          placeholder="Lọc mã hành động (VD: USER_STATUS_BANNED, POST_HIDDEN)..."
          className="flex-1 min-w-[260px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
        <select
          value={targetFilter}
          onChange={(e) => {
            setPage(0);
            setTargetFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">Tất cả đối tượng</option>
          <option value="ADMIN_SESSION">ADMIN_SESSION</option>
          <option value="USER">USER</option>
          <option value="POST">POST</option>
          <option value="GROUP">GROUP</option>
          <option value="MARKETPLACE_ITEM">MARKETPLACE_ITEM</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3.5">Thời gian</th>
              <th className="px-4 py-3.5">Người thực hiện</th>
              <th className="px-4 py-3.5">Hành động</th>
              <th className="px-4 py-3.5">Đối tượng</th>
              <th className="px-4 py-3.5">Lý do &amp; Metadata</th>
              <th className="px-4 py-3.5">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  Đang tải nhật ký...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  Chưa có bản ghi kiểm toán nào.
                </td>
              </tr>
            ) : (
              logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-slate-900 dark:text-white font-semibold">{item.actor_email}</div>
                    <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.actor_role}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-slate-800 font-mono text-indigo-700 dark:text-indigo-300 font-medium">
                      {item.action}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {item.target_type}
                    {item.target_id ? ` #${item.target_id}` : ''}
                  </td>
                  <td className="px-4 py-3.5 max-w-md">
                    {item.reason && <div className="text-slate-800 dark:text-slate-200">{item.reason}</div>}
                    {item.metadata_json && (
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        {item.metadata_json}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                    {item.ip_address || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Trước
          </button>
          <span className="text-slate-500 dark:text-slate-400">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
