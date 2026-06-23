// app/(auth)/register/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await api.post('/users/register', {
        username: username,
        email: email,
        password: password
      });

      setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0B1E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/3 -left-20 w-72 h-72 bg-pink-600/20 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]"></div>

      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-white text-2xl font-black">VN</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text">VnNet</h2>
          <p className="text-purple-400/50 text-sm mt-1">Tạo tài khoản mới ✨</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg mb-4 text-sm text-center border border-rose-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg mb-4 text-sm text-center font-medium border border-emerald-500/20">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-purple-300/70 text-sm font-medium mb-1.5">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
              placeholder="VD: hungdeptrai"
              required
            />
          </div>

          <div>
            <label className="block text-purple-300/70 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
              placeholder="VD: hung@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-purple-300/70 text-sm font-medium mb-1.5">Mật khẩu</label>
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
            <label className="block text-purple-300/70 text-sm font-medium mb-1.5">Nhập lại mật khẩu</label>
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

        <div className="mt-6 text-center text-sm text-purple-400/50">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}