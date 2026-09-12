// app/(auth)/register/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import GoogleLoginButton, { GoogleUserInfo } from '@/components/GoogleLoginButton';

export default function RegisterPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State cho form hoàn tất Google
  const [googleStep, setGoogleStep] = useState<'idle' | 'complete'>('idle');
  const [googleInfo, setGoogleInfo] = useState<GoogleUserInfo | null>(null);
  const [googleFullName, setGoogleFullName] = useState('');
  const [googleUsername, setGoogleUsername] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/users/register', {
        username: username,
        email: email,
        password: password
      });

      setSuccess('Mã xác thực OTP đã được gửi đến email của bạn! Đang chuyển hướng...');
      
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Khi Google xác thực xong và user MỚI → hiện form hoàn tất
  const handleGoogleRegistrationNeeded = (info: GoogleUserInfo) => {
    setError('');
    setSuccess('');
    setGoogleInfo(info);
    setGoogleFullName(info.fullName || '');
    setGoogleUsername(info.suggestedUsername || '');
    setGooglePassword('');
    setGoogleConfirmPassword('');
    setGoogleStep('complete');
  };

  // Submit form hoàn tất Google
  const handleGoogleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!googleInfo) return;

    if (googlePassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (googlePassword !== googleConfirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    if (!googleUsername.trim()) {
      setError('Vui lòng nhập tên đăng nhập!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/users/google/register', {
        idToken: googleInfo.idToken,
        username: googleUsername.trim(),
        fullName: googleFullName.trim(),
        password: googlePassword,
      });

      setSuccess('Mã xác thực OTP đã được gửi đến email của bạn! Đang chuyển hướng...');
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(googleInfo.email)}`);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quay lại form đăng ký chính
  const handleBackToRegister = () => {
    setGoogleStep('idle');
    setGoogleInfo(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/3 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px]"></div>

      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-white text-2xl font-black">VN</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text">VnNet</h2>
          <p className="text-muted/50 text-sm mt-1">
            {googleStep === 'complete' ? 'Hoàn tất tài khoản 🎉' : 'Tạo tài khoản mới ✨'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm text-center border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg mb-4 text-sm text-center font-medium border border-emerald-500/20">
            {success}
          </div>
        )}

        {/* ========== FORM HOÀN TẤT GOOGLE ========== */}
        {googleStep === 'complete' && googleInfo ? (
          <>
            {/* Badge tài khoản Google */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
              {googleInfo.avatarUrl ? (
                <img
                  src={googleInfo.avatarUrl}
                  alt="Google Avatar"
                  className="w-10 h-10 rounded-full border-2 border-indigo-400/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-300 truncate">
                  {googleInfo.fullName || 'Tài khoản Google'}
                </p>
                <p className="text-xs text-indigo-400/70 truncate flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {googleInfo.email} • Đã xác minh
                </p>
              </div>
            </div>

            <form onSubmit={handleGoogleComplete} className="space-y-4">
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  value={googleFullName}
                  onChange={(e) => setGoogleFullName(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Tên đăng nhập</label>
                <input
                  type="text"
                  value={googleUsername}
                  onChange={(e) => setGoogleUsername(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="VD: nguyenvana"
                  required
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Nhập lại mật khẩu</label>
                <input
                  type="password"
                  value={googleConfirmPassword}
                  onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Xác nhận mật khẩu..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || success !== ''}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all btn-anime mt-2"
              >
                {isLoading ? 'Đang xử lý...' : '🚀 Hoàn tất đăng ký'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBackToRegister}
              className="w-full mt-3 py-2 text-sm text-muted/50 hover:text-indigo-400 transition-colors text-center"
            >
              ← Quay lại đăng ký
            </button>
          </>
        ) : (
          <>
            {/* ========== FORM ĐĂNG KÝ THƯỜNG ========== */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Tên đăng nhập</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="VD: nguyenvana hoặc user123"
                  required
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="VD: user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Nhập mật khẩu..."
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Nhập lại mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Xác nhận mật khẩu..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || success !== ''}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all btn-anime mt-2"
              >
                {isLoading ? 'Đang xử lý...' : '✨ Đăng ký tài khoản'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700/60"></div>
              </div>
              <div className="relative px-3 py-0.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full border border-slate-200/80 dark:border-slate-700/50 shadow-xs">
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">hoặc</span>
              </div>
            </div>

            {/* Nút Google */}
            <div className="w-full flex justify-center">
              <GoogleLoginButton
                mode="register"
                onError={(msg) => setError(msg)}
                onRegistrationNeeded={handleGoogleRegistrationNeeded}
              />
            </div>

            <div className="mt-6 text-center text-sm text-muted/50">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Đăng nhập ngay
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
