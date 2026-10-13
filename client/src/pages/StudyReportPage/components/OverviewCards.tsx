import { Clock, CalendarDays, Target, Flame, CheckSquare, Trophy } from 'lucide-react';
import type { StudyReportItem } from '@shared/api.interface';

interface OverviewCardsProps {
  loading: boolean;
  report: StudyReportItem | null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}小时`;
  return `${hours}h ${mins}min`;
}

function OverviewCards({ loading, report }: OverviewCardsProps) {
  const cards = report
    ? [
        {
          label: '总学习时长',
          value: formatDuration(report.totalDuration),
          sub: `日均 ${formatDuration(report.avgDailyDuration)}`,
          icon: Clock,
          color: '#6366F1',
        },
        {
          label: '学习天数',
          value: `${report.studyDays}天`,
          sub: '报告期内学习天数',
          icon: CalendarDays,
          color: '#2563EB',
        },
        {
          label: '总正确率',
          value: `${Math.round(report.totalAccuracy)}%`,
          sub: '所有练习综合正确率',
          icon: Target,
          color: '#06B6D4',
        },
        {
          label: '连续学习',
          value: `${report.streakDays}天`,
          sub: '坚持就是胜利',
          icon: Flame,
          color: '#FFD166',
        },
        {
          label: '完成任务',
          value: `${report.completedTasks}个`,
          sub: '本期完成的任务数',
          icon: CheckSquare,
          color: '#A855F7',
        },
        {
          label: '学习排名',
          value: `超过 ${Math.min(99, Math.round(50 + report.totalDuration / 30))}%`,
          sub: '基于学习时长估算',
          icon: Trophy,
          color: '#EC4899',
        },
      ]
    : [];

  if (loading) {
    return (
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
         {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-20 sm:h-24 rounded-xl animate-pulse bg-white/5 border border-white/10"
           />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map(({ label, value, sub, icon: Icon, color }) => (
         <div
            key={label}
            className="rounded-xl p-3 sm:p-5 transition-transform hover:scale-[1.02] glass-card"
          >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
             <span className="text-xs text-slate-400">{label}</span>
          </div>
           <p
             className="text-xl sm:text-2xl font-bold"
             style={{
               background: `linear-gradient(135deg, ${color}, #06B6D4)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {value}
          </p>
           <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export default OverviewCards;
