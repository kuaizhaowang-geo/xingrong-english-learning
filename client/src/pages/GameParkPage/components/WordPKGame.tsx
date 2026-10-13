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
  Volume2,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  generateWordPK,
  submitWordPK,
} from '@client/src/api/games';
import { useSpeech } from '@client/src/hooks/use-speech';
import { useAutoSpeakSetting } from '@client/src/hooks/use-auto-speak-setting';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { Switch } from '@client/src/components/ui/switch';
import type { WordPKQuestion } from '@shared/api.interface';

interface WordPKGameProps {
  onBack: () => void;
}

type ViewState = 'intro' | 'play' | 'result';

const DIFFICULTY_LABELS = ['小学入门', '小学进阶', '初中', '高中', '高阶'];
const COUNT_OPTIONS = [10, 15, 20, 30];
const TIME_PER_WORD_OPTIONS = [10, 15, 20];

const WordPKGame: React.FC<WordPKGameProps> = ({ onBack }) => {
  const { speak } = useSpeech();
  const { enabled: autoSpeakEnabled } = useAutoSpeakSetting();
  const [view, setView] = useState<ViewState>('intro');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [count, setCount] = useState<number>(15);
  const [timePerWord, setTimePerWord] = useState<number>(15);

  const [questions, setQuestions] = useState<WordPKQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showFingerGuide, setShowFingerGuide] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const perWordTimerRef = useRef<number | null>(null);

  // 每题限时
  useEffect(() => {
    if (view !== 'play' || feedback !== null) return;
    if (perWordTimerRef.current) clearInterval(perWordTimerRef.current);

    perWordTimerRef.current = window.setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          if (perWordTimerRef.current) clearInterval(perWordTimerRef.current);
          // 超时算错
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (perWordTimerRef.current) clearInterval(perWordTimerRef.current);
    };
  }, [view, currentIndex, feedback]);

  const handleTimeout = useCallback((): void => {
    if (feedback) return;
    setFeedback('wrong');
    setCombo(0);
    setUserAnswer(questions[currentIndex]?.word ?? '');
    setTimeout(() => nextQuestion(), 1000);
  }, [feedback, questions, currentIndex]);

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateWordPK({ difficulty, count });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswer('');
      setScore(0);
      setCorrectCount(0);
      setCombo(0);
      setMaxCombo(0);
      setFeedback(null);
      setShowHint(false);
      setTimeLeft(timePerWord);
      startTimeRef.current = Date.now();
      setView('play');
    } catch (err) {
      logger.error('生成单词PK题失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [difficulty, count, timePerWord]);

  const finishGame = useCallback((): void => {
    durationRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const details = { maxCombo, timePerWord };
    submitWordPK({
      score,
      totalQuestions: questions.length,
      correctCount,
      durationSec: durationRef.current,
      difficulty,
      details,
    }).catch((err: Error) => {
      logger.error('提交单词PK成绩失败', err);
    });
    setView('result');
  }, [score, correctCount, questions.length, difficulty, maxCombo, timePerWord]);

  const nextQuestion = useCallback((): void => {
    if (currentIndex >= questions.length - 1) {
      finishGame();
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setFeedback(null);
      setShowHint(false);
      setTimeLeft(timePerWord);
    }
  }, [currentIndex, questions.length, finishGame, timePerWord]);

  const submitAnswer = useCallback((): void => {
    if (feedback || userAnswer === '' || currentIndex >= questions.length) return;
    if (perWordTimerRef.current) clearInterval(perWordTimerRef.current);

    const item = questions[currentIndex];
    const isCorrect = userAnswer.toLowerCase().trim() === item.word.toLowerCase().trim();
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setCorrectCount((c) => c + 1);
      const comboBonus = Math.min(newCombo, 10);
      const basePoints = 10 + difficulty * 2;
      const points = basePoints + (comboBonus - 1) * 2;
      setScore((s) => s + points);
    } else {
      setCombo(0);
      setScore((s) => Math.max(0, s - 5));
    }

    setTimeout(() => {
      nextQuestion();
    }, 500);
  }, [feedback, userAnswer, currentIndex, questions, combo, difficulty, nextQuestion]);

  const playWord = (): void => {
    const word = questions[currentIndex]?.word;
    if (word) speak(word, { lang: 'en-US' });
  };

  // 自动发音：每轮新单词出现时自动朗读英文单词
  useEffect(() => {
    if (view !== 'play' || loading || !autoSpeakEnabled) return;
    const word = questions[currentIndex]?.word;
    if (!word) return;
    speak(word, { lang: 'en-US' });
  }, [view, currentIndex, loading, autoSpeakEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentItem = questions[currentIndex];
  const accuracy = questions.length > 0
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

         <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg">
           <div className="flex items-center gap-3 mb-2">
             <div className="text-4xl">📝</div>
             <div>
               <h1 className="text-2xl font-bold">单词PK</h1>
               <p className="text-sm opacity-90">看释义拼单词，词汇量火箭式提升！</p>
             </div>
           </div>
         </div>

         <div className="glass-card p-5 space-y-5">
           <div>
             <h3 className="text-sm font-bold text-white mb-2">🎯 游戏规则</h3>
             <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
              <li>根据中文释义，输入正确的英文单词</li>
              <li>答对得分，连击加成，最高加 18 分</li>
              <li>答错或超时扣 5 分，连击清零</li>
              <li>可点击首字母提示（扣 3 分）</li>
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
             <label className="text-sm font-bold text-white mb-3 block">题目数量</label>
             <div className="grid grid-cols-4 gap-2">
               {COUNT_OPTIONS.map((n) => (
                 <button
                   key={n}
                   onClick={() => setCount(n)}
                   className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                     count === n
                       ? 'bg-orange-500 text-white shadow-md'
                       : 'bg-white/5 text-slate-400 hover:bg-white/10'
                   }`}
                >
                  {n} 词
                </button>
              ))}
            </div>
          </div>

           <div>
             <label className="text-sm font-bold text-white mb-3 block">每题限时</label>
             <div className="grid grid-cols-3 gap-2">
               {TIME_PER_WORD_OPTIONS.map((t) => (
                 <button
                   key={t}
                   onClick={() => setTimePerWord(t)}
                   className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                     timePerWord === t
                       ? 'bg-orange-500 text-white shadow-md'
                       : 'bg-white/5 text-slate-400 hover:bg-white/10'
                   }`}
                >
                  {t} 秒
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? '加载中...' : '🚀 开始挑战'}
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
               第 <span className="font-bold text-orange-400">{currentIndex + 1}</span> / {questions.length} 词
             </div>
             <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
               timeLeft <= 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
             }`}>
               <Clock size={14} />
               {timeLeft}s
             </div>
             <div className="text-sm font-bold text-orange-400">
               {score} 分
             </div>
           </div>

          {/* 连击 */}
          {combo > 1 && (
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold animate-pulse">
                <Zap size={14} fill="currentColor" />
                {combo} 连击！
              </span>
            </div>
          )}

           {/* 单词题目 */}
           <div className={`py-6 rounded-2xl mb-4 text-center transition-all ${
             feedback === 'correct' ? 'bg-green-500/20' : feedback === 'wrong' ? 'bg-red-500/20' : 'bg-orange-500/10'
           }`}>
             <div className="text-xl font-bold text-white mb-2">
               {currentItem?.meaning}
             </div>
            {currentItem?.phonetic && (
              <button
                onClick={playWord}
                className="inline-flex items-center gap-1 text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
              >
                <Volume2 size={14} />
                {currentItem.phonetic}
              </button>
            )}

            {/* 答题显示 */}
            <div className="mt-4">
              <UnderlineInput
                value={userAnswer}
                feedback={feedback ?? 'none'}
                correctAnswer={currentItem?.word ?? ''}
                size="lg"
                placeholder="输入单词..."
              />
            </div>

             {showHint && !feedback && currentItem && (
               <div className="text-sm text-slate-400 mt-2">
                💡 首字母：{currentItem.word[0]?.toUpperCase()}（共 {currentItem.word.length} 个字母）
              </div>
            )}
          </div>

          {/* 提示按钮 */}
          {!feedback && !showHint && (
            <button
              onClick={() => {
                setShowHint(true);
                setScore((s) => Math.max(0, s - 3));
              }}
               className="w-full mb-3 py-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
            >
              💡 使用首字母提示（-3分）
            </button>
          )}

           {/* 指法引导开关 */}
           <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl mb-3">
             <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-base">🖐️</span>
              <span>指法引导</span>
            </div>
            <Switch
              checked={showFingerGuide}
              onCheckedChange={setShowFingerGuide}
            />
          </div>

          {/* 虚拟键盘 */}
          <div className="flex justify-center overflow-x-auto">
            <VirtualKeyboard
              layout="qwerty"
              theme="neon"
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={submitAnswer}
              targetWord={currentItem?.word?.toLowerCase() || ''}
              showFingerGuide={showFingerGuide}
              fingerSpeed="normal"
              disabled={feedback !== null}
              spaceLeftActions={[
                { id: 'reset', label: '重置', onClick: () => setUserAnswer(''), variant: 'default' as const },
              ]}
              spaceRightActions={[
                { id: 'submit', label: '提交', onClick: submitAnswer, variant: 'success' as const },
              ]}
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

       <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg text-center">
        <div className="text-6xl mb-3">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}
        </div>
        <h2 className="text-2xl font-bold mb-1">
          {accuracy >= 80 ? '单词达人！' : accuracy >= 60 ? '表现不错！' : '继续加油！'}
        </h2>
        <p className="text-sm opacity-90">单词PK挑战完成</p>
        <div className="text-6xl font-bold mt-4">{score}</div>
        <div className="text-sm opacity-90">最终得分</div>
      </div>

       <div className="glass-card p-5">
         <div className="grid grid-cols-2 gap-4 mb-5">
           <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-green-400">{correctCount}</div>
             <div className="text-xs text-slate-400 mt-1">答对词数</div>
           </div>
           <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-orange-400">{accuracy}%</div>
             <div className="text-xs text-slate-400 mt-1">正确率</div>
           </div>
           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
             <div className="text-3xl font-bold text-yellow-400">{maxCombo}</div>
             <div className="text-xs text-slate-400 mt-1">最高连击</div>
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
             <span className="text-sm text-slate-300">词汇掌握度</span>
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
            className="py-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordPKGame;
