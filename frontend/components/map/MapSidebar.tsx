'use client';

import React from 'react';
import { SelectedPoint } from './types';

interface MapSidebarProps {
  selectedPoint: SelectedPoint;
  copiedAddressToast: boolean;
  copiedCoordsToast: boolean;
  onClear: () => void;
  onStartDirection: () => void;
  onCopyAddress: () => void;
  onCopyCoords: () => void;
}

export default function MapSidebar({
  selectedPoint,
  copiedAddressToast,
  copiedCoordsToast,
  onClear,
  onStartDirection,
  onCopyAddress,
  onCopyCoords,
}: MapSidebarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-20 sm:left-4 sm:w-96 z-30 bg-background/95 backdrop-blur-xl border-t sm:border border-indigo-500/25 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[55vh] sm:max-h-[calc(100vh-10rem)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent px-4 sm:px-5 py-3 sm:py-4 border-b border-indigo-500/15 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl sm:text-2xl">{selectedPoint.icon || "📍"}</span>
            {selectedPoint.category && (
              <span className="text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 px-2 sm:px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider truncate max-w-[160px]">
                {selectedPoint.category}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-foreground leading-snug line-clamp-2">
            {selectedPoint.name}
          </h2>
          {selectedPoint.secondaryName && (
            <p className="text-xs text-muted font-medium mt-0.5 line-clamp-1 italic">
              {selectedPoint.secondaryName}
            </p>
          )}
        </div>

        <button
          onClick={onClear}
          className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted hover:text-foreground text-sm cursor-pointer transition-colors shrink-0 -mt-1 -mr-1"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Quick Action Button */}
      <div className="p-3 sm:p-4 border-b border-indigo-500/10">
        <button
          onClick={onStartDirection}
          className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer whitespace-nowrap"
        >
          <span className="text-base">🧭</span>
          <span>Chỉ đường tới đây</span>
        </button>
      </div>

      {/* Place Info List */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-3.5 overflow-y-auto">
        {/* Address */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span className="text-base text-indigo-400 shrink-0 mt-0.5">📍</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-muted mb-0.5">Địa chỉ</div>
            <div className="text-xs text-foreground font-medium leading-relaxed">
              {selectedPoint.address}
            </div>
            <button
              onClick={onCopyAddress}
              className="text-[11px] text-indigo-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer font-semibold"
            >
              {copiedAddressToast ? "✅ Đã sao chép địa chỉ" : "📋 Sao chép địa chỉ"}
            </button>
          </div>
        </div>

        {/* Coordinates */}
        <div className="flex items-start gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-indigo-500/10">
          <span className="text-base text-indigo-400 shrink-0 mt-0.5">🌐</span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-muted mb-0.5">Tọa độ GPS</div>
            <div className="text-xs font-mono text-foreground font-medium">
              {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
            </div>
            <button
              onClick={onCopyCoords}
              className="text-[11px] text-indigo-400 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer font-semibold"
            >
              {copiedCoordsToast ? "✅ Đã chép tọa độ" : "📋 Sao chép tọa độ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
