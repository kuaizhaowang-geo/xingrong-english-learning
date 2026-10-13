import React, { memo } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type Difficulty = 'easy' | 'medium' | 'hard';

const SwitchToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  activeColor: string;
}> = ({ checked, onChange, activeColor }) => (
  <button
    type="button"
    onClick={onChange}
    aria-checked={checked}
    role="switch"
    className={`w-8 h-[18px] rounded-full transition-colors relative flex-shrink-0 ${
      checked ? activeColor : 'bg-slate-600'
    }`}
  >
    <motion.div
      animate={{ x: checked ? 16 : 2 }}
      className="absolute top-[2px] w-3.5 h-3.5 bg-white rounded-full shadow-md"
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </button>
);

interface TypingControlBarProps {
  elapsedSeconds: number;
  fingerGuide: boolean;
  onToggleFingerGuide: () => void;
  showKeyboard: boolean;
  onToggleKeyboard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  letterPronunciation: boolean;
  onToggleLetterPronunciation: () => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
}

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: 'easy', label: '简单', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/20' },
  { id: 'medium', label: '中等', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/20' },
  { id: 'hard', label: '困难', color: 'text-rose-400 border-rose-500/50 bg-rose-500/20' },
];

const TypingControlBar: React.FC<TypingControlBarProps> = ({
  elapsedSeconds,
  fingerGuide,
  onToggleFingerGuide,
  showKeyboard,
  onToggleKeyboard,
  soundEnabled,
  onToggleSound,
  letterPronunciation,
  onToggleLetterPronunciation,
  difficulty,
  onDifficultyChange,
}) => {
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15 min-h-[28px]">
      {/* 左侧：学习计时器 */}
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-cyan-400" />
        <span className="text-xs font-mono text-cyan-300">
          {formatTime(elapsedSeconds)}
        </span>
         <span className="text-[10px] text-slate-400 ml-0.5">学习时长</span>
      </div>

      {/* 中间：难度选择 */}
      <div className="flex items-center gap-1.5">
         <span className="text-[10px] text-slate-400">难度</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDifficultyChange(d.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
              difficulty === d.id
                ? d.color
                 : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 右侧：四个开关 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] text-slate-400">指法引导</span>
          <SwitchToggle
            checked={fingerGuide}
            onChange={onToggleFingerGuide}
            activeColor="bg-violet-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] text-slate-400">键盘显示</span>
          <SwitchToggle
            checked={showKeyboard}
            onChange={onToggleKeyboard}
            activeColor="bg-cyan-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] text-slate-400">音效</span>
          <SwitchToggle
            checked={soundEnabled}
            onChange={onToggleSound}
            activeColor="bg-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] text-slate-400">字母发音</span>
          <SwitchToggle
            checked={letterPronunciation}
            onChange={onToggleLetterPronunciation}
            activeColor="bg-pink-500"
          />
        </div>
      </div>
    </div>
  );
};

export default memo(TypingControlBar);
