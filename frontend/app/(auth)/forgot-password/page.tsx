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
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/users/reset-password', {
        email,
        otp,
        newPassword
      });
      setSuccess(response.data.message || 'Đặt lại mật khẩu thành công!');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">MạngXãHội</h2>
        <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
          {step === 1 ? 'Khôi phục mật khẩu' : 'Đặt lại mật khẩu mới'}
        </h3>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Email của bạn</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập email đã đăng ký..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Đang xử lý...' : 'Gửi mã xác nhận'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Mã OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center font-bold"
                placeholder="Nhập mã 6 số"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mật khẩu mới..."
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || success !== ''}
              className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors ${
                isLoading || success ? 'bg-blue-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Quay lại đăng nhập
          </Link>
          {step === 2 && (
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="text-gray-500 hover:underline"
            >
              Nhập email khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
