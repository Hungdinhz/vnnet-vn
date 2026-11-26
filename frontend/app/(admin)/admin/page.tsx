'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileText,
  Flag,
  ShieldBan,
  Store,
  Layers,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import adminApi from '@/lib/adminAxios';
import { ADMIN_PORTAL_PREFIX } from '@/lib/adminAuth';
import { DashboardGrowth, DashboardOverview } from '@/types/admin';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [growth, setGrowth] = useState<DashboardGrowth | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      adminApi.get<DashboardOverview>('/admin/dashboard/overview'),
      adminApi.get<DashboardGrowth>(`/admin/dashboard/growth?days=${days}`),
    ])
      .then(([ovRes, grRes]) => {
        if (!active) return;
        setOverview(ovRes.data);
        setGrowth(grRes.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days]);

  const maxVal = Math.max(
    1,
    ...(growth?.points.map((p) => Math.max(p.new_users, p.new_posts)) || [1])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-400">
            Theo dõi sức khỏe nền tảng VnNet và các mục cần kiểm duyệt ngay
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          title="Tổng người dùng"
          value={overview?.total_users ?? '—'}
          sub={`+${overview?.new_users_24h ?? 0} trong 24h · +${overview?.new_users_7d ?? 0} trong 7 ngày`}
          icon={Users}
          accent="text-indigo-400 bg-indigo-500/10 border-indigo-500/30"
        />
        <KpiCard
          title="Báo cáo chờ xử lý"
          value={overview?.pending_reports ?? '—'}
          sub="Hàng đợi kiểm duyệt vi phạm"
          icon={Flag}
          accent="text-amber-400 bg-amber-500/10 border-amber-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/reports`}
        />
        <KpiCard
          title="Tài khoản đang bị khóa"
          value={overview?.restricted_users ?? '—'}
          sub="Bao gồm tạm khóa & khóa vĩnh viễn"
          icon={ShieldBan}
          accent="text-rose-400 bg-rose-500/10 border-rose-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/users`}
        />
        <KpiCard
          title="Tổng bài viết"
          value={overview?.total_posts ?? '—'}
          sub={`+${overview?.new_posts_24h ?? 0} bài viết mới 24h qua`}
          icon={FileText}
          accent="text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/content`}
        />
        <KpiCard
          title="Hội nhóm cộng đồng"
          value={overview?.total_groups ?? '—'}
          sub="Tổng số nhóm trên hệ thống"
          icon={Layers}
          accent="text-sky-400 bg-sky-500/10 border-sky-500/30"
        />
        <KpiCard
          title="Tin chợ đang mở bán"
          value={overview?.active_marketplace_items ?? '—'}
          sub="Marketplace items (active)"
          icon={Store}
          accent="text-purple-400 bg-purple-500/10 border-purple-500/30"
        />
      </div>

      {/* Growth Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-white">Tăng trưởng {days} ngày gần nhất</h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Người dùng mới
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Bài viết mới
            </span>
          </div>
        </div>

        {loading || !growth ? (
          <div className="h-48 flex items-center justify-center text-sm text-slate-500">
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : (
          <div className="h-52 flex items-end gap-1.5 overflow-x-auto pb-6">
            {growth.points.map((pt) => {
              const userH = Math.max(4, Math.round((pt.new_users / maxVal) * 160));
              const postH = Math.max(4, Math.round((pt.new_posts / maxVal) * 160));
              return (
                <div
                  key={pt.date}
                  className="flex-1 min-w-[26px] flex flex-col items-center gap-1 group relative"
                  title={`${pt.date}: ${pt.new_users} users, ${pt.new_posts} posts`}
                >
                  <div className="flex items-end gap-0.5 h-40">
                    <div
                      style={{ height: `${userH}px` }}
                      className="w-2.5 rounded-t bg-indigo-500/80 group-hover:bg-indigo-400 transition-all"
                    />
                    <div
                      style={{ height: `${postH}px` }}
                      className="w-2.5 rounded-t bg-emerald-500/80 group-hover:bg-emerald-400 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {pt.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  title: string;
  value: number | string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{sub}</span>
        {href && (
          <Link
            href={href}
            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
          >
            Xem <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
