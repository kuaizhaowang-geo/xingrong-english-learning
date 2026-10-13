import React from 'react';
import { Brain, Target, Clock, Zap, CheckCircle2, Circle, Play } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { WordRecordLite } from './WordCardGrid';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface LearningStatsTabProps {
  record?: WordRecordLite;
  onStartRecite: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: '未学习',
  learning: '学习中',
  mastered: '已掌握',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-slate-400 bg-slate-500/20 border-slate-500/40',
  learning: 'text-violet-400 bg-violet-500/20 border-violet-500/40',
  mastered: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
};

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = dayjs(dateStr);
  const now = dayjs();
  const diff = d.diff(now, 'day');
  if (Math.abs(diff) < 1) {
    return d.isSame(now, 'day') ? '今天' : d.fromNow();
  }
  if (diff === -1) return '昨天';
  if (diff === 1) return '明天';
  return d.fromNow();
}

const LearningStatsTab: React.FC<LearningStatsTabProps> = ({ record, onStartRecite }) => {
  const correctRate = record && record.reviewCount > 0
    ? Math.round((record.correctCount / record.reviewCount) * 100)
    : 0;

  const statusLabel = record ? (STATUS_LABELS[record.status] || '未学习') : '未学习';
  const statusColor = record ? (STATUS_COLORS[record.status] || STATUS_COLORS.new) : STATUS_COLORS.new;

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/70
          flex items-center justify-center mb-4
          border border-slate-700/50">
          <Brain size={28} className="text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          还未学习这个单词
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          开始学习后这里会显示你的学习数据
        </p>
        <button
          onClick={onStartRecite}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            text-white text-sm font-medium
            shadow-lg shadow-violet-500/30
            transition-all duration-300
            active:scale-95"
        >
          <Play size={16} />
          开始学习
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 熟练度进度条 */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            <span className="text-sm font-medium text-slate-300">熟练度</span>
          </div>
          <span className="text-sm font-bold text-white">
            {record.familiarity}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-700/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400
              transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, record.familiarity))}%` }}
          />
        </div>
      </div>

      {/* 学习统计 2x2 网格 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50
          flex flex-col items-center">
          <Target size={16} className="text-violet-400 mb-1.5" />
          <span className="text-xs text-slate-400 mb-1">复习次数</span>
          <span className="text-xl font-bold text-white">
            {record.reviewCount}
            <span className="text-xs font-normal text-slate-400 ml-1">次</span>
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50
          flex flex-col items-center">
          <Zap size={16} className="text-cyan-400 mb-1.5" />
          <span className="text-xs text-slate-400 mb-1">正确率</span>
          <span className="text-xl font-bold text-white">
            {correctRate}
            <span className="text-xs font-normal text-slate-400 ml-1">%</span>
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50
          flex flex-col items-center">
          <CheckCircle2 size={16} className="text-emerald-400 mb-1.5" />
          <span className="text-xs text-slate-400 mb-1">正确次数</span>
          <span className="text-xl font-bold text-white">
            {record.correctCount}
            <span className="text-xs font-normal text-slate-400 ml-1">次</span>
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50
          flex flex-col items-center">
          <Circle size={16} className="text-rose-400 mb-1.5" />
          <span className="text-xs text-slate-400 mb-1">错误次数</span>
          <span className="text-xl font-bold text-white">
            {record.wrongCount}
            <span className="text-xs font-normal text-slate-400 ml-1">次</span>
          </span>
        </div>
      </div>

      {/* 记忆信息 */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-slate-300">记忆信息</span>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">学习状态</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">艾宾浩斯等级</span>
            <span className="text-white font-medium">
              Lv.{record.ebbinghausLevel}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">上次学习</span>
            <span className="text-slate-200">
              {formatRelativeTime(record.lastReviewedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">下次复习</span>
            <span className="text-cyan-300">
              {formatRelativeTime(record.nextReviewAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStatsTab;
