import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import * as chinesePracticeApi from '@client/src/api/chinese-practice';
import type { ChinesePoetry } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { getChineseIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';

interface PoetryRecitationViewProps {
  textbookId: string;
}

const MAX_WRONG_ATTEMPTS = 3;

// 获取首字提示
function getFirstCharHint(line: string): string {
  const trimmed = line.trim();
  if (trimmed.length === 0) return '';
  return trimmed[0];
}

// 获取提示（首字...）
function getHint(line: string): string {
  const firstChar = getFirstCharHint(line);
  return firstChar ? `${firstChar}...` : '...';
}

const PoetryRecitationView: React.FC<PoetryRecitationViewProps> = ({
  textbookId,
}) => {
  const { speak } = useSpeech();
  const [poems, setPoems] = useState<ChinesePoetry[]>([]);
  const [selectedPoemId, setSelectedPoemId] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [lineFeedbacks, setLineFeedbacks] = useState<Array<'none' | 'correct' | 'wrong'>>([]);
  const [lineWrongAttempts, setLineWrongAttempts] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);

  useEffect(() => {
    if (!textbookId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await chinesePracticeApi.getChinesePoetry({ textbookId });
        if (!cancelled) {
          setPoems(data);
          if (data.length > 0) {
            setSelectedPoemId(data[0].id);
          }
        }
      } catch (err) {
        logger.error('加载古诗失败', err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [textbookId]);

  const currentPoem = poems.find((p: ChinesePoetry) => p.id === selectedPoemId);

  // 切诗时重置
  useEffect(() => {
    if (currentPoem) {
      const len = currentPoem.content.length;
      setUserAnswers(new Array(len).fill(''));
      setLineFeedbacks(new Array(len).fill('none'));
      setLineWrongAttempts(new Array(len).fill(0));
      setShowOriginal(false);
      setShowAnalysis(false);
      setActiveLineIndex(0);
    }
  }, [selectedPoemId, currentPoem]);

  // 物理键盘空格键提交当前句
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== 'Space') return;
      if (!currentPoem) return;
      const feedback = lineFeedbacks[activeLineIndex] ?? 'none';
      const attempts = lineWrongAttempts[activeLineIndex] ?? 0;
      const answer = userAnswers[activeLineIndex] || '';
      const allDone = lineFeedbacks.every(
        (f: 'none' | 'correct' | 'wrong', idx: number) =>
          f === 'correct' || (f === 'wrong' && (lineWrongAttempts[idx] ?? 0) >= MAX_WRONG_ATTEMPTS),
      );
      if (allDone) return;
      if (feedback === 'correct') return;
      if (feedback === 'wrong' && attempts >= MAX_WRONG_ATTEMPTS) {
        e.preventDefault();
        handleNextLine();
        return;
      }
      if (!answer.trim()) return;
      e.preventDefault();
      handleSubmitCurrent();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPoem, activeLineIndex, userAnswers, lineFeedbacks, lineWrongAttempts]);

  const handleAnswerChange = (index: number, value: string): void => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    // 错误后用户修改，清除当前行错误反馈
    const fb = lineFeedbacks[index];
    const attempts = lineWrongAttempts[index] ?? 0;
    if (fb === 'wrong' && attempts < MAX_WRONG_ATTEMPTS) {
      setLineFeedbacks((prev) => {
        const next = [...prev];
        next[index] = 'none';
        return next;
      });
    }
  };

  const handleKeyChange = (value: string): void => {
    handleAnswerChange(activeLineIndex, value);
  };

  const checkAnswer = (userAnswer: string, correct: string): boolean => {
    return userAnswer.trim() === correct.trim();
  };

  const handleSubmitCurrent = (): void => {
    if (!currentPoem) return;
    const idx = activeLineIndex;
    const fb = lineFeedbacks[idx];
    const attempts = lineWrongAttempts[idx] ?? 0;
    const answer = userAnswers[idx] || '';
    if (fb === 'correct') return;
    if (fb === 'wrong' && attempts >= MAX_WRONG_ATTEMPTS) return;
    if (!answer.trim()) return;

    const correct = checkAnswer(answer, currentPoem.content[idx]);
    if (correct) {
      setLineFeedbacks((prev) => {
        const next = [...prev];
        next[idx] = 'correct';
        return next;
      });
    } else {
      const nextAttempts = attempts + 1;
      setLineWrongAttempts((prev) => {
        const next = [...prev];
        next[idx] = nextAttempts;
        return next;
      });
      setLineFeedbacks((prev) => {
        const next = [...prev];
        next[idx] = 'wrong';
        return next;
      });
    }
  };

  // 答对后自动下一句；达到最大错误次数后自动下一句
  useEffect(() => {
    if (!currentPoem) return;
    const idx = activeLineIndex;
    const fb = lineFeedbacks[idx];
    const attempts = lineWrongAttempts[idx] ?? 0;
    if (fb === 'correct') {
      const timer = window.setTimeout(() => {
        handleNextLine();
      }, 600);
      return () => window.clearTimeout(timer);
    }
    if (fb === 'wrong' && attempts >= MAX_WRONG_ATTEMPTS) {
      const timer = window.setTimeout(() => {
        handleNextLine();
      }, 2500);
      return () => window.clearTimeout(timer);
    }
  }, [lineFeedbacks[activeLineIndex], lineWrongAttempts[activeLineIndex], activeLineIndex, currentPoem]);

  const handlePrevLine = (): void => {
    if (activeLineIndex > 0) {
      setActiveLineIndex(activeLineIndex - 1);
    }
  };

  const handleNextLine = (): void => {
    if (!currentPoem) return;
    if (activeLineIndex < currentPoem.content.length - 1) {
      setActiveLineIndex(activeLineIndex + 1);
    }
  };

  const handlePlay = (): void => {
    if (!currentPoem) return;
    const text = currentPoem.content.join('，');
    speak(text, { lang: 'zh-CN', rate: 0.8 });
  };

  const handleRestart = (): void => {
    if (!currentPoem) return;
    const len = currentPoem.content.length;
    setUserAnswers(new Array(len).fill(''));
    setLineFeedbacks(new Array(len).fill('none'));
    setLineWrongAttempts(new Array(len).fill(0));
    setShowOriginal(false);
    setActiveLineIndex(0);
  };

  // 全部完成（所有行都是 correct 或 wrong+达最大次数）
  const allCompleted = currentPoem && lineFeedbacks.length > 0
    ? lineFeedbacks.every(
        (f: 'none' | 'correct' | 'wrong', idx: number) =>
          f === 'correct' || (f === 'wrong' && (lineWrongAttempts[idx] ?? 0) >= MAX_WRONG_ATTEMPTS),
      )
    : false;

  const correctCount = currentPoem && lineFeedbacks.length > 0
    ? lineFeedbacks.filter((f: 'none' | 'correct' | 'wrong') => f === 'correct').length
    : 0;

  const currentFeedback = lineFeedbacks[activeLineIndex] ?? 'none';
  const currentAttempts = lineWrongAttempts[activeLineIndex] ?? 0;
  const currentShowAnswer =
    currentFeedback === 'wrong' && currentAttempts >= MAX_WRONG_ATTEMPTS;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (poems.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        暂无古诗数据
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-[320px]">
      {/* 古诗选择 */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-300">选择古诗：</span>
          <div className="flex gap-1 flex-wrap">
            {poems.map((p: ChinesePoetry) => (
              <button
                key={p.id}
                onClick={() => setSelectedPoemId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPoemId === p.id
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentPoem && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          {/* 标题 + 情境插图 */}
           <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 text-center text-white">
             <div className="w-24 h-24 mx-auto rounded-full overflow-hidden shadow-lg mb-4 bg-white/20">
               <Image
                 src={getChineseIllustration(currentPoem.title || '')}
                 alt={currentPoem.title}
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                 }}
               />
             </div>
             <h2 className="text-2xl font-bold mb-1">{currentPoem.title}</h2>
              {currentPoem.author && (
                <p className="text-sm opacity-80">
                  【{currentPoem.dynasty ?? ''}】{currentPoem.author}
                </p>
              )}
             <button
               onClick={handlePlay}
               className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm hover:bg-white/30 transition-all"
             >
               <BookOpen size={14} />
               朗读全诗
             </button>
           </div>

          {/* 激活句导航 */}
          {!allCompleted && (
             <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
               <button
                 onClick={handlePrevLine}
                 disabled={activeLineIndex === 0}
                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 <ChevronLeft size={16} />
                 上一句
               </button>
               <div className="text-sm font-medium text-slate-200">
                 正在输入第 <span className="text-orange-400 font-bold">{activeLineIndex + 1}</span> / {currentPoem.content.length} 句
               </div>
               <button
                 onClick={handleNextLine}
                 disabled={activeLineIndex >= currentPoem.content.length - 1}
                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 下一句
                 <ChevronRight size={16} />
               </button>
             </div>
          )}

          {/* 默写区域 - 逐句格子 */}
          <div className="p-6 space-y-5">
            {currentPoem.content.map((line: string, idx: number) => {
              const fb = lineFeedbacks[idx] ?? 'none';
              const attempts = lineWrongAttempts[idx] ?? 0;
              const showAnswer = fb === 'wrong' && attempts >= MAX_WRONG_ATTEMPTS;
              const isActive = idx === activeLineIndex;
              const isDone =
                fb === 'correct' || (fb === 'wrong' && attempts >= MAX_WRONG_ATTEMPTS);
              const answer = userAnswers[idx] || '';

              return (
                <div
                  key={idx}
                  onClick={() => !allCompleted && setActiveLineIndex(idx)}
                   className={`
                     space-y-2 p-3 rounded-xl transition-all cursor-pointer
                     ${isActive && !allCompleted
                       ? 'bg-orange-500/15 border-2 border-orange-500/40 shadow-sm shadow-orange-500/20'
                       : isDone
                         ? fb === 'correct'
                           ? 'bg-green-500/15 border border-green-500/30'
                           : 'bg-red-500/15 border border-red-500/30'
                         : 'bg-white/5 border border-white/10 hover:border-orange-500/30'
                     }
                   `}
                >
                  <div className="flex items-center justify-between">
                     <div className="text-xs font-medium text-slate-400">
                      第 {idx + 1} 句（提示：{getHint(line)}）
                    </div>
                    {fb === 'correct' && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                    {isActive && !isDone && !allCompleted && (
                      <span className="text-xs text-orange-500 font-medium">
                        正在输入 ✏️
                      </span>
                    )}
                  </div>
                  {/* 横线书写式答题区 */}
                  <UnderlineInput
                    value={answer}
                    feedback={fb}
                    correctAnswer={showAnswer ? line : ''}
                    showCursor={isActive && fb === 'none'}
                    size="xl"
                    align="center"
                    placeholder={isActive ? '请输入诗句...' : ''}
                  />
                  {/* 错误次数提示 */}
                  {fb === 'wrong' && !showAnswer && (
                    <div className="text-center">
                      <span className="text-xs text-red-400">
                        {attempts}/{MAX_WRONG_ATTEMPTS}
                      </span>
                    </div>
                  )}
                  {/* 正确答案（达最大错误次数后） */}
                  {showAnswer && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {line}
                      </div>
                    </div>
                  )}
                  {/* 答对后的正确答案（大字号） */}
                  {fb === 'correct' && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {line}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 全部完成结果 */}
          {allCompleted && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-lg font-bold text-white">
                共 {currentPoem.content.length} 句，答对{' '}
                <span className="text-green-400">{correctCount}</span> 句
              </div>
              <div className="text-sm text-slate-400 mt-1">
                正确率 {Math.round((correctCount / currentPoem.content.length) * 100)}%
              </div>
            </div>
          )}

          {/* 查看原文 */}
          {showOriginal && (
             <div className="mx-6 mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
               <div className="text-sm font-medium text-orange-400 mb-2">📜 原文</div>
               {currentPoem.content.map((line: string, idx: number) => (
                 <div key={idx} className="text-base text-slate-200 py-1">
                   {line}
                 </div>
               ))}
             </div>
          )}

          {/* 赏析面板 */}
          {showAnalysis && (
            <div className="mx-6 mb-4 space-y-3">
              {currentPoem.translation && (
                 <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                   <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 mb-2">
                    <BookMarked size={14} />
                    译文
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed">
                    {currentPoem.translation}
                  </div>
                </div>
              )}
              {currentPoem.annotation && (
                 <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                   <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2">
                    <Lightbulb size={14} />
                    注释
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {currentPoem.annotation}
                  </div>
                </div>
              )}
              {currentPoem.appreciation && (
                 <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                   <div className="flex items-center gap-2 text-sm font-semibold text-purple-400 mb-2">
                    <Sparkles size={14} />
                    赏析
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {currentPoem.appreciation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
           <div className="p-4 border-t border-white/10 flex gap-3 flex-wrap">
             <button
               onClick={() => setShowOriginal(!showOriginal)}
               className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 border border-white/10 transition-all"
             >
               <Eye size={16} />
               {showOriginal ? '隐藏原文' : '查看原文'}
             </button>
             <button
               onClick={() => setShowAnalysis(!showAnalysis)}
               className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/25 border border-blue-500/20 transition-all"
             >
              <BookMarked size={16} />
              {showAnalysis ? '收起赏析' : '译文/注释/赏析'}
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              <RotateCcw size={16} />
              重新默写
            </button>
          </div>
        </div>
      )}

      {/* 返回列表（移动端友好） */}
      <div className="hidden">
        <button className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ChevronLeft size={16} />
          返回列表
        </button>
      </div>

      {/* 底部全宽虚拟键盘（拼音布局） */}
      {currentPoem && !allCompleted && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <VirtualKeyboard
            layout="pinyin"
            value={userAnswers[activeLineIndex] || ''}
            onChange={handleKeyChange}
            onSubmit={
              currentFeedback === 'none' ||
              (currentFeedback === 'wrong' && currentAttempts < MAX_WRONG_ATTEMPTS)
                ? handleSubmitCurrent
                : handleNextLine
            }
            onBackspace={() => {
              const answer = userAnswers[activeLineIndex] || '';
              if (answer.length > 0) {
                handleKeyChange(answer.slice(0, -1));
              }
            }}
            disabled={false}
            colorScheme="pinyin"
            targetWord={currentPoem.content[activeLineIndex] || ''}
            fullWidth={true}
            showNextGuide={!(currentFeedback === 'correct' || currentShowAnswer)}
            theme="neon"
            spaceSubmit={true}
            targetText={currentPoem.content[activeLineIndex] || ''}
            toolbar={{
              reset: { onClick: () => { handleKeyChange(''); } },
              skip: { onClick: handleNextLine },
              submit: {
                onClick:
                  currentFeedback === 'none' ||
                  (currentFeedback === 'wrong' && currentAttempts < MAX_WRONG_ATTEMPTS)
                    ? handleSubmitCurrent
                    : handleNextLine,
              },
            }}
            spaceLeftActions={[
              { id: 'reset', label: '重置', onClick: () => { handleKeyChange(''); }, variant: 'default' },
            ]}
            spaceRightActions={[
              {
                id: 'submit',
                label: '提交',
                onClick:
                  currentFeedback === 'none' ||
                  (currentFeedback === 'wrong' && currentAttempts < MAX_WRONG_ATTEMPTS)
                    ? handleSubmitCurrent
                    : handleNextLine,
                variant: 'success' as const,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default PoetryRecitationView;
