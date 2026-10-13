import { useMemo } from 'react';
import type { StudyReportItem } from '@shared/api.interface';

interface HeatmapCalendarProps {
  report: StudyReportItem;
}

function HeatmapCalendar({ report }: HeatmapCalendarProps) {
  const cells = useMemo(() => {
    const dailyData = report.dailyData;
    const maxDuration = Math.max(...dailyData.map((d) => d.duration), 1);
    return dailyData.map((d) => ({
      date: d.date,
      duration: d.duration,
      level: d.duration / maxDuration,
    }));
  }, [report]);

  const getCellColor = (level: number): string => {
    if (level === 0) return 'rgba(255, 255, 255, 0.05)';
    if (level < 0.25) return 'rgba(168, 85, 247, 0.2)';
    if (level < 0.5) return 'rgba(168, 85, 247, 0.5)';
    if (level < 0.75) return '#A855F7';
    return '#06B6D4';
  };

  const getCellGlow = (level: number): string => {
    if (level >= 0.75) return '0 0 10px rgba(34, 211, 238, 0.7)';
    if (level >= 0.5) return '0 0 8px rgba(168, 85, 247, 0.6)';
    if (level >= 0.25) return '0 0 4px rgba(168, 85, 247, 0.3)';
    return 'none';
  };

  // Arrange by weeks (columns = weeks, rows = days of week)
  const weeks = useMemo(() => {
    if (cells.length === 0) return [];
    const result: typeof cells[] = [];
    let currentWeek: typeof cells = [];

    // Find the weekday of the first date (0 = Sunday, 1 = Monday, ...)
    const firstDate = new Date(cells[0].date);
    const firstDayOfWeek = firstDate.getDay();

    // Pad empty cells at the start
    for (let i = 0; i < firstDayOfWeek; i += 1) {
      currentWeek.push({ date: '', duration: 0, level: -1 });
    }

    for (const cell of cells) {
      const dayOfWeek = new Date(cell.date).getDay();
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [cells]);

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="rounded-xl p-3 sm:p-5 glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">学习日历热力图</h3>
         <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>少</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
              <div
                key={i}
               className="w-3 h-3 rounded-sm"
                 style={{ backgroundColor: level === 0 ? 'rgba(255, 255, 255, 0.05)' : getCellColor(level) }}
              />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1 mr-1">
          {weekdayLabels.map((label, i) => (
            <div
              key={i}
               className="w-4 h-3 text-[10px] text-slate-400 flex items-center justify-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={cell.date ? `${cell.date}: ${cell.duration} 分钟` : ''}
                  className="w-3 h-3 rounded-sm transition-transform hover:scale-125"
                  style={{
                    backgroundColor:
                      cell.level === -1 ? 'transparent' : getCellColor(cell.level),
                    boxShadow: cell.level >= 0 ? getCellGlow(cell.level) : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeatmapCalendar;
