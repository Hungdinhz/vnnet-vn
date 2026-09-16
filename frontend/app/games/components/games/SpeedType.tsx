"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '@/types/game';
import { Clock, Zap, Keyboard, RotateCcw, Check, Sparkles } from 'lucide-react';

interface SpeedTypeProps {
  game: GameItem;
  onGameEnd: (score: number, playTimeSeconds: number) => void;
}

const WORDS_BANK = [
  "Luffy", "Naruto", "Goku", "Zoro", "Sasuke", "Ichigo", "Tanjiro",
  "Nezuko", "Gojo", "Saitama", "Eren", "Mikasa", "Levi", "Kakashi",
  "Vegeta", "Madara", "Itachi", "Sukuna", "Killua", "Gon", "Kurapika",
  "Sanji", "Nami", "Robin", "Chopper", "Kagebunshin", "Rasengan",
  "Chidori", "Kamehameha", "Bankai", "Getsuga", "Domain", "Hollow",
  "Titan", "Sharingan", "Byakugan", "Rinnegan", "Bounty", "Nakama"
];

export default function SpeedType({ game, onGameEnd }: SpeedTypeProps) {
  const [wordList, setWordList] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const shuffled = [...WORDS_BANK].sort(() => Math.random() - 0.5).slice(0, 30);
    setWordList(shuffled);
    setCurrentWordIndex(0);
    setInputVal("");
    setTimeLeft(60);
    setCorrectCount(0);
    setTotalCharacters(0);
    setIsGameOver(false);
    setIsGameActive(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    if (timeLeft === 0 && isGameActive) {
      handleGameOver();
    }
  }, [timeLeft, isGameActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isGameActive || isGameOver) return;

    const val = e.target.value;
    const currentTarget = wordList[currentWordIndex];

    // If typed with space or exactly matches
    if (val.endsWith(" ") || val.trim().toLowerCase() === currentTarget.toLowerCase()) {
      const trimmed = val.trim();
      if (trimmed.toLowerCase() === currentTarget.toLowerCase()) {
        setCorrectCount((prev) => prev + 1);
        setTotalCharacters((prev) => prev + currentTarget.length);
      }

      setInputVal("");
      if (currentWordIndex + 1 < wordList.length) {
        setCurrentWordIndex((prev) => prev + 1);
      } else {
        // Completed all words
        handleGameOver();
      }
    } else {
      setInputVal(val);
    }
  };

  const calculateScore = () => {
    // Score based on characters typed + correct words bonus
    const charScore = totalCharacters * 15;
    const wordBonus = correctCount * 35;
    const total = charScore + wordBonus;
    return Math.max(50, Math.min(game.max_score, total));
  };

  const handleGameOver = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameOver(true);
    setIsGameActive(false);

    const finalScore = calculateScore();
    const playedSeconds = 60 - timeLeft;
    onGameEnd(finalScore, Math.max(1, playedSeconds));
  };

  const currentTarget = wordList[currentWordIndex] || "";
  const wpm = timeLeft < 60 ? Math.round((totalCharacters / 5) / ((60 - timeLeft) / 60)) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span className={`font-mono font-bold text-sm ${timeLeft <= 10 ? 'text-rose-400' : 'text-foreground'}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Tốc độ:</span>
          <span className="font-bold text-foreground font-mono">{wpm} WPM</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
          <Check className="w-3.5 h-3.5" />
          <span>{correctCount} từ đúng</span>
        </div>

        <button
          onClick={initGame}
          className="p-2 rounded-xl bg-surface-hover/80 hover:bg-surface-hover text-text-muted hover:text-foreground border border-indigo-500/10 transition-colors cursor-pointer"
          title="Chơi lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Target Word Display */}
      <div className="glass-card p-8 md:p-10 rounded-3xl border border-indigo-500/30 text-center shadow-xl space-y-6">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <Keyboard className="w-4 h-4 text-indigo-400" />
          <span>Gõ từ hiển thị bên dưới (nhấn Space hoặc gõ đúng để qua từ)</span>
        </div>

        <div className="py-4">
          <span className="text-4xl md:text-5xl font-black text-indigo-300 font-mono tracking-wide drop-shadow-md">
            {currentTarget}
          </span>
        </div>

        {/* Word queue preview */}
        <div className="flex items-center justify-center gap-2 overflow-hidden opacity-50 text-xs font-mono">
          {wordList.slice(currentWordIndex + 1, currentWordIndex + 5).map((w, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-surface-hover text-text-muted">
              {w}
            </span>
          ))}
        </div>

        {/* Typing Input */}
        <div className="max-w-md mx-auto">
          <input
            ref={inputRef}
            type="text"
            disabled={!isGameActive || isGameOver}
            value={inputVal}
            onChange={handleInputChange}
            placeholder="Gõ từ vào đây..."
            autoFocus
            className="w-full text-center text-xl md:text-2xl font-bold py-3 px-4 rounded-2xl bg-surface-hover/60 border-2 border-indigo-500/30 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 text-foreground transition-all"
          />
        </div>
      </div>
    </div>
  );
}
