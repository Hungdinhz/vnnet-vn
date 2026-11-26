// lib/adminAxios.ts — Axios instance riêng biệt cho Admin Portal (chỉ dùng admin_token)
import axios from 'axios';
import { ADMIN_PORTAL_PREFIX, getAdminToken, removeAdminToken } from './adminAuth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://vnnet-vn-java.onrender.com';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getAdminToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const loginPath = `${ADMIN_PORTAL_PREFIX}/login`;
      if (!path.startsWith(loginPath)) {
        removeAdminToken();
        window.location.replace(loginPath);
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
