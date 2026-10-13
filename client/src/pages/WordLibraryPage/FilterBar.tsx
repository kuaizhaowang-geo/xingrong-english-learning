import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ListChecks, Clock, X } from 'lucide-react';

export type SortKey = 'order' | 'alpha_asc' | 'alpha_desc' | 'familiarity' | 'created';

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'order', label: '教材顺序' },
  { key: 'alpha_asc', label: '字母 A-Z' },
  { key: 'alpha_desc', label: '字母 Z-A' },
  { key: 'familiarity', label: '按熟练度' },
  { key: 'created', label: '添加时间' },
];

const SEARCH_HISTORY_KEY = 'word_search_history';
const MAX_HISTORY = 10;

function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: string[]): void {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // ignore
  }
}

// ===== 学段配置 =====
const SCHOOL_STAGES = [
  { key: 'primary', label: '小学' },
  { key: 'junior', label: '初中' },
  { key: 'senior', label: '高中' },
] as const;

export type SchoolStageKey = (typeof SCHOOL_STAGES)[number]['key'];

// ===== 教材版本配置 =====
const PUBLISHERS = [
  { key: 'pep', label: '人教版PEP', disabled: false },
  { key: 'renjiao_new', label: '人教版新目标', disabled: true },
  { key: 'waiyanshe', label: '外研社版', disabled: true },
] as const;

// ===== 词性筛选 =====
const PART_OF_SPEECH = [
  { key: 'all', label: '全部' },
  { key: 'noun', label: '名词' },
  { key: 'verb', label: '动词' },
  { key: 'adjective', label: '形容词' },
  { key: 'adverb', label: '副词' },
  { key: 'pronoun', label: '代词' },
  { key: 'preposition', label: '介词' },
  { key: 'conjunction', label: '连词' },
] as const;

// ===== 视图切换 =====
const VIEW_TABS = [
  { key: 'all', label: '全部单词' },
  { key: 'favorites', label: '我的珍藏' },
  { key: 'wrong', label: '错词本' },
  { key: 'mastered', label: '已掌握' },
] as const;

export type ViewTabKey = (typeof VIEW_TABS)[number]['key'];

// ===== 熟练度筛选 =====
const PROFICIENCY_FILTERS: { key: string; label: string; levels: number[] }[] = [
  { key: 'all', label: '全部', levels: [] },
  { key: 'unfamiliar', label: '陌生', levels: [0] },
  { key: 'learning', label: '熟悉中', levels: [1, 2] },
  { key: 'familiar', label: '熟悉', levels: [3] },
  { key: 'mastered', label: '掌握', levels: [4, 5] },
];

export { PROFICIENCY_FILTERS };

