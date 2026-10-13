import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { speak } from './speak';

interface LetterHitGameProps {
  onBack: () => void;
  addStar: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const LetterHitGame: React.FC<LetterHitGameProps> = ({ onBack, addStar }) => {
  const [options, setOptions] = useState<string[]>([]);
  const [target, setTarget] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  const newRound = useCallback((): void => {
    const shuffled = [...LETTERS].sort(() => Math.random() - 0.5).slice(0, 6);
    const t = shuffled[Math.floor(Math.random() * shuffled.length)];
    setOptions(shuffled);
    setTarget(t);
    setFeedback('');
    setTimeout(() => speak(t, 0.7), 300);
  }, []);

  useEffect(() => { newRound(); }, [newRound]);

  const handleClick = (letter: string): void => {
    if (letter === target) {
      setFeedback('correct');
      setScore(s => s + 1);
      addStar();
      setTimeout(newRound, 800);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(''), 500);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-red-600 font-bold">
        <ArrowLeft size={20} /> 返回游戏
      </button>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">🎯 字母消消乐</h2>
        <div className="bg-yellow-100 px-3 py-1 rounded-full font-bold text-yellow-700">
          ⭐ {score}
        </div>
      </div>

      <button
        onClick={() => speak(target, 0.7)}
        className="w-full py-6 bg-gradient-to-r from-red-400 to-orange-500 text-white rounded-3xl shadow-lg active:scale-95 transition-transform"
      >
        <div className="text-lg">点击听发音</div>
        <div className="text-4xl font-bold mt-2">🔊</div>
      </button>

      <div className="grid grid-cols-3 gap-3">
        {options.map((letter: string, idx: number) => {
          const isCorrect = letter === target && feedback === 'correct';
          const isWrong = feedback === 'wrong';
          return (
            <button
              key={idx}
              onClick={() => handleClick(letter)}
              className={`aspect-square rounded-2xl text-4xl font-bold text-white shadow-lg active:scale-90 transition-all ${
                isCorrect ? 'bg-green-500 scale-110' : isWrong ? 'bg-red-400 animate-pulse' : 'bg-gradient-to-br from-blue-400 to-purple-500'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LetterHitGame;
