import React, { useState, useEffect, useMemo } from 'react';
import {
  X, TrendingUp, RotateCcw, Target, Flame,
  AlertTriangle, RefreshCw, BarChart3,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { WordStatsRange, WordLearningStats, WordItem } from '@shared/api.interface';
import { DonutChart, TrendChart, MASTERY_COLORS } from './LearningReportCharts';

interface LearningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RANGE_TABS: Array<{ key: WordStatsRange; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部' },
];

// ===== 骨架屏 =====
const ReportSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* 概览卡片骨架 */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-slate-800/40 p-4 h-24 animate-pulse">
          <div className="h-6 w-16 bg-slate-700/50 rounded mb-3" />
          <div className="h-4 w-20 bg-slate-700/30 rounded" />
        </div>
      ))}
    </div>
    {/* 饼图骨架 */}
    <div className="rounded-xl bg-slate-800/40 p-5 animate-pulse">
      <div className="h-5 w-32 bg-slate-700/50 rounded mb-4" />
      <div className="flex items-center justify-center h-44 bg-slate-800/60 rounded-lg" />
    </div>
    {/* 趋势图骨架 */}
    <div className="rounded-xl bg-slate-800/40 p-5 animate-pulse">
      <div className="h-5 w-24 bg-slate-700/50 rounded mb-4" />
      <div className="h-44 bg-slate-800/60 rounded-lg" />
    </div>
  </div>
);

