import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Mic,
  Target,
  Zap,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import ClickableSentence from './ClickableSentence';
import SentenceWordDetailModal from './SentenceWordDetailModal';
import { useSentenceWordDetail } from '../hooks/useSentenceWordDetail';

export interface WordScore {
  word: string;
  score: number;
}

export interface SpeechScoreData {
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  wordScores: WordScore[];
  suggestions: string[];
}

interface SpeechScorePanelProps {
  data: SpeechScoreData;
  isAnalyzing?: boolean;
  onRetry: () => void;
  highScore?: number;
  sentence?: string;
}

const getGrade = (score: number): { label: string; color: string } => {
  if (score >= 90) return { label: '优秀', color: 'text-[#FF6B35]' };
  if (score >= 80) return { label: '良好', color: 'text-blue-600' };
  if (score >= 60) return { label: '及格', color: 'text-green-600' };
  return { label: '需努力', color: 'text-red-500' };
};

const getWordColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
};

// 环形进度条参数
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1200,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
};

const SpeechScorePanel: React.FC<SpeechScorePanelProps> = ({
  data,
  isAnalyzing = false,
  onRetry,
  highScore = 0,
  sentence = '',
}) => {
  const { detailWord, detailLoading, activeWord, openWordDetail, closeWordDetail } = useSentenceWordDetail();
  const highlightSet = activeWord ? new Set<string>([activeWord]) : new Set<string>();
  const grade = getGrade(data.overall);
  const progressOffset = CIRCUMFERENCE * (1 - data.overall / 100);

  const subScores = [
    {
      label: '准确度',
      desc: '发音标准度',
      value: data.accuracy,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      icon: Target,
    },
    {
      label: '流利度',
      desc: '语速流畅度',
      value: data.fluency,
      color: 'from-[#FF6B35] to-orange-600',
      textColor: 'text-[#FF6B35]',
      icon: Zap,
    },
    {
      label: '完整度',
      desc: '单词遗漏率',
      value: data.completeness,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      icon: CheckCircle2,
    },
  ];

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-md mx-auto p-6 rounded-2xl glass-card flex flex-col items-center gap-4"
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF6B35] border-r-orange-400 animate-spin" />
          <Mic className="absolute inset-0 m-auto text-[#FF6B35]" size={24} />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-base">分析中...</p>
          <p className="text-sm text-gray-500 mt-1">正在评估你的发音表现</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
       className="w-full max-w-md mx-auto p-5 rounded-2xl glass-card"
    >
      {/* 环形总分 */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-[160px] h-[160px]">
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full -rotate-90"
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#FF8C5A" />
              </linearGradient>
            </defs>
            {/* 背景环 */}
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              stroke="#E5E7EB"
              strokeWidth="10"
              fill="none"
            />
            {/* 进度环 */}
            <motion.circle
              cx="80"
              cy="80"
              r={RADIUS}
              stroke="url(#scoreGradient)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: progressOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-[#FF6B35] tabular-nums">
              <AnimatedNumber value={data.overall} />
            </div>
            <div className={`text-sm font-semibold mt-1 ${grade.color}`}>
              {grade.label}
            </div>
          </div>
        </div>
      </div>

      {/* 分项打分 */}
      <div className="space-y-2.5 mb-5">
        {subScores.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center ${item.textColor}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">
                    {item.label}
                    <span className="text-gray-400 ml-1">{item.desc}</span>
                  </span>
                  <span className={`text-xs font-bold tabular-nums ${item.textColor}`}>
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 单词级标注 */}
      {data.wordScores.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2 font-medium">单词发音</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
            {data.wordScores.map((ws, idx) => {
              const cleanWord = ws.word.toLowerCase().replace(/[^a-zA-Z'-]/g, '');
              const isActive = activeWord === cleanWord;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-0.5 cursor-pointer"
                  onClick={() => openWordDetail(ws.word)}
                >
                  <span
                    className={`text-sm font-medium transition-colors ${isActive ? 'text-[#FF6B35] underline underline-offset-2' : getWordColor(ws.score)}`}
                  >
                    {ws.word}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-gray-500">
                    {ws.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 改进建议 */}
      {data.suggestions.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">改进建议</span>
          </div>
          <ul className="space-y-1.5">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 leading-relaxed flex gap-2">
                <span className="text-amber-500 flex-shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 历史最高分 & 再录一次 */}
      <div className="flex items-center justify-between gap-3">
        {highScore > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-xs text-gray-500">历史最高：</span>
            <span className="text-sm font-bold text-amber-600 tabular-nums">
              {highScore}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#FF5A20] transition-colors shadow-md shadow-[#FF6B35]/20"
        >
          <RefreshCw size={16} />
          再录一次
        </button>
      </div>
      {sentence && (
        <p className="text-xs text-gray-500 text-center mt-3">
          <ClickableSentence
            sentence={sentence}
            onWordClick={openWordDetail}
            highlightWords={highlightSet}
            wordColorClass="text-gray-500"
          />
        </p>
      )}

      <SentenceWordDetailModal
        wordDetail={detailWord}
        loading={detailLoading}
        onClose={closeWordDetail}
      />
    </motion.div>
  );
};

export default SpeechScorePanel;
