import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SentencePuzzle } from '@shared/api.interface';
import { useKeyboardSound } from '@client/src/hooks/use-keyboard-sound';

interface UseTypingModeArgs {
  currentPuzzle: SentencePuzzle | undefined;
  feedback: 'none' | 'correct' | 'wrong';
  wrongAttempts: number;
  maxWrongAttempts: number;
  spaceInputMode: 'auto' | 'manual';
  onCorrect: () => void;
  onWrong: () => void;
  onFeedbackReset?: () => void;
}

interface TypingStreams {
  stripped: string;
  origIndexes: number[];
  words: string[];
  totalChars: number;
}

function buildTypingStreams(sentence: string): TypingStreams {
  let stripped = '';
  const origIndexes: number[] = [];
  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i];
    if (/[a-zA-Z]/.test(ch)) {
      stripped += ch.toLowerCase();
      origIndexes.push(i);
    } else if (ch === ' ') {
      stripped += ' ';
      origIndexes.push(i);
    }
  }
  const words = sentence
    .split(' ')
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length > 0);
  return { stripped, origIndexes, words, totalChars: stripped.length };
}

export function useTypingMode({
  currentPuzzle,
  feedback,
  wrongAttempts,
  maxWrongAttempts,
  spaceInputMode,
  onCorrect,
  onWrong,
  onFeedbackReset,
}: UseTypingModeArgs) {
  const [typingInput, setTypingInput] = useState('');
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [answerHidden, setAnswerHidden] = useState(() => {
    try {
      const saved = localStorage.getItem('sentence_typing_answer_hidden');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [lastTypedKey, setLastTypedKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [errorResetKey, setErrorResetKey] = useState(0);
  const submittedRef = useRef(false);

  const { playKeyClick, playKeyError, playKeyBackspace, playKeySpace, playLetterSound } = useKeyboardSound();

  const sentence = currentPuzzle?.sentence || '';

  const { strippedTarget, origIndexes, totalTargetChars, targetWords } = useMemo(() => {
    const { stripped, origIndexes: idxs, words, totalChars } = buildTypingStreams(sentence);
    return {
      strippedTarget: stripped,
      origIndexes: idxs,
      totalTargetChars: totalChars,
      targetWords: words,
    };
  }, [sentence]);

  const progress = typingInput.length;

  const currentWordInputLower = useMemo(() => {
    if (progress === 0) return '';
    if (strippedTarget[progress - 1] === ' ') return '';
    const lastSpaceIdx = strippedTarget.lastIndexOf(' ', progress - 1);
    const wordStart = lastSpaceIdx >= 0 ? lastSpaceIdx + 1 : 0;
    return strippedTarget.slice(wordStart, progress);
  }, [progress, strippedTarget]);

  const completedWords = useMemo(() => {
    if (progress === 0) return 0;
    let count = 0;
    for (let i = 0; i < progress && i < strippedTarget.length; i++) {
      if (strippedTarget[i] === ' ' && i + 1 < progress && strippedTarget[i + 1] !== ' ') {
        count++;
      }
    }
    return count;
  }, [progress, strippedTarget]);

  const currentTargetKey = useMemo(() => {
    if (feedback !== 'none') return null;
    if (progress >= totalTargetChars) return null;
    return strippedTarget[progress];
  }, [progress, totalTargetChars, strippedTarget, feedback]);

  const nextKeyAfterSpace = useMemo(() => {
    if (currentTargetKey !== ' ') return null;
    if (progress + 1 >= totalTargetChars) return null;
    return strippedTarget[progress + 1];
  }, [currentTargetKey, progress, totalTargetChars, strippedTarget]);

  const isComplete = feedback === 'correct';

  useEffect(() => {
    setTypingInput('');
    setWrongIndex(null);
    setAnswerHidden(false);
    setLastTypedKey(null);
    submittedRef.current = false;
  }, [currentPuzzle?.id]);

  const advanceWithChar = useCallback(
    (char: string) => {
      if (feedback === 'correct') return false;
      if (progress >= totalTargetChars) return false;

      const expected = strippedTarget[progress];

      if (char === expected) {
        if (expected === ' ') {
          playKeySpace();
        } else {
          playKeyClick();
          playLetterSound(char.toUpperCase());
        }
        setTypingInput((prev) => prev + char);
        setWrongIndex(null);
        setLastTypedKey(char);

        if (progress + 1 >= totalTargetChars && !submittedRef.current) {
          submittedRef.current = true;
          setTimeout(() => onCorrect(), 150);
        }
        return true;
      }
      return false;
    },
    [
      feedback,
      progress,
      totalTargetChars,
      strippedTarget,
      playKeyClick,
      playKeySpace,
      onCorrect,
    ],
  );

  const handleInputChar = useCallback(
    (char: string) => {
      if (feedback === 'wrong' && wrongAttempts < maxWrongAttempts) {
        onFeedbackReset?.();
      }
      if (feedback === 'correct') return;
      if (progress >= totalTargetChars) return;

      const lowerChar = char.toLowerCase();
      const expected = strippedTarget[progress];

      if (lowerChar === expected && expected !== ' ') {
        const ok = advanceWithChar(lowerChar);
        if (ok && spaceInputMode === 'auto') {
          const nextIdx = progress + 1;
          if (nextIdx < totalTargetChars && strippedTarget[nextIdx] === ' ') {
            setTimeout(() => {
              advanceWithChar(' ');
            }, 0);
          }
        }
      } else {
        setWrongIndex(progress);
        setLastTypedKey(lowerChar);
        setTick((t) => t + 1);
        setErrorResetKey((k) => k + 1);
      playKeyError();
     }
   },
   [
     feedback,
     wrongAttempts,
     maxWrongAttempts,
     onFeedbackReset,
     progress,
     totalTargetChars,
     strippedTarget,
     advanceWithChar,
     playKeyError,
     spaceInputMode,
   ],
 );

  const handleInputChange = useCallback(
    (val: string) => {
      if (!val) return;
      const lastChar = val[val.length - 1];
      handleInputChar(lastChar);
    },
    [handleInputChar],
  );

  const handleBackspace = useCallback(() => {
    if (feedback === 'correct') return;
    if (typingInput.length === 0) {
      playKeyBackspace();
      return;
    }
    setTypingInput((prev) => prev.slice(0, -1));
    setWrongIndex(null);
    setLastTypedKey(null);
    playKeyBackspace();
    submittedRef.current = false;
  }, [typingInput, feedback, playKeyBackspace]);

  const handleWordSpaceSubmit = useCallback((): boolean => {
    if (!currentPuzzle || feedback !== 'none') return false;
    if (progress >= totalTargetChars) return false;

    const expected = strippedTarget[progress];
    if (expected === ' ') {
      advanceWithChar(' ');
      return true;
    }

    playKeyError();
    setWrongIndex(progress);
    setTick((t) => t + 1);
    setErrorResetKey((k) => k + 1);
    return false;
  }, [currentPuzzle, feedback, progress, totalTargetChars, strippedTarget, advanceWithChar, playKeyError]);

  const handleSubmit = useCallback(() => {
    if (!currentPuzzle || feedback === 'correct') return;
    if (progress >= totalTargetChars) {
      onCorrect();
    } else {
      onWrong();
    }
  }, [currentPuzzle, feedback, progress, totalTargetChars, onCorrect, onWrong]);

  const handleHideAnswer = () => {
    setAnswerHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sentence_typing_answer_hidden', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return {
    userInput: currentWordInputLower,
    completedWords,
    answerHidden,
    targetWords,
    totalTargetChars,
    progress,
    targetChars: strippedTarget.split(''),
    targetOrigIndexes: origIndexes,
    currentTargetKey,
    nextKeyAfterSpace,
    wrongMarker: wrongIndex,
    lastTypedKey,
    errorResetKey,
    isComplete,
    handleInputChange,
    handleInputChar,
    handleBackspace,
    handleWordSpaceSubmit,
    handleSubmit,
    handleHideAnswer,
  };
}
