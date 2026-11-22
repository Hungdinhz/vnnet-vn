"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import api from '@/lib/axios';

type ServerState = 'checking' | 'waking' | 'online' | 'error';

const SESSION_AWAKE_KEY = 'vnnet_server_awake_ts';
const RECENT_AWAKE_MS = 2 * 60 * 1000; // 2 phút
const KEEP_ALIVE_INTERVAL_MS = 4 * 60 * 1000; // Ping giữ thức mỗi 4 phút khi đang mở trang

export default function ServerStatusBanner() {
  const [status, setStatus] = useState<ServerState>('checking');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [justWokeUp, setJustWokeUp] = useState(false);

  const isMountedRef = useRef(true);
  const wasWakingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const markServerAwake = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_AWAKE_KEY, Date.now().toString());
    }
  }, []);

  const checkServer = useCallback(async (isManualRetry = false) => {
    if (!isMountedRef.current) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (isManualRetry) {
      setStatus('waking');
      wasWakingRef.current = true;
    }

    // Nếu sau 1.2 giây máy chủ chưa phản hồi -> chuyển sang trạng thái "Máy chủ đang khởi động..."
    const slowThresholdTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setStatus((prev) => {
          if (prev === 'checking') {
            wasWakingRef.current = true;
            return 'waking';
          }
          return prev;
        });
      }
    }, 1200);

    try {
      // Gọi endpoint "/" (luôn có sẵn trên cả bản cũ và mới) với timeout 25s
      await api.get('/', {
        timeout: 25000,
        headers: { 'Cache-Control': 'no-cache' },
      });

      clearTimeout(slowThresholdTimer);
      if (!isMountedRef.current) return;

      markServerAwake();
      if (wasWakingRef.current) {
        setJustWokeUp(true);
        wasWakingRef.current = false;
      }
      setStatus('online');
      setElapsedSeconds(0);
    } catch (err: any) {
      clearTimeout(slowThresholdTimer);
      if (!isMountedRef.current) return;

      // Nếu server trả về bất kỳ HTTP response nào (kể cả 4xx), nghĩa là server đã thức
      if (err?.response && err.response.status < 500) {
        markServerAwake();
        if (wasWakingRef.current) {
          setJustWokeUp(true);
          wasWakingRef.current = false;
        }
        setStatus('online');
        setElapsedSeconds(0);
        return;
      }

      // Lỗi mạng / timeout / 502 / 503 khi Render đang spin up container
      wasWakingRef.current = true;
      setStatus((prev) => (prev === 'online' ? 'checking' : 'waking'));

      // Tự động ping lại sau 3 giây cho đến khi server thức dậy
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          checkServer(false);
        }
      }, 3000);
    }
  }, [markServerAwake]);

  // Kiểm tra ngay khi mở trang và duy trì ping định kỳ
  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window !== 'undefined') {
      const lastAwake = Number(sessionStorage.getItem(SESSION_AWAKE_KEY) || '0');
      if (lastAwake && Date.now() - lastAwake < RECENT_AWAKE_MS) {
        setStatus('online');
      }
    }

    checkServer(false);

    const keepAliveTimer = setInterval(() => {
      api.get('/', { timeout: 15000 }).then(() => markServerAwake()).catch(() => {});
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(keepAliveTimer);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [checkServer, markServerAwake]);

  // Bộ đếm giây khi máy chủ đang khởi động lại
  useEffect(() => {
    if (status === 'waking' || status === 'checking') {
      wakingTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (wakingTimerRef.current) {
        clearInterval(wakingTimerRef.current);
        wakingTimerRef.current = null;
      }
    }
    return () => {
      if (wakingTimerRef.current) {
        clearInterval(wakingTimerRef.current);
      }
    };
  }, [status]);

  // Ước lượng phần trăm thanh tiến trình khi cold start (thường 35-50 giây trên Render)
  const progressPercent = Math.min(95, Math.round((elapsedSeconds / 45) * 100));

  if (status === 'online') {
    return (
      <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs text-emerald-500 dark:text-emerald-400 animate-fade-in">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium truncate">
            {justWokeUp
              ? 'Máy chủ đã khởi động xong • Sẵn sàng sử dụng!'
              : 'Máy chủ đang hoạt động • Sẵn sàng kết nối'}
          </span>
        </div>
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="mb-4 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-2 text-xs text-sky-500 dark:text-sky-400 animate-fade-in">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
          <span className="font-medium">Máy chủ đang kiểm tra kết nối...</span>
        </div>
        <Server className="w-3.5 h-3.5 shrink-0 opacity-70" />
      </div>
    );
  }

  // Trạng thái 'waking' hoặc 'error' (khi Render đang cold-start mất 30-50s)
  return (
    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs space-y-2 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-amber-500" />
          <span>Máy chủ đang khởi động lại... ({elapsedSeconds}s)</span>
        </div>
        <button
          type="button"
          onClick={() => checkServer(true)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-200 transition-colors cursor-pointer shrink-0"
          title="Thử kết nối lại ngay"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Thử lại</span>
        </button>
      </div>

      <p className="text-[11px] text-amber-600/85 dark:text-amber-200/80 leading-relaxed">
        Máy chủ miễn phí đang thức dậy sau thời gian nghỉ (thường mất khoảng 30–50 giây). Vui lòng đợi thông báo chuyển sang màu xanh trước khi đăng nhập hoặc đăng ký.
      </p>

      {/* Thanh tiến trình ước lượng */}
      <div className="w-full h-1.5 bg-amber-500/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-sky-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(10, progressPercent)}%` }}
        />
      </div>
    </div>
  );
}
