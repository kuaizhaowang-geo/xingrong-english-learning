import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SentenceWordDetailModal from '../components/SentenceWordDetailModal';
import { getWordDetail, isClickableWord, type WordDetailData } from '@client/src/utils/word-detail';
import type { WordParse } from '@shared/api.interface';
import TypingHorizontal from '../components/TypingHorizontal';
import TypingVertical from '../components/TypingVertical';

interface TypingSentenceDisplayProps {
  sentence: string;
  userInput: string;
  completedWords: number;
  answerHidden: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  progress?: number;
  targetOrigIndexes?: number[];
  totalTargetChars?: number;
  wrongMarker?: number | null;
  wordParses?: WordParse[];
  showPhonetic?: boolean;
  showPartOfSpeech?: boolean;
  wordRearrangeMode?: boolean;
  onWordClick?: (word: string) => void;
  disableWordClick?: boolean;
  animationLevel?: 'off' | 'simple' | 'standard' | 'rich';
  soundEnabled?: boolean;
}

const TypingSentenceDisplay: React.FC<TypingSentenceDisplayProps> = ({
  sentence,
  completedWords,
  answerHidden,
  feedback,
  progress = 0,
  targetOrigIndexes = [],
  wrongMarker = null,
  wordParses = [],
  showPhonetic = false,
  showPartOfSpeech = false,
  wordRearrangeMode = false,
  onWordClick,
  disableWordClick = false,
  animationLevel = 'standard',
}) => {
  const isComplete = feedback === 'correct';
  const [detailWord, setDetailWord] = useState<WordDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [justCompletedWordIdx, setJustCompletedWordIdx] = useState<number>(-1);
  const prevCompletedRef = useRef<number>(0);
  const pressTimer = useRef<number | null>(null);
  const didLongPress = useRef<boolean>(false);

  const animOn = animationLevel !== 'off';
  const animRich = animationLevel === 'rich' || animationLevel === 'standard';

  useEffect(() => {
    if (completedWords > prevCompletedRef.current && animOn) {
      setJustCompletedWordIdx(completedWords - 1);
      const t = window.setTimeout(() => setJustCompletedWordIdx(-1), 400);
      prevCompletedRef.current = completedWords;
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completedWords;
  }, [completedWords, animOn]);

  const handleWordClick = useCallback(async (word: string) => {
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
    if (!isClickableWord(cleanWord) || disableWordClick) return;
    if (onWordClick) {
      onWordClick(cleanWord);
      return;
    }
    setActiveWord(cleanWord);
    setDetailLoading(true);
    setDetailWord(null);
    try {
      const detail = await getWordDetail(cleanWord);
      setDetailWord(detail);
    } finally {
      setDetailLoading(false);
    }
  }, [onWordClick, disableWordClick]);

  const handleTouchStart = useCallback((word: string) => {
    didLongPress.current = false;
    pressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      void handleWordClick(word);
    }, 300);
  }, [handleWordClick]);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const typedOrigIndexes = new Set<number>();
  for (let i = 0; i < progress && i < targetOrigIndexes.length; i++) {
    typedOrigIndexes.add(targetOrigIndexes[i]);
  }

  const wrongOrigIdx =
    wrongMarker !== null && wrongMarker >= 0 && wrongMarker < targetOrigIndexes.length
      ? targetOrigIndexes[wrongMarker]
      : -1;

  const cursorOrigIdx =
    progress > 0 && progress <= targetOrigIndexes.length
      ? progress < targetOrigIndexes.length
        ? targetOrigIndexes[progress]
        : sentence.length
      : targetOrigIndexes[0] ?? 0;

  const words = sentence.split(' ');

  const sharedLayoutProps = {
    words,
    wordParses,
    typedOrigIndexes,
    wrongOrigIdx,
    cursorOrigIdx,
    isComplete,
    feedback,
    answerHidden,
    completedWords,
    justCompletedWordIdx,
    animOn,
    animRich,
    showPhonetic,
    showPartOfSpeech,
    disableWordClick,
    onWordClick: handleWordClick,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    didLongPress,
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-3xl relative">
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
          </motion.div>
        )}

        {wordRearrangeMode ? (
          <TypingVertical {...sharedLayoutProps} />
        ) : (
          <TypingHorizontal {...sharedLayoutProps} />
        )}
      </div>

      {feedback === 'wrong' && (
        <motion.div
          key={`wrong-${progress}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-center"
        >
          <p className="text-sm font-semibold text-red-400">还需加油，再试一次</p>
        </motion.div>
      )}

      <SentenceWordDetailModal
        wordDetail={detailWord}
        loading={detailLoading}
        onClose={() => {
          setDetailWord(null);
          setActiveWord(null);
        }}
      />
    </div>
  );
};

export default TypingSentenceDisplay;
