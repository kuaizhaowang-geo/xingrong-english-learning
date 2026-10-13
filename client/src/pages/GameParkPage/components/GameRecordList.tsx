import React, { useState, useEffect } from 'react';
import { Clock, Target, Award, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getGameRecords } from '@client/src/api/games';
import type { GameType, GameRecord } from '@shared/api.interface';

const GAME_TABS: Array<{ value: GameType | 'all'; label: string; color: string }> = [
  { value: 'all', label: '全部', color: 'gray' },
  { value: 'whack_mole', label: '单词打地鼠', color: 'yellow' },
  { value: 'word_match', label: '单词消消乐', color: 'pink' },
  { value: 'word_runner', label: '单词跑酷', color: 'cyan' },
  { value: 'word_tetris', label: '单词方块', color: 'violet' },
  { value: 'word_shooting', label: '听力射击', color: 'rose' },
  { value: 'math_battle', label: '口算比拼', color: 'blue' },
  { value: 'word_pk', label: '单词PK', color: 'orange' },
  { value: 'poetry_chain', label: '古诗接龙', color: 'red' },
];

const GAME_LABELS: Record<GameType, { name: string; icon: string; color: string }> = {
  math_battle: { name: '口算比拼', icon: '🧮', color: 'blue' },
  word_pk: { name: '单词PK', icon: '📝', color: 'orange' },
  poetry_chain: { name: '古诗接龙', icon: '🏮', color: 'red' },
  whack_mole: { name: '单词打地鼠', icon: '🐹', color: 'yellow' },
  word_match: { name: '单词消消乐', icon: '🃏', color: 'pink' },
  word_runner: { name: '单词跑酷', icon: '🏃', color: 'cyan' },
  word_tetris: { name: '单词方块', icon: '🧱', color: 'violet' },
  word_shooting: { name: '听力射击', icon: '🎯', color: 'rose' },
};

const GameRecordList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameType | 'all'>('all');
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 20;

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const gameType = activeTab === 'all' ? undefined : activeTab;
        const data = await getGameRecords({ gameType, page, pageSize });
        if (!cancelled) {
          setRecords(data.items);
          setTotal(data.total);
        }
      } catch (err) {
        logger.error('加载游戏记录失败', err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, page]);

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatDuration = (sec: number): string => {
    if (sec < 60) return `${sec}秒`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${s}秒`;
  };

  const getColorClasses = (color: string): { bg: string; text: string; border: string } => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
      gray: { bg: 'bg-white/5', text: 'text-slate-300', border: 'border-white/10' },
    };
    return map[color] ?? map.gray;
  };

  return (
    <div className="space-y-4">
      {/* 游戏类型 Tab */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GAME_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                   ? 'bg-orange-500 text-white shadow-md'
                   : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 记录列表 */}
      {loading && (
         <div className="text-center py-8 text-slate-500 text-sm">加载中...</div>
      )}

      {!loading && records.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎮</div>
           <div className="text-slate-400 text-sm">暂无游戏记录</div>
           <div className="text-slate-500 text-xs mt-1">快去挑战第一个游戏吧！</div>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="space-y-2">
          {records.map((record: GameRecord) => {
            const info = GAME_LABELS[record.gameType];
            const colors = getColorClasses(info.color);
            const accuracy = record.totalQuestions > 0
              ? Math.round((record.correctCount / record.totalQuestions) * 100)
              : 0;
            return (
              <div
                key={record.id}
                className={`${colors.bg} border ${colors.border} rounded-xl p-4 flex items-center gap-3`}
              >
                <div className="text-3xl">{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${colors.text}`}>{info.name}</span>
                     <span className="text-xs text-slate-500">
                      难度 {record.difficulty}
                    </span>
                  </div>
                   <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      正确率 {accuracy}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDuration(record.durationSec)}
                    </span>
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${colors.text}`}>
                    {record.score}
                  </div>
                   <div className="text-xs text-slate-500">分</div>
                </div>
                 <ChevronRight size={18} className="text-slate-600" />
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {!loading && total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
             className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10 disabled:opacity-50"
          >
            上一页
          </button>
           <span className="text-sm text-slate-400">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
             className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default GameRecordList;