interface FilterBarProps {
  stage: SchoolStageKey;
  publisher: string;
  search: string;
  posFilter: string;
  viewTab: ViewTabKey;
  profFilter: string;
  sort: SortKey;
  selectMode: boolean;
  onStageChange: (s: SchoolStageKey) => void;
  onPublisherChange: (p: string) => void;
  onSearchChange: (v: string) => void;
  onSearchSubmit: (v: string) => void;
  onPosFilterChange: (v: string) => void;
  onViewTabChange: (v: ViewTabKey) => void;
  onProfFilterChange: (v: string) => void;
  onSortChange: (s: SortKey) => void;
  onToggleSelectMode: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  stage,
  publisher,
  search,
  posFilter,
  viewTab,
  profFilter,
  sort,
  selectMode,
  onStageChange,
  onPublisherChange,
  onSearchChange,
  onSearchSubmit,
  onPosFilterChange,
  onViewTabChange,
  onProfFilterChange,
  onSortChange,
  onToggleSelectMode,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadSearchHistory());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = (): void => {
    setHistory(loadSearchHistory());
    setShowHistory(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && search.trim()) {
      const trimmed = search.trim();
      const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
      setHistory(next);
      saveSearchHistory(next);
      setShowHistory(false);
      onSearchSubmit(trimmed);
    }
  };

  const handlePickHistory = (term: string): void => {
    onSearchChange(term);
    setShowHistory(false);
    onSearchSubmit(term);
  };

  const handleClearHistory = (): void => {
    setHistory([]);
    saveSearchHistory([]);
  };

  const handleRemoveHistoryItem = (term: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    const next = history.filter((h) => h !== term);
    setHistory(next);
    saveSearchHistory(next);
  };
   return (
     <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4
       bg-[#0F0D24]/80 backdrop-blur-md border-b border-fuchsia-500/15
       space-y-2 sm:space-y-3 mb-4 sm:mb-6">
       {/* 第一行：搜索框（移动端独占）*/}
       <div className="lg:hidden relative" ref={searchRef}>
         <Search
           size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
         />
         <input
           type="text"
           value={search}
           onChange={(e) => onSearchChange(e.target.value)}
           onFocus={handleSearchFocus}
           onKeyDown={handleSearchKeyDown}
           placeholder="搜索单词或中文释义..."
            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm
              bg-white/5 border border-white/10
              text-white placeholder:text-slate-500
              focus:outline-none focus:border-fuchsia-500/50
              focus:ring-2 focus:ring-fuchsia-500/20
              transition-all"
         />
       </div>

       {/* 第一行：学段 + 教材版本 + 搜索（桌面端）*/}
       <div className="hidden lg:flex items-center gap-4">
         {/* 学段选择 */}
         <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">学段</span>
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
             {SCHOOL_STAGES.map((s) => {
               const active = stage === s.key;
               return (
                 <button
                   key={s.key}
                   onClick={() => onStageChange(s.key)}
                   className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-8
                     ${active
                       ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                       : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
                 >
                   {s.label}
                 </button>
               );
             })}
           </div>
         </div>

         {/* 教材版本选择 */}
         <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">教材版本</span>
            <select
              value={publisher}
              onChange={(e) => {
                const val = e.target.value;
                const target = PUBLISHERS.find((p) => p.key === val);
                if (!target?.disabled) onPublisherChange(val);
              }}
              className="px-4 py-2 h-10 rounded-xl text-sm
                bg-white/5 border border-white/10 text-white
                focus:outline-none focus:border-fuchsia-500/50
                transition-colors cursor-pointer"
           >
             {PUBLISHERS.map((p) => (
               <option key={p.key} value={p.key} disabled={p.disabled}>
                 {p.label}{p.disabled ? '（即将上线）' : ''}
               </option>
             ))}
           </select>
         </div>

         <div className="relative flex-1 max-w-md ml-auto" ref={searchRef}>
           <Search
             size={16}
             className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
           />
           <input
             type="text"
             value={search}
             onChange={(e) => onSearchChange(e.target.value)}
             onFocus={handleSearchFocus}
             onKeyDown={handleSearchKeyDown}
             placeholder="搜索单词或中文释义..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm
                bg-white/5 border border-white/10
                text-white placeholder:text-slate-500
                focus:outline-none focus:border-fuchsia-500/50
                focus:ring-2 focus:ring-fuchsia-500/20
                transition-all"
           />
           {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30
                rounded-xl bg-[#1a1638]/95 backdrop-blur-md
                border border-fuchsia-500/20 shadow-lg shadow-black/40
                overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                   <Clock size={12} />
                   搜索历史
                 </span>
                 <button
                   onClick={handleClearHistory}
                    className="text-xs text-slate-400 hover:text-fuchsia-300 transition-colors"
                 >
                   清空
                 </button>
               </div>
               <div className="max-h-48 overflow-y-auto">
                 {history.map((term) => (
                   <button
                     key={term}
                     onClick={() => handlePickHistory(term)}
                      className="w-full flex items-center justify-between px-3 py-2
                        text-sm text-slate-300
                        hover:bg-fuchsia-500/10 hover:text-white
                        transition-colors"
                   >
                     <span className="truncate flex-1 text-left">{term}</span>
                     <X
                       size={14}
                        className="text-slate-500 hover:text-rose-300 ml-2"
                       onClick={(e) => handleRemoveHistoryItem(term, e)}
                     />
                   </button>
                 ))}
               </div>
             </div>
           )}
         </div>

         <div className="flex items-center gap-2">
           <select
             value={sort}
             onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="h-10 px-3 rounded-xl text-sm
                bg-white/5 border border-white/10 text-white
                focus:outline-none focus:border-fuchsia-500/50
                transition-colors cursor-pointer"
           >
             {SORT_OPTIONS.map((opt) => (
               <option key={opt.key} value={opt.key}>{opt.label}</option>
             ))}
           </select>
           <button
             onClick={onToggleSelectMode}
              className={`h-10 px-3 rounded-xl flex items-center gap-1.5 text-sm
                transition-all duration-200
                ${selectMode
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:border-fuchsia-500/40 hover:text-fuchsia-300'
                }`}
              aria-label={selectMode ? '退出多选' : '批量操作'}
           >
             <ListChecks size={16} />
             <span>{selectMode ? '退出多选' : '批量'}</span>
           </button>
         </div>
       </div>

       {/* 移动端：学段横向滚动 + 排序/批量 */}
       <div className="lg:hidden flex items-center gap-2">
          <div className="flex-1 flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto scrollbar-hide">
           {SCHOOL_STAGES.map((s) => {
             const active = stage === s.key;
             return (
               <button
                 key={s.key}
                 onClick={() => onStageChange(s.key)}
                 className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-9
                   ${active
                     ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                     : 'text-slate-400 hover:text-white hover:bg-white/5'
                   }`}
               >
                 {s.label}
               </button>
             );
           })}
         </div>
         <select
           value={sort}
           onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="h-11 px-2 rounded-xl text-xs
              bg-white/5 border border-white/10 text-white
              focus:outline-none focus:border-fuchsia-500/50
              transition-colors cursor-pointer flex-shrink-0"
         >
           {SORT_OPTIONS.slice(0, 3).map((opt) => (
             <option key={opt.key} value={opt.key}>{opt.label}</option>
           ))}
         </select>
         <button
           onClick={onToggleSelectMode}
             className={`h-11 px-3 rounded-xl flex items-center gap-1.5 text-sm flex-shrink-0
              transition-all duration-200
              ${selectMode
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                : 'bg-white/5 border border-white/10 text-slate-300'
              }`}
           aria-label={selectMode ? '退出多选' : '批量操作'}
         >
           <ListChecks size={18} />
         </button>
       </div>

       {/* 视图切换 */}
       <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
         {VIEW_TABS.map((tab) => {
           const active = viewTab === tab.key;
           return (
             <button
               key={tab.key}
               onClick={() => onViewTabChange(tab.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-10
                  transition-all duration-200
                  ${active
                    ? 'bg-fuchsia-500/20 text-fuchsia-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
             >
               {tab.label}
             </button>
           );
         })}
       </div>

       {/* 第三行：词性 + 熟练度筛选 */}
       <div className="flex flex-col gap-2 sm:gap-3">
         <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
            <Filter size={16} className="text-slate-400 flex-shrink-0" />
           {PART_OF_SPEECH.map((p) => {
             const active = posFilter === p.key;
             return (
               <button
                 key={p.key}
                 onClick={() => onPosFilterChange(p.key)}
                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium min-h-9
                    transition-all duration-200 border
                    ${active
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-fuchsia-500/30 hover:text-white'
                    }`}
               >
                 {p.label}
               </button>
             );
           })}
         </div>
         <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
            <span className="text-xs text-slate-400 flex-shrink-0">熟练度</span>
           {PROFICIENCY_FILTERS.map((p) => {
             const active = profFilter === p.key;
             return (
               <button
                 key={p.key}
                 onClick={() => onProfFilterChange(p.key)}
                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium min-h-9
                    transition-all duration-200 border
                    ${active
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:border-cyan-500/30 hover:text-white'
                    }`}
               >
                 {p.label}
               </button>
             );
           })}
         </div>
       </div>
     </div>
   );
};

export default FilterBar;
