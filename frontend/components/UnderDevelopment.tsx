// components/UnderDevelopment.tsx
"use client";

import Link from 'next/link';

interface UnderDevelopmentProps {
  title: string;
  icon: string;
}

export default function UnderDevelopment({ title, icon }: UnderDevelopmentProps) {
  return (
    <div className="w-full flex items-center justify-center py-12 md:py-20 animate-slide-up">
      <div className="glass-card rounded-2xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden border border-indigo-500/15">
        {/* Neon light effect background */}
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-gradient-to-tr from-accent-primary/15 to-accent-secondary/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Animated Big Icon */}
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-5xl shadow-lg shadow-indigo-500/5 animate-float">
            {icon}
          </div>

          {/* Title & Badge */}
          <div className="space-y-2">
            <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] md:text-xs font-bold text-accent-purple tracking-widest uppercase inline-block">
              🚧 ĐANG PHÁT TRIỂN
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Tính năng <span className="gradient-text">{title}</span> chưa hoàn thiện
            </h2>
          </div>

          {/* Description */}
          <p className="text-xs md:text-sm text-secondary leading-relaxed max-w-sm mx-auto">
            VnNet đang tích cực hoàn thiện tính năng này để mang tới trải nghiệm giải trí thế hệ mới tuyệt vời nhất dành cho bạn. Hãy quay lại sau nhé!
          </p>

          {/* Action Button */}
          <div className="pt-4">
            <Link 
              href="/"
              className="px-6 py-3 btn-anime rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              🏠 Quay lại Bảng tin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
