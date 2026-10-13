import React, { useState } from 'react';
import { X, Loader2, Sparkles, Target, Gauge } from 'lucide-react';

export type LevelKey = 'beginner' | 'intermediate' | 'advanced';

interface CreateCourseModalProps {
  generating: boolean;
  onClose: () => void;
  onGenerate: (params: {
    topic: string;
    learningGoal: string;
    level: string;
    title?: string;
  }) => void;
}

const LEVEL_OPTIONS: { key: LevelKey; label: string; color: string }[] = [
  { key: 'beginner', label: '入门', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
  { key: 'intermediate', label: '进阶', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
  { key: 'advanced', label: '高级', color: 'border-rose-500/50 text-rose-400 bg-rose-500/10' },
];

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  generating,
  onClose,
  onGenerate,
}) => {
  const [topic, setTopic] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [level, setLevel] = useState<LevelKey>('intermediate');

  const handleGenerate = (): void => {
    if (!topic.trim() || generating) return;
    onGenerate({
      topic: topic.trim(),
      learningGoal: learningGoal.trim(),
      level,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto
        rounded-2xl glass-card
        border border-fuchsia-500/30
        shadow-2xl shadow-fuchsia-500/20">
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1
          bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500" />

        {/* 头部 */}
         <div className="flex items-center justify-between p-5 border-b border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg
              bg-gradient-to-br from-violet-500 to-cyan-500
              flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
               <h2 className="text-lg font-semibold text-white">创建新课</h2>
               <p className="text-xs text-slate-400">
                填写信息，AI 智能生成定制课程
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
             className="p-2 rounded-lg text-slate-400
               hover:text-white hover:bg-white/10
               disabled:opacity-40 disabled:cursor-not-allowed
               transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-5 space-y-5">
          {/* 课程主题 */}
          <div>
             <label className="text-sm font-medium text-slate-200 mb-2 block">
               课程主题 <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTopic(e.target.value)
              }
              placeholder="例如：咖啡馆点餐、商务邮件写作、旅行英语..."
              rows={2}
               className="w-full px-4 py-3 rounded-xl text-sm
                  bg-white/5 border border-white/10
                  text-white placeholder-slate-500
                  focus:outline-none focus:border-fuchsia-500/60
                  focus:ring-2 focus:ring-fuchsia-500/20
                  transition-all resize-none"
              disabled={generating}
            />
          </div>

          {/* 学习目标 */}
          <div>
             <label className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-1.5">
                <Target size={14} className="text-slate-500" />
               学习目标
            </label>
            <textarea
              value={learningGoal}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setLearningGoal(e.target.value)
              }
              placeholder="例如：掌握日常对话、通过考试、商务沟通..."
              rows={2}
               className="w-full px-4 py-3 rounded-xl text-sm
                  bg-white/5 border border-white/10
                  text-white placeholder-slate-500
                  focus:outline-none focus:border-fuchsia-500/60
                  focus:ring-2 focus:ring-fuchsia-500/20
                  transition-all resize-none"
              disabled={generating}
            />
          </div>

          {/* 难度选择 */}
          <div>
             <label className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-1.5">
                <Gauge size={14} className="text-slate-500" />
               难度等级
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_OPTIONS.map((opt) => {
                const active = level === opt.key;
                return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => !generating && setLevel(opt.key)}
                      disabled={generating}
                      className={`py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-300 border
                         ${active
                           ? opt.color + ' ring-2 ring-offset-2 ring-offset-transparent ring-fuchsia-500/40'
                           : 'bg-white/5 text-slate-300 border-white/10 hover:border-fuchsia-500/40'
                         }
                        disabled:cursor-not-allowed`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
         <div className="p-5 border-t border-indigo-100">
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
            className="w-full py-3.5 rounded-xl font-semibold text-white
              bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500
              hover:from-violet-600 hover:via-purple-600 hover:to-cyan-600
              shadow-lg shadow-violet-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:shadow-none
              transition-all duration-300
              flex items-center justify-center gap-2 relative overflow-hidden">
            {generating && (
              <span className="absolute inset-0
                bg-gradient-to-r from-transparent via-white/20 to-transparent
                animate-pulse" />
            )}
            {generating ? (
              <>
                <Loader2 size={20} className="animate-spin relative z-10" />
                <span className="relative z-10">生成中...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                立即生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;
