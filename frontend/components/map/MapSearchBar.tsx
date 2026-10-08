'use client';

import React from 'react';
import { SearchResult } from './types';

interface MapSearchBarProps {
  searchQuery: string;
  isSearching: boolean;
  showSearchResults: boolean;
  searchResults: SearchResult[];
  onSearchChange: (query: string) => void;
  onFocus: () => void;
  onClear: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export default function MapSearchBar({
  searchQuery,
  isSearching,
  showSearchResults,
  searchResults,
  onSearchChange,
  onFocus,
  onClear,
  onSelectResult,
}: MapSearchBarProps) {
  return (
    <div className="absolute top-4 left-4 z-20 w-96 max-w-[calc(100%-6rem)]">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          placeholder="🔍 Tìm địa điểm, trường học, bệnh viện..."
          className="w-full px-4 py-3 pr-10 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl text-sm text-foreground placeholder:text-muted shadow-xl focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {searchQuery && !isSearching && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="mt-2 bg-background/95 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {searchResults.map((result) => (
            <button
              key={result.id}
              onClick={() => onSelectResult(result)}
              className="w-full text-left px-4 py-3 hover:bg-indigo-500/10 transition-colors border-b border-indigo-500/5 last:border-b-0 cursor-pointer"
            >
              <div className="text-sm font-semibold text-foreground truncate">
                📍 {result.place_name.split(",")[0]}
              </div>
              <div className="text-xs text-muted mt-0.5 truncate">{result.place_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
