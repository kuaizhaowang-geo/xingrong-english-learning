import React from 'react';
import { Target, Clock, CheckCircle, XCircle, Flame, Trophy } from 'lucide-react';

interface PracticeStatsBarProps {
  accuracy: number;
  elapsedSeconds: number;
  masteredCount: number;
  unfamiliarCount: number;
  currentStreak: number;
  bestStreak: number;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}> = ({ icon, label, value, valueClass }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-xs font-bold ${valueClass}`}>{value}</span>
    </div>
  </div>
);

const PracticeStatsBar: React.FC<PracticeStatsBarProps> = ({
  accuracy,
  elapsedSeconds,
  masteredCount,
  unfamiliarCount,
  currentStreak,
  bestStreak,
}) => {
  return (
    <div
      className="w-full px-4 py-2
        bg-white/5
        border-b border-white/10"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <StatItem
          icon={<Target size={13} className="text-green-600" />}
          label="正确率"
          value={`${accuracy.toFixed(1)}%`}
          valueClass="text-green-600"
        />
        <div className="w-px h-5 bg-white/10" />
        <StatItem
          icon={<Clock size={13} className="text-blue-600" />}
          label="用时"
          value={formatTime(elapsedSeconds)}
          valueClass="text-blue-600"
        />
        <div className="w-px h-5 bg-white/10" />
        <StatItem
          icon={<CheckCircle size={13} className="text-green-600" />}
          label="掌握"
          value={String(masteredCount)}
          valueClass="text-green-600"
        />
        <div className="w-px h-5 bg-white/10" />
        <StatItem
          icon={<XCircle size={13} className="text-red-500" />}
          label="不熟悉"
          value={String(unfamiliarCount)}
          valueClass="text-red-500"
        />
        <div className="w-px h-5 bg-white/10" />
        <StatItem
          icon={<Flame size={13} className="text-[#FF6B35]" />}
          label="当前连对"
          value={String(currentStreak)}
          valueClass="text-[#FF6B35]"
        />
        <div className="w-px h-5 bg-white/10" />
        <StatItem
          icon={<Trophy size={13} className="text-amber-500" />}
          label="最高连对"
          value={String(bestStreak)}
          valueClass="text-amber-500"
        />
      </div>
    </div>
  );
};

export default PracticeStatsBar;
