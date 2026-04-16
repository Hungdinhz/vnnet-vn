// app/(auth)/login/page.tsx
"use client"; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Import axios instance mà mình đã cấu hình ở Bước 2
import api from '@/lib/axios'; 

export default function LoginPage() {
  const router = useRouter();
  
  // Các state lưu trữ dữ liệu người dùng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tự động load lại trang khi submit form
    setError('');
    setIsLoading(true);

    try {
      // TÙY CHỈNH THEO FASTAPI CỦA BẠN: 
      // Mặc định FastAPI OAuth2 thường yêu cầu gửi dạng form-data. 
      // 1. Gói dữ liệu vào URLSearchParams để ép nó thành định dạng Form Data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // 2. Gửi đi và ép Axios phải đổi Header thành form-urlencoded
      const response = await api.post('/users/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Giả sử API trả về token dưới dạng { access_token: "chuoi_token_dai..." }
      const token = response.data.access_token;
      
      if (token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', token);
        // Chuyển hướng người dùng về trang chủ
        router.push('/');
      } else {
        setError('Không nhận được token từ server.');
      }
    } catch (err: any) {
      // Lấy chi tiết lỗi từ FastAPI trả về
      const errorDetail = err.response?.data?.detail;
      
      if (Array.isArray(errorDetail)) {
        // Trường hợp 1: FastAPI trả về mảng lỗi (thường là lỗi 422 Unprocessable Entity do Pydantic)
        // Mình bóc lấy cái tin nhắn (msg) của lỗi đầu tiên để hiện ra cho đẹp
        setError(errorDetail[0].msg);
      } else if (typeof errorDetail === 'string') {
        // Trường hợp 2: FastAPI trả về một câu chữ bình thường (lỗi 400, 401 do bạn tự viết)
        setError(errorDetail);
      } else {
        // Trường hợp 3: Server sập hẳn không trả về gì, hoặc mất mạng
        setError('Có lỗi xảy ra từ máy chủ. Vui lòng thử lại.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">MạngXãHội</h2>
        <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">Đăng nhập vào tài khoản</h3>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Tên đăng nhập (hoặc Email)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên đăng nhập..."
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
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}