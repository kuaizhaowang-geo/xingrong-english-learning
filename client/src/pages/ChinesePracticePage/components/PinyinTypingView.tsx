import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Trophy,
  Star,
} from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import * as chinesePracticeApi from '@client/src/api/chinese-practice';
import type { ChineseDictationItem } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { getChineseIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';

interface PinyinTypingViewProps {
  textbookId: string;
}

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];
const FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'];
const TONES = ['ˉ', 'ˊ', 'ˇ', 'ˋ'];

const PRACTICE_COUNT = 15;
const MAX_WRONG_ATTEMPTS = 3;

// 去除拼音声调符号
function stripTone(pinyin: string): string {
  const toneMap: Record<string, string> = {
    ā: 'a', á: 'a', ǎ: 'a', à: 'a',
    ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
    ē: 'e', é: 'e', ě: 'e', è: 'e',
    ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
    ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
    ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
  };
  let result = '';
  for (const ch of pinyin) {
    result += toneMap[ch] ?? ch;
  }
  return result.toLowerCase();
}

const PinyinTypingView: React.FC<PinyinTypingViewProps> = ({ textbookId }) => {
  const { speak } = useSpeech();
  const [mode, setMode] = useState<'free' | 'challenge'>('free');
  const [items, setItems] = useState<ChineseDictationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [input, setInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(true);

  const loadCharacters = useCallback(async (): Promise<void> => {
    if (!textbookId) return;
    setLoading(true);
    try {
      const data = await chinesePracticeApi.getChineseDictation({
        count: PRACTICE_COUNT,
        textbookId,
      });
      setItems(data);
      setCurrentIndex(0);
      setScore(0);
      setStreak(0);
      setInput('');
      setFeedback('none');
      setWrongAttempts(0);
      setFinished(false);
    } catch (err) {
      logger.error('加载拼音打字题目失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [textbookId]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters, mode]);

  const currentItem = items[currentIndex];

  // 物理键盘空格键提交
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code !== 'Space') return;
      if (finished || loading) return;
      if (feedback === 'correct') return;
      if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) {
        e.preventDefault();
        handleNext();
        return;
      }
      if (!input.trim()) return;
      e.preventDefault();
      handleSubmit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, feedback, wrongAttempts, finished, loading, currentItem]);

  const handleInputChange = (val: string): void => {
    if (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setFeedback('none');
    }
    setInput(val);
  };

  const handleKeyPress = (key: string): void => {
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    handleInputChange(input + key);
  };

  const handleBackspace = (): void => {
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    handleInputChange(input.slice(0, -1));
  };

  const handleClear = (): void => {
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    handleInputChange('');
  };

  const handleSubmit = (): void => {
    if (!currentItem) return;
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    if (!input.trim()) return;

    const userAnswer = input.trim().toLowerCase();
    const correctAnswer = stripTone(currentItem.pinyin);
    const correct = userAnswer === correctAnswer;

    if (correct) {
      setFeedback('correct');
      if (wrongAttempts === 0) {
        setScore((prev) => prev + 1);
        setStreak((prev) => prev + 1);
      }
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setFeedback('wrong');
      setStreak(0);
    }
  };

  const handleNext = (): void => {
    if (mode === 'challenge') {
      if (currentIndex >= items.length - 1) {
        setFinished(true);
        return;
      }
    }
    setCurrentIndex((prev) => prev + 1);
    setInput('');
    setFeedback('none');
    setWrongAttempts(0);
  };

  // 正确后自动下一题；达到最大错误次数后自动下一题
  useEffect(() => {
    if (feedback === 'correct') {
      const timer = window.setTimeout(() => {
        handleNext();
      }, 1200);
      return () => window.clearTimeout(timer);
    }
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      const timer = window.setTimeout(() => {
        handleNext();
      }, 2500);
      return () => window.clearTimeout(timer);
    }
  }, [feedback, wrongAttempts, currentIndex, items.length, mode]);

  const handlePlay = (): void => {
    if (!currentItem) return;
    speak(currentItem.character, { lang: 'zh-CN', rate: 0.75 });
  };

  const handleRestart = (): void => {
    loadCharacters();
  };

  // 自由模式下循环
  useEffect(() => {
    if (mode === 'free' && items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, items.length, mode]);

  const correctPinyin = currentItem ? stripTone(currentItem.pinyin) : '';
  const showAnswer = feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / items.length) * 100);
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-6">
        <Trophy size={64} className="mx-auto text-yellow-400" />
        <div className="text-xl font-bold text-white">闯关完成！</div>
        <div className="text-5xl font-bold">
          <span className={percentage >= 80 ? 'text-green-400' : percentage >= 60 ? 'text-orange-400' : 'text-red-400'}>
            {score}
          </span>
          <span className="text-xl text-slate-500"> / {items.length}</span>
        </div>
        <div className="text-slate-400">正确率 {percentage}%</div>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
        >
          再来一次
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-[320px]">
      {/* 模式切换 + 得分 */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('free')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'free'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            自由练习
          </button>
          <button
            onClick={() => setMode('challenge')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'challenge'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            闯关模式
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-400">
            <Star size={16} />
            <span className="font-bold">{score}</span>
            <span className="text-slate-400">分</span>
          </div>
          {streak >= 3 && (
            <div className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
              连对 {streak} 题 🔥
            </div>
          )}
        </div>
      </div>

      {/* 主内容卡 */}
      {currentItem && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          {/* 情境插图 + 汉字 */}
          <div className="p-6 flex items-center gap-6 bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border-b border-white/5">
            {/* 情境插图 */}
            <div className="w-[120px] h-[120px] shrink-0 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500">
              <Image
                src={getChineseIllustration(currentItem.character || '')}
                alt={currentItem.character}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {/* 字 / 拼音 / 释义 */}
            <div className="flex-1 min-w-0">
              <div
                onClick={handlePlay}
                className="cursor-pointer hover:scale-105 transition-transform inline-block"
              >
                <div className="text-5xl font-bold text-white">
                  {currentItem.character}
                </div>
              </div>
              <div className="text-2xl text-orange-500 font-medium mt-1">
                {currentItem.pinyin}
              </div>
              <div className="text-base text-slate-400 mt-2 flex items-center gap-2">
                <span>{currentItem.meaning}</span>
                <span
                  onClick={handlePlay}
                  className="text-xs text-orange-400 cursor-pointer hover:text-orange-600"
                >
                  🔊 点击发音
                </span>
              </div>
            </div>
          </div>

          {/* 作答反馈：正确 */}
          {feedback === 'correct' && (
            <div className="mx-6 mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={18} />
                <span className="font-bold text-sm">正确！真棒 🌟</span>
              </div>
              <div className="text-2xl font-bold text-orange-500 mt-2">
                {currentItem.pinyin}
              </div>
            </div>
          )}

          {/* 作答反馈：错误 - 仅保留次数提示 */}
          {feedback === 'wrong' && !showAnswer && (
            <div className="mx-6 mt-2 text-center">
              <span className="text-xs text-red-400">
                {wrongAttempts}/{MAX_WRONG_ATTEMPTS}
              </span>
            </div>
          )}

          {/* 作答反馈：达到最大错误次数 - 直接显示正确答案 */}
          {showAnswer && (
            <div className="mx-6 mt-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentItem.pinyin}
              </div>
            </div>
          )}

          {/* 快捷声母韵母按钮（折叠条） */}
          <div className="mx-6 mt-4">
            <button
              onClick={() => setShowShortcuts((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              {showShortcuts ? '收起快捷输入 ▲' : '展开声母/韵母快捷输入 ▼'}
            </button>
          </div>

          {showShortcuts && (
            <div className="mx-6 mt-2 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              {/* 声母 */}
              <div className="flex flex-wrap gap-1 justify-center">
                {INITIALS.map((s: string) => (
                  <button
                    key={`init-${s}`}
                    onClick={() => handleKeyPress(s)}
                    disabled={feedback === 'correct' || showAnswer}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/30 active:bg-orange-500/30 disabled:opacity-50 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* 韵母 */}
              <div className="flex flex-wrap gap-1 justify-center">
                {FINALS.map((f: string) => (
                  <button
                    key={`fin-${f}`}
                    onClick={() => handleKeyPress(f)}
                    disabled={feedback === 'correct' || showAnswer}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/30 active:bg-blue-500/30 disabled:opacity-50 transition-all"
                  >
                    {f}
                  </button>
                ))}
              </div>
              {/* 声调 */}
              <div className="flex flex-wrap gap-1 justify-center">
                {TONES.map((t: string, idx: number) => (
                  <button
                    key={`tone-${idx}`}
                    onClick={() => handleKeyPress(t)}
                    disabled={feedback === 'correct' || showAnswer}
                    className="w-9 h-8 rounded-lg bg-white/5 border border-white/10 text-base font-bold text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/30 disabled:opacity-50 transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 横线书写式答题区 */}
          <div className="px-6 py-6">
            <div className="text-sm text-slate-400 text-center mb-3">
              请输入拼音（不区分声调）
            </div>
            <UnderlineInput
              value={input}
              feedback={feedback}
              correctAnswer={showAnswer ? correctPinyin : ''}
              showCursor={feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS)}
              size="xl"
              align="center"
              placeholder="请输入拼音..."
            />
          </div>


        </div>
      )}

      {/* 底部全宽虚拟键盘 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <VirtualKeyboard
          layout="pinyin"
          value={input}
          onChange={handleInputChange}
          onSubmit={feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) ? handleSubmit : handleNext}
          onBackspace={handleBackspace}
          disabled={false}
          colorScheme="pinyin"
          targetWord={currentItem?.pinyin || ''}
          fullWidth={true}
          showNextGuide={!(feedback === 'correct' || showAnswer)}
          theme="neon"
          spaceSubmit={true}
          targetText={correctPinyin}
          toolbar={{
            reset: { onClick: handleClear },
            skip: { onClick: handleNext },
            submit: { onClick: feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) ? handleSubmit : handleNext },
          }}
          spaceLeftActions={[
            { id: 'reset', label: '重置', onClick: handleClear, variant: 'default' },
          ]}
          spaceRightActions={[
            { id: 'submit', label: '提交', onClick: feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) ? handleSubmit : handleNext, variant: 'success' },
          ]}
        />
      </div>
    </div>
  );
};

export default PinyinTypingView;
