import React from 'react';
import { Crown, Trophy } from 'lucide-react';
import type { PKStats } from '@shared/api.interface';

const StatsCard: React.FC<{ stats: PKStats | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-24 bg-white/20 rounded" />
          <div className="h-8 w-40 bg-white/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm opacity-90 mb-1">当前称号</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Crown size={24} />
            {stats.currentTitle}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm opacity-90 mb-1">总场次</div>
          <div className="text-2xl font-bold">{stats.totalMatches}</div>
        </div>
      </div>
      <div className="flex gap-8 mt-4 pt-4 border-t border-white/20">
        <div>
          <div className="text-xs opacity-80">胜场</div>
          <div className="text-lg font-semibold">{stats.wins}</div>
        </div>
        <div>
          <div className="text-xs opacity-80">胜率</div>
          <div className="text-lg font-semibold">{stats.winRate}%</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
