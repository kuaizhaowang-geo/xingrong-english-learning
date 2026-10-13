import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StudyReportItem } from '@shared/api.interface';

interface SubjectStatsCardProps {
  report: StudyReportItem;
}

const SUBJECT_COLORS: Record<string, string> = {
  english: '#6366F1',
  chinese: '#06B6D4',
  math: '#F97316',
};

const SUBJECT_LABELS: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

function SubjectStatsCard({ report }: SubjectStatsCardProps) {
  const subjectStats: Record<string, number> = (report.subjectStats as unknown as Record<string, number>) ?? {};
  const subjectAccuracy: Record<string, number> = (report.subjectAccuracy as unknown as Record<string, number>) ?? {};

  const pieOption: EChartsOption = useMemo(() => {
    const data = Object.entries(subjectStats).map(([key, value]) => ({
      name: SUBJECT_LABELS[key] ?? key,
      value: value,
      itemStyle: { color: SUBJECT_COLORS[key] ?? '#6366F1' },
    }));

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'item',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
        formatter: (params) => {
          if (Array.isArray(params)) return '';
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}: ${p.value} 分钟 (${p.percent}%)`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        textStyle: { color: '#94A3B8', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: { show: false },
          emphasis: {
            label: { show: false },
          },
          data,
        },
      ],
    };
  }, [subjectStats]);

  const barOption: EChartsOption = useMemo(() => {
    const subjects = Object.keys(subjectAccuracy);
    const values = subjects.map(
      (s) => Math.round((subjectAccuracy as Record<string, number>)[s]) ?? 0,
    );
    const colors = subjects.map((s) => SUBJECT_COLORS[s] ?? '#6366F1');
    const labels = subjects.map((s) => SUBJECT_LABELS[s] ?? s);

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
         axisPointer: { type: 'shadow' },
       },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
         axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
         axisLabel: { color: '#94A3B8', fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' },
         splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: colors[i] },
                  { offset: 1, color: `${colors[i]}40` },
                ],
              },
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: '40%',
        },
      ],
    };
  }, [subjectAccuracy]);

  const totalMinutes = Object.values(subjectStats).reduce(
    (acc: number, v: number) => acc + v,
    0,
  );
  const avgAccuracy = Object.values(subjectAccuracy).reduce(
    (acc: number, v: number) => acc + v,
    0,
  ) / Math.max(1, Object.keys(subjectAccuracy).length);

  return (
    <div className="rounded-xl p-4 sm:p-5 h-full glass-card">
      <h3 className="text-sm font-semibold text-white mb-4">
        各学科学习统计
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-2 text-center">学习时长占比</p>
          <ReactECharts
            option={pieOption}
            style={{ height: '220px' }}
            theme="ud"
          />
        </div>
        <div>
           <p className="text-xs text-slate-400 mb-2 text-center">各学科正确率</p>
          <ReactECharts
            option={barOption}
            style={{ height: '220px' }}
            theme="ud"
          />
        </div>
      </div>

       <div className="mt-4 pt-4 flex items-center justify-between text-xs border-t border-white/10">
         <span className="text-slate-400">
            总学时：<span className="text-white font-medium">{totalMinutes} 分钟</span>
         </span>
         <span className="text-slate-400">
           平均正确率：<span className="text-cyan-400 font-medium">{Math.round(avgAccuracy)}%</span>
         </span>
      </div>
    </div>
  );
}

export default SubjectStatsCard;
