import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, ChevronRight, Crown, Medal, Clock, User, Gift } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { rankingApi } from '@client/src/api';
import type { RankItem } from '@shared/api.interface';

interface RankingUser {
  userId: string;
  userName: string;
  avatar: string;
  studyMinutes: number;
  rank?: number;
  hasFreeCard?: boolean;
}

function formatStudyTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分钟`;
}

interface HomeRankingsProps {
  onViewAll: () => void;
}

const FreeCardBadge: React.FC = () => (
  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
    <Gift size={9} />
    免费学习卡
  </span>
);

// 前三名领奖台样式
const PodiumItem: React.FC<{
  user: RankingUser | undefined;
  position: number;
  positionText: string;
}> = ({ user, position, positionText }) => {
  const colorMap: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'linear-gradient(135deg, #FCD34D, #F59E0B)', border: 'rgba(251, 191, 36, 0.5)', text: '#FCD34D' },
    2: { bg: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', border: 'rgba(229, 231, 235, 0.4)', text: '#E5E7EB' },
    3: { bg: 'linear-gradient(135deg, #FBBF24, #D97706)', border: 'rgba(251, 191, 36, 0.4)', text: '#FBBF24' },
  };
  const colors = colorMap[position];
  const heightClass = position === 1 ? 'h-20' : position === 2 ? 'h-16' : 'h-12';

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="relative mb-2">
        {position === 1 && (
          <Crown
            size={20}
            className="absolute -top-5 left-1/2 -translate-x-1/2"
            style={{ color: '#F59E0B' }}
          />
        )}
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg font-bold text-white border-3"
          style={{
            background: colors.bg,
            borderColor: colors.border,
            borderWidth: 3,
          }}
        >
          {user?.avatar || '?'}
        </div>
        <div
          className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
          style={{ background: colors.bg }}
        >
          {positionText}
        </div>
      </div>
      <div className="text-xs font-medium text-white mb-0.5 text-center truncate w-full max-w-[70px]">
        {user?.userName || '虚位以待'}
      </div>
      {user?.hasFreeCard && (
        <div className="mb-1">
          <FreeCardBadge />
        </div>
      )}
      <div className="text-[11px] text-slate-400 flex items-center gap-0.5">
        <Clock size={10} />
        {formatStudyTime(user?.studyMinutes || 0)}
      </div>
      <div
        className={`mt-2 w-full ${heightClass} rounded-t-lg flex items-center justify-center`}
        style={{
          background: position === 1
            ? 'linear-gradient(180deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.1) 100%)'
            : position === 2
              ? 'linear-gradient(180deg, rgba(229, 231, 235, 0.25) 0%, rgba(229, 231, 235, 0.08) 100%)'
              : 'linear-gradient(180deg, rgba(251, 146, 60, 0.25) 0%, rgba(251, 146, 60, 0.08) 100%)',
          border: `1px solid ${colors.border}`,
          borderBottom: 'none',
        }}
      >
        <Medal size={16} style={{ color: colors.text }} />
      </div>
    </div>
  );
};

const HomeRankings: React.FC<HomeRankingsProps> = ({ onViewAll }) => {
  const [rankedList, setRankedList] = useState<RankingUser[]>([]);
  const [myRank, setMyRank] = useState<number>(0);
  const [myMinutes, setMyMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await rankingApi.getRanking({
          type: 'studyTime',
          period: 'weekly',
        });
        const items = res.items || [];
        const list: RankingUser[] = items.slice(0, 50).map((item: RankItem) => ({
          userId: item.userId,
          userName: item.userName,
          avatar: item.userName ? item.userName.charAt(0) : '?',
          studyMinutes: item.studyMinutes,
          rank: item.rank,
        }));
        setRankedList(list);

        if (res.myRank) {
          setMyRank(res.myRank.rank);
          setMyMinutes(res.myRank.studyMinutes);
        } else {
          setMyRank(0);
          setMyMinutes(0);
        }
        setApiError(false);
      } catch (err) {
        logger.warn('首页排行榜API调用失败', err as Error);
        setApiError(true);
        setRankedList([]);
        setMyRank(0);
        setMyMinutes(0);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const top3 = rankedList.slice(0, 3);
  const restList = rankedList.slice(3, 10);
  const isCurrentUserInTop50 = myRank > 0 && myRank <= 50;

  const currentUserDisplay: RankingUser = {
    userId: 'me',
    userName: '我',
    avatar: '我',
    studyMinutes: myMinutes,
    rank: myRank,
  };

  if (loading) {
    return (
      <section className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="sm:w-5 sm:h-5" style={{ color: '#F59E0B' }} />
            <h2 className="text-base font-semibold text-white">今日荣耀榜</h2>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-0.5 min-h-[44px] min-w-[44px] px-2"
          >
            查看全部 <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex items-end justify-center gap-2 sm:gap-3 mb-4 sm:mb-5 px-2 h-40">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 max-w-[80px] animate-pulse bg-white/10 rounded-xl"
              style={{ height: i === 1 ? '140px' : '100px' }}
            />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-10 rounded-lg bg-white/10"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (apiError || rankedList.length === 0) {
    return (
      <section className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="sm:w-5 sm:h-5" style={{ color: '#F59E0B' }} />
            <h2 className="text-base font-semibold text-white">今日荣耀榜</h2>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-0.5 min-h-[44px] min-w-[44px] px-2"
          >
            查看全部 <ChevronRight size={12} />
          </button>
        </div>
        <div className="py-12 text-center">
          <Trophy size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-400">暂无排行数据</p>
          <p className="text-xs text-slate-500 mt-1">快去学习，争取上榜吧～</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 border border-gray-100">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="sm:w-5 sm:h-5" style={{ color: '#F59E0B' }} />
          <h2 className="text-base font-semibold text-gray-800">今日荣耀榜</h2>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 min-h-[44px] min-w-[44px] px-2"
        >
          查看全部 <ChevronRight size={12} />
        </button>
      </div>

      {/* 前三名 领奖台 */}
      <div className="flex items-end justify-center gap-2 sm:gap-3 mb-4 sm:mb-5 px-2">
        {/* 第2名 */}
        <PodiumItem user={top3[1]} position={2} positionText="2" />
        {/* 第1名 */}
        <PodiumItem user={top3[0]} position={1} positionText="1" />
        {/* 第3名 */}
        <PodiumItem user={top3[2]} position={3} positionText="3" />
      </div>

      {/* 4-10名 列表 */}
      <div className="space-y-1 max-h-80 overflow-y-auto pr-1 -mr-1">
        {restList.map((user, idx) => {
          const isCurrent = user.userId === 'me';
          return (
            <div
              key={user.userId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isCurrent
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {user.rank ?? idx + 4}
              </div>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  isCurrent
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {isCurrent ? <User size={12} /> : user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div
                    className={`text-sm truncate ${
                      isCurrent ? 'font-semibold text-white' : 'text-slate-200'
                    }`}
                  >
                    {user.userName}
                    {isCurrent && (
                      <span className="ml-1 text-xs text-fuchsia-400">(我)</span>
                    )}
                  </div>
                  {user.hasFreeCard && <FreeCardBadge />}
                </div>
              </div>
              <div
                className={`text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                  isCurrent ? 'text-fuchsia-400' : 'text-slate-400'
                }`}
              >
                <Clock size={11} />
                {formatStudyTime(user.studyMinutes)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 当前用户排名（不在前50时显示在底部） */}
      {!isCurrentUserInTop50 && myRank > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
            <div className="w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {myRank}
            </div>
            <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm flex-shrink-0">
              <User size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">我的排名</div>
              <div className="text-xs text-slate-400">继续加油，冲击榜单！</div>
            </div>
            <div className="text-sm font-bold text-fuchsia-400">
              第 {myRank} 名
            </div>
          </div>
        </div>
      )}

      {/* 未登录或无我的排名时的激励 */}
      {myRank === 0 && rankedList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
            <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm flex-shrink-0">
              <User size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">登录后查看我的排名</div>
              <div className="text-xs text-slate-400">完成学习，争取上榜！</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeRankings;
