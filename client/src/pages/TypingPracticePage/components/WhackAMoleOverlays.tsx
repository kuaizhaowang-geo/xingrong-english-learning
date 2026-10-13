import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Zap, Star, Trophy } from 'lucide-react';
import { LEVELS } from '../data/whackAMoleLevels';

export interface GameOverlaysProps {
  gameState: 'idle' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';
  score: number;
  level: number;
  maxCombo: number;
  bestScore: number;
  endlessSpeedTier: number;
  onStart: () => void;
  onResume: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
}

const GameOverlays: React.FC<GameOverlaysProps> = ({
  gameState,
  score,
  level,
  maxCombo,
  bestScore,
  endlessSpeedTier,
  onStart,
  onResume,
  onRestartLevel,
  onNextLevel,
}) => {
  const isEndless = level === LEVELS.length - 1;

  return (
    <>
      {/* Idle overlay */}
      <AnimatePresence>
        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(13_11_31_0.85)] backdrop-blur-sm rounded-2xl z-30"
          >
            <div className="text-6xl md:text-7xl mb-4">🐹</div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              打地鼠闯关
            </h2>
             <p className="text-slate-500 text-sm mb-6 text-center px-4">
              键盘按下地鼠头上的字母，打中得分！
              <br />
              共 6 关，越往后越快
            </p>
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white shadow-[0_0_25px_rgba(239_68_68_0.5)] hover:shadow-[0_0_35px_rgba(239_68_68_0.7)] transition-shadow flex items-center gap-2"
            >
              <Play size={20} />
              开始游戏
            </motion.button>
            {bestScore > 0 && (
              <div className="mt-4 text-[#FFD166] text-sm flex items-center gap-1">
                <Star size={14} /> 历史最高：{bestScore}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paused overlay */}
      <AnimatePresence>
        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(13_11_31_0.85)] backdrop-blur-sm rounded-2xl z-30"
          >
            <h2 className="text-2xl font-bold text-white mb-6">已暂停</h2>
            <div className="flex gap-3">
              <motion.button
                onClick={onResume}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-[0_0_15px_rgba(124_58_237_0.5)]"
              >
                继续
              </motion.button>
              <motion.button
                onClick={onRestartLevel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                 className="neon-btn px-6 py-2.5 rounded-xl font-medium"
              >
                重新开始
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level complete overlay */}
      <AnimatePresence>
        {gameState === 'levelComplete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(13_11_31_0.9)] backdrop-blur-sm rounded-2xl z-30 p-4"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FFD166] to-[#F97316] bg-clip-text text-transparent mb-2">
              第 {level + 1} 关通过！
            </h2>
             <p className="text-slate-500 mb-1">
              得分：<span className="text-white font-bold">{score}</span>
            </p>
             <p className="text-slate-500 mb-5">
              最高连击：<span className="text-[#06B6D4] font-bold">{maxCombo}</span>
            </p>
            <motion.button
              onClick={onNextLevel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#22C55E] to-[#06B6D4] text-[#EEF2FF] shadow-[0_0_25px_rgba(34_211_238_0.5)] flex items-center gap-2"
            >
              <Zap size={20} />
              下一关
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game over overlay */}
      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(13_11_31_0.92)] backdrop-blur-sm rounded-2xl z-30 p-4"
          >
            <div className="text-5xl mb-3">{isEndless ? '🏆' : '💀'}</div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {isEndless ? '游戏结束' : '挑战失败'}
            </h2>
            <div className="space-y-1 mb-5 text-center">
              <p className="text-slate-500">
                本局分数：
                <span className="text-white font-bold text-lg">{score}</span>
              </p>
              <p className="text-slate-500">
                通关关卡：
                <span className="text-[#6366F1] font-bold">第 {level + 1} 关</span>
              </p>
              <p className="text-slate-500">
                最高连击：
                <span className="text-[#06B6D4] font-bold">{maxCombo}</span>
              </p>
              {isEndless && (
                <p className="text-slate-500">
                  到达档位：
                  <span className="text-[#F97316] font-bold">{endlessSpeedTier + 1}</span>
                </p>
              )}
              <p className="text-[#FFD166] flex items-center justify-center gap-1">
                <Star size={14} /> 历史最高：{bestScore}
              </p>
            </div>
            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white shadow-[0_0_25px_rgba(239_68_68_0.5)] flex items-center gap-2"
            >
              <RotateCcw size={18} />
              再来一次
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const LeaderboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
  getScores: () => number[];
}> = ({ open, onClose, getScores }) => {
  const scores = getScores();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0_0_0_0.7)] backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
             className="glass-card rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="text-[#FFD166]" size={24} />
              <h3 className="text-xl font-bold text-white">排行榜</h3>
            </div>
            <div className="space-y-2 mb-5">
              {scores.length > 0 ? (
                scores.map((s: number, i: number) => (
                  <div
                    key={i}
                     className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 border border-fuchsia-500/15"
                  >
                    <span className="text-[#FFD166] font-bold">第 {i + 1} 名</span>
                    <span className="text-white font-semibold">{s} 分</span>
                  </div>
                ))
              ) : (
                  <p className="text-center text-slate-400 py-6">
                  暂无记录，快来挑战吧！
                </p>
              )}
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white font-medium"
            >
              关闭
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverlays;
