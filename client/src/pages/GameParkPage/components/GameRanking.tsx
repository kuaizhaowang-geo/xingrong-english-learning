import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getGameRanking } from '@client/src/api/games';
import type { GameType, GameRankingItem } from '@shared/api.interface';

const GAME_TABS: Array<{ value: GameType; label: string; icon: string; color: string }> = [
  { value: 'whack_mole', label: '单词打地鼠', icon: '🐹', color: 'yellow' },
  { value: 'word_match', label: '单词消消乐', icon: '🃏', color: 'pink' },
  { value: 'word_runner', label: '单词跑酷', icon: '🏃', color: 'cyan' },
  { value: 'word_tetris', label: '单词方块', icon: '🧱', color: 'violet' },
  { value: 'word_shooting', label: '听力射击', icon: '🎯', color: 'rose' },
  { value: 'math_battle', label: '口算比拼', icon: '🧮', color: 'blue' },
  { value: 'word_pk', label: '单词PK', icon: '📝', color: 'orange' },
  { value: 'poetry_chain', label: '古诗接龙', icon: '🏮', color: 'red' },
];

const GameRanking: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>('whack_mole');
  const [ranking, setRanking] = useState<GameRankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await getGameRanking({ gameType: activeGame, limit: 10 });
        if (!cancelled) {
          setRanking(data.items);
        }
      } catch (err) {
        logger.error('加载排行榜失败', err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeGame]);

  const getColorClasses = (color: string): {
    bg: string;
    text: string;
    border: string;
    gradient: string;
  } => {
    const map: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
       blue: {
         bg: 'bg-blue-500/10',
         text: 'text-blue-400',
         border: 'border-blue-500/20',
         gradient: 'from-blue-400 to-indigo-500',
       },
       orange: {
         bg: 'bg-orange-500/10',
         text: 'text-orange-400',
         border: 'border-orange-500/20',
         gradient: 'from-orange-400 to-red-500',
       },
       red: {
         bg: 'bg-red-500/10',
         text: 'text-red-400',
         border: 'border-red-500/20',
         gradient: 'from-red-400 to-pink-500',
       },
    };
    return map[color] ?? map.blue;
  };

  const getRankBadge = (rank: number): React.ReactNode => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md">
          <Crown size={20} className="text-white" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center shadow-md">
          <Medal size={20} className="text-white" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
          <Medal size={20} className="text-white" />
        </div>
      );
    }
    return (
       <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 font-bold border border-white/10">
        {rank}
      </div>
    );
  };

  const activeTab = GAME_TABS.find((t) => t.value === activeGame)!;
  const colors = getColorClasses(activeTab.color);

  return (
    <div className="space-y-4">
      {/* 游戏类型 Tab */}
      <div className="flex gap-2">
        {GAME_TABS.map((tab) => {
          const isActive = activeGame === tab.value;
          const tabColors = getColorClasses(tab.color);
          return (
            <button
              key={tab.value}
              onClick={() => setActiveGame(tab.value)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? `bg-gradient-to-r ${tabColors.gradient} text-white shadow-md`
                   : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 前三名 特殊展示 */}
      {!loading && ranking.length >= 3 && (
        <div className={`${colors.bg} rounded-xl p-4`}>
          <div className="flex items-end justify-center gap-4 mb-2">
            {/* 第二名 */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center text-2xl mb-2 shadow-md">
                🥈
              </div>
               <div className="text-sm font-bold text-slate-200 truncate">
                 {ranking[1]?.userName || `玩家${ranking[1]?.userId.slice(-4)}`}
               </div>
               <div className="text-lg font-bold text-slate-300">
                {ranking[1]?.score}
              </div>
              <div className="text-xs text-gray-400">分</div>
            </div>

            {/* 第一名 */}
            <div className="text-center flex-1 -mt-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center text-3xl mb-2 shadow-lg">
                👑
              </div>
              <div className="text-sm font-bold text-yellow-700 truncate">
                {ranking[0]?.userName || `玩家${ranking[0]?.userId.slice(-4)}`}
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {ranking[0]?.score}
              </div>
              <div className="text-xs text-yellow-500">分</div>
            </div>

            {/* 第三名 */}
            <div className="text-center flex-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl mb-2 shadow-md">
                🥉
              </div>
               <div className="text-sm font-bold text-slate-200 truncate">
                 {ranking[2]?.userName || `玩家${ranking[2]?.userId.slice(-4)}`}
               </div>
              <div className="text-lg font-bold text-amber-600">
                {ranking[2]?.score}
              </div>
              <div className="text-xs text-gray-400">分</div>
            </div>
          </div>
        </div>
      )}

      {/* 加载 */}
      {loading && (
         <div className="text-center py-8 text-slate-500 text-sm">加载中...</div>
      )}

      {/* 排行榜列表 */}
      {!loading && ranking.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🏆</div>
           <div className="text-slate-400 text-sm">暂无排行数据</div>
           <div className="text-slate-500 text-xs mt-1">成为第一个上榜的人吧！</div>
        </div>
      )}

      {!loading && ranking.length > 0 && (
        <div className="space-y-2">
          {ranking.map((item: GameRankingItem, idx: number) => {
            if (idx < 3) return null; // 前三名已在上面展示
            const accuracy = item.totalQuestions > 0
              ? Math.round((item.correctCount / item.totalQuestions) * 100)
              : 0;
            return (
              <div
                key={item.userId}
                 className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                {getRankBadge(item.rank)}
                <div className="flex-1 min-w-0">
                   <div className="font-semibold text-white truncate">
                    {item.userName || `玩家${item.userId.slice(-4)}`}
                  </div>
                   <div className="text-xs text-slate-500">
                    正确率 {accuracy}%
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${colors.text}`}>
                    {item.score}
                  </div>
                  <div className="text-xs text-slate-500">分</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 我的排名（占位，实际需后端返回） */}
      {!loading && ranking.length > 0 && (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center text-white font-bold`}>
            我
          </div>
          <div className="flex-1">
            <div className={`font-bold ${colors.text}`}>我的排名</div>
             <div className="text-xs text-slate-400">挑战更多，提升排名！</div>
          </div>
          <Trophy size={20} className={colors.text} />
        </div>
      )}
    </div>
  );
};

export default GameRanking;
