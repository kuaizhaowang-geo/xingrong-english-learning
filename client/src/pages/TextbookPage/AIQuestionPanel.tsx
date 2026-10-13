import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Lightbulb,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  AIQuiz,
  AIQuizQuestion,
  AIQuizResult,
  Question,
} from '@shared/api.interface';
import { questionsApi } from '@client/src/api';

interface AIQuestionPanelProps {
  subject: string;
  grade: string;
  semester: string;
  unitId: string;
  unitTitle: string;
  knowledgePoint?: string;
  onClose: () => void;
}

type PanelMode = 'config' | 'generating' | 'practice' | 'result';

const QUESTION_TYPE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  english: [
    { label: '选择题', value: 'choice' },
    { label: '拼写选择', value: 'spelling_choice' },
    { label: '填空题', value: 'fill_in_the_blank' },
    { label: '句子排序', value: 'sentence_arrangement' },
    { label: '阅读理解', value: 'reading_comprehension' },
  ],
  math: [
    { label: '选择题', value: 'choice' },
    { label: '填空题', value: 'fill_in_blank' },
    { label: '计算题', value: 'calculation' },
    { label: '应用题', value: 'word_problem' },
    { label: '判断题', value: 'true_false' },
  ],
  chinese: [
    { label: '选择题', value: 'choice' },
    { label: '拼音选择', value: 'pinyin_choice' },
    { label: '填空题', value: 'fill_in_blank' },
    { label: '阅读理解', value: 'reading_comprehension' },
    { label: '古诗背诵', value: 'poem_recitation' },
  ],
};

const DIFFICULTY_OPTIONS = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

const COUNT_OPTIONS = [3, 5, 10];

