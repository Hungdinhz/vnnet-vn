'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { EyeOff, RotateCcw, Trash2, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  AdminGroupItem,
  AdminMarketplaceItem,
  AdminPostItem,
  SpringPage,
} from '@/types/admin';

type Tab = 'posts' | 'groups' | 'marketplace';

export default function AdminContentPage() {
  const { admin } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('posts');
  const [q, setQ] = useState('');
  const [hiddenFilter, setHiddenFilter] = useState<'' | 'false' | 'true'>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [groups, setGroups] = useState<AdminGroupItem[]>([]);
  const [items, setItems] = useState<AdminMarketplaceItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '20' });
      if (q.trim()) params.set('q', q.trim());
      if (hiddenFilter !== '') params.set('hidden', hiddenFilter);

      if (tab === 'posts') {
        const res = await adminApi.get<SpringPage<AdminPostItem>>(`/admin/posts?${params}`);
        setPosts(res.data.content);
        setTotalPages(res.data.totalPages);
      } else if (tab === 'groups') {
        const res = await adminApi.get<SpringPage<AdminGroupItem>>(`/admin/groups?${params}`);
        setGroups(res.data.content);
        setTotalPages(res.data.totalPages);
      } else {
        const res = await adminApi.get<SpringPage<AdminMarketplaceItem>>(
          `/admin/marketplace?${params}`
        );
        setItems(res.data.content);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      toast.error('Không thể tải dữ liệu kiểm duyệt.');
    } finally {
      setLoading(false);
    }
  }, [tab, q, hiddenFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleHide = async (endpoint: string, id: number) => {
    const reason = prompt('Nhập lý do ẩn nội dung (bắt buộc):');
    if (!reason || !reason.trim()) return;
    try {
      await adminApi.patch(`/admin/${endpoint}/${id}/hide`, { reason: reason.trim() });
      toast.success('Đã ẩn nội dung thành công.');
      loadData();
    } catch {
      toast.error('Thao tác thất bại.');
    }
  };

  const handleRestore = async (endpoint: string, id: number) => {
    try {
      await adminApi.patch(`/admin/${endpoint}/${id}/restore`);
      toast.success('Đã khôi phục nội dung.');
      loadData();
    } catch {
      toast.error('Thao tác thất bại.');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm(`Xóa VĨNH VIỄN bài viết #${id}? Hành động này không thể hoàn tác.`)) return;
    try {
      await adminApi.delete(`/admin/posts/${id}`, {
        data: { reason: 'Xóa vĩnh viễn bởi quản trị viên' },
      });
      toast.success(`Đã xóa vĩnh viễn bài viết #${id}`);
      loadData();
    } catch {
      toast.error('Bạn không có quyền xóa vĩnh viễn hoặc thao tác thất bại.');
    }
  };

  const canHardDelete = admin?.role === 'ADMIN' || admin?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kiểm duyệt Nội dung
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ẩn tạm thời (soft-hide giữ bằng chứng) hoặc khôi phục bài viết, hội nhóm và tin chợ
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(
          [
            ['posts', 'Bài viết'],
            ['groups', 'Hội nhóm'],
            ['marketplace', 'Chợ thương mại'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tab === key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
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
            placeholder="Tìm theo tiêu đề / nội dung..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <select
          value={hiddenFilter}
          onChange={(e) => {
            setPage(0);
            setHiddenFilter(e.target.value as '' | 'false' | 'true');
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="false">Đang hiển thị</option>
          <option value="true">Đã ẩn kiểm duyệt</option>
        </select>
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            Đang tải dữ liệu...
          </div>
        ) : tab === 'posts' ? (
          posts.length === 0 ? (
            <EmptyBox />
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">POST #{p.id}</span>
                    <span>bởi @{p.owner_username}</span>
                    {p.is_hidden && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-semibold">
                        ĐÃ ẨN
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">{p.title}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{p.content}</p>
                  {p.hidden_reason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">Lý do ẩn: {p.hidden_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.is_hidden ? (
                    <button
                      onClick={() => handleRestore('posts', p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHide('posts', p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-600/30 cursor-pointer"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Ẩn bài
                    </button>
                  )}
                  {canHardDelete && (
                    <button
                      onClick={() => handleDeletePost(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-600/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-600/30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        ) : tab === 'groups' ? (
          groups.length === 0 ? (
            <EmptyBox />
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">GROUP #{g.id}</span>
                    {g.is_private && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Riêng tư
                      </span>
                    )}
                    {g.is_hidden && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-semibold">
                        ĐÃ ẨN
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">{g.name}</div>
                  {g.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{g.description}</p>
                  )}
                  {g.hidden_reason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">Lý do ẩn: {g.hidden_reason}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {g.is_hidden ? (
                    <button
                      onClick={() => handleRestore('groups', g.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                    </button>
                  ) : (
                    <button
                      onClick={() => handleHide('groups', g.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300 cursor-pointer"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Ẩn nhóm
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        ) : items.length === 0 ? (
          <EmptyBox />
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">ITEM #{m.id}</span>
                  <span>{m.category}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {Number(m.price).toLocaleString('vi-VN')} ₫
                  </span>
                  {m.is_hidden && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-semibold">
                      ĐÃ ẨN
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">{m.title}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{m.description}</p>
                {m.hidden_reason && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">Lý do ẩn: {m.hidden_reason}</p>
                )}
              </div>
              <div className="shrink-0">
                {m.is_hidden ? (
                  <button
                    onClick={() => handleRestore('marketplace', m.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                  </button>
                ) : (
                  <button
                    onClick={() => handleHide('marketplace', m.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300 cursor-pointer"
                  >
                    <EyeOff className="h-3.5 w-3.5" /> Ẩn tin
                  </button>
                )}
              </div>
            </div>
          ))
        )}
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

function EmptyBox() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
      Không có nội dung nào phù hợp.
    </div>
  );
}
