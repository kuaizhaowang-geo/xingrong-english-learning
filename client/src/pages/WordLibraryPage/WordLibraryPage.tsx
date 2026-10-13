import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { BookMarked, Bell, ArrowRight, Settings, Sparkles, BarChart3, Zap, BookOpen, XCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi, wordsApi } from '@client/src/api';
import type { TextbookTreeItem, WordItem, WordStats, ReviewMode } from '@shared/api.interface';
import type { WordSettings } from '@client/src/api/words';
import WordCardGrid from './WordCardGrid';
import type { WordRecordLite } from './WordCardGrid';
import WordDetailModal from './WordDetailModal';
import ReciteMode from './ReciteMode';
import SpellingMode from './SpellingMode';
import ChoiceMode from './ChoiceMode';
import NewWordLearnMode from './NewWordLearnMode';
import FillBlankMode from './FillBlankMode';
import LearningPlanModal from './LearningPlanModal';
import LearningReportModal from './LearningReportModal';
import StatsCards from './StatsCards';
import FilterBar, { PROFICIENCY_FILTERS } from './FilterBar';
import type { SchoolStageKey, ViewTabKey, SortKey } from './FilterBar';
import type { SchoolStage } from './data/textbookCatalog';
import LeftSidebar from './LeftSidebar';
import BatchActionBar from './BatchActionBar';
import TextbookCatalog from './TextbookCatalog';
import type { TextbookCatalogItem } from './data/textbookCatalog';

type PracticeMode = 'browse' | 'recite' | 'spelling' | 'choice' | 'newLearn' | 'fillBlank';

const MODE_TABS: Array<{ key: PracticeMode; label: string }> = [
  { key: 'browse', label: '浏览' },
  { key: 'newLearn', label: '新词学习' },
  { key: 'recite', label: '闪卡背诵' },
  { key: 'spelling', label: '拼写练习' },
  { key: 'choice', label: '选择题' },
  { key: 'fillBlank', label: '例句填空' },
];

// ===== 学段判断 =====
function detectStage(grade: string): SchoolStageKey {
  const g = grade.replace(/[^0-9]/g, '');
  const num = Number(g);
  if (num >= 1 && num <= 6) return 'primary';
  if (num >= 7 && num <= 9) return 'junior';
  if (num >= 10 && num <= 12) return 'senior';
  return 'primary';
}

