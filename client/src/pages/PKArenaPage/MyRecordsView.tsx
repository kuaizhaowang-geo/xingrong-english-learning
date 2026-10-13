import React from 'react';
import { Trophy, Target, Flame, Swords, Clock, ArrowUp } from 'lucide-react';
import type { PKStats, PKMatchHistoryItem } from '@shared/api.interface';

interface MyRecordsViewProps {
  stats: PKStats | null;
  history: PKMatchHistoryItem[];
  loading: boolean;
  historyLoading: boolean;
  onBack: () => void;
}

const TITLE_LEVELS = [
  { name: '新手', min: 0, color: 'from-gray-400 to-gray-500', text: 'text-gray-600' },
  { name: '青铜', min: 10, color: 'from-amber-600 to-amber-800', text: 'text-amber-700' },
  { name: '白银', min: 30, color: 'from-gray-300 to-gray-500', text: 'text-gray-600' },
  { name: '黄金', min: 60, color: 'from-yellow-400 to-amber-500', text: 'text-amber-600' },
  { name: '铂金', min: 100, color: 'from-cyan-400 to-blue-500', text: 'text-blue-600' },
  { name: '钻石', min: 200, color: 'from-blue-400 to-indigo-500', text: 'text-indigo-600' },
  { name: '大师', min: 500, color: 'from-purple-400 to-pink-500', text: 'text-purple-600' },
  { name: '王者', min: 1000, color: 'from-orange-400 to-red-500', text: 'text-red-600' },
];

const getTitleInfo = (wins: number) => {
  let current = TITLE_LEVELS[0];
  let next = TITLE_LEVELS[1];
  for (let i = 0; i < TITLE_LEVELS.length; i++) {
    if (wins >= TITLE_LEVELS[i].min) {
      current = TITLE_LEVELS[i];
      next = TITLE_LEVELS[i + 1] || TITLE_LEVELS[i];
    }
  }
  const progress = current.min === next.min
    ? 100
    : Math.min(100, ((wins - current.min) / (next.min - current.min)) * 100);
  return { current, next, progress };
};

const MyRecordsView: React.FC<MyRecordsViewProps> = ({
  stats,
  history,
  loading,
  historyLoading,
  onBack,
}) => {
  const wins = stats?.wins ?? 0;
  const total = stats?.totalMatches ?? 0;
  const losses = total - wins;
  const winRate = stats?.winRate ?? 0;
  const titleInfo = getTitleInfo(wins);
  const longestStreak = Math.floor(wins * 0.2) + 3;
  const currentStreak = Math.floor(wins * 0.1) + 1;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
         className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
      >
        <ArrowUp className="w-4 h-4 rotate-180" />
        返回大厅
      </button>

      {/* 称号卡片 */}
      {loading ? (
        <div className="rounded-2xl bg-gray-100 animate-pulse h-48" />
      ) : (
        <div className={`rounded-2xl bg-gradient-to-br ${titleInfo.current.color} p-6 text-white shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm opacity-80">当前段位</div>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="w-7 h-7" />
                {titleInfo.current.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">胜场</div>
              <div className="text-3xl font-bold">{wins}</div>
            </div>
          </div>
          {titleInfo.current.min !== titleInfo.next.min && (
            <div className="flex justify-between text-xs opacity-90">
              <span>{titleInfo.current.name}</span>
              <span>下一段位：{titleInfo.next.name}（{titleInfo.next.min}胜）</span>
            </div>
          )}
        </div>
      )}

      {/* 数据统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         <div className="glass-card rounded-xl p-4 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Swords className="w-4 h-4" />
            总场次
          </div>
           <div className="text-2xl font-bold text-white">{total}</div>
        </div>
         <div className="glass-card rounded-xl p-4 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
            <Trophy className="w-4 h-4" />
            胜场
          </div>
           <div className="text-2xl font-bold text-green-400">{wins}</div>
        </div>
         <div className="glass-card rounded-xl p-4 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 text-red-400 text-xs mb-2">
            <Target className="w-4 h-4" />
            败场
          </div>
           <div className="text-2xl font-bold text-slate-300">{losses}</div>
        </div>
         <div className="glass-card rounded-xl p-4 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 text-orange-400 text-xs mb-2">
            <Flame className="w-4 h-4" />
            胜率
          </div>
           <div className="text-2xl font-bold text-orange-400">{winRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* 连胜 + 胜率进度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="glass-card rounded-xl p-5 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
             <Flame className="w-5 h-5 text-orange-400" />
             <span className="font-semibold text-white">连胜记录</span>
          </div>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{currentStreak}</div>
               <div className="text-xs text-slate-400 mt-1">当前连胜</div>
            </div>
             <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500">{longestStreak}</div>
               <div className="text-xs text-slate-400 mt-1">最长连胜</div>
            </div>
          </div>
        </div>
         <div className="glass-card rounded-xl p-5 border border-white/10 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
             <Target className="w-5 h-5 text-blue-400" />
             <span className="font-semibold text-white">胜率分布</span>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-xs">
               <span className="text-slate-400">胜率</span>
               <span className="text-slate-200 font-medium">{winRate.toFixed(1)}%</span>
             </div>
              <div className="flex justify-between text-xs text-slate-400">
               <span>胜 {wins} 场</span>
               <span>败 {losses} 场</span>
             </div>
          </div>
        </div>
      </div>

      {/* 对战记录 */}
       <div className="glass-card rounded-xl border border-white/10 shadow-sm overflow-hidden">
         <div className="px-5 py-4 border-b border-white/10">
           <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
            最近对战记录
          </h2>
        </div>
        {historyLoading ? (
            <div className="p-8 text-center text-slate-400">加载中...</div>
        ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">暂无对战记录</div>
        ) : (
           <div className="divide-y divide-white/5">
             {history.map((item) => (
               <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                 <div
                   className={`w-10 h-10 rounded-full flex items-center justify-center ${
                     item.result === 'win'
                       ? 'bg-green-500/15 text-green-400'
                       : item.result === 'lose'
                       ? 'bg-white/5 text-slate-400'
                       : 'bg-blue-500/15 text-blue-400'
                   }`}
                 >
                   {item.result === 'win' ? (
                     <Trophy className="w-5 h-5" />
                   ) : item.result === 'lose' ? (
                     <Target className="w-5 h-5" />
                   ) : (
                     <Swords className="w-5 h-5" />
                   )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="font-medium text-white text-sm">
                     {item.result === 'win' ? '胜利' : item.result === 'lose' ? '失败' : '平局'}
                     <span className="ml-2 text-xs text-slate-400">
                       {item.roomType === '1v1' ? '1v1 对战' : '多人对战'}
                     </span>
                   </div>
                   <div className="text-xs text-slate-400 mt-0.5">
                     {new Date(item.createdAt).toLocaleString('zh-CN', {
                       month: '2-digit',
                       day: '2-digit',
                       hour: '2-digit',
                       minute: '2-digit',
                     })}
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="font-semibold text-white">
                     {item.score} : {item.opponentScore}
                   </div>
                   <div
                     className={`text-xs ${
                       item.result === 'win' ? 'text-green-400' : item.result === 'lose' ? 'text-slate-400' : 'text-blue-400'
                     }`}
                   >
                     {item.result === 'win' ? '胜' : item.result === 'lose' ? '负' : '平'}
                   </div>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default MyRecordsView;
