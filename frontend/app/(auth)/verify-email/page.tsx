// app/(auth)/verify-email/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import OtpInput from '@/components/OtpInput';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShake, setIsShake] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const maskedEmail = email ? email.replace(/(.{2})(.*)(?=@)/, (match, p1, p2) => p1 + '*'.repeat(p2.length)) : '';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const submitOtp = async (otpValue: string) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/verify-email', {
        email,
        otp: otpValue
      });

      const token = response.data.access_token || response.data.token;
      
      setSuccess('Xác thực thành công! Đang chuyển hướng...');
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Mã OTP không đúng hoặc đã hết hạn.');
      setOtp(Array(6).fill(''));
      
      // Trigger shake animation
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    
    try {
      await api.post('/users/resend-otp', { email, type: 'REGISTER_VERIFICATION' });
      setCooldown(60);
      setOtp(Array(6).fill('')); // Xóa sạch ô nhập OTP khi gửi mã mới
      setSuccess('Đã gửi lại mã OTP mới. Vui lòng kiểm tra email.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    }
  };

  if (!email) return null;

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
          <p className="text-muted/50 text-sm mt-1">Xác thực tài khoản ✨</p>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-secondary">
            Chúng tôi đã gửi mã xác nhận 6 số đến email
            <br />
            <span className="font-bold text-indigo-400">{maskedEmail}</span>
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

        <div className="mb-4">
          <div className={isShake ? 'animate-[shake_0.5s_ease-in-out]' : ''}>
            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              onComplete={submitOtp}
              disabled={isLoading}
              inputClassName="input-anime"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => submitOtp(otp.join(''))}
          disabled={otp.some(v => !v) || isLoading}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime mb-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xác thực...' : '✨ Xác thực tài khoản'}
        </button>

        <div className="flex flex-col items-center gap-4 text-sm">
          <div className="text-muted/70">
            Mã xác nhận có hiệu lực trong: <span className="font-mono text-indigo-400 font-medium">{formatTime(timeLeft)}</span>
          </div>
          
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isLoading}
            className={`text-sm font-medium transition-colors ${
              cooldown > 0 
                ? 'text-muted/40 cursor-not-allowed' 
                : 'text-indigo-400 hover:text-indigo-300'
            }`}
          >
            {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-muted/50 border-t border-white/10 pt-6">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
      `}} />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
