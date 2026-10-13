import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  Zap,
  Trophy,
  Star,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  generateMathBattle,
  submitMathBattle,
} from '@client/src/api/games';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import type { MathBattleQuestion } from '@shared/api.interface';

interface MathBattleGameProps {
  onBack: () => void;
}

type ViewState = 'intro' | 'play' | 'result';

const DIFFICULTY_LABELS = ['入门', '简单', '中等', '较难', '挑战'];
const COUNT_OPTIONS = [10, 20, 30, 50];
const TIME_LIMIT_OPTIONS = [60, 90, 120];
const OPERATION_OPTIONS = [
  { value: 'add', label: '加法', symbol: '+' },
  { value: 'subtract', label: '减法', symbol: '−' },
  { value: 'multiply', label: '乘法', symbol: '×' },
  { value: 'divide', label: '除法', symbol: '÷' },
];

const MathBattleGame: React.FC<MathBattleGameProps> = ({ onBack }) => {
  const [view, setView] = useState<ViewState>('intro');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [count, setCount] = useState<number>(20);
  const [timed, setTimed] = useState<boolean>(true);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [operations, setOperations] = useState<string[]>(['add', 'subtract']);

  const [questions, setQuestions] = useState<MathBattleQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFingerGuide, setShowFingerGuide] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // 计时器
  useEffect(() => {
    if (view !== 'play' || !timed || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, timed, timeLeft]);

  const toggleOperation = (op: string): void => {
    setOperations((prev) => {
      const has = prev.includes(op);
      const next = has ? prev.filter((o) => o !== op) : [...prev, op];
      if (next.length === 0) return prev;
      return next;
    });
  };

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateMathBattle({
        difficulty,
        count,
        operations: operations.join(','),
      });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswer('');
      setScore(0);
      setCorrectCount(0);
      setCombo(0);
      setMaxCombo(0);
      setFeedback(null);
      setTimeLeft(timeLimit);
      startTimeRef.current = Date.now();
      setView('play');
    } catch (err) {
      logger.error('生成口算题失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [difficulty, count, operations, timeLimit]);

  const finishGame = useCallback((): void => {
    durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    // 提交成绩
    const details = {
      maxCombo,
      timed,
      timeLimit,
      operations,
    };
    submitMathBattle({
      score,
      totalQuestions: questions.length || count,
      correctCount,
      durationSec: durationRef.current,
      difficulty,
      details,
    }).catch((err: Error) => {
      logger.error('提交口算成绩失败', err);
    });
    setView('result');
  }, [score, correctCount, questions.length, count, difficulty, maxCombo, timed, timeLimit, operations]);

  const submitAnswer = useCallback((): void => {
    if (feedback || userAnswer === '' || currentIndex >= questions.length) return;
    const item = questions[currentIndex];
    const isCorrect = userAnswer.trim() === item.answer.trim();
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setCorrectCount((c) => c + 1);
      const comboBonus = Math.min(newCombo, 10);
      const points = 10 + (comboBonus - 1) * 2;
      setScore((s) => s + points);
    } else {
      setCombo(0);
      setScore((s) => Math.max(0, s - 5));
    }

    setTimeout(() => {
      if (timed && timeLeft <= 0) return;
      if (currentIndex >= questions.length - 1) {
        finishGame();
      } else {
        setCurrentIndex((i) => i + 1);
        setUserAnswer('');
        setFeedback(null);
      }
    }, 800);
  }, [feedback, userAnswer, currentIndex, questions, combo, finishGame, timed, timeLeft]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accuracy = questions.length > 0 && (correctCount + (feedback === 'correct' ? 0 : 0)) > 0
    ? Math.round((correctCount / Math.max(1, currentIndex + (feedback ? 1 : 0))) * 100)
    : 0;

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

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🧮</div>
            <div>
              <h1 className="text-2xl font-bold">口算比拼</h1>
              <p className="text-sm opacity-90">限时速算，挑战你的计算速度！</p>
            </div>
          </div>
        </div>

         <div className="glass-card p-5 space-y-5">
          {/* 游戏规则 */}
          <div>
             <h3 className="text-sm font-bold text-white mb-2">🎯 游戏规则</h3>
             <ul className="text-sm text-slate-400 space-y-1 list-disc pl-5">
              <li>每题答对得 10 分，连击最高加 28 分</li>
              <li>答错扣 5 分，连击清零</li>
              <li>限时模式在时间结束后自动结算</li>
              <li>不限时模式完成所有题目后结算</li>
            </ul>
          </div>

          {/* 难度选择 */}
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
                       ? 'text-yellow-400 bg-yellow-500/20 border-2 border-yellow-400/60'
                       : 'text-slate-600 bg-white/5 border-2 border-transparent'
                  }`}
                >
                  <Star size={18} fill={difficulty >= level ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          {/* 题目数量 */}
          <div>
             <label className="text-sm font-bold text-white mb-3 block">题目数量</label>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  count === n
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/10 text-slate-400 hover:bg-white/15'
                  }`}
                >
                  {n} 题
                </button>
              ))}
            </div>
          </div>

          {/* 运算类型 */}
          <div>
             <label className="text-sm font-bold text-white mb-3 block">运算类型</label>
            <div className="grid grid-cols-4 gap-2">
              {OPERATION_OPTIONS.map((op) => {
                const active = operations.includes(op.value);
                return (
                  <button
                    key={op.value}
                    onClick={() => toggleOperation(op.value)}
                    className={`py-3 rounded-xl font-bold text-lg transition-all ${
                      active
                         ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md scale-105'
                         : 'bg-white/10 text-slate-500 hover:bg-white/15'
                    }`}
                  >
                    {op.symbol}
                    <div className="text-xs font-normal mt-0.5">{op.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 计时模式 */}
           <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-3">
               <Clock size={20} className="text-blue-400" />
              <div>
                 <div className="text-sm font-semibold text-slate-200">限时模式</div>
                 <div className="text-xs text-slate-400">在限定时间内尽量多答对</div>
              </div>
            </div>
            <button
              onClick={() => setTimed(!timed)}
              className={`w-12 h-7 rounded-full transition-all ${
                timed ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  timed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {timed && (
            <div>
               <label className="text-sm font-bold text-white mb-3 block">限时</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_LIMIT_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                      timeLimit === t
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t} 秒
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startGame}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? '加载中...' : '🚀 开始挑战'}
          </button>
        </div>
      </div>
    );
  }

  const currentItem = questions[currentIndex];

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
               第 <span className="font-bold text-blue-400">{currentIndex + 1}</span> / {questions.length} 题
             </div>
            {timed && (
               <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                 timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
               }`}>
                <Clock size={14} />
                {formatTime(timeLeft)}
              </div>
            )}
             <div className="text-sm font-bold text-orange-400">
              {score} 分
            </div>
          </div>

          {/* 连击 */}
          {combo > 1 && (
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-bold animate-pulse">
                <Zap size={14} fill="currentColor" />
                {combo} 连击！
              </span>
            </div>
          )}

          {/* 题目 */}
           <div className={`text-center py-8 rounded-2xl mb-6 transition-all ${
             feedback === 'correct' ? 'bg-emerald-500/20' : feedback === 'wrong' ? 'bg-red-500/20' : 'bg-blue-500/10'
           }`}>
             <div className="text-5xl font-bold text-white mb-4">
              {currentItem?.question}
            </div>
            <div className="max-w-xs mx-auto">
              <UnderlineInput
                value={userAnswer}
                feedback={feedback ?? 'none'}
                correctAnswer={currentItem?.answer ?? ''}
                size="lg"
                placeholder="输入答案..."
              />
            </div>
          </div>

          {/* 虚拟数字键盘 */}
          <div className="flex justify-center">
            <VirtualKeyboard
              layout="number"
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={submitAnswer}
              showFingerGuide={showFingerGuide}
              fingerSpeed="normal"
              disabled={feedback !== null}
              colorScheme="number"
              theme="neon"
              fullWidth={false}
              toolbar={{
                fingerGuide: {
                  active: showFingerGuide,
                  onToggle: () => setShowFingerGuide((v) => !v),
                },
                reset: { onClick: () => setUserAnswer('') },
                submit: { onClick: submitAnswer, label: '提交' },
              }}
            />
          </div>
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

      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg text-center">
        <div className="text-6xl mb-3">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {accuracy >= 80 ? '太厉害了！' : accuracy >= 60 ? '表现不错！' : '继续加油！'}
        </h2>
        <p className="text-sm opacity-90">口算挑战完成</p>
        <div className="text-6xl font-bold mt-4">{score}</div>
        <div className="text-sm opacity-90">最终得分</div>
      </div>

       <div className="glass-card p-5">
         <div className="grid grid-cols-2 gap-4 mb-5">
           <div className="bg-emerald-500/20 rounded-xl p-4 text-center border border-emerald-500/20">
             <div className="text-3xl font-bold text-emerald-400">{correctCount}</div>
             <div className="text-xs text-slate-400 mt-1">答对数</div>
           </div>
           <div className="bg-blue-500/20 rounded-xl p-4 text-center border border-blue-500/20">
             <div className="text-3xl font-bold text-blue-400">{accuracy}%</div>
             <div className="text-xs text-slate-400 mt-1">正确率</div>
           </div>
           <div className="bg-orange-500/20 rounded-xl p-4 text-center border border-orange-500/20">
             <div className="text-3xl font-bold text-orange-400">{maxCombo}</div>
             <div className="text-xs text-slate-400 mt-1">最高连击</div>
           </div>
           <div className="bg-fuchsia-500/20 rounded-xl p-4 text-center border border-fuchsia-500/20">
             <div className="text-3xl font-bold text-fuchsia-400">
               {correctCount > 0 ? Math.round(durationRef.current / correctCount) : 0}s
             </div>
             <div className="text-xs text-slate-400 mt-1">平均每题</div>
           </div>
         </div>

         <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl mb-4 border border-yellow-500/20">
           <div className="flex items-center gap-2">
             <Trophy size={20} className="text-yellow-400" />
             <span className="text-sm text-slate-300">历史最高分</span>
           </div>
           <span className="text-lg font-bold text-yellow-400">{score} 分</span>
         </div>

         <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl mb-5 border border-emerald-500/20">
           <div className="flex items-center gap-2">
             <Sparkles size={20} className="text-emerald-400" />
             <span className="text-sm text-slate-300">超越玩家</span>
           </div>
           <span className="text-lg font-bold text-emerald-400">{accuracy}%</span>
         </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('intro')}
             className="py-3 rounded-xl bg-white/10 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/15 transition-all"
          >
            <RotateCcw size={16} />
            重新设置
          </button>
          <button
            onClick={startGame}
            className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

export default MathBattleGame;