const AIQuestionPanel: React.FC<AIQuestionPanelProps> = ({
  subject,
  grade,
  semester,
  unitId,
  unitTitle,
  knowledgePoint,
  onClose,
}) => {
  const [mode, setMode] = useState<PanelMode>('config');
  const [questionType, setQuestionType] = useState<string>('choice');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [count, setCount] = useState<number>(5);
  const [quiz, setQuiz] = useState<AIQuiz | null>(null);
  const [quizResult, setQuizResult] = useState<AIQuizResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const typeOptions = QUESTION_TYPE_OPTIONS[subject] || QUESTION_TYPE_OPTIONS.english;

  // 练习模式下的题目列表（从 quiz.questions[i].question 取）
  const practiceQuestions: AIQuizQuestion[] = useMemo(() => {
    if (!quiz?.questions) return [];
    return [...quiz.questions].sort(
      (a, b) => a.questionOrder - b.questionOrder,
    );
  }, [quiz]);

  // 结果模式下的题目列表（从 quizResult.questions 取）
  const resultQuestions: AIQuizQuestion[] = useMemo(() => {
    if (!quizResult?.questions) return [];
    return [...quizResult.questions].sort(
      (a, b) => a.questionOrder - b.questionOrder,
    );
  }, [quizResult]);

  // 当前展示的题目列表（练习用 quiz，结果用 quizResult）
  const displayQuestions: AIQuizQuestion[] =
    mode === 'result' ? resultQuestions : practiceQuestions;

  const currentQuizQuestion = displayQuestions[currentIndex];
  const currentQuestion: Question | undefined = currentQuizQuestion?.question;
  const totalCount = displayQuestions.length;

  const handleGenerate = async (): Promise<void> => {
    setMode('generating');
    setError('');
    try {
      const result: AIQuiz = await questionsApi.createAIQuiz({
        subject,
        grade,
        semester,
        unitId,
        knowledgePoint,
        questionType,
        difficulty,
        count,
      });
      setQuiz(result);
      setAnswers({});
      setCurrentIndex(0);
      setQuizResult(null);
      setMode('practice');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`AI 出题失败: ${errMsg}`);
      setError('AI 生成题目失败，请稍后重试');
      setMode('config');
    }
  };

  const handleSelectOption = (label: string): void => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: label }));
  };

  const handleFillAnswer = (value: string): void => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const handleNext = (): void => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const answerList = practiceQuestions.map((qq) => ({
        questionOrder: qq.questionOrder,
        userAnswer: answers[qq.questionOrder - 1] ?? '',
      }));
      const result: AIQuizResult = await questionsApi.submitAIQuiz(quiz.id, {
        answers: answerList,
      });
      setQuizResult(result);
      setMode('result');
      setCurrentIndex(0);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`提交答题失败: ${errMsg}`);
      setError('提交答案失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = (): void => {
    setMode('config');
    setQuiz(null);
    setQuizResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  const isChoiceType = (qType: string): boolean => {
    return (
      qType === 'choice' ||
      qType === 'spelling_choice' ||
      qType === 'pinyin_choice' ||
      qType === 'reading_comprehension' ||
      qType === 'true_false'
    );
  };

  const isCorrectLocal = (question: Question, userAnswer: string): boolean => {
    if (!userAnswer) return false;
    if (isChoiceType(question.questionType)) {
      return userAnswer.toUpperCase() === question.answer.toUpperCase();
    }
    return userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  };

  // 结果模式下正确数用后端返回的 correctCount
  const correctCount = quizResult
    ? quizResult.correctCount
    : practiceQuestions.filter((qq) => {
        const q = qq.question;
        if (!q) return false;
        return isCorrectLocal(q, answers[qq.questionOrder - 1] || '');
      }).length;

  const wrongCount = quizResult
    ? quizResult.wrongCount
    : totalCount - correctCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13, 11, 31, 0.9)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
      style={{
             background: 'linear-gradient(180deg, #FFFFFF 0%, #EEF2FF 100%)',
             borderColor: 'rgba(99, 102, 241, 0.2)',
           }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
              }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
               <h2 className="text-lg font-bold" style={{ color: '#1E293B' }}>
                AI 智能出题
              </h2>
               <p className="text-xs" style={{ color: '#64748B' }}>
                 {unitTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
             style={{ color: '#64748B' }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
               e.currentTarget.style.color = '#1E293B';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
               e.currentTarget.style.color = '#64748B';
             }}
          >
            <XCircle size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Config mode */}
          {mode === 'config' && (
            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                   style={{ color: '#475569' }}
                >
                  题型
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((opt) => {
                    const active = questionType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setQuestionType(opt.value)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                            : '#F8FAFC',
                           color: active ? '#fff' : '#64748B',
                          border: active
                            ? '1px solid rgba(99, 102, 241, 0.3)'
                            : '1px solid rgba(99, 102, 241, 0.12)',
                          boxShadow: active
                            ? '0 0 16px rgba(99, 102, 241, 0.25)'
                            : 'none',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                   style={{ color: '#475569' }}
                >
                  难度
                </label>
                <div className="flex gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const active = difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDifficulty(opt.value)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                            : '#F8FAFC',
                           color: active ? '#fff' : '#64748B',
                          border: active
                            ? '1px solid rgba(99, 102, 241, 0.3)'
                            : '1px solid rgba(99, 102, 241, 0.12)',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                   style={{ color: '#475569' }}
                >
                  题目数量
                </label>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((num) => {
                    const active = count === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setCount(num)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                            : '#F8FAFC',
                           color: active ? '#fff' : '#64748B',
                          border: active
                            ? '1px solid rgba(99, 102, 241, 0.3)'
                            : '1px solid rgba(99, 102, 241, 0.12)',
                        }}
                      >
                        {num} 题
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239, 71, 111, 0.1)',
                    border: '1px solid rgba(239, 71, 111, 0.3)',
                    color: '#EF476F',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                }}
              >
                <Sparkles size={18} />
                开始生成练习题
              </button>
            </div>
          )}

          {/* Generating mode */}
          {mode === 'generating' && (
            <div className="py-16 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-6">
                <div
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                  }}
                />
                <div
                  className="absolute inset-2 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  }}
                >
                  <RefreshCw size={28} className="text-white animate-spin" />
                </div>
              </div>
               <p className="text-lg font-medium" style={{ color: '#1E293B' }}>
                AI 正在出题中...
              </p>
               <p className="text-sm mt-2" style={{ color: '#64748B' }}>
                 根据知识点智能生成个性化练习题
              </p>
            </div>
          )}

          {/* Practice mode */}
          {mode === 'practice' && currentQuestion && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                 <span className="text-sm font-medium" style={{ color: '#64748B' }}>
                   第 {currentIndex + 1} / {totalCount} 题
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(34, 211, 238, 0.1)',
                    color: '#06B6D4',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                  }}
                >
                  {DIFFICULTY_OPTIONS.find((d) => d.value === currentQuestion.difficulty)
                    ?.label || currentQuestion.difficulty}
                </span>
              </div>

              {/* Question stem */}
              <div
                className="p-5 rounded-xl"
                 style={{
                   background: 'rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(99, 102, 241, 0.15)',
                 }}
               >
                  <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#1E293B' }}>
                   {currentQuestion.stem}
                </p>
              </div>

              {/* Options or input */}
              {isChoiceType(currentQuestion.questionType) ? (
                <div className="space-y-3">
                  {currentQuestion.options.map((opt) => {
                    const selected = answers[currentIndex] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleSelectOption(opt.label)}
                        className="w-full p-4 rounded-xl text-left transition-all flex items-start gap-3"
                        style={{
                          background: selected
                            ? 'rgba(99, 102, 241, 0.12)'
                            : '#F8FAFC',
                          border: selected
                            ? '2px solid #6366F1'
                            : '2px solid transparent',
                           color: '#334155',
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            background: selected
                              ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                              : '#E0E7FF',
                            color: '#fff',
                          }}
                        >
                          {opt.label}
                        </span>
                        <span className="flex-1 pt-0.5">{opt.content}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={answers[currentIndex] || ''}
                    onChange={(e) => handleFillAnswer(e.target.value)}
                    placeholder="请输入你的答案"
                    className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
                    style={{
                      background: '#F8FAFC',
                      border: '2px solid rgba(99, 102, 241, 0.2)',
                           color: '#334155',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#6366F1';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    }}
                  />
                </div>
              )}

              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239, 71, 111, 0.1)',
                    border: '1px solid rgba(239, 71, 111, 0.3)',
                    color: '#EF476F',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#F8FAFC',
                    color: '#64748B',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  上一题
                </button>

                {currentIndex === totalCount - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !answers[currentIndex]}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                      boxShadow: '0 2px 12px rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    {submitting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {submitting ? '提交中...' : '提交答案'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                    }}
                  >
                    下一题
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result mode */}
          {mode === 'result' && currentQuestion && quizResult && (
            <div className="space-y-6">
              {/* Score summary */}
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(34,211,238,0.1) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div className="text-4xl font-bold mb-2">
                  <span
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {quizResult.score}
                  </span>
                  <span style={{ color: '#64748B' }}> 分</span>
                </div>
                 <p className="text-sm" style={{ color: '#64748B' }}>
                   正确 {quizResult.correctCount} / {quizResult.totalCount} 题
                  （正确率 {Math.round((quizResult.correctCount / quizResult.totalCount) * 100)}%）
                </p>
                {wrongCount > 0 && (
                  <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
                    {wrongCount} 道错题已自动加入错题本
                  </p>
                )}
              </div>

              {/* Current question detail */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-medium" style={{ color: '#475569' }}>
                     第 {currentIndex + 1} 题解析
                  </span>
                  {currentQuizQuestion?.isCorrect !== undefined && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: currentQuizQuestion.isCorrect
                          ? 'rgba(34, 211, 238, 0.1)'
                          : 'rgba(239, 71, 111, 0.1)',
                        color: currentQuizQuestion.isCorrect ? '#06B6D4' : '#EF476F',
                        border: currentQuizQuestion.isCorrect
                          ? '1px solid rgba(34, 211, 238, 0.3)'
                          : '1px solid rgba(239, 71, 111, 0.3)',
                      }}
                    >
                      {currentQuizQuestion.isCorrect ? '正确' : '错误'}
                    </span>
                  )}
                </div>

                <div
                  className="p-4 rounded-xl"
                 style={{
                   background: 'rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(99, 102, 241, 0.15)',
                 }}
               >
                  <p className="text-base mb-3" style={{ color: '#1E293B' }}>
                    {currentQuestion.stem}
                  </p>

                  {isChoiceType(currentQuestion.questionType) && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((opt) => {
                        const isCorrectOpt =
                          opt.label.toUpperCase() ===
                          currentQuestion.answer.toUpperCase();
                        const isUserSelect =
                          currentQuizQuestion?.userAnswer?.toUpperCase() ===
                          opt.label.toUpperCase();
                        let borderColor = 'rgba(99, 102, 241, 0.08)';
                        let bgColor = '#F8FAFC';
                        if (isCorrectOpt) {
                          borderColor = 'rgba(34, 211, 238, 0.6)';
                          bgColor = 'rgba(34, 211, 238, 0.1)';
                        } else if (isUserSelect && !isCorrectOpt) {
                          borderColor = 'rgba(239, 71, 111, 0.6)';
                          bgColor = 'rgba(239, 71, 111, 0.1)';
                        }
                        return (
                          <div
                            key={opt.label}
                            className="flex items-start gap-3 p-3 rounded-lg"
                            style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                          >
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: isCorrectOpt
                                  ? '#06B6D4'
                                  : isUserSelect
                                    ? '#EF476F'
                                    : '#E0E7FF',
                                color: '#fff',
                              }}
                            >
                              {opt.label}
                            </span>
                             <span className="flex-1 text-sm" style={{ color: '#475569' }}>
                              {opt.content}
                            </span>
                            {isCorrectOpt && (
                              <CheckCircle2 size={16} style={{ color: '#06B6D4' }} />
                            )}
                            {isUserSelect && !isCorrectOpt && (
                              <XCircle size={16} style={{ color: '#EF476F' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isChoiceType(currentQuestion.questionType) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-sm" style={{ color: '#64748B' }}>
                           你的答案：
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: currentQuizQuestion?.isCorrect
                              ? '#06B6D4'
                              : '#EF476F',
                          }}
                        >
                          {currentQuizQuestion?.userAnswer || '未作答'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-sm" style={{ color: '#64748B' }}>
                           正确答案：
                        </span>
                        <span className="text-sm font-medium" style={{ color: '#06B6D4' }}>
                          {currentQuestion.answer}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {currentQuestion.analysis && (
                  <div
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{
                      background: 'rgba(34, 211, 238, 0.08)',
                      border: '1px solid rgba(34, 211, 238, 0.2)',
                    }}
                  >
                    <Lightbulb size={18} style={{ color: '#06B6D4', flexShrink: 0 }} />
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#06B6D4' }}>
                        解析
                      </p>
                       <p className="text-sm" style={{ color: '#475569' }}>
                         {currentQuestion.analysis}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#F8FAFC',
                    color: '#94A3B8',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                  }}
                >
                  上一题
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    style={{
                      background: '#F8FAFC',
                       color: '#64748B',
                       border: '1px solid rgba(99, 102, 241, 0.15)',
                     }}
                   >
                     <RotateCcw size={14} />
                     重新出题
                  </button>
                  {currentIndex < totalCount - 1 && (
                    <button
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-1"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                      }}
                    >
                      下一题
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuestionPanel;
