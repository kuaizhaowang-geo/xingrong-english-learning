import React from 'react';
import { Heart, Volume2, StickyNote, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import type { WordItem } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

export interface WordRecordLite {
  ebbinghausLevel: number;
  status: string;
  familiarity: number;
  wrongCount: number;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

interface WordCardGridProps {
  words: WordItem[];
  loading?: boolean;
  favorites: Set<string>;
  wordRecords: Map<string, WordRecordLite>;
  hasNotes?: Set<string>;
  selectMode?: boolean;
  selectedIds?: string[];
  searchQuery?: string;
  emptyText?: string;
  onToggleFavorite: (id: string) => void;
  onOpenDetail: (word: WordItem) => void;
  onToggleSelect?: (id: string) => void;
}

// 词性标签颜色映射（深色霓虹主题）
const POS_COLORS: Record<string, string> = {
  noun: 'bg-green-500/15 text-green-300 border-green-500/30',
  verb: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  adjective: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  adverb: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  pronoun: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  preposition: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  conjunction: 'bg-white/5 text-slate-400 border-white/10',
  article: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  numeral: 'bg-red-500/15 text-red-300 border-red-500/30',
  auxiliary: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const POS_LABELS: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  pronoun: '代词',
  preposition: '介词',
  conjunction: '连词',
  article: '冠词',
  numeral: '数词',
  auxiliary: '助动词',
};

function getPosColor(pos: string): string {
  return POS_COLORS[pos.toLowerCase()] || 'bg-white/5 text-slate-400 border-white/10';
}

function getPosLabel(pos: string): string {
  return POS_LABELS[pos.toLowerCase()] || pos;
}

const CARD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-400',
  'from-blue-400 to-cyan-400',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-fuchsia-400 to-pink-500',
];

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(lower);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const WordCardGrid: React.FC<WordCardGridProps> = ({
  words,
  loading,
  favorites,
  wordRecords,
  hasNotes,
  selectMode = false,
  selectedIds = [],
  searchQuery = '',
  emptyText = '暂无匹配的单词',
  onToggleFavorite,
  onOpenDetail,
  onToggleSelect,
}) => {
  if (loading) {
    return (
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
         {[0, 1, 2, 3, 4, 5, 6, 7].map((i: number) => (
           <div
             key={i}
             className="h-48 sm:h-56 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
           />
         ))}
       </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
         <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Volume2 size={32} className="opacity-50" />
        </div>
        <p className="text-base">{emptyText}</p>
         <p className="text-sm text-slate-500 mt-1">试试其他筛选条件</p>
      </div>
    );
  }

  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {words.map((word, idx: number) => {
        const isFav = favorites.has(word.id);
        const hasNote = hasNotes?.has(word.id);
        const isSelected = selectedIds.includes(word.id);
        const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
        const hasImage = word.imageUrl && word.imageUrl.length > 0;
        const firstLetter = word.word.charAt(0).toUpperCase();
        const record = wordRecords.get(word.id);
        return (
          <div
            key={word.id}
            onClick={() => onOpenDetail(word)}
              className="glass-card group relative rounded-2xl p-4 sm:p-5 cursor-pointer
               hover:border-fuchsia-500/40
               hover:-translate-y-0.5
               active:scale-[0.98]
               transition-all duration-200
               overflow-hidden"
          >
             {selectMode && (
               <button
                 onClick={(e: React.MouseEvent) => {
                   e.stopPropagation();
                   onToggleSelect?.(word.id);
                 }}
                 className="absolute top-3 left-3 z-20 p-2 rounded-md min-h-11 min-w-11 flex items-center justify-center
                    bg-white/10 backdrop-blur-sm border border-white/10
                    text-slate-400 hover:text-orange-400
                   transition-colors"
                 aria-label={isSelected ? '取消选择' : '选择'}
               >
                 {isSelected ? (
                    <CheckSquare size={20} className="text-orange-400 fill-orange-500/20" />
                 ) : (
                   <Square size={20} className="opacity-60" />
                 )}
               </button>
             )}

            {/* 学习状态角标 */}
            {record && record.status === 'learning' && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5
                px-2 py-0.5 rounded-full
                 bg-orange-500/15 border border-orange-500/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                 <span className="text-[10px] font-medium text-orange-300">学习中</span>
              </div>
            )}
            {record && record.status === 'mastered' && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1
                px-2 py-0.5 rounded-full
                 bg-emerald-500/15 border border-emerald-500/30">
                 <CheckCircle2 size={10} className="text-emerald-400" />
                 <span className="text-[10px] font-medium text-emerald-300">已掌握</span>
              </div>
            )}
            {!record && (
              <div className="absolute top-3 right-3 z-10">
                 <div className="w-2 h-2 rounded-full bg-white/20" />
              </div>
            )}



            <div className="relative flex justify-center mb-4">
               {hasImage ? (
                 <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden
                    border-2 border-white/30 shadow-md
                   flex items-center justify-center
                   group-hover:scale-110 transition-transform duration-200">
                   <Image
                     src={word.imageUrl!}
                     alt={word.word}
                     className="w-full h-full object-cover"
                   />
                 </div>
               ) : (
                 <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full
                   bg-gradient-to-br ${gradient}
                   border border-white/20
                   flex items-center justify-center
                   group-hover:scale-110 transition-transform duration-300
                   shadow-lg`}>
                   <span className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                     {firstLetter}
                   </span>
                 </div>
               )}
            </div>

              <h3 className="text-xl sm:text-lg font-bold text-white text-center mb-1
                group-hover:text-fuchsia-300
                transition-colors">
               {highlightText(word.word, searchQuery)}
             </h3>

            {/* 音标 */}
             <p className="text-sm sm:text-xs text-fuchsia-400/90 text-center mb-2 sm:mb-3">
               {word.phonetic || '/—/'}
             </p>

            {/* 词性标签 */}
            {word.partOfSpeech && (
              <div className="flex justify-center mb-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getPosColor(word.partOfSpeech)}`}>
                  {getPosLabel(word.partOfSpeech)}
                </span>
              </div>
            )}

              <p className="text-sm text-slate-300 text-center line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem]">
              {highlightText(word.meaning, searchQuery)}
            </p>

            <div className="flex justify-center gap-2">
               <button
                 onClick={(e: React.MouseEvent) => {
                   e.stopPropagation();
                   onToggleFavorite(word.id);
                 }}
                 className={`p-2.5 rounded-full transition-all duration-200 min-h-11 min-w-11 flex items-center justify-center
                    ${isFav
                      ? 'bg-rose-500/20 text-rose-300 scale-110'
                      : 'bg-white/5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300'
                    }
                   hover:scale-110 active:scale-95`}
                 aria-label={isFav ? '取消收藏' : '收藏'}
               >
                 <Heart
                   size={20}
                   className={isFav ? 'fill-rose-400 animate-pulse' : ''}
                 />
               </button>
               {hasNote && (
                  <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-300 scale-110 min-h-11 min-w-11 flex items-center justify-center">
                   <StickyNote size={20} />
                 </div>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCardGrid;
