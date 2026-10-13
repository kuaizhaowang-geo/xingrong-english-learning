import React from 'react';
import { Calendar, Flame } from 'lucide-react';

interface DayCell {
  date: string;
  minutes: number;
  isToday?: boolean;
}

interface StreakCalendarProps {
  days: DayCell[];
  streakDays: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ days, streakDays }) => {
  // Get intensity level based on minutes
  const getIntensity = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 60) return 3;
    return 4;
  };

  const intensityColors: Record<number, string> = {
    0: 'rgba(99, 102, 241, 0.08)',
    1: 'rgba(99, 102, 241, 0.2)',
    2: 'rgba(99, 102, 241, 0.35)',
    3: 'rgba(99, 102, 241, 0.45)',
    4: '#6366F1',
  };

  const intensityBorders: Record<number, string> = {
    0: 'rgba(99, 102, 241, 0.08)',
    1: 'rgba(99, 102, 241, 0.15)',
    2: 'rgba(99, 102, 241, 0.25)',
    3: 'rgba(99, 102, 241, 0.3)',
    4: 'rgba(99, 102, 241, 0.5)',
  };

  // Organize into weeks (rows of 7)
  const weeks: DayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
      style={{
         background: 'rgba(255, 255, 255, 0.9)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
         backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#6366F1' }} />
           <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
             连续学习天数
          </h3>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(34, 211, 238, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <Flame className="w-4 h-4" style={{ color: '#F97316' }} />
          <span
            className="text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {streakDays} 天
          </span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day of week labels */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${weeks.length > 0 ? weeks[0].length : 7}, minmax(0, 1fr))` }}>
            {dayLabels.map((d: string, i: number) => (
              <div
                key={i}
                className="text-center text-xs"
                style={{ color: '#64748B' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells - columns oriented */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(days.length / 7)}, minmax(0, 1fr))` }}>
            {weeks.map((week: DayCell[], wi: number) => (
              <div key={wi} className="grid gap-1" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                {week.map((day: DayCell, di: number) => {
                  const intensity = getIntensity(day.minutes);
                  return (
                    <div
                      key={di}
                      className="aspect-square rounded-md transition-transform hover:scale-110 cursor-pointer relative group"
                      style={{
                        background: intensityColors[intensity],
                        border: `1px solid ${intensityBorders[intensity]}`,
                        boxShadow: day.isToday
                          ? '0 0 8px rgba(34, 211, 238, 0.6)'
                          : intensity > 2
                            ? '0 0 4px rgba(99, 102, 241, 0.25)'
                            : 'none',
                      }}
                      title={`${day.date}: ${day.minutes} 分钟`}
                    >
                      {day.isToday && (
                        <div
                          className="absolute inset-0 rounded-md border-2 animate-pulse"
                          style={{ borderColor: '#06B6D4' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.08)' }}>
        <span className="text-xs" style={{ color: '#64748B' }}>
          少
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level: number) => (
            <div
              key={level}
              className="w-4 h-4 rounded-sm"
              style={{
                background: intensityColors[level],
                border: `1px solid ${intensityBorders[level]}`,
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: '#64748B' }}>
          多
        </span>
      </div>
    </div>
  );
};

export default StreakCalendar;
