import React from 'react';
import { motion } from 'framer-motion';
import {
  PART_OF_SPEECH_COLORS,
  PART_OF_SPEECH_LABELS,
} from '@client/src/components/word-tag-system/WordTagSystem';
import type { WordParse } from '@shared/api.interface';

export interface CharState {
  isTyped: boolean;
  isWrong: boolean;
  isCursor: boolean;
}

export function getCharStyle(
  isTyped: boolean,
  isWrong: boolean,
  isComplete: boolean,
): { textColor: string; glowStyle: React.CSSProperties } {
   let textColor = 'text-[#475569]';
   let glowStyle: React.CSSProperties = {};
 
   if (isComplete) {
     textColor = 'text-[#6366F1] font-bold';
     glowStyle = { textShadow: '0 0 8px rgba(99, 102, 241, 0.3)' };
   } else if (isWrong) {
     textColor = 'text-[#EF476F] font-bold';
     glowStyle = { textShadow: '0 0 8px rgba(239, 71, 111, 0.6)' };
   } else if (isTyped) {
     textColor = 'text-[#6366F1] font-bold';
     glowStyle = { textShadow: '0 0 6px rgba(99, 102, 241, 0.35)' };
   }
  return { textColor, glowStyle };
}

interface TypingCharProps {
  ch: string;
  charState: CharState;
  isComplete: boolean;
  answerHidden: boolean;
  wordIsCompleted: boolean;
  animOn: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  cursorSide?: 'left' | 'right';
  size?: string;
}

export const TypingChar: React.FC<TypingCharProps> = ({
  ch,
  charState,
  isComplete,
  answerHidden,
  wordIsCompleted,
  animOn,
  feedback,
  cursorSide = 'left',
  size = 'text-[28px]',
}) => {
  const { isTyped, isWrong, isCursor } = charState;
  const { textColor, glowStyle } = getCharStyle(isTyped, isWrong, isComplete);
  const isPunctuation = !/[a-zA-Z]/.test(ch);
  const showUnderline =
    answerHidden && !wordIsCompleted && !isTyped && !isWrong && !isPunctuation;
  const showGhost = !answerHidden && !wordIsCompleted && !isTyped && !isWrong;

  return (
    <span
      className="relative inline-flex items-center justify-center min-w-[1.4em] h-[2.2rem]"
    >
      <motion.span
        className={`${size} font-bold leading-none ${textColor} ${
          feedback === 'wrong' && isTyped && isWrong ? 'animate-pulse' : ''
        }`}
        initial={false}
        animate={
          isWrong && animOn
            ? { x: [-2, 2, -1, 1, 0] }
            : isTyped && animOn
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={
          isWrong
            ? { duration: 0.3, ease: 'easeOut' }
            : isTyped
            ? { duration: 0.15, ease: 'easeOut' }
            : {}
        }
        style={{
          transition: 'color 0.12s ease-out',
          ...glowStyle,
        }}
      >
        {showUnderline ? '\u00A0' : ch}
      </motion.span>
       {showUnderline && (
          <span className="absolute bottom-1 left-1 right-1 h-0.5 bg-[#E0E7FF] rounded-full" />
       )}
       {isCursor && (
         <span
           className={`absolute ${
             cursorSide === 'left' ? '-left-1' : '-right-0.5'
           } top-1/2 -translate-y-1/2`}
         >
           <span
             className="w-0.5 h-8 bg-[#FF6B35] animate-pulse rounded-full"
           />
         </span>
       )}
    </span>
  );
};

interface PosTagProps {
  partOfSpeech: string;
  size?: 'sm' | 'xs';
}

export const PosTag: React.FC<PosTagProps> = ({
  partOfSpeech,
  size = 'xs',
}) => {
  const sizeClass =
    size === 'sm' ? 'text-[11px] px-2 py-0' : 'text-[10px] px-1.5 py-0';
  return (
    <span
      className={`${sizeClass} rounded-full border font-medium ${
        PART_OF_SPEECH_COLORS[partOfSpeech] ||
        'bg-gray-100 text-gray-500 border-gray-300/60'
      }`}
    >
      {PART_OF_SPEECH_LABELS[partOfSpeech] || partOfSpeech}
    </span>
  );
};

export const getWordParseForWord = (
  wordParses: WordParse[],
  wordClean: string,
): WordParse | undefined => {
  return wordParses.find(
    (wp) => wp.word.toLowerCase() === wordClean.toLowerCase(),
  );
};

export const CompletionParticles: React.FC<{ rich: boolean }> = ({ rich }) => {
  if (!rich) return null;
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`p-${i}`}
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B35] pointer-events-none"
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos((i * 30 * Math.PI) / 180) * (60 + (i % 3) * 20),
            y:
              Math.sin((i * 30 * Math.PI) / 180) * (60 + (i % 3) * 20) - 20,
          }}
          transition={{ duration: 0.8, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <motion.span
          key={`s-${i}`}
          className="absolute left-1/2 top-1/2 text-[#FFD166] pointer-events-none text-lg"
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            scale: [0, 1.2, 0.5],
            x: Math.cos((i * 45 * Math.PI) / 180 + 0.3) * 80,
            y: Math.sin((i * 45 * Math.PI) / 180 + 0.3) * 80 - 30,
            rotate: 180,
          }}
          transition={{ duration: 1, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
        >
          ★
        </motion.span>
      ))}
    </>
  );
};
