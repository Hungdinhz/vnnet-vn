'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, MailCheck, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import adminApi from '@/lib/adminAxios';
import { ADMIN_PORTAL_PREFIX, setAdminToken } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Cổng Quản Trị Hệ Thống</h1>
            <p className="text-xs text-slate-400">
              Yêu cầu xác thực 2 bước (Mật khẩu + Email OTP)
            </p>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email quản trị
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vnnet.vn"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
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
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-200 flex items-start gap-2.5">
              <MailCheck className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
              <div>
                Mã OTP 6 số đã được gửi tới <strong>{maskedEmail}</strong>.
                {countdown > 0 && (
                  <span className="block text-indigo-300/80 mt-0.5">
                    Hết hạn sau: {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-center text-xl tracking-[0.4em] font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
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
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
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
