import React from 'react';
import { Heart, Award, CalendarRange, X } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onBatchFavorite: () => void;
  onBatchMaster: () => void;
  onBatchAddPlan: () => void;
  onClearSelection: () => void;
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onBatchFavorite,
  onBatchMaster,
  onBatchAddPlan,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
       px-4 py-3 rounded-2xl
       glass-card
       shadow-xl shadow-black/30
       flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
         <span className="text-sm text-orange-400 font-medium">
           已选 <span className="text-white font-bold">{selectedCount}</span> 个
        </span>
      </div>

      <button
        onClick={onBatchFavorite}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
           bg-white/10 border border-rose-500/30 text-rose-400
           hover:bg-rose-500/20 hover:border-rose-500/40
           transition-all active:scale-95"
      >
        <Heart size={16} />
        <span>收藏</span>
      </button>

      <button
        onClick={onBatchMaster}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
           bg-white/10 border border-emerald-500/30 text-emerald-400
           hover:bg-emerald-500/20 hover:border-emerald-500/40
           transition-all active:scale-95"
      >
        <Award size={16} />
        <span>标记掌握</span>
      </button>

      <button
        onClick={onBatchAddPlan}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
           bg-white/10 border border-blue-500/30 text-blue-400
           hover:bg-blue-500/20 hover:border-blue-500/40
           transition-all active:scale-95"
      >
        <CalendarRange size={16} />
        <span>加入计划</span>
      </button>

      <button
        onClick={onClearSelection}
        className="p-2 rounded-xl text-slate-500
           hover:bg-white/10 hover:text-slate-300
           transition-colors"
        aria-label="取消选择"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default BatchActionBar;
