import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

const sizeClasses: Record<string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ src, name = 'User', size = 'md', className = '', glow = false }: AvatarProps) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = (name && name.length > 0) ? name.charAt(0).toUpperCase() : 'U';

  if (src && src.trim().length > 0) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${glow ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center shrink-0 select-none shadow-sm ${glow ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${className}`}
    >
      {initial}
    </div>
  );
}
