import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

interface MemoryGameProps {
  onBack: () => void;
  addStar: () => void;
}

interface MemoryCard {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const MEMORY_EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'];

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, addStar }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);

  const initGame = useCallback((): void => {
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({ id: idx, emoji, flipped: false, matched: false }));
    setCards(pairs);
    setFlippedIds([]);
    setMoves(0);
    setLocked(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const flipCard = (id: number): void => {
    if (locked) return;
    if (flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);
      if (first.emoji === second.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
          ));
          setFlippedIds([]);
          setLocked(false);
          addStar();
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  const matchedCount = cards.filter(c => c.matched).length;
  const isComplete = matchedCount === cards.length && cards.length > 0;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-purple-600 font-bold">
        <ArrowLeft size={20} /> 返回游戏
      </button>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">🧠 记忆翻牌</h2>
        <div className="text-gray-600 font-bold">步数: {moves}</div>
      </div>

      {isComplete && (
        <div className="bg-purple-100 text-purple-700 p-4 rounded-2xl text-center font-bold">
          🎉 恭喜完成！用了 {moves} 步
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card: MemoryCard) => (
          <button
            key={card.id}
            onClick={() => flipCard(card.id)}
            className={`aspect-square rounded-xl text-3xl shadow-md active:scale-95 transition-all duration-300 ${
              card.flipped || card.matched
                ? 'bg-white/10 border border-white/20 rotate-0 text-white'
                : 'bg-gradient-to-br from-purple-500 to-pink-500'
            } ${card.matched ? 'opacity-60' : ''}`}
          >
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>

      <button
        onClick={initGame}
        className="w-full py-3 bg-purple-500 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform"
      >
        🔄 重新开始
      </button>
    </div>
  );
};

export default MemoryGame;
