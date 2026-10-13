import React, { useState, useCallback, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Check,
  X,
  Trophy,
  Ruler,
  Scale,
  Clock,
  Grid3X3,
  Zap,
  Target,
  RefreshCw,
} from 'lucide-react';
import NumberKeypad from './NumberKeypad';

type ViewState = 'setup' | 'quiz' | 'result';
type UnitCategory = 'length' | 'weight' | 'time' | 'area';

interface UnitConversionItem {
  question: string;
  answer: string;
  fromUnit: string;
  toUnit: string;
  value: number;
  category: UnitCategory;
}

interface WrongItem {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

const CATEGORIES: Array<{
  value: UnitCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}> = [
  { value: 'length', label: '长度', icon: <Ruler size={18} />, color: 'from-blue-400 to-indigo-500' },
  { value: 'weight', label: '重量', icon: <Scale size={18} />, color: 'from-green-400 to-emerald-500' },
  { value: 'time', label: '时间', icon: <Clock size={18} />, color: 'from-orange-400 to-pink-500' },
  { value: 'area', label: '面积', icon: <Grid3X3 size={18} />, color: 'from-purple-400 to-violet-500' },
];

// 单位换算关系
const UNIT_CONVERSIONS: Record<UnitCategory, Array<{ from: string; to: string; factor: number }>> = {
  length: [
    { from: '千米', to: '米', factor: 1000 },
    { from: '米', to: '分米', factor: 10 },
    { from: '分米', to: '厘米', factor: 10 },
    { from: '厘米', to: '毫米', factor: 10 },
    { from: '米', to: '厘米', factor: 100 },
    { from: '米', to: '毫米', factor: 1000 },
  ],
  weight: [
    { from: '吨', to: '千克', factor: 1000 },
    { from: '千克', to: '克', factor: 1000 },
    { from: '吨', to: '克', factor: 1000000 },
  ],
  time: [
    { from: '时', to: '分', factor: 60 },
    { from: '分', to: '秒', factor: 60 },
    { from: '时', to: '秒', factor: 3600 },
  ],
  area: [
    { from: '平方米', to: '平方分米', factor: 100 },
    { from: '平方分米', to: '平方厘米', factor: 100 },
    { from: '平方米', to: '平方厘米', factor: 10000 },
  ],
};

const DIFFICULTY_LABELS = ['入门', '简单', '中等', '较难', '挑战'];
const COUNT_OPTIONS = [10, 20, 30];

// 生成随机题目
const generateQuestion = (category: UnitCategory, difficulty: number): UnitConversionItem => {
  const conversions = UNIT_CONVERSIONS[category];
  const conv = conversions[Math.floor(Math.random() * conversions.length)];

  // 根据难度调整数值范围
  let maxValue: number;
  switch (difficulty) {
    case 1:
      maxValue = 10;
      break;
    case 2:
      maxValue = 50;
      break;
    case 3:
      maxValue = 100;
      break;
    case 4:
      maxValue = 500;
      break;
    default:
      maxValue = 1000;
  }

  const value = Math.floor(Math.random() * maxValue) + 1;
  const result = value * conv.factor;

  // 反向换算概率（大单位→小单位 或 小单位→大单位）
  const reverse = difficulty >= 3 && Math.random() > 0.5;

  if (reverse) {
    return {
      question: `${result} ${conv.to} = ? ${conv.from}`,
      answer: String(value),
      fromUnit: conv.to,
      toUnit: conv.from,
      value: result,
      category,
    };
  }

  return {
    question: `${value} ${conv.from} = ? ${conv.to}`,
    answer: String(result),
    fromUnit: conv.from,
    toUnit: conv.to,
    value,
    category,
  };
};

const generateQuestions = (
  categories: UnitCategory[],
  count: number,
  difficulty: number,
): UnitConversionItem[] => {
  const questions: UnitConversionItem[] = [];
  for (let i = 0; i < count; i++) {
    const cat = categories[i % categories.length];
    questions.push(generateQuestion(cat, difficulty));
  }
  return questions.sort(() => Math.random() - 0.5);
};

interface UnitConversionViewProps {
  grade?: string;
  difficulty?: number;
}

const UnitConversionView: React.FC<UnitConversionViewProps> = ({
  grade: externalGrade,
  difficulty: externalDifficulty = 2,
}) => {
  const [view, setView] = useState<ViewState>('setup');
  const [selectedCategories, setSelectedCategories] = useState<UnitCategory[]>(['length']);
  const [difficulty, setDifficulty] = useState<number>(externalDifficulty);
  const [count, setCount] = useState<number>(10);

  const [questions, setQuestions] = useState<UnitConversionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongItems, setWrongItems] = useState<WrongItem[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const MAX_WRONG_ATTEMPTS = 3;

  // 根据年级初始化可选单位类型
  useEffect(() => {
    const gradeNum = externalGrade
      ? Number(externalGrade.replace('grade', ''))
      : 3;
    const cats: UnitCategory[] = ['length'];
    if (gradeNum >= 2) cats.push('weight');
    if (gradeNum >= 3) cats.push('time');
    if (gradeNum >= 4) cats.push('area');
    setSelectedCategories(cats.slice(0, 1));
  }, [externalGrade]);

  const toggleCategory = (cat: UnitCategory): void => {
    setSelectedCategories((prev) => {
      const has = prev.includes(cat);
      const next = has ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (next.length === 0) return prev;
      return next;
    });
  };

  const startQuiz = useCallback((): void => {
    const qs = generateQuestions(selectedCategories, count, difficulty);
    setQuestions(qs);
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setWrongAttempts(0);
    setScore(0);
    setCorrectCount(0);
    setWrongItems([]);
    setView('quiz');
  }, [selectedCategories, count, difficulty]);

  const goToNext = useCallback((): void => {
    if (currentIndex >= questions.length - 1) {
      setView('result');
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setWrongAttempts(0);
    }
  }, [currentIndex, questions.length]);

  const submitAnswer = useCallback((): void => {
    if (userAnswer === '' || currentIndex >= questions.length) return;
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;

    const item = questions[currentIndex];
    const userNum = Number(userAnswer);
    const correctNum = Number(item.answer);
    const isCorrect = !isNaN(userNum) && Math.abs(userNum - correctNum) < 0.0001;

    if (isCorrect) {
      setFeedback('correct');
      if (wrongAttempts === 0) {
        setCorrectCount((c) => c + 1);
        setScore((s) => s + difficulty * 10);
      }
      setTimeout(() => {
        goToNext();
      }, 600);
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setFeedback('wrong');

      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        setWrongItems((w) => [
          ...w,
          {
            question: item.question,
            userAnswer: userAnswer || '空',
            correctAnswer: item.answer,
          },
        ]);
        setTimeout(() => {
          goToNext();
        }, 2000);
      }
    }
  }, [userAnswer, currentIndex, questions, feedback, wrongAttempts, difficulty, goToNext]);

