import { useState, useEffect, useRef } from 'react';
import type { SentencePuzzle } from '@shared/api.interface';
import { useKeyboardSound } from '@client/src/hooks/use-keyboard-sound';

interface UseDictationModeArgs {
  currentPuzzle: SentencePuzzle | undefined;
  feedback: 'none' | 'correct' | 'wrong';
  onSubmit: (fullAnswer: string) => void;
}

export function useDictationMode({
  currentPuzzle,
  feedback,
  onSubmit,
}: UseDictationModeArgs) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [wordInputs, setWordInputs] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const { playLetterSound } = useKeyboardSound();

  const words = currentPuzzle?.sentence?.split(' ') || [];

  useEffect(() => {
    if (currentPuzzle) {
      const w = currentPuzzle.sentence.split(' ');
      setWordInputs(w.map(() => ''));
      setCurrentWordIdx(0);
      setShowAnswer(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [currentPuzzle?.id]);

  const handleWordChange = (idx: number, value: string) => {
    if (feedback !== 'none') return;
    const prev = wordInputs[idx] || '';
    if (value.length > prev.length) {
      const lastChar = value[value.length - 1];
      if (/[a-zA-Z]/.test(lastChar)) {
        playLetterSound(lastChar.toUpperCase());
      }
    }
    const newInputs = [...wordInputs];
    newInputs[idx] = value;
    setWordInputs(newInputs);
  };

  const handleWordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (idx < words.length - 1) {
        setCurrentWordIdx(idx + 1);
        setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
      } else {
        const fullAnswer = wordInputs
          .map((w, i) => (i === idx ? e.currentTarget.value || w : w))
          .join(' ');
        onSubmit(fullAnswer);
      }
    } else if (e.key === 'Backspace' && wordInputs[idx] === '' && idx > 0) {
      setCurrentWordIdx(idx - 1);
      setTimeout(() => inputRefs.current[idx - 1]?.focus(), 10);
    }
  };

  const handleSkipWord = () => {
    if (currentWordIdx < words.length - 1) {
      setCurrentWordIdx((prev) => prev + 1);
      setTimeout(() => inputRefs.current[currentWordIdx + 1]?.focus(), 10);
    }
  };

  const handleReveal = () => setShowAnswer(true);
  const handleToggleAnswer = () => setShowAnswer((prev) => !prev);

  const handleSubmitAll = () => {
    const fullAnswer = wordInputs.join(' ');
    onSubmit(fullAnswer);
  };

  return {
    wordInputs,
    currentWordIdx,
    showAnswer,
    inputRefs,
    handleWordChange,
    handleWordKeyDown,
    handleSkipWord,
    handleReveal,
    handleToggleAnswer,
    handleSubmitAll,
  };
}
