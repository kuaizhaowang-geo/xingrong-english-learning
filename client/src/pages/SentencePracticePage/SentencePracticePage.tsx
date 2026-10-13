import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePracticeBack from '@client/src/hooks/use-practice-back';
import {
  ArrowLeft,
  Trophy,
  RotateCcw,
  Loader2,
  Lightbulb,
  Pause,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { motion, AnimatePresence } from 'framer-motion';

import PracticeTopBar from './PracticeTopBar';
import PracticeControlBar from './PracticeControlBar';
import PracticeContentArea from './PracticeContentArea';
import PracticeKeyboardArea from './PracticeKeyboardArea';
import PracticeStatsBar from './components/PracticeStatsBar';
import PracticeReportModal from './modals/PracticeReportModal';
import CompletionModal from './modals/CompletionModal';
import PracticeToast from '@client/src/components/practice-toast';
import PauseEncouragement from '@client/src/components/pause-encouragement';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import StartModeSelector, {
  getAskModeEnabled,
  getDefaultMode,
  getLastModeForCourse,
  setLastModeForCourse,
} from './StartModeSelector';

import { useTextbookData } from './hooks/useTextbookData';
import { usePracticeEngine } from './hooks/usePracticeEngine';
import { useTypingMode } from './hooks/useTypingMode';
import { useDictationMode } from './hooks/useDictationMode';
import { useRecordingMode } from './hooks/useRecordingMode';
import {
  usePracticeSettings,
  usePauseTimer,
  useToast,
} from './hooks/usePracticeSettings';
import { useGameSounds } from '@client/src/hooks/use-game-sounds';
import { useSettingsStore } from '@client/src/pages/SettingsPage/store/settingsStore';

const SENTENCE_TYPE_LABELS: Record<string, string> = {
  simple: '简单句',
  compound: '并列句',
  complex: '复合句',
};

const SentencePracticePage: React.FC = () => {
  const navigate = useNavigate();
  const handleBack = usePracticeBack();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;
  const modeParam = searchParams.get('mode');
  const preschoolCategory = searchParams.get('preschoolCategory') || undefined;
  const preschoolModule = searchParams.get('preschoolModule') || undefined;
  const contentTypeParam = searchParams.get('contentType') || undefined;
  const urlMode = (modeParam && ['watch-speak', 'dictation', 'typing', 'shadowing'].includes(modeParam))
    ? (modeParam as PracticeMode)
    : undefined;

  // ─── Hooks ─────────────────────────────────────────
  const textbookData = useTextbookData();

  const courseKey = courseId
    ? `course_${courseId}`
    : textbookData.selectedTextbookId && textbookData.selectedUnitId
      ? `tb_${textbookData.selectedTextbookId}_${textbookData.selectedUnitId}`
      : 'default';

  const [showStartSelector, setShowStartSelector] = useState<boolean>(false);
  const [startModeResolved, setStartModeResolved] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showCompletion, setShowCompletion] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const practiceSettings = usePracticeSettings({ initialMode: urlMode || 'typing' });
  const pauseTimer = usePauseTimer();
  const toast = useToast();
  const { playCorrect, playVictory } = useGameSounds();

    const engine = usePracticeEngine({
      lessonId,
      courseId,
      textbookId: textbookData.selectedTextbookId,
      unitId: textbookData.selectedUnitId,
      preschoolCategory,
      preschoolModule,
      contentType: contentTypeParam as 'sentence' | 'word' | 'typing' | 'chinese_char' | 'math' | undefined,
      practiceMode: practiceSettings.practiceMode,
      onModeChange: practiceSettings.handleModeChange,
      soundEffectsEnabled: practiceSettings.settings.soundEffectsEnabled,
    });

    useEffect(() => {
      if (!engine.loading && engine.puzzles.length > 0 && !startModeResolved) {
        if (urlMode) {
          if (urlMode !== practiceSettings.practiceMode) {
            practiceSettings.handleModeChange(urlMode);
          }
          setStartModeResolved(true);
        } else {
          const askEnabled = getAskModeEnabled();
          if (askEnabled) {
            setShowStartSelector(true);
          } else {
            const lastMode = getLastModeForCourse(courseKey);
            const mode = lastMode || getDefaultMode();
            if (mode !== practiceSettings.practiceMode) {
              practiceSettings.handleModeChange(mode);
            }
            setStartModeResolved(true);
          }
        }
      }
    }, [engine.loading, engine.puzzles.length, startModeResolved, courseKey, practiceSettings, urlMode]);

  // 打字模式
  const spaceInputMode = useSettingsStore((s) => s.answer.spaceInputMode);

  const typing = useTypingMode({
    currentPuzzle: engine.currentPuzzle,
    feedback: engine.feedback,
    wrongAttempts: engine.wrongAttempts,
    maxWrongAttempts: engine.MAX_WRONG_ATTEMPTS,
    spaceInputMode,
    onCorrect: () => {
      engine.setFeedback('correct');
      playCorrect();
      if (engine.wrongAttempts === 0) engine.setScore((s) => s + 10);
      engine.submitResult(true);
    },
    onWrong: () => {
      const next = engine.wrongAttempts + 1;
      engine.setWrongAttempts(next);
      if (next >= engine.MAX_WRONG_ATTEMPTS) {
        engine.setFeedback('wrong');
        engine.submitResult(false);
      }
    },
    onFeedbackReset: () => {
      engine.setFeedback('none');
    },
  });

  // 听写模式
  const dictation = useDictationMode({
    currentPuzzle: engine.currentPuzzle,
    feedback: engine.feedback,
    onSubmit: (fullAnswer: string) => {
      if (!engine.currentPuzzle || engine.feedback === 'correct') return;
      const isCorrect =
        fullAnswer.trim().toLowerCase() ===
        engine.currentPuzzle.sentence.trim().toLowerCase();
      if (isCorrect) {
        engine.setFeedback('correct');
        playCorrect();
        if (engine.wrongAttempts === 0) engine.setScore((s) => s + 10);
        engine.submitResult(true);
      } else {
        const next = engine.wrongAttempts + 1;
        engine.setWrongAttempts(next);
        engine.setFeedback('wrong');
        engine.submitResult(false);
      }
    },
  });

  // 录音模式
  const recording = useRecordingMode({
    currentPuzzle: engine.currentPuzzle,
    practiceMode: practiceSettings.practiceMode as 'watch-speak' | 'shadowing',
    onRecordingFinish: () => {
      if (!engine.currentPuzzle) return;
      engine.setFeedback('correct');
      playCorrect();
      if (engine.wrongAttempts === 0) engine.setScore((s) => s + 10);
      engine.submitResult(true);
    },
  });

  // ─── 初始化 ─────────────────────────────────────────
  useEffect(() => {
    textbookData.loadTextbooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 重置模式相关状态（切换模式时）
  useEffect(() => {
    recording.reset();
    engine.setFeedback('none');
    engine.setWrongAttempts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceSettings.practiceMode]);

  // 完成后自动切题（所有模式统一走这里）
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (
      engine.feedback === 'correct' &&
      engine.currentIndex < engine.puzzles.length - 1 &&
      practiceSettings.settings.autoNextEnabled
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
  }, [
    engine.feedback,
    engine.currentIndex,
    engine.puzzles.length,
    engine,
    practiceSettings.settings.autoNextEnabled,
  ]);

  // ─── 键盘快捷键 ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        engine.handleMastered();
        toast.show('已加入熟练句库', 'success');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        engine.handleUnfamiliar();
        toast.show('已加入复习清单', 'warning');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        engine.handleNext();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        practiceSettings.handleSwitchMode();
      } else if (
        e.key === ' ' &&
        (practiceSettings.practiceMode === 'watch-speak' ||
          practiceSettings.practiceMode === 'shadowing')
      ) {
        e.preventDefault();
        recording.handleRecordToggle();
      } else if (e.key.toLowerCase() === 'r') {
        engine.handleSpeak(practiceSettings.settings.speechRate);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceSettings.practiceMode, engine.currentIndex, engine.puzzles.length]);

  const handleSubmitFeedback = (data: { errorType: string; description: string }) => {
    logger.info(`反馈提交: ${JSON.stringify(data)}`);
  };

  const handleMasteredBtn = () => {
    engine.handleMastered();
    toast.show('已加入熟练句库', 'success');
  };

  const handleUnfamiliarBtn = () => {
    engine.handleUnfamiliar();
    toast.show('已加入复习清单', 'warning');
  };

  const isFinished = useMemo(
    () =>
      !engine.loading &&
      engine.puzzles.length > 0 &&
      engine.currentIndex >= engine.puzzles.length - 1 &&
      engine.feedback === 'correct',
    [engine.loading, engine.puzzles.length, engine.currentIndex, engine.feedback],
  );

  // 练习计时器（暂停时停止）
  useEffect(() => {
    if (engine.loading || !startModeResolved || practiceSettings.isPaused) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [engine.loading, startModeResolved, practiceSettings.isPaused]);

  const accuracy = useMemo(() => {
    const total = engine.correctCount + engine.wrongCount;
    if (total === 0) return 0;
    return Math.round((engine.correctCount / total) * 100);
  }, [engine.correctCount, engine.wrongCount]);

  // 全部通关播放胜利音效并弹出报告+完成弹窗
  useEffect(() => {
    if (isFinished) {
      playVictory();
      setShowCompletion(true);
      setShowReport(true);
    }
  }, [isFinished, playVictory]);

  // ─── 加载/空/完成状态 ───────────────────────────────
   if (engine.loading && !textbookData.textbooksLoading) {
    return (
       <div className="h-screen flex flex-col items-center justify-center gap-3 overflow-hidden tech-bg">
         <Loader2 className="text-fuchsia-400 animate-spin" size={40} />
         <p className="text-slate-400">加载练习中...</p>
      </div>
    );
  }

   if (engine.puzzles.length === 0 && !engine.loading) {
    return (
       <div className="min-h-screen p-6 overflow-y-auto tech-bg">
         <div className="max-w-4xl mx-auto">
           <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6"
           >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
           <div className="glass-card p-4 flex flex-wrap gap-3 items-center mb-6">
              <span className="text-sm font-medium text-slate-200">筛选：</span>
             <select
               value={textbookData.selectedTextbookId || ''}
               onChange={textbookData.handleTextbookChange}
               disabled={textbookData.textbooksLoading}
               className="px-4 py-2 rounded-full bg-white/5 border border-fuchsia-500/20 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-400"
             >
              <option value="">全部教材</option>
              {textbookData.textbooks.map((tb) => (
                <option key={tb.id} value={tb.id}>
                  {tb.title}
                </option>
              ))}
            </select>
            {textbookData.selectedTextbook?.units &&
              textbookData.selectedTextbook.units.length > 0 && (
                <select
                  value={textbookData.selectedUnitId || ''}
                  onChange={textbookData.handleUnitChange}
                 className="px-4 py-2 rounded-full bg-white/5 border border-fuchsia-500/20 text-sm text-slate-200 focus:outline-none focus:border-fuchsia-400"
                 >
                   <option value="">全部单元</option>
                  {textbookData.selectedTextbook.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              )}
          </div>
           <div className="glass-card py-20 flex flex-col items-center gap-4">
             <Lightbulb className="text-fuchsia-400/40" size={64} />
              <h3 className="text-lg font-medium text-white">暂无练习题目</h3>
             <p className="text-sm text-slate-400">该筛选条件下的句子练习正在准备中</p>
          </div>
        </div>
      </div>
    );
  }

   if (isFinished) {
    return (
       <div className="h-screen flex items-center justify-center p-6 overflow-hidden tech-bg">
         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="max-w-md w-full rounded-3xl glass-card p-8 text-center"
         >
           <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#6366F1] to-[#2563EB] flex items-center justify-center mb-6 shadow-neon-purple">
             <Trophy className="text-white" size={40} />
           </div>
           <h2 className="text-2xl font-bold text-white mb-2">练习完成</h2>
           <p className="text-slate-400 mb-6">本轮句子练习已结束</p>
           <div className="inline-block px-8 py-4 bg-white/5 rounded-2xl mb-8 border border-fuchsia-500/20 backdrop-blur-sm">
             <div className="text-sm text-cyan-400 mb-1">本轮得分</div>
             <div className="text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
               {engine.score}
             </div>
           </div>
           <div className="flex items-center justify-center gap-3">
             <button
               onClick={engine.handleResetProgress}
                className="neon-btn flex items-center gap-2 px-5 py-2.5 rounded-full font-medium"
             >
               <RotateCcw size={18} />
               再来一次
             </button>
             <button
               onClick={handleBack}
               className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-medium transition-all bg-gradient-to-r from-[#6366F1] to-[#2563EB] shadow-neon-purple hover:shadow-[0_0_30px_hsla(270_80%_65%_0.5)]"
             >
               返回列表
             </button>
           </div>
        </motion.div>
      </div>
    );
  }

  // ─── 主布局（哇学社风格 6层结构） ───────────────────
  const { currentPuzzle } = engine;

  // 答案显隐状态计算
  const answerVisible = (() => {
    if (practiceSettings.practiceMode === 'typing') return !typing.answerHidden;
    if (practiceSettings.practiceMode === 'dictation') return dictation.showAnswer;
    if (practiceSettings.practiceMode === 'watch-speak') return recording.watchSpeakShowAnswer;
    return false;
  })();

  const handleToggleAnswer = () => {
    if (practiceSettings.practiceMode === 'typing') {
      typing.handleHideAnswer();
    } else if (practiceSettings.practiceMode === 'dictation') {
      dictation.handleToggleAnswer();
    } else if (practiceSettings.practiceMode === 'watch-speak') {
      recording.handleWatchSpeakToggleAnswer();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden items-stretch">
      <PracticeToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={toast.hide}
      />

      {/* 第1层：顶部导航栏 */}
      <PracticeTopBar
        onBack={handleBack}
        unitTitle={textbookData.unitTitle}
        textbookTitle={textbookData.textbookTitle}
        progress={{ current: engine.currentIndex + 1, total: engine.puzzles.length }}
        currentMode={practiceSettings.practiceMode}
        onModeChange={practiceSettings.handleModeChange}
        isPaused={practiceSettings.isPaused}
        onPauseToggle={practiceSettings.handlePauseToggle}
        onResetProgress={engine.handleResetProgress}
        settings={practiceSettings.settings}
        onSettingsChange={practiceSettings.handleSettingsChange}
        sentenceList={engine.sentenceList}
        currentIndex={engine.currentIndex}
        onJumpTo={engine.handleJumpTo}
        currentSentence={currentPuzzle?.sentence || ''}
        currentTranslation={currentPuzzle?.translation || ''}
        onSubmitFeedback={handleSubmitFeedback}
        masteryMap={engine.masteredMap}
        completedSet={engine.completedSet}
        onBatchMastered={engine.handleBatchMastered}
        onBatchUnfamiliar={engine.handleBatchUnfamiliar}
        elapsedSeconds={elapsedSeconds}
        score={engine.score}
      />

      {/* 第2层：控制开关栏 */}
      <PracticeControlBar
        showIllustration={practiceSettings.showIllustration}
        onToggleIllustration={practiceSettings.handleToggleIllustration}
        wordRearrangeMode={practiceSettings.wordRearrangeMode}
        onToggleWordRearrange={practiceSettings.handleToggleWordRearrange}
      />

      {/* 第3层：内容区 */}
      <div className="flex-shrink min-h-0 w-full flex flex-col justify-start items-center py-1 px-4 overflow-hidden relative">
        {/* 暂停遮罩 */}
        <AnimatePresence>
          {practiceSettings.isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
             className="absolute inset-0 z-20 bg-[#0F0D24]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
             >
               <div className="w-20 h-20 rounded-full border-2 border-fuchsia-400/60 flex items-center justify-center shadow-neon-purple">
                 <Pause className="text-fuchsia-400" size={36} />
               </div>
               <p className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-wider">已暂停</p>
               <p className="text-sm text-slate-400">点击上方继续按钮恢复练习</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${practiceSettings.practiceMode}-${engine.currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {currentPuzzle && (
              <PracticeContentArea
                mode={practiceSettings.practiceMode}
                sentence={currentPuzzle.sentence}
                translation={currentPuzzle.translation}
                wordParses={currentPuzzle.wordParses || []}
                illustrationUrl={
                  currentPuzzle.illustrationUrl || currentPuzzle.imageUrl
                }
                showGrammarTags={practiceSettings.showGrammarTags}
                showIllustration={practiceSettings.showIllustration}
                phoneticVisible={practiceSettings.settings.phoneticVisible}
                partOfSpeechVisible={practiceSettings.settings.partOfSpeechVisible}
                wordRearrangeMode={practiceSettings.wordRearrangeMode}
                imageError={engine.imgError}
                onImageError={() => engine.setImgError(true)}
                sentenceType={currentPuzzle.sentenceType}
                grammarAnalysis={currentPuzzle.grammarAnalysis}
                userInput={typing.userInput}
                 completedWords={typing.completedWords}
                 answerHidden={typing.answerHidden}
                 feedback={engine.feedback}
                 wrongAttempts={engine.wrongAttempts}
                 showHint={engine.showHint}
                 progress={typing.progress}
                 targetOrigIndexes={typing.targetOrigIndexes}
                 totalTargetChars={typing.totalTargetChars}
                 wrongMarker={typing.wrongMarker}
                  dictationWordInputs={dictation.wordInputs}
                  dictationCurrentWordIdx={dictation.currentWordIdx}
                  dictationShowAnswer={dictation.showAnswer}
                  onDictationWordChange={dictation.handleWordChange}
                  onDictationWordKeyDown={dictation.handleWordKeyDown}
                  dictationInputRefs={dictation.inputRefs}
                  onDictationSpeak={() =>
                    engine.handleSpeak(practiceSettings.settings.speechRate)
                  }
                  onDictationReveal={dictation.handleReveal}
                  isRecording={recording.isRecording}
                  isAnalyzing={recording.isAnalyzing}
                  onRecordToggle={recording.handleRecordToggle}
                  onRetryRecording={recording.handleRetry}
                  watchSpeakHasRecorded={recording.watchSpeakHasRecorded}
                  watchSpeakShowAnswer={recording.watchSpeakShowAnswer}
                  watchSpeakScore={recording.watchSpeakScore}
                  onWatchSpeakReveal={recording.handleWatchSpeakReveal}
                  onSpeak={() =>
                    engine.handleSpeak(practiceSettings.settings.speechRate)
                  }
                  speaking={false}
                  shadowingHasRecorded={recording.shadowingHasRecorded}
                  shadowingScore={recording.shadowingScore}
                  recordingHighScore={recording.highScore}
                  recordingDuration={recording.recordingDuration}
                   hasPermissionError={recording.hasPermissionError}
                   onRearrangeSubmit={(words) => {
                     const isCorrect =
                       words.join(' ').toLowerCase() ===
                       currentPuzzle.sentence.trim().toLowerCase();
                     if (isCorrect) {
                       engine.setFeedback('correct');
                       playCorrect();
                       if (engine.wrongAttempts === 0) engine.setScore((s) => s + 10);
                       engine.submitResult(true);
                     } else {
                       const next = engine.wrongAttempts + 1;
                       engine.setWrongAttempts(next);
                       if (next >= engine.MAX_WRONG_ATTEMPTS) {
                         engine.setFeedback('wrong');
                         engine.submitResult(false);
                       }
                     }
                   }}
                   onRearrangeReset={() => {
                     engine.setFeedback('none');
                   }}
                   rearrangeDisabled={engine.feedback !== 'none'}
                  />
                )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* 第5层：键盘区 (标准布局：含空格键左右快捷按钮) */}
      <PracticeKeyboardArea
        mode={practiceSettings.practiceMode}
        keyboardVisible={practiceSettings.settings.keyboardVisible}
        fingerGuideEnabled={practiceSettings.settings.fingerGuideEnabled}
        contentType={contentTypeParam as 'sentence' | 'word' | 'typing' | 'chinese_char' | 'math' | undefined}
        userInput={typing.userInput}
        onInputChange={typing.handleInputChange}
        onSubmit={typing.handleSubmit}
        onSpacePress={typing.handleWordSpaceSubmit}
        onBackspace={typing.handleBackspace}
        targetWord={typing.targetWords[typing.completedWords] || ''}
        completedWords={typing.completedWords}
        totalWords={typing.targetWords.length}
        currentTargetKey={typing.currentTargetKey}
         nextKeyAfterSpace={typing.nextKeyAfterSpace}
         progress={typing.progress}
         totalTargetChars={typing.totalTargetChars}
         feedback={engine.feedback}
         errorResetKey={typing.errorResetKey}
        onPrev={engine.handlePrev}
        onNext={engine.handleNext}
        onSpeak={() =>
          engine.handleSpeak(practiceSettings.settings.speechRate)
        }
        onMastered={handleMasteredBtn}
        onUnfamiliar={handleUnfamiliarBtn}
        spaceInputMode={spaceInputMode}
        onSwitchMode={practiceSettings.handleSwitchMode}
        onHideAnswer={handleToggleAnswer}
        answerHidden={!answerVisible}
        answerVisible={answerVisible}
        onRecord={recording.handleRecordToggle}
        isRecording={recording.isRecording}
        onDictationSubmit={typing.handleSubmit}
        onSkipWord={dictation.handleSkipWord}
        suppressInternalSound={practiceSettings.practiceMode === 'typing'}
        canPrev={engine.currentIndex > 0}
        canNext={engine.currentIndex < engine.puzzles.length - 1}
        soundEnabled={practiceSettings.settings.soundEffectsEnabled}
         spaceLabel={
           practiceSettings.practiceMode === 'typing'
             ? typing.progress >= typing.totalTargetChars - 1 && typing.totalTargetChars > 0
               ? '提交 / Enter'
               : '空格 / 下一词'
             : practiceSettings.practiceMode === 'dictation'
               ? '跳格 / Space'
               : '录制 / Space'
         }
      />

      <CompletionModal
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        elapsedSeconds={elapsedSeconds}
        totalQuestions={engine.puzzles.length}
        hasNextChapter={textbookData.hasNextUnit}
        onRetry={() => {
          engine.handleResetProgress();
          setElapsedSeconds(0);
          setShowCompletion(false);
          setShowReport(false);
        }}
        onNextChapter={() => {
          const ok = textbookData.goToNextUnit();
          if (ok) {
            setShowCompletion(false);
            setShowReport(false);
          }
        }}
        onReturn={() => {
          setShowCompletion(false);
          handleBack();
        }}
      />

      <PracticeReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        score={engine.score}
        totalQuestions={engine.puzzles.length}
        correctCount={engine.correctCount}
        wrongCount={engine.wrongCount}
        accuracy={accuracy}
        elapsedSeconds={elapsedSeconds}
        masteredCount={engine.masteredCount}
        unfamiliarCount={engine.unfamiliarCount}
        bestStreak={engine.bestStreak}
        wrongItems={engine.wrongItems}
        onRetry={() => {
          engine.handleResetProgress();
          setElapsedSeconds(0);
          setShowReport(false);
        }}
        onContinue={() => setShowReport(false)}
        onShare={() => {
          toast.show('分享功能即将上线', 'info');
        }}
      />

      <PauseEncouragement
        visible={pauseTimer.showPause}
        onClose={pauseTimer.handleClosePause}
      />

      <StartModeSelector
        open={showStartSelector}
        onClose={() => {
          setShowStartSelector(false);
          setStartModeResolved(true);
        }}
        courseKey={courseKey}
        onConfirm={(mode: PracticeMode) => {
          setLastModeForCourse(courseKey, mode);
          if (mode !== practiceSettings.practiceMode) {
            practiceSettings.handleModeChange(mode);
          }
          setShowStartSelector(false);
          setStartModeResolved(true);
        }}
      />
    </div>
  );
};

export default SentencePracticePage;
