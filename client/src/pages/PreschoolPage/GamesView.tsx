import React, { useState } from 'react';
import { ArrowLeft, Target, Brain, Hammer, Shuffle } from 'lucide-react';
import LetterHitGame from './LetterHitGame';
import WordMatchGame from './WordMatchGame';
import MemoryGame from './MemoryGame';
import WhackGame from './WhackGame';

interface GamesViewProps {
  onBack: () => void;
  addStar: () => void;
}

interface GameItem {
  key: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const games: GameItem[] = [
  { key: 'letter-hit', title: '字母消消乐', emoji: '🎯', description: '听音找字母', color: 'from-red-400 to-orange-500', icon: <Target size={32} /> },
  { key: 'word-match', title: '单词配对', emoji: '🃏', description: '单词与图片配对', color: 'from-blue-400 to-cyan-500', icon: <Shuffle size={32} /> },
  { key: 'memory', title: '记忆翻牌', emoji: '🧠', description: '翻牌找配对', color: 'from-purple-400 to-pink-500', icon: <Brain size={32} /> },
  { key: 'whack', title: '打地鼠', emoji: '🔨', description: '字母打地鼠', color: 'from-green-400 to-emerald-500', icon: <Hammer size={32} /> },
];

const GamesView: React.FC<GamesViewProps> = ({ onBack, addStar }) => {
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  if (currentGame === 'letter-hit') {
    return <LetterHitGame onBack={() => setCurrentGame(null)} addStar={addStar} />;
  }
  if (currentGame === 'word-match') {
    return <WordMatchGame onBack={() => setCurrentGame(null)} addStar={addStar} />;
  }
  if (currentGame === 'memory') {
    return <MemoryGame onBack={() => setCurrentGame(null)} addStar={addStar} />;
  }
  if (currentGame === 'whack') {
    return <WhackGame onBack={() => setCurrentGame(null)} addStar={addStar} />;
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-orange-600 font-bold">
        <ArrowLeft size={20} /> 返回
      </button>
      <h2 className="text-2xl font-bold text-gray-800 text-center">🎮 游戏乐园</h2>
      <div className="grid grid-cols-2 gap-4">
        {games.map((g: GameItem) => (
          <button
            key={g.key}
            onClick={() => setCurrentGame(g.key)}
            className={`rounded-3xl p-5 text-white shadow-lg active:scale-95 transition-transform text-left bg-gradient-to-br ${g.color}`}
          >
            <div className="text-4xl mb-2">{g.emoji}</div>
            <div className="text-lg font-bold">{g.title}</div>
            <div className="text-sm opacity-90 mt-1">{g.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GamesView;
