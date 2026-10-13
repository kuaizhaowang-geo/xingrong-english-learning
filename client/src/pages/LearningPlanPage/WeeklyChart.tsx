import React from 'react';
import { BarChart3 } from 'lucide-react';

interface DailyData {
  day: string;
  minutes: number;
  isToday?: boolean;
}

interface WeeklyChartProps {
  data: DailyData[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const maxMinutes = Math.max(...data.map((d: DailyData) => d.minutes), 1);

  return (
    <div
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
      style={{
         background: 'rgba(255, 255, 255, 0.9)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
         backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5" style={{ color: '#6366F1' }} />
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
            本周完成情况
         </h3>
      </div>

      <div className="relative">
        {/* Y-axis labels + bars */}
        <div className="flex items-end gap-2 md:gap-4 h-36 sm:h-48">
          {data.map((item: DailyData, index: number) => {
            const heightPercent = (item.minutes / maxMinutes) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                {/* Value label on top */}
                <span
                  className="text-xs font-medium mb-2"
                  style={{ color: item.isToday ? '#06B6D4' : '#94A3B8' }}
                >
                  {item.minutes}
                </span>
                {/* Bar */}
                <div
                   className="w-full max-w-6 sm:max-w-8 rounded-t-lg relative overflow-hidden transition-all duration-500"
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: item.minutes > 0 ? '8px' : '2px',
                    background: item.isToday
                      ? 'linear-gradient(to top, #2563EB, #06B6D4)'
                      : 'linear-gradient(to top, #4C1D95, #6366F1)',
                    boxShadow: item.isToday
                      ? '0 0 12px rgba(34, 211, 238, 0.4)'
                      : '0 0 8px rgba(99, 102, 241, 0.2)',
                  }}
                >
                  {/* Top highlight */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                    style={{
                      background: item.isToday
                        ? 'rgba(255, 255, 255, 0.4)'
                        : 'rgba(255, 255, 255, 0.25)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-2 md:gap-4 mt-3">
          {data.map((item: DailyData, index: number) => (
            <div key={index} className="flex-1 text-center">
              <span
                className="text-xs"
                style={{
                  color: item.isToday ? '#06B6D4' : '#64748B',
                  fontWeight: item.isToday ? 600 : 400,
                }}
              >
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.08)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'linear-gradient(to top, #4C1D95, #6366F1)' }}
          />
          <span className="text-xs" style={{ color: '#94A3B8' }}>
            学习时长（分钟）
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: 'linear-gradient(to top, #2563EB, #06B6D4)' }}
          />
          <span className="text-xs" style={{ color: '#94A3B8' }}>
            今天
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;
