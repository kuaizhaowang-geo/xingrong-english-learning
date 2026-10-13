import { useState, useEffect } from 'react';
import { X, BookOpen, Languages, Headphones, PenTool, Brain } from 'lucide-react';
import { logger } from '@client/src/api';
import type { StudyPlanItem, CreatePlanDto, DailyTasks } from '@shared/api.interface';

interface PlanDialogProps {
  plan: StudyPlanItem | null;
  onClose: () => void;
  onSubmit: (dto: Partial<CreatePlanDto> & { planName?: string; planType?: CreatePlanDto['planType']; dailyTasks?: DailyTasks }) => Promise<void>;
}

const PLAN_TYPES: { value: CreatePlanDto['planType']; label: string }[] = [
  { value: 'daily', label: '每日计划' },
  { value: 'weekly', label: '每周计划' },
  { value: 'custom', label: '自定义' },
  { value: 'ai', label: 'AI推荐' },
];

const TASK_FIELDS: { key: keyof DailyTasks; label: string; icon: typeof BookOpen; color: string }[] = [
  { key: 'wordCount', label: '单词学习', icon: BookOpen, color: '#6366F1' },
  { key: 'sentenceCount', label: '句子练习', icon: Languages, color: '#06B6D4' },
  { key: 'dictationCount', label: '听写练习', icon: Headphones, color: '#FFD166' },
  { key: 'phoneticCount', label: '音标学习', icon: PenTool, color: '#EC4899' },
  { key: 'aiQuizCount', label: 'AI出题', icon: Brain, color: '#A855F7' },
];

function PlanDialog({ plan, onClose, onSubmit }: PlanDialogProps) {
  const isEdit = !!plan;
  const today = new Date().toISOString().split('T')[0];

  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<CreatePlanDto['planType']>('daily');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [remindTime, setRemindTime] = useState('08:00');
  const [tasks, setTasks] = useState<Record<string, number>>({
    wordCount: 10,
    sentenceCount: 5,
    dictationCount: 3,
    phoneticCount: 5,
    aiQuizCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setPlanName(plan.planName);
      setPlanType(plan.planType);
      setStartDate(plan.startDate);
      setEndDate(plan.endDate ?? '');
      setDailyMinutes(plan.dailyMinutes);
      setRemindTime(plan.remindTime ?? '08:00');
      const t: Record<string, number> = {};
      Object.entries(plan.dailyTasks).forEach(([k, v]) => {
        if (typeof v === 'number') t[k] = v;
      });
      setTasks((prev) => ({ ...prev, ...t }));
    }
  }, [plan]);

  const handleTaskChange = (key: string, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setTasks((prev) => ({ ...prev, [key]: num }));
  };

  const handleSubmit = async () => {
    if (!planName.trim()) {
      setError('请输入计划名称');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const dailyTasks: DailyTasks = {};
      Object.entries(tasks).forEach(([k, v]) => {
        if (v > 0) (dailyTasks as Record<string, number>)[k] = v;
      });

      const dto: CreatePlanDto = {
        planName: planName.trim(),
        planType,
        startDate,
        dailyMinutes,
        dailyTasks,
        ...(endDate ? { endDate } : {}),
        ...(remindTime ? { remindTime } : {}),
      };

      await onSubmit(dto);
    } catch (err) {
      setError('保存失败，请重试');
      logger.error('保存计划失败', err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
       <div
         className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 backdrop-blur-xl"
         style={{
           backgroundColor: 'rgba(15, 23, 42, 0.95)',
           border: '1px solid rgba(139, 92, 246, 0.3)',
           boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
         }}
         onClick={(e) => e.stopPropagation()}
       >
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-bold text-white">
            {isEdit ? '编辑计划' : '新建计划'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Plan Name */}
          <div>
             <label className="block text-sm text-slate-400 mb-1.5">计划名称</label>
             <input
               type="text"
               value={planName}
               onChange={(e) => setPlanName(e.target.value)}
               placeholder="输入计划名称"
               className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none transition-all placeholder:text-slate-500"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.05)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
               }}
             />
          </div>

          {/* Plan Type */}
          <div>
             <label className="block text-sm text-slate-400 mb-1.5">计划类型</label>
            <div className="grid grid-cols-4 gap-2">
              {PLAN_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPlanType(t.value)}
                  className="py-2 px-2 rounded-lg text-xs font-medium transition-all"
                  style={
                    planType === t.value
                      ? {
                          background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                          color: 'white',
                          boxShadow: '0 0 10px rgba(99, 102, 241, 0.25)',
                        }
                       : {
                           backgroundColor: 'rgba(255, 255, 255, 0.05)',
                           color: '#94A3B8',
                           border: '1px solid rgba(255, 255, 255, 0.1)',
                         }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm text-slate-400 mb-1.5">开始日期</label>
               <input
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none"
                 style={{
                   backgroundColor: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   colorScheme: 'dark',
                 }}
               />
             </div>
             <div>
               <label className="block text-sm text-slate-400 mb-1.5">结束日期（可选）</label>
               <input
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none"
                 style={{
                   backgroundColor: 'rgba(255, 255, 255, 0.05)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   colorScheme: 'dark',
                 }}
               />
            </div>
          </div>

          {/* Daily Minutes */}
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">
              每日学习分钟数: <span style={{ color: '#06B6D4', fontWeight: 'bold' }}>{dailyMinutes} 分钟</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={180}
                step={5}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(parseInt(e.target.value, 10))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #6366F1 0%, #06B6D4 ${((dailyMinutes - 10) / 170) * 100}%, rgba(99, 102, 241, 0.12) ${((dailyMinutes - 10) / 170) * 100}%, rgba(99, 102, 241, 0.12) 100%)`,
                }}
              />
              <input
                type="number"
                min={5}
                max={300}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Math.max(5, parseInt(e.target.value, 10) || 0))}
                className="w-20 px-3 py-2 rounded-lg text-center text-sm text-[#1E293B] focus:outline-none"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              />
            </div>
          </div>

          {/* Daily Tasks */}
           <div>
             <label className="block text-sm text-slate-400 mb-2">每日任务配置</label>
            <div className="space-y-2">
              {TASK_FIELDS.map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                   className="flex items-center gap-3 p-3 rounded-lg"
                   style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                 >
                   <div
                     className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${color}30` }}
                   >
                     <Icon size={14} style={{ color }} />
                   </div>
                   <span className="text-sm text-white flex-1">{label}</span>
                  <input
                    type="number"
                    min={0}
                    value={tasks[key as string] ?? 0}
                    onChange={(e) => handleTaskChange(key as string, e.target.value)}
                   className="w-20 px-3 py-1.5 rounded-lg text-center text-sm text-white focus:outline-none"
                     style={{
                       backgroundColor: 'rgba(255, 255, 255, 0.05)',
                       border: '1px solid rgba(255, 255, 255, 0.1)',
                     }}
                   />
                </div>
              ))}
            </div>
          </div>

          {/* Remind Time */}
          <div>
             <label className="block text-sm text-slate-400 mb-1.5">提醒时间</label>
             <input
               type="time"
               value={remindTime}
               onChange={(e) => setRemindTime(e.target.value)}
               className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.05)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 colorScheme: 'dark',
               }}
             />
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(239, 71, 111, 0.1)',
                border: '1px solid rgba(239, 71, 111, 0.3)',
                color: '#EF476F',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
               className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
               style={{
                 backgroundColor: 'rgba(255, 255, 255, 0.05)',
                 color: '#CBD5E1',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
               }}
             >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
              }}
            >
              {submitting ? '保存中...' : isEdit ? '保存修改' : '创建计划'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanDialog;
