import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  generatePoetryChain,
  submitPoetryChain,
} from '@client/src/api/games';
import { UnderlineInput } from '@client/src/components/underline-input';
import type { PoetryChainQuestion } from '@shared/api.interface';

interface PoetryChainGameProps {
  onBack: () => void;
}

type ViewState = 'intro' | 'play' | 'result';

const DIFFICULTY_LABELS = ['启蒙', '入门', '进阶', '挑战', '大师'];
const COUNT_OPTIONS = [5, 10, 15, 20];

const PoetryChainGame: React.FC<PoetryChainGameProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [count, setCount] = useState<number>(10);

  const [questions, setQuestions] = useState<PoetryChainQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [hintLevel, setHintLevel] = useState<number>(0); // 0=无提示, 1=首字, 2=前两字
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generatePoetryChain({ difficulty, count });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswer('');
      setScore(0);
      setCorrectCount(0);
      setHintsUsed(0);
      setHintLevel(0);
      setFeedback(null);
      startTimeRef.current = Date.now();
      setView('play');
    } catch (err) {
      logger.error('生成古诗接龙题失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [difficulty, count]);

  const finishGame = useCallback((): void => {
    durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const details = { hintsUsed, difficulty };
    submitPoetryChain({
      score,
      totalQuestions: questions.length,
      correctCount,
      durationSec: durationRef.current,
      difficulty,
      details,
    }).catch((err: Error) => {
      logger.error('提交古诗接龙成绩失败', err);
    });
    setView('result');
  }, [score, correctCount, questions.length, difficulty, hintsUsed]);

  const nextQuestion = useCallback((): void => {
    if (currentIndex >= questions.length - 1) {
      finishGame();
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setHintLevel(0);
    }
  }, [currentIndex, questions.length, finishGame]);

  const submitAnswer = useCallback((): void => {
    if (feedback || userAnswer === '' || currentIndex >= questions.length) return;

    const item = questions[currentIndex];
    const correct = item.secondLine.replace(/[，。！？、；：,.!?]/g, '').trim();
    const answer = userAnswer.replace(/[，。！？、；：,.!?]/g, '').trim();
    const isCorrect = answer === correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const basePoints = 20;
      const hintPenalty = hintLevel * 5;
      const points = Math.max(5, basePoints - hintPenalty);
      setScore((s) => s + points);
    } else {
      // 错误不扣分，但连击断了（这里没连击）
    }

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  }, [feedback, userAnswer, currentIndex, questions, hintLevel, nextQuestion]);

  const useHint = (): void => {
    if (feedback) return;
    if (hintLevel >= 2) return;
    setHintLevel((h) => h + 1);
    setHintsUsed((h) => h + 1);
  };

  const currentItem = questions[currentIndex];
  const accuracy = questions.length > 0
    ? Math.round((correctCount / Math.max(1, currentIndex + (feedback ? 1 : 0))) * 100)
    : 0;

  // 获取当前提示文本
  const getCurrentHint = (): string => {
    if (!currentItem) return '';
    const correct = currentItem.secondLine.replace(/[，。！？、；：,.!?]/g, '').trim();
    if (hintLevel === 0) return currentItem.hint;
    if (hintLevel === 1) return correct.slice(0, 1) + '...';
    return correct.slice(0, 2) + '...';
  };

  // === 介绍页 ===
  if (view === 'intro') {
    return (
      <div className="space-y-5">
         <button
           onClick={onBack}
           className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium"
         >
           <ArrowLeft size={18} />
           返回游戏乐园
         </button>

         <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
           <div className="flex items-center gap-3 mb-2">
             <div className="text-4xl">🏮</div>
             <div>
               <h1 className="text-2xl font-bold">古诗接龙</h1>
               <p className="text-sm opacity-90">上下句接龙，领略古诗词之美！</p>
             </div>
           </div>
         </div>

         <div className="glass-card p-5 space-y-5">
           <div>
             <h3 className="text-sm font-bold text-white mb-2">🎯 游戏规则</h3>
             <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
              <li>给出古诗上句，输入对应的下句</li>
              <li>每关通过得 20 分</li>
              <li>可使用提示：首字提示（-5分）、前两字提示（再-5分）</li>
              <li>完成所有关卡后结算总分</li>
            </ul>
          </div>

          <div>
             <label className="text-sm font-bold text-white mb-3 block">
               难度：{DIFFICULTY_LABELS[difficulty - 1]}
             </label>
             <div className="flex gap-2">
               {[1, 2, 3, 4, 5].map((level) => (
                 <button
                   key={level}
                   onClick={() => setDifficulty(level)}
                   className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1 transition-all ${
                     difficulty >= level
                       ? 'text-yellow-400 bg-yellow-500/10 border-2 border-yellow-400/50'
                       : 'text-slate-600 bg-white/5 border-2 border-transparent'
                   }`}
                >
                  <Star size={18} fill={difficulty >= level ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

           <div>
             <label className="text-sm font-bold text-white mb-3 block">关卡数量</label>
             <div className="grid grid-cols-4 gap-2">
               {COUNT_OPTIONS.map((n) => (
                 <button
                   key={n}
                   onClick={() => setCount(n)}
                   className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                     count === n
                       ? 'bg-red-500 text-white shadow-md'
                       : 'bg-white/5 text-slate-400 hover:bg-white/10'
                   }`}
                >
                  {n} 关
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? '加载中...' : '🚀 开始闯关'}
          </button>
        </div>
      </div>
    );
  }

  // === 游戏页 ===
  if (view === 'play') {
    return (
       <div className="space-y-4">
         <button
           onClick={onBack}
           className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium"
         >
           <ArrowLeft size={18} />
           退出游戏
         </button>

         <div className="glass-card p-5">
           {/* 顶部状态栏 */}
           <div className="flex items-center justify-between mb-4">
             <div className="text-sm text-slate-400">
               第 <span className="font-bold text-red-400">{currentIndex + 1}</span> / {questions.length} 关
             </div>
             <div className="flex items-center gap-1 text-sm text-slate-400">
               <Lightbulb size={14} />
               提示 {hintsUsed} 次
             </div>
             <div className="text-sm font-bold text-red-400">
               {score} 分
             </div>
           </div>

           {/* 古诗题目 */}
           <div className={`py-8 px-4 rounded-2xl mb-6 text-center transition-all ${
             feedback === 'correct' ? 'bg-green-500/20' : feedback === 'wrong' ? 'bg-red-500/20' : 'bg-red-500/10'
           }`}>
             <div className="text-xs text-red-300 mb-3">📜 上句</div>
             <div className="text-2xl font-bold text-white mb-6 leading-relaxed">
               {currentItem?.firstLine}
             </div>
             <div className="text-xs text-pink-300 mb-3">✍️ 请输入下句</div>

             {/* 提示 */}
             <div className="text-sm text-slate-400 mb-3">
               提示：{getCurrentHint()}
             </div>

            {/* 答题区 */}
            <div className="relative">
              <UnderlineInput
                value={userAnswer}
                feedback={feedback ?? 'none'}
                correctAnswer={currentItem?.secondLine.replace(/[，。！？、；：,.!?]/g, '').trim() ?? ''}
                size="lg"
                placeholder="请输入下句诗..."
              />
              <input
                type="text"
                value={userAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserAnswer(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') submitAnswer();
                }}
                disabled={feedback !== null}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                autoFocus
              />
            </div>

            <div className="mt-3 min-h-[24px]">
               {feedback === 'correct' && (
                 <span className="inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                   <CheckCircle size={18} />
                   回答正确！
                 </span>
               )}
               {feedback === 'wrong' && (
                 <div>
                   <span className="inline-flex items-center gap-1 text-red-400 text-sm font-medium">
                     <XCircle size={18} />
                     回答错误
                   </span>
                   <div className="text-green-400 text-sm mt-1">
                    正确答案：{currentItem?.secondLine}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 提示按钮 */}
          {!feedback && hintLevel < 2 && (
            <button
              onClick={useHint}
              className="w-full mb-3 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
            >
              <Lightbulb size={16} />
              {hintLevel === 0 ? '💡 使用首字提示（-5分）' : '💡 再显示一个字（-5分）'}
            </button>
          )}

          <button
            onClick={submitAnswer}
            disabled={!userAnswer || feedback !== null}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认答案
          </button>
        </div>
      </div>
    );
  }

  // === 结果页 ===
  return (
    <div className="space-y-5">
       <button
         onClick={onBack}
         className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-sm font-medium"
       >
         <ArrowLeft size={18} />
         返回游戏乐园
       </button>

       <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg text-center">
        <div className="text-6xl mb-3">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {accuracy >= 80 ? '诗词大家！' : accuracy >= 60 ? '表现不错！' : '继续加油！'}
        </h2>
        <p className="text-sm opacity-90">古诗接龙挑战完成</p>
        <div className="text-6xl font-bold mt-4">{score}</div>
        <div className="text-sm opacity-90">最终得分</div>
      </div>

       <div className="glass-card p-5">
         <div className="grid grid-cols-2 gap-4 mb-5">
           <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-green-400">{correctCount}</div>
             <div className="text-xs text-slate-400 mt-1">通过关数</div>
           </div>
           <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-red-400">{accuracy}%</div>
             <div className="text-xs text-slate-400 mt-1">正确率</div>
           </div>
           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-yellow-400">{hintsUsed}</div>
             <div className="text-xs text-slate-400 mt-1">使用提示</div>
           </div>
           <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-purple-400">
              {Math.round(durationRef.current / 60)}:{(durationRef.current % 60).toString().padStart(2, '0')}
             </div>
             <div className="text-xs text-slate-400 mt-1">总用时</div>
           </div>
         </div>

         <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-4">
           <div className="flex items-center gap-2">
             <Trophy size={20} className="text-yellow-400" />
             <span className="text-sm text-slate-300">历史最高分</span>
           </div>
           <span className="text-lg font-bold text-yellow-400">{score} 分</span>
         </div>

         <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-5">
           <div className="flex items-center gap-2">
             <Sparkles size={20} className="text-green-400" />
             <span className="text-sm text-slate-300">诗词掌握度</span>
           </div>
           <span className="text-lg font-bold text-green-400">{accuracy}%</span>
         </div>

         <div className="grid grid-cols-2 gap-3">
           <button
             onClick={() => setView('intro')}
             className="py-3 rounded-xl bg-white/10 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all border border-white/10"
           >
            <RotateCcw size={16} />
            重新设置
          </button>
          <button
            onClick={startGame}
            className="py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoetryChainGame;
