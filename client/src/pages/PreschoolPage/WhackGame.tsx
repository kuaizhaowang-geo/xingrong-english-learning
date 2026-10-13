import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { speak } from './speak';

interface WhackGameProps {
  onBack: () => void;
  addStar: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const WhackGame: React.FC<WhackGameProps> = ({ onBack, addStar }) => {
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [activeHole, setActiveHole] = useState<number>(-1);
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [started, setStarted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnMole = useCallback((): void => {
    const hole = Math.floor(Math.random() * 9);
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    setActiveHole(hole);
    setActiveLetter(letter);
    speak(letter, 0.8);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    moleTimerRef.current = setTimeout(() => {
      setActiveHole(-1);
      setTimeout(spawnMole, 300);
    }, 1200);
  }, []);

  const startGame = (): void => {
    setScore(0);
    setTimeLeft(30);
    setStarted(true);
    setFeedback('');
    spawnMole();
  };

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
          setActiveHole(-1);
          setStarted(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    };
  }, [started, spawnMole]);

  const whack = (hole: number): void => {
    if (!started) return;
    if (hole === activeHole) {
      setScore(s => s + 1);
      addStar();
      setFeedback('hit');
      setActiveHole(-1);
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      setTimeout(() => {
        setFeedback('');
        spawnMole();
      }, 400);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-green-600 font-bold">
        <ArrowLeft size={20} /> 返回游戏
      </button>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">🔨 打地鼠</h2>
        <div className="flex gap-2">
          <span className="bg-yellow-100 px-3 py-1 rounded-full font-bold text-yellow-700">⭐ {score}</span>
          <span className="bg-red-100 px-3 py-1 rounded-full font-bold text-red-700">⏱ {timeLeft}s</span>
        </div>
      </div>

      {!started && timeLeft === 30 && (
        <button
          onClick={startGame}
          className="w-full py-6 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-3xl shadow-lg active:scale-95 transition-transform text-xl font-bold"
        >
          开始游戏
        </button>
      )}

      {!started && timeLeft === 0 && (
        <div className="bg-green-100 p-6 rounded-3xl text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="text-xl font-bold text-green-700">游戏结束！</div>
          <div className="text-lg text-green-600 mt-2">得分：{score}</div>
          <button
            onClick={startGame}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full font-bold active:scale-95 transition-transform"
          >
            再玩一次
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 p-4 bg-amber-100 rounded-3xl">
        {Array.from({ length: 9 }).map((_, idx: number) => (
          <button
            key={idx}
            onClick={() => whack(idx)}
            className={`aspect-square rounded-full flex items-center justify-center text-4xl font-bold shadow-inner active:scale-90 transition-all ${
              activeHole === idx
                ? 'bg-gradient-to-b from-green-400 to-green-600 text-white scale-105'
                : 'bg-amber-800/30'
            }`}
          >
            {activeHole === idx ? activeLetter : ''}
          </button>
        ))}
      </div>

      {feedback === 'hit' && (
        <div className="text-center text-2xl font-bold text-green-500 animate-bounce">
          +1 ⭐
        </div>
      )}

      <p className="text-center text-gray-500 text-sm">
        听发音，点击冒出的字母地鼠！
      </p>
    </div>
  );
};

export default WhackGame;
