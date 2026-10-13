import React from 'react';
import type { ReviewStats } from '@shared/api.interface';
import {
  CheckCircle2,
  Clock,
  CalendarClock,
  BookOpen,
} from 'lucide-react';

interface StatCardProps {
  stats: ReviewStats | null;
  loading: boolean;
}

interface StatItemProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
  glowColor: string;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  icon: Icon,
  gradient,
  glowColor,
}) => {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: gradient,
        boxShadow: `0 0 20px ${glowColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="absolute top-3 right-3 opacity-20">
        <Icon size={40} className="text-white" />
      </div>
      <div className="relative z-10">
        <div className="text-white/70 text-sm font-medium">{label}</div>
        <div className="text-white text-3xl font-bold mt-2 tracking-tight">
          {value}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      />
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ stats, loading }) => {
  const value = (n: number | undefined): number =>
    loading ? 0 : n ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatItem
        label="总不熟悉数"
        value={value(stats?.total)}
        icon={BookOpen}
        gradient="linear-gradient(135deg, #6366F1 0%, #6D28D9 100%)"
        glowColor="#6366F1"
      />
      <StatItem
        label="已掌握数"
        value={value(stats?.mastered)}
        icon={CheckCircle2}
        gradient="linear-gradient(135deg, #10B981 0%, #059669 100%)"
        glowColor="#10B981"
      />
      <StatItem
        label="待复习数"
        value={value(stats?.pending)}
        icon={Clock}
        gradient="linear-gradient(135deg, #2563EB 0%, #2563EB 100%)"
        glowColor="#2563EB"
      />
      <StatItem
        label="今日待复习"
        value={value(stats?.todayDue)}
        icon={CalendarClock}
        gradient="linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"
        glowColor="#06B6D4"
      />
    </div>
  );
};

export default StatCard;
