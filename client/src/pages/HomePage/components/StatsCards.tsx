import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  BookMarked,
  BookX,
  HelpCircle,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { getStorageItem, setStorageItem, getTodayStr } from '@client/src/utils/storage';

type StatsTab = 'total' | 'today' | 'yesterday' | 'week' | 'month';

interface StatsData {
  totalSentences: number;
  totalWords: number;
  studyMinutes: number;
  sentenceWrong: number;
  sentenceUnfamiliar: number;
  sentenceMastered: number;
  wordWrong: number;
  wordUnfamiliar: number;
  wordMastered: number;
}

interface StatsStorage {
  updatedAt: string;
  total: StatsData;
  today: StatsData;
  yesterday: StatsData;
  week: StatsData;
  month: StatsData;
}

const STORAGE_KEY = 'home_stats_data';

const defaultStats: StatsStorage = {
  updatedAt: getTodayStr(),
  total: {
    totalSentences: 1286,
    totalWords: 3542,
    studyMinutes: 4820,
    sentenceWrong: 142,
    sentenceUnfamiliar: 315,
    sentenceMastered: 829,
    wordWrong: 215,
    wordUnfamiliar: 583,
    wordMastered: 2744,
  },
  today: {
    totalSentences: 28,
    totalWords: 65,
    studyMinutes: 32,
    sentenceWrong: 4,
    sentenceUnfamiliar: 8,
    sentenceMastered: 16,
    wordWrong: 6,
    wordUnfamiliar: 13,
    wordMastered: 46,
  },
  yesterday: {
    totalSentences: 42,
    totalWords: 98,
    studyMinutes: 55,
    sentenceWrong: 6,
    sentenceUnfamiliar: 11,
    sentenceMastered: 25,
    wordWrong: 9,
    wordUnfamiliar: 20,
    wordMastered: 69,
  },
  week: {
    totalSentences: 386,
    totalWords: 892,
    studyMinutes: 520,
    sentenceWrong: 48,
    sentenceUnfamiliar: 96,
    sentenceMastered: 242,
    wordWrong: 78,
    wordUnfamiliar: 175,
    wordMastered: 639,
  },
  month: {
    totalSentences: 864,
    totalWords: 2150,
    studyMinutes: 1980,
    sentenceWrong: 98,
    sentenceUnfamiliar: 215,
    sentenceMastered: 551,
    wordWrong: 156,
    wordUnfamiliar: 412,
    wordMastered: 1582,
  },
};

function loadStats(): StatsStorage {
  const stored = getStorageItem<StatsStorage | null>(STORAGE_KEY, null);
  if (!stored) {
    setStorageItem(STORAGE_KEY, defaultStats);
    return defaultStats;
  }
  const today = getTodayStr();
  if (stored.updatedAt !== today) {
    const refreshed: StatsStorage = {
      ...stored,
      updatedAt: today,
      yesterday: stored.today,
      today: {
        totalSentences: 0,
        totalWords: 0,
        studyMinutes: 0,
        sentenceWrong: 0,
        sentenceUnfamiliar: 0,
        sentenceMastered: 0,
        wordWrong: 0,
        wordUnfamiliar: 0,
        wordMastered: 0,
      },
    };
    setStorageItem(STORAGE_KEY, refreshed);
    return refreshed;
  }
  return stored;
}

const tabLabels: Record<StatsTab, string> = {
  total: '总计',
  today: '今天',
  yesterday: '昨天',
  week: '本周',
  month: '本月',
};

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}分钟`;
}

interface MiniStatProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ icon: Icon, label, value, color }) => (
  <div className="text-center p-2 sm:p-3">
    <div
      className="w-8 h-8 sm:w-9 sm:h-9 mx-auto mb-1 sm:mb-1.5 rounded-lg flex items-center justify-center"
      style={{ background: `${color}15`, color }}
    >
      <Icon size={14} className="sm:hidden" />
      <Icon size={16} className="hidden sm:block" />
    </div>
    <div className="text-base sm:text-lg font-bold" style={{ color }}>
      {value.toLocaleString()}
    </div>
    <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{label}</div>
  </div>
);

const StatsCards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StatsTab>('total');
  const [stats, setStats] = useState<StatsStorage>(() => loadStats());

  useEffect(() => {
    setStorageItem(STORAGE_KEY, stats);
  }, [stats]);

  const currentData = useMemo(() => stats[activeTab], [stats, activeTab]);

  return (
    <section className="glass-card p-4 sm:p-5">
      {/* 标题 + Tab 切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 flex-shrink-0">
          <span
            className="w-1 h-4 rounded-full"
            style={{ background: '#D946EF' }}
          />
          学习统计
        </h2>

        <div className="flex p-0.5 rounded-lg bg-white/5 gap-0.5 overflow-x-auto scrollbar-hide border border-white/10">
          {(Object.keys(tabLabels) as StatsTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center ${
                activeTab === tab
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* 大数字：完成句子 + 完成单词 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="text-center p-3 sm:p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <MessageCircle size={14} className="sm:hidden" style={{ color: '#D946EF' }} />
            <MessageCircle size={16} className="hidden sm:inline" style={{ color: '#D946EF' }} />
            <span className="text-[11px] sm:text-xs text-slate-400">完成句子</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#D946EF' }}>
            {currentData.totalSentences.toLocaleString()}
            <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">个</span>
          </div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <BookMarked size={14} className="sm:hidden" style={{ color: '#22D3EE' }} />
            <BookMarked size={16} className="hidden sm:inline" style={{ color: '#22D3EE' }} />
            <span className="text-[11px] sm:text-xs text-slate-400">完成单词</span>
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: '#22D3EE' }}>
            {currentData.totalWords.toLocaleString()}
            <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">个</span>
          </div>
        </div>
      </div>

      {/* 句子分类 */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 mb-2.5 flex items-center gap-1">
          <span className="w-1 h-3 rounded-full bg-fuchsia-400" />
          句子分类
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <MiniStat
            icon={BookX}
            label="句子错题本"
            value={currentData.sentenceWrong}
            color="#EF476F"
          />
          <MiniStat
            icon={HelpCircle}
            label="不熟悉句子"
            value={currentData.sentenceUnfamiliar}
            color="#FFD166"
          />
          <MiniStat
            icon={CheckCircle2}
            label="已掌握句子"
            value={currentData.sentenceMastered}
            color="#2EC4B6"
          />
        </div>
      </div>

      {/* 单词分类 */}
      <div>
        <div className="text-xs text-slate-400 mb-2.5 flex items-center gap-1">
          <span className="w-1 h-3 rounded-full bg-cyan-400" />
          单词分类
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <MiniStat
            icon={BookX}
            label="单词错题本"
            value={currentData.wordWrong}
            color="#EF476F"
          />
           <MiniStat
             icon={BookX}
             label="不熟悉单词"
             value={currentData.wordUnfamiliar}
             color="#FFD166"
           />
          <MiniStat
            icon={GraduationCap}
            label="已掌握单词"
            value={currentData.wordMastered}
            color="#2EC4B6"
          />
        </div>
      </div>

      {/* 底部时间说明 */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <span className="text-xs text-slate-400">
          数据更新：{stats.updatedAt} · 学习时长 {formatTime(currentData.studyMinutes)}
        </span>
      </div>
    </section>
  );
};

export default StatsCards;
