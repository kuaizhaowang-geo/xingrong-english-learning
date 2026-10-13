import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import type { TextbookTreeItem } from '@shared/api.interface';

interface WordBookListProps {
  textbooks: TextbookTreeItem[];
  selectedId: string | null;
  onSelect: (tb: TextbookTreeItem) => void;
  loading?: boolean;
}

const WordBookList: React.FC<WordBookListProps> = ({
  textbooks,
  selectedId,
  onSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i: number) => (
          <div
            key={i}
            className="h-14 rounded-lg bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (textbooks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无词表</p>
      </div>
    );
  }

  return (
     <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-2
       scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
       glass-card rounded-xl overflow-hidden">
      {textbooks.map((tb) => {
        const isActive = selectedId === tb.id;
        const wordCount = tb.units
          ? tb.units.reduce((sum: number, u) => sum + (u.keyWords?.length || 0), 0)
          : 0;
        return (
          <button
            key={tb.id}
            onClick={() => onSelect(tb)}
             className={`w-full text-left px-4 py-3 min-h-12 transition-all duration-200
               group relative
               ${isActive
                 ? 'bg-orange-50 border-l-2 border-[#FF6B35]'
                 : 'border-l-2 border-transparent hover:bg-gray-50'
               }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                ${isActive
                  ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                  : 'bg-gray-100 text-gray-400 group-hover:text-[#FF6B35] group-hover:bg-orange-50'
                }`}>
                <BookOpen size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate
                  ${isActive ? 'text-[#FF6B35]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                  {tb.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles size={10} className={isActive ? 'text-orange-400' : 'text-gray-300'} />
                  <span className={`text-xs ${isActive ? 'text-orange-400' : 'text-gray-400'}`}>
                    {wordCount > 0 ? `${wordCount} 个单词` : `${tb.totalUnits || 0} 单元`}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default WordBookList;
