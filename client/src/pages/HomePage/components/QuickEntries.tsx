import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  BookMarked,
  Mic,
  MicVocal,
  Swords,
  GraduationCap,
  Target,
  NotebookPen,
  Sparkles,
} from 'lucide-react';

const quickEntries = [
  { label: '句子练习', icon: Play, color: '#FF6B35', path: '/practice/sentence' },
  { label: '单词仓库', icon: BookMarked, color: '#4361EE', path: '/word-library' },
  { label: '听写练习', icon: Mic, color: '#EF476F', path: '/practice/dictation' },
  { label: '音标课程', icon: MicVocal, color: '#6366F1', path: '/phonetics' },
  { label: 'PK竞技场', icon: Swords, color: '#F59E0B', path: '/pk-arena' },
  { label: '教材同步', icon: GraduationCap, color: '#2EC4B6', path: '/textbook-sync' },
  { label: '学习计划', icon: Target, color: '#F97316', path: '/learning-plan' },
  { label: '学习手账', icon: NotebookPen, color: '#06B6D4', path: '/journal' },
  { label: 'AI出题', icon: Sparkles, color: '#A855F7', path: '/ai-quiz' },
];

const QuickEntries: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="glass-card p-4 sm:p-5">
      <h2 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
        <span
          className="w-1 h-4 rounded-full"
          style={{ background: '#D946EF' }}
        />
        快捷入口
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-3" data-ai-section-type="card-menu">
        {quickEntries.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.label}
              onClick={() => navigate(entry.path)}
              className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-colors group min-h-[60px] justify-center"
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/20 group-hover:scale-105 transition-transform"
                style={{ background: entry.color }}
              >
                <Icon size={18} className="sm:hidden" />
                <Icon size={20} className="hidden sm:block" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-slate-300 text-center leading-tight">{entry.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default QuickEntries;
