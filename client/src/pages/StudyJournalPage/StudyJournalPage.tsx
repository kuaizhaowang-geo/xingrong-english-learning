import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus, Search, Save, Trash2, Bold, Italic, List, ListOrdered,
  Quote, Minus, Smile, Star, ChevronLeft, ChevronRight, Sparkles,
  Image, Lightbulb, BookOpen, Calendar, Tag, X,
} from 'lucide-react';
import * as journalsApi from '@client/src/api/journals';
import type { StudyJournal, JournalType, JournalCalendarResponse } from '@shared/api.interface';
import JournalSidebar from './JournalSidebar';
import type { JournalCategory } from './JournalSidebar';
import JournalContent from './JournalContent';
import type { JournalItem } from './JournalItemCard';
import type { WrongWordItem, WrongSentenceItem, MasterStatus } from '@shared/api.interface';
import { axiosForBackend } from '@client/src/api';

// ========== Types & Consts ==========
interface JournalContentData {
  type: JournalType; title: string; contentHtml: string; tags: string[]; images: string[];
}
type TabType = 'journal' | 'wrong-book';

const JOURNAL_TYPES: { value: JournalType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📒' },
  { value: 'diary', label: '学习日记', icon: '📔' },
  { value: 'wrong-note', label: '错题笔记', icon: '❌' },
  { value: 'knowledge', label: '知识点笔记', icon: '📚' },
  { value: 'free', label: '自由笔记', icon: '✏️' },
];
const MOODS = ['😊', '😐', '😔', '🤩', '💪', '🔥'];
const EMOJIS = ['📝', '💡', '⭐', '🔥', '💪', '🎯', '📚', '✏️', '🧠', '🌟'];
const TOOLBAR = [
  { icon: Bold, action: 'bold', title: '加粗' },
  { icon: Italic, action: 'italic', title: '斜体' },
  { icon: 'H1', action: 'h1', title: 'H1' },
  { icon: 'H2', action: 'h2', title: 'H2' },
  { icon: List, action: 'ul', title: '无序列表' },
  { icon: ListOrdered, action: 'ol', title: '有序列表' },
  { icon: Quote, action: 'quote', title: '引用' },
  { icon: Minus, action: 'hr', title: '分割线' },
];
const AI_BUTTONS = [
  { type: 'summarize', icon: Sparkles, label: 'AI总结', color: 'from-purple-500 to-pink-500' },
  { type: 'image', icon: Image, label: 'AI配图', color: 'from-blue-500 to-cyan-500' },
  { type: 'knowledge', icon: Lightbulb, label: '知识点整理', color: 'from-yellow-500 to-orange-500' },
  { type: 'wrong-question', icon: BookOpen, label: '错题解析', color: 'from-red-500 to-pink-500' },
];

// ========== Helpers ==========
const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function parseContent(content: string | undefined): JournalContentData {
  if (!content) return { type: 'diary', title: '', contentHtml: '', tags: [], images: [] };
  if (content.startsWith('{')) {
    try {
      const p = JSON.parse(content) as Partial<JournalContentData>;
      return {
        type: (p.type as JournalType) || 'diary', title: p.title || '',
        contentHtml: p.contentHtml || '', tags: p.tags || [], images: p.images || [],
      };
    } catch {
      return { type: 'diary', title: '', contentHtml: content, tags: [], images: [] };
    }
  }
  return { type: 'diary', title: '', contentHtml: content, tags: [], images: [] };
}

