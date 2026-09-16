"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '@/types/game';
import { Clock, Trophy, RotateCcw, Sparkles } from 'lucide-react';

interface MemoryMatchProps {
  game: GameItem;
  onGameEnd: (score: number, playTimeSeconds: number) => void;
}

interface CardItem {
  id: number;
  pairId: number;
  emoji: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARDS_DATA = [
  { pairId: 1, emoji: '⚡', name: 'Pikachu' },
  { pairId: 2, emoji: '👒', name: 'Luffy' },
  { pairId: 3, emoji: '🍜', name: 'Naruto' },
  { pairId: 4, emoji: '🗡️', name: 'Tanjiro' },
  { pairId: 5, emoji: '🥊', name: 'Saitama' },
  { pairId: 6, emoji: '🐉', name: 'Goku' },
  { pairId: 7, emoji: '👁️', name: 'Gojo' },
  { pairId: 8, emoji: '🍎', name: 'Ryuk' },
];

export default function MemoryMatch({ game, onGameEnd }: MemoryMatchProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize deck
  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const deck: CardItem[] = [];
    CARDS_DATA.forEach((item, index) => {
      deck.push({
        id: index * 2,
        pairId: item.pairId,
        emoji: item.emoji,
        name: item.name,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: index * 2 + 1,
        pairId: item.pairId,
        emoji: item.emoji,
        name: item.name,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatchesCount(0);
    setElapsedSeconds(0);
    setIsGameOver(false);
    setIsGameActive(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 180) {
          // Timeout after 3 mins
          if (timerRef.current) clearInterval(timerRef.current);
          return 180;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleCardClick = (cardIndex: number) => {
    if (!isGameActive || isGameOver) return;
    if (flippedCards.length >= 2) return;

    const clickedCard = cards[cardIndex];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip this card
    const updatedCards = [...cards];
    updatedCards[cardIndex].isFlipped = true;
    setCards(updatedCards);

    const newFlipped = [...flippedCards, cardIndex];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = updatedCards[firstIdx];
      const secondCard = updatedCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // Matched!
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[firstIdx].isMatched = true;
            next[secondIdx].isMatched = true;
            return next;
          });
          setFlippedCards([]);
          setMatchesCount((prev) => {
            const nextMatches = prev + 1;
            if (nextMatches === CARDS_DATA.length) {
              handleWin();
            }
            return nextMatches;
          });
        }, 400);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards((prev) => {
            const next = [...prev];
            next[firstIdx].isFlipped = false;
            next[secondIdx].isFlipped = false;
            return next;
          });
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  const calculateFinalScore = (time: number, totalMoves: number) => {
    // Formula: 1000 base - (time * 4) - ((totalMoves - 8) * 15)
    const base = 1000;
    const timePenalty = time * 4;
    const mistakePenalty = Math.max(0, totalMoves - 8) * 15;
    const computed = base - timePenalty - mistakePenalty;
    return Math.max(100, Math.min(game.max_score, computed));
  };

  const handleWin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGameOver(true);
    setIsGameActive(false);

    const finalScore = calculateFinalScore(elapsedSeconds, moves + 1);
    onGameEnd(finalScore, Math.max(1, elapsedSeconds));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-bold text-foreground text-sm">
            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span>Lần lật:</span>
          <span className="font-bold text-foreground font-mono">{moves}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{matchesCount} / {CARDS_DATA.length} cặp</span>
        </div>

        <button
          onClick={initGame}
          className="p-2 rounded-xl bg-surface-hover/80 hover:bg-surface-hover text-text-muted hover:text-foreground border border-indigo-500/10 transition-colors cursor-pointer"
          title="Chơi lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-4 gap-3 md:gap-4 aspect-square max-w-lg mx-auto">
        {cards.map((card, idx) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.id}
              disabled={isRevealed || flippedCards.length >= 2}
              onClick={() => handleCardClick(idx)}
              className={`rounded-2xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer select-none text-center relative border ${
                card.isMatched
                  ? 'bg-emerald-500/20 border-emerald-500/40 scale-95 opacity-85 shadow-lg shadow-emerald-500/15'
                  : isRevealed
                  ? 'bg-indigo-600/30 border-indigo-400/50 scale-100 shadow-lg shadow-indigo-500/20'
                  : 'bg-surface-hover/80 hover:bg-surface-hover border-indigo-500/20 hover:border-indigo-400/50 hover:scale-[1.03]'
              }`}
            >
              {isRevealed ? (
                <div className="animate-fade-in flex flex-col items-center">
                  <span className="text-3xl md:text-4xl">{card.emoji}</span>
                  <span className="text-[10px] md:text-xs font-semibold text-foreground/80 mt-1">
                    {card.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-indigo-400/40">
                  <span className="text-2xl font-black">?</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400/30">
                    VnNet
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
