import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, CheckCircle, RotateCcw } from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import * as chinesePracticeApi from '@client/src/api/chinese-practice';
import type { ChineseDictationItem } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { UnderlineInput } from '@client/src/components/underline-input';
import { getChineseIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';

interface CharacterDictationViewProps {
  textbookId: string;
}

const DICTATION_COUNT = 10;
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
    ń: 'n', ǹ: 'n',
    m̄: 'm',
  };
  let result = '';
  for (const ch of pinyin) {
    result += toneMap[ch] ?? ch;
  }
  return result.toLowerCase();
}

const CharacterDictationView: React.FC<CharacterDictationViewProps> = ({
  textbookId,
}) => {
  const { speak } = useSpeech();
  const [items, setItems] = useState<ChineseDictationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const loadDictation = useCallback(async (): Promise<void> => {
    if (!textbookId) return;
    setLoading(true);
    try {
      const data = await chinesePracticeApi.getChineseDictation({
        count: DICTATION_COUNT,
        textbookId,
      });
      setItems(data);
      setCurrentIndex(0);
      setScore(0);
      setUserInput('');
      setFeedback('none');
      setWrongAttempts(0);
      setFinished(false);
    } catch (err) {
      logger.error('加载听写题目失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [textbookId]);

  useEffect(() => {
    loadDictation();
  }, [loadDictation]);

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
      if (!userInput.trim()) return;
      e.preventDefault();
      handleSubmit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userInput, feedback, wrongAttempts, finished, loading, currentItem]);

  const handlePlay = (): void => {
    if (!currentItem) return;
    speak(currentItem.character, { lang: 'zh-CN', rate: 0.75 });
  };

  const handleInputChange = (val: string): void => {
    if (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) {
      setFeedback('none');
    }
    setUserInput(val);
  };

  const handleSubmit = (): void => {
    if (!currentItem) return;
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    if (!userInput.trim()) return;

    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswer = stripTone(currentItem.pinyin);
    const correct = userAnswer === correctAnswer;

    if (correct) {
      setFeedback('correct');
      if (wrongAttempts === 0) {
        setScore((prev) => prev + 1);
      }
    } else {
      const nextAttempts = wrongAttempts + 1;
      setWrongAttempts(nextAttempts);
      setFeedback('wrong');
    }
  };

  const handleNext = (): void => {
    if (currentIndex >= items.length - 1) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setUserInput('');
    setFeedback('none');
    setWrongAttempts(0);
  };

  // 正确后自动下一题；达到最大错误次数后自动下一题
  useEffect(() => {
    if (feedback === 'correct') {
      const timer = window.setTimeout(() => {
        handleNext();
      }, 600);
      return () => window.clearTimeout(timer);
    }
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      const timer = window.setTimeout(() => {
        handleNext();
      }, 2500);
      return () => window.clearTimeout(timer);
    }
  }, [feedback, wrongAttempts, currentIndex, items.length]);

  const handleBackspace = (): void => {
    if (feedback === 'correct') return;
    if (feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS) return;
    setUserInput((prev) => prev.slice(0, -1));
    if (feedback === 'wrong') {
      setFeedback('none');
    }
  };

  const handleRestart = (): void => {
    loadDictation();
  };

  const correctPinyin = currentItem ? stripTone(currentItem.pinyin) : '';
  const showAnswer = feedback === 'wrong' && wrongAttempts >= MAX_WRONG_ATTEMPTS;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        暂无听写题目
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / items.length) * 100);
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-6">
        <div className="text-lg font-medium text-slate-300">听写完成！</div>
        <div className="text-6xl font-bold">
          <span className={percentage >= 80 ? 'text-green-400' : percentage >= 60 ? 'text-orange-400' : 'text-red-400'}>
            {score}
          </span>
          <span className="text-2xl text-slate-500"> / {items.length}</span>
        </div>
        <div className="text-slate-400">
          正确率 {percentage}%
        </div>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
        >
          <RotateCcw size={16} />
          再来一次
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden pb-[320px]">
      {/* 进度条 */}
      <div className="bg-white/5 px-6 py-3 flex items-center justify-between border-b border-white/10">
        <div className="text-sm font-medium text-slate-300">
          第 <span className="text-orange-400 font-bold">{currentIndex + 1}</span> / {items.length} 题
        </div>
        <div className="text-sm font-medium text-slate-300">
          得分：<span className="text-green-400 font-bold">{score}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 播放区 + 情境插图 */}
        <div className="flex items-center gap-6">
          {/* 情境插图 */}
          <div className="w-[120px] h-[120px] shrink-0 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 relative">
            <Image
              src={currentItem ? getChineseIllustration(currentItem.character || '') : ''}
              alt="dictation illustration"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <button
              onClick={handlePlay}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all"
            >
              <Volume2 size={24} className="text-white" />
            </button>
          </div>
           <div className="flex-1">
             <div className="text-lg font-medium text-slate-200">
               听一听，写一写 ✏️
             </div>
             <p className="text-sm text-slate-400 mt-1">
               点击左边喇叭播放读音，用下面的键盘输入拼音
             </p>
             <button
               onClick={handlePlay}
               className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/15 text-orange-400 text-sm font-medium hover:bg-orange-500/25 border border-orange-500/20 transition-all"
             >
              <Volume2 size={14} />
              再听一遍
            </button>
          </div>
        </div>

        {/* 作答后：正确答案 + 田字格（最大错误次数后或答对时显示） */}
        {(feedback === 'correct' || showAnswer) && currentItem && (
          <div className="text-center space-y-3">
            {feedback === 'correct' ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-bold">回答正确！</span>
              </div>
            ) : null}
            {/* 田字格 */}
             <div className="inline-block relative w-20 h-20 border-2 border-white/20 bg-white/5">
               <div className="absolute top-0 bottom-0 left-1/2 w-px border-l border-dashed border-white/20" />
               <div className="absolute left-0 right-0 top-1/2 h-px border-t border-dashed border-white/20" />
               <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                 {currentItem.character}
               </span>
             </div>
            <div className="text-2xl font-bold text-orange-500">{currentItem.pinyin}</div>
             <div className="text-sm text-slate-400">{currentItem.meaning}</div>
          </div>
        )}

        {/* 错误次数提示 */}
        {feedback === 'wrong' && !showAnswer && (
          <div className="text-center">
            <span className="text-xs text-red-400">
              {wrongAttempts}/{MAX_WRONG_ATTEMPTS}
            </span>
          </div>
        )}

        {/* 横线书写式答题区 */}
        <div className="space-y-3">
           <div className="text-sm font-medium text-slate-300 text-center">
             请输入拼音（不区分声调）：
           </div>
          <UnderlineInput
            value={userInput}
            feedback={feedback}
            correctAnswer={showAnswer ? correctPinyin : ''}
            showCursor={feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS)}
            size="xl"
            align="center"
            placeholder="请输入拼音..."
          />
        </div>


      </div>

      {/* 底部全宽虚拟键盘 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <VirtualKeyboard
          layout="pinyin"
          value={userInput}
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
            reset: { onClick: () => { handleInputChange(''); } },
            skip: { onClick: handleNext },
            submit: { onClick: feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) ? handleSubmit : handleNext },
          }}
          spaceLeftActions={[
            { id: 'reset', label: '重置', onClick: () => { handleInputChange(''); }, variant: 'default' },
          ]}
          spaceRightActions={[
            { id: 'submit', label: '提交', onClick: feedback === 'none' || (feedback === 'wrong' && wrongAttempts < MAX_WRONG_ATTEMPTS) ? handleSubmit : handleNext, variant: 'success' },
          ]}
        />
      </div>
    </div>
  );
};

export default CharacterDictationView;
