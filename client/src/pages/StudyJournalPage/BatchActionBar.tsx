import React from 'react';
import { Check, RotateCcw, Trash2, ListPlus } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  category: 'wrong' | 'unfamiliar' | 'mastered';
  onBatchMaster: () => void;
  onBatchUnfamiliar: () => void;
  onBatchAddPlan: () => void;
  onBatchDelete: () => void;
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  category,
  onBatchMaster,
  onBatchUnfamiliar,
  onBatchAddPlan,
  onBatchDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
     <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-card rounded-xl shadow-xl p-3 flex items-center gap-2">
       <span className="text-sm text-slate-300 px-2">已选 {selectedCount} 项</span>
      {category !== 'mastered' && (
        <button
          onClick={onBatchMaster}
           className="px-3 py-2 text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
        >
          <Check size={14} />
          标记已掌握
        </button>
      )}
      {category === 'mastered' && (
        <button
          onClick={onBatchUnfamiliar}
           className="px-3 py-2 text-sm bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/25 transition-colors flex items-center gap-1"
        >
          <RotateCcw size={14} />
          移出错题本
        </button>
      )}
      <button
        onClick={onBatchAddPlan}
         className="px-3 py-2 text-sm bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/25 transition-colors flex items-center gap-1"
      >
        <ListPlus size={14} />
        加入学习计划
      </button>
      <button
        onClick={onBatchDelete}
         className="px-3 py-2 text-sm bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded-lg hover:bg-pink-500/25 transition-colors flex items-center gap-1"
      >
        <Trash2 size={14} />
        删除
      </button>
    </div>
  );
};

export default BatchActionBar;
