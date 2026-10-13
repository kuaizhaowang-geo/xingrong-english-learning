import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home,
} from 'lucide-react';
import type {
  DictationResult,
  DictationSession,
  DictationSessionWord,
} from '@shared/api.interface';

interface DictationResultPageProps {
  result: DictationResult | null;
  session: DictationSession;
  wrongWords: DictationSessionWord[];
  correctCount: number;
}

const DictationResultPage: React.FC<DictationResultPageProps> = ({
  result,
  session,
  wrongWords,
  correctCount,
}) => {
  const navigate = useNavigate();
  const total = result?.totalCount ?? session.totalCount;
  const score = result?.score ?? Math.round((correctCount / total) * 100);
  const accuracy = result?.accuracy ?? (correctCount / total) * 100;
  const wrongCount = result?.wrongCount ?? wrongWords.length;
  const displayWrongWords = result?.wrongWords ?? wrongWords;

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (score / 100) * circumference;

  const getScoreLabel = (): string => {
    if (score >= 90) return '太棒了！🎉';
    if (score >= 60) return '继续加油！💪';
    return '多加练习！📚';
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 背景装饰 */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#6366F1' }}
      />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-md mx-auto space-y-8">
          {/* 得分环 */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg width="192" height="192" className="transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{
                    transition: 'stroke-dashoffset 1.5s ease-out',
                    filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))',
                  }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{score}</span>
                <span className="text-sm text-slate-400">分</span>
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white">
              {getScoreLabel()}
            </h2>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="正确率"
              value={`${accuracy.toFixed(0)}%`}
              color="#06B6D4"
              icon={<Target size={18} />}
            />
            <StatCard
              label="用时"
              value={
                result?.durationSeconds
                  ? `${Math.floor(result.durationSeconds / 60)}分${result.durationSeconds % 60}秒`
                  : '—'
              }
              color="#6366F1"
              icon={<Clock size={18} />}
            />
            <StatCard
              label="答对"
              value={`${correctCount} 题`}
              color="#06B6D4"
              icon={<CheckCircle size={18} />}
            />
            <StatCard
              label="错题"
              value={`${wrongCount} 题`}
              color="#EF476F"
              icon={<XCircle size={18} />}
            />
          </div>

          {/* 错字列表 */}
          {displayWrongWords.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#EF476F]" />
                错字回顾
              </h3>
              <div className="space-y-2">
                {displayWrongWords.map((w, idx) => (
                  <div
                    key={`${w.id}-${idx}`}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(26, 22, 53, 0.8)',
                      border: '1px solid rgba(239, 71, 111, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: '#F1F5F9' }}
                      >
                        {w.word}
                      </span>
                      <div className="flex-1">
                        <div className="text-[#06B6D4] text-sm font-medium">
                          {w.pinyin}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          你的答案：
                          <span className="text-[#EF476F]">
                            {w.userAnswer || '(未作答)'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {(w.radical || w.strokes !== undefined) && (
                      <div className="mt-2 text-xs text-slate-500 flex gap-3">
                        {w.radical && <span>部首：{w.radical}</span>}
                        {w.strokes !== undefined && (
                          <span>笔画：{w.strokes}画</span>
                        )}
                      </div>
                    )}
                    {w.words && w.words.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        组词：{w.words.join('、')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 加入错字本提示 */}
          {displayWrongWords.length > 0 && (
            <div
              className="p-3 rounded-lg text-sm text-center"
              style={{
                background: 'rgba(239, 71, 111, 0.1)',
                border: '1px solid rgba(239, 71, 111, 0.3)',
                color: '#F1F5F9',
              }}
            >
              ✅ 错字已自动加入错字本，可随时复习
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dictation')}
              className="flex-1 py-3 rounded-xl font-medium
                bg-white/10 backdrop-blur text-slate-200 border border-white/10
                hover:bg-white/20 transition-all
                flex items-center justify-center gap-2"
            >
              <Home size={18} />
              <span>返回首页</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dictation')}
              className="flex-1 py-3 rounded-xl font-semibold text-white
                bg-gradient-to-r from-[#6366F1] to-[#2563EB]
                hover:shadow-[0_0_20px_rgba(124_58_237_0.5)]
                transition-all
                flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              <span>重新听写</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, icon }) => {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: 'rgba(26, 22, 53, 0.8)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
      }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
};

export default DictationResultPage;
