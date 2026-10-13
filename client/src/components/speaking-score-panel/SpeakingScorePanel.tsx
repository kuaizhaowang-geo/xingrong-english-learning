import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Award } from 'lucide-react';

interface ScoreItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, value, icon, color }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="rgba(99,102,241,0.15)"
          strokeWidth="5"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 213.6} 213.6`}
          initial={{ strokeDasharray: '0 213.6' }}
          animate={{ strokeDasharray: `${(value / 100) * 213.6} 213.6` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl font-bold text-slate-800"
        >
          {value}
        </motion.span>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {icon}
        <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  </div>
);

interface SpeakingScorePanelProps {
  accuracyScore: number;
  fluencyScore: number;
  overallScore: number;
  wordScores?: Array<{ word: string; score: number; isHighlighted?: boolean }>;
  show?: boolean;
}

const SpeakingScorePanel: React.FC<SpeakingScorePanelProps> = ({
  accuracyScore,
  fluencyScore,
  overallScore,
  wordScores = [],
  show = true,
}) => {
  if (!show) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22C55E';
    if (score >= 70) return '#EAB308';
    if (score >= 50) return '#F97316';
    return '#EF4444';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 50) return '一般';
    return '需加强';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto rounded-2xl bg-white/90 border border-indigo-200 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <Award size={20} className="text-amber-400" />
        <h4 className="text-lg font-bold text-slate-800">跟读评测</h4>
      </div>

      <div className="flex items-center justify-center gap-8 mb-5">
        <ScoreItem
          label="准确度"
          value={accuracyScore}
          icon={<Target size={14} className="text-cyan-400" />}
          color="#06B6D4"
        />
        <div className="relative">
          <div className="w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="rgba(99,102,241,0.15)"
                strokeWidth="7"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="url(#overallGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 100) * 301.6} 301.6`}
                initial={{ strokeDasharray: '0 301.6' }}
                animate={{ strokeDasharray: `${(overallScore / 100) * 301.6} 301.6` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))',
                }}
              />
              <defs>
                <linearGradient id="overallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-3xl font-bold text-white"
            >
              {overallScore}
            </motion.span>
            <span
              className="text-xs font-medium mt-0.5"
              style={{ color: getScoreColor(overallScore) }}
            >
              {getScoreLabel(overallScore)}
            </span>
          </div>
        </div>
        <ScoreItem
          label="流利度"
          value={fluencyScore}
          icon={<Zap size={14} className="text-amber-400" />}
          color="#F59E0B"
        />
      </div>

      {wordScores.length > 0 && (
        <div className="pt-4 border-t border-indigo-100">
          <p className="text-xs text-slate-500 mb-2 text-center">单词评分</p>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
            {wordScores.map((ws, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                className="px-2 py-1 rounded-md text-sm font-medium"
                style={{
                  color: getScoreColor(ws.score),
                  backgroundColor: `${getScoreColor(ws.score)}15`,
                  border: `1px solid ${getScoreColor(ws.score)}30`,
                }}
              >
                {ws.word}
                <span className="ml-1 text-[10px] opacity-70">{ws.score}</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SpeakingScorePanel;
