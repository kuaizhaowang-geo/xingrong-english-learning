import React, { useState, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
  RotateCcw,
  Lightbulb,
  Volume2,
  Clock,
  Home,
  Target,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Image } from '@client/src/components/ui/image';
import { useSpeech } from '@client/src/hooks/use-speech';
import type { WordItem } from '@shared/api.interface';

type ReciteModeType = 'recite' | 'review';

interface ReciteModeProps {
  words: WordItem[];
  startIndex?: number;
  mode?: ReciteModeType;
  onClose: () => void;
  onRecordUpdate?: (wordId: string, isCorrect: boolean) => void;
  onRestartReview?: () => void;
}

const ReciteMode: React.FC<ReciteModeProps> = ({
  words,
  startIndex = 0,
  mode = 'recite',
  onClose,
  onRecordUpdate,
  onRestartReview,
}) => {
  const isReview = mode === 'review';
  const titleText = isReview ? '复习模式' : '背诵进度';
  const completeText = isReview ? '复习完成！' : '背诵完成！';
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [hintLevel, setHintLevel] = useState(0); // 0=无, 1=首字母, 2=长度, 3=完整单词
  const { speak } = useSpeech();

  const current: WordItem | undefined = words[currentIndex];

  const answered = knownCount + unknownCount;
  const accuracyRate: number = answered > 0
    ? Math.round((knownCount / answered) * 100)
    : 0;
  const remainingCount = Math.max(words.length - answered, 0);
  const estimatedMinutes: number = Math.max(1, Math.ceil((remainingCount * 30) / 60));

  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setHintLevel(0);
    }
  };

  const handleNext = (): void => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setHintLevel(0);
    }
  };

  const handleKnown = (): void => {
    setKnownCount(knownCount + 1);
    if (isReview && onRecordUpdate && current) {
      try { onRecordUpdate(current.id, true); }
      catch (err) { logger.error('更新单词记录失败', err as Error); }
    }
    handleNext();
  };

  const handleUnknown = (): void => {
    setUnknownCount(unknownCount + 1);
    if (isReview && onRecordUpdate && current) {
      try { onRecordUpdate(current.id, false); }
      catch (err) { logger.error('更新单词记录失败', err as Error); }
    }
    handleNext();
  };

  const handleFlip = (): void => { setIsFlipped(!isFlipped); };
  const handleShowAnswer = (): void => { setIsFlipped(true); };
  const handleHint = (): void => { if (hintLevel < 3) setHintLevel(hintLevel + 1); };

  const handleSpeak = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    if (current) speak(current.word);
  }, [current, speak]);

  const handleRestart = (): void => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setHintLevel(0);
  };

  const getHintText = (): string => {
    if (!current || hintLevel === 0) return '';
    const w: string = current.word;
    const masked: string = w.charAt(0) + '_'.repeat(Math.max(w.length - 1, 0));
    if (hintLevel === 1) return masked;
    if (hintLevel === 2) return `${masked}  ·  ${w.length}个字母`;
    return w; // hintLevel === 3
  };

  if (!current) return null;
  const isFinished: boolean = currentIndex >= words.length - 1 && knownCount + unknownCount > 0;
  const hintText: string = getHintText();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF2FF]">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/70 text-slate-400
            hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
          <div className="flex-1 mx-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 font-medium">{titleText}</span>
            </div>
            {isReview && answered > 0 && (
              <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Target size={11} className="text-cyan-400" />
                  正确率 <span className="text-cyan-400 font-medium">{accuracyRate}%</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-violet-400" />
                  预计还需 <span className="text-violet-300 font-medium">{estimatedMinutes} 分钟</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-cyan-400">✓ {knownCount}</span>
            <span className="text-rose-400">✗ {unknownCount}</span>
          </div>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 flex items-center justify-center p-6">
        {isFinished && knownCount + unknownCount >= words.length ? (
          <div className="text-center max-w-md mx-auto w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full
              bg-gradient-to-br from-violet-500/30 to-cyan-500/30
              border-2 border-violet-500/50 flex items-center justify-center">
              <Check size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{completeText}</h2>
            <p className="text-slate-400 mb-6">
              共复习 <span className="text-white font-medium">{words.length}</span> 个单词
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <div className="text-2xl font-bold text-cyan-400">{knownCount}</div>
                <div className="text-xs text-cyan-300/70 mt-1">认识</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="text-2xl font-bold text-rose-400">{unknownCount}</div>
                <div className="text-xs text-rose-300/70 mt-1">不认识</div>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <div className="text-2xl font-bold text-violet-400">{accuracyRate}%</div>
                <div className="text-xs text-violet-300/70 mt-1">正确率</div>
              </div>
            </div>

            {isReview && (
              <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-violet-500/20 text-left">
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300">
                      根据艾宾浩斯遗忘曲线
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      下次复习建议安排在 1-2 天后，巩固记忆效果更佳
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`flex gap-3 ${isReview ? '' : 'justify-center'}`}>
              <button
                onClick={handleRestart}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  text-white font-medium shadow-lg shadow-violet-500/30
                  transition-all duration-300 ${isReview ? 'flex-1' : ''}`}
              >
                <RotateCcw size={18} />
                {isReview ? '再复习一轮' : '再来一遍'}
              </button>
              {isReview && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                    bg-slate-800/70 border border-slate-600/50 text-slate-300
                    hover:border-violet-500/50 hover:text-white
                    transition-all duration-300 flex-1"
                >
                  <Home size={18} />
                  返回单词库
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="relative w-full max-w-md cursor-pointer group"
            style={{ perspective: '1000px' }}
            onClick={handleFlip}
          >
            <div
              className="relative w-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* 正面 - 中文释义 + 配图 */}
              <div
                className="w-full min-h-[420px] p-8 rounded-3xl
                  bg-slate-800/60 backdrop-blur-sm
                  border border-violet-500/30
                  shadow-2xl shadow-violet-500/20
                  flex flex-col items-center justify-between relative"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-40 h-40 rounded-full bg-violet-600/20 blur-3xl" />

                <div className="relative text-center w-full flex-1 flex flex-col items-center justify-center">
                  <p className="text-xs text-violet-400 mb-4 uppercase tracking-wider">
                    请回忆这个单词
                  </p>
                  {current.imageUrl && (
                    <div className="mb-5 flex-shrink-0">
                      <Image
                        src={current.imageUrl}
                        alt={current.word}
                        width={120}
                        height={120}
                        className="w-[120px] h-[120px] rounded-2xl object-cover
                          border border-violet-500/30 shadow-lg shadow-violet-500/20"
                      />
                    </div>
                  )}
                  <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                    {current.meaning}
                  </h2>
                  {current.partOfSpeech && (
                    <span className="text-xs px-3 py-1 rounded-full
                      bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-4 inline-block">
                      {current.partOfSpeech}
                    </span>
                  )}
                  {hintLevel > 0 && (
                    <div className="mt-2 mb-3">
                      <p className={`text-lg font-mono tracking-wider ${
                        hintLevel >= 3 ? 'text-slate-500' : 'text-amber-400'
                      }`}>
                        {hintText}
                      </p>
                      {hintLevel >= 3 && (
                        <p className="text-xs text-slate-500 mt-1">已直接显示答案</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 底部提示 + 翻页提示 */}
                <div className="relative w-full">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleHint(); }}
                      disabled={hintLevel >= 3}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-amber-500/10 border border-amber-500/30 text-amber-400
                        hover:bg-amber-500/20
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-all text-xs"
                    >
                      <Lightbulb size={14} />
                      提示
                    </button>
                    <span className="text-xs text-slate-500">已用 {hintLevel} / 3 次提示</span>
                  </div>
                  {hintLevel > 0 && (
                    <p className="text-[11px] text-amber-500/60 text-center mb-2">
                      使用提示会降低记忆效果
                    </p>
                  )}
                  <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <RotateCcw size={12} />
                    点击卡片查看答案
                  </div>
                </div>
              </div>

              {/* 背面 - 英文单词 + 音标 + 发音 + 例句 */}
              <div
                className="absolute inset-0 w-full min-h-[420px] p-8 rounded-3xl
                  bg-slate-800/60 backdrop-blur-sm
                  border border-cyan-500/30
                  shadow-2xl shadow-cyan-500/20
                  flex flex-col items-center justify-center relative"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                  w-40 h-40 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="relative text-center w-full">
                  <p className="text-xs text-cyan-400 mb-3 uppercase tracking-wider">答案</p>
                  <h2 className="text-4xl font-bold mb-3
                    bg-clip-text text-transparent
                    bg-gradient-to-r from-violet-400 via-cyan-300 to-cyan-400">
                    {current.word}
                  </h2>
                  <div className="flex items-center justify-center gap-3 mb-5">
                    <p className="text-sm text-slate-400">{current.phonetic || '/—/'}</p>
                    <button
                      onClick={handleSpeak}
                      className="p-1.5 rounded-full
                        bg-cyan-500/20 border border-cyan-500/40 text-cyan-400
                        hover:bg-cyan-500/30 transition-all"
                      aria-label="发音"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                  {current.partOfSpeech && (
                    <span className="text-xs px-3 py-1 rounded-full
                      bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-4 inline-block">
                      {current.partOfSpeech}
                    </span>
                  )}
                  {current.exampleSentence && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-sm text-slate-200 mb-1">{current.exampleSentence}</p>
                      {current.exampleTranslation && (
                        <p className="text-xs text-slate-500">{current.exampleTranslation}</p>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-6">
                    <RotateCcw size={12} />
                    点击卡片返回
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      {!(isFinished && knownCount + unknownCount >= words.length) && (
        <div className="flex items-center justify-center gap-3 px-6 py-5 border-t border-purple-900/30">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-full bg-slate-800/70 text-slate-400
              hover:text-white hover:bg-slate-700
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="上一个"
          >
            <ChevronLeft size={24} />
          </button>

          {!isFlipped ? (
            <button
              onClick={handleShowAnswer}
              className="flex items-center gap-2 px-10 py-3.5 rounded-xl
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                text-white font-medium shadow-lg shadow-violet-500/30
                transition-all duration-300 active:scale-95"
            >
              <span className="font-semibold">显示答案</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleUnknown}
                className="flex items-center gap-2 px-6 py-3 rounded-xl
                  bg-rose-500/20 border border-rose-500/40 text-rose-400
                  hover:bg-rose-500/30 transition-all duration-300 active:scale-95"
              >
                <XCircle size={20} />
                <span className="font-medium">不认识</span>
              </button>
              <button
                onClick={handleKnown}
                className="flex items-center gap-2 px-6 py-3 rounded-xl
                  bg-cyan-500/20 border border-cyan-500/40 text-cyan-400
                  hover:bg-cyan-500/30 transition-all duration-300 active:scale-95"
              >
                <Check size={20} />
                <span className="font-medium">认识</span>
              </button>
            </>
          )}

          <button
            onClick={handleNext}
            disabled={currentIndex >= words.length - 1}
            className="p-3 rounded-full bg-slate-800/70 text-slate-400
              hover:text-white hover:bg-slate-700
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="下一个"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReciteMode;
