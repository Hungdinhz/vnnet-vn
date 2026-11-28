'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Activity,
  FileText,
  Flag,
  ShieldBan,
  Store,
  Layers,
  TrendingUp,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import adminApi from '@/lib/adminAxios';
import { ADMIN_PORTAL_PREFIX } from '@/lib/adminAuth';
import { DailyGrowthPoint, DashboardGrowth, DashboardOverview } from '@/types/admin';

type ChartMode = 'line' | 'bar';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [growth, setGrowth] = useState<DashboardGrowth | null>(null);
  const [days, setDays] = useState(14);
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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

  const points: DailyGrowthPoint[] = growth?.points || [];
  const peakActiveUsers = points.reduce((m, p) => Math.max(m, p.active_users ?? 0), 0);
  const totalPostsInRange = points.reduce((s, p) => s + (p.new_posts ?? 0), 0);
  const avgActiveUsers =
    points.length > 0
      ? Math.round((points.reduce((s, p) => s + (p.active_users ?? 0), 0) / points.length) * 10) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi mức độ hoạt động thực tế của người dùng và các mục cần kiểm duyệt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  days === d
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          title="Người dùng hoạt động (24h)"
          value={overview?.active_users_24h ?? '—'}
          sub={`Tổng ${overview?.total_users ?? 0} tài khoản · +${overview?.new_users_24h ?? 0} mới hôm nay`}
          icon={Activity}
          accent="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/users`}
        />
        <KpiCard
          title="Báo cáo chờ xử lý"
          value={overview?.pending_reports ?? '—'}
          sub="Hàng đợi kiểm duyệt vi phạm"
          icon={Flag}
          accent="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/reports`}
        />
        <KpiCard
          title="Tài khoản đang bị khóa"
          value={overview?.restricted_users ?? '—'}
          sub="Bao gồm tạm khóa & khóa vĩnh viễn"
          icon={ShieldBan}
          accent="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/users`}
        />
        <KpiCard
          title="Tổng bài viết"
          value={overview?.total_posts ?? '—'}
          sub={`+${overview?.new_posts_24h ?? 0} bài viết mới 24h qua`}
          icon={FileText}
          accent="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
          href={`${ADMIN_PORTAL_PREFIX}/content`}
        />
        <KpiCard
          title="Hội nhóm cộng đồng"
          value={overview?.total_groups ?? '—'}
          sub="Tổng số nhóm đang hoạt động"
          icon={Layers}
          accent="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30"
        />
        <KpiCard
          title="Tin chợ đang mở bán"
          value={overview?.active_marketplace_items ?? '—'}
          sub={`+${overview?.new_users_7d ?? 0} người dùng mới 7 ngày qua`}
          icon={Store}
          accent="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30"
        />
      </div>

      {/* Activity & Growth Chart Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Người dùng hoạt động &amp; Bài viết ({days} ngày gần nhất)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chỉ tính người dùng thực sự có hoạt động trong ngày (đăng nhập, đăng bài, bình luận, nhắn tin, đăng chợ)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Người dùng hoạt động
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Bài viết mới
              </span>
            </div>

            {/* Chart Mode Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setChartMode('line')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  chartMode === 'line'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Đường
              </button>
              <button
                onClick={() => setChartMode('bar')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  chartMode === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Cột
              </button>
            </div>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Cao điểm hoạt động/ngày</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {peakActiveUsers}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Trung bình hoạt động/ngày</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{avgActiveUsers}</span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Tổng bài viết ({days} ngày)</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{totalPostsInRange}</span>
          </div>
        </div>

        {loading || points.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Đang tải dữ liệu biểu đồ...
          </div>
        ) : chartMode === 'line' ? (
          <InteractiveLineChart
            points={points}
            hoveredIdx={hoveredIdx}
            setHoveredIdx={setHoveredIdx}
          />
        ) : (
          <InteractiveBarChart points={points} />
        )}
      </div>
    </div>
  );
}

function InteractiveLineChart({
  points,
  hoveredIdx,
  setHoveredIdx,
}: {
  points: DailyGrowthPoint[];
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
}) {
  const width = 920;
  const height = 270;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const rawMax = Math.max(
    1,
    ...points.map((p) => Math.max(p.active_users ?? 0, p.new_posts ?? 0))
  );
  const yMax = Math.max(4, Math.ceil(rawMax / 4) * 4);
  const yTicks = [0, Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax];

  const xAt = (i: number) =>
    points.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (points.length - 1)) * plotW;
  const yAt = (v: number) => padTop + plotH - (v / yMax) * plotH;

  const activeLine = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.active_users ?? 0).toFixed(1)}`)
    .join(' ');
  const postLine = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.new_posts ?? 0).toFixed(1)}`)
    .join(' ');

  const activeArea =
    `${activeLine} L ${xAt(points.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} ` +
    `L ${xAt(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const labelStep = Math.max(1, Math.ceil(points.length / 8));
  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full">
      {/* Hover Tooltip */}
      {hovered && hoveredIdx !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: `${Math.min(72, Math.max(6, (hoveredIdx / Math.max(1, points.length - 1)) * 85))}%`,
          }}
        >
          <div className="font-bold text-slate-900 dark:text-white mb-1">{hovered.date}</div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Hoạt động: <strong>{hovered.active_users}</strong> người dùng
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Bài viết mới: <strong>{hovered.new_posts}</strong>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] h-64 select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="activeUsersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y Labels */}
          {yTicks.map((tick) => {
            const y = yAt(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill under active users line */}
          <path d={activeArea} fill="url(#activeUsersGrad)" />

          {/* Post line (Emerald) */}
          <path
            d={postLine}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active users line (Indigo) */}
          <path
            d={activeLine}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover vertical guide line */}
          {hoveredIdx !== null && (
            <line
              x1={xAt(hoveredIdx)}
              y1={padTop}
              x2={xAt(hoveredIdx)}
              y2={padTop + plotH}
              className="stroke-indigo-400/50"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Data Points & X Labels */}
          {points.map((p, i) => {
            const cx = xAt(i);
            const cyUser = yAt(p.active_users ?? 0);
            const cyPost = yAt(p.new_posts ?? 0);
            const isHovered = hoveredIdx === i;
            const showLabel = i % labelStep === 0 || i === points.length - 1;

            return (
              <g key={p.date}>
                {/* Hit zone for smooth hover */}
                <rect
                  x={cx - plotW / Math.max(1, points.length * 2)}
                  y={padTop}
                  width={plotW / Math.max(1, points.length)}
                  height={plotH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                />
                <circle
                  cx={cx}
                  cy={cyPost}
                  r={isHovered ? 5 : 3.2}
                  className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                  strokeWidth="1.8"
                />
                <circle
                  cx={cx}
                  cy={cyUser}
                  r={isHovered ? 5.8 : 3.8}
                  className="fill-indigo-500 stroke-white dark:stroke-slate-900"
                  strokeWidth="2"
                />
                {showLabel && (
                  <text
                    x={cx}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 text-[11px]"
                  >
                    {p.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function InteractiveBarChart({ points }: { points: DailyGrowthPoint[] }) {
  const maxVal = Math.max(
    1,
    ...points.map((p) => Math.max(p.active_users ?? 0, p.new_posts ?? 0))
  );

  return (
    <div className="h-60 flex items-end gap-2 overflow-x-auto pb-6 pt-4">
      {points.map((pt) => {
        const userH = Math.max(6, Math.round(((pt.active_users ?? 0) / maxVal) * 180));
        const postH = Math.max(6, Math.round(((pt.new_posts ?? 0) / maxVal) * 180));
        return (
          <div
            key={pt.date}
            className="flex-1 min-w-[30px] flex flex-col items-center gap-1.5 group"
            title={`${pt.date}: ${pt.active_users} người dùng hoạt động, ${pt.new_posts} bài viết mới`}
          >
            <div className="flex items-end gap-1 h-44">
              <div
                style={{ height: `${userH}px` }}
                className="w-3 rounded-t-md bg-indigo-500/85 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-all"
              />
              <div
                style={{ height: `${postH}px` }}
                className="w-3 rounded-t-md bg-emerald-500/85 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-400 transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {pt.date.slice(5)}
            </span>
          </div>
        );
      })}
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs hover:shadow-md dark:hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            {value}
          </p>
        </div>
        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{sub}</span>
        {href && (
          <Link
            href={href}
            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold shrink-0 ml-2"
          >
            Xem <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
