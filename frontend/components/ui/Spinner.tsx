import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-10 h-10 border-3',
};

export default function Spinner({ size = 'md', className = '', color = 'border-indigo-600 border-t-transparent' }: SpinnerProps) {
  return (
    <div
      className={`inline-block animate-spin rounded-full ${sizes[size]} ${color} ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}
