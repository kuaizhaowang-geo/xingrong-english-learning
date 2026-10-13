import React, { useState, useEffect } from 'react';
import { Clock, CalendarDays, TrendingUp } from 'lucide-react';
import { getStorageItem, setStorageItem, getTodayStr } from '@client/src/utils/storage';

interface StudyTimeData {
  updatedAt: string;
  totalHours: number;
  todayMinutes: number;
  monthHours: number;
}

const STORAGE_KEY = 'home_study_time_data';

function loadData(): StudyTimeData {
  const stored = getStorageItem<StudyTimeData | null>(STORAGE_KEY, null);
  const today = getTodayStr();
  if (stored && stored.updatedAt === today) return stored;

  const data: StudyTimeData = {
    updatedAt: today,
    totalHours: 12.5 + Math.random() * 5,
    todayMinutes: 30 + Math.floor(Math.random() * 45),
    monthHours: 3.2 + Math.random() * 2,
  };
  setStorageItem(STORAGE_KEY, data);
  return data;
}

function formatHours(hours: number): string {
  return hours.toFixed(1);
}

interface TimeStatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  unit: string;
  color: string;
}

const TimeStat: React.FC<TimeStatProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  color,
}) => (
  <div className="flex-1 text-center p-2">
    <div
      className="w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 rounded-xl flex items-center justify-center"
      style={{ background: `${color}15`, color }}
    >
      <Icon size={16} className="sm:hidden" />
      <Icon size={20} className="hidden sm:block" />
    </div>
    <div className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5">
      {value}
      <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">{unit}</span>
    </div>
    <div className="text-[11px] sm:text-xs text-slate-400">{label}</div>
  </div>
);

const StudyTimeStats: React.FC = () => {
  const [data, setData] = useState<StudyTimeData>(() => loadData());

  useEffect(() => {
    setStorageItem(STORAGE_KEY, data);
  }, [data]);

  return (
    <section className="glass-card p-4 sm:p-5">
      <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span
          className="w-1 h-4 rounded-full"
          style={{ background: '#D946EF' }}
        />
        学习时长
      </h2>

      <div className="flex items-stretch justify-around gap-1 sm:gap-2">
        <TimeStat
          icon={TrendingUp}
          label="累计"
          value={formatHours(data.totalHours)}
          unit="小时"
          color="#D946EF"
        />

        <div className="w-px self-stretch bg-white/10" />

        <TimeStat
          icon={Clock}
          label="今日"
          value={String(data.todayMinutes)}
          unit="分钟"
          color="#22D3EE"
        />

        <div className="w-px self-stretch bg-white/10" />

        <TimeStat
          icon={CalendarDays}
          label="本月"
          value={formatHours(data.monthHours)}
          unit="小时"
          color="#A855F7"
        />
      </div>
    </section>
  );
};

export default StudyTimeStats;
