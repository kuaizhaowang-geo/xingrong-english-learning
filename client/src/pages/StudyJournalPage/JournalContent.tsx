import React, { useMemo, useState } from 'react';
import { Search, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Checkbox } from '@client/src/components/ui/checkbox';
import type { JournalCategory } from './JournalSidebar';
import JournalItemCard from './JournalItemCard';
import type { JournalItem } from './JournalItemCard';
import JournalEmptyState from './JournalEmptyState';

interface JournalContentProps {
  category: JournalCategory;
  items: JournalItem[];
  loading: boolean;
  counts: Record<JournalCategory, number>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onBatchDelete: () => void;
  onBatchMaster: () => void;
  onReview: (id: string) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

const categoryLabelMap: Record<JournalCategory, { label: string; errorType: string; errorColor: string }> = {
  'wrong-words': { label: '错词', errorType: '拼写错误', errorColor: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  'wrong-sentences': { label: '错句', errorType: '语法错误', errorColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  pronunciation: { label: '发音', errorType: '发音问题', errorColor: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  'new-words': { label: '生词', errorType: '不熟悉', errorColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  'hard-sentences': { label: '难句', errorType: '复杂长难句', errorColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  favorites: { label: '收藏', errorType: '已收藏', errorColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
};

const statConfig: Array<{ key: JournalCategory; label: string; gradient: string }> = [
  { key: 'wrong-words', label: '错词', gradient: 'from-red-500/20 to-red-600/10 border-red-500/30' },
  { key: 'wrong-sentences', label: '错句', gradient: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
  { key: 'pronunciation', label: '发音', gradient: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' },
  { key: 'new-words', label: '生词', gradient: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
  { key: 'hard-sentences', label: '难句', gradient: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
  { key: 'favorites', label: '收藏', gradient: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
];

const PAGE_SIZE = 8;

const JournalContent: React.FC<JournalContentProps> = ({
  category,
  items,
  loading,
  counts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBatchDelete,
  onBatchMaster,
  onReview,
  onDelete,
  searchQuery,
  onSearchChange,
}) => {
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => {
      if (item.type === 'word') {
        return (
          item.data.word?.word?.toLowerCase().includes(q) ||
          item.data.word?.meaning?.includes(q)
        );
      }
      return (
        item.data.sentence?.sentence?.toLowerCase().includes(q) ||
        item.data.sentence?.translation?.includes(q)
      );
    });
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const allSelected =
    filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const catInfo = categoryLabelMap[category];

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            学习手账
            <span className="text-sm font-normal text-slate-500">
              / {catInfo.label}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            记录每一次进步，错题本帮你查漏补缺
          </p>
        </div>
      </div>

      {/* Stats overview - 6 number cards */}
      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-3"
        data-ai-section-type="card-stat"
      >
        {statConfig.map((stat) => (
          <div
            key={stat.key}
            className={`rounded-xl p-3 border bg-gradient-to-br ${stat.gradient} transition-all cursor-pointer hover:scale-105 ${
              category === stat.key
                ? 'ring-2 ring-purple-400/50 ring-offset-1 ring-offset-transparent'
                : ''
            }`}
          >
            <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
            <div className="text-xl font-bold text-white">
              {counts[stat.key]}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: search + batch */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="搜索内容..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onSearchChange(e.target.value);
              setPage(1);
            }}
             className="pl-9 h-10 glass-card text-white placeholder:text-slate-500 focus:border-fuchsia-400/50 focus-visible:ring-fuchsia-500/30"
          />
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card">
            <Checkbox
              checked={allSelected}
              aria-label="全选"
              onCheckedChange={onToggleSelectAll}
              className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
            />
            <span className="text-xs text-slate-400">
              {selectedIds.size > 0 ? `已选 ${selectedIds.size} 条` : '全选'}
            </span>
          </div>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={onBatchMaster}
                className="px-3 py-2 text-xs bg-gradient-to-r from-emerald-500/80 to-teal-500/80 text-white rounded-lg hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1 shadow-md shadow-emerald-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                标记已掌握
              </button>
              <button
                onClick={onBatchDelete}
                className="px-3 py-2 text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* List area */}
      <div className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i: number) => (
               <div
                 key={i}
                 className="glass-card rounded-xl p-5 animate-pulse"
               >
                 <div className="bg-fuchsia-500/20 h-5 rounded w-1/2 mb-2" />
                 <div className="bg-fuchsia-500/20 h-4 rounded w-2/3 mb-3" />
                 <div className="bg-fuchsia-500/20 h-3 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <JournalEmptyState category={category} />
        ) : (
          <div className="space-y-3" data-ai-section-type="card-list">
            {paginatedItems.map((item) => (
              <JournalItemCard
                key={item.data.id}
                item={item}
                selected={selectedIds.has(item.data.id)}
                onToggleSelect={onToggleSelect}
                onReview={onReview}
                onDelete={onDelete}
                errorType={catInfo.errorType}
                errorColor={catInfo.errorColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredItems.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-[32px] h-8 px-2 text-sm rounded-lg transition-all ${
                p === currentPage
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JournalContent;
