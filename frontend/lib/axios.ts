// lib/axios.ts
import axios from 'axios';

// Tạo một instance với cấu hình mặc định
const api = axios.create({
  // Thay url này bằng domain backend FastAPI của bạn. Mặc định FastAPI chạy port 8000
  // baseURL: 'https://vnnet.onrender.com',
  baseURL: 'http://localhost:8000',
  // baseURL: 'https://vnnet-vn-java.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Đánh chặn trước khi request được gửi đi
api.interceptors.request.use(
  (config) => {
    // KHI NÀO DÙNG: Đoạn này lấy token từ localStorage để gắn vào Header
    // LƯU Ý QUAN TRỌNG: localStorage chỉ tồn tại trên trình duyệt (Client). 
    // Do Next.js có render trên Server, ta phải kiểm tra window để tránh lỗi crash server.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response: Xử lý lỗi 401/403 (Token hết hạn/Không hợp lệ)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined') {
        // Chỉ logout nếu đang ở trang không phải trang login/register
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;