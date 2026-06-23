// app/(auth)/login/page.tsx
"use client"; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios'; 

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/users/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const token = response.data.access_token;
      
      if (token) {
        localStorage.setItem('token', token);
        router.push('/');
      } else {
        setError('Không nhận được token từ server.');
      }
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      
      if (Array.isArray(errorDetail)) {
        setError(errorDetail[0].msg);
      } else if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else {
        setError('Có lỗi xảy ra từ máy chủ. Vui lòng thử lại.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0B1E] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-pink-600/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]"></div>

      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 shadow-lg shadow-purple-500/30 mb-4">
            <span className="text-white text-2xl font-black">VN</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text">VnNet</h2>
          <p className="text-purple-400/50 text-sm mt-1">Mạng xã hội thế hệ mới ✨</p>
        </div>
        
        <h3 className="text-lg font-semibold text-center text-purple-200 mb-6">Đăng nhập vào tài khoản</h3>

        {error && (
          <div className="bg-rose-500/10 text-rose-400 p-3 rounded-lg mb-4 text-sm text-center border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-purple-300/70 text-sm font-medium mb-1.5">Tên đăng nhập (hoặc Email)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 input-anime rounded-xl text-sm"
              placeholder="Nhập tên đăng nhập..."
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all btn-anime mt-2"
          >
            {isLoading ? 'Đang xử lý...' : '✨ Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center text-sm">
          <Link href="/forgot-password" className="text-purple-400/60 hover:text-pink-400 transition-colors">
            Quên mật khẩu?
          </Link>
          <div className="text-purple-400/50">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}