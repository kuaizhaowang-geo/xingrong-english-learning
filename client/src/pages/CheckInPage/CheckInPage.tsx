import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Flame,
  Clock,
  BookOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { checkInApi } from '@client/src/api';
import type { CheckInRecord } from '@shared/api.interface';
import { AppBadge } from '@client/src/components/ui/app-badges';

const CheckInPage: React.FC = () => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null);
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [stats, setStats] = useState({ continuousDays: 0, totalDays: 0, monthDays: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [statusRes, historyRes, statsRes] = await Promise.all([
        checkInApi.getTodayStatus(),
        checkInApi.getCheckInHistory(),
        checkInApi.getCheckInStats(),
      ]);
      setCheckedIn(statusRes.checkedIn);
      setTodayRecord(statusRes.record || null);
      setHistory(historyRes);
      setStats(statsRes);
    } catch (err) {
      logger.error('加载打卡数据失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (): Promise<void> => {
    if (checkedIn || checkingIn) return;
    try {
      setCheckingIn(true);
      const record = await checkInApi.checkIn({
        studyMinutes: 30,
        wordsLearned: 20,
        sentencesCompleted: 10,
      });
      setCheckedIn(true);
      setTodayRecord(record);
      setShowCelebrate(true);
      setStats((prev) => ({
        continuousDays: prev.continuousDays + 1,
        totalDays: prev.totalDays + 1,
        monthDays: prev.monthDays + 1,
      }));
      setTimeout(() => setShowCelebrate(false), 800);
    } catch (err) {
      logger.error('打卡失败', err as Error);
    } finally {
      setCheckingIn(false);
    }
  };

  const buildCalendarCells = (): { date: Date; status: 'checked' | 'today' | 'future' | 'past' }[] => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; status: 'checked' | 'today' | 'future' | 'past' }[] = [];
    const checkedSet = new Set(history.map((r: CheckInRecord) => r.checkInDate));

    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i));
      cells.push({ date: d, status: 'past' });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      let status: 'checked' | 'today' | 'future' | 'past' = 'past';
      if (dateStr === todayStr) {
        status = checkedIn ? 'checked' : 'today';
      } else if (d > today) {
        status = 'future';
      } else if (checkedSet.has(dateStr)) {
        status = 'checked';
      }
      cells.push({ date: d, status });
    }
    while (cells.length < 35) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date: d, status: 'future' });
    }
    return cells;
  };

  const calendarCells = buildCalendarCells();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthLabel = `${today.getFullYear()}年${today.getMonth() + 1}月`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-80 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <h1 className="text-xl font-semibold text-white">每日打卡</h1>

      {/* 庆祝动画 */}
      {showCelebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-none">
           <div className="glass-card rounded-2xl p-8 text-center shadow-2xl animate-bounce">
             <Sparkles className="w-16 h-16 mx-auto text-yellow-500 mb-3" />
              <div className="text-2xl font-bold text-white">打卡成功！</div>
              <div className="text-slate-300 mt-2">继续加油，坚持就是胜利 🎉</div>
          </div>
        </div>
      )}

      {/* 打卡卡片 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-400 text-white p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-sm">{todayStr}</div>
              <div className="text-3xl font-bold mt-2">
                {checkedIn ? '今日已打卡 ✨' : '今日还未打卡'}
              </div>
              <div className="flex items-center gap-2 mt-3 text-white/90">
                <Flame className="w-5 h-5" />
                <span>连续打卡 {stats.continuousDays} 天</span>
              </div>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={checkedIn || checkingIn}
              className={`px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-lg ${
                checkedIn
                  ? 'bg-teal-500 text-white cursor-default'
                  : 'bg-white/10 text-orange-400 hover:bg-orange-500/20 hover:scale-105 active:scale-95 border border-orange-500/30'
              }`}
            >
              {checkingIn ? '打卡中...' : checkedIn ? '今日已打卡' : '立即打卡'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 本月日历 */}
         <div className="glass-card p-5">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
               <Calendar className="w-5 h-5 text-orange-400" />
               <h2 className="text-lg font-semibold text-white">本月打卡</h2>
             </div>
             <span className="text-sm text-slate-400">{monthLabel}</span>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((w: string) => (
               <div key={w} className="text-center text-xs text-slate-500 py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx: number) => {
              const day = cell.date.getDate();
              return (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                     cell.status === 'checked'
                       ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                       : cell.status === 'today'
                         ? 'bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40'
                         : cell.status === 'future'
                           ? 'text-slate-600'
                           : 'text-slate-500'
                  }`}
                >
                  {cell.status === 'checked' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    day
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="space-y-4">
           <div className="glass-card p-5">
             <h2 className="text-lg font-semibold text-white mb-4">打卡统计</h2>
            <div className="grid grid-cols-3 gap-3">
               <div className="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                 <div className="text-2xl font-bold text-orange-400">{stats.totalDays}</div>
                 <div className="text-xs text-slate-400 mt-1">总打卡天数</div>
               </div>
               <div className="text-center p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                 <div className="text-2xl font-bold text-yellow-400">{stats.continuousDays}</div>
                 <div className="text-xs text-slate-400 mt-1">连续打卡</div>
               </div>
               <div className="text-center p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
                 <div className="text-2xl font-bold text-teal-400">{stats.monthDays}</div>
                 <div className="text-xs text-slate-400 mt-1">本月打卡</div>
               </div>
            </div>
          </div>

           <div className="glass-card p-5">
             <h2 className="text-lg font-semibold text-white mb-4">今日学习</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                     <Clock className="w-5 h-5 text-blue-400" />
                   </div>
                   <span className="text-slate-300">学习时长</span>
                </div>
                 <span className="font-semibold text-white">
                  {todayRecord?.studyMinutes || 0} 分钟
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center overflow-hidden">
                     <AppBadge variant="badge2" size={28} />
                   </div>
                   <span className="text-slate-300">学习单词</span>
                </div>
                 <span className="font-semibold text-white">
                  {todayRecord?.wordsLearned || 0} 个
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                     <MessageSquare className="w-5 h-5 text-teal-400" />
                   </div>
                   <span className="text-slate-300">完成句子</span>
                </div>
                 <span className="font-semibold text-white">
                  {todayRecord?.sentencesCompleted || 0} 句
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
