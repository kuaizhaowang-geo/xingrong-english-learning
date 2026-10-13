import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  Lightbulb,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getMathWordProblems } from '@client/src/api/math-practice';
import type { MathWordProblemItem } from '@shared/api.interface';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { getMathIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';

const MAX_WRONG_ATTEMPTS = 3;

interface WordProblemViewProps {
  textbookId?: string;
  unitId?: string;
  difficulty?: number;
}

const WordProblemView: React.FC<WordProblemViewProps> = ({
  textbookId,
  unitId,
  difficulty,
}) => {
  const [items, setItems] = useState<MathWordProblemItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await getMathWordProblems({
          textbookId,
          unitId,
          difficulty,
          limit: 10,
        });
        if (!cancelled) {
          setItems(data);
          setCurrentIndex(0);
          setUserAnswer('');
          setSubmitted(false);
          setWrongAttempts(0);
          setShowSolution(false);
          setCorrectCount(0);
        }
      } catch (err) {
        logger.error('加载应用题失败', err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [textbookId, unitId, difficulty]);

  const currentItem = items[currentIndex];
  // 选择题模式：有 options 字段时用选项，不用键盘
  const isChoiceMode = currentItem && 'options' in currentItem && Array.isArray(
    (currentItem as { options?: string[] }).options
  ) && (currentItem as { options?: string[] }).options!.length > 0;

  const isCorrect = submitted && userAnswer.trim() === currentItem?.correctAnswer.trim();
  const isWrong = submitted && userAnswer.trim() !== currentItem?.correctAnswer.trim();
  const isFinished = submitted && currentIndex === items.length - 1;
  const showKeyboard = !loading && items.length > 0 && !isChoiceMode;
  const options = isChoiceMode
    ? (currentItem as { options: string[] }).options
    : [];

  const handleSubmit = useCallback((): void => {
    if (!currentItem) return;
    if (isChoiceMode) {
      // 选择题：一次提交，结果后需点击下一题
      if (submitted) return;
      setSubmitted(true);
      const correct = userAnswer.trim() === currentItem.correctAnswer.trim();
      if (correct) {
        setCorrectCount((c) => c + 1);
      }
      return;
    }
    // 填空模式：支持错误重提
    if (isCorrect) return;
    if (isWrong && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

    const correct = userAnswer.trim() === currentItem.correctAnswer.trim();
    if (correct) {
      // 首次答对才计入 correctCount（重提答对不计）
      if (wrongAttempts === 0) {
        setCorrectCount((c) => c + 1);
      }
      setSubmitted(true);
      // 答对后自动进入下一题
      setTimeout(() => {
        if (currentIndex < items.length - 1) {
          handleNext();
        }
      }, 600);
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setSubmitted(true);
      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        // 达到最大错误次数，显示答案后自动下一题
        setTimeout(() => {
          if (currentIndex < items.length - 1) {
            handleNext();
          }
        }, 2000);
      }
    }
  }, [currentItem, isChoiceMode, submitted, isCorrect, isWrong, userAnswer, wrongAttempts, currentIndex, items.length]);

  const handleInputChange = (val: string): void => {
    // 填空模式下：错误后继续输入时重置错误状态，允许重新提交
    if (!isChoiceMode && isWrong && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setSubmitted(false);
    }
    setUserAnswer(val);
  };

  // 填空题模式下物理键盘回车提交
  useEffect(() => {
    if (isChoiceMode) return;
    if (!currentItem) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
      if (userAnswer === '' || isCorrect) return;
      e.preventDefault();
      handleSubmit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChoiceMode, currentItem, userAnswer, isCorrect, handleSubmit]);

  const handleNext = (): void => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setSubmitted(false);
      setWrongAttempts(0);
      setShowSolution(false);
    }
  };

  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setUserAnswer('');
      setSubmitted(false);
      setWrongAttempts(0);
      setShowSolution(false);
    }
  };

  const handleRestart = (): void => {
    setCurrentIndex(0);
    setUserAnswer('');
    setSubmitted(false);
    setWrongAttempts(0);
    setShowSolution(false);
    setCorrectCount(0);
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        暂无应用题数据
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-80">
        {/* 进度条 */}
         <div className="glass-card p-4 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="text-sm text-slate-400">
                第 <span className="font-bold text-white">{currentIndex + 1}</span> /{' '}
                {items.length} 题
              </div>
             <div className="flex items-center gap-1 text-sm text-green-600">
               <Trophy size={16} />
               答对 {correctCount} 题
             </div>
           </div>
        </div>

        {currentItem && (
           <div className="glass-card overflow-hidden">
            {/* 题目 */}
             <div className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-medium rounded-lg">
                     难度 {'★'.repeat(currentItem.difficulty)}
                   </span>
                    <span className="text-xs text-slate-500">应用题</span>
                 </div>
                 <div className="w-16 h-16 rounded-full overflow-hidden shadow-md bg-gradient-to-br from-blue-400 to-indigo-500 shrink-0">
                   <Image
                     src={getMathIllustration('word-problem')}
                     alt="word problem"
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       e.currentTarget.style.display = 'none';
                     }}
                   />
                 </div>
               </div>
                <p className="text-lg text-white leading-relaxed">
                 {currentItem.question}
               </p>
             </div>

              {/* 答题区 */}
             <div className="px-6 pb-6 space-y-4">
              {isChoiceMode ? (
                // 选择题：点选项
                <div className="space-y-2">
                  {options.map((opt: string, idx: number) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = userAnswer === opt;
                    const isCorrectOpt = opt === currentItem.correctAnswer;
                     let borderClass = 'border-white/10 hover:border-blue-400/50';
                     let bgClass = 'bg-white/5 hover:bg-blue-500/15';
                     let textClass = 'text-slate-200';
                     if (submitted) {
                       if (isCorrectOpt) {
                         borderClass = 'border-green-500/50';
                         bgClass = 'bg-green-500/15';
                         textClass = 'text-green-300';
                       } else if (isSelected && !isCorrectOpt) {
                         borderClass = 'border-red-500/50';
                         bgClass = 'bg-red-500/15';
                         textClass = 'text-red-300';
                       } else {
                         borderClass = 'border-white/10';
                         bgClass = 'bg-white/5';
                         textClass = 'text-slate-500';
                       }
                     } else if (isSelected) {
                       borderClass = 'border-blue-400/60';
                       bgClass = 'bg-blue-500/20';
                       textClass = 'text-blue-300';
                     }
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (submitted) return;
                          setUserAnswer(opt);
                        }}
                        disabled={submitted}
                        className={`w-full px-4 py-3 text-left rounded-xl border-2 transition-all flex items-center gap-3 ${borderClass} ${bgClass} ${textClass} disabled:cursor-not-allowed`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            submitted && isCorrectOpt
                              ? 'bg-green-500 text-white'
                              : submitted && isSelected && !isCorrectOpt
                                ? 'bg-red-500 text-white'
                                : isSelected
                                  ? 'bg-blue-500 text-white'
                                   : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="font-medium">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // 填空：横线书写式答题区
                <div className="flex justify-center px-4">
                 <UnderlineInput
                     value={userAnswer}
                     feedback={submitted ? (isCorrect ? 'correct' : 'wrong') : 'none'}
                     correctAnswer={currentItem.correctAnswer}
                     size="xl"
                     placeholder="请输入答案"
                     className="max-w-md"
                   />
                 </div>
               )}

               {/* 正误反馈 */}
               {submitted && isChoiceMode && (
                 <div
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold ${
                      isCorrect
                        ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                        : 'bg-red-500/15 text-red-300 border border-red-500/30'
                    }`}
                 >
                   {isCorrect ? (
                     <>
                       <CheckCircle size={20} /> 回答正确！
                     </>
                   ) : (
                     <>
                       <XCircle size={20} /> 回答错误
                     </>
                   )}
                 </div>
               )}

               {/* 填空模式反馈：简洁红色文字 + 达到最大错误次数时显示大字正确答案 */}
               {submitted && !isChoiceMode && isCorrect && (
                  <div className="flex items-center justify-center gap-2 text-green-400 font-semibold">
                   <CheckCircle size={20} /> 回答正确！
                 </div>
               )}
                {submitted && !isChoiceMode && isWrong && (
                  <div className="text-center">
                    <div className="text-red-400 text-xs mb-2">
                      {wrongAttempts}/{MAX_WRONG_ATTEMPTS}
                    </div>
                    {wrongAttempts >= MAX_WRONG_ATTEMPTS && (
                       <div className="text-green-400 text-2xl font-bold">
                        {currentItem.correctAnswer}
                      </div>
                    )}
                  </div>
                )}

              {/* 解析 */}
              {showSolution && currentItem.solution && (
                 <div className="p-4 bg-blue-500/15 border border-blue-500/30 rounded-xl">
                   <div className="flex items-center gap-2 text-sm font-medium text-blue-300 mb-2">
                     <Lightbulb size={16} />
                     解题思路
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {currentItem.solution}
                  </p>
                </div>
              )}
            </div>

            {/* 操作栏 */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
               <button
                 onClick={handlePrev}
                 disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 text-sm font-medium hover:bg-white/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
               >
                 <ChevronLeft size={16} />
                 上一题
               </button>

               <div className="flex items-center gap-2">
                 {submitted && (
                   <button
                     onClick={() => setShowSolution(!showSolution)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-all"
                   >
                     <Eye size={16} />
                     {showSolution ? '隐藏解析' : '查看解析'}
                   </button>
                 )}
                 {!submitted || (isWrong && wrongAttempts < MAX_WRONG_ATTEMPTS) ? (
                   <button
                     onClick={handleSubmit}
                     disabled={userAnswer === '' || isCorrect}
                     className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <CheckCircle size={16} />
                     提交答案
                   </button>
                 ) : null}
               </div>
             </div>

            {/* 完成提示 */}
            {isFinished && submitted && (
               <div className="mx-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 text-center">
                 <div className="text-lg font-bold text-white mb-1">🎉 练习完成！</div>
                 <div className="text-sm text-slate-300">
                   共 {items.length} 题，答对{' '}
                   <span className="text-green-400 font-bold">{correctCount}</span> 题，
                  正确率 {Math.round((correctCount / items.length) * 100)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部全宽数字键盘（填空模式） */}
      {showKeyboard && currentItem && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <VirtualKeyboard
            layout="number"
            value={userAnswer}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            disabled={isCorrect || (isWrong && wrongAttempts >= MAX_WRONG_ATTEMPTS)}
            colorScheme="number"
            fullWidth={true}
            theme="neon"
            showTypedHighlight={false}
            showNextGuide={false}
            toolbar={{
              reset: { onClick: () => setUserAnswer('') },
              skip: { onClick: handleNext, label: '下一题' },
              hint: {
                onClick: () => setShowSolution((v) => !v),
                label: showSolution ? '隐藏解析' : '解析',
                disabled: !submitted || !currentItem.solution,
              },
              submit: { onClick: handleSubmit, label: '提交' },
            }}
          />
        </div>
      )}
    </>
  );
};

export default WordProblemView;
