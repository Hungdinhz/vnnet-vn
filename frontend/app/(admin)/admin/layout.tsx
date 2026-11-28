'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, notFound } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Flag,
  FileWarning,
  ScrollText,
  Megaphone,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X,
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
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {children}
      </div>
    );
  }

  return <ProtectedAdminShell>{children}</ProtectedAdminShell>;
}

function ProtectedAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, isLoading, isUnauthorized, logout } = useAdminAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Đang xác thực phiên quản trị...
          </span>
        </div>
      </div>
    );
  }

  if (isUnauthorized || !admin) {
    notFound();
  }

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(admin.role));
  const isDark = mounted ? theme === 'dark' : true;

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const renderSidebarContent = () => (
    <>
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              VnNet Admin
            </div>
            <div className="text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
              {admin.role}
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
            {isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          </span>
        </button>

        <div className="rounded-xl bg-slate-100/80 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs">
          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {admin.full_name || admin.username}
          </div>
          <div className="text-slate-500 dark:text-slate-400 truncate mt-0.5">{admin.email}</div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất phiên quản trị
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-68 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 flex-col sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            VnNet Admin
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đổi giao diện Sáng/Tối"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
