import { useState } from 'react';
import { Sparkles, RefreshCw, Check, Target, AlertTriangle, Award, BookOpen, Languages, Headphones, PenTool, Brain } from 'lucide-react';
import type { AiPlanRecommendation, CreatePlanDto } from '@shared/api.interface';

interface AIRecommendationTabProps {
  loading: boolean;
  recommendation: AiPlanRecommendation | null;
  onRegenerate: () => void;
  onAccept: (dto: CreatePlanDto) => Promise<void>;
}

const TASK_LABELS: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  wordCount: { label: '单词学习', icon: BookOpen, color: '#6366F1' },
  sentenceCount: { label: '句子练习', icon: Languages, color: '#06B6D4' },
  dictationCount: { label: '听写练习', icon: Headphones, color: '#FFD166' },
  phoneticCount: { label: '音标学习', icon: PenTool, color: '#EC4899' },
  aiQuizCount: { label: 'AI出题', icon: Brain, color: '#A855F7' },
};

function SkeletonCard() {
  return (
     <div
       className="rounded-xl p-6 animate-pulse backdrop-blur-xl"
       style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
     >
       <div className="h-7 w-48 rounded bg-indigo-500/20 mb-3" />
       <div className="h-4 w-32 rounded bg-indigo-500/20 mb-6" />
       <div className="space-y-3 mb-6">
         {[1, 2, 3, 4, 5].map((i) => (
           <div key={i} className="h-12 rounded-lg bg-indigo-500/20" />
         ))}
       </div>
       <div className="h-5 w-24 rounded bg-indigo-500/20 mb-3" />
       <div className="space-y-2 mb-6">
         {[1, 2, 3].map((i) => (
           <div key={i} className="h-4 rounded bg-indigo-500/20" />
         ))}
       </div>
       <div className="flex gap-3">
         <div className="h-10 flex-1 rounded-lg bg-indigo-500/20" />
         <div className="h-10 w-28 rounded-lg bg-indigo-500/20" />
      </div>
    </div>
  );
}

function AIRecommendationTab({ loading, recommendation, onRegenerate, onAccept }: AIRecommendationTabProps) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (!recommendation) return;
    try {
      setAccepting(true);
      const today = new Date().toISOString().split('T')[0];
      const dto: CreatePlanDto = {
        planName: recommendation.planName,
        planType: 'ai',
        startDate: today,
        dailyMinutes: recommendation.dailyMinutes,
        dailyTasks: recommendation.dailyTasks,
      };
      await onAccept(dto);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <SkeletonCard />;
  if (!recommendation) {
    return (
       <div
        className="rounded-xl p-12 text-center backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
      >
        <Sparkles size={48} style={{ color: '#A78BFA', margin: '0 auto 16px' }} />
        <p className="text-slate-400">暂未获取到AI推荐</p>
        <button
          onClick={onRegenerate}
          className="mt-4 px-5 py-2 rounded-lg text-white text-sm"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' }}
        >
          生成推荐
        </button>
      </div>
    );
  }

  const taskEntries = Object.entries(recommendation.dailyTasks).filter(
    ([, v]) => typeof v === 'number' && v > 0,
  ) as [keyof typeof TASK_LABELS, number][];

  return (
    <div className="space-y-6">
       <div
        className="rounded-xl p-6 relative overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
        }}
      >
        {/* Glow decoration */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)' }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} style={{ color: '#6366F1' }} />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                  AI 智能推荐
                </span>
              </div>
               <h2 className="text-xl font-bold text-white">{recommendation.planName}</h2>
               <p className="text-sm text-slate-400 mt-1">
                每日学习 <span style={{ color: '#06B6D4', fontWeight: 'bold' }}>{recommendation.dailyMinutes}</span> 分钟
              </p>
            </div>
          </div>

          {/* Daily Tasks */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
              <Target size={14} style={{ color: '#06B6D4' }} />
              每日任务
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {taskEntries.map(([key, count]) => {
                const info = TASK_LABELS[key] ?? { label: key, icon: BookOpen, color: '#6366F1' };
                const Icon = info.icon;
                return (
                  <div
                    key={key}
                     className="flex items-center gap-3 p-3 rounded-lg"
                     style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}
                   >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${info.color}20` }}
                    >
                      <Icon size={16} style={{ color: info.color }} />
                    </div>
                    <div className="flex-1">
                       <p className="text-sm text-white">{info.label}</p>
                       <p className="text-xs text-slate-400">目标 {count} 个/次</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
              <Sparkles size={14} style={{ color: '#6366F1' }} />
              推荐理由
            </h3>
            <ul className="space-y-2">
               {recommendation.recommendations.map((rec: string, idx: number) => (
                 <li key={idx} className="flex gap-2 text-sm text-slate-400">
                  <span style={{ color: '#06B6D4' }}>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weak Points */}
          {recommendation.weakPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: '#FFD166' }} />
                薄弱点提示
              </h3>
               <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                <ul className="space-y-1.5">
                  {recommendation.weakPoints.map((wp: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-sm text-amber-300">
                      <span>⚠</span>
                      <span>{wp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Expected Goal */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3 flex items-center gap-2">
              <Award size={14} style={{ color: '#06B6D4' }} />
              预期目标
            </h3>
             <p className="text-sm text-slate-300 p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }}>
              {recommendation.expectedGoal}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 py-2.5 rounded-lg text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Check size={16} />
              {accepting ? '创建中...' : '采纳推荐'}
            </button>
            <button
              onClick={onRegenerate}
              disabled={loading}
               className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
               style={{
                 backgroundColor: 'rgba(139, 92, 246, 0.12)',
                 color: '#A78BFA',
                 border: '1px solid rgba(167, 139, 250, 0.3)',
               }}
             >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">重新生成</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIRecommendationTab;
