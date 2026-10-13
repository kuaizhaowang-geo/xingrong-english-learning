import React, { useState, useEffect, useRef } from 'react';
import { Star, Save, Plus, X, NotebookPen } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { journalsApi } from '@client/src/api';
import type { StudyJournal } from '@shared/api.interface';

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'tired', emoji: '😩', label: '疲惫' },
  { value: 'excited', emoji: '🤩', label: '兴奋' },
  { value: 'sad', emoji: '😢', label: '低落' },
];

const defaultHighlights = ['进步明显', '发音更准', '句子通顺', '记住单词', '语感提升'];

const StudyJournalDiary: React.FC = () => {
  const [journals, setJournals] = useState<StudyJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('happy');
  const [masteryScore, setMasteryScore] = useState(3);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadJournals();
  }, []);

  const loadJournals = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await journalsApi.getJournals({ pageSize: 30 });
      setJournals(res.items);
      const todayJournal = res.items.find(
        (j: StudyJournal) => j.journalDate === new Date().toISOString().split('T')[0],
      );
      if (todayJournal) {
        setMood(todayJournal.mood);
        setMasteryScore(todayJournal.masteryScore);
        setHighlights(todayJournal.highlights || []);
        setContent(todayJournal.content || '');
        setShowEditor(true);
      }
    } catch (err) {
      logger.error('加载学习手册失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = (date: string): void => {
    setSelectedDate(date);
    const journal = journals.find((j: StudyJournal) => j.journalDate === date);
    if (journal) {
      setMood(journal.mood);
      setMasteryScore(journal.masteryScore);
      setHighlights(journal.highlights || []);
      setContent(journal.content || '');
      setShowEditor(true);
    } else {
      setMood('happy');
      setMasteryScore(3);
      setHighlights([]);
      setContent('');
      setShowEditor(false);
    }
  };

  const handleStartWrite = (): void => {
    setShowEditor(true);
    setTimeout(() => contentRef.current?.focus(), 100);
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      const saved = await journalsApi.saveJournal({
        journalDate: selectedDate,
        mood,
        masteryScore,
        highlights,
        content,
      });
      setShowEditor(true);
      setJournals((prev: StudyJournal[]) => {
        const idx = prev.findIndex((j: StudyJournal) => j.journalDate === selectedDate);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
    } catch (err) {
      logger.error('保存手册失败', err as Error);
    } finally {
      setSaving(false);
    }
  };

  const addHighlight = (tag: string): void => {
    if (!tag.trim() || highlights.includes(tag)) return;
    setHighlights([...highlights, tag.trim()]);
    setHighlightInput('');
  };

  const removeHighlight = (tag: string): void => {
    setHighlights(highlights.filter((h: string) => h !== tag));
  };

  const getDateList = (): string[] => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const dateList = getDateList();

  const getMoodEmoji = (m: string): string => {
    return moodOptions.find((opt) => opt.value === m)?.emoji || '😊';
  };

  const formatDateShort = (dateStr: string): string => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatDateFull = (dateStr: string): string => {
    const d = new Date(dateStr);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* 左侧日期列表 */}
       <div className="glass-card rounded-xl overflow-hidden">
         <div className="p-4 border-b border-white/10">
           <h2 className="text-base font-semibold text-white">最近30天</h2>
         </div>
        <div className="max-h-[600px] overflow-y-auto p-3 space-y-2">
          {loading
            ? Array.from({ length: 10 }).map((_, i: number) => (
                <div key={i} className="animate-pulse bg-white/5 rounded-lg h-16" />
              ))
            : dateList.map((dateStr: string) => {
                const journal = journals.find(
                  (j: StudyJournal) => j.journalDate === dateStr,
                );
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleSelectDate(dateStr)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                       isSelected
                         ? 'bg-fuchsia-500/15 border border-fuchsia-500/40'
                         : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-white">
                        {formatDateShort(dateStr)}
                      </span>
                      <span className="text-lg">{getMoodEmoji(journal?.mood || '')}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i: number) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                             i < (journal?.masteryScore || 0)
                               ? 'text-yellow-400 fill-yellow-400'
                               : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    {journal?.content && (
                       <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {journal.content}
                      </div>
                    )}
                    {!journal && (
                       <div className="text-xs text-slate-500 mt-1">点击记录</div>
                    )}
                  </button>
                );
              })}
        </div>
      </div>

       {/* 右侧编辑区 */}
       <div className="lg:col-span-2 glass-card rounded-xl p-6">
        {!loading && journals.length === 0 && !showEditor ? (
          <div className="py-12 text-center">
             <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/10 flex items-center justify-center border border-fuchsia-500/30">
               <NotebookPen size={48} className="text-fuchsia-400" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">
               开始记录你的学习之旅
             </h2>
             <p className="text-slate-400 mb-8">
              每天花 2 分钟记录学习心得，成长看得见
            </p>
            <div className="max-w-sm mx-auto space-y-3 mb-8 text-left">
               <div className="flex items-start gap-3 p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                <span className="text-xl">📝</span>
                <div>
                   <div className="font-medium text-white text-sm">
                    记录今日学习了什么内容
                  </div>
                   <div className="text-xs text-slate-400 mt-0.5">
                    学了单词、句子还是课程？记下来就有收获
                  </div>
                </div>
              </div>
               <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xl">😊</span>
                <div>
                   <div className="font-medium text-white text-sm">
                    标记今天的学习心情
                  </div>
                   <div className="text-xs text-slate-400 mt-0.5">
                    开心、平静还是疲惫？情绪也是学习的一部分
                  </div>
                </div>
              </div>
               <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xl">🎯</span>
                <div>
                   <div className="font-medium text-white text-sm">
                    给自己的掌握程度打个分
                  </div>
                   <div className="text-xs text-slate-400 mt-0.5">
                    5 星评分体系，见证自己一点一滴的进步
                  </div>
                </div>
              </div>
            </div>
             <button
               onClick={handleStartWrite}
               className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white font-medium shadow-md hover:shadow-lg transition-all shadow-fuchsia-500/20"
             >
              <Plus size={18} />
              写第一篇手账
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-semibold text-white">
                {formatDateFull(selectedDate)}
              </h2>
               <button
                 onClick={handleSave}
                 disabled={saving}
                 className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:from-fuchsia-600 hover:to-cyan-600 text-white rounded-full text-sm font-medium transition-all disabled:opacity-50"
               >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>

            {/* 心情选择 */}
            <div className="mb-6">
               <label className="text-sm font-medium text-white mb-3 block">今日心情</label>
              <div className="flex gap-3">
                {moodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMood(opt.value)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all ${
                       mood === opt.value
                         ? 'bg-fuchsia-500/15 border-2 border-fuchsia-500/50 scale-105'
                         : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                     <span className="text-xs text-slate-300">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 掌握度评分 */}
            <div className="mb-6">
               <label className="text-sm font-medium text-white mb-3 block">
                 今日掌握度评分
               </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <button
                    key={star}
                    onClick={() => setMasteryScore(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= masteryScore
                           ? 'text-yellow-400 fill-yellow-400'
                           : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                 <span className="ml-3 text-sm text-slate-400 self-center">
                  {masteryScore} / 5 星
                </span>
              </div>
            </div>

            {/* 今日亮点标签 */}
            <div className="mb-6">
               <label className="text-sm font-medium text-white mb-3 block">
                 今日亮点
               </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {highlights.map((tag: string) => (
                  <span
                    key={tag}
                     className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeHighlight(tag)}
                       className="hover:text-cyan-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={highlightInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHighlightInput(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHighlight(highlightInput);
                    }
                  }}
                  placeholder="输入亮点标签，回车添加"
                   className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500/50"
                />
                <button
                  onClick={() => addHighlight(highlightInput)}
                   className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors border border-white/10"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                 <span className="text-xs text-slate-400">快速添加：</span>
                {defaultHighlights
                  .filter((h: string) => !highlights.includes(h))
                  .slice(0, 4)
                  .map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => addHighlight(tag)}
                       className="text-xs text-slate-400 hover:text-fuchsia-400 underline underline-offset-2"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>

            {/* 学习心得 */}
            <div>
               <label className="text-sm font-medium text-white mb-3 block">
                 学习心得
               </label>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                placeholder="记录今天的学习感受、收获、难点..."
                rows={8}
                 className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500/50 resize-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudyJournalDiary;
