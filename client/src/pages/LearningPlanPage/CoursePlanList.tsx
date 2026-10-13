import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Trash2,
  Pin,
  PinOff,
  Check,
  ArrowRight,
  GraduationCap,
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

export interface CoursePlanItem {
  id: string;
  planType: 'course';
  title: string;
  description: string;
  coverGradient: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  addedAt: string;
  isPinned: boolean;
  isSelected: boolean;
}

interface CoursePlanListProps {
  plans: CoursePlanItem[];
  manageMode: boolean;
  selectedIds: Set<string>;
  onStart: (plan: CoursePlanItem) => void;
  onRemove: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

const CoursePlanList: React.FC<CoursePlanListProps> = ({
  plans,
  manageMode,
  selectedIds,
  onStart,
  onRemove,
  onTogglePin,
  onToggleSelect,
}) => {
  const navigate = useNavigate();

  const sortedPlans = [...plans].sort(
    (a: CoursePlanItem, b: CoursePlanItem) =>
      Number(b.isPinned) - Number(a.isPinned),
  );

  if (plans.length === 0) {
    return (
      <Empty className="border-0 glass-card rounded-xl">
        <EmptyContent>
          <EmptyMedia>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-gray-300" />
            </div>
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>还没有加入课程</EmptyTitle>
            <EmptyDescription>
              去课程广场挑选心仪的课程，加入你的学习计划吧
            </EmptyDescription>
          </EmptyHeader>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium transition-all"
          >
            去课程广场
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
      {sortedPlans.map((plan: CoursePlanItem) => {
        const isSelected = selectedIds.has(plan.id);

        return (
          <div
            key={plan.id}
             className={`relative rounded-xl glass-card shadow-sm hover:shadow-md transition-all overflow-hidden ${
               plan.isPinned
                 ? 'ring-2 ring-amber-400/70'
                 : ''
             }`}
          >
            {manageMode && (
              <button
                onClick={() => onToggleSelect(plan.id)}
                className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white/80 border-gray-300 hover:border-orange-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            )}

            <button
              onClick={() => onTogglePin(plan.id)}
              className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg backdrop-blur-sm transition-all ${
                plan.isPinned
                  ? 'bg-amber-400 text-white shadow-md'
                  : 'bg-white/60 text-gray-400 hover:bg-white hover:text-amber-500'
              }`}
              title={plan.isPinned ? '取消置顶' : '置顶'}
            >
              {plan.isPinned ? (
                <Pin className="w-3.5 h-3.5" />
              ) : (
                <PinOff className="w-3.5 h-3.5" />
              )}
            </button>

            <div
              className={`h-32 bg-gradient-to-br ${plan.coverGradient} p-4 flex items-end relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <Badge
                  variant="default"
                  className="bg-white/20 text-white border-0 backdrop-blur-sm"
                >
                  <GraduationCap className="w-3 h-3 mr-1" />
                  系统课
                </Badge>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-1">
                {plan.title}
              </h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                {plan.description}
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">学习进度</span>
                  <span className="text-xs font-semibold text-orange-500">
                    {plan.progress}%
                  </span>
                </div>
                <Progress
                  value={plan.progress}
                  className="h-2 bg-gray-100 [&>div]:bg-orange-500"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-gray-400">
                    已学 {plan.completedLessons}/{plan.totalLessons} 课时
                  </span>
                  <span className="text-xs text-gray-400">
                    剩余 {plan.totalLessons - plan.completedLessons} 课时
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStart(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  继续学习
                </button>
              </div>
              <button
                onClick={() => onRemove(plan.id, plan.title)}
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

export default CoursePlanList;
