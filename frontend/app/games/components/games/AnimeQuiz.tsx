"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '@/types/game';
import { Clock, Zap, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface AnimeQuizProps {
  game: GameItem;
  onGameEnd: (score: number, playTimeSeconds: number) => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTION_BANK: Question[] = [
  {
    id: 1,
    question: "Nhân vật chính Monkey D. Luffy trong One Piece muốn tìm kiếm kho báu gì?",
    options: ["All Blue", "One Piece", "Dragon Ball", "Raftel"],
    correctIndex: 1,
    explanation: "Luffy ra khơi để tìm kiếm kho báu huyền thoại One Piece và trở thành Vua Hải Tặc!"
  },
  {
    id: 2,
    question: "Trong Naruto, Cửu Vĩ Kurama được phong ấn vào ai từ lúc mới sinh?",
    options: ["Sasuke Uchiha", "Kakashi Hatake", "Naruto Uzumaki", "Minato Namikaze"],
    correctIndex: 2,
    explanation: "Minato (Hokage Đệ Tứ) đã phong ấn Kurama vào người con trai Naruto để bảo vệ làng Lá."
  },
  {
    id: 3,
    question: "Cuốn sổ tử thần trong anime Death Note thuộc về Shinigami nào?",
    options: ["Rem", "Ryuk", "Sidoh", "Gelus"],
    correctIndex: 1,
    explanation: "Ryuk là Shinigami đánh rơi cuốn Death Note xuống nhân giới vì cảm thấy thế giới Thần Chết quá nhàm chán."
  },
  {
    id: 4,
    question: "Trong Attack on Titan, bức tường ngoài cùng bảo vệ nhân loại có tên là gì?",
    options: ["Wall Rose", "Wall Sina", "Wall Maria", "Wall Titan"],
    correctIndex: 2,
    explanation: "Wall Maria là bức tường ngoài cùng, bị Titan Thiết Giáp và Titan Khổng Lồ phá hủy ở đầu phim."
  },
  {
    id: 5,
    question: "Kiếm sĩ phái Tam Kiếm trong băng Mũ Rơm là ai?",
    options: ["Sanji", "Roronoa Zoro", "Usopp", "Brook"],
    correctIndex: 1,
    explanation: "Roronoa Zoro sử dụng phái Santoryu (Tam Kiếm) với thanh thứ ba ngậm ở miệng."
  },
  {
    id: 6,
    question: "Trong Kimetsu no Yaiba (Demon Slayer), hơi thở mà Tanjiro học từ Urokodaki là gì?",
    options: ["Hơi thở của Lửa", "Hơi thở của Nước", "Hơi thở của Sấm Sét", "Hơi thở Mặt Trời"],
    correctIndex: 1,
    explanation: "Tanjiro được cựu Thủy Trụ Sakonji Urokodaki huấn luyện Hơi thở của Nước (Water Breathing)."
  },
  {
    id: 7,
    question: "Nhân vật Saitama trong One Punch Man đã tập luyện như thế nào để trở nên vô địch?",
    options: [
      "100 hít đất, 100 gập bụng, 100 squat, chạy 10km mỗi ngày",
      "Ăn tiên đan nghìn năm",
      "Thực hiện nghi lễ biến đổi gen",
      "Luyện tập trọng lực gấp 100 lần"
    ],
    correctIndex: 0,
    explanation: "Bài tập huyền thoại: 100 chống đẩy, 100 gập bụng, 100 squat và chạy 10km mỗi ngày trong 3 năm!"
  },
  {
    id: 8,
    question: "Trong Dragon Ball, quả cầu ngọc rồng ở Trái Đất có bao nhiêu ngôi sao?",
    options: ["Từ 1 đến 5 sao", "Từ 1 đến 7 sao", "Từ 1 đến 9 sao", "Chỉ có 1 quả duy nhất"],
    correctIndex: 1,
    explanation: "Bộ ngọc rồng Trái Đất gồm 7 viên, được đánh số từ 1 đến 7 sao."
  },
  {
    id: 9,
    question: "Tên thanh kiếm Zanpakuto của Ichigo Kurosaki trong Bleach là gì?",
    options: ["Senbonzakura", "Hyourinmaru", "Zangetsu", "Wabisuke"],
    correctIndex: 2,
    explanation: "Thanh Zanpakuto của Ichigo tên là Zangetsu (Trảm Nguyệt)."
  },
  {
    id: 10,
    question: "Trong Jujutsu Kaisen, chú thuật sư mạnh nhất thời hiện đại là ai?",
    options: ["Megumi Fushiguro", "Kento Nanami", "Satoru Gojo", "Yuji Itadori"],
    correctIndex: 2,
    explanation: "Satoru Gojo sở hữu Lục Nhãn và Vô Hạ Hạn, được coi là Chú thuật sư mạnh nhất thế giới."
  },
  {
    id: 11,
    question: "Trong Hunter x Hunter, hệ Niệm của Gon Freecss là hệ nào?",
    options: ["Cường Hóa", "Biến Hóa", "Cụ Thể Hóa", "Đặc Chất"],
    correctIndex: 0,
    explanation: "Gon thuộc hệ Cường Hóa (Enhancer), chiêu thức nổi tiếng là Jajanken."
  },
  {
    id: 12,
    question: "Cô bé Nezuko trong Kimetsu no Yaiba ngậm ống gì trong miệng?",
    options: ["Ống sậy", "Ống tre", "Cành hoa đào", "Khăn lụa"],
    correctIndex: 1,
    explanation: "Thủy Trụ Tomioka Giyu đã dùng ống tre bịt miệng Nezuko để cô bé không cắn người."
  },
  {
    id: 13,
    question: "Anime 'Spirited Away' (Vùng Đất Linh Hồn) do đạo diễn huyền thoại nào chỉ đạo?",
    options: ["Makoto Shinkai", "Hayao Miyazaki", "Mamoru Hosoda", "Satoshi Kon"],
    correctIndex: 1,
    explanation: "Hayao Miyazaki cùng Studio Ghibli đã tạo nên kiệt tác Oscar 'Spirited Away'."
  },
  {
    id: 14,
    question: "Trong Tokyo Ghoul, Kaneki Ken biến thành bán Ghoul sau khi được cấy nội tạng của ai?",
    options: ["Touka Kirishima", "Rize Kamishiro", "Shuu Tsukiyama", "Yoshimura"],
    correctIndex: 1,
    explanation: "Rize Kamishiro (Kẻ phàm ăn) đã tấn công Kaneki trước khi gặp tai nạn, nội tạng của cô được cấy ghép cho Kaneki."
  },
  {
    id: 15,
    question: "Thám tử lừng danh Conan có tên thật là gì?",
    options: ["Kaito Kuroba", "Shinichi Kudo", "Heiji Hattori", "Saguru Hakuba"],
    correctIndex: 1,
    explanation: "Kudo Shinichi bị Tổ chức Áo Đen ép uống thuốc độc APTX 4869 và teo nhỏ thành Conan."
  }
];

export default function AnimeQuiz({ game, onGameEnd }: AnimeQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isGameOver, setIsGameOver] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize random 10 questions
  useEffect(() => {
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
  }, []);

  // Question timer
  useEffect(() => {
    if (isGameOver || questions.length === 0 || isAnswered) return;

    setTimeLeft(25);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isGameOver, questions.length]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setStreak(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || isGameOver) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    if (isCorrect) {
      const responseTime = (Date.now() - questionStartTimeRef.current) / 1000;
      // Speed bonus: up to 50 points if answered within 5 seconds
      const speedBonus = Math.max(0, Math.round((25 - responseTime) * 2));
      const streakBonus = streak * 10;
      const pointsEarned = 100 + speedBonus + streakBonus;

      setScore((prev) => Math.min(game.max_score, prev + pointsEarned));
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsGameOver(true);
    const totalPlayTime = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    onGameEnd(score, totalPlayTime);
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Status Bar */}
      <div className="glass-card p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-current" /> Combo x{streak}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
          <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span className={timeLeft <= 5 ? 'text-rose-400' : 'text-foreground'}>
            {timeLeft}s
          </span>
        </div>

        {/* Score */}
        <div className="text-right">
          <span className="text-xs text-text-muted">Điểm: </span>
          <span className="text-lg font-black text-indigo-400 font-mono">
            {score}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-surface-hover/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-indigo-500/25 shadow-xl">
        <h2 className="text-lg md:text-xl font-bold text-foreground text-center leading-relaxed mb-6">
          {currentQ.question}
        </h2>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {currentQ.options.map((option, idx) => {
            let btnStyle = 'bg-surface-hover/40 border-indigo-500/20 hover:bg-surface-hover/80 hover:border-indigo-500/40 text-foreground';

            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                btnStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-lg shadow-emerald-500/20';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-lg shadow-rose-500/20';
              } else {
                btnStyle = 'opacity-40 bg-surface-hover/20 border-transparent';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-2xl border text-left text-sm md:text-base font-semibold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {isAnswered && (
          <div className="mt-6 pt-5 border-t border-indigo-500/15 space-y-4">
            <p className="text-xs md:text-sm text-indigo-300/90 bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20">
              💡 <span className="font-semibold">Giải thích:</span> {currentQ.explanation}
            </p>

            <button
              onClick={handleNextQuestion}
              className="w-full btn-anime py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {currentIndex + 1 < questions.length ? 'Câu tiếp theo →' : 'Xem kết quả tổng kết 🏆'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
