import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Trash2,
  Pin,
  PinOff,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@client/src/components/ui/progress';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@client/src/components/ui/empty';
import { Badge } from '@client/src/components/ui/badge';
import type { LearningPlan } from '@shared/api.interface';

interface PlanListProps {
  loading: boolean;
  plans: LearningPlan[];
  planType: 'sentence' | 'word';
  manageMode: boolean;
  selectedIds: Set<string>;
  pinnedIds: Set<string>;
  onStart: (plan: LearningPlan) => void;
  onRemove: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSelect: (id: string) => void;
  formatProgress: (plan: LearningPlan) => number;
  getPlanCoverGradient: (plan: LearningPlan) => string;
}

const PlanList: React.FC<PlanListProps> = ({
  loading,
  plans,
  planType,
  manageMode,
  selectedIds,
  pinnedIds,
  onStart,
  onRemove,
  onTogglePin,
  onToggleSelect,
  formatProgress,
  getPlanCoverGradient,
}) => {
  const navigate = useNavigate();

  const sortedPlans = [...plans].sort(
    (a: LearningPlan, b: LearningPlan) =>
      Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)),
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i: number) => (
          <div
            key={i}
             className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse"
          >
             <div className="bg-white/10 h-24 rounded-lg mb-4" />
             <div className="bg-white/10 h-5 rounded w-3/4 mb-2" />
             <div className="bg-white/10 h-3 rounded w-1/2 mb-4" />
             <div className="bg-white/10 h-2 rounded-full mb-2" />
             <div className="bg-white/10 h-3 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
       <Empty className="border-0 glass-card rounded-xl shadow-sm">
        <EmptyContent>
          <EmptyMedia>
             <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
               <Sparkles className="w-10 h-10 text-slate-500" />
            </div>
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>还没有加入任何计划</EmptyTitle>
            <EmptyDescription>
              去
              {planType === 'sentence' ? '句子练习' : '单词仓库'}
              中添加你的第一个学习计划吧
            </EmptyDescription>
          </EmptyHeader>
          <button
            onClick={() =>
              navigate(planType === 'sentence' ? '/practice/sentence' : '/word-library')
            }
            className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium transition-all"
          >
            {planType === 'sentence' ? '去句子练习' : '去单词仓库'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      data-ai-section-type="card-list"
    >
      {sortedPlans.map((plan: LearningPlan) => {
        const progress = formatProgress(plan);
        const isPinned = pinnedIds.has(plan.id);
        const isSelected = selectedIds.has(plan.id);

        return (
          <div
            key={plan.id}
             className={`relative rounded-xl glass-card hover:shadow-md transition-all overflow-hidden ${
               isPinned
                 ? 'ring-2 ring-amber-400/60 border-amber-500/30'
                 : 'border border-white/10'
             }`}
          >
            {manageMode && (
              <button
                onClick={() => onToggleSelect(plan.id)}
                className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                   ? 'bg-orange-500 border-orange-500 text-white'
                     : 'bg-white/10 border-white/20 hover:border-orange-500/50'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            <button
              onClick={() => onTogglePin(plan.id)}
              className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg backdrop-blur-sm transition-all ${
                isPinned
                   ? 'bg-amber-400 text-white shadow-md'
                   : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-amber-400'
              }`}
              title={isPinned ? '取消置顶' : '置顶'}
            >
              {isPinned ? (
                <Pin className="w-3.5 h-3.5" />
              ) : (
                <PinOff className="w-3.5 h-3.5" />
              )}
            </button>

            <div
              className={`h-28 bg-gradient-to-br ${getPlanCoverGradient(plan)} p-4 flex items-start justify-between relative`}
            >
              <Badge
                variant="default"
                className="bg-white/20 text-white border-0 backdrop-blur-sm"
              >
                {plan.itemType}
              </Badge>
              <span className="text-xs text-white/80 mt-1">
                已完成 {plan.completedCount}/{plan.totalCount}
              </span>
            </div>
            <div className="p-5">
               <h3 className="text-base font-semibold text-white mb-2 line-clamp-1">
                {plan.itemTitle}
              </h3>
              {plan.itemMeta &&
                (plan.itemMeta as { description?: string }).description && (
                   <p className="text-sm text-slate-400 mb-3 line-clamp-1">
                    {(plan.itemMeta as { description: string }).description}
                  </p>
                )}
              <div className="mb-4">
                <Progress
                  value={progress}
                   className="h-2 bg-white/10 [&>div]:bg-orange-500"
                />
                <div className="flex justify-between mt-1.5">
                   <span className="text-xs text-slate-500">
                    进度 {progress}%
                  </span>
                   <span className="text-xs text-slate-500">
                    剩余 {Math.max(0, plan.totalCount - plan.completedCount)} 项
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStart(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  开始学习
                </button>
              </div>
              <button
                onClick={() => onRemove(plan.id, plan.itemTitle)}
                className="w-full mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1 py-1"
              >
                <Trash2 className="w-3 h-3" />
                移除计划
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlanList;
