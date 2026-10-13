import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Clock,
  BookOpen,
  Target,
  Flame,
  Trophy,
  ChevronRight,
  BarChart3,
  Award,
  Star,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { learnersStatsApi } from '@client/src/api';
import type {
  LearnerStatsSummary,
  SubjectRadarData,
  ProgressDailyData,
  MistakeStats,
  Achievement,
  MistakeCategory,
} from '@shared/api.interface';

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};

const CATEGORY_LABELS: Record<MistakeCategory, string> = {
  sentence: '句子练习',
  word: '单词',
  dictation: '听写',
  chinese_char: '语文生字',
  math_arithmetic: '数学口算',
  poetry: '古诗',
  other: '其他',
};

const CATEGORY_COLORS: Record<string, string> = {
  sentence: '#FF6B35',
  word: '#4361EE',
  dictation: '#2EC4B6',
  chinese_char: '#FFD166',
  math_arithmetic: '#EF476F',
  poetry: '#9B5DE5',
  other: '#6B7280',
};

const StatsDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<LearnerStatsSummary | null>(null);
  const [radar, setRadar] = useState<SubjectRadarData | null>(null);
  const [progress, setProgress] = useState<ProgressDailyData[]>([]);
  const [mistakes, setMistakes] = useState<MistakeStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progressDays, setProgressDays] = useState<7 | 30>(7);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async (): Promise<void> => {
      setLoading(true);
      try {
        const [s, r, p, m, a] = await Promise.all([
          learnersStatsApi.getStatsSummary(),
          learnersStatsApi.getSubjectRadar(),
          learnersStatsApi.getProgress(progressDays),
          learnersStatsApi.getMistakes(),
          learnersStatsApi.getAchievements(),
        ]);
        if (cancelled) return;
        setSummary(s);
        setRadar(r);
        setProgress(p.dailyData);
        setMistakes(m);
        setAchievements(a);
      } catch (err: unknown) {
        logger.error('加载学习数据失败', err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [progressDays]);

  const formatHours = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours} 小时 ${mins} 分钟`;
  };

  // 雷达图配置
  const radarOption: EChartsOption = radar
    ? {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, data: radar.subjects.map((s) => SUBJECT_LABELS[s.subject]) },
        radar: {
          indicator: [
            { name: '正确率' },
            { name: '完成度' },
            { name: '活跃度' },
          ],
          center: ['50%', '45%'],
          radius: '60%',
          shape: 'polygon',
          splitNumber: 4,
        },
        series: [
          {
            type: 'radar',
            data: radar.subjects.map((s) => ({
              name: SUBJECT_LABELS[s.subject],
              value: [s.accuracy, s.completion, s.activity],
              areaStyle: { opacity: 0.15 },
            })),
            color: ['#EF476F', '#4361EE', '#FF6B35'],
          },
        ],
      }
    : {};

  // 进步曲线配置（双Y轴：柱状 + 折线）
  const progressOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, data: ['学习时长', '正确率'] },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: progress.map((d) => d.date.slice(5)),
      boundaryGap: true,
    },
    yAxis: [
      {
        type: 'value',
        name: '分钟',
        position: 'left',
      },
      {
        type: 'value',
        name: '正确率%',
        position: 'right',
        min: 0,
        max: 100,
      },
    ],
    series: [
      {
        name: '学习时长',
        type: 'bar',
        yAxisIndex: 0,
        data: progress.map((d) => d.studyMinutes),
        itemStyle: {
          color: '#FF6B35',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        data: progress.map((d) => d.accuracy),
        smooth: true,
        lineStyle: { color: '#4361EE', width: 2 },
        itemStyle: { color: '#4361EE' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(67, 97, 238, 0.25)' },
              { offset: 1, color: 'rgba(67, 97, 238, 0)' },
            ],
          },
        },
      },
    ],
  };

  // 错题饼图配置
  const mistakePieOption: EChartsOption = mistakes
    ? {
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, type: 'scroll' },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: { label: { show: false } },
            data: mistakes.byCategory.map((item) => ({
              name: CATEGORY_LABELS[item.category] || item.category,
              value: item.count,
              itemStyle: {
                color: CATEGORY_COLORS[item.category] || '#6B7280',
              },
            })),
          },
        ],
      }
    : {};

  const statCards = summary
    ? [
        {
          label: '总学习时长',
          value: formatHours(summary.totalStudyMinutes),
          icon: Clock,
          color: 'from-orange-400 to-orange-500',
          bg: 'bg-orange-50',
        },
        {
          label: '完成课程',
          value: `${summary.completedCourses} 门`,
          icon: BookOpen,
          color: 'from-blue-400 to-blue-500',
          bg: 'bg-blue-50',
        },
        {
          label: '总正确率',
          value: `${summary.overallAccuracy}%`,
          icon: Target,
          color: 'from-teal-400 to-teal-500',
          bg: 'bg-teal-50',
        },
        {
          label: '连续打卡',
          value: `${summary.checkInStreak} 天`,
          icon: Flame,
          color: 'from-red-400 to-orange-500',
          bg: 'bg-red-50',
        },
      ]
    : [];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-white">我的学习数据</h1>
           <p className="text-sm text-slate-400 mt-1">全面了解你的学习进度和成就</p>
        </div>
         <div className="flex items-center gap-2 text-sm text-slate-400">
           <BarChart3 size={18} className="text-orange-400" />
           <span>数据每日更新</span>
        </div>
      </div>

      {/* 第一行：4个统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" data-ai-section-type="card-stat">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="glass-card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                   <p className="text-sm text-slate-400 font-medium">{card.label}</p>
                   <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
                </div>
                 <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 第二行：等级经验 + 学科雷达图 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：等级卡片 */}
        <div className="lg:col-span-1">
          <div className="relative rounded-2xl p-6 text-white overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #EF476F 100%)' }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-10 -translate-x-10" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Trophy size={16} />
                <span>学习等级</span>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold">Lv.{summary?.level ?? 0}</span>
                  <span className="text-xl font-medium">{summary?.rank ?? '—'}</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>经验值</span>
                  <span>{summary?.expPoints ?? 0} / {summary?.expToNextLevel ?? 0}</span>
                </div>
                <p className="text-xs text-white/70">
                  距离下一等级还差 {(summary?.expToNextLevel ?? 0) - (summary?.expPoints ?? 0)} 经验
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">下一段位</p>
                    <p className="text-sm font-semibold">探索者 → 学者</p>
                  </div>
                  <ChevronRight size={18} className="text-white/60" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 rounded-lg py-2">
                  <p className="text-lg font-bold">{summary?.totalCheckIns ?? 0}</p>
                  <p className="text-xs text-white/70">累计打卡</p>
                </div>
                <div className="bg-white/10 rounded-lg py-2">
                  <p className="text-lg font-bold">{summary?.checkInStreak ?? 0}</p>
                  <p className="text-xs text-white/70">连续天数</p>
                </div>
                <div className="bg-white/10 rounded-lg py-2">
                  <p className="text-lg font-bold">{unlockedCount}</p>
                  <p className="text-xs text-white/70">成就数</p>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* 右侧：学科雷达图 */}
         <div className="lg:col-span-2 glass-card p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">学科能力雷达</h3>
             <div className="flex items-center gap-1 text-sm text-slate-400">
               <Zap size={14} className="text-orange-400" />
              <span>三维度评估</span>
            </div>
          </div>
          <div className="h-[300px]">
            {radar && <ReactECharts option={radarOption} theme="ud" className="h-[300px] w-full" />}
          </div>
        </div>
      </div>

       {/* 第三行：进步曲线 */}
       <div className="glass-card p-5">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <TrendingUp size={20} className="text-orange-400" />
             <h3 className="text-lg font-semibold text-white">进步曲线</h3>
           </div>
           <div className="flex bg-white/10 rounded-lg p-0.5">
             {[7, 30].map((days) => (
               <button
                 key={days}
                 onClick={() => setProgressDays(days as 7 | 30)}
                 className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                   progressDays === days
                     ? 'bg-white/20 text-orange-400 shadow-sm'
                     : 'text-slate-400 hover:text-white'
                 }`}
              >
                近{days}天
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          {!loading && <ReactECharts option={progressOption} theme="ud" className="h-[300px] w-full" />}
        </div>
      </div>

      {/* 第四行：错题统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* 左侧：错题分类饼图 */}
         <div className="glass-card p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">错题分类</h3>
             <span className="text-sm text-slate-400">
              共 {mistakes?.totalMistakes ?? 0} 道错题
            </span>
          </div>
          <div className="h-[300px]">
            {mistakes && mistakes.byCategory.length > 0 && (
              <ReactECharts option={mistakePieOption} theme="ud" className="h-[300px] w-full" />
            )}
            {mistakes && mistakes.byCategory.length === 0 && (
               <div className="h-full flex items-center justify-center text-slate-500">
                   暂无错题数据
                 </div>
            )}
          </div>
        </div>

         {/* 右侧：最近错题列表 */}
         <div className="glass-card p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">最近错题</h3>
             <button className="text-sm text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1">
              查看全部
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {mistakes?.recentMistakes?.slice(0, 6).map((item) => (
              <div
                key={item.id}
                 className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                     <p className="text-sm text-white font-medium truncate">
                         {item.question}
                       </p>
                       <p className="text-xs text-slate-400 mt-1 truncate">
                      正确答案：{item.correctAnswer}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[item.category]}20`,
                      color: CATEGORY_COLORS[item.category],
                    }}
                  >
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
            {(!mistakes || mistakes.recentMistakes.length === 0) && !loading && (
               <div className="py-10 text-center text-slate-500 text-sm">
                   暂无错题记录
                 </div>
            )}
          </div>
        </div>
      </div>

       {/* 第五行：成就徽章 */}
       <div className="glass-card p-5" data-ai-section-type="card-menu">
         <div className="flex items-center justify-between mb-5">
           <div className="flex items-center gap-2">
             <Award size={20} className="text-orange-400" />
             <h3 className="text-lg font-semibold text-white">成就徽章</h3>
           </div>
           <span className="text-sm text-slate-400">
            已解锁 {unlockedCount} / {achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
                 className={`relative flex flex-col items-center p-4 rounded-xl transition-all ${
                   a.unlocked
                     ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 hover:shadow-md border border-orange-500/20'
                     : 'bg-white/5 grayscale opacity-60 border border-white/10'
                 }`}
            >
              {a.unlocked && (
                <div className="absolute top-2 right-2">
                  <Star size={14} className="text-yellow-500 fill-yellow-400" />
                </div>
              )}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 ${
                  a.unlocked
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-200'
                    : 'bg-gray-200'
                }`}
              >
                <span>{a.icon}</span>
              </div>
                 <p className="text-sm font-semibold text-white text-center">{a.name}</p>
                   <p className="text-xs text-slate-400 text-center mt-1 line-clamp-2">
                {a.description}
              </p>
              {a.unlocked && a.unlockedAt && (
                 <p className="text-xs text-orange-400 mt-2 font-medium">
                  已解锁
                </p>
              )}
              {!a.unlocked && (
                <p className="text-xs text-slate-500 mt-2">
                  未解锁
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboardPage;
