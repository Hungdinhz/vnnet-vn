// app/(auth)/register/page.tsx
"use client"; // BẮT BUỘC: Vì trang này có form tương tác và gọi API

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

export default function RegisterPage() {
  const router = useRouter();
  
  // State quản lý form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State quản lý trạng thái
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate cơ bản ở Front-end
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      // TÙY CHỈNH THEO FASTAPI: Sửa '/register' thành endpoint tạo user của bạn
      // Thường thì FastAPI hay dùng '/users/' hoặc '/register'
      const response = await api.post('/users/register', {
        username: username,
        email: email,
        password: password
      });

      // Nếu API đăng ký thành công
      setSuccess('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
      
      // Chờ 2 giây rồi tự động đẩy người dùng về trang login
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      // Bắt lỗi từ server (VD: trùng username, trùng email)
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">MạngXãHội</h2>
        <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">Tạo tài khoản mới</h3>

        {/* Hiển thị thông báo lỗi nếu có */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Hiển thị thông báo thành công */}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: hungdeptrai"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: hung@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mật khẩu..."
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Nhập lại mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Xác nhận mật khẩu..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || success !== ''}
            className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors mt-6 ${
              isLoading || success ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}