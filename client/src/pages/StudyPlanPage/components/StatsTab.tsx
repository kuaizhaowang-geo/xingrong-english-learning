import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Clock, Flame, CalendarCheck, CheckSquare } from 'lucide-react';
import type { PlanStatsResponse } from '@shared/api.interface';

interface StatsTabProps {
  loading: boolean;
  stats: PlanStatsResponse | null;
}

const NEON_COLORS = ['#6366F1', '#06B6D4', '#FFD166', '#EC4899', '#A855F7'];

const TASK_TYPE_LABELS: Record<string, string> = {
  word: '单词学习',
  sentence: '句子练习',
  dictation: '听写练习',
  phonetic: '音标学习',
  aiQuiz: 'AI出题',
};

function StatsTab({ loading, stats }: StatsTabProps) {
  const lineOption = useMemo(() => {
    if (!stats) return {};
    const dates = stats.dailyCompletion.map((d) => d.date.slice(5));
    const rates = stats.dailyCompletion.map((d) => Math.round(d.rate * 100));

    return {
      backgroundColor: 'transparent',
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 23, 42, 0.95)',
         borderColor: 'rgba(139, 92, 246, 0.3)',
         textStyle: { color: '#E2E8F0' },
        formatter: (params: { name: string; value: number }[]) =>
          `${params[0].name}<br/>完成率: ${params[0].value}%`,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: 'rgba(99, 102, 241, 0.2)' } },
        axisLabel: { color: '#94A3B8', fontSize: 10, interval: Math.floor(dates.length / 8) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(99, 102, 241, 0.08)' } },
      },
      series: [
        {
          type: 'line',
          data: rates,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: { color: '#06B6D4' },
          lineStyle: {
            width: 2,
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#6366F1' },
                { offset: 1, color: '#06B6D4' },
              ],
            },
            shadowColor: 'rgba(99, 102, 241, 0.35)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.2)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0)' },
              ],
            },
          },
        },
      ],
    };
  }, [stats]);

  const pieOption = useMemo(() => {
    if (!stats) return {};
    const data = stats.taskDistribution.map((item, idx) => ({
      name: TASK_TYPE_LABELS[item.type] ?? item.type,
      value: item.count,
      itemStyle: { color: NEON_COLORS[idx % NEON_COLORS.length] },
    }));

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'item',
         backgroundColor: 'rgba(15, 23, 42, 0.95)',
         borderColor: 'rgba(139, 92, 246, 0.3)',
         textStyle: { color: '#E2E8F0' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#94A3B8', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
           itemStyle: {
             borderRadius: 6,
             borderColor: 'rgba(15, 23, 42, 0.6)',
             borderWidth: 2,
           },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(99, 102, 241, 0.35)',
            },
          },
          data,
        },
      ],
    };
  }, [stats]);

  // Calendar heatmap data
  const calendarCells = useMemo(() => {
    if (!stats) return [];
    return stats.dailyCompletion.map((d) => ({
      date: d.date,
      rate: d.rate,
    }));
  }, [stats]);

  const getCellColor = (rate: number): string => {
    const r = Math.round(rate * 100);
    if (r === 0) return 'rgba(99, 102, 241, 0.08)';
    if (r < 50) return 'rgba(99, 102, 241, 0.15)';
    if (r < 80) return 'rgba(99, 102, 241, 0.35)';
    return '#6366F1';
  };

  const getCellGlow = (rate: number): string => {
    const r = Math.round(rate * 100);
    if (r >= 80) return '0 0 8px rgba(99, 102, 241, 0.3)';
    return 'none';
  };

  if (loading) {
    return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
           ))}
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="h-72 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
           <div className="h-72 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
         </div>
         <div className="h-48 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }} />
      </div>
    );
  }

  if (!stats) return null;

  const totalHours = (stats.totalStudyMinutes / 60).toFixed(1);
  const totalTasks = stats.taskDistribution.reduce((sum, t) => sum + t.count, 0);

  const statCards = [
    { label: '总学习时长', value: `${totalHours}小时`, icon: Clock, color: '#6366F1', sub: `累计 ${stats.totalStudyMinutes} 分钟` },
    { label: '连续打卡', value: `${stats.streakDays}天`, icon: Flame, color: '#FFD166', sub: '坚持就是胜利' },
    { label: '本月完成率', value: `${Math.round(stats.monthlyCompletion * 100)}%`, icon: CalendarCheck, color: '#06B6D4', sub: '稳步提升中' },
    { label: '完成任务数', value: `${totalTasks}`, icon: CheckSquare, color: '#EC4899', sub: '累计完成任务' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, sub }) => (
           <div
             key={label}
             className="rounded-xl p-5 backdrop-blur-xl"
             style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
           >
             <div className="flex items-center gap-2 mb-2">
               <div
                 className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: `${color}30` }}
               >
                 <Icon size={16} style={{ color }} />
               </div>
               <span className="text-xs text-slate-400">{label}</span>
             </div>
            <p
              className="text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${color}, #06B6D4)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </p>
             <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Trend Chart */}
         <div
           className="rounded-xl p-5 backdrop-blur-xl"
           style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
         >
           <h3 className="text-sm font-semibold text-white mb-3">完成率趋势（最近30天）</h3>
          <ReactECharts option={lineOption} style={{ height: '260px' }} theme="ud" />
        </div>

         {/* Pie Chart */}
         <div
           className="rounded-xl p-5 backdrop-blur-xl"
           style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
         >
           <h3 className="text-sm font-semibold text-white mb-3">任务类型分布</h3>
          <ReactECharts option={pieOption} style={{ height: '260px' }} theme="ud" />
        </div>
      </div>

      {/* Calendar Heatmap */}
       <div
         className="rounded-xl p-5 backdrop-blur-xl"
         style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
       >
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-semibold text-white">学习日历</h3>
           <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>少</span>
            <div className="flex gap-1">
              {[0.1, 0.25, 0.5, 1].map((level, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: getCellColor(level) }}
                />
              ))}
            </div>
            <span>多</span>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-1">
          {calendarCells.map((cell, idx) => (
            <div
              key={idx}
              title={`${cell.date}: ${Math.round(cell.rate * 100)}%`}
              className="aspect-square rounded-sm transition-transform hover:scale-125 cursor-pointer"
              style={{
                backgroundColor: getCellColor(cell.rate),
                boxShadow: getCellGlow(cell.rate),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsTab;
