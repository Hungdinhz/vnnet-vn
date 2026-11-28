'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ShieldAlert, KeyRound, MailCheck, ArrowLeft, Loader2, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { ADMIN_PORTAL_PREFIX, setAdminToken } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const isDark = mounted ? theme === 'dark' : true;

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminApi.post('/admin/auth/login-step1', { email, password });
      setChallengeToken(res.data.challenge_token);
      setMaskedEmail(res.data.masked_email || email);
      setCountdown(res.data.expires_in_seconds || 300);
      setStep(2);
      toast.success(res.data.message || 'Đã gửi mã OTP xác thực tới email quản trị.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Thông tin đăng nhập không hợp lệ.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminApi.post('/admin/auth/login-step2', {
        challenge_token: challengeToken,
        otp: otp.trim(),
      });
      setAdminToken(res.data.access_token, res.data.expires_in_seconds || 1800);
      toast.success('Xác thực 2FA thành công.');
      window.location.replace(ADMIN_PORTAL_PREFIX);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Mã OTP không hợp lệ hoặc đã hết hạn.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-200">
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="absolute top-5 right-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
        {isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
      </button>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/40">
        <div className="flex items-center gap-3.5 mb-7">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Cổng Quản Trị Hệ Thống
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yêu cầu xác thực 2 bước (Mật khẩu + Email OTP)
            </p>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email quản trị
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vnnet.vn"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Tiếp tục &amp; Gửi mã OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 p-3.5 text-xs text-indigo-800 dark:text-indigo-200 flex items-start gap-2.5">
              <MailCheck className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
              <div>
                Mã OTP 6 số đã được gửi tới <strong>{maskedEmail}</strong>.
                {countdown > 0 && (
                  <span className="block text-indigo-600 dark:text-indigo-300/80 mt-0.5 font-medium">
                    Hết hạn sau: {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã xác thực OTP (6 chữ số)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-3 text-center text-xl tracking-[0.4em] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận &amp; Vào trang Quản trị
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setChallengeToken('');
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại bước nhập mật khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
