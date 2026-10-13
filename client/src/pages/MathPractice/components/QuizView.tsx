import React, { useCallback, useRef, useState } from 'react';
import {
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { submitMathAnswer } from '@client/src/api/math-practice';
import type {
  MathPracticeItem,
  MathPracticeSession,
  SubmitMathAnswerResponse,
} from '@shared/api.interface';
import NumberKeypad from './NumberKeypad';

interface WrongRecord {
  item: MathPracticeItem;
  userAnswer: string;
}

interface QuizViewProps {
  session: MathPracticeSession;
  items: MathPracticeItem[];
  currentIndex: number;
  onFinish: (wrongRecords: WrongRecord[], duration: number) => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
};

const QuizView: React.FC<QuizViewProps> = ({
  session,
  items,
  currentIndex,
  onFinish,
}) => {
  const [index, setIndex] = useState<number>(currentIndex);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [feedbackData, setFeedbackData] = useState<SubmitMathAnswerResponse | null>(null);
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const [, setTick] = useState<number>(0);

  // 触发重渲染以更新用时显示
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentItem = items[index];
  const progress = items.length > 0 ? ((index + 1) / items.length) * 100 : 0;
  const totalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

  const doSubmit = useCallback(
    async (answer: string) => {
      if (feedback !== 'none' || !currentItem) return;
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      try {
        const res = await submitMathAnswer(session.id, currentItem.id, answer, timeSpent);
        setFeedbackData(res);
        setFeedback(res.isCorrect ? 'correct' : 'wrong');
        if (!res.isCorrect) {
          setWrongRecords((prev) => [...prev, { item: currentItem, userAnswer: answer }]);
        }
      } catch (err) {
        logger.error('提交答案失败', err as Error);
      }
    },
    [session, currentItem, feedback],
  );

  const handleChoiceSelect = (answer: string): void => {
    if (feedback !== 'none') return;
    setUserAnswer(answer);
    setTimeout(() => doSubmit(answer), 200);
  };

  const handleJudgeSelect = (answer: string): void => {
    if (feedback !== 'none') return;
    setUserAnswer(answer);
    setTimeout(() => doSubmit(answer), 200);
  };

  const goToNext = useCallback(async () => {
    if (index >= items.length - 1) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onFinish(wrongRecords, duration);
    } else {
      setIndex((i) => i + 1);
      setUserAnswer('');
      setFeedback('none');
      setFeedbackData(null);
    }
  }, [index, items.length, wrongRecords, onFinish]);

  // 渲染答题区
  const renderAnswerArea = (): React.ReactNode => {
    if (!currentItem) return null;
    const itemType = currentItem.itemType;

    if (itemType === 'choice' && currentItem.options && currentItem.options.length > 0) {
      return (
        <div className="space-y-3">
          {currentItem.options.map((opt) => {
            const isSelected = userAnswer === opt.label;
            const showCorrect =
              feedback !== 'none' && opt.label === feedbackData?.correctAnswer;
            const showWrong = feedback === 'wrong' && isSelected;
            return (
              <button
                key={opt.label}
                onClick={() => handleChoiceSelect(opt.label)}
                disabled={feedback !== 'none'}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  showCorrect
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100'
                    : showWrong
                      ? 'bg-rose-500/20 border-rose-400 text-rose-100'
                      : isSelected
                        ? 'bg-purple-500/30 border-purple-400 text-white'
                         : 'bg-white/10 border-purple-500/20 text-slate-200 hover:border-purple-400/50 hover:bg-white/20'
                } ${feedback !== 'none' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      showCorrect
                        ? 'bg-cyan-400 text-[#EEF2FF]'
                        : showWrong
                          ? 'bg-rose-400 text-white'
                          : 'bg-purple-500/40 text-purple-200'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (itemType === 'judge') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleJudgeSelect('对')}
            disabled={feedback !== 'none'}
            className={`py-8 rounded-2xl text-2xl font-bold transition-all flex flex-col items-center gap-2 ${
              feedback !== 'none' && feedbackData?.correctAnswer === '对'
                ? 'bg-cyan-500/30 text-cyan-200 ring-2 ring-cyan-400'
                : feedback === 'wrong' && userAnswer === '对'
                  ? 'bg-rose-500/30 text-rose-200 ring-2 ring-rose-400'
                   : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-purple-500/20'
            } ${feedback !== 'none' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <CheckCircle size={32} />
            对
          </button>
          <button
            onClick={() => handleJudgeSelect('错')}
            disabled={feedback !== 'none'}
            className={`py-8 rounded-2xl text-2xl font-bold transition-all flex flex-col items-center gap-2 ${
              feedback !== 'none' && feedbackData?.correctAnswer === '错'
                ? 'bg-cyan-500/30 text-cyan-200 ring-2 ring-cyan-400'
                : feedback === 'wrong' && userAnswer === '错'
                  ? 'bg-rose-500/30 text-rose-200 ring-2 ring-rose-400'
                   : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-purple-500/20'
            } ${feedback !== 'none' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <XCircle size={32} />
            错
          </button>
        </div>
      );
    }

    // 口算/填空/应用 → 数字键盘
    return (
      <NumberKeypad
        value={userAnswer}
        onInput={(val) => {
          if (feedback !== 'none') return;
          setUserAnswer(val);
        }}
        onSubmit={() => doSubmit(userAnswer.trim())}
        onDelete={() => {
          if (feedback !== 'none') return;
          setUserAnswer((v) => v.slice(0, -1));
        }}
        onClear={() => {
          if (feedback !== 'none') return;
          setUserAnswer('');
        }}
        disabled={feedback !== 'none'}
        feedback={feedback}
      />
    );
  };

  const itemTypeLabelMap: Record<string, string> = {
    oral: '口算题',
    fill: '填空题',
    choice: '选择题',
    judge: '判断题',
    word: '应用题',
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* 顶部进度条 */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
           <span className="flex items-center gap-1">
             <Target size={16} className="text-purple-400" />
             第 {index + 1} / {items.length} 题
           </span>
           <span className="flex items-center gap-1">
             <Clock size={16} className="text-blue-400" />
             {formatTime(totalDuration)}
           </span>
         </div>
      </div>

      {/* 题目显示区 */}
      <div className="flex-1 flex flex-col justify-center py-6">
        <div
          className={`rounded-2xl p-6 mb-6 bg-white/10 backdrop-blur border transition-all ${
            feedback === 'correct'
              ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(34_211_238_0.2)]'
              : feedback === 'wrong'
                ? 'border-rose-400/50 shadow-[0_0_30px_rgba(239_71_111_0.2)]'
                : 'border-purple-500/20'
          }`}
        >
          <div className="text-xs text-purple-300 mb-2">
            {itemTypeLabelMap[currentItem?.itemType ?? ''] || '练习题'}
          </div>
          <div className="text-3xl md:text-4xl font-bold text-white leading-relaxed text-center py-4">
            {currentItem?.question}
          </div>
        </div>

        {/* 反馈信息 */}
        {feedback !== 'none' && feedbackData && (
          <div
            className={`rounded-xl p-4 mb-6 ${
              feedback === 'correct'
                ? 'bg-cyan-500/10 border border-cyan-400/30'
                : 'bg-rose-500/10 border border-rose-400/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {feedback === 'correct' ? (
                <>
                  <CheckCircle size={20} className="text-cyan-400" />
                  <span className="text-cyan-300 font-semibold">回答正确！</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-rose-400" />
                  <span className="text-rose-300 font-semibold">回答错误</span>
                </>
              )}
            </div>
            {feedback === 'wrong' && (
              <div className="text-sm text-slate-300">
                正确答案：
                <span className="text-cyan-300 font-bold ml-1">
                  {feedbackData.correctAnswer}
                </span>
              </div>
            )}
            {feedbackData.solution && (
              <div className="mt-2 text-sm text-slate-400 leading-relaxed">
                <span className="text-purple-300">解析：</span>
                {feedbackData.solution}
              </div>
            )}
          </div>
        )}

        {/* 下一题按钮 */}
        {feedback !== 'none' && (
          <button
            onClick={goToNext}
            className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
          >
            {index >= items.length - 1 ? '查看结果' : '下一题'}
            <ArrowRight size={18} />
          </button>
        )}

        {/* 答题区 */}
        <div className={feedback !== 'none' ? 'opacity-50 pointer-events-none' : ''}>
          {renderAnswerArea()}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
