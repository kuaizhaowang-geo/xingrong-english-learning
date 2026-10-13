import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Volume2, RotateCcw, Check, XCircle, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem } from '@shared/api.interface';
import { wordsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/use-speech';

interface ChoiceModeProps {
  words: WordItem[];
  startIndex?: number;
  onClose: () => void;
  onRecordUpdate?: (wordId: string, isCorrect: boolean) => void;
}

type QuestionType = 'en2cn' | 'cn2en';
type OptionState = 'normal' | 'correct' | 'wrong' | 'reveal';

const ChoiceMode: React.FC<ChoiceModeProps> = ({
  words,
  startIndex = 0,
  onClose,
  onRecordUpdate,
}) => {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [questionType, setQuestionType] = useState<QuestionType>('en2cn');
  const [options, setOptions] = useState<WordItem[]>([]);
  const [optionStates, setOptionStates] = useState<OptionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const current: WordItem | undefined = words[currentIndex];

  const loadQuestion = useCallback(async (): Promise<void> => {
    if (!current) return;
    setLoading(true);
    setShowFeedback(false);
    setOptions([]);
    setOptionStates([]);

    const type: QuestionType = Math.random() > 0.5 ? 'en2cn' : 'cn2en';
    setQuestionType(type);

    try {
      const distractors = await wordsApi.getChoiceDistractors(current.id, 3);
      const allOptions: WordItem[] = [current, ...distractors];
      const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
      setOptions(shuffled);
      setOptionStates(shuffled.map(() => 'normal'));
    } catch (err) {
      logger.error('加载选择题干扰项失败', err as Error);
      setOptions([current]);
      setOptionStates(['normal']);
    } finally {
      setLoading(false);
    }
  }, [current]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSpeak = useCallback((): void => {
    if (current) speak(current.word, { lang: 'en-US' });
  }, [current, speak]);

  const goNext = useCallback((): void => {
    if (currentIndex >= words.length - 1) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
  }, [currentIndex, words.length]);

  const handleSelectOption = useCallback((index: number): void => {
    if (loading || showFeedback || isFinished || !current) return;

    const selected = options[index];
    const isCorrect = selected.id === current.id;

    if (isCorrect) {
      const newStates: OptionState[] = optionStates.map(
        (s: OptionState, i: number) => (i === index ? 'correct' : s),
      );
      setOptionStates(newStates);
      setShowFeedback(true);
      setCorrectCount((c) => c + 1);
      if (onRecordUpdate) {
        try {
          onRecordUpdate(current.id, true);
        } catch (err) {
          logger.error('更新单词记录失败', err as Error);
        }
      }
      setTimeout(() => {
        goNext();
      }, 1500);
    } else {
      const newStates: OptionState[] = optionStates.map(
        (s: OptionState, i: number) => {
          if (i === index) return 'wrong';
          if (options[i]?.id === current.id) return 'reveal';
          return s;
        },
      );
      setOptionStates(newStates);
      setShowFeedback(true);
      setWrongCount((c) => c + 1);
      const alreadyWrong = wrongWords.some((w: WordItem) => w.id === current?.id);
      if (!alreadyWrong) {
        setWrongWords((prev) => [...prev, current]);
      }
      if (onRecordUpdate) {
        try {
          onRecordUpdate(current.id, false);
        } catch (err) {
          logger.error('更新单词记录失败', err as Error);
        }
      }
      setTimeout(() => {
        goNext();
      }, 2000);
    }
  }, [loading, showFeedback, isFinished, current, options, optionStates, wrongWords, onRecordUpdate, goNext]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongWords([]);
    setIsFinished(false);
  }, []);

  const handleRetryWrong = useCallback((word: WordItem): void => {
    const idx = words.findIndex((w: WordItem) => w.id === word.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
      setCorrectCount(0);
      setWrongCount(0);
      setWrongWords([]);
      setIsFinished(false);
    }
  }, [words]);

  const questionTitle = useMemo((): string => {
    if (!current) return '';
    return questionType === 'en2cn' ? current.word : current.meaning;
  }, [current, questionType]);

  const optionLabel = useCallback((opt: WordItem): string => {
    return questionType === 'en2cn' ? opt.meaning : opt.word;
  }, [questionType]);

  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 0;

  const getOptionStyle = useCallback((state: OptionState): string => {
    switch (state) {
      case 'correct':
        return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20';
      case 'wrong':
        return 'border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-lg shadow-rose-500/20';
      case 'reveal':
        return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/20 animate-pulse';
      default:
        return 'border-slate-600/50 bg-slate-800/40 text-slate-200 hover:border-violet-500/60 hover:bg-violet-500/10';
    }
  }, []);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF2FF]">
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
            <span className="text-slate-300 font-medium">选择题练习</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-cyan-400">✓ {correctCount}</span>
          <span className="text-rose-400">✗ {wrongCount}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {isFinished ? (
          <div className="text-center max-w-md w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full
              bg-gradient-to-br from-violet-500/30 to-cyan-500/30
              border-2 border-violet-500/50 flex items-center justify-center">
              <Check size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">练习完成！</h2>
            <p className="text-slate-400 mb-6">
              正确 <span className="text-cyan-400 font-medium">{correctCount}</span> 个 ·{' '}
              错误 <span className="text-rose-400 font-medium">{wrongCount}</span> 个 ·{' '}
              正确率 <span className="text-violet-400 font-medium">{accuracy}%</span>
            </p>

            {wrongWords.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={16} className="text-rose-400" />
                  <span className="text-sm font-medium text-slate-300">错词列表</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wrongWords.map((w: WordItem) => (
                    <div
                      key={w.id}
                      onClick={() => handleRetryWrong(w)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg
                        bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-white font-medium">{w.word}</span>
                      <span className="text-xs text-slate-400">{w.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-3 mx-auto rounded-xl
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                text-white font-medium shadow-lg shadow-violet-500/30 transition-all duration-300"
            >
              <RotateCcw size={18} />
              再来一遍
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center">
            <p className="text-xs text-violet-400 mb-3 uppercase tracking-wider">
              {questionType === 'en2cn' ? '请选择中文释义' : '请选择英文单词'}
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              {questionType === 'en2cn' && (
                <button
                  onClick={handleSpeak}
                  className="p-2 rounded-full bg-cyan-500/20 border border-cyan-500/40
                    text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                  aria-label="发音"
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2
              bg-clip-text text-transparent
              bg-gradient-to-r from-violet-300 via-white to-cyan-300">
              {questionTitle}
            </h2>
            {questionType === 'en2cn' && current.phonetic && (
              <p className="text-sm text-slate-400 mb-8">{current.phonetic}</p>
            )}
            {questionType === 'cn2en' && (
              <p className="text-sm text-slate-500 mb-8">请选择对应的英文单词</p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="text-violet-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {options.map((opt: WordItem, idx: number) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(idx)}
                      disabled={showFeedback}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200
                        ${getOptionStyle(optionStates[idx] || 'normal')}
                        ${showFeedback ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                      `}
                    >
                      <span className="text-sm font-medium">{optionLabel(opt)}</span>
                    </button>
                  ))}
                </div>

                {showFeedback && current.exampleSentence && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-sm text-slate-200">{current.exampleSentence}</p>
                    {current.exampleTranslation && (
                      <p className="text-xs text-slate-500 mt-1">{current.exampleTranslation}</p>
                    )}
                  </div>
                )}

                {showFeedback && optionStates.includes('correct') && (
                  <p className="text-emerald-400 font-medium mt-3">正确！</p>
                )}
                {showFeedback && optionStates.includes('wrong') && (
                  <p className="text-rose-400 font-medium mt-3">
                    正确答案：{questionType === 'en2cn' ? current.meaning : current.word}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!isFinished && !loading && options.length > 0 && (
        <div className="h-6 border-t border-purple-900/30" />
      )}
    </div>
  );
};

export default ChoiceMode;
