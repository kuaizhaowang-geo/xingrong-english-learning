import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePracticeBack from '@client/src/hooks/use-practice-back';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as typingApi from '@client/src/api/typing';
import type {
  TypingCourse,
  TypingCourseListResponse,
  TypingStats,
  TypingLevel,
  TypingPracticeMode,
} from '@shared/api.interface';
import { soundManager } from '@client/src/utils/soundManager';
import CourseListView from './components/CourseListView';
import ModeSelectView from './components/ModeSelectView';
import WhackAMoleView from './components/WhackAMoleView';
import ResultModal from './components/ResultModal';
import TypingTopBar from './components/TypingTopBar';
import TypingContentArea from './components/TypingContentArea';
import TypingBottomBar from './components/TypingBottomBar';
 import {
    CHINESE_MODES,
    ENGLISH_MODES,
    type ChineseMode,
    type EnglishMode,
    type Language,
  } from './data/typingData';
import { useTypingEngine } from './utils/useTypingEngine';

type ViewMode = 'modeSelect' | 'courseList' | 'practice' | 'whackAMole';

export type TypingCategory = 'finger' | 'pinyin' | 'english' | 'chinese';

const TypingPracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const handleBack = usePracticeBack();

  // ─── 视图状态 ───────────────────────────────────
  const [view, setView] = useState<ViewMode>(() => {
    if (viewParam === 'practice') return 'practice';
    return 'modeSelect';
  });
  const [activeCategory, setActiveCategory] = useState<TypingCategory>('english');
  const [activeLevel, setActiveLevel] = useState<TypingLevel | 'all'>('all');
  const [activePracticeMode, setActivePracticeMode] = useState<TypingPracticeMode>('sentence');
  const [courses, setCourses] = useState<TypingCourse[]>([]);
  const [levels, setLevels] = useState<TypingCourseListResponse['levels']>([]);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentCourse, setCurrentCourse] = useState<TypingCourse | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
   const [submitted, setSubmitted] = useState<boolean>(false);

  // ─── 练习基础状态 ────────────────────────────────
  const [language, setLanguage] = useState<Language>('zh');
  const [zhMode, setZhMode] = useState<ChineseMode>('pinyin');
  const [enMode, setEnMode] = useState<EnglishMode>('word');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // ─── 控制开关 ──────────────────────────────────
   const [fingerGuideEnabled, setFingerGuideEnabled] = useState<boolean>(false);
   const [showKeyboard, setShowKeyboard] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [letterPronunciation, setLetterPronunciation] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [answerHidden, setAnswerHidden] = useState<boolean>(false);
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [autoNextEnabled, setAutoNextEnabled] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── 课程单词列表（单词专项模式） ──────────────────
  const customWordList = useMemo(() => {
    if (currentCourse?.practiceMode === 'word' && currentCourse.wordList) {
      return currentCourse.wordList.split(/\s+/).filter((w) => w.length > 0);
    }
    return undefined;
  }, [currentCourse]);

  // ─── 打字引擎 ──────────────────────────────────
  const engine = useTypingEngine({
    language,
    zhMode,
    enMode,
    soundEnabled,
    isPaused,
    viewActive: view === 'practice',
    customWordList,
    courseContent: currentCourse?.content,
  });

  // ─── 数据加载 ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await typingApi.getCourses({
          level: activeLevel === 'all' ? undefined : activeLevel,
          practiceMode: activePracticeMode,
          category: activeCategory,
        });
        setCourses(res.items);
        setLevels(res.levels);
        const data = await typingApi.getStats();
        setStats(data);
      } catch (err) {
        logger.error('Failed to load typing data', JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeLevel, activePracticeMode, activeCategory]);

  // ─── 模式/语言切换 ───────────────────────────────
  const handleZhModeChange = useCallback((mode: ChineseMode) => {
    setZhMode(mode);
    engine.setCurrentIndex(0);
  }, [engine]);

  const handleEnModeChange = useCallback((mode: EnglishMode) => {
    setEnMode(mode);
    engine.setCurrentIndex(0);
  }, [engine]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    engine.setCurrentIndex(0);
  }, [engine]);

  const handleSwitchMode = useCallback(() => {
    if (language === 'zh') {
      const idx = CHINESE_MODES.findIndex((m) => m.id === zhMode);
      const next = CHINESE_MODES[(idx + 1) % CHINESE_MODES.length];
      handleZhModeChange(next.id);
    } else {
      const idx = ENGLISH_MODES.findIndex((m) => m.id === enMode);
      const next = ENGLISH_MODES[(idx + 1) % ENGLISH_MODES.length];
      handleEnModeChange(next.id);
    }
  }, [language, zhMode, enMode, handleZhModeChange, handleEnModeChange]);

  // ─── 显示/隐藏答案 ──────────────────────────────
  const handleToggleAnswer = useCallback(() => {
    if (language === 'zh' && zhMode === 'hanzi') {
      setAnswerHidden((prev) => !prev);
    } else {
      setShowPinyin((prev) => !prev);
    }
  }, [language, zhMode]);

  const answerVisible = useMemo(() => {
    if (language === 'zh' && zhMode === 'hanzi') return answerHidden;
    return showPinyin;
  }, [language, zhMode, answerHidden, showPinyin]);

  // ─── 暂停/重置 ─────────────────────────────────
  const handlePauseToggle = useCallback(() => setIsPaused((prev) => !prev), []);

  // ─── 物理键盘输入 ────────────────────────────────
  useEffect(() => {
    if (view !== 'practice') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框内的事件
      if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 功能键跳过（shift/ctrl 等）
      const skipKeys = ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape', 'CapsLock'];
      if (skipKeys.includes(e.key)) return;
      if (e.key.startsWith('F')) return;

      const isFree = language === 'zh' && zhMode === 'ziyou';

      // 方向键导航
      if (e.key === 'ArrowLeft') {
        if (!isFree) { e.preventDefault(); engine.handlePrev(); }
        return;
      }
      if (e.key === 'ArrowRight') {
        if (!isFree) { e.preventDefault(); engine.handleNext(); }
        return;
      }

      // Tab 切模式
      if (e.key === 'Tab') {
        e.preventDefault();
        handleSwitchMode();
        return;
      }

      // R 朗读
      if (e.key === 'r' || e.key === 'R') {
        engine.handleSpeak();
        return;
      }

      // 回车
      if (e.key === 'Enter') {
        e.preventDefault();
        if (isFree) {
          engine.handleInputChange(engine.userInput + '\n');
        } else if (engine.feedback === 'correct') {
          engine.handleNext();
        }
        return;
      }

      // 退格
      if (e.key === 'Backspace') {
        e.preventDefault();
        engine.handleBackspace();
        if (soundEnabled) {
          soundManager.ensureContext();
          soundManager.playBackspace();
        }
        return;
      }

      // 空格
      if (e.key === ' ') {
        e.preventDefault();
        engine.handleSpacePress();
        return;
      }

      // 普通字符
      if (e.key.length === 1) {
        e.preventDefault();
        if (engine.feedback === 'correct' && !isFree) return;
        if (soundEnabled) {
          soundManager.ensureContext();
          soundManager.playKeystroke();
        }
        engine.handleInputChange(engine.userInput + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, engine, language, zhMode, soundEnabled, handleSwitchMode]);

  // 自动聚焦
  useEffect(() => {
    if (view === 'practice') {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [view]);

  // 完成后自动切题
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (
      engine.feedback === 'correct' &&
      engine.currentIndex < engine.totalItems - 1 &&
      autoNextEnabled &&
      !engine.isFreeMode &&
      !showResult
    ) {
      autoNextTimerRef.current = setTimeout(() => {
        engine.handleNext();
        autoNextTimerRef.current = null;
      }, 300);
    }
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
    };
  }, [engine.feedback, engine.currentIndex, engine.totalItems, engine, autoNextEnabled, showResult]);

  // ─── 模式选择 → 课程列表 ──────────────────────────
  const handleSelectMode = useCallback((category: TypingCategory) => {
    soundManager.ensureContext();
    soundManager.playClick('primary');
    setActiveCategory(category);

    // 根据分类设置默认语言和模式
    switch (category) {
      case 'finger':
      case 'english':
        setLanguage('en');
        setEnMode(category === 'finger' ? 'letter' : 'word');
        setActivePracticeMode(category === 'finger' ? 'sentence' : 'word');
        break;
      case 'pinyin':
      case 'chinese':
        setLanguage('zh');
        setZhMode(category === 'pinyin' ? 'pinyin' : 'hanzi');
        setActivePracticeMode('sentence');
        break;
      default:
        break;
    }

    setView('courseList');
  }, []);

  const handleSelectWhackAMole = useCallback(() => {
    soundManager.ensureContext();
    soundManager.playClick('primary');
    setView('whackAMole');
  }, []);

  const handleBackToModeSelect = useCallback(() => setView('modeSelect'), []);

  // ─── 课程列表入口 ────────────────────────────────
  const startPractice = useCallback((course: TypingCourse) => {
    soundManager.ensureContext();
    soundManager.playClick('primary');
    setCurrentCourse(course);

    // 根据课程 category 决定语言和模式
    const cat = course.category as TypingCategory;
    if (cat === 'finger' || cat === 'english') {
      setLanguage('en');
      if (cat === 'finger') {
        setEnMode('letter');
      } else if (course.practiceMode === 'word') {
        setEnMode('word');
      } else {
        setEnMode('sentence');
      }
    } else if (cat === 'pinyin' || cat === 'chinese') {
      setLanguage('zh');
      setZhMode(cat === 'pinyin' ? 'pinyin' : 'hanzi');
    }

    engine.handleResetProgress();
    setShowResult(false);
    setSubmitted(false);
    setView('practice');
  }, [engine]);

  const handleBackToList = useCallback(() => setView('courseList'), []);
  const handleRetry = useCallback(() => {
    if (currentCourse) startPractice(currentCourse);
  }, [currentCourse, startPractice]);

  // ─── 提交成绩 ──────────────────────────────────
   const submitRecord = useCallback(async () => {
     if (!currentCourse || submitted) return;
     setSubmitted(true);
    try {
      await typingApi.submitRecord({
        courseId: currentCourse.id,
        wpm: engine.wpm,
        cpm: engine.cpm,
        accuracy: engine.accuracy,
        duration: engine.elapsedSeconds,
        errors: engine.wrongCount,
        totalChars: engine.totalTypedChars,
        correctChars: engine.totalCorrectChars,
        practiceMode: currentCourse.practiceMode ?? 'sentence',
      });
      const data = await typingApi.getStats();
      setStats(data);
    } catch (err) {
      logger.error('Failed to submit typing record', JSON.stringify(err));
    }
  }, [currentCourse, submitted, engine]);

  // ─── 练习完成检测 ───────────────────────────────
  useEffect(() => {
    if (view !== 'practice') return;
    if (engine.totalItems === 0) return;
    if (
      engine.currentIndex >= engine.totalItems - 1 &&
      engine.feedback === 'correct' &&
      !showResult
    ) {
      setTimeout(() => {
        setShowResult(true);
        submitRecord();
      }, 400);
    }
  }, [engine.currentIndex, engine.feedback, engine.totalItems, view, showResult, submitRecord]);

  // ─── 关闭弹窗时提交 ─────────────────────────────
  const handleResultClose = useCallback(() => {
    if (!submitted) submitRecord();
    setShowResult(false);
  }, [submitted, submitRecord]);

  const handleResultBackToList = useCallback(() => {
    if (!submitted) submitRecord();
    setShowResult(false);
    handleBackToList();
  }, [submitted, submitRecord, handleBackToList]);

  // ─── 目标键高亮（下一个待输入字符） ─────────────────
  const targetKey = useMemo(() => {
    const t = engine.targetText;
    if (!t) return undefined;
    const firstPendingIdx = engine.charStates.findIndex((s) => s === 'pending');
    if (firstPendingIdx === -1) return undefined;
    return t[firstPendingIdx]?.toLowerCase();
  }, [engine.targetText, engine.charStates]);

  // ─── 渲染 ───────────────────────────────────────
  if (view === 'modeSelect') {
    return (
      <ModeSelectView
        stats={stats}
        onSelectMode={handleSelectMode}
        onSelectWhackAMole={handleSelectWhackAMole}
        onBack={handleBack}
      />
    );
  }

  if (view === 'whackAMole') {
    return <WhackAMoleView onBack={handleBackToModeSelect} />;
  }

  if (view === 'courseList') {
    return (
      <CourseListView
        courses={courses}
        levels={levels}
        stats={stats}
        activeLevel={activeLevel}
        activePracticeMode={activePracticeMode}
        activeCategory={activeCategory}
        loading={loading}
        onLevelChange={setActiveLevel}
        onPracticeModeChange={setActivePracticeMode}
        onStart={startPractice}
        onBack={handleBackToModeSelect}
      />
    );
  }

   const topBarTitle = currentCourse ? currentCourse.name : '打字练习';

   const subtitle = (() => {
     if (language === 'zh') {
       return CHINESE_MODES.find((m) => m.id === zhMode)?.desc ?? '';
     }
     return ENGLISH_MODES.find((m) => m.id === enMode)?.desc ?? '';
   })();

    const displayStatsAccuracy = engine.isFreeMode ? engine.freeAccuracy : engine.accuracy;
    const totalItems = engine.totalItems || 1;

    return (
    <div className="h-screen bg-gradient-to-b from-[#0a0a1a] to-[#1a1a3a] flex flex-col overflow-hidden text-[#F1F5F9] items-stretch">
      {/* 第1层：顶部工具栏 */}
       <TypingTopBar
         title={topBarTitle}
         subtitle={subtitle}
        progress={{ current: engine.currentIndex + 1, total: totalItems }}
        language={language}
        onLanguageChange={handleLanguageChange}
        currentZhMode={zhMode}
        currentEnMode={enMode}
        onZhModeChange={handleZhModeChange}
        onEnModeChange={handleEnModeChange}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        onResetProgress={engine.handleResetProgress}
         onBack={handleBackToList}
        charList={engine.currentList as any}
         currentIndex={engine.currentIndex}
          onJumpTo={engine.handleJumpTo}
          autoNextEnabled={autoNextEnabled}
          onToggleAutoNext={() => setAutoNextEnabled((v) => !v)}
       />

      {/* 第2层：内容区 */}
      <div className="flex-1 min-h-0 w-full flex flex-col justify-center items-center py-2 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${language}-${zhMode}-${enMode}-${engine.currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl flex items-center justify-center"
          >
            <TypingContentArea
              language={language}
              zhMode={zhMode}
              enMode={enMode}
               zhCharItem={
                 language === 'zh' && (zhMode === 'pinyin' || zhMode === 'hanzi')
                   ? (engine.currentList[engine.currentIndex] as any)
                   : undefined
               }
               zhWordItem={
                 language === 'zh' && zhMode === 'ciyu'
                   ? (engine.currentList[engine.currentIndex] as any)
                   : undefined
               }
                zhSentenceItem={
                   language === 'zh' && zhMode === 'juzi'
                     ? (engine.currentList[engine.currentIndex] as any)
                     : undefined
                }
              enLetter={
                language === 'en' && enMode === 'letter'
                  ? engine.currentList[engine.currentIndex] as string
                  : undefined
              }
              enWordItem={
                language === 'en' && enMode === 'word'
                  ? engine.currentList[engine.currentIndex] as any
                  : undefined
              }
              enSentenceItem={
                language === 'en' && enMode === 'sentence'
                  ? engine.currentList[engine.currentIndex] as any
                  : undefined
              }
              freeInputText={engine.isFreeMode ? engine.userInput : ''}
              freeSpeed={engine.freeSpeed}
              freeAccuracy={engine.freeAccuracy}
              userInput={engine.userInput}
              charStates={engine.charStates}
              currentCharIndex={0}
              feedback={engine.feedback}
              answerHidden={answerHidden}
              showPinyin={showPinyin}
              difficulty={difficulty}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 第5-6层：底部操作栏 + 虚拟键盘 */}
       <TypingBottomBar
         language={language}
         zhMode={zhMode}
         enMode={enMode}
         keyboardVisible={showKeyboard}
         userInput={engine.userInput}
         onInputChange={engine.handleInputChange}
         onBackspace={engine.handleBackspace}
         targetText={engine.targetText}
         feedback={engine.feedback}
         onPrev={engine.handlePrev}
         onNext={engine.handleNext}
         onSpeak={engine.handleSpeak}
         onMastered={engine.handleMastered}
         onUnfamiliar={engine.handleUnfamiliar}
         onSwitchMode={handleSwitchMode}
         onToggleAnswer={handleToggleAnswer}
         answerVisible={answerVisible}
         canPrev={engine.currentIndex > 0}
         canNext={engine.currentIndex < engine.totalItems - 1}
         spaceLabel={
           engine.isFreeMode
             ? '空格输入'
             : engine.feedback === 'correct'
               ? '下一题 / Space'
               : '提交 / Enter'
         }
         spaceAction={engine.handleSpacePress}
         soundEnabled={soundEnabled}
         suppressInternalSound={!soundEnabled}
         fingerGuideEnabled={fingerGuideEnabled}
         targetKey={targetKey}
       />

      {/* 隐藏 textarea 用于焦点 */}
      <textarea
        ref={textareaRef}
        className="absolute opacity-0 pointer-events-none -z-10"
        autoFocus
        value=""
        readOnly
      />

      {/* 结果弹窗 */}
      <ResultModal
        open={showResult}
        wpm={engine.wpm}
        cpm={engine.cpm}
        accuracy={displayStatsAccuracy}
        duration={engine.elapsedSeconds}
        errors={engine.wrongCount}
        correctChars={engine.totalCorrectChars}
        totalChars={engine.totalTypedChars}
         bestStreak={engine.bestStreak}
         bestWpm={stats?.bestWpm}
         wpmHistory={engine.wpmHistory}
        onClose={handleResultClose}
        onRetry={handleRetry}
        onBackToList={handleResultBackToList}
        onNextCourse={() => {}}
        hasNextCourse={false}
      />
    </div>
  );
};

export default TypingPracticePage;
