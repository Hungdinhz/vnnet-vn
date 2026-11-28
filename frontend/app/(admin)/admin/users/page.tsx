'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  ShieldBan,
  ShieldCheck,
  LogOut,
  BadgeCheck,
  UserCog,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminUserSummary, SpringPage } from '@/types/admin';

export default function AdminUsersPage() {
  const { admin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [modalMode, setModalMode] = useState<'STATUS' | 'ROLE' | null>(null);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED'>('SUSPENDED');
  const [durationHours, setDurationHours] = useState(24);
  const [newRole, setNewRole] = useState<'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'>('MODERATOR');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (q.trim()) params.set('q', q.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await adminApi.get<SpringPage<AdminUserSummary>>(`/admin/users?${params}`);
      setUsers(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page, q, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setBusy(true);
    try {
      await adminApi.patch(`/admin/users/${selectedUser.id}/status`, {
        status: newStatus,
        duration_hours: newStatus === 'SUSPENDED' ? durationHours : null,
        reason,
      });
      toast.success(`Đã cập nhật trạng thái @${selectedUser.username} → ${newStatus}`);
      setModalMode(null);
      setReason('');
      loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail || 'Không thể cập nhật trạng thái.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setBusy(true);
    try {
      await adminApi.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
        reason,
      });
      toast.success(`Đã đổi vai trò @${selectedUser.username} → ${newRole}`);
      setModalMode(null);
      setReason('');
      loadUsers();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail || 'Không thể thay đổi vai trò.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleForceLogout = async (u: AdminUserSummary) => {
    if (!confirm(`Thu hồi toàn bộ phiên đăng nhập của @${u.username}?`)) return;
    try {
      await adminApi.post(`/admin/users/${u.id}/force-logout`, { reason: 'Admin force logout' });
      toast.success(`Đã đăng xuất bắt buộc @${u.username}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Thao tác thất bại.';
      toast.error(msg);
    }
  };

  const handleToggleVerify = async (u: AdminUserSummary) => {
    try {
      await adminApi.patch(`/admin/users/${u.id}/verify`, {
        is_verified: !u.is_verified,
        reason: !u.is_verified ? 'Cấp tích xanh bởi Admin' : 'Thu hồi tích xanh bởi Admin',
      });
      toast.success(`Đã cập nhật xác minh cho @${u.username}`);
      loadUsers();
    } catch {
      toast.error('Không thể cập nhật trạng thái xác minh.');
    }
  };

  const canManageAdminActions = admin?.role === 'ADMIN' || admin?.role === 'SUPER_ADMIN';
  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quản lý Người dùng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tìm kiếm, khóa tạm/vĩnh viễn, thu hồi phiên và phân quyền tài khoản
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => {
              setPage(0);
              setQ(e.target.value);
            }}
            placeholder="Tìm theo username, email, họ tên..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(0);
            setRoleFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">USER</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BANNED">BANNED</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3.5">Tài khoản</th>
              <th className="px-4 py-3.5">Vai trò</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5">Bài viết</th>
              <th className="px-4 py-3.5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      @{u.username}
                      {u.is_verified && <BadgeCheck className="h-4 w-4 text-sky-500 dark:text-sky-400" />}
                      {u.is_guest && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                          GUEST
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        u.account_status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                          : u.account_status === 'SUSPENDED'
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
                      }`}
                    >
                      {u.account_status}
                    </span>
                    {u.ban_reason && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate">
                        {u.ban_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    {u.posts_count}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setNewStatus(u.account_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                        setReason('');
                        setModalMode('STATUS');
                      }}
                      title="Khóa / Mở khóa"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      {u.account_status === 'ACTIVE' ? (
                        <ShieldBan className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {u.account_status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                    </button>

                    {canManageAdminActions && (
                      <>
                        <button
                          onClick={() => handleToggleVerify(u)}
                          title="Bật/tắt tích xanh"
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleForceLogout(u)}
                          title="Thu hồi phiên đăng nhập (Force Logout)"
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                          setReason('');
                          setModalMode('ROLE');
                        }}
                        title="Phân quyền (SUPER_ADMIN)"
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Modal cập nhật trạng thái */}
      {modalMode === 'STATUS' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStatusSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cập nhật trạng thái @{selectedUser.username}
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Trạng thái mới
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'BANNED')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="ACTIVE">ACTIVE (Mở khóa)</option>
                <option value="SUSPENDED">SUSPENDED (Tạm khóa có thời hạn)</option>
                {canManageAdminActions && <option value="BANNED">BANNED (Khóa vĩnh viễn)</option>}
              </select>
            </div>
            {newStatus === 'SUSPENDED' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Thời hạn tạm khóa (giờ)
                </label>
                <input
                  type="number"
                  min={1}
                  max={8760}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Lý do (ghi vào Audit Log)
              </label>
              <textarea
                required={newStatus !== 'ACTIVE'}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal đổi quyền (SUPER_ADMIN) */}
      {modalMode === 'ROLE' && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRoleSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Phân quyền cho @{selectedUser.username}
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Vai trò mới
              </label>
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN')
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Lý do thay đổi quyền
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Bổ nhiệm / thu hồi quyền..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer"
              >
                Lưu vai trò
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
