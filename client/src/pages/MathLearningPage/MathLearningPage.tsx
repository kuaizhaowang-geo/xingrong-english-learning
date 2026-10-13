import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BookOpen,
  Pencil,
  Calculator,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getTextbookUnit,
  getUnitLessons,
  getMathTopic,
  getMentalArithmetic,
} from '@client/src/api/textbooks';
import type {
  TextbookUnit,
  MathTopic,
  MathPracticeItem,
  MentalArithmeticItem,
  MathPracticeOption,
} from '@shared/api.interface';

// ─── 类型 ─────────────────────────────────────────
type Mode = 'topics' | 'examples' | 'practice' | 'mental';

interface TabItem {
  key: Mode;
  label: string;
  icon: React.ReactNode;
}

// ─── 常量 ─────────────────────────────────────────
const TABS: TabItem[] = [
  { key: 'topics', label: '知识点', icon: <BookOpen size={16} /> },
  { key: 'examples', label: '例题', icon: <Lightbulb size={16} /> },
  { key: 'practice', label: '练习', icon: <Pencil size={16} /> },
  { key: 'mental', label: '口算', icon: <Calculator size={16} /> },
];

// ─── 组件 ─────────────────────────────────────────
const MathLearningPage: React.FC = () => {
  const { textbookId, unitId } = useParams<{ textbookId: string; unitId: string }>();
  const navigate = useNavigate();

  // 基础数据
  const [unit, setUnit] = useState<TextbookUnit | null>(null);
  const [mathTopics, setMathTopics] = useState<MathTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [mode, setMode] = useState<Mode>('topics');

  // 当前选中知识点（含详情）
  const [selectedTopic, setSelectedTopic] = useState<
    | (MathTopic & { practiceItems: MathPracticeItem[]; shapePuzzles: unknown[] })
    | null
  >(null);
  const [topicLoading, setTopicLoading] = useState<boolean>(false);

  // 例题
  const [exampleIndex, setExampleIndex] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);

  // 练习
  const [practiceIndex, setPracticeIndex] = useState<number>(0);
  const [practiceInput, setPracticeInput] = useState<string>('');
  const [practiceResults, setPracticeResults] = useState<(boolean | null)[]>([]);
  const [practiceUserAnswers, setPracticeUserAnswers] = useState<string[]>([]);

  // 口算
  const [mentalItems, setMentalItems] = useState<MentalArithmeticItem[]>([]);
  const [mentalIndex, setMentalIndex] = useState<number>(0);
  const [mentalInput, setMentalInput] = useState<string>('');
  const [mentalResults, setMentalResults] = useState<(boolean | null)[]>([]);
  const [mentalFinished, setMentalFinished] = useState<boolean>(false);
  const [mentalLoading, setMentalLoading] = useState<boolean>(false);

  // ─── 加载单元和知识点列表 ────────────────────────
  useEffect(() => {
    if (!textbookId || !unitId) return;
    let cancelled = false;

    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        const [unitData, lessonsData] = await Promise.all([
          getTextbookUnit(textbookId, unitId),
          getUnitLessons(textbookId, unitId),
        ]);
        if (cancelled) return;
        setUnit(unitData);
        setMathTopics(lessonsData.mathTopics || []);
      } catch (error) {
        logger.error(
          `MathLearningPage load unit fail: ${textbookId}/${unitId}`,
          JSON.stringify(error),
        );
        if (!cancelled) setLoadError('加载失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [textbookId, unitId]);

  // ─── 加载口算题 ─────────────────────────────────
  const loadMentalArithmetic = useCallback(async (): Promise<void> => {
    if (!textbookId || !unitId) return;
    if (mentalItems.length > 0) return;
    try {
      setMentalLoading(true);
      const items = await getMentalArithmetic({
        count: 10,
        textbookId,
        unitId,
      });
      setMentalItems(items);
      setMentalResults(new Array(items.length).fill(null));
    } catch (error) {
      logger.error('MathLearningPage load mental arithmetic fail', JSON.stringify(error));
    } finally {
      setMentalLoading(false);
    }
  }, [textbookId, unitId, mentalItems.length]);

  useEffect(() => {
    if (mode === 'mental') {
      loadMentalArithmetic();
    }
  }, [mode, loadMentalArithmetic]);

  // ─── 选择知识点 → 切到例题模式 ─────────────────
  const handleSelectTopic = async (topic: MathTopic): Promise<void> => {
    try {
      setTopicLoading(true);
      const detail = await getMathTopic(topic.id);
      setSelectedTopic(detail);
      setExampleIndex(0);
      setShowSolution(false);
      setPracticeIndex(0);
      setPracticeInput('');
      setPracticeResults(new Array(detail.practiceItems.length).fill(null));
      setPracticeUserAnswers(new Array(detail.practiceItems.length).fill(''));
      setMode('practice');
    } catch (error) {
      logger.error(
        `MathLearningPage load topic fail: ${topic.id}`,
        JSON.stringify(error),
      );
    } finally {
      setTopicLoading(false);
    }
  };

  // ─── 例题导航 ───────────────────────────────────
  const handlePrevExample = (): void => {
    if (!selectedTopic) return;
    setShowSolution(false);
    setExampleIndex((i) => Math.max(0, i - 1));
  };

  const handleNextExample = (): void => {
    if (!selectedTopic) return;
    setShowSolution(false);
    setExampleIndex((i) => Math.min(selectedTopic.examples.length - 1, i + 1));
  };

  // ─── 练习导航 ───────────────────────────────────
  const handlePrevPractice = (): void => {
    if (!selectedTopic?.practiceItems?.length) return;
    setPracticeIndex((i) => {
      const next = Math.max(0, i - 1);
      setPracticeInput(practiceUserAnswers[next] ?? '');
      return next;
    });
  };

  const handleNextPractice = (): void => {
    if (!selectedTopic?.practiceItems?.length) return;
    setPracticeIndex((i) => {
      const next = Math.min(selectedTopic.practiceItems.length - 1, i + 1);
      setPracticeInput(practiceUserAnswers[next] ?? '');
      return next;
    });
  };

  // ─── 练习作答 ───────────────────────────────────
  const submitPracticeAnswer = (answer: string): void => {
    if (!selectedTopic?.practiceItems?.[practiceIndex]) return;
    if (practiceResults[practiceIndex] !== null) return;
    const item = selectedTopic.practiceItems[practiceIndex];
    let isCorrect = false;
    if (item.itemType === 'choice' && item.options && item.options.length > 0) {
      const correctOpt = item.options.find(
        (o: MathPracticeOption) => o.label === item.correctAnswer.trim(),
      );
      isCorrect = answer === (correctOpt?.text ?? item.correctAnswer.trim());
    } else {
      isCorrect = answer.trim() === item.correctAnswer.trim();
    }
    const newResults = [...practiceResults];
    newResults[practiceIndex] = isCorrect;
    setPracticeResults(newResults);
    const newUserAnswers = [...practiceUserAnswers];
    newUserAnswers[practiceIndex] = answer;
    setPracticeUserAnswers(newUserAnswers);
    setPracticeInput(answer);
    if (isCorrect && practiceIndex < selectedTopic.practiceItems.length - 1) {
      setTimeout(() => {
        setPracticeIndex((i) => {
          const next = Math.min(selectedTopic.practiceItems.length - 1, i + 1);
          setPracticeInput('');
          return next;
        });
      }, 1200);
    }
  };

  const handleOptionClick = (opt: MathPracticeOption): void => {
    submitPracticeAnswer(opt.text);
  };

  const handleFillSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!practiceInput.trim()) return;
    submitPracticeAnswer(practiceInput);
  };

  const practiceCorrectCount = useMemo<number>(
    () => practiceResults.filter((r) => r === true).length,
    [practiceResults],
  );

  // ─── 口算作答 ───────────────────────────────────
  const submitMentalAnswer = (answer: string): void => {
    const current = mentalItems[mentalIndex];
    if (!current) return;
    if (mentalResults[mentalIndex] !== null) return;
    const isCorrect = answer.trim() === current.answer.trim();
    const newResults = [...mentalResults];
    newResults[mentalIndex] = isCorrect;
    setMentalResults(newResults);
  };

  const handleMentalOptionClick = (opt: MathPracticeOption): void => {
    setMentalInput(opt.text);
    submitMentalAnswer(opt.text);
  };

  const handleMentalSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!mentalInput.trim()) return;
    submitMentalAnswer(mentalInput);
  };

  const handleNextMental = (): void => {
    if (mentalIndex >= mentalItems.length - 1) {
      setMentalFinished(true);
      return;
    }
    const nextIdx = mentalIndex + 1;
    setMentalIndex(nextIdx);
    // 如果之前答过就回填
    // 口算模式默认每题都是新的，不回填
    setMentalInput('');
  };

  const restartMental = (): void => {
    setMentalIndex(0);
    setMentalInput('');
    setMentalResults([]);
    setMentalFinished(false);
    setMentalItems([]);
    loadMentalArithmetic();
  };

  const mentalCorrectCount = useMemo<number>(
    () => mentalResults.filter((r) => r === true).length,
    [mentalResults],
  );

  const currentExample = selectedTopic?.examples?.[exampleIndex];
  const currentPractice = selectedTopic?.practiceItems?.[practiceIndex];
  const currentPracticeResult = practiceResults[practiceIndex] ?? null;
  const currentMental = mentalItems[mentalIndex];
  const currentMentalResult = mentalResults[mentalIndex] ?? null;

  // ─── 知识点要点拆分 ─────────────────────────────
  const splitKeyPoints = (keyPoints: string): string[] => {
    return keyPoints
      .split(/[,，、；;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // ─── 渲染 ───────────────────────────────────────
  if (loading) {
    return (
      <div
        className="h-screen w-full flex items-center justify-center"
        style={{ color: '#94A3B8' }}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: '#6366F1' }} className="animate-pulse" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ color: '#F1F5F9' }}
    >
      {/* ===== 顶部栏 ===== */}
      <div
        className="h-11 flex items-center justify-between px-2 sm:px-3 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(99, 102, 241, 0.12)' }}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md transition-colors hover:bg-white/5 min-h-11 min-w-11 flex items-center justify-center flex-shrink-0"
            style={{ color: '#94A3B8' }}
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold truncate">
            {unit?.title || '数学学习'}
          </span>
        </div>

        {/* 模式切换 Tab */}
        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
          {TABS.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#6366F1',
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.25)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                      }
                    : {
                        color: '#94A3B8',
                        border: '1px solid transparent',
                      }
                }
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 内容区 ===== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* 模式：知识点列表 */}
        {mode === 'topics' && (
          <div className="space-y-3 max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#F1F5F9' }}>
              知识点列表
              <span className="text-sm font-normal ml-2" style={{ color: '#94A3B8' }}>
                共 {mathTopics.length} 个
              </span>
            </h2>
            {mathTopics.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p style={{ color: '#94A3B8' }}>暂无知识点</p>
              </div>
            ) : (
              mathTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className="rounded-xl p-5 cursor-pointer transition-all group"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 0 20px rgba(99, 102, 241, 0.25)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold mb-2" style={{ color: '#F1F5F9' }}>
                        {topic.title}
                      </h3>
                      <p
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: '#94A3B8' }}
                      >
                        {topic.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {splitKeyPoints(topic.keyPoints).slice(0, 5).map((point, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(34, 211, 238, 0.1)',
                              color: '#06B6D4',
                              border: '1px solid rgba(34, 211, 238, 0.3)',
                            }}
                          >
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className="text-xs flex-shrink-0 px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        color: '#6366F1',
                      }}
                    >
                      {topic.practiceCount} 题
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 模式：例题演示 */}
        {mode === 'examples' && (
          <div className="max-w-3xl mx-auto">
            {topicLoading ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p style={{ color: '#94A3B8' }}>加载中...</p>
              </div>
            ) : !selectedTopic || !selectedTopic.examples?.length ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p style={{ color: '#94A3B8' }}>
                  {selectedTopic ? '暂无例题' : '请先选择一个知识点'}
                </p>
                <button
                  onClick={() => setMode('topics')}
                  className="mt-4 px-4 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: '#6366F1',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  去选择知识点
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl p-5 sm:p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: '#6366F1' }}>
                    例题 {exampleIndex + 1} / {selectedTopic.examples.length}
                  </h3>
                  <span className="text-xs truncate ml-2" style={{ color: '#94A3B8' }}>
                    {selectedTopic.title}
                  </span>
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-medium mb-2" style={{ color: '#94A3B8' }}>
                    题目
                  </h4>
                  <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#F1F5F9' }}>
                    {currentExample?.question}
                  </p>
                </div>

                {showSolution && currentExample?.solution && (
                  <div className="mb-6">
                    <h4 className="text-xs font-medium mb-2" style={{ color: '#06B6D4' }}>
                      解答
                    </h4>
                    <p
                      className="text-sm sm:text-base leading-relaxed whitespace-pre-line"
                      style={{ color: '#F1F5F9' }}
                    >
                      {currentExample.solution}
                    </p>
                  </div>
                )}

                {showSolution && currentExample?.answer && (
                  <div className="mb-6">
                    <h4 className="text-xs font-medium mb-2" style={{ color: '#22C55E' }}>
                      答案
                    </h4>
                    <p className="text-base sm:text-lg font-semibold" style={{ color: '#22C55E' }}>
                      {currentExample.answer}
                    </p>
                  </div>
                )}

                {!showSolution && (
                  <button
                    onClick={() => setShowSolution(true)}
                    className="w-full py-3 rounded-lg text-sm mb-4 transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: 'rgba(34, 211, 238, 0.1)',
                      color: '#06B6D4',
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                    }}
                  >
                    显示解答
                  </button>
                )}

                {/* 导航 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevExample}
                    disabled={exampleIndex === 0}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      color: '#94A3B8',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <ChevronLeft size={16} />
                    上一题
                  </button>
                  <div className="flex gap-1">
                    {selectedTopic.examples.map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            i === exampleIndex ? '#6366F1' : 'rgba(99, 102, 241, 0.2)',
                          boxShadow:
                            i === exampleIndex
                              ? '0 0 8px rgba(99, 102, 241, 0.5)'
                              : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNextExample}
                    disabled={exampleIndex === selectedTopic.examples.length - 1}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    下一题
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 模式：练习题 */}
        {mode === 'practice' && (
          <div className="max-w-3xl mx-auto">
            {topicLoading ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p style={{ color: '#94A3B8' }}>加载中...</p>
              </div>
            ) : !selectedTopic || !selectedTopic.practiceItems?.length ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p style={{ color: '#94A3B8' }}>
                  {selectedTopic ? '暂无练习题' : '请先选择一个知识点'}
                </p>
                <button
                  onClick={() => setMode('topics')}
                  className="mt-4 px-4 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: '#6366F1',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  去选择知识点
                </button>
              </div>
            ) : (
              <div
                className="rounded-xl p-5 sm:p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${
                    currentPracticeResult === true
                      ? 'rgba(34, 197, 94, 0.5)'
                      : currentPracticeResult === false
                      ? 'rgba(239, 71, 111, 0.5)'
                      : 'rgba(99, 102, 241, 0.2)'
                  }`,
                  boxShadow:
                    currentPracticeResult === true
                      ? '0 0 20px rgba(34, 197, 94, 0.3)'
                      : currentPracticeResult === false
                      ? '0 0 20px rgba(239, 71, 111, 0.2)'
                      : '0 0 20px rgba(99, 102, 241, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: '#6366F1' }}>
                      第 {practiceIndex + 1} 题 / 共 {selectedTopic.practiceItems.length} 题
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor:
                          currentPractice?.itemType === 'choice'
                            ? 'rgba(99, 102, 241, 0.08)'
                            : currentPractice?.itemType === 'fill'
                            ? 'rgba(34, 211, 238, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          currentPractice?.itemType === 'choice'
                            ? '#6366F1'
                            : currentPractice?.itemType === 'fill'
                            ? '#06B6D4'
                            : '#2563EB',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {currentPractice?.itemType === 'choice'
                        ? '选择题'
                        : currentPractice?.itemType === 'fill'
                        ? '填空题'
                        : currentPractice?.itemType === 'judge'
                        ? '判断题'
                        : '计算题'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle size={16} style={{ color: '#22C55E' }} />
                    <span style={{ color: '#22C55E' }}>{practiceCorrectCount}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#F1F5F9' }}>
                    {currentPractice?.question}
                  </p>
                </div>

                {/* 选择题 */}
                {currentPractice?.options && currentPractice.options.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {currentPractice.options.map((opt) => {
                    const correctOpt = currentPractice.options?.find(
                      (o: MathPracticeOption) => o.label === currentPractice.correctAnswer.trim(),
                    );
                    const isCorrect = opt.text === correctOpt?.text;
                    const userPicked =
                      currentPracticeResult !== null &&
                      practiceUserAnswers[practiceIndex] === opt.text;
                      const showCorrect = currentPracticeResult !== null && isCorrect;
                      const showWrong = userPicked && currentPracticeResult === false;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleOptionClick(opt)}
                          disabled={currentPracticeResult !== null}
                          className="w-full text-left p-3 sm:p-4 rounded-lg text-sm transition-all flex items-center gap-3 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: showCorrect
                              ? 'rgba(34, 197, 94, 0.15)'
                              : showWrong
                              ? 'rgba(239, 71, 111, 0.15)'
                              : 'rgba(99, 102, 241, 0.08)',
                            border: `1px solid ${
                              showCorrect
                                ? 'rgba(34, 197, 94, 0.6)'
                                : showWrong
                                ? 'rgba(239, 71, 111, 0.6)'
                                : 'rgba(99, 102, 241, 0.2)'
                            }`,
                            color: showCorrect
                              ? '#22C55E'
                              : showWrong
                              ? '#EF476F'
                              : '#F1F5F9',
                            boxShadow: showCorrect
                              ? '0 0 12px rgba(34, 197, 94, 0.4)'
                              : undefined,
                          }}
                        >
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              backgroundColor: showCorrect
                                ? '#22C55E'
                                : showWrong
                                ? '#EF476F'
                                : 'rgba(99, 102, 241, 0.2)',
                              color: '#fff',
                            }}
                          >
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                          {showCorrect && <CheckCircle size={18} />}
                          {showWrong && <XCircle size={18} />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 填空题 */}
                {(!currentPractice?.options || currentPractice.options.length === 0) && (
                  <form onSubmit={handleFillSubmit} className="mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={practiceInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          currentPracticeResult === null && setPracticeInput(e.target.value)
                        }
                        disabled={currentPracticeResult !== null}
                        placeholder="请输入答案"
                        className="flex-1 px-4 py-3 rounded-lg outline-none text-base"
                        style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          border: `1px solid ${
                            currentPracticeResult === true
                              ? 'rgba(34, 197, 94, 0.6)'
                              : currentPracticeResult === false
                              ? 'rgba(239, 71, 111, 0.6)'
                              : 'rgba(99, 102, 241, 0.2)'
                          }`,
                          color: '#F1F5F9',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={
                          currentPracticeResult !== null || !practiceInput.trim()
                        }
                        className="px-5 sm:px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-40"
                        style={{
                          backgroundColor: '#6366F1',
                          color: '#fff',
                          boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)',
                        }}
                      >
                        提交
                      </button>
                    </div>
                  </form>
                )}

                {/* 结果反馈 */}
                {currentPracticeResult !== null && (
                  <div
                    className="mb-6 p-4 rounded-lg"
                    style={{
                      backgroundColor:
                        currentPracticeResult === true
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(239, 71, 111, 0.1)',
                      border: `1px solid ${
                        currentPracticeResult === true
                          ? 'rgba(34, 197, 94, 0.4)'
                          : 'rgba(239, 71, 111, 0.4)'
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {currentPracticeResult === true ? (
                        <>
                          <CheckCircle size={20} style={{ color: '#22C55E' }} />
                          <span className="font-semibold" style={{ color: '#22C55E' }}>
                            回答正确！
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle size={20} style={{ color: '#EF476F' }} />
                          <span className="font-semibold" style={{ color: '#EF476F' }}>
                            回答错误
                          </span>
                        </>
                      )}
                    </div>
                    {currentPracticeResult === false && (
                      <p className="text-sm" style={{ color: '#F1F5F9' }}>
                        正确答案：
                        <span style={{ color: '#22C55E', fontWeight: 600 }}>
                          {currentPractice?.correctAnswer}
                        </span>
                      </p>
                    )}
                    {currentPractice?.solution && (
                      <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
                        解析：{currentPractice.solution}
                      </p>
                    )}
                  </div>
                )}

                {/* 导航 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevPractice}
                    disabled={practiceIndex === 0}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      color: '#94A3B8',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <ChevronLeft size={16} />
                    上一题
                  </button>
                  <div className="flex gap-1 max-w-[50%] overflow-x-auto">
                    {selectedTopic.practiceItems.map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            practiceResults[i] === true
                              ? '#22C55E'
                              : practiceResults[i] === false
                              ? '#EF476F'
                              : i === practiceIndex
                              ? '#6366F1'
                              : 'rgba(99, 102, 241, 0.2)',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNextPractice}
                    disabled={
                      practiceIndex === selectedTopic.practiceItems.length - 1
                    }
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      color: '#6366F1',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    下一题
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 模式：口算练习 */}
        {mode === 'mental' && (
          <div className="max-w-2xl mx-auto">
            {mentalFinished ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.12)',
                }}
              >
                <div className="mb-4">
                  <Sparkles size={40} style={{ color: '#06B6D4' }} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#6366F1' }}>
                  练习完成！
                </h3>
                <div
                  className="text-5xl font-bold mb-2"
                  style={{ color: '#06B6D4', textShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}
                >
                  {mentalCorrectCount}/{mentalItems.length}
                </div>
                <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
                  得分：{Math.round((mentalCorrectCount / (mentalItems.length || 1)) * 100)} 分
                </p>
                <button
                  onClick={restartMental}
                  className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: '#6366F1',
                    color: '#fff',
                    boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  再来一轮
                </button>
              </div>
            ) : mentalLoading || mentalItems.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <Sparkles
                    size={20}
                    style={{ color: '#6366F1' }}
                    className="animate-pulse"
                  />
                  <p style={{ color: '#94A3B8' }}>生成口算题中...</p>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl p-5 sm:p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${
                    currentMentalResult === true
                      ? 'rgba(34, 197, 94, 0.5)'
                      : currentMentalResult === false
                      ? 'rgba(239, 71, 111, 0.5)'
                      : 'rgba(99, 102, 241, 0.2)'
                  }`,
                  boxShadow:
                    currentMentalResult === true
                      ? '0 0 20px rgba(34, 197, 94, 0.3)'
                      : currentMentalResult === false
                      ? '0 0 20px rgba(239, 71, 111, 0.2)'
                      : '0 0 20px rgba(99, 102, 241, 0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm" style={{ color: '#94A3B8' }}>
                    第 {mentalIndex + 1} / {mentalItems.length} 题
                  </span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle size={16} style={{ color: '#22C55E' }} />
                    <span style={{ color: '#22C55E' }}>{mentalCorrectCount}</span>
                  </div>
                </div>

                {/* 进度条 */}
                <div
                  className="w-full h-1.5 rounded-full mb-8"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((mentalIndex + (currentMentalResult !== null ? 1 : 0)) / mentalItems.length) * 100}%`,
                      backgroundColor: '#6366F1',
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.3)',
                    }}
                  />
                </div>

                {/* 题目显示 */}
                <div className="text-center mb-8">
                  <p
                    className="text-3xl sm:text-4xl font-bold tracking-wider"
                    style={{ color: '#F1F5F9' }}
                  >
                    {currentMental?.question}
                  </p>
                </div>

                {/* 选择题 */}
                {currentMental?.itemType === 'choice' && currentMental.options && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {currentMental.options.map((opt) => {
                      const isCorrect = opt.text === currentMental.answer;
                      const showCorrect = currentMentalResult !== null && isCorrect;
                      const showWrong =
                        currentMentalResult === false &&
                        mentalInput === opt.text;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleMentalOptionClick(opt)}
                          disabled={currentMentalResult !== null}
                          className="p-4 rounded-lg text-xl font-bold transition-all disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: showCorrect
                              ? 'rgba(34, 197, 94, 0.15)'
                              : 'rgba(99, 102, 241, 0.08)',
                            border: `1px solid ${
                              showCorrect
                                ? 'rgba(34, 197, 94, 0.6)'
                                : 'rgba(99, 102, 241, 0.2)'
                            }`,
                            color: showCorrect ? '#22C55E' : '#F1F5F9',
                            boxShadow: showCorrect
                              ? '0 0 12px rgba(34, 197, 94, 0.4)'
                              : undefined,
                          }}
                        >
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 填空/数字输入 */}
                {currentMental?.itemType !== 'choice' && (
                  <form onSubmit={handleMentalSubmit} className="mb-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mentalInput}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          currentMentalResult === null && setMentalInput(e.target.value)
                        }
                        disabled={currentMentalResult !== null}
                        placeholder="输入答案"
                        className="flex-1 px-4 py-3 rounded-lg outline-none text-center text-xl font-bold"
                        style={{
                          backgroundColor: 'rgba(99, 102, 241, 0.08)',
                          border: `1px solid ${
                            currentMentalResult === true
                              ? 'rgba(34, 197, 94, 0.6)'
                              : currentMentalResult === false
                              ? 'rgba(239, 71, 111, 0.6)'
                              : 'rgba(99, 102, 241, 0.2)'
                          }`,
                          color: '#F1F5F9',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={
                          currentMentalResult !== null || !mentalInput.trim()
                        }
                        className="px-5 sm:px-6 py-3 rounded-lg text-sm font-medium disabled:opacity-40"
                        style={{
                          backgroundColor: '#6366F1',
                          color: '#fff',
                          boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)',
                        }}
                      >
                        确定
                      </button>
                    </div>
                  </form>
                )}

                {/* 结果反馈 */}
                {currentMentalResult !== null && (
                  <div
                    className="mb-6 p-4 rounded-lg text-center"
                    style={{
                      backgroundColor:
                        currentMentalResult === true
                          ? 'rgba(34, 197, 94, 0.1)'
                          : 'rgba(239, 71, 111, 0.1)',
                      border: `1px solid ${
                        currentMentalResult === true
                          ? 'rgba(34, 197, 94, 0.4)'
                          : 'rgba(239, 71, 111, 0.4)'
                      }`,
                    }}
                  >
                    {currentMentalResult === true ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={20} style={{ color: '#22C55E' }} />
                        <span className="font-semibold" style={{ color: '#22C55E' }}>
                          正确！
                        </span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <XCircle size={20} style={{ color: '#EF476F' }} />
                          <span className="font-semibold" style={{ color: '#EF476F' }}>
                            错误
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#F1F5F9' }}>
                          正确答案：
                          <span style={{ color: '#22C55E' }}>{currentMental?.answer}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 下一题按钮 */}
                {currentMentalResult !== null && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextMental}
                      className="flex items-center gap-1 px-5 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: '#6366F1',
                        color: '#fff',
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      {mentalIndex >= mentalItems.length - 1 ? '查看结果' : '下一题'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MathLearningPage;
