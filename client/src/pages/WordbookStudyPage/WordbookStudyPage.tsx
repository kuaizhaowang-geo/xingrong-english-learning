import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import StudyCard from './components/StudyCard';
import StudyResult from './components/StudyResult';
import { StudyHeader, StudyFooter } from './components/StudyLayout';
import type {
  UserWordbook,
  UserWordbookItem,
  WordbookStudyMode,
} from '@shared/api.interface';

const WordbookStudyPage: React.FC = () => {
  const { wordbookId = '' } = useParams<{ wordbookId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = (searchParams.get('mode') || 'typing') as WordbookStudyMode;

  const [wordbook, setWordbook] = useState<UserWordbook | null>(null);
  const [items, setItems] = useState<UserWordbookItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<UserWordbookItem[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [studyRecords, setStudyRecords] = useState<
    { itemId: string; correct: boolean; durationSeconds: number }[]
  >([]);

  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionResult, setSessionResult] = useState<{
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
    durationSeconds: number;
  } | null>(null);

  const itemStartTimeRef = useRef<number>(Date.now());
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    if (!wordbookId) return;
    setLoading(true);
    setError(null);
    try {
      const [wb, res] = await Promise.all([
        wordbookApi.getWordbook(wordbookId),
        wordbookApi.getStudyItems(wordbookId, { limit: 50, mode }),
      ]);
      setWordbook(wb);
      setItems(res.items || []);
      setStartTime(Date.now());
      itemStartTimeRef.current = Date.now();
    } catch (err) {
      logger.error('加载学习数据失败', { error: String(err) });
      setError('加载失败，请返回重试');
    } finally {
      setLoading(false);
    }
  }, [wordbookId, mode]);

  useEffect(() => {
    loadData();
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [loadData]);

  const currentItem = items[currentIndex];
  const total = items.length;

  const getCorrectAnswer = (item: UserWordbookItem): string => {
    switch (mode) {
      case 'typing':
      case 'dictation':
      case 'following':
      case 'speaking':
        return item.content;
      case 'pinyin':
        return item.extra?.pinyin || item.answer || item.content;
      case 'character-write':
      case 'pinyin-read':
      case 'text-read':
        return item.content;
      case 'mental-math':
        return item.answer || item.extra?.formula || '';
      case 'formula-memory':
        return item.extra?.formula || item.answer || item.content;
      case 'knowledge-review':
        return item.extra?.knowledgePoint || item.answer || item.content;
      case 'choice':
        return item.answer || item.content;
      default:
        return item.answer || item.content;
    }
  };

  const checkAnswer = useCallback(
    (userAnswer: string, correctAns: string): boolean => {
      const normalize = (s: string): string =>
        s.trim().toLowerCase().replace(/\s+/g, ' ');
      return normalize(userAnswer) === normalize(correctAns);
    },
    [],
  );

  const submitRecord = useCallback(
    (item: UserWordbookItem, correct: boolean, durationSec: number): void => {
      setStudyRecords((prev) => [
        ...prev,
        { itemId: item.id, correct, durationSeconds: durationSec },
      ]);
      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongCount((c) => c + 1);
        setWrongItems((prev) => [...prev, item]);
      }
    },
    [],
  );

  const completeSession = useCallback(async (): Promise<void> => {
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const totalCount = correctCount + wrongCount;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

    try {
      if (studyRecords.length > 0) {
        await wordbookApi.submitStudyRecord(studyRecords);
      }
      const result = await wordbookApi.completeStudySession(wordbookId, {
        mode,
        total: totalCount,
        correct: correctCount,
        wrong: wrongCount,
        durationSeconds,
      });
      setSessionResult(result);
    } catch (err) {
      logger.error('提交学习记录失败', { error: String(err) });
      setSessionResult({
        total: totalCount,
        correct: correctCount,
        wrong: wrongCount,
        accuracy,
        durationSeconds,
      });
    }
    setIsCompleted(true);
  }, [wordbookId, mode, correctCount, wrongCount, startTime, studyRecords]);

  const goToNext = useCallback((): void => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    if (currentIndex >= items.length - 1) {
      completeSession();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setUserInput('');
    setSelectedOption(null);
    setShowAnswer(false);
    setFeedback(null);
    itemStartTimeRef.current = Date.now();
  }, [currentIndex, items.length, completeSession]);

  const goToPrev = useCallback((): void => {
    if (currentIndex <= 0) return;
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setCurrentIndex((i) => i - 1);
    setUserInput('');
    setSelectedOption(null);
    setShowAnswer(false);
    setFeedback(null);
    itemStartTimeRef.current = Date.now();
  }, [currentIndex]);

  const handleSubmit = useCallback((): void => {
    if (feedback || !currentItem) return;
    const correctAns = getCorrectAnswer(currentItem);
    const isCorrect = checkAnswer(userInput, correctAns);
    const durationSec = Math.floor((Date.now() - itemStartTimeRef.current) / 1000);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    submitRecord(currentItem, isCorrect, durationSec);

    autoNextTimerRef.current = setTimeout(() => {
      goToNext();
    }, 600);
  }, [feedback, currentItem, userInput, checkAnswer, submitRecord, goToNext]);

  const handleReveal = useCallback((): void => {
    setShowAnswer(true);
  }, []);

  const handleSelfJudge = useCallback(
    (correct: boolean): void => {
      if (feedback || !currentItem) return;
      const durationSec = Math.floor(
        (Date.now() - itemStartTimeRef.current) / 1000,
      );
      setFeedback(correct ? 'correct' : 'wrong');
      submitRecord(currentItem, correct, durationSec);

      autoNextTimerRef.current = setTimeout(() => {
        goToNext();
      }, 600);
    },
    [feedback, currentItem, submitRecord, goToNext],
  );

  const handleOptionSelect = useCallback(
    (option: string): void => {
      if (feedback || !currentItem) return;
      setSelectedOption(option);

      const correctAns = getCorrectAnswer(currentItem);
      const hasOptions = (currentItem.extra?.options?.length || 0) > 0;
      const isCorrect = hasOptions
        ? option === correctAns
        : (correctAns === '对' || correctAns === '正确' || correctAns === 'true')
            ? option === '对'
            : option === '错';

      const durationSec = Math.floor(
        (Date.now() - itemStartTimeRef.current) / 1000,
      );
      setFeedback(isCorrect ? 'correct' : 'wrong');
      submitRecord(currentItem, isCorrect, durationSec);

      autoNextTimerRef.current = setTimeout(() => {
        goToNext();
      }, 600);
    },
    [feedback, currentItem, submitRecord, goToNext],
  );

  const handlePlayHint = useCallback((): void => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1500);
  }, []);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setUserInput('');
    setSelectedOption(null);
    setShowAnswer(false);
    setFeedback(null);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongItems([]);
    setStudyRecords([]);
    setIsCompleted(false);
    setSessionResult(null);
    setStartTime(Date.now());
    itemStartTimeRef.current = Date.now();
    loadData();
  }, [loadData]);

  const handleBack = useCallback((): void => {
    navigate(`/my-wordbook/${wordbookId}`);
  }, [navigate, wordbookId]);

  const handleRetryWrong = useCallback((): void => {
    if (wrongItems.length === 0) return;
    setItems(wrongItems);
    setCurrentIndex(0);
    setUserInput('');
    setSelectedOption(null);
    setShowAnswer(false);
    setFeedback(null);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongItems([]);
    setStudyRecords([]);
    setIsCompleted(false);
    setSessionResult(null);
    setStartTime(Date.now());
    itemStartTimeRef.current = Date.now();
  }, [wrongItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isCompleted || loading || !currentItem) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (feedback) goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Enter' && feedback) {
        e.preventDefault();
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, loading, currentItem, feedback, goToNext, goToPrev]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#EEF2FF' }}
      >
        <div className="text-center" style={{ color: '#94A3B8' }}>
          <div className="text-2xl mb-2">加载中...</div>
          <div className="text-sm">正在准备学习内容</div>
        </div>
      </div>
    );
  }

  if (error || !wordbook) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#EEF2FF' }}
      >
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: '#EF476F' }}>
            {error || '词库不存在'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            }}
          >
            返回词库
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#EEF2FF' }}
      >
        <div className="text-center">
          <p className="text-lg mb-2" style={{ color: '#F1F5F9' }}>
            暂无学习内容
          </p>
          <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
            该词库还没有题目，请先添加内容
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            }}
          >
            返回词库
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && sessionResult) {
    return (
      <StudyResult
        total={sessionResult.total}
        correct={sessionResult.correct}
        wrong={sessionResult.wrong}
        accuracy={sessionResult.accuracy}
        durationSeconds={sessionResult.durationSeconds}
        wrongItems={wrongItems}
        modeLabel={
          {
            typing: '打字练习',
            dictation: '听写模式',
            following: '跟读模式',
            speaking: '看说模式',
            pinyin: '拼音打字',
            'character-write': '生字听写',
            'pinyin-read': '看拼音写汉字',
            'text-read': '课文跟读',
            'mental-math': '口算练习',
            'formula-memory': '公式记忆',
            'knowledge-review': '知识点复习',
            choice: '选择题练习',
          }[mode]
        }
        wordbookName={wordbook.name}
        onBack={handleBack}
        onRestart={handleRestart}
        onRetryWrong={handleRetryWrong}
      />
    );
  }

  const answeredCount = correctCount + wrongCount;
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#EEF2FF' }}
    >
      <StudyHeader
        wordbookName={wordbook.name}
        mode={mode}
        currentIndex={currentIndex}
        total={total}
        accuracy={accuracy}
        onBack={handleBack}
      />

      <main className="flex-1 flex items-center justify-center p-6">
        {currentItem && (
          <StudyCard
            item={currentItem}
            mode={mode}
            feedback={feedback}
            showAnswer={showAnswer}
            userInput={userInput}
            selectedOption={selectedOption}
            onInputChange={setUserInput}
            onSubmit={handleSubmit}
            onReveal={handleReveal}
            onSelfJudge={handleSelfJudge}
            onOptionSelect={handleOptionSelect}
            onPlayHint={handlePlayHint}
            isPlaying={isPlaying}
          />
        )}
      </main>

      <StudyFooter
        currentIndex={currentIndex}
        total={total}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
};

export default WordbookStudyPage;
