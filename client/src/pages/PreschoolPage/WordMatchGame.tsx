import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { speak } from './speak';

interface WordMatchGameProps {
  onBack: () => void;
  addStar: () => void;
}

const WORD_PAIRS = [
  { word: 'cat', emoji: '🐱', meaning: '猫' },
  { word: 'dog', emoji: '🐶', meaning: '狗' },
  { word: 'apple', emoji: '🍎', meaning: '苹果' },
  { word: 'sun', emoji: '☀️', meaning: '太阳' },
];

const WordMatchGame: React.FC<WordMatchGameProps> = ({ onBack, addStar }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [words] = useState([...WORD_PAIRS].sort(() => Math.random() - 0.5));
  const [emojis] = useState([...WORD_PAIRS].sort(() => Math.random() - 0.5));
  const [feedback, setFeedback] = useState<string>('');

  const handleWordClick = (word: string): void => {
    setSelectedWord(word);
    speak(word, 0.7);
  };

  const handleEmojiClick = (pair: typeof WORD_PAIRS[0]): void => {
    if (!selectedWord) return;
    if (matched.has(pair.word)) return;
    if (selectedWord === pair.word) {
      const newMatched = new Set(matched);
      newMatched.add(pair.word);
      setMatched(newMatched);
      addStar();
      setFeedback('correct');
      setTimeout(() => { setFeedback(''); setSelectedWord(null); }, 600);
    } else {
      setFeedback('wrong');
      setTimeout(() => { setFeedback(''); setSelectedWord(null); }, 600);
    }
  };

  const isComplete = matched.size === WORD_PAIRS.length;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 font-bold">
        <ArrowLeft size={20} /> 返回游戏
      </button>
      <h2 className="text-xl font-bold text-gray-800 text-center">🃏 单词配对</h2>

      {isComplete && (
        <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-center font-bold text-lg">
          🎉 全部配对成功！
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {words.map((w, idx: number) => (
            <button
              key={idx}
              onClick={() => handleWordClick(w.word)}
              disabled={matched.has(w.word)}
               className={`w-full p-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-all ${
                 matched.has(w.word)
                   ? 'bg-slate-700/50 text-slate-400'
                   : selectedWord === w.word
                   ? 'bg-fuchsia-500 text-white scale-105'
                   : 'glass-card text-white'
               }`}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {emojis.map((w, idx: number) => (
            <button
              key={idx}
              onClick={() => handleEmojiClick(w)}
              disabled={matched.has(w.word)}
               className={`w-full p-4 rounded-2xl text-3xl shadow-md active:scale-95 transition-all ${
                 matched.has(w.word)
                   ? 'bg-slate-700/50 opacity-50'
                   : feedback === 'wrong'
                   ? 'bg-red-500/20 border border-red-500/30'
                   : 'glass-card'
               }`}
            >
              {w.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordMatchGame;
