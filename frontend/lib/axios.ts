// lib/axios.ts
import axios from 'axios';
import { getAuthToken, removeAuthToken } from './auth';

// URL backend: ưu tiên biến môi trường NEXT_PUBLIC_API_URL, mặc định là domain Render production
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vnnet-vn-java.onrender.com';

// Tạo một instance với cấu hình mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Đánh chặn trước khi request được gửi đi
api.interceptors.request.use(
  (config) => {
    // Nếu request gửi FormData, xóa Content-Type để trình duyệt tự động sinh multipart boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (typeof window !== 'undefined') {
      const token = getAuthToken();
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

// Interceptor cho response: Xử lý lỗi 401 / 403 (Token hết hạn/Không hợp lệ/Chưa xác thực)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';

      // 401 luôn là lỗi chưa đăng nhập/token sai
      // 403 trên các endpoint người dùng/thông báo cũng là lỗi xác thực từ Spring Security
      const isAuthFailure = status === 401 || (status === 403 && (url.includes('/users/me') || url.includes('/notifications')));

      if (isAuthFailure && typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage =
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/verify-email') ||
          path.startsWith('/forgot-password');

        if (!isAuthPage) {
          removeAuthToken();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;