const getSummary = (text: string, max = 60): string => {
  const c = text.replace(/[#*_`>\-]/g, '').trim();
  return c.length > max ? c.slice(0, max) + '...' : c;
};

// ========== Page ==========
const StudyJournalPage: React.FC = () => {
  const [tab, setTab] = useState<TabType>('journal');

  // --- Wrong-book state (preserved) ---
  const [activeCat, setActiveCat] = useState<JournalCategory>('wrong-words');
  const [words, setWords] = useState<WrongWordItem[]>([]);
  const [sents, setSents] = useState<WrongSentenceItem[]>([]);
  const [wbLoading, setWbLoading] = useState(true);
  const [selIds, setSelIds] = useState<Set<string>>(new Set());
  const [wbSearch, setWbSearch] = useState('');
  const [confirm, setConfirm] = useState<{ type: string; id?: string } | null>(null);

  // --- Journal state ---
  const [journals, setJournals] = useState<StudyJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selType, setSelType] = useState<JournalType | 'all'>('all');
  const [selJournal, setSelJournal] = useState<StudyJournal | null>(null);
  const [creating, setCreating] = useState(false);
  const [listSearch, setListSearch] = useState('');

  // --- Editor state ---
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jType, setJType] = useState<JournalType>('diary');
  const [mood, setMood] = useState('😊');
  const [mastery, setMastery] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // --- Calendar state ---
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calData, setCalData] = useState<JournalCalendarResponse>({});

  // --- AI state ---
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState('');

  // ========== Data loading ==========
  const loadJournals = useCallback(async () => {
    try { setLoading(true);
      const d = await journalsApi.getJournals({ page: 1, pageSize: 50 });
      setJournals(d.items);
    } catch (e) { logger.error('加载手账失败', e as Error); }
    finally { setLoading(false); }
  }, []);

  const loadCal = useCallback(async (y: number, m: number) => {
    try {
      const d = await journalsApi.getCalendar(y, m + 1);
      setCalData(d);
    } catch (e) { logger.error('加载日历失败', e as Error); }
  }, []);

  useEffect(() => {
    if (tab === 'journal') { void loadJournals(); void loadCal(calY, calM); }
  }, [tab, loadJournals, loadCal, calY, calM]);

  // Wrong-book load
  useEffect(() => {
    if (tab !== 'wrong-book') return;
    const load = async (): Promise<void> => {
      try { setWbLoading(true);
        const [wu, wm, su, sm] = await Promise.all([
          axiosForBackend.get('/api/wrong-book/words', { params: { status: 'unfamiliar' as MasterStatus } }),
          axiosForBackend.get('/api/wrong-book/words', { params: { status: 'mastered' as MasterStatus } }),
          axiosForBackend.get('/api/wrong-book/sentences', { params: { status: 'unfamiliar' as MasterStatus } }),
          axiosForBackend.get('/api/wrong-book/sentences', { params: { status: 'mastered' as MasterStatus } }),
        ]);
        setWords([...(wu.data as WrongWordItem[]), ...(wm.data as WrongWordItem[])]);
        setSents([...(su.data as WrongSentenceItem[]), ...(sm.data as WrongSentenceItem[])]);
      } catch (e) { logger.error('加载错题本失败', e as Error); }
      finally { setWbLoading(false); }
    };
    void load();
  }, [tab]);

  // ========== Derived data ==========
  const allTags = useMemo(() => {
    const s = new Set<string>();
    journals.forEach((j) => parseContent(j.content).tags.forEach((t: string) => s.add(t)));
    return Array.from(s);
  }, [journals]);

  const filtered = useMemo(() => {
    let list = [...journals];
    if (selType !== 'all') list = list.filter((j) => parseContent(j.content).type === selType);
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter((j) => {
        const d = parseContent(j.content);
        return d.title.toLowerCase().includes(q) || d.contentHtml.toLowerCase().includes(q)
          || d.tags.some((t: string) => t.toLowerCase().includes(q));
      });
    }
    return list.sort((a, b) => b.journalDate.localeCompare(a.journalDate));
  }, [journals, selType, listSearch]);

  // Wrong-book derived
  const wbCounts = useMemo<Record<JournalCategory, number>>(() => ({
    'wrong-words': words.filter((w) => w.masterStatus === 'unfamiliar' && w.familiarity < 40).length,
    'wrong-sentences': sents.filter((s) => s.masterStatus === 'unfamiliar' && s.attempts >= 2).length,
    pronunciation: 0, 'new-words': words.filter((w) => w.masterStatus === 'unfamiliar').length,
    'hard-sentences': 0, favorites: 0,
  }), [words, sents]);

  const wbItems = useMemo<JournalItem[]>(() => {
    switch (activeCat) {
      case 'wrong-words':
        return words.filter((w) => w.masterStatus === 'unfamiliar' && w.familiarity < 40)
          .map((w) => ({ type: 'word' as const, data: w }));
      case 'wrong-sentences':
        return sents.filter((s) => s.masterStatus === 'unfamiliar' && s.attempts >= 2)
          .map((s) => ({ type: 'sentence' as const, data: s }));
      case 'new-words':
        return words.filter((w) => w.masterStatus === 'unfamiliar')
          .map((w) => ({ type: 'word' as const, data: w }));
      default: return [];
    }
  }, [activeCat, words, sents]);

  // ========== Journal actions ==========
  const openJournal = useCallback((j: StudyJournal) => {
    const d = parseContent(j.content);
    setSelJournal(j); setCreating(false);
    setTitle(d.title); setBody(d.contentHtml); setJType(d.type);
    setMood(j.mood || '😊'); setMastery(j.masteryScore || 3); setTags(d.tags);
    setAiResult(''); setAiType('');
  }, []);

  const newJournal = useCallback(() => {
    setSelJournal(null); setCreating(true);
    setTitle(''); setBody(''); setJType('diary');
    setMood('😊'); setMastery(3); setTags([]);
    setAiResult(''); setAiType('');
  }, []);

  const saveJournal = useCallback(async () => {
    if (!title.trim() && !body.trim()) return;
    try { setSaving(true);
      const content = JSON.stringify({ type: jType, title, contentHtml: body, tags, images: [] });
      const date = creating ? fmtDate(new Date()) : selJournal?.journalDate || fmtDate(new Date());
      const saved = await journalsApi.saveJournal({
        journalDate: date, content, mood, masteryScore: mastery, highlights: tags,
      });
      setJournals((prev) => prev.some((j) => j.id === saved.id)
        ? prev.map((j) => j.id === saved.id ? saved : j) : [saved, ...prev]);
      setSelJournal(saved); setCreating(false);
      void loadCal(calY, calM);
    } catch (e) { logger.error('保存失败', e as Error); }
    finally { setSaving(false); }
  }, [title, body, jType, tags, mood, mastery, creating, selJournal, loadCal, calY, calM]);

  const delJournal = useCallback(async () => {
    if (!selJournal) return;
    try {
      await journalsApi.deleteJournal(selJournal.journalDate);
      setJournals((prev) => prev.filter((j) => j.id !== selJournal.id));
      setSelJournal(null); setCreating(false);
      void loadCal(calY, calM);
    } catch (e) { logger.error('删除失败', e as Error); }
  }, [selJournal, loadCal, calY, calM]);

  // ========== Editor toolbar ==========
  const insertAtCursor = useCallback((before: string, after = '') => {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = body.slice(s, e);
    setBody(body.slice(0, s) + before + sel + after + body.slice(e));
    setTimeout(() => { ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length; }, 0);
  }, [body]);

  const applyFmt = useCallback((action: string) => {
    const map: Record<string, [string, string]> = {
      bold: ['**', '**'], italic: ['*', '*'], h1: ['\n# ', ''], h2: ['\n## ', ''],
      ul: ['\n- ', ''], ol: ['\n1. ', ''], quote: ['\n> ', ''], hr: ['\n---\n', ''],
    };
    const [b, a] = map[action] || ['', ''];
    insertAtCursor(b, a);
  }, [insertAtCursor]);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }, [tagInput, tags]);

  // ========== AI ==========
  const runAi = useCallback(async (type: string) => {
    try {
      setAiLoading(true); setAiType(type); setAiResult('');
      let result = '';
      if (type === 'summarize') {
        const d = await journalsApi.aiSummarize(body || title); result = d.summary;
      } else if (type === 'wrong-question') {
        const d = await journalsApi.aiWrongQuestionAnalysis({ question: title || body.slice(0, 100) });
        result = d.analysis + '\n\n相似题目:\n' + d.similarQuestions.map((q) => `- ${q}`).join('\n');
      } else if (type === 'knowledge') {
        const d = await journalsApi.aiKnowledgeOrganize(body || title); result = d.structured;
      } else if (type === 'image') {
        result = '🖼️ AI 配图建议：\n\n根据当前笔记主题，建议使用以下风格的配图：\n- 学习场景插画风格\n- 深蓝紫科技感配色\n- 简洁扁平化设计\n\n可使用 AI 图片生成工具生成配图后上传。';
      }
      setAiResult(result);
    } catch (e) { logger.error('AI 调用失败', e as Error); setAiResult('调用失败，请稍后重试'); }
    finally { setAiLoading(false); }
  }, [body, title]);

  // ========== Calendar ==========
  const calDays = useMemo(() => {
    const first = new Date(calY, calM, 1), last = new Date(calY, calM + 1, 0);
    const days: { date: string; day: number; inMonth: boolean; hasJournal: boolean }[] = [];
    const swd = first.getDay(), prevLast = new Date(calY, calM, 0).getDate();
    for (let i = swd - 1; i >= 0; i--) days.push({ date: '', day: prevLast - i, inMonth: false, hasJournal: false });
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = fmtDate(new Date(calY, calM, d));
      days.push({ date: ds, day: d, inMonth: true, hasJournal: calData[ds]?.hasJournal || false });
    }
    return days;
  }, [calY, calM, calData]);

  const prevMonth = useCallback(() => {
    if (calM === 0) { setCalY((y) => y - 1); setCalM(11); } else setCalM((m) => m - 1);
  }, [calM]);
  const nextMonth = useCallback(() => {
    if (calM === 11) { setCalY((y) => y + 1); setCalM(0); } else setCalM((m) => m + 1);
  }, [calM]);

  // ========== Wrong-book actions ==========
  const delSingle = useCallback(async (id: string) => {
    const item = wbItems.find((i) => i.data.id === id); if (!item) return;
    try {
      if (item.type === 'word') {
        await axiosForBackend.delete('/api/wrong-book/words', { data: { wordIds: [item.data.wordId] } });
        setWords((prev) => prev.filter((w) => w.id !== id));
      } else {
        await axiosForBackend.delete('/api/wrong-book/sentences', { data: { puzzleIds: [item.data.puzzleId] } });
        setSents((prev) => prev.filter((s) => s.id !== id));
      }
      setSelIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e) { logger.error('删除失败', e as Error); }
  }, [wbItems]);

  const batchDel = useCallback(async () => {
    const ids = Array.from(selIds); if (ids.length === 0) return;
    const wIds = words.filter((w) => ids.includes(w.id)).map((w) => w.wordId);
    const pIds = sents.filter((s) => ids.includes(s.id)).map((s) => s.puzzleId);
    try {
      const ps: Promise<unknown>[] = [];
      if (wIds.length) ps.push(axiosForBackend.delete('/api/wrong-book/words', { data: { wordIds: wIds } }));
      if (pIds.length) ps.push(axiosForBackend.delete('/api/wrong-book/sentences', { data: { puzzleIds: pIds } }));
      await Promise.all(ps);
      setWords((prev) => prev.filter((w) => !ids.includes(w.id)));
      setSents((prev) => prev.filter((s) => !ids.includes(s.id)));
      setSelIds(new Set());
    } catch (e) { logger.error('批量删除失败', e as Error); }
  }, [selIds, words, sents]);

  const batchMaster = useCallback(async () => {
    const ids = Array.from(selIds); if (ids.length === 0) return;
    try {
      const ps: Promise<unknown>[] = [];
      for (const id of ids) {
        const w = words.find((x) => x.id === id), s = sents.find((x) => x.id === id);
        if (w) ps.push(axiosForBackend.patch(`/api/wrong-book/words/${w.wordId}/status`, { status: 'mastered' as MasterStatus }));
        if (s) ps.push(axiosForBackend.patch(`/api/wrong-book/sentences/${s.puzzleId}/status`, { status: 'mastered' as MasterStatus }));
      }
      await Promise.all(ps);
      setWords((prev) => prev.map((w) => ids.includes(w.id) ? { ...w, masterStatus: 'mastered' as const } : w));
      setSents((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, masterStatus: 'mastered' as const } : s));
      setSelIds(new Set());
    } catch (e) { logger.error('批量掌握失败', e as Error); }
  }, [selIds, words, sents]);

  const doConfirm = useCallback(() => {
    if (!confirm) return;
    if (confirm.type === 'batch-delete') void batchDel();
    else if (confirm.type === 'batch-master') void batchMaster();
    else if (confirm.type === 'delete-single' && confirm.id) void delSingle(confirm.id);
    setConfirm(null);
  }, [confirm, batchDel, batchMaster, delSingle]);

  // ========== Render: Wrong-book tab ==========
  if (tab === 'wrong-book') {
    const dlText = confirm
      ? confirm.type === 'batch-delete' ? `确定删除选中的 ${selIds.size} 条？`
        : confirm.type === 'batch-master' ? `确定将 ${selIds.size} 条标记为已掌握？`
        : '确定删除这条内容？' : '';
    const isDanger = confirm?.type !== 'batch-master';

    return (
       <div className="min-h-screen -mx-6 -mt-6 px-6 pt-6 pb-8 text-white">
        <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-0" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-0" />
        <div className="relative max-w-6xl mx-auto mb-6 flex gap-2">
           <button onClick={() => setTab('journal')} className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            📔 学习手账
          </button>
          <button onClick={() => setTab('wrong-book')} className="px-5 py-2.5 rounded-lg text-white bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
            ❌ 错题本
          </button>
        </div>
        <div className="relative max-w-6xl mx-auto flex gap-6 md:flex-row flex-col">
          <JournalSidebar activeCategory={activeCat} onCategoryChange={setActiveCat} counts={wbCounts} />
          <JournalContent
            category={activeCat} items={wbItems} loading={wbLoading} counts={wbCounts}
            selectedIds={selIds}
            onToggleSelect={(id) => setSelIds((p) => { const n = new Set(p); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; })}
            onToggleSelectAll={() => {
              const ids = wbItems.map((i) => i.data.id);
              setSelIds(ids.length > 0 && selIds.size === ids.length ? new Set() : new Set(ids));
            }}
            onBatchDelete={() => setConfirm({ type: 'batch-delete' })}
            onBatchMaster={() => setConfirm({ type: 'batch-master' })}
            onReview={() => logger.info('复习')}
            onDelete={(id) => setConfirm({ type: 'delete-single', id })}
            searchQuery={wbSearch} onSearchChange={setWbSearch}
          />
        </div>
        {confirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="glass-card rounded-xl p-6 max-w-md w-full text-white">
               <h3 className="text-lg font-semibold text-white mb-2">
                 {confirm.type === 'delete-single' ? '删除确认' : '批量操作确认'}
               </h3>
                <p className="text-slate-400 mb-6">{dlText}</p>
               <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-slate-300 hover:bg-white/20">
                  取消
                </button>
                <button onClick={doConfirm} className={`px-4 py-2 rounded-lg text-white ${
                  isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`}>
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== Render: Journal tab (three columns) ==========
   return (
     <div className="min-h-screen -mx-4 -mt-4 px-4 pt-4 pb-4 text-white">
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-0" />

      <div className="relative max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('journal')} className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20 text-sm font-medium">
            📔 学习手账
          </button>
            <button onClick={() => setTab('wrong-book')} className="px-5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm">
            ❌ 错题本
          </button>
        </div>

        {/* Three columns */}
        <div className="flex gap-4 h-[calc(100vh-120px)] min-h-[580px]">
          {/* ----- Left Sidebar ----- */}
          <div className="w-[260px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
             <div className="glass-card rounded-xl p-4">
               <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-0.5">学习手账</h1>
               <p className="text-xs text-slate-400 mb-3">记录学习点滴</p>
              <button onClick={newJournal} className="w-full py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5">
                <Plus size={16} /> 新建手账
              </button>
            </div>

             <div className="glass-card rounded-xl p-3">
               <h3 className="text-xs font-semibold text-white mb-2">手账类型</h3>
              <div className="flex flex-col gap-0.5">
                {JOURNAL_TYPES.map((t) => (
                  <button key={t.value} onClick={() => setSelType(t.value)}
                     className={`text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-center gap-2 ${
                       selType === t.value ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-white border border-fuchsia-500/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
               <div className="glass-card rounded-xl p-3">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5"><Tag size={12} />标签</h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.slice(0, 12).map((t) => (
                    <span key={t} onClick={() => setListSearch(t)}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 cursor-pointer hover:bg-fuchsia-500/25">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

             <div className="glass-card rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-semibold text-white flex items-center gap-1.5"><Calendar size={12} />日历</h3>
                <div className="flex gap-0.5">
                    <button onClick={prevMonth} className="p-0.5 rounded hover:bg-white/10 text-slate-400"><ChevronLeft size={12} /></button>
                    <button onClick={nextMonth} className="p-0.5 rounded hover:bg-white/10 text-slate-400"><ChevronRight size={12} /></button>
                </div>
              </div>
                <div className="text-center text-[11px] text-slate-300 mb-1">{calY}年{calM + 1}月</div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[11px]">
                 {['日', '一', '二', '三', '四', '五', '六'].map((d) => <div key={d} className="text-slate-400 py-0.5">{d}</div>)}
                {calDays.map((d, i) => (
                  <button key={i} disabled={!d.inMonth}
                    onClick={() => d.inMonth && setSelJournal(null)}
                     className={`relative py-1 rounded text-[11px] transition-all ${
                       !d.inMonth ? 'text-slate-600 cursor-default'
                          : d.hasJournal ? 'text-cyan-400 hover:bg-cyan-500/20'
                          : 'text-slate-400 hover:bg-white/10'
                     }`}>
                    {d.day}
                    {d.inMonth && d.hasJournal && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ----- Middle List ----- */}
           <div className="w-[300px] flex-shrink-0 flex flex-col glass-card rounded-xl overflow-hidden">
             <div className="p-2.5 border-b border-white/10">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={listSearch} onChange={(e) => setListSearch(e.target.value)}
                  placeholder="搜索手账..."
                   className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500/50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
               {loading && <div className="text-center text-slate-400 text-xs py-8">加载中...</div>}
               {!loading && filtered.length === 0 && <div className="text-center text-slate-400 text-xs py-8">暂无手账</div>}
              {filtered.map((j) => {
                const d = parseContent(j.content);
                const ti = JOURNAL_TYPES.find((t) => t.value === d.type);
                const active = selJournal?.id === j.id;
                return (
                  <div key={j.id} onClick={() => openJournal(j)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                       active ? 'bg-fuchsia-500/15 border-fuchsia-500/50'
                         : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-fuchsia-500/30'
                      }`}>
                     <div className="flex items-start justify-between gap-2 mb-1">
                       <h4 className="text-xs font-medium text-white truncate flex-1">{d.title || '无标题'}</h4>
                       <span className="text-sm flex-shrink-0 leading-none">{j.mood || '📝'}</span>
                     </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-1.5">{getSummary(d.contentHtml)}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                        {ti?.icon} {ti?.label}
                      </span>
                       <span className="text-[10px] text-slate-400">{j.journalDate}</span>
                    </div>
                    {d.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                          {d.tags.slice(0, 3).map((t: string) => <span key={t} className="text-[10px] text-cyan-400">#{t}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ----- Right Editor ----- */}
           <div className="flex-1 flex flex-col glass-card rounded-xl overflow-hidden min-w-0">
            {!selJournal && !creating ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <BookOpen size={40} className="mb-2 opacity-30" />
                <p className="text-sm">选择手账查看详情</p>
                <p className="text-xs mt-1">或点击「新建手账」开始记录</p>
              </div>
            ) : (
              <>
                {/* Header */}
                 <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入标题..."
                     className="flex-1 bg-transparent text-base font-semibold text-white placeholder:text-slate-500 focus:outline-none" />
                  <select value={jType} onChange={(e) => setJType(e.target.value as JournalType)}
                       className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white focus:outline-none">
                    {JOURNAL_TYPES.filter((t) => t.value !== 'all').map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <button onClick={delJournal} disabled={!selJournal}
                     className="p-1.5 rounded-md text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 disabled:opacity-30" title="删除">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={saveJournal} disabled={saving}
                    className="px-3 py-1.5 rounded-md text-white text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-60">
                    <Save size={14} />{saving ? '保存中' : '保存'}
                  </button>
                </div>

                {/* Toolbar */}
                 <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-0.5 flex-wrap">
                  {TOOLBAR.map((t, i) => (
                    <button key={i} onClick={() => applyFmt(t.action)} title={t.title}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10">
                      {typeof t.icon === 'string' ? <span className="text-[10px] font-bold">{t.icon}</span> : <t.icon size={14} />}
                    </button>
                  ))}
                  <div className="relative">
                    <button onClick={() => setShowEmoji(!showEmoji)} title="表情"
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10">
                      <Smile size={14} />
                    </button>
                    {showEmoji && (
                       <div className="absolute top-full left-0 mt-1 p-1.5 glass-card rounded-lg z-10 grid grid-cols-5 gap-0.5">
                        {EMOJIS.map((e) => (
                          <button key={e} onClick={() => { insertAtCursor(e); setShowEmoji(false); }}
                              className="w-7 h-7 rounded hover:bg-white/10 text-base">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-0.5">
                     <span className="text-[10px] text-slate-400 mr-1">心情</span>
                    {MOODS.map((m) => (
                      <button key={m} onClick={() => setMood(m)}
                         className={`w-6 h-6 rounded transition-all text-sm ${mood === m ? 'bg-fuchsia-500/30 scale-110' : 'hover:bg-white/10'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor + AI result */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                  <textarea ref={taRef} value={body} onChange={(e) => setBody(e.target.value)}
                    placeholder="开始记录你的学习心得..."
                     className="flex-1 w-full p-4 bg-transparent text-slate-200 text-sm leading-relaxed resize-none focus:outline-none placeholder:text-slate-500 min-h-[150px]" />
                  {aiResult && (
                     <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-br from-fuchsia-500/15 to-cyan-500/10 border border-fuchsia-500/30">
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium text-fuchsia-400 flex items-center gap-1.5">
                          <Sparkles size={12} />
                          {aiType === 'summarize' && 'AI 总结'}
                          {aiType === 'wrong-question' && 'AI 错题解析'}
                          {aiType === 'knowledge' && 'AI 知识点整理'}
                          {aiType === 'image' && 'AI 配图建议'}
                        </h4>
                         <button onClick={() => { setAiResult(''); setAiType(''); }} className="text-slate-400 hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                        <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{aiResult}</div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                 <div className="border-t border-white/10 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                     <Tag size={12} className="text-slate-400 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-[11px] rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-0.5">
                           #{t}
                            <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-cyan-300"><X size={9} /></button>
                         </span>
                      ))}
                      <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="添加标签..."
                          className="flex-1 min-w-[60px] bg-transparent text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">掌握程度</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setMastery(n)} className="transition-transform hover:scale-110">
                           <Star size={16} className={n <= mastery ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                     <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">AI 辅助</span>
                    {AI_BUTTONS.map((a) => (
                      <button key={a.type} onClick={() => void runAi(a.type)} disabled={aiLoading}
                        className={`px-2.5 py-1 rounded-md text-[11px] text-white bg-gradient-to-r ${a.color} hover:opacity-90 flex items-center gap-1 disabled:opacity-50`}>
                        <a.icon size={11} />{a.label}
                      </button>
                    ))}
                     {aiLoading && <span className="text-[11px] text-slate-400">思考中...</span>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyJournalPage;
