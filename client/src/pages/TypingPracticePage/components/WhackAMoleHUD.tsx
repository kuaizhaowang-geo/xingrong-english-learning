import React from 'react';
import { Heart, Zap } from 'lucide-react';
import { LEVELS } from '../data/whackAMoleLevels';

export interface GameHUDProps {
  score: number;
  level: number;
  lives: number;
  combo: number;
  bestScore: number;
  endlessSpeedTier: number;
  gameState: string;
}

const GameHUD: React.FC<GameHUDProps> = ({
  score,
  level,
  lives,
  combo,
  bestScore,
  endlessSpeedTier,
  gameState,
}) => {
  const isEndless = level === LEVELS.length - 1;
  const currentLevel = LEVELS[level];

  return (
    <div className="px-4 md:px-6 max-w-5xl mx-auto w-full mb-2">
      <div className="flex items-center justify-between gap-4 md:gap-8 glass-card rounded-xl px-4 py-3">
        <div className="text-center">
           <div className="text-xs text-slate-400 mb-0.5">分数</div>
          <div className="text-xl md:text-2xl font-bold text-white">{score}</div>
        </div>
        <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">关卡</div>
          <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">
            {level + 1}/{LEVELS.length}
          </div>
        </div>
        <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">生命</div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i: number) => (
              <Heart
                key={i}
                size={18}
                 className={i < lives ? 'text-rose-400 fill-rose-400' : 'text-slate-600'}
              />
            ))}
          </div>
        </div>
        <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">连击</div>
          <div className={`text-lg md:text-xl font-bold flex items-center gap-1 ${
            combo >= 5 ? 'text-[#06B6D4]' : 'text-white'
          }`}>
            {combo >= 5 && <Zap size={16} className="text-[#06B6D4]" />}
            {combo}
          </div>
        </div>
      </div>

      {isEndless && gameState === 'playing' && (
        <div className="mt-2 text-center text-xs text-[#FFD166]">
          🔥 无尽模式 · 速度档位 {endlessSpeedTier + 1} · 最高分 {bestScore}
        </div>
      )}
    </div>
  );
};

export default GameHUD;