// ===== 单词仓库主页面 =====
const WordLibraryPage: React.FC = () => {
  // 筛选状态
  const [stage, setStage] = useState<SchoolStageKey>('primary');
  const [publisher, setPublisher] = useState<string>('pep');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [viewTab, setViewTab] = useState<ViewTabKey>('all');
  const [profFilter, setProfFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('order');

  // 左侧面板模式
  // 多选模式
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 笔记集合
  const [hasNotes, setHasNotes] = useState<Set<string>>(new Set());

  // 分页 / 无限滚动
  const [page, setPage] = useState(1);
  const [totalWords, setTotalWords] = useState(0);
  const PAGE_SIZE = 50;
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 数据状态
  const [textbooks, setTextbooks] = useState<TextbookTreeItem[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<TextbookTreeItem | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);

  // 统计 & 熟练度记录
  const [stats, setStats] = useState<WordStats | null>(null);
  const [wordRecords, setWordRecords] = useState<Map<string, WordRecordLite>>(new Map());

  // 收藏
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [practiceMode, setPracticeMode] = useState<PracticeMode>('browse');
  const [detailWord, setDetailWord] = useState<WordItem | null>(null);
  const [reciteStartIndex, setReciteStartIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewWords, setReviewWords] = useState<WordItem[]>([]);
  const [newLearnWords, setNewLearnWords] = useState<WordItem[]>([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [wordSettings, setWordSettings] = useState<WordSettings | null>(null);
  const [fillBlankDifficulty, setFillBlankDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [fillBlankWords, setFillBlankWords] = useState<WordItem[]>([]);
  const [highlightNotFound, setHighlightNotFound] = useState<string | null>(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // 1. 加载教材树 + 设置
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const tree = await textbooksApi.getTextbookTree('english');
        setTextbooks(tree);
        if (tree.length > 0) {
          const firstPrimary = tree.find((t) => detectStage(t.grade) === 'primary');
          setSelectedTextbook(firstPrimary || tree[0]);
        }
      } catch (err) {
        logger.error('加载教材列表失败', err as Error);
      } finally {
        setLoadingBooks(false);
      }
    };
    const loadSettings = async (): Promise<void> => {
      try {
        const s = await wordsApi.getWordSettings();
        setWordSettings(s);
      } catch (err) {
        logger.error('加载单词设置失败', err as Error);
      }
    };
    fetchData();
    loadSettings();
  }, []);

  // 2. 加载统计、收藏、熟练度记录
  useEffect(() => {
    const loadUserdata = async (): Promise<void> => {
      try {
        const [statsData, favs, records] = await Promise.all([
          wordsApi.getWordStats(),
          wordsApi.getFavorites().catch((err) => {
            if ((err as { response?: { status?: number } })?.response?.status === 401) {
              logger.warn('未登录，无法获取收藏');
              return [];
            }
            throw err;
          }),
          wordsApi.getAllUserWordRecords().catch((err) => {
            if ((err as { response?: { status?: number } })?.response?.status === 401) {
              logger.warn('未登录，无法获取学习记录');
              return [];
            }
            throw err;
          }),
        ]);
        setStats(statsData);
        setFavorites(new Set(favs.map((w: WordItem) => w.id)));
        const recordMap = new Map<string, WordRecordLite>();
        for (const r of records) {
          recordMap.set(r.wordId, {
            ebbinghausLevel: r.ebbinghausLevel,
            status: r.status,
            familiarity: r.familiarity,
            wrongCount: r.wrongCount,
            reviewCount: r.reviewCount,
            correctCount: r.correctCount,
            lastReviewedAt: r.lastReviewedAt,
            nextReviewAt: r.nextReviewAt,
          });
        }
        setWordRecords(recordMap);
      } catch (err) {
        logger.error('加载用户学习数据失败', err as Error);
      }
    };
    loadUserdata();
  }, []);

  // 3. 筛选教材列表
  const filteredTextbooks = useMemo(() => {
    return textbooks.filter((tb) => {
      if (detectStage(tb.grade) !== stage) return false;
      if (publisher === 'pep') {
        const lower = tb.publisher.toLowerCase();
        if (!lower.includes('pep') && !lower.includes('人教pep') && !lower.includes('人教版pep')) {
          if (!(stage === 'primary' && lower.includes('人教'))) return false;
        }
      }
      return true;
    });
  }, [textbooks, stage, publisher]);

  // 4. 视图切换时加载对应单词数据
  useEffect(() => {
    if (viewTab === 'all') return;

    const fetchViewWords = async (): Promise<void> => {
      setLoadingWords(true);
      try {
        let result: WordItem[] = [];
        if (viewTab === 'favorites') result = await wordsApi.getFavorites();
        else if (viewTab === 'wrong') result = await wordsApi.getWrongWords();
        else if (viewTab === 'mastered') result = await wordsApi.getMasteredWords();
        setWords(result);
      } catch (err) {
        if ((err as { response?: { status?: number } })?.response?.status === 401) {
          logger.warn('未登录，无法获取视图数据');
        } else {
          logger.error('加载视图单词失败', err as Error);
        }
        setWords([]);
      } finally {
        setLoadingWords(false);
      }
    };
    fetchViewWords();
  }, [viewTab]);

  // 5. 教材变化时加载单词（仅 all 视图）
  useEffect(() => {
    if (viewTab !== 'all' || !selectedTextbook) return;
    const fetchWords = async (): Promise<void> => {
      setLoadingWords(true);
      try {
        const result = await wordsApi.getWords({
          textbookId: selectedTextbook.id,
          pageSize: PAGE_SIZE,
          page: 1,
          sort,
          search: searchQuery || undefined,
        });
        setWords(result.items || []);
        setTotalWords(result.total || 0);
        setPage(1);
      } catch (err) {
        logger.error('加载单词失败', err as Error);
        setWords([]);
        setTotalWords(0);
      } finally {
        setLoadingWords(false);
      }
    };
    fetchWords();
  }, [selectedTextbook, viewTab, sort, searchQuery]);

  // 6. 搜索 + 词性 + 熟练度筛选
  const filteredWords = useMemo(() => {
    const profLevels = PROFICIENCY_FILTERS.find((p) => p.key === profFilter)?.levels ?? [];
    return words.filter((w) => {
      if (posFilter !== 'all') {
        if (!w.partOfSpeech || w.partOfSpeech.toLowerCase() !== posFilter) return false;
      }
      if (profFilter !== 'all') {
        const rec = wordRecords.get(w.id);
        if (!rec) return false;
        if (!profLevels.includes(rec.ebbinghausLevel)) return false;
      }
      return true;
    });
  }, [words, posFilter, profFilter, wordRecords]);

  // 7. 无限滚动加载下一页
  const loadMoreWords = useCallback(async (): Promise<void> => {
    if (viewTab !== 'all' || !selectedTextbook || loadingWords) return;
    if (words.length >= totalWords) return;
    setLoadingWords(true);
    try {
      const nextPage = page + 1;
      const result = await wordsApi.getWords({
        textbookId: selectedTextbook.id,
        pageSize: PAGE_SIZE,
        page: nextPage,
        sort,
        search: searchQuery || undefined,
      });
      setWords((prev) => [...prev, ...(result.items || [])]);
      setTotalWords(result.total || 0);
      setPage(nextPage);
    } catch (err) {
      logger.error('加载更多单词失败', err as Error);
    } finally {
      setLoadingWords(false);
    }
  }, [viewTab, selectedTextbook, loadingWords, words.length, totalWords, page, sort, searchQuery]);

  // 8. IntersectionObserver 监听底部 sentinel
  useEffect(() => {
    if (!sentinelRef.current || viewTab !== 'all') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingWords && words.length < totalWords) {
          loadMoreWords();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreWords, loadingWords, words.length, totalWords, viewTab]);

  // 9. 收藏切换（乐观更新）
  const toggleFavorite = useCallback((id: string): void => {
    const wasFav = favorites.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    const apiCall = wasFav ? wordsApi.removeFavorite(id) : wordsApi.addFavorite(id);
    apiCall.catch((err) => {
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        logger.warn('未登录，收藏操作失败');
      } else {
        logger.error('收藏操作失败', err as Error);
      }
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFav) next.add(id); else next.delete(id);
        return next;
      });
    });
  }, [favorites]);

  // 10. 选中教材
  const handleSelectTextbook = useCallback((tb: TextbookTreeItem): void => {
    setSelectedTextbook(tb);
    if (viewTab !== 'all') setViewTab('all');
  }, [viewTab]);

  // 9. 详情
  const handleOpenDetail = useCallback((word: WordItem): void => setDetailWord(word), []);
  const handleCloseDetail = useCallback((): void => setDetailWord(null), []);
  const handleToggleDetailFav = useCallback((): void => {
    if (detailWord) toggleFavorite(detailWord.id);
  }, [detailWord, toggleFavorite]);

  const handleStartRecite = useCallback((): void => {
    const idx = filteredWords.findIndex((w) => w.id === detailWord?.id);
    setReciteStartIndex(idx >= 0 ? idx : 0);
    setDetailWord(null);
    setPracticeMode('recite');
  }, [detailWord, filteredWords]);

  const handleStartFillBlankFromDetail = useCallback((): void => {
    if (!detailWord?.exampleSentence) return;
    setFillBlankWords([detailWord]);
    setFillBlankDifficulty('medium');
    setDetailWord(null);
    setPracticeMode('fillBlank');
  }, [detailWord]);
  const handleClosePractice = useCallback((): void => setPracticeMode('browse'), []);
  const handleOpenPlan = useCallback((): void => setPlanModalOpen(true), []);
  const handleClosePlan = useCallback((): void => setPlanModalOpen(false), []);
  const handleOpenReport = useCallback((): void => setReportModalOpen(true), []);
  const handleCloseReport = useCallback((): void => setReportModalOpen(false), []);
  const handlePlanSaved = useCallback((s: WordSettings): void => {
    setWordSettings(s);
  }, []);

  // 新词学习入口
  const handleStartNewLearn = useCallback((): void => {
    if (filteredWords.length === 0) return;
    const unlearned = filteredWords.filter((w: WordItem) => {
      const rec = wordRecords.get(w.id);
      return !rec || rec.ebbinghausLevel === 0;
    });
    const words = unlearned.length > 0 ? unlearned : filteredWords;
    setNewLearnWords(words.slice(0, 20));
    setPracticeMode('newLearn');
  }, [filteredWords, wordRecords]);

  const handleNewLearnComplete = useCallback(async (wordId: string): Promise<void> => {
    try {
      await wordsApi.updateWordRecord({ wordId, isCorrect: true });
      const [newStats, records] = await Promise.all([
        wordsApi.getWordStats(),
        wordsApi.getAllUserWordRecords().catch(() => []),
      ]);
      setStats(newStats);
      const recordMap = new Map<string, WordRecordLite>();
      for (const r of records) {
        recordMap.set(r.wordId, {
          ebbinghausLevel: r.ebbinghausLevel,
          status: r.status,
          familiarity: r.familiarity,
          wrongCount: r.wrongCount,
          reviewCount: r.reviewCount,
          correctCount: r.correctCount,
          lastReviewedAt: r.lastReviewedAt,
          nextReviewAt: r.nextReviewAt,
        });
      }
      setWordRecords(recordMap);
    } catch (err) {
      logger.error('更新单词学习记录失败', err as Error);
    }
  }, []);

  const handleModeChange = useCallback((mode: PracticeMode): void => {
    if (mode === 'browse') {
      setPracticeMode('browse');
      return;
    }
    if (filteredWords.length === 0) return;
    if (mode === 'newLearn') {
      handleStartNewLearn();
      return;
    }
    if (mode === 'fillBlank') {
      const withExample = filteredWords.filter((w: WordItem) => w.exampleSentence);
      if (withExample.length === 0) return;
      setFillBlankWords(withExample.slice(0, 20));
      setFillBlankDifficulty('medium');
      setShowDifficultyDialog(true);
      return;
    }
    setPracticeMode(mode);
  }, [filteredWords, handleStartNewLearn]);

  const handleStartFillBlank = useCallback((): void => {
    setShowDifficultyDialog(false);
    setPracticeMode('fillBlank');
  }, []);

  const handleToggleSelect = useCallback((id: string): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const handleToggleSelectMode = useCallback((): void => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds([]);
      return !prev;
    });
  }, []);

  const handleClearSelection = useCallback((): void => {
    setSelectedIds([]);
  }, []);

  const handleBatchFavorite = useCallback((): void => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds];
    setFavorites((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => {
      wordsApi.addFavorite(id).catch((err) => {
        logger.error('批量收藏失败', err as Error);
      });
    });
    setSelectedIds([]);
    setSelectMode(false);
  }, [selectedIds]);

  const handleBatchMaster = useCallback(async (): Promise<void> => {
    if (selectedIds.length === 0) return;
    const ids = [...selectedIds];
    setWordRecords((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => {
        next.set(id, {
          ebbinghausLevel: 5,
          status: 'mastered',
          familiarity: 100,
          wrongCount: 0,
          reviewCount: 1,
          correctCount: 1,
        });
      });
      return next;
    });
    ids.forEach((id) => {
      wordsApi.updateWordRecord({ wordId: id, isCorrect: true }).catch((err) => {
        logger.error('批量标记掌握失败', err as Error);
      });
    });
    setSelectedIds([]);
    setSelectMode(false);
  }, [selectedIds]);

  const handleBatchAddPlan = useCallback((): void => {
    setPlanModalOpen(true);
    setSelectedIds([]);
    setSelectMode(false);
  }, []);

  const handleSearchSubmit = useCallback((q: string): void => {
    setSearchQuery(q);
  }, []);

  const handleNoteChange = useCallback((wordId: string, hasNote: boolean): void => {
    setHasNotes((prev) => {
      const next = new Set(prev);
      if (hasNote) next.add(wordId); else next.delete(wordId);
      return next;
    });
  }, []);

  const handleAffixSelectWord = useCallback((word: WordItem): void => {
    setDetailWord(word);
  }, []);

  // 从教材目录卡片点击进入教材
  const handleSelectFromCatalog = useCallback((item: TextbookCatalogItem): void => {
    // 在现有教材树中查找匹配的教材；找不到则保持当前选中不变
    const matched = textbooks.find((t) => {
      const sameStage = detectStage(t.grade) === item.stage;
      const titleMatch = t.title.includes(item.grade) || t.title.includes(item.term);
      const pubMatch = t.publisher.toLowerCase().includes(item.publisher.toLowerCase()) ||
        item.publisher.toLowerCase().includes(t.publisher.toLowerCase());
      return sameStage && titleMatch && pubMatch;
    });
    if (matched) {
      setSelectedTextbook(matched);
      if (viewTab !== 'all') setViewTab('all');
    }
    // 同步学段筛选状态
    setStage(item.stage as SchoolStageKey);
  }, [textbooks, viewTab]);

  // 学段变化回调（兼容 catalog 与 filter bar 共用）
  const handleStageChange = useCallback((s: SchoolStageKey | SchoolStage): void => {
    setStage(s as SchoolStageKey);
  }, []);

  const highlightWord = searchParams.get('highlight');

  useEffect(() => {
    if (!highlightWord || !highlightWord.trim()) {
      setHighlightNotFound(null);
      return;
    }
    const target = highlightWord.trim().toLowerCase();
    setSearchQuery(target);
    setViewTab('all');
    setSearch(target);
    setHighlightNotFound(null);
  }, [highlightWord]);

  useEffect(() => {
    if (!highlightWord || !highlightWord.trim()) return;
    const target = highlightWord.trim().toLowerCase();
    if (loadingWords) return;
    const found = words.find((w) => w.word.toLowerCase() === target);
    if (found) {
      setDetailWord(found);
      setHighlightNotFound(null);
    } else if (words.length > 0) {
      setHighlightNotFound(highlightWord);
    }
  }, [highlightWord, words, loadingWords]);

  // 11. 复习模式
  const handleStartReview = useCallback(async (mode: ReviewMode = 'full'): Promise<void> => {
    try {
      const reviewList = await wordsApi.getTodayReview(mode, 50);
      const wordList: WordItem[] = reviewList
        .filter((r) => r.word)
        .map((r) => r.word as WordItem);
      setReviewWords(wordList);
      setReviewMode(true);
    } catch (err) {
      logger.error('获取今日复习单词失败', err as Error);
    }
  }, []);

  const handleSelectRelatedWord = useCallback((word: WordItem): void => {
    setDetailWord(word);
  }, []);
  const handleCloseReview = useCallback((): void => setReviewMode(false), []);
  const handleRecordUpdate = useCallback(async (wordId: string, isCorrect: boolean, practiceType?: string): Promise<void> => {
    try {
      await wordsApi.updateWordRecord({ wordId, isCorrect, practiceType });
      const [newStats, records] = await Promise.all([
        wordsApi.getWordStats(),
        wordsApi.getAllUserWordRecords().catch(() => []),
      ]);
      setStats(newStats);
      const recordMap = new Map<string, WordRecordLite>();
      for (const r of records) {
        recordMap.set(r.wordId, {
          ebbinghausLevel: r.ebbinghausLevel,
          status: r.status,
          familiarity: r.familiarity,
          wrongCount: r.wrongCount,
          reviewCount: r.reviewCount,
          correctCount: r.correctCount,
          lastReviewedAt: r.lastReviewedAt,
          nextReviewAt: r.nextReviewAt,
        });
      }
      setWordRecords(recordMap);
    } catch (err) {
      logger.error('更新单词记录失败', err as Error);
    }
  }, []);

  const showReviewBanner = viewTab === 'all' && (stats?.todayReview ?? 0) > 0;
  const viewTabLabel = viewTab === 'all' ? (selectedTextbook?.title || '单词列表') : '单词列表';
  const displayWords = filteredWords;
  const hasMore = viewTab === 'all' && displayWords.length < totalWords;

  const emptyText = useMemo(() => {
    if (viewTab === 'favorites') return '还没有收藏的单词';
    if (viewTab === 'wrong') return '错词本空空如也，继续加油！';
    if (viewTab === 'mastered') return '还没有掌握的单词';
    if (searchQuery) return '没有找到匹配的单词';
    return '暂无匹配的单词';
  }, [viewTab, searchQuery]);

  return (
    <div className="min-h-screen text-slate-200">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {highlightNotFound && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>未找到单词：<strong>{highlightNotFound}</strong>，请检查拼写或尝试其他关键词</span>
          </div>
        )}
         {/* ===== 顶部标题区 ===== */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A]
                flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
              <BookMarked size={20} className="text-white sm:size-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                单词仓库
              </h1>
              <p className="text-xs text-slate-400 truncate">
                精选教材词表，高效记忆每一个单词
              </p>
            </div>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenReport}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl min-h-11
                  bg-white/10 border border-white/10
                   text-slate-300 hover:border-orange-500/50 hover:text-orange-400
                   transition-all duration-200 shadow-sm"
              >
                <BarChart3 size={18} className="text-orange-400 sm:size-4" />
                <span className="text-sm hidden sm:inline">学习报告</span>
              </button>
              <button
                onClick={handleOpenPlan}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl min-h-11
                  bg-white/10 border border-white/10
                   text-slate-300 hover:border-orange-500/50 hover:text-orange-400
                   transition-all duration-200 shadow-sm"
              >
                <Settings size={18} className="text-orange-400 sm:size-4" />
                <span className="text-sm hidden sm:inline">学习计划</span>
              </button>
            </div>
         </div>

        <div className="flex items-center gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {MODE_TABS.map((tab) => {
            const active = practiceMode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleModeChange(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 min-h-11
                  transition-all duration-200
                  ${active
                    ? 'bg-[#FF6B35] text-white shadow-sm'
                    : 'bg-white/10 border border-white/10 text-slate-300 hover:text-[#FF6B35] hover:border-orange-500/30'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <StatsCards
          stats={stats}
          dailyGoal={wordSettings?.dailyGoal ?? 20}
          todayLearned={stats?.todayLearned ?? 0}
          onStartReview={handleStartReview}
          onOpenPlan={handleOpenPlan}
        />

         {/* 新词学习入口卡片 */}
         {viewTab === 'all' && filteredWords.length > 0 && (
           <div
             onClick={handleStartNewLearn}
             className="mb-4 sm:mb-6 flex items-center justify-between px-4 sm:px-5 py-4 rounded-xl
              bg-gradient-to-r from-orange-50 to-amber-50
              border border-orange-200 cursor-pointer
              hover:from-orange-100 hover:to-amber-100
              hover:border-orange-300
              transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl
                bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A]
                flex items-center justify-center shadow-md shadow-orange-500/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                 <h3 className="text-base font-semibold text-white">五遍学习法</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  看图 → 听读 → 拼写 → 例句 → 测试，科学记忆每一个新词
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[#FF6B35] font-medium text-sm
              group-hover:translate-x-1 transition-transform">
              开始学习
              <ArrowRight size={16} />
            </div>
          </div>
        )}

         {/* ===== 复习模式选择卡片 ===== */}
         {showReviewBanner && (
           <div className="mb-4 sm:mb-6 rounded-2xl p-4 sm:p-5
            bg-gradient-to-r from-orange-500/20 to-amber-500/20
             border border-orange-500/30
            relative overflow-hidden">

             <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
               {/* 左侧：今日待复习数量 */}
               <div className="flex items-center gap-3 sm:gap-4">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl
                   bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A]
                   flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
                   <Bell size={22} className="text-white sm:size-7" />
                 </div>
                 <div className="min-w-0">
                   <div className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                     {stats?.todayReview}
                   </div>
                    <div className="text-sm text-slate-400 mt-0.5 sm:mt-1">今日待复习</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                     及时复习，记忆更牢固
                   </div>
                 </div>
               </div>

               {/* 右侧：3 种模式按钮 */}
               <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
                 <button
                   onClick={() => handleStartReview('fast')}
                   className="flex flex-col items-center gap-1 px-2 sm:px-4 py-3 rounded-xl min-h-16 sm:min-h-[84px]
                      bg-amber-500/20 border border-amber-500/30 text-amber-300
                      hover:bg-amber-500/30 hover:border-amber-500/50
                     transition-all duration-200 active:scale-[0.97]"
                 >
                   <Zap size={18} className="sm:size-5" />
                   <span className="text-xs sm:text-sm font-medium">快速复习</span>
                    <span className="text-[10px] sm:text-[11px] text-amber-300">5分钟速刷</span>
                 </button>
                 <button
                   onClick={() => handleStartReview('full')}
                   className="flex flex-col items-center gap-1 px-2 sm:px-4 py-3 rounded-xl min-h-16 sm:min-h-[84px]
                      bg-orange-500/20 border border-orange-500/30 text-orange-300
                      hover:bg-orange-500/30 hover:border-orange-500/50
                     transition-all duration-200 active:scale-[0.97]"
                 >
                   <BookOpen size={18} className="sm:size-5" />
                   <span className="text-xs sm:text-sm font-medium">完整复习</span>
                    <span className="text-[10px] sm:text-[11px] text-orange-300">系统复习</span>
                 </button>
                 <button
                   onClick={() => handleStartReview('wrong')}
                   className="flex flex-col items-center gap-1 px-2 sm:px-4 py-3 rounded-xl min-h-16 sm:min-h-[84px]
                      bg-rose-500/20 border border-rose-500/30 text-rose-300
                      hover:bg-rose-500/30 hover:border-rose-500/50
                     transition-all duration-200 active:scale-[0.97]"
                 >
                   <XCircle size={18} className="sm:size-5" />
                   <span className="text-xs sm:text-sm font-medium">错词专项</span>
                    <span className="text-[10px] sm:text-[11px] text-rose-300">攻克薄弱点</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 教材目录（学段+版本筛选 + 教材卡片） ===== */}
        {viewTab === 'all' && (
          <TextbookCatalog
            currentStage={stage as SchoolStage}
            onStageChange={handleStageChange}
            onSelectTextbook={handleSelectFromCatalog}
          />
        )}

        {/* ===== 筛选条 ===== */}
        <FilterBar
          stage={stage}
          publisher={publisher}
          search={search}
          posFilter={posFilter}
          viewTab={viewTab}
          profFilter={profFilter}
          sort={sort}
          selectMode={selectMode}
          onStageChange={handleStageChange}
          onPublisherChange={setPublisher}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          onPosFilterChange={setPosFilter}
          onViewTabChange={setViewTab}
          onProfFilterChange={setProfFilter}
          onSortChange={setSort}
          onToggleSelectMode={handleToggleSelectMode}
        />

         {/* ===== 主体：左右两栏 ===== */}
         <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* 左侧：单词书列表 / 词根词缀（仅 all 视图） */}
          {viewTab === 'all' && (
            <LeftSidebar
              textbooks={filteredTextbooks}
              selectedTextbookId={selectedTextbook?.id ?? null}
              onSelectTextbook={handleSelectTextbook}
              loadingBooks={loadingBooks}
              onSelectWord={handleAffixSelectWord}
            />
          )}

          {/* 右侧：单词卡片网格 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-1 h-4 bg-[#FF6B35] rounded-full" />
                {viewTabLabel}
                 <span className="text-xs text-slate-500 font-normal ml-1">
                  （共 {filteredWords.length} 个）
                </span>
              </h2>
            </div>
            <WordCardGrid
              words={displayWords}
              loading={loadingWords && page === 1}
              favorites={favorites}
              wordRecords={wordRecords}
              hasNotes={hasNotes}
              selectMode={selectMode}
              selectedIds={selectedIds}
              searchQuery={searchQuery}
              emptyText={emptyText}
              onToggleFavorite={toggleFavorite}
              onOpenDetail={handleOpenDetail}
              onToggleSelect={handleToggleSelect}
            />

            {viewTab === 'all' && hasMore && (
              <div ref={sentinelRef} className="py-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-orange-300 border-t-[#FF6B35]
                  rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 单词详情弹窗 ===== */}
      <WordDetailModal
        word={detailWord}
        isFav={detailWord ? favorites.has(detailWord.id) : false}
        record={detailWord ? wordRecords.get(detailWord.id) : undefined}
        wordRecords={wordRecords}
        onClose={handleCloseDetail}
        onToggleFavorite={handleToggleDetailFav}
        onStartRecite={handleStartRecite}
        onStartFillBlank={handleStartFillBlankFromDetail}
        onNoteChange={(hasNote) => {
          if (detailWord) handleNoteChange(detailWord.id, hasNote);
        }}
        onSelectRelatedWord={handleSelectRelatedWord}
      />

      <BatchActionBar
        selectedCount={selectedIds.length}
        onBatchFavorite={handleBatchFavorite}
        onBatchMaster={handleBatchMaster}
        onBatchAddPlan={handleBatchAddPlan}
        onClearSelection={handleClearSelection}
      />

      {practiceMode === 'recite' && (
        <ReciteMode
          words={filteredWords}
          startIndex={reciteStartIndex}
          mode="recite"
          onClose={handleClosePractice}
          onRecordUpdate={handleRecordUpdate}
        />
      )}

      {practiceMode === 'spelling' && (
        <SpellingMode
          words={filteredWords.slice(0, 20)}
          startIndex={0}
          onClose={handleClosePractice}
          onRecordUpdate={handleRecordUpdate}
        />
      )}

      {practiceMode === 'choice' && (
        <ChoiceMode
          words={filteredWords.slice(0, 20)}
          startIndex={0}
          onClose={handleClosePractice}
          onRecordUpdate={handleRecordUpdate}
        />
      )}

      {practiceMode === 'fillBlank' && fillBlankWords.length > 0 && (
        <FillBlankMode
          words={fillBlankWords}
          startIndex={0}
          difficulty={fillBlankDifficulty}
          onClose={handleClosePractice}
          onRecordUpdate={handleRecordUpdate}
        />
      )}

      {practiceMode === 'newLearn' && newLearnWords.length > 0 && (
        <NewWordLearnMode
          words={newLearnWords}
          startIndex={0}
          onClose={handleClosePractice}
          onComplete={handleNewLearnComplete}
        />
      )}

      {reviewMode && (
        <ReciteMode
          words={reviewWords}
          mode="review"
          onClose={handleCloseReview}
          onRecordUpdate={handleRecordUpdate}
        />
      )}

      {/* 例句填空难度选择弹窗 */}
      {showDifficultyDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 p-6 rounded-2xl
            bg-[#FFFFFF] border border-violet-500/40
            shadow-2xl shadow-violet-500/20">
            <h3 className="text-lg font-bold text-white mb-1 text-center">选择难度</h3>
            <p className="text-xs text-slate-400 text-center mb-5">
              共 {fillBlankWords.length} 个单词可供练习
            </p>
            <div className="space-y-2 mb-5">
              {(['easy', 'medium', 'hard'] as const).map((lv) => (
                <button
                  key={lv}
                  onClick={() => setFillBlankDifficulty(lv)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 border-2
                    ${fillBlankDifficulty === lv
                      ? 'border-violet-500 bg-violet-500/20 text-white'
                      : 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-violet-500/50'
                    }`}
                >
                  <div className="font-medium">
                    {lv === 'easy' && '简单 · 首字母 + 配图 + 完整翻译'}
                    {lv === 'medium' && '中等 · 单词长度 + 例句翻译'}
                    {lv === 'hard' && '困难 · 仅中文翻译，回忆整个单词'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDifficultyDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-xl
                  bg-slate-800/70 border border-slate-600/50 text-slate-300
                  hover:text-white hover:bg-slate-700 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleStartFillBlank}
                className="flex-1 px-4 py-2.5 rounded-xl
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  text-white font-medium shadow-lg shadow-violet-500/30
                  transition-all duration-300 text-sm"
              >
                开始练习
              </button>
            </div>
          </div>
        </div>
      )}

      <LearningPlanModal
        open={planModalOpen}
        onClose={handleClosePlan}
        onSaved={handlePlanSaved}
      />

      <LearningReportModal
        isOpen={reportModalOpen}
        onClose={handleCloseReport}
      />
    </div>
  );
};

export default WordLibraryPage;
