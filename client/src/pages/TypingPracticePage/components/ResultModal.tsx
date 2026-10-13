import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, RotateCcw, ArrowRight, Home } from 'lucide-react';
import { soundManager } from '@client/src/utils/soundManager';
import {
  scaleIn,
  rotateIn,
  buttonHoverTap,
  fadeInOut,
} from '@client/src/utils/animations';

export interface ResultModalProps {
  open: boolean;
  wpm: number;
  cpm: number;
  accuracy: number;
  duration: number;
  errors: number;
  correctChars: number;
  totalChars: number;
  bestStreak: number;
  bestWpm?: number;
  wpmHistory?: number[];
  onClose: () => void;
  onRetry: () => void;
  onBackToList: () => void;
  onNextCourse: () => void;
  hasNextCourse: boolean;
}

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  decimals = 0,
  suffix = '',
  className,
  duration = 1.2,
}) => {
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const startTime = performance.now();
    let rafId: number = 0;
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return (
    <span className={className}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const getEvaluation = (wpm: number, accuracy: number): { title: string; desc: string } => {
  if (accuracy >= 98 && wpm >= 60) {
    return { title: '出神入化！', desc: '你是真正的打字高手，继续保持！' };
  }
  if (accuracy >= 95 && wpm >= 45) {
    return { title: '太棒了！', desc: '速度和准确率都很出色，继续加油！' };
  }
  if (accuracy >= 90) {
    return { title: '表现不错！', desc: '准确率很好，可以尝试提升速度。' };
  }
  if (wpm >= 30) {
    return { title: '继续努力！', desc: '速度还可以，注意提高准确率。' };
  }
  return { title: '刚刚起步！', desc: '慢慢来，先保证准确率再追求速度。' };
};

const ResultModal: React.FC<ResultModalProps> = ({
  open,
  wpm,
  cpm,
  accuracy,
  duration,
  errors,
  correctChars,
  totalChars,
  bestStreak,
  bestWpm,
  wpmHistory,
  onClose,
  onRetry,
  onBackToList,
  onNextCourse,
  hasNextCourse,
}) => {
  const evaluation = getEvaluation(wpm, accuracy);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const isNewBest = bestWpm !== undefined && wpm > bestWpm;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
            exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
          }}
        >
          {/* Backdrop */}
          <motion.div
            variants={fadeInOut}
             className="absolute inset-0 bg-[#0F0D24]/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={scaleIn}
             className="relative w-full max-w-md glass-card rounded-2xl p-6 md:p-8"
          >
        {/* Close button */}
        <motion.button
          {...buttonHoverTap}
          onClick={() => {
            soundManager.ensureContext();
            soundManager.playClick('cancel');
            onClose();
          }}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors w-8 h-8 flex items-center justify-center rounded-lg"
        >
          <X size={20} />
        </motion.button>

        {/* Trophy icon */}
        <div className="flex justify-center mb-4">
          <motion.div
            variants={rotateIn}
            initial="hidden"
            animate="show"
             className="w-16 h-16 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 flex items-center justify-center shadow-neon-purple"
          >
            <Trophy className="text-[#FCD34D]" size={32} />
          </motion.div>
        </div>

        {/* Title */}
         <h2 className="text-2xl font-bold text-center text-white mb-1">
          {evaluation.title}
        </h2>
         <p className="text-sm text-slate-400 text-center mb-6">{evaluation.desc}</p>

        {/* Hero WPM */}
        <div className="text-center mb-5">
          <div className="relative inline-block">
            <div className="text-6xl font-black bg-gradient-to-r from-[#06B6D4] via-[#818CF8] to-[#6366F1] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(124_58_237_0.5)]">
              <CountUpNumber value={wpm} />
            </div>
            {isNewBest && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 10 }}
                transition={{ type: 'spring', delay: 1, stiffness: 300 }}
                className="absolute -top-3 -right-10 bg-gradient-to-r from-[#FCD34D] to-[#F59E0B] text-[#FFFFFF] text-[10px] font-bold px-2 py-1 rounded-full"
              >
                NEW!
              </motion.div>
            )}
          </div>
            <div className="text-sm text-slate-400 mt-1">WPM 每分钟单词数</div>
           {bestWpm !== undefined && bestWpm > 0 && (
             <div className="text-xs text-violet-400 mt-1">
              历史最佳: {bestWpm} WPM
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[rgba(34_211_238_0.1)] rounded-xl p-3 text-center border border-[rgba(34_211_238_0.2)]">
           <div className="text-xl font-bold text-cyan-400">
               <CountUpNumber value={cpm} />
             </div>
             <div className="text-[10px] text-slate-400 mt-1">CPM</div>
          </div>
          <div className="bg-[rgba(34_197_94_0.1)] rounded-xl p-3 text-center border border-[rgba(34_197_94_0.2)]">
             <div className="text-xl font-bold text-emerald-400">
               <CountUpNumber value={accuracy} decimals={1} suffix="%" />
             </div>
             <div className="text-[10px] text-slate-400 mt-1">准确率</div>
          </div>
          <div className="bg-[rgba(59_130_246_0.1)] rounded-xl p-3 text-center border border-[rgba(59_130_246_0.2)]">
             <div className="text-xl font-bold text-blue-400">
               {minutes}:{seconds.toString().padStart(2, '0')}
             </div>
             <div className="text-[10px] text-slate-400 mt-1">用时</div>
          </div>
          <div className="bg-[rgba(167_139_250_0.1)] rounded-xl p-3 text-center border border-[rgba(167_139_250_0.2)]">
             <div className="text-xl font-bold text-violet-400">
               <CountUpNumber value={correctChars} />
             </div>
             <div className="text-[10px] text-slate-400 mt-1">正确字符</div>
          </div>
          <div className="bg-[rgba(148_163_184_0.1)] rounded-xl p-3 text-center border border-[rgba(148_163_184_0.2)]">
              <div className="text-xl font-bold text-slate-400">
               <CountUpNumber value={totalChars} />
             </div>
             <div className="text-[10px] text-slate-400 mt-1">总字符</div>
          </div>
          <div className="bg-[rgba(239_71_111_0.1)] rounded-xl p-3 text-center border border-[rgba(239_71_111_0.2)]">
             <div className="text-xl font-bold text-rose-400">
               <CountUpNumber value={errors} />
             </div>
             <div className="text-[10px] text-slate-400 mt-1">错误数</div>
          </div>
        </div>

        {/* Streak row */}
         <div className="bg-[rgba(249_115_22_0.1)] rounded-xl p-3 mb-4 border border-[rgba(249_115_22_0.2)] flex items-center justify-around">
           <div className="text-center">
              <div className="text-lg font-bold text-amber-400">
                <CountUpNumber value={bestStreak} />
              </div>
              <div className="text-[10px] text-slate-400">最佳连击</div>
           </div>
         </div>

         {/* Speed curve */}
         <div className="bg-[rgba(34_211_238_0.05)] rounded-xl p-3 mb-5 border border-[rgba(34_211_238_0.15)]">
             <div className="text-xs text-slate-400 mb-2 font-medium">速度趋势</div>
           {wpmHistory && wpmHistory.length >= 2 ? (
             <svg
               viewBox={`0 0 100 30`}
               preserveAspectRatio="none"
               className="w-full h-20"
             >
               <defs>
                 <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                   <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                 </linearGradient>
               </defs>
               {(() => {
                 const maxVal = Math.max(...wpmHistory) * 1.15 || 1;
                 const minVal = 0;
                 const range = maxVal - minVal || 1;
                 const points = wpmHistory.map((v: number, i: number) => {
                   const x = (i / (wpmHistory.length - 1)) * 100;
                   const y = 30 - ((v - minVal) / range) * 30;
                   return `${x},${y}`;
                 });
                 const linePath = `M ${points.join(' L ')}`;
                 const areaPath = `${linePath} L 100,30 L 0,30 Z`;
                 return (
                   <>
                     <path d={areaPath} fill="url(#speedGradient)" />
                     <path
                       d={linePath}
                       fill="none"
                       stroke="#06B6D4"
                       strokeWidth="0.8"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                     />
                   </>
                 );
               })()}
             </svg>
           ) : (
              <div className="h-20 flex items-center justify-center text-xs text-slate-500">
               数据不足，继续练习获取速度曲线
             </div>
           )}
         </div>

         {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {hasNextCourse && (
            <motion.button
              {...buttonHoverTap}
              onClick={() => {
                soundManager.ensureContext();
                soundManager.playClick('primary');
                onNextCourse();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(124_58_237_0.5)] transition-shadow"
            >
              <ArrowRight size={18} />
              下一课
            </motion.button>
          )}
          <motion.button
            {...buttonHoverTap}
            onClick={() => {
              soundManager.ensureContext();
              soundManager.playClick('confirm');
              onRetry();
            }}
             className="w-full py-3 px-4 rounded-xl neon-btn font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            再练一次
          </motion.button>
          <motion.button
            {...buttonHoverTap}
            onClick={() => {
              soundManager.ensureContext();
              soundManager.playClick('nav');
              onBackToList();
            }}
             className="w-full py-3 px-4 rounded-xl neon-btn font-medium flex items-center justify-center gap-2 border-dashed"
          >
            <Home size={18} />
            返回列表
          </motion.button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
