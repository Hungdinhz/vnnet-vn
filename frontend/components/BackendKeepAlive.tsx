"use client";

import { useEffect } from 'react';
import api from '@/lib/axios';

const SESSION_AWAKE_KEY = 'vnnet_server_awake_ts';
const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 phút (Render free tier ngủ sau 15 phút)

export default function BackendKeepAlive() {
  useEffect(() => {
    const ping = async () => {
      try {
        await api.get('/', { timeout: 25000 });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_AWAKE_KEY, Date.now().toString());
        }
      } catch {
        // Bỏ qua lỗi ngầm ở global ping
      }
    };

    // Đánh thức server ngay khi người dùng vừa mở bất kỳ trang nào
    ping();

    const interval = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
