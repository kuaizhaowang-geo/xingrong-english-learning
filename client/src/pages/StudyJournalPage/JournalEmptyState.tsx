import React from 'react';
import { Sparkles } from 'lucide-react';
import type { JournalCategory } from './JournalSidebar';

interface JournalEmptyStateProps {
  category: JournalCategory;
}

const categoryMessages: Record<JournalCategory, { title: string; desc: string }> = {
  'wrong-words': {
    title: '太棒了！没有错词',
    desc: '继续保持，你的单词掌握得非常好~',
  },
  'wrong-sentences': {
    title: '没有错句记录',
    desc: '在句子练习中出错的句子会自动收录到这里',
  },
  pronunciation: {
    title: '暂无发音问题',
    desc: '跟读练习中发音不准确的内容会出现在这里',
  },
  'new-words': {
    title: '生词本是空的',
    desc: '在单词训练中标记不熟悉的单词会出现在这里',
  },
  'hard-sentences': {
    title: '难句本是空的',
    desc: '复杂长难句和多次出错的句子会收录到这里',
  },
  favorites: {
    title: '还没有收藏',
    desc: '点击内容卡片的收藏按钮，精彩内容随时回顾',
  },
};

const JournalEmptyState: React.FC<JournalEmptyStateProps> = ({ category }) => {
  const msg = categoryMessages[category];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full blur-2xl scale-150" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/20 border border-purple-400/30 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-cyan-300" />
          </div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{msg.title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-xs">{msg.desc}</p>
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse [animation-delay:200ms]" />
        <div className="w-2 h-2 rounded-full bg-cyan-500/50 animate-pulse [animation-delay:400ms]" />
      </div>
    </div>
  );
};

export default JournalEmptyState;