// ===== 主组件 =====
const LearningReportModal: React.FC<LearningReportModalProps> = ({ isOpen, onClose }) => {
  const [range, setRange] = useState<WordStatsRange>('week');
  const [stats, setStats] = useState<WordLearningStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (r: WordStatsRange): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await wordsApi.getLearningStats(r);
      setStats(data);
    } catch (err) {
      logger.error('加载学习报告失败', err as Error);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats(range);
    }
  }, [isOpen, range]);

  // 处理范围切换
  const handleRangeChange = (newRange: WordStatsRange): void => {
    setRange(newRange);
  };

  // 学习建议
  const suggestions = useMemo((): string[] => {
    if (!stats) return [];
    const result: string[] = [];
    const { overview } = stats;

    if (overview.pendingReview > 0) {
      result.push(`今日还有 ${overview.pendingReview} 个单词待复习，建议先完成复习`);
    }
    if (overview.accuracy < 60) {
      result.push('正确率偏低，建议放慢学习速度，多复习错词');
    }
    if (overview.streakDays >= 7) {
      result.push(`太棒了！已连续学习 ${overview.streakDays} 天，继续保持！`);
    }
    const totalMastery = stats.masteryDistribution.find((m) => m.level === 'mastered');
    const totalWords = stats.masteryDistribution.reduce((s, m) => s + m.count, 0);
    const masteryRate = totalWords > 0 && totalMastery ? (totalMastery.count / totalWords) * 100 : 0;
    if (masteryRate > 80) {
      result.push(`掌握率达到 ${Math.round(masteryRate)}%，可以学习更多新词啦`);
    }
    if (result.length === 0) {
      result.push('坚持每天学习，效果更好哦～');
    }
    return result;
  }, [stats]);

  // 教材掌握率（按掌握率降序）
  const sortedTextbooks = useMemo(() => {
    if (!stats) return [];
    return [...stats.textbookMastery].sort((a, b) => b.masteryRate - a.masteryRate);
  }, [stats]);

  // 掌握分布总数
  const totalMasteredWords = useMemo(() => {
    if (!stats) return 0;
    return stats.masteryDistribution.reduce((s, m) => s + m.count, 0);
  }, [stats]);

  if (!isOpen) return null;

  const overview = stats?.overview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-[#EEF2FF]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗卡片 */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden
        bg-gradient-to-br from-[#FFFFFF] to-[#EEF2FF]
        border border-violet-500/30 rounded-2xl
        shadow-2xl shadow-violet-500/20
        flex flex-col">
        {/* 顶部发光装饰 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1
          bg-gradient-to-r from-transparent via-violet-500 to-transparent
          opacity-60" />

        {/* ===== 顶部栏 ===== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/20">
          <h2 className="text-lg font-bold bg-clip-text text-transparent
            bg-gradient-to-r from-violet-300 to-cyan-300">
            学习报告
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white
              hover:bg-violet-500/20 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===== 时间范围 Tab ===== */}
        <div className="flex gap-2 px-6 py-3 border-b border-violet-500/10">
          {RANGE_TABS.map((tab) => {
            const active = range === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleRangeChange(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ===== 内容区 ===== */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && <ReportSkeleton />}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertTriangle size={36} className="text-rose-400" />
              <p className="text-sm text-slate-400">{error}</p>
              <button
                onClick={() => loadStats(range)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-violet-600/30 border border-violet-500/40
                  text-violet-200 text-sm hover:bg-violet-600/50 transition-all"
              >
                <RefreshCw size={14} />
                重新加载
              </button>
            </div>
          )}

          {stats && !loading && (
            <>
              {/* ===== 概览卡片 ===== */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 学习单词数 */}
                <div className="relative rounded-xl bg-slate-900/60 border border-violet-500/20 p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600"
                    style={{ boxShadow: '2px 0 8px rgba(34, 211, 238, 0.5)' }} />
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp size={14} className="text-cyan-400" />
                    <span className="text-xs text-slate-400">学习</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{overview?.wordsLearned ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">学习单词数</div>
                </div>

                {/* 复习单词数 */}
                <div className="relative rounded-xl bg-slate-900/60 border border-violet-500/20 p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400 to-violet-600"
                    style={{ boxShadow: '2px 0 8px rgba(99, 102, 241, 0.35)' }} />
                  <div className="flex items-center gap-1 mb-1">
                    <RotateCcw size={14} className="text-violet-400" />
                    <span className="text-xs text-slate-400">复习</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{overview?.wordsReviewed ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">复习单词数</div>
                </div>

                {/* 正确率 */}
                <div className="relative rounded-xl bg-slate-900/60 border border-violet-500/20 p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600"
                    style={{ boxShadow: '2px 0 8px rgba(52, 211, 153, 0.5)' }} />
                  <div className="flex items-center gap-1 mb-1">
                    <Target size={14} className="text-emerald-400" />
                    <span className="text-xs text-slate-400">平均正确率</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(overview?.accuracy ?? 0)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">正确率</div>
                </div>

                {/* 连续学习 */}
                <div className="relative rounded-xl bg-slate-900/60 border border-violet-500/20 p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600"
                    style={{ boxShadow: '2px 0 8px rgba(251, 146, 60, 0.5)' }} />
                  <div className="flex items-center gap-1 mb-1">
                    <Flame size={14} className="text-orange-400" />
                    <span className="text-xs text-slate-400">连续打卡</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {overview?.streakDays ?? 0}
                    <span className="text-sm font-normal text-slate-400 ml-1">天</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">连续学习</div>
                </div>
              </div>

              {/* ===== 掌握分布饼图 ===== */}
              <div className="rounded-xl bg-slate-900/40 border border-violet-500/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
                  单词掌握分布
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                  <DonutChart
                    data={stats.masteryDistribution}
                    total={totalMasteredWords}
                  />
                  {/* 图例 */}
                  <div className="space-y-2">
                    {stats.masteryDistribution.map((item) => {
                      const color = MASTERY_COLORS[item.level] ?? MASTERY_COLORS.unknown;
                      return (
                        <div key={item.level} className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{
                              backgroundColor: color.fill,
                              boxShadow: `0 0 6px ${color.stroke}80`,
                            }}
                          />
                          <span className="text-xs text-slate-300 w-12">{color.label}</span>
                          <span className="text-xs text-white font-medium w-10 text-right">
                            {item.count}
                          </span>
                          <span className="text-xs text-slate-500 w-10 text-right">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ===== 学习趋势图 ===== */}
              <div className="rounded-xl bg-slate-900/40 border border-violet-500/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
                    学习趋势
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-violet-500 to-violet-700" />
                      <span className="text-slate-400">学习</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-cyan-400" style={{ boxShadow: '0 0 4px #06B6D4' }} />
                      <span className="text-slate-400">复习</span>
                    </div>
                  </div>
                </div>
                <TrendChart data={stats.weeklyTrend} />
              </div>

              {/* ===== 教材掌握率 ===== */}
              <div className="rounded-xl bg-slate-900/40 border border-violet-500/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
                  教材掌握率
                </h3>
                <div className="space-y-3">
                  {sortedTextbooks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">暂无教材数据</p>
                  ) : (
                    sortedTextbooks.slice(0, 5).map((tb) => (
                      <div key={tb.textbookId}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-300 truncate max-w-[60%]">
                            {tb.textbookName}
                          </span>
                          <span className="text-xs font-semibold text-cyan-300"
                            style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.5)' }}>
                            {Math.round(tb.masteryRate * 100)}%
                          </span>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ===== 错词统计 ===== */}
              <div className="rounded-xl bg-slate-900/40 border border-violet-500/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
                  错词本统计
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 左列：错词总数 */}
                  <div className="flex flex-col justify-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {stats.wrongWordsStats.total}
                    </div>
                    <div className="text-xs text-slate-400 mb-2">错词总数</div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={12} className="text-rose-400" />
                      <span className="text-xs text-rose-300">
                        今日新增 {stats.wrongWordsStats.todayNew}
                      </span>
                    </div>
                  </div>
                  {/* 右列：Top 5 */}
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500 mb-1">高频错词 Top 5</div>
                    {(stats.wrongWordsStats.topWords as WordItem[]).slice(0, 5).map((w, i) => (
                      <div key={w.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 rounded flex items-center justify-center
                            text-[10px] font-bold
                            ${i < 3 ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-700/50 text-slate-400'}`}>
                            {i + 1}
                          </span>
                          <span className="text-slate-300 truncate">{w.word}</span>
                        </div>
                        <span className="text-slate-500 shrink-0 ml-2">
                          {(w as { wrongCount?: number }).wrongCount ?? 0}次
                        </span>
                      </div>
                    ))}
                    {stats.wrongWordsStats.topWords.length === 0 && (
                      <p className="text-xs text-slate-600 py-2">暂无错词</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== 学习建议 ===== */}
              <div className="rounded-xl bg-gradient-to-br from-violet-900/30 to-cyan-900/20
                border border-violet-500/20 p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyan-400" />
                  学习建议
                </h3>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"
                        style={{ boxShadow: '0 0 6px #06B6D4' }} />
                      <p className="text-xs text-slate-300 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningReportModal;
