// app/(auth)/forgot-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserCheck, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { checkPasswordRules, validatePassword } from '@/lib/passwordValidation';

function PasswordRequirementsIndicator({ password }: { password: string }) {
  if (!password) return null;
  const rules = checkPasswordRules(password);
  return (
    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs mt-1.5 animate-fade-in">
      <div className="font-medium text-muted/70 text-[11px] mb-1">Yêu cầu bảo mật:</div>
      <div className={`flex items-center gap-1.5 transition-colors ${rules.minLength ? 'text-emerald-400 font-medium' : 'text-muted/50'}`}>
        <span>{rules.minLength ? '✓' : '○'}</span>
        <span>Tối thiểu 8 ký tự</span>
      </div>
      <div className={`flex items-center gap-1.5 transition-colors ${rules.hasUppercase ? 'text-emerald-400 font-medium' : 'text-muted/50'}`}>
        <span>{rules.hasUppercase ? '✓' : '○'}</span>
        <span>Ít nhất 1 chữ cái in hoa (A-Z)</span>
      </div>
      <div className={`flex items-center gap-1.5 transition-colors ${rules.hasSpecialChar ? 'text-emerald-400 font-medium' : 'text-muted/50'}`}>
        <span>{rules.hasSpecialChar ? '✓' : '○'}</span>
        <span>Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)</span>
      </div>
    </div>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Chế độ khôi phục: 'normal' (thường, cần OTP) | 'guest' (tài khoản khách, không cần OTP)
  const [accountType, setAccountType] = useState<'normal' | 'guest'>('normal');

  // Step 1: Nhập email, Step 2: Nhập mật khẩu mới (hoặc OTP + mật khẩu mới)
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (searchParams.get('mode') === 'guest') {
      setAccountType('guest');
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const switchAccountType = (type: 'normal' | 'guest') => {
    setAccountType(type);
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setSuccess('');
  };

  // ========== LUỒNG TÀI KHOẢN THƯỜNG (CÓ OTP) ==========
  const handleSendOtpNormal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/forgot-password', { email: email.trim() });
      setSuccess(response.data.message || 'Mã OTP đã được gửi đến email của bạn!');
      setStep(2);
      setCooldown(60);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setCooldown(60);
      }
      setError(err.response?.data?.detail || 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordNormal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message!);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/users/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      setSuccess(response.data.message || 'Đặt lại mật khẩu thành công!');
      setResetSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== LUỒNG TÀI KHOẢN KHÁCH (KHÔNG CẦN OTP) ==========
  // Bước 1 khách: Kiểm tra email tài khoản khách -> Sang thẳng bước 2 nếu đúng
  const handleCheckEmailGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.post('/users/guest/forgot-password', { email: email.trim() });
      setSuccess('Xác nhận email tài khoản khách thành công! Vui lòng nhập mật khẩu mới.');
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Không tìm thấy tài khoản khách với email này.');
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2 khách: Đổi mật khẩu trực tiếp (KHÔNG CẦN OTP)
  const handleResetPasswordGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message!);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/users/guest/reset-password', {
        email: email.trim(),
        newPassword
      });
      setSuccess(response.data.message || 'Đặt lại mật khẩu tài khoản khách thành công!');
      setResetSuccess(true);
      setTimeout(() => {
        router.push('/login?mode=guest');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-10">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-slide-up mx-3 xs:mx-4 sm:mx-0">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-white text-2xl font-black">VN</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text">VnNet</h2>
        </div>
        
        {/* Toggle loại tài khoản (chỉ hiện ở bước 1) */}
        {step === 1 && (
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-5">
            <button
              type="button"
              onClick={() => switchAccountType('normal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                accountType === 'normal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted/60 hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tài khoản thường</span>
            </button>
            <button
              type="button"
              onClick={() => switchAccountType('guest')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                accountType === 'guest'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted/60 hover:text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Tài khoản khách</span>
            </button>
          </div>
        )}

        <h3 className="text-lg font-semibold text-center text-secondary mb-4">
          {accountType === 'guest'
            ? step === 1 
              ? 'Khôi phục tài khoản khách' 
              : 'Đặt lại mật khẩu khách'
            : step === 1 
              ? 'Khôi phục mật khẩu' 
              : 'Đặt lại mật khẩu mới'}
        </h3>

        {/* Badge tài khoản khách */}
        {accountType === 'guest' && (
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs text-center mb-4 animate-fade-in">
            {step === 1 
              ? '✨ Nhập đúng email tài khoản khách để đổi mật khẩu ngay (không cần OTP)' 
              : `✨ Đang đổi mật khẩu cho tài khoản khách: ${email}`}
          </div>
        )}

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

        {/* ========== LUỒNG GUEST ========== */}
        {accountType === 'guest' ? (
          step === 1 ? (
            /* Bước 1 khách: Nhập email */
            <form onSubmit={handleCheckEmailGuest} className="space-y-4">
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Email tài khoản khách</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Nhập email tài khoản khách..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime"
              >
                {isLoading ? 'Đang kiểm tra...' : '✨ Tiếp tục (Đổi mật khẩu không cần OTP)'}
              </button>
            </form>
          ) : (
            /* Bước 2 khách: Đổi mật khẩu mới trực tiếp (KHÔNG CÓ OTP) */
            <form onSubmit={handleResetPasswordGuest} className="space-y-4">
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 input-anime rounded-xl text-sm"
                    placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt..."
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground transition-colors p-1 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirementsIndicator password={newPassword} />
              </div>
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 input-anime rounded-xl text-sm"
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground transition-colors p-1 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || resetSuccess}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime"
              >
                {isLoading ? 'Đang xử lý...' : '✨ Xác nhận đổi mật khẩu'}
              </button>
            </form>
          )
        ) : (
          /* ========== LUỒNG THƯỜNG (CÓ OTP) ========== */
          step === 1 ? (
            <form onSubmit={handleSendOtpNormal} className="space-y-4">
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Email của bạn</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                  placeholder="Nhập email đã đăng ký..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime"
              >
                {isLoading ? 'Đang xử lý...' : '✨ Gửi mã xác nhận'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPasswordNormal} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-accent-purple/70 text-sm font-medium">Mã OTP</label>
                  <button
                    type="button"
                    onClick={() => handleSendOtpNormal()}
                    disabled={cooldown > 0 || isLoading}
                    className={`text-xs font-medium transition-colors ${
                      cooldown > 0 
                        ? 'text-muted/40 cursor-not-allowed' 
                        : 'text-indigo-400 hover:text-indigo-300'
                    }`}
                  >
                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}
                  </button>
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 input-anime rounded-xl tracking-widest text-center font-bold text-sm"
                  placeholder="Nhập mã 6 số"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 input-anime rounded-xl text-sm"
                    placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt..."
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground transition-colors p-1 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordRequirementsIndicator password={newPassword} />
              </div>
              <div>
                <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-2.5 input-anime rounded-xl text-sm"
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground transition-colors p-1 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || resetSuccess}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime"
              >
                {isLoading ? 'Đang xử lý...' : '✨ Xác nhận đổi mật khẩu'}
              </button>
            </form>
          )
        )}

        <div className="mt-6 flex justify-between items-center text-sm">
          <Link
            href={accountType === 'guest' ? "/login?mode=guest" : "/login"}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại đăng nhập</span>
          </Link>
          {step === 2 && (
            <button 
              type="button" 
              onClick={() => {
                setStep(1);
                setOtp('');
                setNewPassword('');
                setConfirmNewPassword('');
                setError('');
                setSuccess('');
              }} 
              className="text-muted/50 hover:text-accent-purple transition-colors text-xs"
            >
              Nhập email khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
