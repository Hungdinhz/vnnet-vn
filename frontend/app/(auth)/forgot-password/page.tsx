// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/forgot-password', { email });
      setSuccess(response.data.message || 'Mã OTP đã được gửi!');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/reset-password', {
        email,
        otp,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-white text-2xl font-black">VN</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text">VnNet</h2>
        </div>
        
        <h3 className="text-lg font-semibold text-center text-secondary mb-6">
          {step === 1 ? 'Khôi phục mật khẩu' : 'Đặt lại mật khẩu mới'}
        </h3>

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

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-accent-purple/70 text-sm font-medium mb-1.5">Mã OTP</label>
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
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
                placeholder="Nhập mật khẩu mới..."
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || resetSuccess}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold btn-anime"
            >
              {isLoading ? 'Đang xử lý...' : '✨ Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-between items-center text-sm">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Quay lại đăng nhập
          </Link>
          {step === 2 && (
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="text-muted/50 hover:text-accent-purple transition-colors"
            >
              Nhập email khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
