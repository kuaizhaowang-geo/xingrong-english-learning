import React from 'react';
import { RotateCcw, BookOpen, Trophy, Flame, Target, Settings } from 'lucide-react';
import type { WordStats } from '@shared/api.interface';

interface StatsCardsProps {
  stats: WordStats | null;
  dailyGoal?: number;
  todayLearned?: number;
  onStartReview: () => void;
  onOpenPlan?: () => void;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  dailyGoal = 20,
  todayLearned = 0,
  onStartReview,
  onOpenPlan,
}) => {
  const totalLearned = (stats?.mastered ?? 0) + (stats?.learning ?? 0) + (stats?.new_ ?? 0);
  const masteryRate = totalLearned > 0
    ? Math.round(((stats?.mastered ?? 0) / totalLearned) * 100)
    : 0;
  const todayProgress = dailyGoal > 0 ? Math.min(100, Math.round((todayLearned / dailyGoal) * 100)) : 0;

  const cards = [
    {
      label: '今日待复习',
      value: stats?.todayReview ?? 0,
      icon: RotateCcw,
       color: 'text-white',
       iconBg: 'bg-rose-500/20 text-rose-300',
      clickable: true,
      onClick: onStartReview,
    },
    {
      label: '今日进度',
      value: `${todayLearned}/${dailyGoal}`,
      subValue: `${todayProgress}%`,
      icon: Target,
       color: 'text-white',
       iconBg: 'bg-orange-500/20 text-orange-300',
    },
    {
      label: '已学单词',
      value: totalLearned,
      icon: BookOpen,
       color: 'text-white',
       iconBg: 'bg-blue-500/20 text-blue-300',
    },
    {
      label: '掌握率',
      value: `${masteryRate}%`,
      icon: Trophy,
       color: 'text-white',
       iconBg: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      label: '连续学习天数',
      value: `${stats?.streakDays ?? 0} 天`,
      icon: Flame,
       color: 'text-white',
       iconBg: 'bg-amber-500/20 text-amber-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card, idx: number) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.clickable ? card.onClick : undefined}
             className={`glass-card relative rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-hidden
                ${card.clickable
                  ? 'cursor-pointer hover:border-fuchsia-500/40 transition-all duration-200'
                  : ''
                }
             `}
           >
             <div className="relative flex flex-col h-full min-h-[90px] sm:min-h-[110px]">
               <div className="flex justify-between items-start">
                 <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${card.iconBg}`}>
                   <Icon size={16} className="sm:size-[18px]" />
                 </div>
               </div>
               <div className="flex-1" />
               <div className="flex items-end justify-between">
                 <div>
                   <div className={`text-lg sm:text-2xl font-bold leading-tight ${card.color}`}>
                     {card.value}
                   </div>
                   <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                     {card.label}
                   </div>
                 </div>
                {card.subValue !== undefined && (
                  <div className="text-right">
                     <div className="text-xs text-slate-400 font-medium mb-1">
                      {card.subValue}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}

       <div
         onClick={onOpenPlan}
         className="glass-card relative rounded-xl sm:rounded-2xl p-3 sm:p-4 overflow-hidden
           border border-dashed border-fuchsia-500/30
           cursor-pointer hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10
           transition-all duration-200 flex flex-col items-center justify-center
           min-h-[90px] sm:min-h-[110px]"
       >
         <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-fuchsia-500/20 mb-1 sm:mb-2">
           <Settings size={18} className="text-fuchsia-300 sm:size-5" />
         </div>
         <span className="text-xs sm:text-sm font-medium text-slate-300">学习计划</span>
       </div>
    </div>
  );
};

export default StatsCards;
