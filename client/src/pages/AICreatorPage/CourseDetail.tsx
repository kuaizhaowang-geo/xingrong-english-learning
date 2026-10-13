import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Share2,
  Trash2,
  BookOpen,
  BookMarked,
  MessageCircle,
  Lightbulb,
} from 'lucide-react';
import type { AICourse } from '@shared/api.interface';
import LessonDetailPanel, { type ContentTabKey } from './LessonDetailPanel';

interface CourseDetailProps {
  course: AICourse;
  onBack: () => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onEdit: (id: string) => void;
}

const TABS: { key: ContentTabKey; label: string; icon: typeof BookOpen; color: string }[] = [
  { key: 'words', label: '单词', icon: BookOpen, color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300' },
  { key: 'sentences', label: '句子', icon: BookMarked, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300' },
  { key: 'dialogues', label: '对话', icon: MessageCircle, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300' },
  { key: 'grammar', label: '语法', icon: Lightbulb, color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300' },
];

const LEVEL_LABEL: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
  easy: '简单',
  medium: '中等',
  hard: '困难',
  primary: '小学',
  junior: '初中',
  senior: '高中',
};

function getLevelLabel(level: string): string {
  return LEVEL_LABEL[level] ?? level;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  onBack,
  onDelete,
  onShare,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<ContentTabKey>('words');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tabCounts = useMemo(() => ({
    words: course.content.words?.length ?? 0,
    sentences: course.content.sentences?.length ?? 0,
    dialogues: course.content.dialogues?.length ?? 0,
    grammar: course.content.grammar?.length ?? 0,
  }), [course.content]);

  const handleDeleteConfirm = (): void => {
    onDelete(course.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
             className="flex items-center gap-1 px-3 py-2 rounded-lg
               text-slate-500 hover:text-indigo-600
               hover:bg-indigo-50 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">返回</span>
          </button>
          <div>
             <h1 className="text-xl font-bold text-slate-800">{course.title}</h1>
             <p className="text-xs text-slate-500 mt-0.5">AI 生成课程详情</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
             onClick={() => onEdit(course.id)}
             className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
               bg-white/80 text-slate-600 border border-indigo-100 backdrop-blur-xl
               hover:border-violet-500/40 hover:text-indigo-600 transition-colors">
             <Edit3 size={14} />
            编辑课程
          </button>
          <button
             onClick={() => onShare(course.id)}
             className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
               bg-white/80 text-slate-600 border border-indigo-100 backdrop-blur-xl
               hover:border-violet-500/40 hover:text-indigo-600 transition-colors">
             <Share2 size={14} />
            分享课程
          </button>
          <button
             onClick={() => setShowDeleteConfirm(true)}
             className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
               bg-white/80 text-rose-500 border border-rose-200 backdrop-blur-xl
               hover:bg-rose-50 hover:border-rose-300 transition-colors">
             <Trash2 size={14} />
            删除课程
          </button>
        </div>
      </div>

      {/* 课程信息卡 */}
      <div className="rounded-2xl p-5
         bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-cyan-50/80
         border border-indigo-200 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs px-3 py-1 rounded-full
             bg-violet-50 text-violet-600 border border-violet-200">
            {getLevelLabel(course.level)}
          </span>
          <span className="text-xs px-3 py-1 rounded-full
             bg-cyan-50 text-cyan-600 border border-cyan-200">
            {course.topic}
          </span>
          <span className="text-xs px-3 py-1 rounded-full
             bg-slate-100 text-slate-600 border border-slate-200">
            {tabCounts.words + tabCounts.sentences + tabCounts.dialogues + tabCounts.grammar} 条内容
          </span>
        </div>
        {course.learningGoal && (
          <p className="text-sm text-slate-600 leading-relaxed">{course.learningGoal}</p>
        )}
        <div className="mt-3 text-xs text-slate-500">
          创建时间：{formatDate(course.createdAt)}
        </div>
      </div>

      {/* 内容 Tab + 详情面板 */}
      <div className="space-y-4">
        {/* Tab 导航 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            const count = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  border transition-all duration-200 flex-shrink-0
                  ${active
                     ? `bg-gradient-to-r ${tab.color}`
                     : 'bg-white/80 text-slate-500 border-indigo-100 hover:border-violet-500/40 hover:text-slate-700 backdrop-blur-xl'
                  }`}>
                <Icon size={16} />
                {tab.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* 内容详情 */}
        <LessonDetailPanel
          activeTab={activeTab}
          words={course.content.words}
          sentences={course.content.sentences}
          dialogues={course.content.dialogues}
          grammar={course.content.grammar}
        />
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl
            bg-[#FFFFFF] border border-purple-500/30
            shadow-2xl shadow-rose-500/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">确认删除？</h3>
            <p className="text-sm text-slate-400 mb-6">
              删除后课程将无法恢复，确定要删除「{course.title}」吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium
                  bg-slate-700/50 text-slate-300 border border-slate-600/30
                  hover:bg-slate-700 transition-colors">
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white
                  bg-gradient-to-r from-rose-500 to-pink-500
                  hover:from-rose-600 hover:to-pink-600
                  shadow-lg shadow-rose-500/20 transition-all">
                删除课程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
