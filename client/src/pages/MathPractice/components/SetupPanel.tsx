import React from 'react';
import { Play, Calculator } from 'lucide-react';

const ITEM_TYPES = [
  { value: 'oral', label: '口算' },
  { value: 'fill', label: '填空' },
  { value: 'choice', label: '选择' },
  { value: 'judge', label: '判断' },
  { value: 'word', label: '应用' },
];

const DIFFICULTIES = [
  { value: 'easy', label: '简单', color: 'from-green-400 to-emerald-500' },
  { value: 'medium', label: '中等', color: 'from-blue-400 to-indigo-500' },
  { value: 'hard', label: '困难', color: 'from-orange-500 to-red-500' },
];

const COUNT_OPTIONS = [10, 20, 50];

interface SetupPanelProps {
  selectedTypes: string[];
  difficulty: string;
  count: number;
  loading: boolean;
  onToggleType: (type: string) => void;
  onDifficultyChange: (d: string) => void;
  onCountChange: (c: number) => void;
  onStart: () => void;
}

const SetupPanel: React.FC<SetupPanelProps> = ({
  selectedTypes,
  difficulty,
  count,
  loading,
  onToggleType,
  onDifficultyChange,
  onCountChange,
  onStart,
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">数学练习</h2>
            <p className="text-sm text-white/80">选择题型，开始挑战</p>
          </div>
        </div>
      </div>

      {/* 题型选择 */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">题型选择（多选）</h3>
        <div className="grid grid-cols-5 gap-2">
          {ITEM_TYPES.map((type) => {
            const active = selectedTypes.includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => onToggleType(type.value)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                     ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                     : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 难度选择 */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">难度选择</h3>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.value;
            return (
              <button
                key={d.value}
                onClick={() => onDifficultyChange(d.value)}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  active
                     ? `bg-gradient-to-r ${d.color} text-white shadow-md scale-[1.02]`
                     : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 题目数量 */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">题目数量</h3>
        <div className="grid grid-cols-3 gap-3">
          {COUNT_OPTIONS.map((c) => {
            const active = count === c;
            return (
              <button
                key={c}
                onClick={() => onCountChange(c)}
                className={`py-4 rounded-xl font-bold text-lg transition-all ${
                  active
                     ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                     : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {c} 题
              </button>
            );
          })}
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        onClick={onStart}
        disabled={loading || selectedTypes.length === 0}
        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          '加载中...'
        ) : (
          <>
            <Play size={20} />
            开始练习
          </>
        )}
      </button>
    </div>
  );
};

export default SetupPanel;
