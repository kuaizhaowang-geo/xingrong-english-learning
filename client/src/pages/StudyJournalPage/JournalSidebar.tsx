import React from 'react';
import {
  BookX,
  FileText,
  Volume2,
  BookOpen,
  Puzzle,
  Star,
} from 'lucide-react';

export type JournalCategory =
  | 'wrong-words'
  | 'wrong-sentences'
  | 'pronunciation'
  | 'new-words'
  | 'hard-sentences'
  | 'favorites';

interface CategoryConfig {
  key: JournalCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface JournalSidebarProps {
  activeCategory: JournalCategory;
  onCategoryChange: (cat: JournalCategory) => void;
  counts: Record<JournalCategory, number>;
}

const categories: CategoryConfig[] = [
  {
    key: 'wrong-words',
    label: '错词本',
    icon: <BookX className="w-5 h-5" />,
    description: '拼写错误的单词',
  },
  {
    key: 'wrong-sentences',
    label: '错句本',
    icon: <FileText className="w-5 h-5" />,
    description: '翻译/语法错误的句子',
  },
  {
    key: 'pronunciation',
    label: '发音问题',
    icon: <Volume2 className="w-5 h-5" />,
    description: '发音不准确的单词/句子',
  },
  {
    key: 'new-words',
    label: '生词本',
    icon: <BookOpen className="w-5 h-5" />,
    description: '标记为不熟悉的单词',
  },
  {
    key: 'hard-sentences',
    label: '难句本',
    icon: <Puzzle className="w-5 h-5" />,
    description: '复杂长难句',
  },
  {
    key: 'favorites',
    label: '收藏夹',
    icon: <Star className="w-5 h-5" />,
    description: '用户收藏的内容',
  },
];

const JournalSidebar: React.FC<JournalSidebarProps> = ({
  activeCategory,
  onCategoryChange,
  counts,
}) => {
  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex flex-col w-[200px] shrink-0 gap-2 py-4">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          const count = counts[cat.key] ?? 0;
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/30 text-white shadow-lg shadow-purple-500/20 border border-purple-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/10 blur-md -z-10 animate-pulse" />
              )}
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                    : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                }`}
              >
                {cat.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    isActive ? 'text-white' : ''
                  }`}
                >
                  {cat.label}
                </div>
              </div>
              {count > 0 && (
                <span
                  className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                    isActive
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500/80 text-white'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Mobile: horizontal scroll tabs */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            const count = counts[cat.key] ?? 0;
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryChange(cat.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/30 text-white border border-purple-400/40 shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 bg-white/5 border border-white/10'
                }`}
              >
                <span
                  className={`${
                    isActive ? 'text-purple-300' : 'text-slate-500'
                  }`}
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-medium">{cat.label}</span>
                {count > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default JournalSidebar;
