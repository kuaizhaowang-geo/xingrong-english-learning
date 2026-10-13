import { useState, useEffect, useMemo, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { practiceApi, wordsApi, textbooksApi } from '@client/src/api';
import type { SentencePuzzle, WordItem, ChineseNewWord, MathTopic } from '@shared/api.interface';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import { useSpeech } from '@client/src/hooks/use-speech';
import { useAutoSpeakSetting } from '@client/src/hooks/use-auto-speak-setting';
import { enrichWordParses } from '@client/src/utils/word-parse-enrich';

export type ContentType = 'sentence' | 'word' | 'typing' | 'chinese_char' | 'math';

const MAX_WRONG_ATTEMPTS = 3;

interface UsePracticeEngineArgs {
  lessonId?: string;
  courseId?: string;
  textbookId?: string;
  unitId?: string;
  preschoolCategory?: string;
  preschoolModule?: string;
  contentType?: ContentType;
  practiceMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  soundEffectsEnabled?: boolean;
}

function wordToPuzzle(word: WordItem, index: number): SentencePuzzle {
  const example = word.exampleSentence || '';
  const exampleTrans = word.exampleTranslation || '';
  const posTag = word.partOfSpeech ? `<${word.partOfSpeech}>` : '';
  return {
    id: `word_${word.id}`,
    lessonId: word.textbookId,
    courseId: undefined,
    textbookId: word.textbookId,
    unitId: word.unitId,
    sentence: word.word,
    translation: `${posTag}${word.meaning}`.trim(),
    grammarComponents: [],
    difficulty: 1,
    puzzleOrder: word.wordOrder ?? index,
    illustrationUrl: word.imageUrl || undefined,
    imageUrl: word.imageUrl || undefined,
    sentenceType: example ? example : undefined,
    wordParses: [{
      word: word.word,
      phonetic: word.phonetic || '',
      meaning: word.meaning,
      partOfSpeech: word.partOfSpeech || '',
      grammarRole: 'word',
    }],
  };
}

function typingWordsToPuzzles(words: WordItem[]): SentencePuzzle[] {
  const puzzles: SentencePuzzle[] = [];
  words.forEach((word, idx) => {
    puzzles.push(wordToPuzzle(word, idx * 2));
    if (word.exampleSentence) {
      puzzles.push({
        id: `typing_sentence_${word.id}`,
        lessonId: word.textbookId,
        courseId: undefined,
        textbookId: word.textbookId,
        unitId: word.unitId,
        sentence: word.exampleSentence,
        translation: word.exampleTranslation || word.meaning,
        grammarComponents: [],
        difficulty: 2,
        puzzleOrder: idx * 2 + 1,
        illustrationUrl: word.imageUrl || undefined,
        imageUrl: word.imageUrl || undefined,
        sentenceType: 'typing-sentence',
        wordParses: [],
      });
    }
  });
  return puzzles;
}

function chineseCharToPuzzle(char: ChineseNewWord, index: number): SentencePuzzle {
  const meta = {
    character: char.word,
    pinyin: char.pinyin,
    radical: char.radical,
    strokes: char.strokes,
    meaning: char.meaning,
    partOfSpeech: char.partOfSpeech || '',
  };
  return {
    id: `chinese_char_${index}`,
    sentence: char.pinyin || char.word,
    translation: `${char.word} ${char.meaning || ''}`.trim(),
    grammarComponents: [],
    difficulty: 1,
    puzzleOrder: index,
    sentenceType: 'chinese-char',
    grammarAnalysis: JSON.stringify(meta),
    wordParses: [{
      word: char.word,
      phonetic: char.pinyin || '',
      meaning: char.meaning || '',
      partOfSpeech: char.radical || '',
      grammarRole: 'chinese-char',
    }],
  };
}

function mathTopicToPuzzle(topic: MathTopic, index: number): SentencePuzzle {
  const meta = {
    title: topic.title,
    domain: topic.domain,
    description: topic.description,
    keyPoints: topic.keyPoints,
  };
  const typingTarget = topic.domain && /^[a-zA-Z]+$/.test(topic.domain)
    ? topic.domain
    : topic.title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'math';
  return {
    id: `math_topic_${topic.id}`,
    lessonId: topic.textbookId,
    textbookId: topic.textbookId,
    unitId: topic.unitId,
    sentence: typingTarget,
    translation: topic.title,
    grammarComponents: [],
    difficulty: 1,
    puzzleOrder: topic.topicOrder ?? index,
    sentenceType: 'math-topic',
    grammarAnalysis: JSON.stringify(meta),
    wordParses: [{
      word: topic.title,
      phonetic: '',
      meaning: topic.description || '',
      partOfSpeech: topic.domain || '',
      grammarRole: 'math-topic',
    }],
  };
}

export function usePracticeEngine({
  lessonId,
  courseId,
  textbookId,
  unitId,
  preschoolCategory,
  preschoolModule,
  contentType = 'sentence',
  practiceMode,
  onModeChange,
  soundEffectsEnabled = true,
}: UsePracticeEngineArgs) {
  const [puzzles, setPuzzles] = useState<SentencePuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [masteredMap, setMasteredMap] = useState<Record<string, 'mastered' | 'review'>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [wrongItems, setWrongItems] = useState<Array<{ id: string; sentence: string; translation: string }>>([]);

  const { speak } = useSpeech();
  const { enabled: autoSpeakEnabled } = useAutoSpeakSetting();

  const currentPuzzle = puzzles[currentIndex];
  const targetWords = currentPuzzle?.sentence?.split(' ') || [];

  const enrichedPuzzle = useMemo(() => {
    if (!currentPuzzle) return currentPuzzle;
    const wordParses = enrichWordParses(
      currentPuzzle.sentence,
      currentPuzzle.wordParses,
    );
    return { ...currentPuzzle, wordParses };
  }, [currentPuzzle]);

  const loadWordPuzzles = async (): Promise<SentencePuzzle[]> => {
    if (courseId && lessonId) {
      const lessonTag = `lesson-${lessonId}`;
      const result = await wordsApi.getWords({
        tags: lessonTag,
        pageSize: 50,
        sort: 'order',
      });
      const items: WordItem[] = result.items || [];
      if (items.length > 0) return items.map(wordToPuzzle);
    }
    if (courseId) {
      const result = await wordsApi.getWords({
        tags: 'lesson-1',
        pageSize: 20,
        sort: 'order',
      });
      const items: WordItem[] = result.items || [];
      if (items.length > 0) return items.map(wordToPuzzle);
    }
    const result = await wordsApi.getWords({
      textbookId,
      unitId,
      pageSize: 500,
      sort: 'order',
    });
    const items: WordItem[] = result.items || [];
    if (items.length === 0) {
      const fallback = await wordsApi.getWords({
        pageSize: 20,
        sort: 'alpha_asc',
      });
      return (fallback.items || []).map(wordToPuzzle);
    }
    return items.map(wordToPuzzle);
  };

  const loadTypingPuzzles = async (): Promise<SentencePuzzle[]> => {
    if (courseId && lessonId) {
      const lessonTag = `lesson-${lessonId}`;
      const result = await wordsApi.getWords({
        tags: lessonTag,
        pageSize: 30,
        sort: 'order',
      });
      const items: WordItem[] = result.items || [];
      if (items.length > 0) return typingWordsToPuzzles(items);
    }
    if (courseId) {
      const result = await wordsApi.getWords({
        tags: 'lesson-1',
        pageSize: 15,
        sort: 'order',
      });
      const items: WordItem[] = result.items || [];
      if (items.length > 0) return typingWordsToPuzzles(items);
    }
    const result = await wordsApi.getWords({
      textbookId,
      unitId,
      pageSize: 500,
      sort: 'order',
    });
    const items: WordItem[] = result.items || [];
    if (items.length === 0) {
      const fallback = await wordsApi.getWords({
        pageSize: 15,
        sort: 'alpha_asc',
      });
      return typingWordsToPuzzles(fallback.items || []);
    }
    return typingWordsToPuzzles(items);
  };

  const loadChineseCharPuzzles = async (): Promise<SentencePuzzle[]> => {
    if (!textbookId) return [];
    const chars = await textbooksApi.getChineseCharacters({
      textbookId,
      unitId,
    });
    return chars.slice(0, 20).map((c: ChineseNewWord, i: number) => chineseCharToPuzzle(c, i));
  };

  const loadMathPuzzles = async (): Promise<SentencePuzzle[]> => {
    if (!textbookId || !unitId) return [];
    const result = await textbooksApi.getUnitLessons(textbookId, unitId);
    const topics: MathTopic[] = result.mathTopics || [];
    return topics.slice(0, 15).map((t: MathTopic, i: number) => mathTopicToPuzzle(t, i));
  };

  const loadPuzzles = async () => {
    setLoading(true);
    try {
      let data: SentencePuzzle[] = [];
      if (contentType === 'word') {
        data = await loadWordPuzzles();
      } else if (contentType === 'typing') {
        data = await loadTypingPuzzles();
      } else if (contentType === 'chinese_char') {
        data = await loadChineseCharPuzzles();
      } else if (contentType === 'math') {
        data = await loadMathPuzzles();
      } else {
        data = await practiceApi.getSentencePuzzles({
          lessonId,
          courseId,
          textbookId,
          unitId,
          preschoolCategory,
          preschoolModule,
          limit: 15,
        });
      }
      setPuzzles(data);
      setCurrentIndex(0);
      setScore(0);
      setMasteredMap({});
      if (data.length > 0) {
        resetPuzzleState(data[0]);
      }
    } catch (err) {
      logger.error('加载练习内容失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const resetPuzzleState = (_puzzle: SentencePuzzle) => {
    setFeedback('none');
    setShowHint(false);
    setWrongAttempts(0);
    setImgError(false);
    setStartTime(Date.now());
  };

  useEffect(() => {
    loadPuzzles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, courseId, textbookId, unitId, preschoolCategory, preschoolModule, contentType]);

  useEffect(() => {
    if (currentPuzzle) {
      resetPuzzleState(currentPuzzle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (!currentPuzzle || !autoSpeakEnabled) return;
    if (!soundEffectsEnabled) return;
    const timer = window.setTimeout(() => {
      const isChinese = currentPuzzle.sentenceType === 'chinese-char';
      const speakText = isChinese && currentPuzzle.translation
        ? currentPuzzle.translation.split(' ')[0]
        : currentPuzzle.sentence;
      speak(speakText, { lang: isChinese ? 'zh-CN' : 'en-US' });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentPuzzle, autoSpeakEnabled, soundEffectsEnabled, speak]);

  const submitResult = async (isCorrect: boolean, extra?: Record<string, unknown>) => {
    if (!currentPuzzle) return;
    const puzzleId = currentPuzzle.id;
    const alreadyCompleted = completedSet.has(puzzleId);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await practiceApi.submitSentenceResult({
        puzzleId: currentPuzzle.id,
        isCorrect,
        timeSpentSeconds: timeSpent,
        practiceMode,
        lessonId,
        courseId,
        textbookId,
        unitId,
        preschoolCategory,
        preschoolModule,
        ...extra,
      });
    } catch (err) {
      logger.error('提交结果失败', err as Error);
    }
    if (!alreadyCompleted) {
      setCompletedSet((prev) => new Set(prev).add(puzzleId));
      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setCurrentStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setWrongCount((c) => c + 1);
        setCurrentStreak(0);
        setWrongItems((prev) => {
          if (prev.some((w) => w.id === puzzleId)) return prev;
          return [...prev, { id: puzzleId, sentence: currentPuzzle.sentence, translation: currentPuzzle.translation }];
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < puzzles.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const handleJumpTo = (index: number) => {
    if (index >= 0 && index < puzzles.length) setCurrentIndex(index);
  };

  const handleSpeak = (speechRate: number = 1) => {
    if (!soundEffectsEnabled) return;
    if (currentPuzzle) {
      const isChinese = currentPuzzle.sentenceType === 'chinese-char';
      const speakText = isChinese && currentPuzzle.translation
        ? currentPuzzle.translation.split(' ')[0]
        : currentPuzzle.sentence;
      speak(speakText, { lang: isChinese ? 'zh-CN' : 'en-US', rate: speechRate });
    }
  };

  const handleMastered = () => {
    if (!currentPuzzle) return;
    setMasteredMap((prev) => ({ ...prev, [currentPuzzle.id]: 'mastered' }));
  };

  const handleUnfamiliar = () => {
    if (!currentPuzzle) return;
    setMasteredMap((prev) => ({ ...prev, [currentPuzzle.id]: 'review' }));
  };

  const handleBatchMastered = () => {
    const next: Record<string, 'mastered' | 'review'> = {};
    puzzles.forEach((p) => { next[p.id] = 'mastered'; });
    setMasteredMap(next);
  };

  const handleBatchUnfamiliar = () => {
    const next: Record<string, 'mastered' | 'review'> = {};
    puzzles.forEach((p) => { next[p.id] = 'review'; });
    setMasteredMap(next);
  };

  const handleResetProgress = () => {
    setCurrentIndex(0);
    setScore(0);
    setMasteredMap({});
    setCurrentStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCompletedSet(new Set());
    setWrongItems([]);
    if (puzzles[0]) resetPuzzleState(puzzles[0]);
  };

  const sentenceList = useMemo(
    () => puzzles.map((p) => ({ id: p.id, sentence: p.sentence, translation: p.translation })),
    [puzzles],
  );

  const masteryStatus = currentPuzzle ? masteredMap[currentPuzzle.id] : undefined;

  const masteredCount = useMemo(
    () => Object.values(masteredMap).filter((v) => v === 'mastered').length,
    [masteredMap],
  );

  const unfamiliarCount = useMemo(
    () => Object.values(masteredMap).filter((v) => v === 'review').length,
    [masteredMap],
  );

  const isFinished = useMemo(
    () => !loading && puzzles.length > 0 && currentIndex >= puzzles.length - 1 && feedback === 'correct',
    [loading, puzzles, currentIndex, feedback],
  );

  return {
    puzzles,
    loading,
    currentIndex,
    score,
    feedback,
    wrongAttempts,
    showHint,
    imgError,
    currentPuzzle: enrichedPuzzle,
    targetWords,
    sentenceList,
    masteryStatus,
    masteredMap,
    masteredCount,
    unfamiliarCount,
    currentStreak,
    bestStreak,
    correctCount,
    wrongCount,
    completedSet,
    wrongItems,
    startTime,
    isFinished,
    setFeedback,
    setWrongAttempts,
    setScore,
    setImgError,
    setShowHint,
    loadPuzzles,
    resetPuzzleState,
    submitResult,
    handlePrev,
    handleNext,
    handleJumpTo,
    handleSpeak,
    handleMastered,
    handleUnfamiliar,
    handleBatchMastered,
    handleBatchUnfamiliar,
    handleResetProgress,
    MAX_WRONG_ATTEMPTS,
  };
}
