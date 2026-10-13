import React from 'react';
import { Trash2, RotateCcw, Volume2, Clock } from 'lucide-react';
import { Checkbox } from '@client/src/components/ui/checkbox';
import type { WrongWordItem, WrongSentenceItem } from '@shared/api.interface';

type JournalItem =
  | { type: 'word'; data: WrongWordItem }
  | { type: 'sentence'; data: WrongSentenceItem };

interface JournalItemCardProps {
  item: JournalItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onReview: (id: string) => void;
  onDelete: (id: string) => void;
  errorType: string;
  errorColor: string;
}

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return '未知';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const JournalItemCard: React.FC<JournalItemCardProps> = ({
  item,
  selected,
  onToggleSelect,
  onReview,
  onDelete,
  errorType,
  errorColor,
}) => {
  const id = item.data.id;

  return (
    <div
      className={`group relative rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
         selected
           ? 'bg-fuchsia-500/15 border-fuchsia-400/50 shadow-lg shadow-fuchsia-500/20'
           : 'bg-white/5 border-white/10 hover:border-fuchsia-500/40 hover:shadow-lg hover:shadow-fuchsia-500/10'
      }`}
    >
      {/* Neon glow effect on hover */}
       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-fuchsia-500/10 group-hover:via-fuchsia-500/5 group-hover:to-cyan-500/10 transition-all duration-500 pointer-events-none" />

      <div className="relative flex items-start gap-4">
        <Checkbox
          checked={selected}
          aria-label="选择项目"
          onCheckedChange={() => onToggleSelect(id)}
           className="mt-1 data-[state=checked]:bg-fuchsia-500 data-[state=checked]:border-fuchsia-500"
        />

        <div className="flex-1 min-w-0">
          {/* Word type */}
          {item.type === 'word' && (
            <>
              <div className="flex items-center gap-2 mb-1">
                 <h3 className="text-lg font-semibold text-white">
                  {item.data.word?.word || '加载中...'}
                </h3>
                <button className="text-slate-500 hover:text-cyan-400 transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              {item.data.word?.phonetic && (
                 <p className="text-xs text-fuchsia-400 mb-2">
                  /{item.data.word.phonetic}/
                </p>
              )}
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                {item.data.word?.meaning || ''}
              </p>
              <div className="flex items-center gap-3">
                 <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(item.data.lastReviewedAt)}
                </span>
                 <span className="text-xs text-slate-400">
                  熟悉度 {item.data.familiarity}%
                </span>
              </div>
            </>
          )}

          {/* Sentence type */}
          {item.type === 'sentence' && (
            <>
               <p className="text-base font-medium text-white mb-1">
                {item.data.sentence?.sentence || '加载中...'}
              </p>
              <p className="text-sm text-slate-400 mb-3">
                {item.data.sentence?.translation || ''}
              </p>
               <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  尝试 {item.data.attempts} 次
                </span>
              </div>
            </>
          )}

          {/* Error type badge */}
           <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${errorColor}`}
            >
              {errorType}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onReview(id)}
                 className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:from-fuchsia-400 hover:to-cyan-400 transition-all shadow-md shadow-fuchsia-500/20 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                复习
              </button>
              <button
                onClick={() => onDelete(id)}
                 className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalItemCard;
export type { JournalItem };
