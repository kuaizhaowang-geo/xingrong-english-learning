import { Flame, Target, BookOpen, PenTool, Headphones, Languages, Brain, Sparkles } from 'lucide-react';
import type { PlanOverview } from '@shared/api.interface';

interface TodayPlanTabProps {
  loading: boolean;
  overview: PlanOverview | null;
  onGoStudy: (type: string) => void;
  onCreatePlan: () => void;
}

const TASK_ICONS: Record<string, typeof BookOpen> = {
  word: BookOpen,
  sentence: Languages,
  dictation: Headphones,
  phonetic: PenTool,
  aiQuiz: Brain,
};

const TASK_COLORS: Record<string, string> = {
  word: '#6366F1',
  sentence: '#06B6D4',
  dictation: '#FFD166',
  phonetic: '#EC4899',
  aiQuiz: '#A855F7',
};

function CircularProgress({ value, size = 100, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(99, 102, 241, 0.12)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))',
          transition: 'stroke-dashoffset 0.6s ease',
        }}
      />
    </svg>
  );
}

function TodayPlanTab({ loading, overview, onGoStudy, onCreatePlan }: TodayPlanTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
          ))}
        </div>
      </div>
    );
  }

  // No plan state
  if (!overview?.currentPlan) {
    return (
       <div
        className="rounded-xl p-12 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
      >
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
          <Target size={40} style={{ color: '#A78BFA' }} />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">还没有学习计划</h3>
        <p className="text-slate-400 mb-6">制定专属学习计划，开启你的英语进阶之路</p>
        <button
          onClick={onCreatePlan}
          className="px-6 py-2.5 rounded-lg text-white font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
          }}
        >
          制定计划
        </button>
      </div>
    );
  }

  const { todayRecord, streakDays, weeklyCompletionRate, todayTasks } = overview;
  const completedTasks = todayRecord?.completedTasks ?? 0;
  const totalTasks = todayTasks.reduce((sum: number, t) => sum + (t.target > 0 ? 1 : 0), 0);
  const todayPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today Progress */}
        <div
          className="rounded-xl p-6 flex flex-col items-center backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
        >
          <p className="text-sm text-slate-400 mb-3">今日完成进度</p>
          <div className="relative">
            <CircularProgress value={todayPercent} size={110} strokeWidth={8} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">
                {todayPercent}%
              </span>
               <span className="text-xs text-slate-400">
                {completedTasks}/{totalTasks}个任务
              </span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div
          className="rounded-xl p-6 flex flex-col items-center justify-center backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
        >
          <p className="text-sm text-slate-400 mb-3">连续打卡</p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 209, 102, 0.15)' }}
            >
              <Flame size={28} style={{ color: '#FFD166' }} />
            </div>
            <div>
              <span className="text-3xl font-bold text-[#FFD166]">{streakDays}</span>
              <span className="text-sm text-[#94A3B8] ml-1">天</span>
            </div>
          </div>
           <p className="text-xs text-slate-400 mt-3">坚持就是胜利！</p>
        </div>

        {/* Weekly Rate */}
        <div
          className="rounded-xl p-6 flex flex-col justify-center backdrop-blur-xl"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
        >
          <p className="text-sm text-slate-400 mb-3">本周完成率</p>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-3xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#6366F1] bg-clip-text text-transparent">
               {Math.round(weeklyCompletionRate * 100)}%
             </span>
           </div>
            <p className="text-xs text-slate-400">继续保持，稳步提升</p>
        </div>
      </div>

      {/* Today's Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#6366F1' }} />
          今日任务
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayTasks
            .filter((t) => t.target > 0)
            .map((task) => {
              const Icon = TASK_ICONS[task.type] ?? BookOpen;
              const color = TASK_COLORS[task.type] ?? '#6366F1';
              const percent = task.target > 0 ? Math.min(100, Math.round((task.completed / task.target) * 100)) : 0;
              const isDone = task.completed >= task.target;

              return (
                 <div
                   key={task.type}
                   className="rounded-xl p-5 transition-all hover:scale-[1.02] backdrop-blur-xl"
                   style={{
                     backgroundColor: 'rgba(15, 23, 42, 0.6)',
                     border: `1px solid ${isDone ? 'rgba(34, 211, 238, 0.4)' : 'rgba(139, 92, 246, 0.25)'}`,
                     boxShadow: isDone ? '0 0 15px rgba(34, 211, 238, 0.2)' : 'none',
                   }}
                 >
                   <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <div
                         className="w-10 h-10 rounded-lg flex items-center justify-center"
                         style={{ backgroundColor: `${color}20` }}
                       >
                         <Icon size={20} style={{ color }} />
                       </div>
                       <div>
                         <h3 className="font-medium text-white">{task.label}</h3>
                         <p className="text-xs text-slate-400">
                           目标 {task.target} · 已完成 {task.completed} · {percent}%
                         </p>
                       </div>
                     </div>
                     <span
                       className="text-sm font-bold"
                       style={{ color: isDone ? '#06B6D4' : color }}
                     >
                       {isDone ? '✓' : ''}
                     </span>
                   </div>

                   <button
                    onClick={() => onGoStudy(task.type)}
                    className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
                    style={
                      isDone
                        ? {
                            backgroundColor: 'rgba(34, 211, 238, 0.1)',
                            color: '#06B6D4',
                            border: '1px solid rgba(34, 211, 238, 0.3)',
                          }
                        : {
                            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                            color: 'white',
                            boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)',
                          }
                    }
                  >
                    {isDone ? '已完成 · 再练练' : '去学习'}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default TodayPlanTab;
