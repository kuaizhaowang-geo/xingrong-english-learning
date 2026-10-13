import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  Mic,
  Check,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
  Keyboard,
} from 'lucide-react';
import type { WordItem } from '@shared/api.interface';
import SpeechButton from '@client/src/components/ui/speech-button';
import { Image } from '@client/src/components/ui/image';
import { Button } from '@client/src/components/ui/button';
import { UnderlineInput } from '@client/src/components/underline-input';
import { Badge } from '@client/src/components/ui/badge';
import { logger } from '@lark-apaas/client-toolkit/logger';
import VirtualKeyboard from '@client/src/components/ui/virtual-keyboard';

interface WordPracticeV2Props {
  words: WordItem[];
  mode: 'translation' | 'listening' | 'speaking';
  onComplete: (correctCount: number, total: number) => void;
  onMarkMastered?: (wordId: string) => void;
  onMarkUnfamiliar?: (wordId: string) => void;
}

type MarkState = 'mastered' | 'unfamiliar' | null;

const WordPracticeV2: React.FC<WordPracticeV2Props> = ({
  words,
  mode,
  onComplete,
  onMarkMastered,
  onMarkUnfamiliar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hideWord, setHideWord] = useState(true);
  const [showImage, setShowImage] = useState(true);
  const [markState, setMarkState] = useState<Record<string, MarkState>>({});
  const [speakingRecording, setSpeakingRecording] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [keyboardSlim, setKeyboardSlim] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord: WordItem | undefined = words[currentIndex];
  const targetWord: string = currentWord?.word || '';
  const targetLower: string = targetWord.toLowerCase();
  const currentMark: MarkState = currentWord ? markState[currentWord.id] ?? null : null;

  // Reset state when mode or words change
  useEffect(() => {
    setCurrentIndex(0);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setFinished(false);
    setMarkState({});
    setSpeakingRecording(false);
  }, [mode, words]);

  // Focus input on mount and when moving to next word
  useEffect(() => {
    if (mode !== 'speaking' && !showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult, mode]);

  const speakWord = useCallback((): void => {
    if (!currentWord) return;
    // Trigger speech via synthetic click on SpeechButton pattern
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
          utterance.lang = enVoice.lang;
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        /* ignore */
      }
    }
  }, [currentWord]);

  const handleSubmit = useCallback((): void => {
    if (mode === 'speaking') return;
    if (!input.trim() || showResult || !currentWord) return;

    const correct = input.trim().toLowerCase() === targetLower;
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
    logger.info(
      `WordPracticeV2 [${mode}]: ${targetWord} → ${correct ? 'correct' : 'wrong'}`,
    );
  }, [input, showResult, currentWord, targetLower, mode]);

  const handleNext = useCallback((): void => {
    if (!currentWord) return;

    if (currentIndex >= words.length - 1) {
      setFinished(true);
      onComplete(correctCount + (showResult && isCorrect ? 0 : 0), words.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
  }, [currentIndex, words.length, currentWord, correctCount, onComplete, showResult, isCorrect]);

  const handlePrev = useCallback((): void => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
  }, [currentIndex]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setInput('');
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setFinished(false);
    setMarkState({});
    setSpeakingRecording(false);
  }, []);

  const handleMarkMastered = useCallback((): void => {
    if (!currentWord) return;
    const wordId = currentWord.id;
    setMarkState((prev) => ({ ...prev, [wordId]: 'mastered' }));
    onMarkMastered?.(wordId);
  }, [currentWord, onMarkMastered]);

  const handleMarkUnfamiliar = useCallback((): void => {
    if (!currentWord) return;
    const wordId = currentWord.id;
    setMarkState((prev) => ({ ...prev, [wordId]: 'unfamiliar' }));
    onMarkUnfamiliar?.(wordId);
  }, [currentWord, onMarkUnfamiliar]);

  const handleVirtualKeyPress = useCallback(
    (key: string): void => {
      if (mode === 'speaking' || showResult || !currentWord) return;

      if (key === 'Backspace') {
        setInput((prev) => prev.slice(0, -1));
        return;
      }

      if (key === 'Enter' || key === ' ') {
        handleSubmit();
        return;
      }

      if (key.length === 1 && /[a-zA-Z]/.test(key)) {
        setInput((prev) => prev + key.toLowerCase());
      }
    },
    [mode, showResult, currentWord, handleSubmit],
  );

  const handleSpeakingToggle = useCallback((): void => {
    if (!currentWord) return;
    setSpeakingRecording((prev) => !prev);
    // Leave actual recording evaluation to parent component
    logger.info(`WordPracticeV2 [speaking]: ${targetWord} - toggle recording`);
  }, [currentWord, targetWord]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (finished || !currentWord) return;

      // Ctrl + A: speak word
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        speakWord();
        return;
      }

      // Ctrl + M: mark mastered
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (showResult) handleMarkMastered();
        return;
      }

      // Ctrl + Q: mark unfamiliar
      if (e.ctrlKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        if (showResult) handleMarkUnfamiliar();
        return;
      }

      // Shift + Left Arrow: prev word
      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        return;
      }

      // Shift + Right Arrow: next word
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (showResult) {
          handleNext();
        }
        return;
      }

      // Space / Enter: submit or next
      if (e.key === 'Enter' || e.key === ' ') {
        // Don't intercept space when typing in input for translation/listening mode
        if (e.key === ' ' && !showResult && mode !== 'speaking') {
          // Space in input field is normal typing unless we want submit-on-space
          // Per spec: 空格键或 Enter 提交
          e.preventDefault();
          handleSubmit();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (showResult) {
            handleNext();
          } else {
            handleSubmit();
          }
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    finished,
    currentWord,
    showResult,
    mode,
    speakWord,
    handleMarkMastered,
    handleMarkUnfamiliar,
    handlePrev,
    handleNext,
    handleSubmit,
  ]);

  // Completed screen
  if (finished) {
    return (
      <div className="max-w-md mx-auto text-center py-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center border border-orange-500/30">
          <Trophy className="w-10 h-10 text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">练习完成</h3>
        <p className="text-slate-400 mb-6">
          共 {words.length} 个单词，答对{' '}
          <span className="text-emerald-400 font-semibold">{correctCount}</span>{' '}
          个
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
          <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 mb-1">正确率</p>
            <p className="text-2xl font-bold text-emerald-300">
              {words.length > 0
                ? Math.round((correctCount / words.length) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
            <p className="text-xs text-orange-400 mb-1">答对</p>
            <p className="text-2xl font-bold text-orange-300">
              {correctCount} / {words.length}
            </p>
          </div>
        </div>
        <Button
          onClick={handleRestart}
          className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          <RotateCcw size={16} />
          再练一轮
        </Button>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="max-w-md mx-auto py-8 text-center text-slate-500">
        暂无单词可练习
      </div>
    );
  }

  // ----- Translation / Listening mode: card + input -----
  const renderWordCard = (): React.ReactNode => {
    const showWordContent = !hideWord || showResult;
    const isListening = mode === 'listening';

    return (
      <div className="glass-card overflow-hidden">
        {/* Image area */}
        {showImage && currentWord.imageUrl && (
          <div className="aspect-video w-full bg-white/5 overflow-hidden">
            <Image
              src={currentWord.imageUrl}
              alt={currentWord.word}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 text-center space-y-3">
          {/* Listening mode: big play button */}
          {isListening && !showResult && (
            <div className="py-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={speakWord}
                className="w-20 h-20 rounded-full bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center shadow-lg transition-all hover:scale-105"
                aria-label="播放发音"
              >
                <Volume2 size={32} />
              </button>
              <p className="text-sm text-slate-500">点击播放，听音拼写</p>
            </div>
          )}

          {/* Word (hidden or shown) */}
          {(!isListening || showResult) && (
            <div className="min-h-[40px]">
              {showWordContent ? (
                <p
                  className={`text-3xl font-bold ${
                    showResult
                      ? 'text-orange-500'
                      : 'text-white'
                  }`}
                >
                  {currentWord.word}
                </p>
              ) : (
                <p className="text-3xl font-bold text-gray-200 tracking-widest">
                  {'•'.repeat(Math.min(targetWord.length, 12))}
                </p>
              )}
            </div>
          )}

          {/* Phonetic + part of speech */}
          {(!isListening || showResult) && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentWord.phonetic && (
                <p className="text-lg italic text-fuchsia-400">
                  {currentWord.phonetic}
                </p>
              )}
              {currentWord.partOfSpeech && (
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-orange-500 border-orange-200 rounded-full"
                >
                  {currentWord.partOfSpeech}
                </Badge>
              )}
            </div>
          )}

          {/* Meaning */}
          {(!isListening || showResult) && (
            <p className="text-xl font-bold text-white">
              {currentWord.meaning}
            </p>
          )}

          {/* Speech button (always available in result, and in non-listening modes) */}
          {(!isListening || showResult) && (
            <div className="flex items-center justify-center">
              <SpeechButton
                text={currentWord.word}
                size="lg"
                variant="outline"
                aria-label="朗读单词"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ----- Speaking mode: word display + big mic -----
  const renderSpeakingCard = (): React.ReactNode => {
    return (
      <div className="glass-card overflow-hidden">
        {showImage && currentWord.imageUrl && (
          <div className="aspect-video w-full bg-white/5 overflow-hidden">
            <Image
              src={currentWord.imageUrl}
              alt={currentWord.word}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 text-center space-y-3">
          <p className="text-3xl font-bold text-white">{currentWord.word}</p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentWord.phonetic && (
              <p className="text-lg italic text-slate-500">
                {currentWord.phonetic}
              </p>
            )}
            {currentWord.partOfSpeech && (
              <Badge
                variant="secondary"
                className="bg-orange-50 text-orange-500 border-orange-200 rounded-full"
              >
                {currentWord.partOfSpeech}
              </Badge>
            )}
          </div>

          <p className="text-xl font-bold text-white">{currentWord.meaning}</p>

          <div className="flex items-center justify-center gap-2">
            <SpeechButton
              text={currentWord.word}
              size="md"
              variant="outline"
              aria-label="听示范发音"
            />
            <span className="text-xs text-slate-500">先听示范，再跟读</span>
          </div>

          {/* Big mic button */}
          <div className="py-6">
            <button
              type="button"
              onClick={handleSpeakingToggle}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${
                speakingRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
              } text-white`}
              aria-label={speakingRecording ? '停止录音' : '开始跟读'}
            >
              <Mic size={40} />
            </button>
            <p className="mt-3 text-sm text-slate-500">
              {speakingRecording ? '正在录音，点击结束' : '点击麦克风开始跟读'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ----- Result detail panel (shown after submit) -----
  const renderResultDetail = (): React.ReactNode => {
    if (!showResult || mode === 'speaking') return null;

    return (
      <div className="glass-card p-5 space-y-4">
        {/* Result header */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
            }`}
          >
            {isCorrect ? <Check size={20} /> : <X size={20} />}
          </div>
          <div>
            {isCorrect && (
              <p className="font-semibold text-green-600">回答正确！</p>
            )}
            {!isCorrect && (
              <p className="text-xs text-slate-500">
                你的答案：<span className="font-mono">{input}</span>
              </p>
            )}
          </div>
        </div>

        {/* Full word info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-2xl font-bold text-orange-500">
              {currentWord.word}
            </p>
            <SpeechButton
              text={currentWord.word}
              size="md"
              variant="ghost"
              aria-label="朗读单词"
            />
          </div>
          {currentWord.phonetic && (
            <p className="text-base italic text-fuchsia-400">
              {currentWord.phonetic}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {currentWord.partOfSpeech && (
              <Badge
                variant="secondary"
                className="bg-orange-50 text-orange-500 border-orange-200 rounded-full"
              >
                {currentWord.partOfSpeech}
              </Badge>
            )}
            <span className="text-slate-300">{currentWord.meaning}</span>
          </div>
          {currentWord.exampleSentence && (
            <div className="mt-2 p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-slate-400 italic">
                "{currentWord.exampleSentence}"
              </p>
              {currentWord.exampleTranslation && (
                <p className="text-xs text-gray-400 mt-1">
                  {currentWord.exampleTranslation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              logger.info(
                `WordPracticeV2: 口语评测 - ${currentWord.word}`,
              );
            }}
          >
            <Mic size={16} />
            口语评测
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={`rounded-full ${
                currentMark === 'mastered'
                  ? 'bg-green-50 border-green-300 text-green-600'
                  : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
              }`}
              onClick={handleMarkMastered}
            >
              <Check size={16} />
              {currentMark === 'mastered' ? '已掌握' : '掌握'}
            </Button>
            <Button
              variant="outline"
              className={`rounded-full ${
                currentMark === 'unfamiliar'
                  ? 'bg-red-50 border-red-300 text-red-500'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
              }`}
              onClick={handleMarkUnfamiliar}
            >
              <X size={16} />
              {currentMark === 'unfamiliar' ? '已标记' : '不熟悉'}
            </Button>
          </div>

          <Button
            variant="default"
            className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleNext}
          >
            {currentIndex >= words.length - 1 ? '完成练习' : '下一题'}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Top progress bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          第 {currentIndex + 1} / {words.length} 题
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-green-500">
            <Check size={14} />
            {correctCount}
          </span>
          <span className="text-gray-400">
            {mode === 'translation'
              ? '中译英'
              : mode === 'listening'
                ? '听力'
                : '口语'}
          </span>
        </div>
      </div>

      {/* Toggles */}
      {mode !== 'speaking' && (
        <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowKeyboard((prev) => !prev)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                backgroundColor: showKeyboard ? '#FFF7ED' : 'white',
                color: showKeyboard ? '#C2410C' : '#6B7280',
                border: showKeyboard ? '1px solid #FED7AA' : '1px solid #E5E7EB',
              }}
            >
              <Keyboard size={14} />
              {showKeyboard ? '虚拟键盘' : '隐藏键盘'}
            </button>
            {showKeyboard && (
              <button
                type="button"
                onClick={() => setKeyboardSlim((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  backgroundColor: keyboardSlim ? '#EEF2FF' : 'white',
                  color: keyboardSlim ? '#4338CA' : '#6B7280',
                  border: keyboardSlim ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
                }}
              >
                {keyboardSlim ? '精简键盘' : '完整键盘'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {mode !== 'listening' && (
              <button
                type="button"
                onClick={() => setHideWord((prev) => !prev)}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {hideWord ? <EyeOff size={14} /> : <Eye size={14} />}
                {hideWord ? '隐藏单词' : '显示单词'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowImage((prev) => !prev)}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showImage ? <ImageIcon size={14} /> : <ImageOff size={14} />}
              {showImage ? '显示图片' : '隐藏图片'}
            </button>
          </div>
        </div>
      )}

      {mode === 'speaking' && (
        <div className="flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowImage((prev) => !prev)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showImage ? <ImageIcon size={14} /> : <ImageOff size={14} />}
            {showImage ? '显示图片' : '隐藏图片'}
          </button>
        </div>
      )}

      {/* Main content */}
      {mode === 'speaking' ? renderSpeakingCard() : renderWordCard()}

      {/* Input area (not for speaking mode) */}
      {mode !== 'speaking' && !showResult && (
        <div className="space-y-3">
          <div
            className="cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            <UnderlineInput
              value={input}
              feedback="none"
              correctAnswer={targetWord}
              showCursor={true}
              size="lg"
              align="center"
              placeholder="请输入英文单词..."
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            className="sr-only"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="单词拼写输入"
          />
          <p className="text-center text-xs text-gray-400">
            按 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">空格</kbd> 或{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> 提交
          </p>
        </div>
      )}

      {/* Virtual keyboard (not for speaking mode) */}
      {mode !== 'speaking' && !showResult && showKeyboard && (
        <div className="flex justify-center pt-2">
          <VirtualKeyboard
            mode={keyboardSlim ? 'simplified' : 'en'}
            onKeyPress={handleVirtualKeyPress}
          />
        </div>
      )}

      {/* Result detail */}
      {renderResultDetail()}

      {/* Navigation (only show before result in non-speaking mode) */}
      {mode !== 'speaking' && !showResult && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full border-gray-200 text-gray-500"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} />
            上一题
          </Button>
          <Button
            variant="default"
            className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            提交
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Speaking mode navigation */}
      {mode === 'speaking' && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full border-gray-200 text-gray-500"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} />
            上一题
          </Button>

          <div className="grid grid-cols-2 gap-2 flex-1">
            <Button
              variant="outline"
              className={`rounded-full ${
                currentMark === 'mastered'
                  ? 'bg-green-50 border-green-300 text-green-600'
                  : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
              }`}
              onClick={handleMarkMastered}
            >
              <Check size={16} />
              掌握
            </Button>
            <Button
              variant="outline"
              className={`rounded-full ${
                currentMark === 'unfamiliar'
                  ? 'bg-red-50 border-red-300 text-red-500'
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
              }`}
              onClick={handleMarkUnfamiliar}
            >
              <X size={16} />
              不熟悉
            </Button>
          </div>

          <Button
            variant="default"
            className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleNext}
          >
            {currentIndex >= words.length - 1 ? '完成' : '下一题'}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Shortcuts hint */}
      <div className="text-center text-xs text-gray-300 space-x-3">
        <span>Ctrl+A 朗读</span>
        {showResult && (
          <>
            <span>Ctrl+M 掌握</span>
            <span>Ctrl+Q 不熟悉</span>
          </>
        )}
        <span>Shift+←/→ 切换</span>
      </div>
    </div>
  );
};

export default WordPracticeV2;
