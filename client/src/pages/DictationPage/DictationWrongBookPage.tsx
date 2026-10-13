import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  RotateCcw,
  BookX,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dictationApi } from '@client/src/api';
import type { DictationWrongWord } from '@shared/api.interface';

const GRADE_OPTIONS = [
  { value: 'all', label: '全部年级' },
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
];

const MASTERY_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'unmastered', label: '未掌握' },
  { value: 'mastered', label: '已掌握' },
];

const DictationWrongBookPage: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<DictationWrongWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [masteryFilter, setMasteryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [masteredSet, setMasteredSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadWords();
  }, [gradeFilter, masteryFilter]);

  const loadWords = async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        pageSize: 50,
      };
      if (gradeFilter !== 'all') {
        params.grade = gradeFilter;
      }
      if (masteryFilter === 'mastered') {
        params.mastered = true;
      } else if (masteryFilter === 'unmastered') {
        params.mastered = false;
      }
      const res = await dictationApi.listDictationWrongWords(params);
      setWords(res.items);
    } catch (err) {
      logger.error('加载错字本失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return dateStr;
    }
  };

  const handleToggleExpand = (id: string): void => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkMastered = (id: string): void => {
    setMasteredSet((prev) => new Set(prev).add(id));
    // TODO: 对接后端标记已掌握接口
  };

  const handleRetry = (): void => {
    navigate('/dictation');
  };

  const displayWords = words.map((w) => ({
    ...w,
    mastered: w.mastered || masteredSet.has(w.id),
  }));

  return (
    <div className="space-y-6">
      {/* 顶部返回 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dictation')}
           className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
          aria-label="返回"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
           <h1 className="text-xl font-bold text-white">错字本</h1>
           <p className="text-sm text-slate-400">复习巩固，消灭错题</p>
        </div>
      </div>

      {/* 筛选区 */}
       <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* 年级筛选 */}
          <div className="flex items-center gap-2">
             <span className="text-sm text-slate-400">年级：</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
               className="px-3 py-1.5 rounded-lg border border-white/10 text-sm
                 bg-white/5 text-slate-300 focus:outline-none focus:border-orange-500/50"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 掌握状态筛选 */}
          <div className="flex items-center gap-2">
             <span className="text-sm text-slate-400">状态：</span>
            <select
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value)}
               className="px-3 py-1.5 rounded-lg border border-white/10 text-sm
                 bg-white/5 text-slate-300 focus:outline-none focus:border-orange-500/50"
            >
              {MASTERY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* 重听错字按钮 */}
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-gradient-to-r from-orange-500 to-orange-600
              text-white text-sm font-medium shadow-sm hover:shadow-md
              transition-all"
          >
            <RotateCcw size={16} />
            <span>重听错字</span>
          </button>
        </div>

        {/* 统计 */}
         <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>共 {displayWords.length} 个错字</span>
          <span>
            已掌握{' '}
             <span className="text-emerald-400 font-medium">
              {displayWords.filter((w) => w.mastered).length}
            </span>
          </span>
          <span>
            未掌握{' '}
                     <span className="text-red-400 font-medium">
              {displayWords.filter((w) => !w.mastered).length}
            </span>
          </span>
        </div>
      </div>

      {/* 错字列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
           <Loader2 className="text-orange-400 animate-spin" size={32} />
           <p className="text-slate-400">加载中...</p>
        </div>
      ) : displayWords.length === 0 ? (
         <div className="glass-card py-16 flex flex-col items-center gap-3">
           <BookX size={56} className="text-slate-500" />
           <p className="text-slate-400">暂无错字</p>
           <p className="text-sm text-slate-500">
            {masteryFilter === 'mastered' ? '还没有已掌握的错字' : '继续加油保持全对！'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayWords.map((word) => (
            <div
              key={word.id}
               className="glass-card
                 hover:shadow-md transition-all overflow-hidden"
            >
              {/* 卡片头部 */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => handleToggleExpand(word.id)}
              >
                 <span className="text-4xl font-bold text-white w-14 text-center">
                  {word.word}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 font-medium">
                      {word.pinyin}
                    </span>
                    {word.mastered && (
                       <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle size={12} />
                        已掌握
                      </span>
                    )}
                    {!word.mastered && (
                       <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                        未掌握
                      </span>
                    )}
                  </div>
                   <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>错 {word.wrongCount} 次</span>
                    <span>最近错误：{formatDate(word.lastWrongAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                   className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={expandedId === word.id ? '收起' : '展开'}
                >
                  {expandedId === word.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {/* 展开详情 */}
              {expandedId === word.id && (
                 <div className="px-4 pb-4 pt-0 border-t border-white/10">
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {word.radical && (
                        <div>
                           <span className="text-slate-500 text-xs">部首：</span>
                           <span className="text-slate-300">{word.radical}</span>
                        </div>
                      )}
                      {word.strokes !== undefined && (
                        <div>
                           <span className="text-slate-500 text-xs">笔画：</span>
                           <span className="text-slate-300">
                            {word.strokes} 画
                          </span>
                        </div>
                      )}
                    </div>

                    {word.meaning && (
                      <div>
                         <span className="text-slate-500 text-xs">意思：</span>
                         <p className="text-slate-300 text-sm mt-1">
                          {word.meaning}
                        </p>
                      </div>
                    )}

                    {word.words && word.words.length > 0 && (
                      <div>
                         <span className="text-slate-500 text-xs">组词：</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {word.words.map((w, idx) => (
                            <span
                              key={idx}
                               className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {word.example && (
                      <div>
                         <span className="text-slate-500 text-xs">例句：</span>
                         <p className="text-slate-300 text-sm mt-1 italic">
                          {word.example}
                        </p>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2">
                      {!word.mastered && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkMastered(word.id);
                          }}
                           className="flex-1 py-2 rounded-lg text-sm font-medium
                             bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                             hover:bg-emerald-500/30 transition-colors
                             flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={16} />
                          <span>标记已掌握</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry();
                        }}
                         className="flex-1 py-2 rounded-lg text-sm font-medium
                           bg-orange-500/20 text-orange-400 border border-orange-500/30
                           hover:bg-orange-500/30 transition-colors
                           flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={16} />
                        <span>重听复习</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DictationWrongBookPage;
