import React from 'react';
import { motion } from 'framer-motion';
import {
  TypingChar,
  PosTag,
  getWordParseForWord,
  CompletionParticles,
  type CharState,
} from './TypingChar';
import type { WordParse } from '@shared/api.interface';
import { isClickableWord } from '@client/src/utils/word-detail';

interface TypingHorizontalProps {
  words: string[];
  wordParses: WordParse[];
  typedOrigIndexes: Set<number>;
  wrongOrigIdx: number;
  cursorOrigIdx: number;
  isComplete: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  answerHidden: boolean;
  completedWords: number;
  justCompletedWordIdx: number;
  animOn: boolean;
  animRich: boolean;
  showPhonetic: boolean;
  showPartOfSpeech: boolean;
  disableWordClick: boolean;
  onWordClick: (word: string) => void;
  onTouchStart: (word: string) => void;
  onTouchEnd: () => void;
  didLongPress: React.MutableRefObject<boolean>;
}

const TypingHorizontal: React.FC<TypingHorizontalProps> = ({
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
  onWordClick,
  onTouchStart,
  onTouchEnd,
  didLongPress,
}) => {
  const getCharState = (globalIdx: number): CharState => ({
    isTyped: typedOrigIndexes.has(globalIdx),
    isWrong: wrongOrigIdx === globalIdx,
    isCursor: !isComplete && feedback === 'none' && cursorOrigIdx === globalIdx,
  });

  return (
    <motion.div
      className="flex flex-wrap items-start justify-center gap-x-3 gap-y-2 px-2 relative"
      animate={isComplete && animOn ? { y: [0, -4, 0], scale: [1, 1.02, 1] } : {}}
      transition={isComplete && animOn ? { duration: 0.6, ease: 'easeOut' } : {}}
    >
      {isComplete && <CompletionParticles rich={animRich} />}
      {showPhonetic && wordParses.length > 0 && (
        <div className="w-full flex flex-wrap items-end justify-center gap-x-4 gap-y-1 mb-1">
          {words.map((word, wIdx) => {
            const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
            const wp = getWordParseForWord(wordParses, cleanWord);
            return (
              <div
                key={`phon-${wIdx}`}
                className="flex items-center justify-center min-w-[2rem]"
              >
                 {wp?.phonetic ? (
                   <span className="text-[11px] text-fuchsia-400/90 font-mono">
                     /{wp.phonetic}/
                   </span>
                 ) : (
                  <span className="text-[11px] text-transparent">/ /</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {words.map((word, wIdx) => {
        const wordStartInSentence =
          words.slice(0, wIdx).join(' ').length + (wIdx > 0 ? 1 : 0);
        const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
        const canClick = !disableWordClick && isClickableWord(cleanWord);
        const isJustCompleted = justCompletedWordIdx === wIdx;
        const wordParse = getWordParseForWord(wordParses, cleanWord);
        const wordIsCompleted = completedWords > wIdx;

        return (
          <motion.div
            key={`word-${wIdx}`}
            className={`flex flex-col items-center gap-1 ${
              canClick ? 'cursor-pointer' : ''
            }`}
            onClick={() =>
              canClick &&
              !didLongPress.current &&
              void onWordClick(word)
            }
            onTouchStart={() => canClick && onTouchStart(word)}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            animate={
              isJustCompleted
                ? {
                    scale: [1, 1.08, 1],
                    filter: [
                      'brightness(1)',
                      'brightness(1.4)',
                      'brightness(1)',
                    ],
                  }
                : {}
            }
            transition={
              isJustCompleted ? { duration: 0.4, ease: 'easeOut' } : {}
            }
             style={
               isJustCompleted
                 ? {
                     filter:
                       'drop-shadow(0 2px 8px rgba(255, 107, 53, 0.4))',
                   }
                 : undefined
             }
          >
            <div className="flex items-end leading-tight" style={{ lineHeight: '1.4' }}>
              {word.split('').map((ch, cIdx) => {
                const globalIdx = wordStartInSentence + cIdx;
                return (
                    <TypingChar
                      key={`ch-${wIdx}-${cIdx}`}
                      ch={ch}
                      charState={getCharState(globalIdx)}
                      isComplete={isComplete}
                      answerHidden={answerHidden}
                      wordIsCompleted={wordIsCompleted}
                      animOn={animOn}
                      feedback={feedback}
                      cursorSide="left"
                      size="text-[34px]"
                    />
                );
              })}
            </div>
            {wordParse?.partOfSpeech && showPartOfSpeech && (
              <PosTag partOfSpeech={wordParse.partOfSpeech} size="sm" />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default TypingHorizontal;
