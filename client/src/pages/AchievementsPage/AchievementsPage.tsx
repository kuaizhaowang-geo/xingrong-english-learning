import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Star,
  Zap,
  CalendarDays,
  Sparkles,
  Coins,
  ChevronRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import BadgeCard from './BadgeCard';
import StatCard from './StatCard';
import { achievementsApi } from '@/api';
import type {
  AchievementOverview,
  BadgeItem,
  PointLogItem,
} from '@shared/api.interface';

type BadgeCategory = 'all' | 'study' | 'streak' | 'achievement' | 'special';

const CATEGORY_TABS: { key: BadgeCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'study', label: '学习类' },
  { key: 'streak', label: '坚持类' },
  { key: 'achievement', label: '成就类' },
  { key: 'special', label: '特殊' },
];

const CATEGORY_MAP: Record<BadgeCategory, string> = {
  all: '',
  study: 'study',
  streak: 'streak',
  achievement: 'achievement',
  special: 'special',
};

const LEVEL_ICONS: React.ReactNode[] = [
  <Star key={0} size={20} />,
  <Zap key={1} size={20} />,
  <Flame key={2} size={20} />,
  <Award key={3} size={20} />,
  <Trophy key={4} size={20} />,
  <Sparkles key={5} size={20} />,
];

const AchievementsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AchievementOverview | null>(null);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('all');

  useEffect(() => {
    let mounted = true;
    const fetchData = async (): Promise<void> => {
      try {
        const overview: AchievementOverview = await achievementsApi.getOverview();
        if (mounted) {
          setData(overview);
          setLoading(false);
        }
      } catch (error: unknown) {
        logger.error('Failed to load achievements overview', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return (): void => {
      mounted = false;
    };
  }, []);

  const filteredBadges: BadgeItem[] = data
    ? activeCategory === 'all'
      ? data.badges
      : data.badges.filter((b: BadgeItem): boolean => b.category === CATEGORY_MAP[activeCategory])
    : [];

  const points = data?.points;
  const stats = data?.stats;

  const levelIconIndex = points ? Math.min(points.level - 1, LEVEL_ICONS.length - 1) : 0;
  const progressPercent = points
    ? points.nextLevelPoints > 0
      ? Math.min(100, (points.currentLevelProgress / points.nextLevelPoints) * 100)
      : 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center text-slate-400 py-20">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#6366F1' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#2563EB' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#06B6D4' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30">
            <Trophy size={14} className="text-fuchsia-300" />
            <span className="text-xs text-fuchsia-300 font-medium">成就中心</span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{
              background:
                 'linear-gradient(135deg, #ffffff 0%, #E879F9 50%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            我的成就
          </h1>
          <p className="text-slate-400 text-base md:text-lg">
            记录每一次突破，见证成长轨迹
          </p>
        </div>

        {/* 顶部大卡片：等级 + 总积分 */}
        <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* 左侧：等级展示 */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)',
                }}
              >
                   <div
                     className="absolute inset-1 rounded-full flex items-center justify-center text-white"
                     style={{ backgroundColor: 'rgba(15, 13, 36, 0.8)' }}
                   >
                     <div className="text-center">
                       <div className="text-fuchsia-300">
                         {LEVEL_ICONS[levelIconIndex]}
                       </div>
                       <div className="text-lg md:text-xl font-bold text-white mt-1">
                         LV{points?.level ?? 1}
                       </div>
                     </div>
                   </div>
                 </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">当前等级</p>
                 <p
                   className="text-xl md:text-2xl font-bold text-white"
                 >
                   {points?.levelName ?? '初学者'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  距离下一等级还需{' '}
                  <span style={{ color: '#22d3ee' }}>
                    {(points?.nextLevelPoints ?? 0) -
                      (points?.currentLevelProgress ?? 0)}
                  </span>{' '}
                  积分
                </p>
              </div>
            </div>

            {/* 升级进度 */}
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">升级进度</span>
                <span className="text-cyan-300">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #A855F7 0%, #06B6D4 100%)',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* 右侧：总积分 */}
            <div className="flex flex-col items-center md:items-end flex-shrink-0">
              <p className="text-slate-400 text-sm mb-1">总积分</p>
              <div className="flex items-baseline gap-1">
                <Coins size={24} className="text-[#FFD700]" />
                <span
                  className="text-3xl md:text-4xl font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {points?.totalPoints?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex gap-4 mt-3 text-xs">
                <div className="text-center">
                  <p className="text-slate-400">今日</p>
                  <p className="text-cyan-300 font-semibold">
                    +{points?.todayPoints ?? 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400">本周</p>
                  <p className="text-fuchsia-300 font-semibold">
                    +{points?.weekPoints ?? 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400">本月</p>
                  <p className="text-blue-300 font-semibold">
                    +{points?.monthPoints ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Award size={20} />}
            iconColor="#FFD700"
            label="已获勋章"
            value={`${stats?.earnedBadges ?? 0} / ${stats?.totalBadges ?? 0}`}
            subtext="枚勋章"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            iconColor="#06B6D4"
            label="排行榜"
            value={`#${stats?.rank ?? '--'}`}
            subtext="全服排名"
          />
          <StatCard
            icon={<Flame size={20} />}
            iconColor="#F97316"
            label="连续学习"
            value={`${points?.streakDays ?? 0}`}
            subtext="天"
          />
        </div>

        {/* 最近获得的勋章 */}
        {data && data.recentBadges.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#06B6D4]" />
                  <h2
                    className="text-lg font-semibold text-white"
                  >
                    最近获得
                 </h2>
              </div>
              <span
                className="text-xs"
                style={{ color: '#94A3B8' }}
              >
                {data.recentBadges.length} 枚新勋章
              </span>
            </div>
            <div
              className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
              style={{ scrollbarWidth: 'thin' }}
            >
              {data.recentBadges.map((badge: BadgeItem) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 w-28"
                >
                  <BadgeCard badge={badge} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 勋章墙 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Trophy size={18} className="text-fuchsia-400" />
               <h2 className="text-lg font-semibold text-white">
                 勋章墙
               </h2>
             </div>
            <span
              className="text-xs"
              style={{ color: '#94A3B8' }}
            >
              共 {filteredBadges.length} 枚
            </span>
          </div>

          {/* 分类 Tab */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab: { key: BadgeCategory; label: string }) => (
              <button
                key={tab.key}
                onClick={(): void => setActiveCategory(tab.key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium
                  whitespace-nowrap transition-all duration-200
                  border
                `}
                style={{
                   backgroundColor:
                     activeCategory === tab.key
                       ? 'rgba(217, 70, 239, 0.25)'
                       : 'rgba(255, 255, 255, 0.05)',
                   borderColor:
                     activeCategory === tab.key
                       ? 'rgba(217, 70, 239, 0.5)'
                       : 'rgba(255, 255, 255, 0.1)',
                    color:
                      activeCategory === tab.key ? '#ffffff' : '#cbd5e1',
                   boxShadow:
                     activeCategory === tab.key
                       ? '0 0 12px rgba(217, 70, 239, 0.35)'
                       : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 勋章网格 */}
          {filteredBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredBadges.map((badge: BadgeItem) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
             <div
               className="text-center py-12 rounded-xl border backdrop-blur-xl"
               style={{
                 backgroundColor: 'rgba(15, 23, 42, 0.6)',
                 borderColor: 'rgba(139, 92, 246, 0.25)',
               }}
             >
               <Award
                 size={40}
                 className="mx-auto mb-3"
                 style={{ color: '#64748B' }}
               />
               <p style={{ color: '#94A3B8' }}>暂无该分类勋章</p>
            </div>
          )}
        </section>

        {/* 积分记录 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-[#2563EB]" />
                  <h2
                    className="text-lg font-semibold text-white"
                  >
                    积分记录
               </h2>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs"
              style={{ color: '#818CF8' }}
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </div>

           <div
             className="rounded-xl border overflow-hidden backdrop-blur-xl"
             style={{
               backgroundColor: 'rgba(15, 23, 42, 0.6)',
               borderColor: 'rgba(139, 92, 246, 0.25)',
             }}
           >
            {data && data.pointLogs.length > 0 ? (
              <ul>
                {data.pointLogs.map((log: PointLogItem) => (
                  <li
                    key={log.id}
                   className="flex items-center justify-between px-5 py-3 border-b last:border-b-0"
                   style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
                 >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: log.points > 0
                            ? 'rgba(34, 211, 238, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        }}
                      >
                        <Coins size={14} style={{ color: log.points > 0 ? '#06B6D4' : '#EF4444' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {log.reason}
                         </p>
                         <p className="text-xs text-slate-400">
                          {log.source} · {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-base font-bold"
                       style={{ color: log.points > 0 ? '#22d3ee' : '#f87171' }}
                    >
                      {log.points > 0 ? '+' : ''}{log.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
               <div className="text-center py-8">
                  <p className="text-slate-400">暂无积分记录</p>
               </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AchievementsPage;
