import React from 'react';
import { motion } from 'framer-motion';
import WordTagSystem from '@client/src/components/word-tag-system';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import type { WordParse } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import VirtualHandsGuide from '@client/src/components/ui/virtual-hands-guide';
import { getSceneComponent } from '@client/src/components/ui/scene-illustrations/matcher';

interface TypingModeProps {
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  illustrationUrl?: string;
  showGrammarTags: boolean;
  showIllustration: boolean;
  userInput: string;
  onInputChange: (value: string) => void;
  completedWords: number;
  onWordComplete: () => boolean | void;
  onSubmit: () => void;
  onBackspace?: () => void;
  showFingerGuide: boolean;
  keyboardVisible: boolean;
  answerHidden: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  wrongAttempts: number;
  showHint: boolean;
  imageError: boolean;
  onImageError: () => void;
}

const TypingMode: React.FC<TypingModeProps> = ({
  sentence,
  translation,
  wordParses,
  illustrationUrl,
  showGrammarTags,
  showIllustration,
  userInput,
  onInputChange,
  completedWords,
  onWordComplete,
  onSubmit,
  onBackspace,
  showFingerGuide,
  keyboardVisible,
  answerHidden,
  feedback,
  wrongAttempts,
  showHint,
  imageError,
  onImageError,
}) => {
  const words = sentence.split(' ');
  const targetWord = words[completedWords] || '';
  const totalWords = words.length;
  const progress = Math.round((completedWords / totalWords) * 100);

  const completedCharCount = completedWords > 0
    ? words.slice(0, completedWords).join(' ').length + 1
    : 0;
  const cursorGlobalIndex = completedCharCount + userInput.length;
  const SceneFallback = getSceneComponent(sentence);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {showIllustration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md h-36 rounded-2xl overflow-hidden border border-violet-500/30"
        >
          {illustrationUrl && !imageError ? (
            <Image
              src={illustrationUrl}
              alt="情景配图"
              className="w-full h-full object-cover"
              onError={onImageError}
            />
          ) : (
            <SceneFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF2FF]/90 via-transparent to-transparent" />
        </motion.div>
      )}

      {showGrammarTags && wordParses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <WordTagSystem
            wordParses={wordParses}
            showPhonetic
            showPartOfSpeech
            showGrammarRole
          />
        </motion.div>
      )}

      <div className="text-center w-full">
        <p className="text-base text-cyan-600 mb-2">{translation}</p>
      </div>

      <div className="w-full max-w-3xl relative py-3">
        <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-2 px-2">
          {words.map((word, wIdx) => {
            const isCompletedWord = wIdx < completedWords;
            const isCurrentWord = wIdx === completedWords;

            return (
              <div key={`word-${wIdx}`} className="flex items-end tracking-tight">
                {word.split('').map((ch, cIdx) => {
                  const globalIdx = words.slice(0, wIdx).join(' ').length + (wIdx > 0 ? 1 : 0) + cIdx;
                  const isTyped = isCompletedWord
                    ? true
                    : isCurrentWord && cIdx < userInput.length;
                  const typedChar = isCompletedWord ? ch : (isCurrentWord ? userInput[cIdx] : '');
                  const isCorrect = isCompletedWord
                    ? true
                    : isTyped && typedChar?.toLowerCase() === ch.toLowerCase();
                  const isCursor = feedback === 'none' && globalIdx === cursorGlobalIndex && isCurrentWord;

                  let textColor = 'text-transparent';
                  let lineColor = 'border-slate-600';

                  if (!answerHidden || isCompletedWord || isTyped) {
                    if (isCompletedWord) {
                      textColor = 'text-cyan-600 font-semibold';
                      lineColor = 'border-cyan-500';
                    } else if (isTyped) {
                      textColor = isCorrect
                        ? 'text-slate-700 font-semibold'
                        : 'text-red-400 font-semibold';
                      lineColor = isCorrect ? 'border-violet-400' : 'border-red-500';
                    }
                  }

                  if (isCursor) {
                    lineColor = 'border-violet-400';
                  }

                  return (
                    <span
                      key={`char-${wIdx}-${cIdx}`}
                      className="relative inline-flex flex-col items-center min-w-[0.55em] h-9"
                    >
                      <span className={`text-xl font-semibold leading-none ${textColor}`}>
                        {typedChar || '\u00A0'}
                      </span>
                      <span className={`absolute bottom-0 left-0 right-0 border-b-2 ${lineColor} transition-colors`} />
                      {isCursor && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                          <span className="w-0.5 h-5 bg-violet-400 animate-pulse" />
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>第 {completedWords + 1} / {totalWords} 词</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {showHint && feedback === 'none' && !answerHidden && (
          <p className="text-sm text-slate-500">
          提示：<span className="text-violet-600 font-medium">{targetWord}</span>
        </p>
      )}

      {feedback === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-red-600">还需加油</p>
          <p className="text-sm text-slate-500 mt-1">
            正确答案：<span className="text-cyan-600 font-medium">{sentence}</span>
          </p>
        </motion.div>
      )}

      {keyboardVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center"
        >
          {showFingerGuide && (
            <VirtualHandsGuide
              visible={feedback === 'none'}
              targetKey={targetWord[userInput.length]?.toLowerCase() || null}
            />
          )}
          <VirtualKeyboard
            layout="qwerty"
            value={userInput}
            onChange={onInputChange}
            onSubmit={onSubmit}
            onSpacePress={onWordComplete}
            onBackspace={onBackspace}
            showFingerGuide={false}
            showNextGuide={true}
            targetWord={targetWord}
            showTypedHighlight={true}
            theme="neon"
            fullWidth
            spaceLabel={completedWords >= totalWords - 1 ? '提交' : '下一词'}
            spaceSubmit={completedWords >= totalWords - 1}
            disabled={feedback !== 'none'}
          />
        </motion.div>
      )}
    </div>
  );
};

export default TypingMode;
