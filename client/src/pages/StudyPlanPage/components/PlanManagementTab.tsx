import { useState } from 'react';
import { Calendar, Clock, Edit2, Trash2, Zap, Check, Sparkles, Crown, Target, Rocket } from 'lucide-react';
import { logger } from '@client/src/api';
import type { StudyPlanItem, CreatePlanDto, DailyTasks } from '@shared/api.interface';

interface PlanManagementTabProps {
  loading: boolean;
  plans: StudyPlanItem[];
  onActivate: (id: string) => void;
  onEdit: (plan: StudyPlanItem) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
}

interface PlanTemplate {
  name: string;
  minutes: number;
  description: string;
  icon: typeof Target;
  color: string;
  dailyTasks: DailyTasks;
}

const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    name: '初学者计划',
    minutes: 30,
    description: '轻松入门，培养学习习惯',
    icon: Sparkles,
    color: '#06B6D4',
    dailyTasks: { wordCount: 10, sentenceCount: 5, dictationCount: 3, phoneticCount: 5, aiQuizCount: 1 },
  },
  {
    name: '进阶者计划',
    minutes: 60,
    description: '稳步提升，夯实基础',
    icon: Target,
    color: '#6366F1',
    dailyTasks: { wordCount: 20, sentenceCount: 10, dictationCount: 8, phoneticCount: 10, aiQuizCount: 3 },
  },
  {
    name: '精通者计划',
    minutes: 90,
    description: '深度学习，全面提升',
    icon: Crown,
    color: '#FFD166',
    dailyTasks: { wordCount: 35, sentenceCount: 18, dictationCount: 12, phoneticCount: 15, aiQuizCount: 5 },
  },
  {
    name: '考前冲刺计划',
    minutes: 120,
    description: '高强度训练，快速突破',
    icon: Rocket,
    color: '#EF476F',
    dailyTasks: { wordCount: 50, sentenceCount: 25, dictationCount: 20, phoneticCount: 20, aiQuizCount: 8 },
  },
];

const PLAN_TYPE_LABELS: Record<string, string> = {
  daily: '每日计划',
  weekly: '每周计划',
  custom: '自定义',
  ai: 'AI推荐',
};

function PlanManagementTab({ loading, plans, onActivate, onEdit, onDelete, onCreate, onRefresh }: PlanManagementTabProps) {
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<PlanTemplate | null>(null);

  const handleTemplateClick = async (template: PlanTemplate) => {
    setCreatingFromTemplate(template);
    // Directly create from template
    const today = new Date().toISOString().split('T')[0];
    const dto: CreatePlanDto = {
      planName: template.name,
      planType: 'daily',
      startDate: today,
      dailyMinutes: template.minutes,
      dailyTasks: template.dailyTasks,
    };
    try {
      // Use studyPlanApi directly
      const { studyPlanApi } = await import('@client/src/api');
      await studyPlanApi.createPlan(dto);
      onRefresh();
    } catch (err) {
      logger.error('创建模板计划失败', err as Error);
    } finally {
      setCreatingFromTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Sparkles size={18} style={{ color: '#6366F1' }} />
          快捷模板
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLAN_TEMPLATES.map((template) => {
            const Icon = template.icon;
            const isCreating = creatingFromTemplate?.name === template.name;
            return (
              <button
                key={template.name}
                onClick={() => handleTemplateClick(template)}
                disabled={isCreating}
               className="rounded-xl p-5 text-left transition-all hover:scale-[1.03] disabled:opacity-60 backdrop-blur-xl"
                 style={{
                   backgroundColor: 'rgba(15, 23, 42, 0.6)',
                   border: `1px solid ${template.color}50`,
                 }}
               >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <Icon size={20} style={{ color: template.color }} />
                </div>
                 <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                 <p className="text-xs text-slate-400 mb-2">{template.description}</p>
                <div className="flex items-center gap-1 text-xs" style={{ color: template.color }}>
                  <Clock size={12} />
                  <span>{template.minutes}分钟/天</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* My Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
          <Calendar size={18} style={{ color: '#6366F1' }} />
          我的计划
        </h2>

        {loading && plans.length === 0 ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
            ))}
          </div>
        ) : plans.length === 0 ? (
           <div
             className="rounded-xl p-10 text-center backdrop-blur-xl"
             style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
           >
             <p className="text-slate-400 mb-4">还没有学习计划，点击上方模板快速创建</p>
            <button
              onClick={onCreate}
              className="px-5 py-2 rounded-lg text-white text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
              }}
            >
              新建计划
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => {
              const isActive = plan.status === 'active';
              return (
                <div
                  key={plan.id}
                   className="rounded-xl p-5 transition-all backdrop-blur-xl"
                   style={{
                     backgroundColor: 'rgba(15, 23, 42, 0.6)',
                     border: isActive
                       ? '1px solid rgba(34, 211, 238, 0.5)'
                       : '1px solid rgba(139, 92, 246, 0.25)',
                     boxShadow: isActive ? '0 0 20px rgba(34, 211, 238, 0.15)' : 'none',
                   }}
                 >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg, #06B6D4, #6366F1)'
                            : 'rgba(99, 102, 241, 0.12)',
                        }}
                      >
                        <Zap size={22} style={{ color: isActive ? 'white' : '#6366F1' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                           <h3 className="font-semibold text-white truncate">{plan.planName}</h3>
                          {isActive && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                              style={{
                                backgroundColor: 'rgba(34, 211, 238, 0.15)',
                                color: '#06B6D4',
                                border: '1px solid rgba(34, 211, 238, 0.3)',
                              }}
                            >
                              <Check size={10} />
                              当前计划
                            </span>
                          )}
                        </div>
                         <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                          <span>{PLAN_TYPE_LABELS[plan.planType] ?? plan.planType}</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {plan.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {plan.dailyMinutes}分钟/天
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => onActivate(plan.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                          style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                            color: 'white',
                          }}
                        >
                          激活
                        </button>
                      )}
                       <button
                         onClick={() => onEdit(plan)}
                         className="p-2 rounded-lg transition-colors hover:bg-white/10"
                         style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8' }}
                         title="编辑"
                       >
                        <Edit2 size={14} />
                      </button>
                       <button
                         onClick={() => onDelete(plan.id)}
                         className="p-2 rounded-lg transition-colors hover:bg-red-500/10"
                         style={{ backgroundColor: 'rgba(239, 71, 111, 0.1)', color: '#F87171' }}
                         title="删除"
                       >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanManagementTab;
