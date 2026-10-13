import React from 'react';
import { Trophy, ChevronLeft, RotateCcw, BookX } from 'lucide-react';
import type { MathPracticeItem } from '@shared/api.interface';

interface WrongRecord {
  item: MathPracticeItem;
  userAnswer: string;
}

interface ResultPanelProps {
  accuracy: number;
  correctCount: number;
  totalCount: number;
  totalDuration: number;
  wrongRecords: WrongRecord[];
  loading: boolean;
  onRestart: () => void;
  onRetry: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
};

const ResultPanel: React.FC<ResultPanelProps> = ({
  accuracy,
  correctCount,
  totalCount,
  totalDuration,
  wrongRecords,
  loading,
  onRestart,
  onRetry,
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg text-center">
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
          <Trophy size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-1">练习完成！</h2>
        <p className="text-white/80 text-sm">做得不错，继续加油！</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{accuracy}%</div>
          <div className="text-xs text-slate-400 mt-1">正确率</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">
            {correctCount}/{totalCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">答对题数</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">
            {formatTime(totalDuration)}
          </div>
          <div className="text-xs text-slate-400 mt-1">用时</div>
        </div>
      </div>

      {/* 错题列表 */}
      {wrongRecords.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <BookX size={18} className="text-rose-500" />
            错题回顾（{wrongRecords.length}）
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {wrongRecords.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <div className="text-sm font-medium text-slate-200 mb-1">
                  {rec.item.question}
                </div>
                <div className="text-xs flex items-center gap-4">
                  <span className="text-rose-400">你的答案：{rec.userAnswer}</span>
                  <span className="text-emerald-400">
                    正确答案：{rec.item.correctAnswer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRestart}
          className="py-3.5 rounded-xl font-semibold bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={18} />
          返回设置
        </button>
        <button
          onClick={onRetry}
          disabled={loading}
          className="py-3.5 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RotateCcw size={18} />
          再练一次
        </button>
      </div>
    </div>
  );
};

export default ResultPanel;
