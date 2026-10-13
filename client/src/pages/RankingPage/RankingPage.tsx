import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Sparkles, Target } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { rankingApi } from '@client/src/api';
import type { RankItem, RankingPeriod, RankingType } from '@shared/api.interface';
import RankingPodium from './RankingPodium';
import RankListItem from './RankListItem';

type PeriodType = 'week' | 'month' | 'year';

const PERIOD_TABS: { value: PeriodType; label: string }[] = [
  { value: 'week', label: '周榜' },
  { value: 'month', label: '月榜' },
  { value: 'year', label: '年榜' },
];

const TYPE_TABS: { value: RankingType; label: string }[] = [
  { value: 'studyTime', label: '学习时长' },
  { value: 'wins', label: '胜场' },
  { value: 'winRate', label: '胜率' },
];

const getTypeIcon = (type: RankingType): React.ReactNode => {
  switch (type) {
    case 'studyTime':
      return <Clock className="w-3 h-3" />;
    case 'wins':
      return <Trophy className="w-3 h-3" />;
    case 'winRate':
      return <Target className="w-3 h-3" />;
  }
};

const getTypeLabel = (type: RankingType): string => {
  switch (type) {
    case 'studyTime': return '学习时长';
    case 'wins': return '胜场';
    case 'winRate': return '胜率';
  }
};

const getTypeUnit = (type: RankingType): string => {
  switch (type) {
    case 'studyTime': return '小时';
    case 'wins': return '胜';
    case 'winRate': return '胜率';
  }
};

const formatRankValue = (value: number, type: RankingType): string => {
  switch (type) {
    case 'studyTime':
      return (value / 60).toFixed(1);
    case 'wins':
      return String(value);
    case 'winRate':
      return `${value.toFixed(1)}%`;
  }
};

const getTypeSubtitle = (type: RankingType): string => {
  switch (type) {
    case 'studyTime': return '基于学习时长排名，越努力越靠前';
    case 'wins': return '基于胜场数排名，赢得越多越靠前';
    case 'winRate': return '基于胜率排名，越精准越靠前';
  }
};

const toApiPeriod = (p: PeriodType): RankingPeriod => {
  if (p === 'week') return 'weekly';
  if (p === 'month') return 'monthly';
  return 'yearly';
};