  const handleInputChange = (val: string): void => {
    if (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setFeedback(null);
    }
    setUserAnswer(val);
  };

  const handleRestart = (): void => {
    setView('setup');
    setQuestions([]);
  };

  const currentItem = questions[currentIndex];
  const currentCategory = CATEGORIES.find((c) => c.value === currentItem?.category);

  // === 设置面板 ===
  if (view === 'setup') {
    return (
      <div className="glass-card space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white mb-4 shadow-lg">
            <Ruler size={36} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">单位换算练习</h2>
          <p className="text-sm text-slate-400">掌握单位之间的换算关系</p>
        </div>

        {/* 单位类型选择 */}
        <div>
          <label className="text-sm font-semibold text-slate-200 mb-3 block">
             单位类型
           </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`py-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${
                    active
                      ? `bg-gradient-to-br ${cat.color} text-white shadow-md scale-105`
                       : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                >
                  {cat.icon}
                  <span className="text-sm">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 难度 */}
        <div>
          <label className="text-sm font-semibold text-slate-200 mb-3 block">
             难度：{DIFFICULTY_LABELS[difficulty - 1]}
           </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all ${
                  difficulty >= level
                     ? 'text-yellow-400 bg-yellow-500/20'
                     : 'text-slate-500 bg-white/5'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* 题目数量 */}
        <div>
           <label className="text-sm font-semibold text-slate-200 mb-3 block">
             题目数量
           </label>
          <div className="grid grid-cols-3 gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  count === n
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {n} 题
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          className="w-full py-4 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Play size={20} fill="white" />
          开始练习
        </button>
      </div>
    );
  }

  // === 答题界面 ===
  if (view === 'quiz' && currentItem) {
    return (
      <div className="space-y-4">
        <div className="glass-card space-y-6">
          {/* 顶部状态栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Target size={16} className="text-blue-400" />
              <span>
                第 {currentIndex + 1} / {questions.length} 题
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-400 font-semibold">
              <Zap size={16} />
              <span>{score} 分</span>
            </div>
          </div>

           {/* 分类标签 */}
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${currentCategory?.color ?? 'from-gray-400 to-gray-500'}`}
            >
              {currentCategory?.icon}
              {currentCategory?.label}单位换算
            </span>
          </div>

          {/* 题目展示 */}
          <div className="text-center">
            <div
              className={`text-3xl md:text-4xl font-bold mb-8 transition-all ${
                feedback === 'correct'
                  ? 'text-green-500'
                  : feedback === 'wrong'
                    ? 'text-red-500'
                     : 'text-white'
              }`}
            >
              {currentItem.question}
            </div>

            {/* 答案输入显示 */}
            <div className="flex justify-center px-4">
              <div
                className={`min-w-[200px] max-w-md w-full py-4 px-6 rounded-xl text-center text-3xl font-bold border-2 transition-all ${
                  feedback === 'correct'
                    ? 'border-green-400 bg-green-50 text-green-600'
                    : feedback === 'wrong'
                      ? 'border-red-400 bg-red-50 text-red-600'
                       : 'border-white/20 bg-white/10 text-white'
                }`}
              >
                 {userAnswer || <span className="text-slate-500 font-normal">输入答案</span>}
                 <span className="text-slate-400 font-normal ml-2 text-lg">
                  {currentItem.toUnit}
                </span>
              </div>
            </div>

            {/* 反馈 */}
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
                    正确答案：{currentItem.answer} {currentItem.toUnit}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 数字键盘 */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">使用键盘输入答案</span>
            <button
              onClick={goToNext}
              className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300"
            >
              <RefreshCw size={14} />
              跳过
            </button>
          </div>
          <NumberKeypad
            value={userAnswer}
            onChange={handleInputChange}
            onSubmit={submitAnswer}
            disabled={
              feedback === 'correct' ||
              (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS)
            }
            maxLength={10}
            allowDecimal={difficulty >= 4}
            allowNegative={false}
          />
        </div>
      </div>
    );
  }

  // === 结果页 ===
  if (view === 'result') {
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="glass-card space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white mb-4 shadow-lg">
            <Trophy size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">练习完成！</h2>
          <p className="text-slate-400 mt-1">继续加油，你真棒～</p>
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
            <div className="text-3xl font-bold text-blue-400">{correctCount}/{total}</div>
            <div className="text-xs text-slate-400 mt-1">答对题数</div>
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
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-red-500 line-through">{item.userAnswer}</span>
                  </div>
                  <div className="text-green-600 font-semibold">{item.correctAnswer}</div>
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
            className="py-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            再来一次
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default UnitConversionView;
