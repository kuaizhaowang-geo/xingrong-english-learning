import React from 'react';
import {
  Users,
  Zap,
  Play,
  RefreshCw,
  Flame,
  Trophy,
  Crown,
  BarChart3,
  Hash,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import RoomCard from './RoomCard';
import type { PKRoom, PKStats } from '@shared/api.interface';

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
  for (let i = 0; i < TITLE_LEVELS.length; i++) {
    if (wins >= TITLE_LEVELS[i].min) {
      current = TITLE_LEVELS[i];
    }
  }
  return current;
};

interface LobbyViewProps {
  stats: PKStats | null;
  statsLoading: boolean;
  rooms: PKRoom[];
  roomsLoading: boolean;
  onlineCount: number;
  onQuickStart: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, hasPassword?: boolean) => void;
  onRefreshRooms: () => void;
  onJoinByCode: () => void;
  onViewRecords: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({
  stats,
  statsLoading,
  rooms,
  roomsLoading,
  onlineCount,
  onQuickStart,
  onCreateRoom,
  onJoinRoom,
  onRefreshRooms,
  onJoinByCode,
  onViewRecords,
}) => {
  const wins = stats?.wins ?? 0;
  const titleInfo = getTitleInfo(wins);

  return (
    <div className="space-y-6">
      {/* 个人数据卡 */}
      {statsLoading ? (
        <div className="rounded-2xl bg-gray-100 animate-pulse h-40" />
      ) : (
        <div className={`rounded-2xl bg-gradient-to-br ${titleInfo.color} p-6 text-white shadow-lg`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm opacity-80">我的段位</div>
                <div className="text-2xl font-bold">{stats?.currentTitle || titleInfo.name}</div>
              </div>
            </div>
            <button
              onClick={onViewRecords}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              战绩
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <div className="text-xs opacity-80">总场次</div>
              <div className="text-xl font-bold">{stats?.totalMatches ?? 0}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">胜场</div>
              <div className="text-xl font-bold">{stats?.wins ?? 0}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">胜率</div>
              <div className="text-xl font-bold">{stats?.winRate.toFixed(1) ?? 0}%</div>
            </div>
          </div>
        </div>
      )}

      {/* 快速开始大按钮 */}
      <button
        onClick={onQuickStart}
        className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center justify-center gap-4">
          <div className="relative">
            <Flame className="w-12 h-12 drop-shadow-lg animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-orange-300/50 -z-10" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-black drop-shadow-md">快速开始</div>
            <div className="text-sm opacity-90">随机匹配对手，即刻开战</div>
          </div>
          <Zap className="w-8 h-8 drop-shadow-md" />
        </div>
      </button>

       {/* 快捷操作 */}
       <div className="grid grid-cols-3 gap-3">
         <button
           onClick={onCreateRoom}
           className="glass-card rounded-xl p-4 border border-white/10 hover:shadow-md transition-all text-center"
         >
           <div className="w-10 h-10 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
             <Play className="w-5 h-5 text-orange-500" />
           </div>
           <div className="text-sm font-medium text-slate-200">创建房间</div>
         </button>
         <button
           onClick={onJoinByCode}
           className="glass-card rounded-xl p-4 border border-white/10 hover:shadow-md transition-all text-center"
         >
           <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
             <Hash className="w-5 h-5 text-blue-500" />
           </div>
           <div className="text-sm font-medium text-slate-200">输入房号</div>
         </button>
         <button
           onClick={onViewRecords}
           className="glass-card rounded-xl p-4 border border-white/10 hover:shadow-md transition-all text-center"
         >
           <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
             <Trophy className="w-5 h-5 text-purple-500" />
           </div>
           <div className="text-sm font-medium text-slate-200">我的战绩</div>
         </button>
       </div>

      {/* 在线人数条 */}
       <div className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/10">
         <div className="flex items-center gap-2 text-sm">
           <Users className="w-4 h-4 text-green-400" />
           <span className="text-slate-300">在线</span>
           <span className="font-bold text-green-400">{onlineCount}</span>
           <span className="text-slate-400">人</span>
         </div>
         <div className="h-4 w-px bg-white/10" />
         <div className="flex items-center gap-2 text-sm">
           <Zap className="w-4 h-4 text-orange-400" />
           <span className="text-slate-300">等待匹配</span>
           <span className="font-bold text-orange-400">{Math.floor(onlineCount / 3)}</span>
           <span className="text-slate-400">人</span>
         </div>
       </div>

      {/* 热门房间列表（横向滚动） */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            热门房间
          </h2>
          <button
            onClick={onRefreshRooms}
             className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>
        {roomsLoading ? (
           <div className="text-center py-10 text-slate-400 glass-card rounded-xl">
             加载中...
           </div>
        ) : rooms.length === 0 ? (
           <div className="text-center py-10 glass-card rounded-xl">
              <div className="text-slate-400 mb-3">暂无房间</div>
            <Button
              variant="default"
              onClick={onCreateRoom}
              className="bg-orange-500 border-orange-500"
            >
              创建第一个房间
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {rooms.slice(0, 10).map((room) => (
              <div key={room.id} className="flex-shrink-0">
                <RoomCard room={room} onJoin={onJoinRoom} compact />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 全部房间 */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-lg font-semibold text-white">全部房间</h2>
        </div>
        {roomsLoading ? (
            <div className="text-center py-8 text-slate-400">加载中...</div>
        ) : rooms.length === 0 ? (
            <div className="text-center py-8 glass-card rounded-xl text-slate-400">
             暂无房间
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyView;
