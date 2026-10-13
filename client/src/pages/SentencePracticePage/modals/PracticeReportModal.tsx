import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  ListChecks,
  RotateCcw,
  Play,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import ModalShell from '../PracticeModalShell';

interface WrongItem {
  sentence: string;
  translation: string;
}

interface PracticeReportModalProps {
  open: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  elapsedSeconds: number;
  masteredCount: number;
  unfamiliarCount: number;
  bestStreak: number;
  wrongItems: WrongItem[];
  onRetry: () => void;
  onContinue: () => void;
  onShare: () => void;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconClass: string;
  iconBg: string;
  label: string;
  value: string;
  valueClass: string;
}> = ({ icon, iconClass, iconBg, label, value, valueClass }) => (
  <div
     className="rounded-xl border border-[rgba(124_58_237_0.3)] bg-[#F8FAFC]
       px-3 py-3 flex flex-col items-center justify-center gap-1
       hover:border-[rgba(124_58_237_0.5)] hover:bg-[#E0E7FF] transition-all"
  >
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
      <div className={iconClass}>{icon}</div>
    </div>
     <span className={`text-base font-bold ${valueClass}`}>{value}</span>
     <span className="text-[11px] text-[#64748B]">{label}</span>
  </div>
);

// ─── Wrong Item Row ───────────────────────────────────────────────────────

const WrongItemRow: React.FC<{ item: WrongItem; index: number }> = ({
  item,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
     <div className="border-b border-[rgba(124_58_237_0.15)] last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
         className="w-full flex items-center gap-3 px-3 py-2.5
           hover:bg-[rgba(124_58_237_0.1)] transition-colors text-left"
      >
         <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(239_71_111_0.2)] text-[#EF476F] text-xs font-bold flex items-center justify-center">
          {index + 1}
        </span>
         <span className="flex-1 text-sm text-slate-700 truncate">
          {item.sentence}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
           className="flex-shrink-0 text-slate-500"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
               <div className="px-3 pb-3 pl-12">
                 <div className="rounded-lg bg-[rgba(124_58_237_0.1)] border border-[rgba(124_58_237_0.2)] p-3">
                   <p className="text-xs text-[#64748B] mb-1">中文翻译</p>
                   <p className="text-sm text-slate-700">{item.translation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────

const PracticeReportModal: React.FC<PracticeReportModalProps> = ({
  open,
  onClose,
  score,
  totalQuestions,
  correctCount,
  wrongCount,
  accuracy,
  elapsedSeconds,
  masteredCount,
  unfamiliarCount,
  bestStreak,
  wrongItems,
  onRetry,
  onContinue,
  onShare,
}) => {
  const displayWrongItems = wrongItems.slice(0, 5);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="练习报告"
      widthClass="max-w-lg"
    >
      <div className="space-y-5">
        {/* ── Score Display ──────────────────────────────────────── */}
        <div className="text-center pt-2">
          <div className="relative inline-block">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 200,
                delay: 0.1,
              }}
               className="absolute inset-0 blur-2xl bg-[#6366F1]/30 rounded-full"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 200,
                delay: 0.15,
              }}
              className="relative flex items-center justify-center"
            >
              <Sparkles
                size={20}
                className="absolute -top-1 -left-2 text-[#FFD166] opacity-80"
              />
               <span className="text-6xl font-black text-[#6366F1]" style={{ textShadow: '0 0 20px rgba(99, 102, 241, 0.35)' }}>
                {score}
              </span>
               <span className="text-2xl font-bold text-[#64748b] self-end mb-2 ml-1">
                分
              </span>
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
             className="mt-2 text-sm text-[#64748B]"
          >
            共 {totalQuestions} 题 · 正确 {correctCount} · 错误 {wrongCount}
          </motion.p>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Target size={16} />}
            iconBg="bg-emerald-100"
            iconClass="text-emerald-600"
            label="正确率"
            value={`${accuracy.toFixed(1)}%`}
            valueClass="text-emerald-600"
          />
          <StatCard
            icon={<Clock size={16} />}
            iconBg="bg-blue-100"
            iconClass="text-blue-600"
            label="用时"
            value={formatTime(elapsedSeconds)}
            valueClass="text-blue-600"
          />
          <StatCard
            icon={<ListChecks size={16} />}
            iconBg="bg-purple-100"
            iconClass="text-purple-600"
            label="完成题数"
            value={String(totalQuestions)}
            valueClass="text-purple-600"
          />
          <StatCard
            icon={<CheckCircle size={16} />}
            iconBg="bg-emerald-100"
            iconClass="text-emerald-600"
            label="掌握数"
            value={String(masteredCount)}
            valueClass="text-emerald-600"
          />
          <StatCard
            icon={<XCircle size={16} />}
            iconBg="bg-rose-100"
            iconClass="text-rose-600"
            label="不熟悉"
            value={String(unfamiliarCount)}
            valueClass="text-rose-600"
          />
          <StatCard
            icon={<Trophy size={16} />}
            iconBg="bg-amber-100"
            iconClass="text-amber-600"
            label="最高连对"
            value={String(bestStreak)}
            valueClass="text-amber-600"
          />
        </div>

        {/* ── Wrong Items List ───────────────────────────────────── */}
        {displayWrongItems.length > 0 && (
           <div className="rounded-xl border border-[rgba(239_71_111_0.3)] bg-[#F8FAFC] overflow-hidden">
             <div
               className="px-4 py-2.5 flex items-center gap-2
                 bg-[rgba(239_71_111_0.1)] border-b border-[rgba(239_71_111_0.2)]"
             >
               <XCircle size={16} className="text-[#EF476F]" />
               <span className="text-sm font-semibold text-slate-800">
                错题回顾
              </span>
<span className="text-xs text-[#64748B] ml-1">
                 ({wrongItems.length} 题)
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {displayWrongItems.map((item: WrongItem, idx: number) => (
                <WrongItemRow key={idx} item={item} index={idx} />
              ))}
              {wrongItems.length > 5 && (
                 <div className="px-3 py-2 text-center text-xs text-[#64748b] border-t border-[rgba(124_58_237_0.15)]">
                  还有 {wrongItems.length - 5} 道错题，继续练习逐一攻克
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Action Buttons ─────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onRetry}
             className="flex-1 px-4 py-3 rounded-xl
               bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)] text-[#64748B]
               hover:bg-[#E0E7FF] hover:border-[rgba(124_58_237_0.5)]
               transition-all flex items-center justify-center gap-2 font-medium"
          >
            <RotateCcw size={16} />
            再来一次
          </button>
          <button
            type="button"
            onClick={onContinue}
             className="flex-1 px-4 py-3 rounded-xl
               bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white
               hover:shadow-lg hover:shadow-[#6366F1]/40 transition-all
               flex items-center justify-center gap-2 font-medium"
          >
            <Play size={16} />
            继续练习
          </button>
          <button
            type="button"
            onClick={onShare}
            className="px-4 py-3 rounded-xl
               bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)] text-[#64748B]
               hover:bg-[#E0E7FF] hover:border-[rgba(124_58_237_0.5)]
               transition-all flex items-center justify-center"
            title="分享成绩"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default PracticeReportModal;
