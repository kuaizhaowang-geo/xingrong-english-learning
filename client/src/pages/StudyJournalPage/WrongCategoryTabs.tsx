import React from 'react';
import { Badge } from '@client/src/components/ui/badge';

type WrongCategory = 'wrong' | 'unfamiliar' | 'mastered';

interface WrongCategoryTabsProps {
  category: WrongCategory;
  onChange: (cat: WrongCategory) => void;
  type: 'sentence' | 'word';
  wrongCount: number;
  unfamiliarCount: number;
  masteredCount: number;
  totalCount?: number;
}

const WrongCategoryTabs: React.FC<WrongCategoryTabsProps> = ({
  category,
  onChange,
  type,
  wrongCount,
  unfamiliarCount,
  masteredCount,
  totalCount,
}) => {
  const typeLabel = type === 'sentence' ? '句子' : '单词';
  const tabs: Array<{ key: WrongCategory; label: string; count: number }> = [
    { key: 'wrong', label: `${typeLabel}错题`, count: wrongCount },
    { key: 'unfamiliar', label: `不熟悉${typeLabel}`, count: unfamiliarCount },
    { key: 'mastered', label: `已掌握${typeLabel}`, count: masteredCount },
  ];

  const displayTotal = totalCount ?? wrongCount + unfamiliarCount + masteredCount;

  return (
    <div className="flex items-center flex-wrap gap-2">
       <div className="inline-flex bg-white/5 border border-white/10 rounded-lg p-[3px]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
               category === tab.key
                 ? 'bg-fuchsia-500/20 text-fuchsia-300 font-medium shadow-sm border border-fuchsia-500/30'
                 : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>
       <Badge variant="outline" className="text-slate-400 border-white/20">
        共 {displayTotal} 条
      </Badge>
    </div>
  );
};

export default WrongCategoryTabs;
