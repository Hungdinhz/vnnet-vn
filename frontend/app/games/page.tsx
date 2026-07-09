// app/games/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import UnderDevelopment from '@/components/UnderDevelopment';

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <UnderDevelopment title="Trò chơi" icon="🎮" />
        </main>
      </div>
    </div>
  );
}
