'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, notFound } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flag,
  FileWarning,
  ScrollText,
  Megaphone,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PORTAL_PREFIX } from '@/lib/adminAuth';

const NAV_ITEMS = [
  { href: ADMIN_PORTAL_PREFIX, label: 'Tổng quan', icon: LayoutDashboard, roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { href: `${ADMIN_PORTAL_PREFIX}/users`, label: 'Người dùng', icon: Users, roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { href: `${ADMIN_PORTAL_PREFIX}/reports`, label: 'Báo cáo vi phạm', icon: Flag, roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { href: `${ADMIN_PORTAL_PREFIX}/content`, label: 'Kiểm duyệt nội dung', icon: FileWarning, roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { href: `${ADMIN_PORTAL_PREFIX}/audit-logs`, label: 'Nhật ký kiểm toán', icon: ScrollText, roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { href: `${ADMIN_PORTAL_PREFIX}/announcements`, label: 'Thông báo hệ thống', icon: Megaphone, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === `${ADMIN_PORTAL_PREFIX}/login`;

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return <ProtectedAdminShell>{children}</ProtectedAdminShell>;
}

function ProtectedAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, isLoading, isUnauthorized, logout } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isUnauthorized || !admin) {
    notFound();
  }

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(admin.role));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar quản trị độc lập hoàn toàn với giao diện người dùng */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/90 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-white">VnNet Operations</div>
            <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">
              {admin.role}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === ADMIN_PORTAL_PREFIX
                ? pathname === ADMIN_PORTAL_PREFIX
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <div className="font-semibold text-slate-200 truncate">
              {admin.full_name || admin.username}
            </div>
            <div className="text-slate-400 truncate">{admin.email}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Đăng xuất phiên quản trị
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
