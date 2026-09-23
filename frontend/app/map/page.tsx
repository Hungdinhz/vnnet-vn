// app/map/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Mapbox GL
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-3.5rem)] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted">Đang tải bản đồ...</span>
      </div>
    </div>
  ),
});

export default function MapPage() {
  // Đặt Mapbox access token ở đây hoặc trong .env.local
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 h-[calc(100vh-3.5rem)]">
          {mapboxToken ? (
            <MapComponent accessToken={mapboxToken} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="glass-card rounded-2xl p-8 max-w-md text-center">
                <div className="text-5xl mb-4">🗺️</div>
                <h2 className="text-xl font-bold text-foreground mb-2">Cần cấu hình Mapbox</h2>
                <p className="text-sm text-muted mb-4">
                  Để sử dụng tính năng bản đồ, bạn cần thêm Mapbox Access Token vào file 
                  <code className="mx-1 px-2 py-0.5 bg-indigo-500/10 rounded text-indigo-400 text-xs">.env.local</code>
                </p>
                <div className="bg-background/50 rounded-lg p-3 text-left">
                  <code className="text-xs text-indigo-400">
                    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
                  </code>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
