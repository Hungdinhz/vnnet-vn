// lib/axios.ts
import axios from 'axios';

// Tạo một instance với cấu hình mặc định
const api = axios.create({
  // Thay url này bằng domain backend FastAPI của bạn. Mặc định FastAPI chạy port 8000
  baseURL: 'http://localhost:8000', 
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

export default api;