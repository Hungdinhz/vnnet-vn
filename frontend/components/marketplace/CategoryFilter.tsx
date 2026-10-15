'use client';

import React from 'react';
import { MarketplaceCategory, CATEGORY_LABELS } from '@/types/marketplace';

interface CategoryFilterProps {
  selectedCategory: MarketplaceCategory;
  onSelectCategory: (category: MarketplaceCategory) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const categories = Object.keys(CATEGORY_LABELS) as MarketplaceCategory[];

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar py-1">
        {categories.map((catKey) => {
          const item = CATEGORY_LABELS[catKey];
          const isSelected = selectedCategory === catKey;

          return (
            <button
              key={catKey}
              onClick={() => onSelectCategory(catKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all duration-200 ${
                isSelected
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                  : 'glass-card border border-border/70 text-secondary hover:text-foreground hover:border-sky-500/40 hover:bg-sky-500/5'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
