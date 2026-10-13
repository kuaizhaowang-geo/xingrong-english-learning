import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, RotateCcw, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem } from '@shared/api.interface';
import { wordsApi } from '@client/src/api';
import { useSpeech } from '@client/src/hooks/use-speech';
import {
  Step1View, Step2View, Step3View, Step4View, Step5View,
  type OptionState,
} from './NewWordStepViews';

interface NewWordLearnModeProps {
  words: WordItem[];
  startIndex?: number;
  onClose: () => void;
  onComplete?: (wordId: string) => void;
}

type StepKey = 1 | 2 | 3 | 4 | 5;

const NewWordLearnMode: React.FC<NewWordLearnModeProps> = ({
  words,
  startIndex = 0,
  onClose,
  onComplete,
}) => {
  const { speak } = useSpeech();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [step, setStep] = useState<StepKey>(1);
  const [isFinished, setIsFinished] = useState(false);

  // Step 1 state
  const [showWordStep1, setShowWordStep1] = useState(false);

  // Step 3 state
  const [typed, setTyped] = useState('');
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [spellCorrect, setSpellCorrect] = useState(false);
  const wrongFlashRef = useRef<number | null>(null);
  const spellFirstWrongRef = useRef(false);

  // Step 4 state
  const [sentenceOptions, setSentenceOptions] = useState<string[]>([]);
  const [sentenceOptStates, setSentenceOptStates] = useState<OptionState[]>([]);
  const [sentenceFeedback, setSentenceFeedback] = useState(false);
  const [sentenceCorrect, setSentenceCorrect] = useState(false);

  // Step 5 state
  const [wordOptions, setWordOptions] = useState<WordItem[]>([]);
  const [wordOptStates, setWordOptStates] = useState<OptionState[]>([]);
  const [wordFeedback, setWordFeedback] = useState(false);
  const [step5CanRetry, setStep5CanRetry] = useState(true);
  const [loadingStep5, setLoadingStep5] = useState(false);

  // Stats
  const [spellTotal, setSpellTotal] = useState(0);
  const [spellRight, setSpellRight] = useState(0);
  const [choiceTotal, setChoiceTotal] = useState(0);
  const [choiceRight, setChoiceRight] = useState(0);

  const current: WordItem | undefined = words[currentIndex];
  const targetWord = current?.word || '';

  // Effective steps (skip step 4 if no example sentence)
  const effectiveSteps: StepKey[] = useMemo(() => {
    if (!current) return [1, 2, 3, 4, 5];
    if (current.exampleSentence) return [1, 2, 3, 4, 5];
    return [1, 2, 3, 5];
  }, [current]);

  const stepIndex = effectiveSteps.indexOf(step);
  const totalSteps = effectiveSteps.length;

  // Reset per-word state when word changes
  useEffect(() => {
    setStep(1);
    setShowWordStep1(false);
    setTyped('');
    setWrongKey(null);
    setSpellCorrect(false);
    setSentenceOptions([]);
    setSentenceOptStates([]);
    setSentenceFeedback(false);
    setSentenceCorrect(false);
    setWordOptions([]);
    setWordOptStates([]);
    setWordFeedback(false);
    setStep5CanRetry(true);
    setLoadingStep5(false);
    spellFirstWrongRef.current = false;
    if (wrongFlashRef.current) {
      window.clearTimeout(wrongFlashRef.current);
      wrongFlashRef.current = null;
    }
  }, [currentIndex]);

  // Step 2: auto-play pronunciation on enter
  useEffect(() => {
    if (step === 2 && current) {
      const t = window.setTimeout(() => {
        speak(current.word, { lang: 'en-US' });
      }, 300);
      return () => window.clearTimeout(t);
    }
  }, [step, current, speak]);

  // Step 4: generate sentence options when entering
  useEffect(() => {
    if (step !== 4 || !current) return;
    const correct = current.exampleTranslation || current.meaning;
    const others = words.filter((w: WordItem) => w.id !== current.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const distractors = shuffled.map((w: WordItem) => w.exampleTranslation || w.meaning);
    while (distractors.length < 3) distractors.push('其他含义');
    const all = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setSentenceOptions(all);
    setSentenceOptStates(all.map(() => 'normal'));
    setSentenceFeedback(false);
    setSentenceCorrect(false);
  }, [step, current, words]);

  // Step 5: load word distractors
  useEffect(() => {
    if (step !== 5 || !current) return;
    const load = async (): Promise<void> => {
      setLoadingStep5(true);
      try {
        const distractors = await wordsApi.getChoiceDistractors(current.id, 3);
        const all: WordItem[] = [current, ...distractors].sort(() => Math.random() - 0.5);
        setWordOptions(all);
        setWordOptStates(all.map(() => 'normal'));
      } catch (err) {
        logger.error('加载干扰项失败', err as Error);
        setWordOptions([current]);
        setWordOptStates(['normal']);
      } finally {
        setLoadingStep5(false);
        setWordFeedback(false);
        setStep5CanRetry(true);
      }
    };
    load();
  }, [step, current]);

  const goNextStep = useCallback((): void => {
    if (!current) return;
    const idx = effectiveSteps.indexOf(step);
    if (idx < 0 || idx >= effectiveSteps.length - 1) {
      if (onComplete) {
        try { onComplete(current.id); } catch (err) { logger.error('onComplete error', err as Error); }
      }
      if (currentIndex >= words.length - 1) {
        setIsFinished(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } else {
      setStep(effectiveSteps[idx + 1]);
    }
  }, [step, current, currentIndex, words.length, effectiveSteps, onComplete]);

  // Enter key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter') return;
      if (isFinished) return;
      if (step === 1 && showWordStep1) { goNextStep(); return; }
      if (step === 2) { goNextStep(); return; }
      if (step === 3 && spellCorrect) { goNextStep(); return; }
      if (step === 4 && sentenceCorrect) { goNextStep(); return; }
      if (step === 5 && wordFeedback) { goNextStep(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, showWordStep1, spellCorrect, sentenceCorrect, wordFeedback, isFinished, goNextStep]);

  // ===== Step 3: spelling =====
  const handleSpellChange = useCallback((newValue: string): void => {
    if (spellCorrect || !current) return;
    if (newValue.length > typed.length) {
      const newChar = newValue[newValue.length - 1];
      const nextPos = typed.length;
      const targetChar = targetWord[nextPos];
      if (!targetChar) return;
      if (newChar.toLowerCase() === targetChar.toLowerCase()) {
        const newTyped = typed + targetChar;
        setTyped(newTyped);
        if (newTyped.length === targetWord.length) {
          setSpellCorrect(true);
          if (!spellFirstWrongRef.current) {
            setSpellTotal((n) => n + 1);
            setSpellRight((n) => n + 1);
          }
          setTimeout(() => { goNextStep(); }, 600);
        }
      } else {
        if (!spellFirstWrongRef.current) {
          spellFirstWrongRef.current = true;
          setSpellTotal((n) => n + 1);
        }
        setWrongKey(newChar.toLowerCase());
        if (wrongFlashRef.current) window.clearTimeout(wrongFlashRef.current);
        wrongFlashRef.current = window.setTimeout(() => setWrongKey(null), 500);
      }
    } else if (newValue.length < typed.length) {
      setTyped(newValue);
    }
  }, [typed, targetWord, spellCorrect, current, goNextStep]);

  const handleSpellHint = useCallback((): void => {
    if (spellCorrect || !current) return;
    const nextPos = typed.length;
    const targetChar = targetWord[nextPos];
    if (targetChar) {
      if (!spellFirstWrongRef.current && typed.length === 0) {
        spellFirstWrongRef.current = true;
        setSpellTotal((n) => n + 1);
      }
      const newTyped = typed + targetChar;
      setTyped(newTyped);
      if (newTyped.length === targetWord.length) {
        setSpellCorrect(true);
        setTimeout(() => { goNextStep(); }, 600);
      }
    }
  }, [typed, targetWord, spellCorrect, current, goNextStep]);

  // ===== Step 4: sentence choice =====
  const handleSentenceSelect = useCallback((idx: number): void => {
    if (sentenceFeedback || !current) return;
    const correct = current.exampleTranslation || current.meaning;
    const isCorrect = sentenceOptions[idx] === correct;
    if (isCorrect) {
      setSentenceOptStates((prev) => prev.map((s, i) => i === idx ? 'correct' : s));
      setSentenceCorrect(true);
      setChoiceTotal((n) => n + 1);
      setChoiceRight((n) => n + 1);
    } else {
      setSentenceOptStates((prev) => prev.map((s, i) => {
        if (i === idx) return 'wrong';
        if (sentenceOptions[i] === correct) return 'reveal';
        return s;
      }));
      setChoiceTotal((n) => n + 1);
    }
    setSentenceFeedback(true);
  }, [sentenceFeedback, current, sentenceOptions]);

  // ===== Step 5: word choice =====
  const handleWordSelect = useCallback((idx: number): void => {
    if (wordFeedback || !current || loadingStep5) return;
    const selected = wordOptions[idx];
    const isCorrect = selected.id === current.id;
    if (isCorrect) {
      setWordOptStates((prev) => prev.map((s, i) => i === idx ? 'correct' : s));
      setChoiceTotal((n) => n + 1);
      setChoiceRight((n) => n + 1);
      setWordFeedback(true);
      setTimeout(() => { goNextStep(); }, 600);
    } else if (step5CanRetry) {
      setWordOptStates((prev) => prev.map((s, i) => i === idx ? 'wrong' : s));
      setStep5CanRetry(false);
      setTimeout(() => {
        setWordOptStates((prev) => prev.map((s) => s === 'wrong' ? 'normal' : s));
      }, 1000);
    } else {
      setWordOptStates((prev) => prev.map((s, i) => {
        if (i === idx) return 'wrong';
        if (wordOptions[i]?.id === current.id) return 'reveal';
        return s;
      }));
      setChoiceTotal((n) => n + 1);
      setWordFeedback(true);
      setTimeout(() => { goNextStep(); }, 800);
    }
  }, [wordFeedback, current, wordOptions, loadingStep5, step5CanRetry, goNextStep]);

  const handleRestart = useCallback((): void => {
    setCurrentIndex(0);
    setIsFinished(false);
    setSpellTotal(0);
    setSpellRight(0);
    setChoiceTotal(0);
    setChoiceRight(0);
  }, []);

  const spellAccuracy = spellTotal > 0 ? Math.round((spellRight / spellTotal) * 100) : 0;
  const choiceAccuracy = choiceTotal > 0 ? Math.round((choiceRight / choiceTotal) * 100) : 0;

  if (!current && !isFinished) return null;

  const renderFinished = (): React.ReactNode => (
    <div className="text-center max-w-md w-full">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full
        bg-gradient-to-br from-violet-500/30 to-cyan-500/30
        border-2 border-violet-500/50 flex items-center justify-center">
        <Sparkles size={40} className="text-cyan-400" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2
        bg-clip-text text-transparent
        bg-gradient-to-r from-violet-300 to-cyan-300">
        学习完成！
      </h2>
      <p className="text-slate-400 mb-6">
        学习了 <span className="text-violet-400 font-medium">{words.length}</span> 个单词
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/30">
          <p className="text-xs text-slate-400 mb-1">拼写正确率</p>
          <p className="text-2xl font-bold text-cyan-400">{spellAccuracy}%</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 border border-violet-500/30">
          <p className="text-xs text-slate-400 mb-1">选择正确率</p>
          <p className="text-2xl font-bold text-violet-400">{choiceAccuracy}%</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl
            bg-slate-800/70 border border-slate-600/50 text-slate-300
            hover:border-violet-500/40 hover:text-white
            transition-all duration-300 active:scale-95"
        >
          <RotateCcw size={18} />
          再来一遍
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-3 rounded-xl
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            text-white font-medium shadow-lg shadow-violet-500/30
            transition-all duration-300 active:scale-95"
        >
          返回单词库
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#EEF2FF]">
      {/* Top bar */}
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
            <span className="text-slate-300 font-medium">新词学习 · 五遍学习法</span>
          </div>
        </div>
        <div className="text-xs text-violet-400 font-medium min-w-[60px] text-right">
          {step > 0 && step <= 5 && stepIndex >= 0
            ? `第 ${stepIndex + 1}/${totalSteps} 步`
            : ''}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        {isFinished ? renderFinished() : current ? (
          <>
            {step === 1 && (
              <Step1View
                current={current}
                showWord={showWordStep1}
                onShowWord={() => setShowWordStep1(true)}
                onNext={goNextStep}
              />
            )}
            {step === 2 && <Step2View current={current} onNext={goNextStep} />}
            {step === 3 && (
              <Step3View
                current={current}
                targetWord={targetWord}
                typed={typed}
                wrongKey={wrongKey}
                spellCorrect={spellCorrect}
                onChange={handleSpellChange}
                onHint={handleSpellHint}
                onNext={goNextStep}
              />
            )}
            {step === 4 && (
              <Step4View
                current={current}
                options={sentenceOptions}
                optStates={sentenceOptStates}
                feedback={sentenceFeedback}
                correct={sentenceCorrect}
                onSelect={handleSentenceSelect}
                onNext={goNextStep}
              />
            )}
            {step === 5 && (
              <Step5View
                current={current}
                options={wordOptions}
                optStates={wordOptStates}
                feedback={wordFeedback}
                canRetry={step5CanRetry}
                loading={loadingStep5}
                onSelect={handleWordSelect}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default NewWordLearnMode;
