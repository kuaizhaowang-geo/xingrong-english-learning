import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, Calendar, Trophy, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { checkInApi } from '@client/src/api';
import type { CheckInRecord } from '@shared/api.interface';

const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];

function buildMonthCalendar(
  year: number,
  month: number,
): Array<{ date: string | null; day: number | null }> {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ date: null, day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, day: d });
  }
  return cells;
}

function calcStats(dates: string[]): { continuousDays: number; maxStreak: number; totalDays: number } {
  if (dates.length === 0) return { continuousDays: 0, maxStreak: 0, totalDays: 0 };

  const sorted = [...dates].sort();
  const totalDays = sorted.length;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateSet = new Set(sorted);
  let continuousDays = 0;
  const d = new Date();
  if (!dateSet.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dateSet.has(dateStr)) {
      continuousDays++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  let maxStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return { continuousDays: Math.max(continuousDays, 0), maxStreak, totalDays };
}

const CheckInCalendar: React.FC = () => {
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [stats, setStats] = useState({ continuousDays: 0, maxStreak: 0, totalDays: 0 });
  const [todayChecked, setTodayChecked] = useState(false);
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [apiError, setApiError] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarCells = useMemo(
    () => buildMonthCalendar(today.getFullYear(), today.getMonth()),
    [today.getFullYear(), today.getMonth()],
  );

  const checkInDateSet = useMemo(
    () => new Set(checkInDates),
    [checkInDates],
  );

  const monthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const monthCheckIns = checkInDates.filter(
    (d) => d.startsWith(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`),
  ).length;

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        checkInApi.getTodayStatus(),
        checkInApi.getCheckInHistory(),
      ]);

      setTodayChecked(statusRes.checkedIn);
      if (statusRes.record) {
        setTodayRecord(statusRes.record);
      }

      const dates: string[] = historyRes.map((r: CheckInRecord) => r.checkInDate);
      setCheckInDates(dates);
      setStats(calcStats(dates));
      setApiError(false);
    } catch (err) {
      logger.warn('打卡数据加载失败', err as Error);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckIn = async (): Promise<void> => {
    if (todayChecked || checkingIn) return;
    try {
      setCheckingIn(true);
      const record = await checkInApi.checkIn();
      const newDates = [...checkInDates, record.checkInDate];
      setCheckInDates(newDates);
      setStats(calcStats(newDates));
      setTodayChecked(true);
      setTodayRecord(record);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1200);
    } catch (err) {
      logger.warn('打卡失败', err as Error);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <section className="glass-card p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse p-2 sm:p-3 rounded-xl bg-white/10 h-20" />
          ))}
        </div>
        <div className="animate-pulse h-11 rounded-lg bg-white/10 mb-4" />
        <div className="space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-1">
              {[...Array(7)].map((_, j) => (
                <div key={j} className="aspect-square animate-pulse bg-white/5 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card p-4 sm:p-5">
      {/* 顶部三栏统计 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="text-center p-2 sm:p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame size={12} className="sm:hidden" style={{ color: '#D946EF' }} />
            <Flame size={14} className="hidden sm:inline" style={{ color: '#D946EF' }} />
            <span className="text-[11px] sm:text-xs text-slate-400">当前连续</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#D946EF' }}>
            {stats.continuousDays}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-0.5">天</span>
          </div>
        </div>
        <div className="text-center p-2 sm:p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy size={12} className="sm:hidden" style={{ color: '#22D3EE' }} />
            <Trophy size={14} className="hidden sm:inline" style={{ color: '#22D3EE' }} />
            <span className="text-[11px] sm:text-xs text-slate-400">最高连续</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#22D3EE' }}>
            {stats.maxStreak}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-0.5">天</span>
          </div>
        </div>
        <div className="text-center p-2 sm:p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar size={12} className="sm:hidden" style={{ color: '#A855F7' }} />
            <Calendar size={14} className="hidden sm:inline" style={{ color: '#A855F7' }} />
            <span className="text-[11px] sm:text-xs text-slate-400">累计打卡</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: '#A855F7' }}>
            {stats.totalDays}
            <span className="text-[10px] sm:text-xs font-normal text-slate-400 ml-0.5">天</span>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-slate-400">
          完成学习即可打卡
        </span>
        {apiError && (
          <span className="text-slate-500">数据加载失败</span>
        )}
      </div>

      {/* 打卡按钮 */}
      <button
        onClick={handleCheckIn}
        disabled={todayChecked || checkingIn}
        className={`w-full py-2.5 h-11 rounded-lg font-medium text-sm mb-4 transition-all ${
          todayChecked
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
            : checkingIn
              ? 'bg-white/10 text-slate-500 cursor-wait'
              : 'bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow-sm hover:shadow-md active:scale-[0.98]'
        }`}
      >
        {todayChecked ? (
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles size={14} /> 今日已打卡
          </span>
        ) : checkingIn ? (
          '打卡中...'
        ) : (
          '立即打卡'
        )}
      </button>

      {/* 月历标题 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">
          {today.getFullYear()}年{today.getMonth() + 1}月
        </h3>
        <span className="text-xs text-slate-400">
          本月 <span className="text-fuchsia-400 font-medium">{monthCheckIns}</span>/{monthDays} 天
        </span>
      </div>

      {/* 星期头部 */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {weekLabels.map((w) => (
            <div key={w} className="text-center text-xs text-slate-500 py-1">
            {w}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          if (!cell.date || !cell.day) {
            return <div key={idx} className="aspect-square" />;
          }
          const isToday = cell.date === todayStr;
          const isChecked = checkInDateSet.has(cell.date);
          const isFuture = new Date(cell.date) > new Date(todayStr);

          let cellClass = 'aspect-square flex items-center justify-center rounded-lg text-xs transition-all';
          let cellStyle: React.CSSProperties = {};

          if (isToday) {
            cellStyle = {
              background: 'linear-gradient(135deg, #D946EF, #A855F7)',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 0 10px rgba(217, 70, 239, 0.5)',
            };
          } else if (isChecked) {
            cellStyle = {
              background: 'rgba(217, 70, 239, 0.15)',
              color: '#D946EF',
              fontWeight: 500,
              border: '1px solid rgba(217, 70, 239, 0.3)',
            };
          } else if (isFuture) {
            cellStyle = { color: '#64748B' };
          } else {
            cellStyle = { color: '#CBD5E1' };
          }

          return (
            <div key={idx} className={cellClass} style={cellStyle}>
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* 底部图例 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(217, 70, 239, 0.15)', border: '1px solid rgba(217, 70, 239, 0.3)' }} />
          <span>已打卡</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: '#FF6B35' }} />
          <span>今天</span>
        </div>
      </div>

      {/* 庆祝动画占位（保持 showCelebration 状态） */}
      {showCelebration && <div className="hidden" />}
    </section>
  );
};

export default CheckInCalendar;
