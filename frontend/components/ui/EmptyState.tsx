import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 ${className}`}>
      {icon && <div className="mb-4 text-zinc-400 dark:text-zinc-500">{icon}</div>}
      <h4 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{title}</h4>
      {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
