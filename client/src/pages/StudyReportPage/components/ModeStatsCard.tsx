import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { StudyReportItem, ModeStatItem } from '@shared/api.interface';

interface ModeStatsCardProps {
  report: StudyReportItem;
}

const MODE_LABELS: Record<string, string> = {
  typing: '打字练习',
  dictation: '听写练习',
  shadowing: '跟读练习',
  watchSpeak: '看说练习',
  aiQuiz: 'AI出题',
  phonetic: '音标学习',
};

const MODE_COLORS = ['#6366F1', '#2563EB', '#06B6D4', '#A855F7', '#EC4899', '#F97316'];

function ModeStatsCard({ report }: ModeStatsCardProps) {
  const modeStatsV2 = report.modeStatsV2 ?? {};
  const modes = Object.entries(modeStatsV2) as [string, ModeStatItem][];

  const barOption: EChartsOption = useMemo(() => {
    const labels = modes.map(([key]) => MODE_LABELS[key] ?? key);
    const values = modes.map(([, item]) => item.count);

    return {
      backgroundColor: 'transparent',
       tooltip: {
         trigger: 'axis',
         backgroundColor: 'rgba(15, 13, 36, 0.95)',
         borderColor: 'rgba(168, 85, 247, 0.3)',
         textStyle: { color: '#E2E8F0' },
        axisPointer: { type: 'shadow' },
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
         splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.06)' } },
      },
      yAxis: {
        type: 'category',
        data: labels,
         axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        axisTick: { show: false },
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
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: `${MODE_COLORS[i % MODE_COLORS.length]}60` },
                  { offset: 1, color: MODE_COLORS[i % MODE_COLORS.length] },
                ],
              },
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '55%',
        },
      ],
    };
  }, [report]);

  return (
    <div className="rounded-xl p-4 sm:p-5 h-full glass-card">
       <h3 className="text-sm font-semibold text-white mb-4">
        学习模式统计
      </h3>

      <div style={{ height: '220px' }}>
        <ReactECharts
          option={barOption}
          style={{ height: '100%' }}
          theme="ud"
        />
      </div>

      <div
          className="mt-3 sm:mt-4 pt-3 sm:pt-4 grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 border-t border-white/10"
       >
        {modes.map(([key, item], idx) => (
          <div
            key={key}
            className="p-3 rounded-lg"
            style={{
              backgroundColor: `${MODE_COLORS[idx % MODE_COLORS.length]}10`,
              border: `1px solid ${MODE_COLORS[idx % MODE_COLORS.length]}30`,
            }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: MODE_COLORS[idx % MODE_COLORS.length] }}
            >
              {MODE_LABELS[key] ?? key}
            </p>
             <p className="text-sm font-bold text-white">
              {item.count} 次
            </p>
             <p className="text-xs text-slate-400 mt-0.5">
              正确率 {Math.round(item.accuracy)}%
              {item.avgScore !== undefined && ` · ${item.avgScore}分`}
              {item.avgSpeed !== undefined && ` · ${item.avgSpeed}s/题`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModeStatsCard;
