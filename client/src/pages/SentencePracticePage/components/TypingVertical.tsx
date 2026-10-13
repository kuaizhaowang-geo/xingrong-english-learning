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

interface TypingVerticalProps {
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

const TypingVertical: React.FC<TypingVerticalProps> = ({
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
      className="flex flex-col items-center relative px-4"
      animate={isComplete && animOn ? { y: [0, -4, 0], scale: [1, 1.02, 1] } : {}}
      transition={isComplete && animOn ? { duration: 0.6, ease: 'easeOut' } : {}}
    >
      {isComplete && <CompletionParticles rich={animRich} />}
      {words.map((word, wIdx) => {
        const wordStartInSentence =
          words.slice(0, wIdx).join(' ').length + (wIdx > 0 ? 1 : 0);
        const cleanWord = word.replace(/[^a-zA-Z'-]/g, '');
        const canClick = !disableWordClick && isClickableWord(cleanWord);
        const isJustCompleted = justCompletedWordIdx === wIdx;
        const wordParse = getWordParseForWord(wordParses, cleanWord);
        const wordIsCompleted = completedWords > wIdx;
        const isCurrentWord = completedWords === wIdx;

        return (
          <React.Fragment key={`v-word-${wIdx}`}>
            {wIdx > 0 && <div className="h-3" />}
            {showPhonetic && wordParse?.phonetic && (
              <div className="flex items-center justify-center h-5 mb-1">
                <span className="text-[11px] text-fuchsia-400 font-mono">
                  /{wordParse.phonetic}/
                </span>
              </div>
            )}
            <motion.div
              className={`flex flex-col items-center gap-0.5 relative ${
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
                        'drop-shadow(0 0 12px rgba(34, 211, 238, 0.8))',
                    }
                  : undefined
              }
            >
              {word.split('').map((ch, cIdx) => {
                const globalIdx = wordStartInSentence + cIdx;
                const isFirstLetter = cIdx === 0;
                return (
                  <div
                    key={`v-char-${wIdx}-${cIdx}`}
                    className="relative flex items-center justify-center"
                  >
                    <TypingChar
                      ch={ch}
                      charState={getCharState(globalIdx)}
                      isComplete={isComplete}
                      answerHidden={answerHidden}
                      wordIsCompleted={wordIsCompleted}
                      animOn={animOn}
                      feedback={feedback}
                      cursorSide="left"
                    />
                    {isFirstLetter &&
                      wordParse?.partOfSpeech &&
                      showPartOfSpeech &&
                      isCurrentWord && (
                        <span className="absolute left-full ml-2 whitespace-nowrap">
                          <PosTag
                            partOfSpeech={wordParse.partOfSpeech}
                            size="xs"
                          />
                        </span>
                      )}
                  </div>
                );
              })}
              {wordParse?.partOfSpeech && showPartOfSpeech && !isCurrentWord && (
                <div className="mt-1">
                  <PosTag partOfSpeech={wordParse.partOfSpeech} size="sm" />
                </div>
              )}
            </motion.div>
          </React.Fragment>
        );
      })}
    </motion.div>
  );
};

export default TypingVertical;
