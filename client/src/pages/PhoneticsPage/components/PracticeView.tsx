import React, { useState, useCallback, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../utils/speech';
import { generateQuestions } from '../utils/practice';
import type {
  PhoneticItem,
  PhonicsPracticeResult,
} from '@shared/api.interface';
import type { PracticeQuestion } from '../utils/practice';
import PracticeFinish from './PracticeFinish';
import PracticeOption from './PracticeOption';
import { logger } from '@lark-apaas/client-toolkit/logger';

type PracticeMode = 'listen' | 'read';

interface PracticeViewProps {
  items: PhoneticItem[];
  onSubmit: (results: PhonicsPracticeResult[]) => Promise<void>;
}

const TOTAL_QUESTIONS: number = 10;

const PracticeView: React.FC<PracticeViewProps> = ({ items, onSubmit }) => {
  const [mode, setMode] = useState<PracticeMode>('listen');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [results, setResults] = useState<PhonicsPracticeResult[]>([]);
  const [finished, setFinished] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const startRound = useCallback((): void => {
    const qs: PracticeQuestion[] = generateQuestions(
      items,
      mode,
      TOTAL_QUESTIONS,
    );
    setQuestions(qs);
    setQIndex(0);
    setSelectedId(null);
    setAnswered(false);
    setCorrectCount(0);
    setResults([]);
    setFinished(false);
    setSubmitted(false);
  }, [items, mode]);

  useEffect(() => {
    if (items.length > 0) startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, items.length]);

  const current: PracticeQuestion | undefined = questions[qIndex];
  const totalAnswered: number = results.length;
  const acc: number =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

  const handleSelect = useCallback(
    (optId: string): void => {
      if (answered || !current) return;
      const isCorrect: boolean = optId === current.correctId;
      setSelectedId(optId);
      setAnswered(true);
      setCorrectCount((c: number) => (isCorrect ? c + 1 : c));
      setResults((prev: PhonicsPracticeResult[]) => [
        ...prev,
        { phoneticId: current.targetId, isCorrect },
      ]);
    },
    [answered, current],
  );

  const handleNext = useCallback((): void => {
    if (qIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setQIndex((i: number) => i + 1);
    setSelectedId(null);
    setAnswered(false);
  }, [qIndex, questions.length]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (submitted || results.length === 0) return;
    setSubmitted(true);
    try {
      await onSubmit(results);
    } catch (err: unknown) {
      logger.error('practice submit failed', JSON.stringify(err));
    }
  }, [submitted, results, onSubmit]);

  useEffect(() => {
    if (finished && !submitted) void handleSubmit();
  }, [finished, submitted, handleSubmit]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-[#94A3B8]">
        加载中...
      </div>
    );
  }

  if (finished) {
    return (
      <PracticeFinish
        total={results.length}
        correct={correctCount}
        accuracy={acc}
        onRestart={startRound}
      />
    );
  }

  if (!current) return null;
  const isListen: boolean = mode === 'listen';

  return (
    <div className="max-w-2xl mx-auto">
      {/* 顶部状态 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[#94A3B8]">
          第 <span className="text-[#1E293B] font-medium">{qIndex + 1}</span> /{' '}
          {TOTAL_QUESTIONS} 题
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#94A3B8]">
            答对{' '}
            <span className="text-[#06B6D4] font-medium">{correctCount}</span>
          </span>
          <span className="text-[#94A3B8]">
            正确率{' '}
            <span className="text-[#818CF8] font-medium">{acc}%</span>
          </span>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg p-1 bg-[#FFFFFF] border border-[rgba(124_58_237_0.3)]">
          {(['listen', 'read'] as const).map((m: PracticeMode) => (
            <button
              key={m}
              onClick={(): void => setMode(m)}
              className={`px-5 py-1.5 text-sm rounded-md transition-all duration-200 ${
                mode === m
                  ? 'text-white font-medium'
                  : 'text-[#94A3B8] hover:text-[#CBD5E1]'
              }`}
              style={
                mode === m
                  ? {
                      backgroundColor: 'rgba(99, 102, 241, 0.25)',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
                    }
                  : undefined
              }
            >
              {m === 'listen' ? '听音辨音' : '看音标选单词'}
            </button>
          ))}
        </div>
      </div>

      {/* 题目区 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#16122E] to-[#FFFFFF] border border-[rgba(124_58_237_0.3)] p-8 mb-6">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, #6366F1, transparent)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
          }}
        />
        {isListen ? (
          <div className="text-center py-6">
            <button
              onClick={(): void => speak(current.targetWord, 0.7)}
              className="
                w-28 h-28 mx-auto rounded-full
                flex items-center justify-center
                bg-[rgba(124_58_237_0.2)] border-2 border-[rgba(124_58_237_0.5)]
                text-[#818CF8] hover:bg-[rgba(124_58_237_0.35)]
                active:scale-90 transition-all duration-150 mb-4
              "
              style={{ boxShadow: '0 0 25px rgba(99, 102, 241, 0.25)' }}
              aria-label="播放发音"
            >
              <Volume2 size={42} />
            </button>
            <p className="text-base text-[#F1F5F9] font-medium">
              点击播放发音
            </p>
            <p className="text-sm text-[#94A3B8] mt-1">
              听发音，选择对应的音标
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div
              className="text-7xl font-bold mb-4"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#F1F5F9',
                textShadow: '0 0 25px rgba(99, 102, 241, 0.3)',
              }}
            >
              {current.targetSymbol}
            </div>
            <p className="text-sm text-[#94A3B8]">看音标，选择正确的单词</p>
          </div>
        )}
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {current.options.map(
          (opt: { id: string; label: string; sub?: string }) => (
            <PracticeOption
              key={opt.id}
              label={opt.label}
              sub={opt.sub}
              isSymbol={isListen}
              isSelected={selectedId === opt.id}
              isCorrect={answered && opt.id === current.correctId}
              isWrong={
                answered &&
                selectedId === opt.id &&
                opt.id !== current.correctId
              }
              onClick={(): void => handleSelect(opt.id)}
              disabled={answered}
            />
          ),
        )}
      </div>

      {/* 下一题 */}
      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!answered}
          className="
            px-8 py-3 rounded-xl text-white font-medium
            transition-all duration-200 active:scale-[0.97]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          {qIndex >= questions.length - 1 ? '查看结果' : '下一题 →'}
        </button>
      </div>
    </div>
  );
};

export default PracticeView;
