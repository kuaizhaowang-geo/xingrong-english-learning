import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StudyReportItem } from '@shared/api.interface';

interface DistributionChartsProps {
  report: StudyReportItem;
}

const MODULE_LABELS: Record<string, string> = {
  words: '单词学习',
  sentences: '句子练习',
  dictation: '听写练习',
  phonetic: '音标学习',
  aiQuiz: 'AI出题',
};

const NEON_COLORS = ['#6366F1', '#06B6D4', '#FFD166', '#EC4899', '#A855F7'];

function DistributionCharts({ report }: DistributionChartsProps) {
  const pieOption: EChartsOption = useMemo(() => {
    const data = Object.entries(report.moduleStats).map(([key, value], idx) => ({
      name: MODULE_LABELS[key] ?? key,
      value,
      itemStyle: { color: NEON_COLORS[idx % NEON_COLORS.length] },
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
          radius: ['45%', '70%'],
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
  }, [report]);

  const radarOption: EChartsOption = useMemo(() => {
    const { accuracyStats } = report;
    const indicators = [
      { name: '英语单词' },
      { name: '英语句子' },
      { name: '英语听力' },
      { name: '音标' },
      { name: '语文' },
    ];

    const values = [
      accuracyStats.words,
      accuracyStats.sentences,
      accuracyStats.dictation,
      accuracyStats.phonetic,
      report.subjectStats.chinese,
    ];

    return {
      backgroundColor: 'transparent',
       tooltip: {
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
       },
       radar: {
        indicator: indicators,
        center: ['50%', '50%'],
        radius: '60%',
        splitNumber: 4,
        axisName: {
          color: '#94A3B8',
          fontSize: 12,
        },
         splitLine: {
           lineStyle: { color: 'rgba(255, 255, 255, 0.08)' },
         },
         splitArea: {
           show: true,
           areaStyle: {
             color: ['rgba(168, 85, 247, 0.02)', 'rgba(168, 85, 247, 0.05)'],
           },
         },
         axisLine: {
           lineStyle: { color: 'rgba(255, 255, 255, 0.08)' },
         },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '能力值',
               itemStyle: { color: '#A855F7' },
               lineStyle: {
                 color: '#A855F7',
                 width: 2,
                 shadowColor: 'rgba(168, 85, 247, 0.5)',
                 shadowBlur: 10,
               },
               areaStyle: {
                 color: {
                   type: 'radial',
                   x: 0.5,
                   y: 0.5,
                   r: 0.5,
                   colorStops: [
                     { offset: 0, color: 'rgba(168, 85, 247, 0.3)' },
                     { offset: 1, color: 'rgba(168, 85, 247, 0.08)' },
                   ],
                 },
               },
            },
          ],
        },
      ],
    };
  }, [report]);

  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
       <div className="rounded-xl p-4 sm:p-5 glass-card">
         <h3 className="text-sm font-semibold text-white mb-3">
           模块使用占比
         </h3>
        <ReactECharts
          option={pieOption}
          style={{ height: '300px' }}
          theme="ud"
        />
      </div>

       <div className="rounded-xl p-4 sm:p-5 glass-card">
         <h3 className="text-sm font-semibold text-white mb-3">
           学科能力雷达图
         </h3>
        <ReactECharts
          option={radarOption}
          style={{ height: '300px' }}
          theme="ud"
        />
      </div>
    </div>
  );
}

export default DistributionCharts;
