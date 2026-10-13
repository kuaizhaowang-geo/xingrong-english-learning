import React from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Target,
  Clock,
  RotateCcw,
  ArrowLeft,
  BookX,
} from 'lucide-react';
import type { UserWordbookItem } from '@shared/api.interface';

interface StudyResultProps {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  durationSeconds: number;
  wrongItems: UserWordbookItem[];
  modeLabel: string;
  wordbookName: string;
  onBack: () => void;
  onRestart: () => void;
  onRetryWrong: () => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}分${secs}秒`;
  return `${secs}秒`;
};

const StudyResult: React.FC<StudyResultProps> = ({
  total,
  correct,
  wrong,
  accuracy,
  durationSeconds,
  wrongItems,
  modeLabel,
  wordbookName,
  onBack,
  onRestart,
  onRetryWrong,
}) => {
  const getGrade = (rate: number): { label: string; color: string } => {
    if (rate >= 0.9) return { label: '优秀', color: '#06B6D4' };
    if (rate >= 0.7) return { label: '良好', color: '#6366F1' };
    if (rate >= 0.5) return { label: '及格', color: '#F97316' };
    return { label: '需加油', color: '#EF476F' };
  };

  const grade = getGrade(accuracy);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#EEF2FF' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.12)',
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
          style={{ background: grade.color }}
        />

        <div className="text-center relative z-10">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: `${grade.color}20`,
              boxShadow: `0 0 30px ${grade.color}40`,
            }}
          >
            <Trophy className="w-10 h-10" style={{ color: grade.color }} />
          </div>

          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: '#F1F5F9' }}
          >
            学习完成！
          </h2>
          <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
            {wordbookName} · {modeLabel}
          </p>

          <div
            className="text-5xl font-bold mb-2"
            style={{ color: grade.color }}
          >
            {Math.round(accuracy * 100)}%
          </div>
          <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>
            正确率 · {grade.label}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(34, 211, 238, 0.1)' }}
            >
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: '#06B6D4' }}
              >
                {correct}
              </div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>
                正确
              </div>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(239, 71, 111, 0.1)' }}
            >
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: '#EF476F' }}
              >
                {wrong}
              </div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>
                错误
              </div>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(99, 102, 241, 0.08)' }}
            >
              <div
                className="text-xl font-bold mb-1"
                style={{ color: '#F1F5F9' }}
              >
                {total}
              </div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>
                总题数
              </div>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(59, 130, 246, 0.1)' }}
            >
              <div
                className="text-xl font-bold mb-1"
                style={{ color: '#F1F5F9' }}
              >
                {formatDuration(durationSeconds)}
              </div>
              <div className="text-xs" style={{ color: '#94A3B8' }}>
                用时
              </div>
            </div>
          </div>

          {wrongItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <BookX className="w-4 h-4" style={{ color: '#EF476F' }} />
                <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                  错题 ({wrongItems.length})
                </span>
              </div>
              <div
                className="rounded-xl p-3 max-h-40 overflow-y-auto space-y-2"
                style={{
                  background: 'rgba(239, 71, 111, 0.05)',
                  border: '1px solid rgba(239, 71, 111, 0.2)',
                }}
              >
                {wrongItems.map((item: UserWordbookItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="truncate flex-1" style={{ color: '#F1F5F9' }}>
                      {item.content}
                    </span>
                    <span
                      className="ml-2 text-xs shrink-0"
                      style={{ color: '#94A3B8' }}
                    >
                      {item.answer || item.extra?.translation || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#F1F5F9',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              返回词库
            </button>
            <button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              再练一次
            </button>
          </div>

          {wrongItems.length > 0 && (
            <button
              onClick={onRetryWrong}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(239, 71, 111, 0.15)',
                color: '#EF476F',
                border: '1px solid rgba(239, 71, 111, 0.3)',
              }}
            >
              <XCircle className="w-4 h-4" />
              重做错题
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyResult;
