import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Check,
  X,
  Clock,
  Trophy,
  Star,
  Zap,
  Target,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getMentalArithmetic,
} from '@client/src/api/math-practice';
import type { MentalArithmeticItem } from '@shared/api.interface';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { getMathIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';
import UnitConversionView from './UnitConversionView';
import { Calculator, ArrowLeftRight } from 'lucide-react';

type ViewState = 'setup' | 'quiz' | 'result';
type SubTabType = 'arithmetic' | 'unit_conversion';

interface Settings {
  operations: string[];
  difficulty: number;
  count: number;
  timed: boolean;
  durationMinutes: number;
}

interface WrongItem {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

const OPERATION_OPTIONS = [
  { value: 'add', label: '加法', symbol: '+' },
  { value: 'subtract', label: '减法', symbol: '−' },
  { value: 'multiply', label: '乘法', symbol: '×' },
  { value: 'divide', label: '除法', symbol: '÷' },
];

const DIFFICULTY_LABELS = ['入门', '简单', '中等', '较难', '挑战'];
const COUNT_OPTIONS = [10, 20, 30, 50];
const MAX_WRONG_ATTEMPTS = 3;

interface MentalArithmeticViewProps {
  textbookId: string;
  unitId: string;
  difficulty: number;
  grade?: string;
}

const MentalArithmeticView: React.FC<MentalArithmeticViewProps> = ({
  textbookId,
  unitId,
  difficulty: externalDifficulty,
  grade,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>('arithmetic');
  const [view, setView] = useState<ViewState>('setup');
  const [settings, setSettings] = useState<Settings>({
    operations: ['add', 'subtract'],
    difficulty: 2,
    count: 20,
    timed: false,
    durationMinutes: 5,
  });
  const [items, setItems] = useState<MentalArithmeticItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<WrongItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const startTimeRef = useRef<number>(0);
  const totalTimeRef = useRef<number>(0);

  // 计时器
  useEffect(() => {
    if (view !== 'quiz' || !settings.timed || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [view, settings.timed]);

  const toggleOperation = (op: string): void => {
    setSettings((prev) => {
      const has = prev.operations.includes(op);
      const next = has
        ? prev.operations.filter((o) => o !== op)
        : [...prev.operations, op];
      // 至少保留一个
      if (next.length === 0) return prev;
      return { ...prev, operations: next };
    });
  };

  const startQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMentalArithmetic({
        count: settings.count,
        difficulty: settings.difficulty,
        operations: settings.operations,
        textbookId,
        unitId,
      });
      setItems(data);
      setCurrentIndex(0);
      setUserAnswer('');
      setFeedback(null);
      setWrongAttempts(0);
      setScore(0);
      setCorrectCount(0);
      setWrongItems([]);
      startTimeRef.current = Date.now();
      if (settings.timed) {
        setTimeLeft(settings.durationMinutes * 60);
      }
      setView('quiz');
    } catch (err) {
      logger.error('获取口算题失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const finishQuiz = useCallback((): void => {
    totalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setView('result');
  }, []);

  const goToNext = useCallback((): void => {
    if (currentIndex >= items.length - 1) {
      finishQuiz();
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setWrongAttempts(0);
    }
  }, [currentIndex, items.length, finishQuiz]);

  const submitAnswer = useCallback((): void => {
    if (userAnswer === '' || currentIndex >= items.length) return;
    if (feedback === 'correct') return;
    // 已达最大错误次数时不允许再提交（等待自动下一题）
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

    const item = items[currentIndex];
    const isCorrect = userAnswer.trim() === item.answer.trim();

    if (isCorrect) {
      setFeedback('correct');
      // 第一次答对才计分
      if (wrongAttempts === 0) {
        setCorrectCount((c) => c + 1);
        setScore((s) => s + item.difficulty * 10);
      }
      // 答对后自动进入下一题
      setTimeout(() => {
        goToNext();
      }, 600);
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setFeedback('wrong');

      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        // 记录错题
        setWrongItems((w) => [
          ...w,
          { question: item.question, userAnswer, correctAnswer: item.answer },
        ]);
        // 显示正确答案后自动下一题
        setTimeout(() => {
          goToNext();
        }, 2000);
      }
    }
  }, [feedback, userAnswer, currentIndex, items, wrongAttempts, goToNext]);

  const handleInputChange = (val: string): void => {
    // 错误后继续输入时，清除错误状态，允许重新提交
    if (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setFeedback(null);
    }
    setUserAnswer(val);
  };

  // 物理键盘回车提交
  useEffect(() => {
    if (view !== 'quiz') return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
      if (userAnswer === '' || feedback === 'correct') return;
      e.preventDefault();
      submitAnswer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, userAnswer, feedback, submitAnswer]);

  const handleRestart = (): void => {
    setView('setup');
    setItems([]);
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentItem = items[currentIndex];
  const showKeyboard = view === 'quiz';

  // === 子 Tab 切换 ===
  if (subTab === 'unit_conversion') {
    return <UnitConversionView grade={grade} difficulty={externalDifficulty} />;
  }

  const subTabs = [
    { value: 'arithmetic' as const, label: '口算练习', icon: <Calculator size={16} />, color: 'from-orange-400 to-pink-500' },
    { value: 'unit_conversion' as const, label: '单位换算', icon: <ArrowLeftRight size={16} />, color: 'from-blue-400 to-indigo-500' },
  ];

  // === 设置面板 ===
  if (view === 'setup') {
    return (
      <div className="space-y-4">
        {/* 子Tab切换 */}
        <div className="glass-card p-2">
          <div className="flex gap-1">
            {subTabs.map((tab) => {
              const isActive = subTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSubTab(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                       : 'text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card space-y-6">
         {/* 情境插图 + 标题 */}
         <div className="text-center">
           <div className="inline-flex items-center justify-center w-[120px] h-[120px] rounded-full overflow-hidden shadow-xl mb-4 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500">
             <Image
               src={getMathIllustration('mental')}
               alt="mental arithmetic"
               className="w-full h-full object-cover"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
               }}
             />
           </div>
           <h2 className="text-xl font-bold text-white mb-1">口算训练设置</h2>
           <p className="text-sm text-slate-400">选择你想练习的类型，开始挑战吧！</p>
         </div>

        {/* 运算类型 */}
        <div>
           <label className="text-sm font-semibold text-slate-200 mb-3 block">运算类型</label>
          <div className="grid grid-cols-4 gap-3">
            {OPERATION_OPTIONS.map((op) => {
              const active = settings.operations.includes(op.value);
              return (
                <button
                  key={op.value}
                  onClick={() => toggleOperation(op.value)}
                  className={`py-4 rounded-xl font-bold text-xl transition-all ${
                    active
                       ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-md scale-105'
                       : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                >
                  {op.symbol}
                  <div className="text-xs font-normal mt-1">{op.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 难度 */}
        <div>
           <label className="text-sm font-semibold text-slate-200 mb-3 block">
             难度：{DIFFICULTY_LABELS[settings.difficulty - 1]}
           </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSettings((s) => ({ ...s, difficulty: level }))}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1 transition-all ${
                   settings.difficulty >= level
                     ? 'text-yellow-400 bg-yellow-500/20'
                     : 'text-slate-500 bg-white/5'
                }`}
              >
                <Star size={18} fill={settings.difficulty >= level ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* 题目数量 */}
        <div>
           <label className="text-sm font-semibold text-slate-200 mb-3 block">题目数量</label>
          <div className="grid grid-cols-4 gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setSettings((s) => ({ ...s, count: n }))}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                     settings.count === n
                       ? 'bg-blue-500 text-white shadow-md'
                       : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {n} 题
              </button>
            ))}
          </div>
        </div>

        {/* 计时模式 */}
         <div className="flex items-center justify-between p-4 bg-white/10 border border-white/10 rounded-xl">
           <div className="flex items-center gap-3">
             <Clock size={20} className="text-blue-400" />
             <div>
               <div className="text-sm font-semibold text-slate-200">计时模式</div>
               <div className="text-xs text-slate-400">在限定时间内完成尽可能多的题</div>
             </div>
           </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, timed: !s.timed }))}
            className={`w-12 h-7 rounded-full transition-all ${
              settings.timed ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.timed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.timed && (
          <div>
             <label className="text-sm font-semibold text-slate-200 mb-3 block">限时</label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((m) => (
                <button
                  key={m}
                  onClick={() => setSettings((s) => ({ ...s, durationMinutes: m }))}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                   settings.durationMinutes === m
                     ? 'bg-blue-500 text-white shadow-md'
                     : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {m} 分钟
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play size={20} fill="white" />
          {loading ? '加载中...' : '开始练习'}
        </button>
      </div>
      </div>
    );
  }

  // === 答题界面 ===
  if (view === 'quiz' && currentItem) {
    return (
      <div className="space-y-4">
        {/* 子Tab切换 */}
        <div className="glass-card p-2">
          <div className="flex gap-1">
            {subTabs.map((tab) => {
              const isActive = subTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSubTab(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                       : 'text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

         <div className="glass-card space-y-6 pb-80">
           {/* 顶部状态栏 */}
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm text-slate-300">
               <Target size={16} className="text-blue-400" />
              <span>第 {currentIndex + 1} / {items.length} 题</span>
            </div>
            {settings.timed && (
              <div
                className={`flex items-center gap-2 text-sm font-semibold ${
                  timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-blue-400'
                }`}
              >
                <Clock size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
             <div className="flex items-center gap-2 text-sm text-orange-400 font-semibold">
              <Zap size={16} />
              <span>{score} 分</span>
            </div>
          </div>

           {/* 情境插图 */}
           <div className="flex justify-center">
             <div className="inline-flex items-center justify-center w-[120px] h-[120px] rounded-full overflow-hidden shadow-xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500">
               <Image
                 src={getMathIllustration('mental')}
                 alt="mental arithmetic"
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                 }}
               />
             </div>
           </div>

          {/* 题目展示 */}
          <div className="text-center">
            <div
              className={`text-5xl font-bold mb-8 transition-all ${
                 feedback === 'correct'
                   ? 'text-green-400'
                   : feedback === 'wrong'
                     ? 'text-red-400'
                     : 'text-white'
              }`}
            >
              {currentItem.question}
               <span className="text-slate-500 ml-2">?</span>
            </div>

            {/* 答题显示区 - 横线书写式 */}
            <div className="flex justify-center px-4">
              <UnderlineInput
                value={userAnswer}
                feedback={feedback ?? 'none'}
                correctAnswer={currentItem.answer}
                size="xl"
                placeholder="请输入答案"
                className="max-w-md"
              />
            </div>

            {/* 反馈：正确绿色，错误红色简洁文字；达到最大错误次数时显示大字正确答案 */}
            {feedback === 'correct' && (
              <div className="mt-6 text-lg font-semibold flex items-center justify-center gap-2 text-green-500">
                <Check size={24} /> 回答正确！
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="mt-6 text-center">
                <div className="text-red-400 text-xs mb-2">
                  {wrongAttempts}/{MAX_WRONG_ATTEMPTS}
                </div>
                {wrongAttempts >= MAX_WRONG_ATTEMPTS && (
                  <div className="text-green-600 text-2xl font-bold">
                    {currentItem.answer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部全宽数字键盘 */}
        {showKeyboard && (
          <div className="fixed bottom-0 left-0 right-0 z-40">
            <VirtualKeyboard
              layout="number"
              value={userAnswer}
              onChange={handleInputChange}
              onSubmit={submitAnswer}
              disabled={feedback === 'correct' || (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS)}
              colorScheme="number"
              fullWidth={true}
              theme="neon"
              showTypedHighlight={false}
              showNextGuide={false}
              toolbar={{
                reset: { onClick: () => setUserAnswer('') },
                skip: { onClick: goToNext },
                submit: {
                  onClick: submitAnswer,
                  label: '提交',
                },
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // === 结果页 ===
  if (view === 'result') {
    const total = items.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const usedTime =
      totalTimeRef.current || Math.floor((Date.now() - startTimeRef.current) / 1000);

    return (
      <div className="space-y-4">
        {/* 子Tab切换 */}
        <div className="glass-card p-2">
          <div className="flex gap-1">
            {subTabs.map((tab) => {
              const isActive = subTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSubTab(tab.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                       : 'text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4 shadow-lg">
            <Trophy size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">练习完成！</h2>
          <p className="text-slate-400 mt-1">做得好，继续加油哦～</p>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-orange-500/20 border border-orange-500/30 rounded-2xl">
            <div className="text-3xl font-bold text-orange-400">{score}</div>
            <div className="text-xs text-slate-400 mt-1">总得分</div>
          </div>
          <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
            <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
            <div className="text-xs text-slate-400 mt-1">正确率</div>
          </div>
          <div className="text-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
            <div className="text-3xl font-bold text-blue-400">
              {Math.floor(usedTime / 60)}:{(usedTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-400 mt-1">用时</div>
          </div>
        </div>

        {/* 错题回顾 */}
        {wrongItems.length > 0 && (
          <div>
             <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <X size={16} className="text-red-500" />
              错题回顾（{wrongItems.length} 道）
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {wrongItems.map((item: WrongItem, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{item.question}</span>
                    <span className="mx-2 text-slate-500">→</span>
                    <span className="text-red-500 line-through">{item.userAnswer || '空'}</span>
                  </div>
                    <div className="text-green-400 font-semibold">{item.correctAnswer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRestart}
             className="py-3 bg-white/10 text-slate-200 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            重新设置
          </button>
          <button
            onClick={startQuiz}
            className="py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            再来一次
          </button>
        </div>
      </div>
      </div>
    );
  }

  return null;
};

export default MentalArithmeticView;
