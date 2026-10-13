import React from 'react';
import { BookX, Sparkles } from 'lucide-react';
import type { MathWrongQuestion } from '@shared/api.interface';

interface WrongBookTabProps {
  wrongQuestions: MathWrongQuestion[];
  wrongTotal: number;
  loading: boolean;
  onMarkMastered: (id: string) => void;
}

const WrongBookTab: React.FC<WrongBookTabProps> = ({
  wrongQuestions,
  wrongTotal,
  loading,
  onMarkMastered,
}) => {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookX size={20} className="text-rose-500" />
          错题本
        </h2>
        <p className="text-sm text-slate-400 mt-1">共 {wrongTotal} 道错题</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : wrongQuestions.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Sparkles size={48} className="mx-auto text-green-400 mb-3" />
          <div className="text-slate-200 font-medium">太棒了！暂无错题</div>
          <div className="text-sm text-slate-400 mt-1">继续保持，加油！</div>
        </div>
      ) : (
        <div className="space-y-3">
          {wrongQuestions.map((q) => (
            <div
              key={q.id}
              className="glass-card rounded-xl p-4"
            >
              <div className="text-sm font-medium text-white mb-2">
                {q.questionText}
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-rose-500">错 {q.wrongCount} 次</span>
                  <span className="text-slate-500">正确答案：{q.correctAnswer}</span>
                </div>
                {q.masterStatus !== 'mastered' && (
                  <button
                    onClick={() => onMarkMastered(q.id)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    标记掌握
                  </button>
                )}
                {q.masterStatus === 'mastered' && (
                  <span className="text-green-400 text-xs">已掌握</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WrongBookTab;
