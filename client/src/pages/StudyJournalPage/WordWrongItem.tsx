import React from 'react';
import { Check, RotateCcw, Trash2, Volume2 } from 'lucide-react';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Badge } from '@client/src/components/ui/badge';
import type { WrongWordItem } from '@shared/api.interface';

interface WordWrongItemProps {
  item: WrongWordItem;
  selected: boolean;
  showWrongBadge: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, status: 'mastered' | 'unfamiliar') => void;
  onDelete: (id: string) => void;
  isMastered: boolean;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '未知';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const WordWrongItem: React.FC<WordWrongItemProps> = ({
  item,
  selected,
  showWrongBadge,
  onToggleSelect,
  onStatusChange,
  onDelete,
  isMastered,
}) => {
  return (
    <div
       className={`rounded-xl border p-5 transition-all glass-card ${
         selected ? 'border-fuchsia-400/50 bg-fuchsia-500/10' : 'hover:border-fuchsia-500/30'
       }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          aria-label="选择单词"
          onCheckedChange={() => onToggleSelect(item.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-lg font-semibold text-white">
              {item.word?.word || '加载中...'}
            </h3>
             <button className="text-slate-400 hover:text-cyan-400 transition-colors">
              <Volume2 className="w-4 h-4" />
            </button>
             {showWrongBadge && (
               <Badge className="text-xs bg-pink-500/15 text-pink-400 border-pink-500/30">错题</Badge>
             )}
          </div>
          {item.word?.phonetic && (
            <p className="text-xs text-fuchsia-400/90 mb-2">/{item.word.phonetic}/</p>
          )}
           <p className="text-sm text-slate-300 mb-3 line-clamp-2">{item.word?.meaning || ''}</p>
          <div className="flex items-center justify-between">
             <span className="text-xs text-slate-400">
              {formatDate(item.lastReviewedAt)}
            </span>
            <Badge variant="outline" className="text-xs">
              熟悉度 {item.familiarity}%
            </Badge>
          </div>
           <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            {!isMastered ? (
               <button
                 onClick={() => onStatusChange(item.id, 'mastered')}
                 className="flex-1 px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                已掌握
              </button>
            ) : (
               <button
                 onClick={() => onStatusChange(item.id, 'unfamiliar')}
                 className="flex-1 px-3 py-1.5 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                不熟悉
              </button>
            )}
            <button
              onClick={() => onDelete(item.id)}
               className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordWrongItem;
