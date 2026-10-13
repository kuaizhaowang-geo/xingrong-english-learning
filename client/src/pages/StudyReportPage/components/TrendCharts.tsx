import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StudyReportItem } from '@shared/api.interface';

interface TrendChartsProps {
  report: StudyReportItem;
}

function TrendCharts({ report }: TrendChartsProps) {
  const durationOption: EChartsOption = useMemo(() => {
    const dates = report.dailyData.map((d) => d.date.slice(5));
    const durations = report.dailyData.map((d) => d.duration);

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
         formatter: (params) => {
           const list = Array.isArray(params) ? params : [params];
           return `${list[0].name}<br/>学习时长: ${list[0].value} 分钟`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
         axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
         axisLabel: {
           color: '#94A3B8',
           fontSize: 10,
           interval: Math.floor(dates.length / 8),
         },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}分' },
         splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
      },
      series: [
        {
          type: 'line',
          data: durations,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
           itemStyle: { color: '#A855F7' },
           lineStyle: {
             width: 2,
             color: {
               type: 'linear',
               x: 0,
               y: 0,
               x2: 1,
               y2: 0,
               colorStops: [
                 { offset: 0, color: '#A855F7' },
                 { offset: 1, color: '#6366F1' },
               ],
             },
             shadowColor: 'rgba(168, 85, 247, 0.5)',
             shadowBlur: 10,
           },
           areaStyle: {
             color: {
               type: 'linear',
               x: 0,
               y: 0,
               x2: 0,
               y2: 1,
               colorStops: [
                 { offset: 0, color: 'rgba(168, 85, 247, 0.25)' },
                 { offset: 1, color: 'rgba(168, 85, 247, 0)' },
               ],
             },
           },
        },
      ],
    };
  }, [report]);

  const accuracyOption: EChartsOption = useMemo(() => {
    const dates = report.dailyData.map((d) => d.date.slice(5));
    const accuracies = report.dailyData.map((d) => Math.round(d.accuracy));

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
         formatter: (params) => {
           const list = Array.isArray(params) ? params : [params];
           return `${list[0].name}<br/>正确率: ${list[0].value}%`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
         axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
         axisLabel: {
           color: '#94A3B8',
           fontSize: 10,
           interval: Math.floor(dates.length / 8),
         },
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
          type: 'line',
          data: accuracies,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          itemStyle: { color: '#06B6D4' },
          lineStyle: {
            width: 2,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#06B6D4' },
                { offset: 1, color: '#2563EB' },
              ],
            },
            shadowColor: 'rgba(34, 211, 238, 0.5)',
            shadowBlur: 10,
          },
        },
      ],
    };
  }, [report]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div
        className="rounded-xl p-4 sm:p-5 glass-card"
       >
         <h3 className="text-sm font-semibold text-white mb-3">
           学习时长趋势
        </h3>
        <ReactECharts
          option={durationOption}
          style={{ height: '300px' }}
          theme="ud"
        />
      </div>

       <div className="rounded-xl p-4 sm:p-5 glass-card">
         <h3 className="text-sm font-semibold text-white mb-3">
           正确率趋势
        </h3>
        <ReactECharts
          option={accuracyOption}
          style={{ height: '300px' }}
          theme="ud"
        />
      </div>
    </div>
  );
}

export default TrendCharts;
