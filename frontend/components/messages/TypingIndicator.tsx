import React from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.slice(0, 2).join(', ');
  const extra = typingUsers.length > 2 ? ` và ${typingUsers.length - 2} người khác` : '';

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-secondary animate-fade-in">
      <div className="flex space-x-1 items-center bg-black/20 dark:bg-white/5 px-3 py-1.5 rounded-full border border-indigo-500/10 shadow-sm">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></span>
        <span className="ml-2 font-medium">{names}{extra} đang gõ...</span>
      </div>
    </div>
  );
}
