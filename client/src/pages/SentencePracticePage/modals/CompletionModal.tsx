import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  FileText,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  elapsedSeconds: number;
  totalQuestions: number;
  onRetry: () => void;
  onNextChapter?: () => void;
  onReturn: () => void;
  hasNextChapter?: boolean;
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`;
  }
  return `${minutes}分钟${seconds}秒`;
};

// ─── Confetti ───────────────────────────────────────────────────────────────

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  drift: number;
}

const CONFETTI_COLORS = [
  '#FF6B35',
  '#FFD166',
  '#22C55E',
  '#4361EE',
  '#A855F7',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const newPieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 0.6 + Math.random() * 0.4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 80,
    }));
    setPieces(newPieces);
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
          }}
          initial={{ y: -20, x: 0, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, p.drift],
            rotate: [p.rotation, p.rotation + 720],
            opacity: [1, 1, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};

// ─── Stat Card ──────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}> = ({ icon, iconBg, iconColor, label, value }) => (
  <div
     className="flex-1 rounded-xl border border-fuchsia-500/15 bg-white/5
       px-4 py-4 flex flex-col items-center justify-center gap-2
        hover:border-fuchsia-400/30 hover:bg-white/10 transition-all"
  >
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}
    >
      <div className={iconColor}>{icon}</div>
    </div>
       <div className="text-center">
          <div className="text-xl font-bold text-white">{value}</div>
         <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  </div>
);

// ─── Main Modal ─────────────────────────────────────────────────────────────

const CompletionModal: React.FC<CompletionModalProps> = ({
  open,
  onClose,
  elapsedSeconds,
  totalQuestions,
  onRetry,
  onNextChapter,
  onReturn,
  hasNextChapter = true,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
    } else {
      const t = setTimeout(() => setShowConfetti(false), 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onRetry();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hasNextChapter && onNextChapter) {
          onNextChapter();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReturn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onRetry, onNextChapter, onReturn, hasNextChapter]);

  return (
    <>
      <Confetti active={showConfetti} />
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
             className="relative w-full max-w-md rounded-2xl glass-card overflow-hidden"
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6366F1] via-[#2563EB] to-[#06B6D4]" />

               <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/10">
                   <h3 className="text-lg font-semibold text-white">完成练习</h3>
                 <button
                   type="button"
                   onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                 >
                  <span className="text-sm">×</span>
                </button>
              </div>

              <div className="px-6 py-6 flex flex-col items-center gap-5">
                <motion.div
                  className="relative"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    damping: 18,
                    stiffness: 280,
                    delay: 0.1,
                  }}
                >
                   <div
                     className="w-24 h-24 rounded-full flex items-center justify-center
                       bg-gradient-to-br from-[#6366F1] to-[#2563EB]
                       shadow-neon-purple"
                  >
                    <CheckCircle2 className="text-white" size={56} strokeWidth={2.5} />
                  </div>
                   <div
                      className="absolute -inset-2 rounded-full border-2 border-fuchsia-400/40
                       animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                    <h2 className="text-2xl font-bold text-white">太棒了！</h2>
                    <p className="text-sm text-slate-400 mt-1">你已完成本章节全部练习</p>
                </motion.div>

                <motion.div
                  className="w-full flex gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <StatCard
                    icon={<Clock size={20} />}
                    iconBg="bg-emerald-100"
                    iconColor="text-emerald-600"
                    label="今日练习时长"
                    value={formatDuration(elapsedSeconds)}
                  />
                  <StatCard
                    icon={<FileText size={20} />}
                    iconBg="bg-blue-100"
                    iconColor="text-blue-600"
                    label="此章题目数量"
                    value={`${totalQuestions}道`}
                  />
                </motion.div>

                <motion.div
                  className="w-full flex flex-col gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onRetry}
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                         rounded-xl font-semibold text-white
                         bg-gradient-to-r from-[#6366F1] to-[#2563EB]
                         hover:shadow-lg hover:shadow-[#6366F1]/40
                         transition-all active:scale-95"
                    >
                      <RotateCcw size={18} />
                      <span>继续练习 (空格)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasNextChapter && onNextChapter) {
                          onNextChapter();
                        }
                      }}
                      disabled={!hasNextChapter}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3
                        rounded-xl font-semibold transition-all
                        ${hasNextChapter
                           ? 'text-white bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:shadow-lg hover:shadow-[#2563EB]/40 active:scale-95'
                           : 'text-slate-500 bg-white/5 cursor-not-allowed border border-white/10'
                        }`}
                    >
                      <span>{hasNextChapter ? '下一章 (回车)' : '已是最后一章'}</span>
                      {hasNextChapter && <ArrowRight size={18} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onReturn}
                     className="w-full flex items-center justify-center gap-2 px-4 py-3
                       rounded-xl font-medium text-slate-300 neon-btn
                        transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft size={18} />
                    <span>返回 (Esc)</span>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CompletionModal;
