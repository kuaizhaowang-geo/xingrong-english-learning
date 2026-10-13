import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { creatorApi } from '@client/src/api';
import type { CreatorRankItem } from '@shared/api.interface';

type RankPeriod = 'all' | 'week' | 'month';

const PERIOD_TABS: { value: RankPeriod; label: string }[] = [
  { value: 'all', label: '总榜' },
  { value: 'week', label: '周榜' },
  { value: 'month', label: '月榜' },
];

const MEDAL_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'linear-gradient(135deg, #FBBF24, #F59E0B)', border: '#FBBF24', text: '#FEF3C7' },
  2: { bg: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', border: '#D1D5DB', text: '#F3F4F6' },
  3: { bg: 'linear-gradient(135deg, #D97706, #92400E)', border: '#D97706', text: '#FEF3C7' },
};

const RankingTab: React.FC = () => {
  const [period, setPeriod] = useState<RankPeriod>('all');
  const [items, setItems] = useState<CreatorRankItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRanking = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await creatorApi.getCreatorRanking({ period });
      setItems(res.items);
    } catch (err) {
      logger.debug('加载创作者排行榜失败', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
  }, [period]);

  const getRankIcon = (rank: number): React.ReactNode => {
    if (rank === 1) return <Crown className="w-5 h-5" style={{ color: '#FBBF24' }} />;
    if (rank <= 3) return <Medal className="w-5 h-5" style={{ color: MEDAL_COLORS[rank].text }} />;
    return <span className="text-sm font-bold" style={{ color: '#94A3B8' }}>#{rank}</span>;
  };

  return (
    <div>
      {/* 周期切换 */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ background: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      >
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setPeriod(tab.value)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: period === tab.value
                ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                : 'transparent',
              color: period === tab.value ? 'white' : '#94A3B8',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 前三名展示 */}
      {!loading && items.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-8 px-4">
          {/* 第二名 */}
          <div className="flex-1 max-w-[140px] flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-2 relative"
              style={{
                background: MEDAL_COLORS[2].bg,
                boxShadow: `0 0 20px ${MEDAL_COLORS[2].border}66`,
              }}
            >
              <User className="w-7 h-7 text-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: MEDAL_COLORS[2].bg, color: 'white' }}
              >
                2
              </div>
            </div>
            <div className="text-sm font-medium text-white text-center truncate w-full">
              {items[1].userName}
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              LV.{items[1].creatorLevel}
            </div>
            <div className="text-sm font-bold mt-1" style={{ color: '#E5E7EB' }}>
              {items[1].creatorPoints.toLocaleString()}
            </div>
            <div
              className="w-full h-20 rounded-t-xl mt-2 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #374151 0%, #FFFFFF 100%)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
              }}
            >
              <Medal className="w-6 h-6" style={{ color: '#D1D5DB' }} />
            </div>
          </div>

          {/* 第一名 */}
          <div className="flex-1 max-w-[160px] flex flex-col items-center">
            <Crown className="w-8 h-8 mb-1" style={{ color: '#FBBF24' }} />
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 relative"
              style={{
                background: MEDAL_COLORS[1].bg,
                boxShadow: `0 0 30px ${MEDAL_COLORS[1].border}88`,
              }}
            >
              <User className="w-8 h-8 text-white" />
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: MEDAL_COLORS[1].bg, color: 'white' }}
              >
                1
              </div>
            </div>
            <div className="text-base font-bold text-white text-center truncate w-full">
              {items[0].userName}
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              LV.{items[0].creatorLevel}
            </div>
            <div
              className="text-lg font-bold mt-1"
              style={{
                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {items[0].creatorPoints.toLocaleString()}
            </div>
            <div
              className="w-full h-24 rounded-t-xl mt-2 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #6366F140 0%, #FFFFFF 100%)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)',
              }}
            >
              <Trophy className="w-7 h-7" style={{ color: '#FBBF24' }} />
            </div>
          </div>

          {/* 第三名 */}
          <div className="flex-1 max-w-[140px] flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-2 relative"
              style={{
                background: MEDAL_COLORS[3].bg,
                boxShadow: `0 0 20px ${MEDAL_COLORS[3].border}66`,
              }}
            >
              <User className="w-7 h-7 text-white" />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: MEDAL_COLORS[3].bg, color: 'white' }}
              >
                3
              </div>
            </div>
            <div className="text-sm font-medium text-white text-center truncate w-full">
              {items[2].userName}
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>
              LV.{items[2].creatorLevel}
            </div>
            <div className="text-sm font-bold mt-1" style={{ color: '#D97706' }}>
              {items[2].creatorPoints.toLocaleString()}
            </div>
            <div
              className="w-full h-16 rounded-t-xl mt-2 flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #92400E 0%, #FFFFFF 100%)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
              }}
            >
              <Medal className="w-5 h-5" style={{ color: '#D97706' }} />
            </div>
          </div>
        </div>
      )}

      {/* 排行榜列表 */}
      {loading ? (
        <div className="text-center py-12" style={{ color: '#94A3B8' }}>
          加载中...
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(3).map((item: CreatorRankItem) => (
            <div
              key={item.userId}
              className="rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.005]"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div className="w-8 text-center">
                {getRankIcon(item.rank)}
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(99, 102, 241, 0.12)' }}
              >
                <User className="w-5 h-5" style={{ color: '#6366F1' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{item.userName}</div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  LV.{item.creatorLevel}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {item.creatorPoints.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>积分</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankingTab;
