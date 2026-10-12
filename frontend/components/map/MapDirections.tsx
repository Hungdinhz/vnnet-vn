'use client';

import React from 'react';
import { DirectionInfo, formatDistance, formatDuration } from './types';

interface MapDirectionsProps {
  destination: { name: string; lat: number; lng: number } | null;
  travelMode: 'driving' | 'walking' | 'cycling';
  setTravelMode: (mode: 'driving' | 'walking' | 'cycling') => void;
  isLoadingRoute: boolean;
  directionInfo: DirectionInfo | null;
  onClear: () => void;
}

export default function MapDirections({
  destination,
  travelMode,
  setTravelMode,
  isLoadingRoute,
  directionInfo,
  onClear,
}: MapDirectionsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-20 sm:left-4 sm:w-96 z-30 bg-background/95 backdrop-blur-xl border-t sm:border border-indigo-500/25 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[60vh] sm:max-h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-indigo-500/15 bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl">🧭</span>
          <div className="min-w-0">
            <div className="text-[10px] text-muted font-bold uppercase tracking-wider">Đường đi đến</div>
            <div className="font-bold text-sm text-foreground truncate">{destination?.name}</div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground text-sm transition-colors cursor-pointer shrink-0"
          title="Đóng chỉ đường"
        >
          ✕
        </button>
      </div>

      {/* Travel Mode Selector */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-indigo-500/10">
        {(["driving", "walking", "cycling"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTravelMode(mode)}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
              travelMode === mode
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "hover:bg-indigo-500/10 text-muted hover:text-foreground"
            }`}
          >
            <span>{mode === "driving" ? "🚗" : mode === "walking" ? "🚶" : "🚴"}</span>
            <span>{mode === "driving" ? "Lái xe" : mode === "walking" ? "Đi bộ" : "Xe đạp"}</span>
          </button>
        ))}
      </div>

      {isLoadingRoute && !directionInfo ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-xs text-muted font-medium">Đang tìm tuyến đường tối ưu...</span>
        </div>
      ) : directionInfo ? (
        <>
          {isLoadingRoute && (
            <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-xs flex items-center justify-center gap-2 border-b border-indigo-500/10">
              <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang cập nhật tuyến đường...</span>
            </div>
          )}
          {/* Summary */}
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-around border-b border-indigo-500/10 bg-indigo-500/5">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-black text-indigo-400">
                {formatDistance(directionInfo.distance)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted font-medium">Khoảng cách</div>
            </div>
            <div className="w-px h-8 bg-indigo-500/20" />
            <div className="text-center">
              <div className="text-lg sm:text-xl font-black text-indigo-400">
                {formatDuration(directionInfo.duration)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-muted font-medium">Thời gian ước tính</div>
            </div>
          </div>

          {/* Turn-by-turn steps */}
          <div className="overflow-y-auto px-3 sm:px-4 py-2 max-h-56 sm:max-h-72">
            {directionInfo.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 sm:gap-3 py-2 sm:py-2.5 border-t border-indigo-500/5 first:border-t-0"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium leading-relaxed">{step.instruction}</p>
                  <p className="text-[10px] text-muted mt-0.5">{formatDistance(step.distance)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
