import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { TrendingUp, TrendingDown, Clock, Target, CheckSquare } from 'lucide-react';
import type { StudyReportItem, ImprovementStats } from '@shared/api.interface';

interface ImprovementCardProps {
  report: StudyReportItem;
}

function ChangeBadge({ value, suffix }: { value: number; suffix: string }) {
  const isUp = value >= 0;
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: isUp ? 'rgba(34, 211, 238, 0.15)' : 'rgba(239, 71, 111, 0.15)',
        color: isUp ? '#06B6D4' : '#EF476F',
      }}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? '+' : ''}{value}{suffix}
    </div>
  );
}

function ImprovementCard({ report }: ImprovementCardProps) {
  const raw = report.improvement ?? ({} as Partial<ImprovementStats>);
  const improvement: ImprovementStats = {
    durationChange: raw.durationChange ?? 0,
    accuracyChange: raw.accuracyChange ?? 0,
    taskChange: raw.taskChange ?? 0,
    streakDays: raw.streakDays ?? 0,
    longestStreak: raw.longestStreak ?? 0,
    weeklyTrend: raw.weeklyTrend ?? [],
  };

  const trendOption: EChartsOption = useMemo(() => {
    const data = improvement.weeklyTrend;
    if (data.length === 0) return {} as EChartsOption;

    const labels = data.map((d) => d.week);
    const durations = data.map((d) => d.duration);
    const accuracies = data.map((d) => Math.round(d.accuracy));

    return {
      backgroundColor: 'transparent',
         tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
       },
       legend: {
         data: ['学习时长', '正确率'],
         textStyle: { color: '#94A3B8', fontSize: 11 },
        top: 0,
        right: 0,
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', top: '18%', containLabel: true },
       xAxis: {
         type: 'category',
         data: labels,
         axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
         axisLabel: { color: '#94A3B8', fontSize: 10 },
         axisTick: { show: false },
       },
      yAxis: [
        {
          type: 'value',
          name: '分钟',
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#94A3B8', fontSize: 10 },
           splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
        },
        {
          type: 'value',
          name: '%',
          min: 0,
          max: 100,
          nameTextStyle: { color: '#94A3B8', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '学习时长',
          type: 'line',
          yAxisIndex: 0,
          data: durations,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#6366F1' },
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#6366F1' },
                { offset: 1, color: '#2563EB' },
              ],
            },
            shadowColor: 'rgba(99, 102, 241, 0.35)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.2)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0)' },
              ],
            },
          },
        },
        {
          name: '正确率',
          type: 'line',
          yAxisIndex: 1,
          data: accuracies,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          itemStyle: { color: '#06B6D4' },
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#06B6D4' },
                { offset: 1, color: '#2563EB' },
              ],
            },
            shadowColor: 'rgba(34, 211, 238, 0.5)',
            shadowBlur: 8,
          },
        },
      ],
    };
  }, [improvement]);

  const stats = [
    {
      label: '时长变化',
      value: `${improvement.durationChange > 0 ? '+' : ''}${improvement.durationChange}分钟`,
      change: improvement.durationChange,
      suffix: '分钟',
      icon: Clock,
      color: '#6366F1',
    },
    {
      label: '正确率变化',
      value: `${improvement.accuracyChange > 0 ? '+' : ''}${improvement.accuracyChange}%`,
      change: improvement.accuracyChange,
      suffix: '%',
      icon: Target,
      color: '#06B6D4',
    },
    {
      label: '任务数变化',
      value: `${improvement.taskChange > 0 ? '+' : ''}${improvement.taskChange}个`,
      change: improvement.taskChange,
      suffix: '个',
      icon: CheckSquare,
      color: '#F97316',
    },
  ];

  const hasTrend = improvement.weeklyTrend.length > 0;

  return (
    <div className="rounded-xl p-4 sm:p-5 glass-card">
       <h3 className="text-sm font-semibold text-white mb-4">
        进步分析
      </h3>

      {/* Change cards */}
       <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {stats.map(({ label, value, change, suffix, icon: Icon, color }) => (
          <div
            key={label}
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}10` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon size={14} style={{ color }} />
               <span className="text-xs text-slate-400">{label}</span>
            </div>
             <p className="text-base font-bold text-white mb-1">{value}</p>
            <ChangeBadge value={change} suffix={suffix} />
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {hasTrend ? (
         <div className="pt-4 border-t border-white/10">
           <p className="text-xs text-slate-400 mb-2">学习趋势</p>
          <ReactECharts
            option={trendOption}
            style={{ height: '260px' }}
            theme="ud"
          />
        </div>
      ) : (
         <div className="pt-4 text-center py-8 rounded-lg border-t border-white/10 bg-white/5">
           <p className="text-sm text-slate-400">暂无趋势数据，持续学习后将展示进步轨迹</p>
         </div>
      )}
    </div>
  );
}

export default ImprovementCard;
