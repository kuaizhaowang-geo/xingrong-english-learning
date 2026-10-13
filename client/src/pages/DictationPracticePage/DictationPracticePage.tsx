import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Eye,
  RotateCcw,
} from 'lucide-react';
import SpeechButton from '@client/src/components/ui/speech-button';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { useSpeech } from '@client/src/hooks/use-speech';
import { useAutoSpeakSetting } from '@client/src/hooks/use-auto-speak-setting';
import { practiceApi, textbooksApi } from '@client/src/api';
import type {
  DictationItem,
  TextbookTreeItem,
  TextbookUnit,
} from '@shared/api.interface';
import { getWordIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';

type FeedbackState = 'none' | 'correct' | 'wrong';

const STORAGE_KEY = 'keyboard_sound_settings';

function readAutoSpeak(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { autoPronounceEnabled?: boolean };
      return s.autoPronounceEnabled !== false;
    }
  } catch {
    /* ignore */
  }
  return true;
}

function writeAutoSpeak(enabled: boolean): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const s = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    s.autoPronounceEnabled = enabled;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const DictationPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonId = searchParams.get('lessonId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;

  const [textbooks, setTextbooks] = useState<TextbookTreeItem[]>([]);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string | undefined>(
    searchParams.get('textbookId') || undefined,
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(
    searchParams.get('unitId') || undefined,
  );
  const [textbooksLoading, setTextbooksLoading] = useState(true);

  const [items, setItems] = useState<DictationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('none');
  const [showAnswer, setShowAnswer] = useState(false);

  const { speak, speaking } = useSpeech();
  const { enabled: autoSpeakEnabled, refresh: refreshAutoSpeak } = useAutoSpeakSetting();

  const currentItem = items[currentIndex];

  // 自动发音：新题目出现时自动朗读英文
  useEffect(() => {
    if (loading || !currentItem || !autoSpeakEnabled) return;
    const timer = window.setTimeout(() => {
      speak(currentItem.sentence, { lang: 'en-US' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [currentIndex, loading, autoSpeakEnabled, currentItem, speak]);

  const selectedTextbook = useMemo(
    () => textbooks.find((t) => t.id === selectedTextbookId),
    [textbooks, selectedTextbookId],
  );

  // 加载教材树并设置默认值（PEP 三年级上册 第一单元）
  useEffect(() => {
    const loadTextbooks = async () => {
      setTextbooksLoading(true);
      try {
        const data = await textbooksApi.getTextbookTree('english');
        setTextbooks(data);

        const urlTextbookId = searchParams.get('textbookId');
        const urlUnitId = searchParams.get('unitId');

        if (urlTextbookId) {
          setSelectedTextbookId(urlTextbookId);
          const tb = data.find((t) => t.id === urlTextbookId);
          if (tb?.units?.length && urlUnitId) {
            const unitExists = tb.units.some((u) => u.id === urlUnitId);
            if (unitExists) {
              setSelectedUnitId(urlUnitId);
            } else {
              setSelectedUnitId(tb.units[0].id);
            }
          } else if (tb?.units?.length) {
            setSelectedUnitId(tb.units[0].id);
          }
        } else if (data.length > 0) {
          const defaultTb = data.find(
            (tb) =>
              tb.publisher.includes('人教') &&
              tb.grade.includes('三年级') &&
              tb.semester.includes('上册'),
          ) || data[0];
          setSelectedTextbookId(defaultTb.id);
          const defaultUnit = defaultTb.units?.[0];
          if (defaultUnit) {
            setSelectedUnitId(defaultUnit.id);
          }
        }
      } catch (err) {
        logger.error('加载教材列表失败', err as Error);
      } finally {
        setTextbooksLoading(false);
      }
    };
    loadTextbooks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (textbooksLoading) return;
    loadItems();
    setCurrentIndex(0);
    setScore(0);
    setShowAnswer(false);
  }, [lessonId, courseId, selectedTextbookId, selectedUnitId, textbooksLoading]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await practiceApi.getDictationItems({
        lessonId,
        courseId,
        textbookId: selectedTextbookId,
        unitId: selectedUnitId,
        limit: 20,
      });
      setItems(data);
    } catch (err) {
      logger.error('加载听写练习失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUserAnswer('');
    setFeedback('none');
    setShowAnswer(false);
  }, [currentIndex]);

  // 切换题目时，如果是最后一题已答对，则不重置（用于完成页判断）
  const handleInputChange = (val: string) => {
    if (feedback === 'wrong') {
      setFeedback('none');
    }
    setUserAnswer(val);
  };

  // 答对后自动朗读并跳到下一题
  useEffect(() => {
    if (feedback !== 'correct' || !currentItem) return;
    const run = async () => {
      if (autoSpeakEnabled) {
        speak(currentItem.sentence, { lang: 'en-US' });
        await new Promise<void>((resolve) => {
          const check = () => {
            if (!speaking) {
              resolve();
            } else {
              window.setTimeout(check, 100);
            }
          };
          window.setTimeout(check, 300);
        });
      } else {
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 800);
        });
      }
      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    };
    run();
  }, [feedback, currentIndex, items.length, currentItem, autoSpeakEnabled, speak, speaking]);

  const handleSubmit = useCallback(async () => {
    if (!currentItem || feedback === 'correct') return;
    if (!userAnswer.trim()) return;

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentItem.sentence.trim().toLowerCase();
    const isCorrect = normalizedAnswer === normalizedCorrect;

    if (isCorrect) {
      setFeedback('correct');
      setScore((prev) => prev + 10);
      try {
        await practiceApi.submitDictationResult({
          dictationId: currentItem.id,
          userAnswer: userAnswer.trim(),
          isCorrect: true,
          lessonId,
          courseId,
        });
      } catch (err) {
        logger.error('提交听写结果失败', err as Error);
      }
    } else {
      setFeedback('wrong');
    }
  }, [currentItem, feedback, userAnswer, lessonId, courseId]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePlaySound = () => {
    if (currentItem) {
      speak(currentItem.sentence, { lang: 'en-US' });
    }
  };

  const handleToggleShowAnswer = () => {
    setShowAnswer((v) => !v);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    loadItems();
  };

  const handleTextbookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedTextbookId(value);
    setSelectedUnitId(undefined);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('textbookId', value);
    } else {
      params.delete('textbookId');
    }
    params.delete('unitId');
    setSearchParams(params);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedUnitId(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('unitId', value);
    } else {
      params.delete('unitId');
    }
    setSearchParams(params);
  };

  const handleToggleAutoSpeak = () => {
    const next = !autoSpeakEnabled;
    writeAutoSpeak(next);
    refreshAutoSpeak();
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || !currentItem) return;
      const target = e.target as HTMLElement;
      // 如果焦点在输入类元素，不拦截（除非是空格提交）
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Shift + 左右箭头切换题目
      if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') handlePrev();
        else handleNext();
        return;
      }

      // A 键播放发音
      if (!isEditable && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        handlePlaySound();
        return;
      }

      // 空格提交答案
      if (e.key === ' ' && !isEditable) {
        e.preventDefault();
        handleSubmit();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, currentItem, handleSubmit]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFinished = useMemo(
    () =>
      !loading &&
      items.length > 0 &&
      currentIndex >= items.length - 1 &&
      feedback === 'correct',
    [loading, items, currentIndex, feedback],
  );

  // —— 加载中 ——
  if (loading && !textbooksLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="text-orange-500 animate-spin" size={40} />
        <p className="text-slate-400">加载练习中...</p>
      </div>
    );
  }

  // —— 无题目 ——
  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        {/* 筛选栏 */}
        <div className="glass-card p-4 flex flex-wrap gap-3 items-center mb-6">
          <span className="text-sm font-medium text-slate-300">教材：</span>
          <select
            value={selectedTextbookId || ''}
            onChange={handleTextbookChange}
            disabled={textbooksLoading}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/50"
          >
            <option value="">请选择教材</option>
            {textbooks.map((tb) => (
              <option key={tb.id} value={tb.id}>
                {tb.title}
              </option>
            ))}
          </select>
          {selectedTextbook && selectedTextbook.units && selectedTextbook.units.length > 0 && (
<select
            value={selectedUnitId || ''}
            onChange={handleUnitChange}
            className="px-4 py-2 rounded-full bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/50"
          >
            <option value="">全部单元</option>
              {selectedTextbook.units.map((unit: TextbookUnit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="glass-card py-20 flex flex-col items-center gap-4">
          <Loader2 className="text-slate-600" size={64} />
          <h3 className="text-lg font-medium text-slate-300">暂无听写题目</h3>
          <p className="text-sm text-slate-500">该筛选条件下的听写练习正在准备中</p>
        </div>
      </div>
    );
  }

  // —— 完成页 ——
  if (isFinished && currentIndex === items.length - 1 && feedback === 'correct') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center mb-6">
            <Trophy className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">听写完成！</h2>
          <p className="text-slate-400 mb-6">恭喜你完成本轮听写练习</p>
          <div className="inline-block px-8 py-4 bg-green-500/20 border border-green-500/30 rounded-2xl mb-8">
            <div className="text-sm text-green-300 mb-1">本轮得分</div>
            <div className="text-4xl font-bold text-green-400">{score}</div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              <RotateCcw size={18} />
              再来一次
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  // —— 主练习页：全屏练习模式（霓虹深色）——
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#EEF2FF] to-[#EEF2FF] flex flex-col overflow-hidden text-slate-800 z-50">
      {/* 顶部栏：返回 + 进度 + 分数 + 发音开关 */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-[rgba(124_58_237_0.2)] bg-[#EEF2FF]/95 backdrop-blur-sm shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-11 h-11 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-indigo-50 transition-colors touch-manipulation active:scale-95"
          aria-label="返回"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{currentIndex + 1}</span>/{items.length}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(124_58_237_0.15)] border border-[rgba(124_58_237_0.3)]">
            <Trophy className="text-[#FBBF24]" size={16} />
            <span className="text-sm font-semibold text-slate-800">{score}</span>
          </div>
          <button
            onClick={handleToggleAutoSpeak}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[rgba(124_58_237_0.15)] transition-colors touch-manipulation active:scale-95"
            title={autoSpeakEnabled ? '关闭自动发音' : '开启自动发音'}
            aria-label="自动发音开关"
          >
            {autoSpeakEnabled ? (
              <Volume2 className="text-[#2563EB]" size={20} />
            ) : (
              <VolumeX className="text-[#475569]" size={20} />
            )}
          </button>
        </div>
      </div>

      {/* 可滚动内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* 教材 / 单元筛选（仅桌面端显示，手机端收起到设置） */}
          <div className="hidden md:flex flex-wrap gap-3 items-center bg-[#FFFFFF] rounded-xl p-4 border border-[rgba(124_58_237_0.2)]">
            <span className="text-sm font-medium text-slate-500">教材：</span>
            <select
              value={selectedTextbookId || ''}
              onChange={handleTextbookChange}
              disabled={textbooksLoading}
              className="px-4 py-2 rounded-full bg-[#F8FAFC] border border-indigo-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
            >
              <option value="">请选择教材</option>
              {textbooks.map((tb) => (
                <option key={tb.id} value={tb.id}>
                  {tb.title}
                </option>
              ))}
            </select>
            {selectedTextbook && selectedTextbook.units && selectedTextbook.units.length > 0 && (
              <>
                <span className="text-sm font-medium text-slate-500 ml-2">单元：</span>
                <select
                  value={selectedUnitId || ''}
                  onChange={handleUnitChange}
                  className="px-4 py-2 rounded-full bg-[#F8FAFC] border border-indigo-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/50"
                >
                  <option value="">全部单元</option>
                  {selectedTextbook.units.map((unit: TextbookUnit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* 情境插图 + 发音按钮 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-xl bg-gradient-to-br from-[#2563EB]/30 via-[#06B6D4]/30 to-[#6366F1]/30 border-2 border-[rgba(124_58_237_0.4)]">
                <Image
                  src={
                    currentItem
                      ? getWordIllustration(currentItem.sentence.split(' ')[0] || '')
                      : ''
                  }
                  alt="dictation illustration"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              {currentItem && (
                <button
                  onClick={handlePlaySound}
                  className="absolute -bottom-1 -right-1 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#6366F1] to-[#2563EB] text-white shadow-lg shadow-[#6366F1]/40 touch-manipulation active:scale-95 transition-transform"
                  aria-label="播放发音"
                >
                  <Volume2 size={22} />
                </button>
              )}
            </div>
          </div>

          {/* 中文提示 */}
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">请听发音，写出英文</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed">
              {currentItem?.translation}
            </h2>
          </div>

          {/* 答题显示区（横线书写式） */}
          <div className="px-2 sm:px-4">
            <UnderlineInput
              value={userAnswer}
              target={currentItem?.sentence || ''}
              feedback={feedback}
              correctAnswer={currentItem?.sentence || ''}
              size="lg"
              realtimeValidate={false}
              showCursor={feedback !== 'correct'}
            />
          </div>

          {/* 反馈 */}
          {feedback === 'correct' && (
            <div className="flex items-center justify-center gap-2 text-[#06B6D4]">
              <span className="font-bold text-base sm:text-lg">✓ 回答正确！+10 分</span>
            </div>
          )}
          {feedback === 'wrong' && (
            <div className="text-center">
              <p className="text-[#EF476F] font-medium mb-1">回答错误，继续加油！</p>
              <p className="text-base sm:text-lg font-semibold text-[#06B6D4]">
                正确答案：{currentItem?.sentence}
              </p>
            </div>
          )}

          {/* 显示答案（手动触发） */}
          {showAnswer && feedback !== 'correct' && currentItem && feedback === 'none' && (
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-[#6366F1]">{currentItem.sentence}</p>
            </div>
          )}

          {/* 底部快捷按钮（手机端显示，桌面端在键盘侧边） */}
          <div className="flex items-center justify-center gap-2 md:hidden mt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center justify-center w-12 h-12 rounded-xl text-slate-500 bg-[#F8FAFC] border border-indigo-200 disabled:opacity-40 touch-manipulation active:scale-95 transition-all"
              aria-label="上一题"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={handleToggleShowAnswer}
              className="flex items-center justify-center h-12 px-4 rounded-xl text-[#FBBF24] bg-[#F8FAFC] border border-[rgba(251_191_36_0.3)] touch-manipulation active:scale-95 transition-all text-sm font-medium"
            >
              <Eye size={18} className="mr-1" />
              {showAnswer ? '隐藏' : '答案'}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= items.length - 1}
              className="flex items-center justify-center w-12 h-12 rounded-xl text-slate-500 bg-[#F8FAFC] border border-indigo-200 disabled:opacity-40 touch-manipulation active:scale-95 transition-all"
              aria-label="下一题"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 底部虚拟键盘区 */}
      <div className="shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <VirtualKeyboard
          layout="qwerty"
          value={userAnswer}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          targetWord={currentItem?.sentence?.toLowerCase() || ''}
          spaceSubmit={true}
          targetText={currentItem?.sentence || ''}
          disabled={feedback === 'correct'}
          fullWidth={true}
          theme="neon"
          spaceLeftActions={[
            {
              id: 'prev',
              label: '上一题',
              onClick: handlePrev,
              variant: 'default',
              icon: <SkipBack size={14} />,
            },
          ]}
          spaceRightActions={[
            {
              id: 'hint',
              label: showAnswer ? '已显示' : '提示',
              onClick: handleToggleShowAnswer,
              variant: 'accent',
              icon: <Eye size={14} />,
              disabled: showAnswer,
            },
            {
              id: 'submit',
              label: '提交',
              onClick: handleSubmit,
              variant: 'success',
            },
            {
              id: 'next',
              label: '下一题',
              onClick: handleNext,
              variant: 'accent',
              icon: <SkipForward size={14} />,
            },
          ]}
          spaceLabel="提交 / 空格"
          className=""
        />
      </div>
    </div>
  );
};

export default DictationPracticePage;