const RankingPage: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [type, setType] = useState<RankingType>('studyTime');
  const [ranking, setRanking] = useState<RankItem[]>([]);
  const [myRank, setMyRank] = useState<RankItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    loadRanking();
  }, [period, type]);

  const loadRanking = async (): Promise<void> => {
    try {
      setLoading(true);
      let list: RankItem[] = [];
      let my: RankItem | null = null;

      try {
        const res = await rankingApi.getRanking({
          type,
          period: toApiPeriod(period),
        });
        list = res.items || [];
        my = res.myRank || null;
        setApiError('');
      } catch (apiErr) {
        logger.warn('排行榜API调用失败', apiErr as Error);
        setApiError('加载失败，请稍后重试');
      }

      setRanking(list);
      setMyRank(my);
    } catch (err) {
      logger.error('加载排行榜失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);
  const restList = useMemo(() => ranking.slice(3, 20), [ranking]);
  const myUserId = myRank?.userId;

  const myOnList = useMemo(
    () => myRank && myRank.rank <= ranking.length && myRank.rank >= 4,
    [myRank, ranking.length],
  );

  return (
    <div
      className="min-h-screen pb-32"
    >
      {/* 顶部装饰光效 */}
      <div className="absolute top-0 left-0 right-0 h-[300px] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[250px] bg-gradient-to-b from-cyan-500/15 via-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 truncate">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Trophy className="w-5 h-5 text-yellow-300" />
            </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>学习排行榜</span>
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
                 <p className="text-xs text-slate-400 font-normal mt-0.5">
                  {getTypeSubtitle(type)}
                </p>
              </div>
          </h1>
        </motion.div>

        {/* 排行类型选择器 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0"
        >
          {TYPE_TABS.map((tab) => {
            const active = type === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setType(tab.value)}
                className={`
                  px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5
                  ${active
                      ? 'text-white bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(34_211_238_0.2)]'
                     : 'text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:border-fuchsia-500/30 glass-card'
                   }
                `}
              >
                {getTypeIcon(tab.value)}
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* 切换标签 + 我的排名卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          {/* 周期切换大按钮 - 手机端横滚 */}
           <div className="flex gap-2 p-1 rounded-2xl glass-card overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-1">
            {PERIOD_TABS.map((tab) => {
              const active = period === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setPeriod(tab.value)}
                  className={`
                    relative px-5 sm:px-6 py-2.5 min-h-11 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
                     ${active
                        ? 'text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-lg shadow-fuchsia-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }
                  `}
                >
                  {active && (
                    <motion.span
                      layoutId="ranking-period-glow"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-md -z-10"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

           {/* 我的排名小卡片 */}
           <div className="flex items-center justify-between sm:justify-end gap-3 px-4 py-2.5 rounded-xl glass-card">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              我
            </div>
            <div className="text-right">
               <div className="text-xs text-slate-400">我的排名</div>
               <div className="text-base font-bold text-fuchsia-400 flex items-center justify-end gap-1">
                {myRank?.rank ? `#${myRank.rank}` : '—'}
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
             <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
               <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                {getTypeIcon(type)}
                {getTypeLabel(type)}
              </div>
               <div className="text-base font-bold text-cyan-400">
                {myRank ? formatRankValue(myRank.value, type) : type === 'wins' ? '0' : '0.0'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 加载状态 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
                  <div className="flex items-end justify-center gap-2 sm:gap-4 pt-4 sm:pt-8 h-56 sm:h-72">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-purple-500/20 rounded-xl flex-1 max-w-[80px] sm:max-w-[100px] md:max-w-[140px]"
                    style={{ height: i === 1 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '180px' : '260px') : (typeof window !== 'undefined' && window.innerWidth < 640 ? '140px' : '200px') }}
                  />
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse h-12 sm:h-14 rounded-xl bg-purple-500/10"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </motion.div>
          ) : ranking.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
               className="rounded-2xl glass-card p-16 text-center"
            >
               <TrendingUp className="w-16 h-16 mx-auto mb-4 text-fuchsia-500/40" />
<p className="text-slate-400 text-base">
                   {apiError || '暂无排行数据'}
                 </p>
               <p className="text-slate-300 text-sm mt-1">快去学习，争取上榜吧～</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
               {/* 前三名领奖台 */}
               <div className="rounded-2xl glass-card overflow-hidden">
                <RankingPodium items={top3} type={type} />
              </div>

               {/* 排名列表 */}
               <div className="rounded-2xl glass-card overflow-hidden">
                  <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                    <span>第 4 - {Math.min(20, ranking.length)} 名</span>
                  </h2>
                   <span className="text-xs text-slate-400 flex items-center gap-1">
                    {getTypeIcon(type)}
                    {getTypeLabel(type)}
                  </span>
                </div>

                {restList.length === 0 ? (
                   <div className="p-10 text-center text-slate-400 text-sm">
                    暂无更多排行数据
                  </div>
                ) : (
                   <div className="p-2 sm:p-3 space-y-2">
                     {restList.map((item: RankItem, index: number) => (
                       <RankListItem
                         key={item.userId}
                         item={item}
                         index={index}
                         isMe={item.userId === myUserId}
                         type={type}
                       />
                     ))}
                  </div>
                )}

                {/* 未上榜提示 */}
                 {!myOnList && myRank && myRank.rank > ranking.length && (
                   <div className="px-5 py-5 border-t border-white/10 text-center">
                     <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30">
                       <Sparkles className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-sm text-fuchsia-300">
                          继续努力，上榜指日可待
                        </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RankingPage;
