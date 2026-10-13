import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import WordTagSystem from '@client/src/components/word-tag-system';
import type { WordParse } from '@shared/api.interface';
import { Volume2, Eye, Image as ImageIcon } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { getSceneComponent } from '@client/src/components/ui/scene-illustrations/matcher';

interface DictationModeProps {
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  illustrationUrl?: string;
  showGrammarTags: boolean;
  showIllustration: boolean;
  onSpeak: () => void;
  onSubmit: (fullAnswer: string) => void;
  feedback: 'none' | 'correct' | 'wrong';
  wrongAttempts: number;
  showAnswer: boolean;
  onRevealAnswer: () => void;
  imageError: boolean;
  onImageError: () => void;
}

const DictationMode: React.FC<DictationModeProps> = ({
  sentence,
  translation,
  wordParses,
  illustrationUrl,
  showGrammarTags,
  showIllustration,
  onSpeak,
  onSubmit,
  feedback,
  wrongAttempts,
  showAnswer,
  onRevealAnswer,
  imageError,
  onImageError,
}) => {
  const words = sentence.split(' ');
  const [wordInputs, setWordInputs] = useState<string[]>(() => words.map(() => ''));
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setWordInputs(words.map(() => ''));
    setCurrentWordIdx(0);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [sentence]);

  const handleWordChange = (idx: number, value: string) => {
    const newInputs = [...wordInputs];
    newInputs[idx] = value;
    setWordInputs(newInputs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (idx < words.length - 1) {
        setCurrentWordIdx(idx + 1);
        setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
      } else {
        const fullAnswer = wordInputs.map((w, i) => i === idx ? (e.currentTarget.value || w) : w).join(' ');
        onSubmit(fullAnswer);
      }
    } else if (e.key === 'Backspace' && wordInputs[idx] === '' && idx > 0) {
      setCurrentWordIdx(idx - 1);
      setTimeout(() => inputRefs.current[idx - 1]?.focus(), 10);
    }
  };

  const handleSubmitAll = () => {
    const fullAnswer = wordInputs.join(' ');
    onSubmit(fullAnswer);
  };

  const isWordCorrect = (idx: number): boolean | null => {
    if (feedback === 'none') return null;
    return wordInputs[idx].toLowerCase() === words[idx].toLowerCase();
  };

  const completedCount = wordInputs.filter((w) => w.trim() !== '').length;
  const progress = Math.round((completedCount / words.length) * 100);
  const SceneFallback = getSceneComponent(sentence);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {showIllustration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md h-32 rounded-2xl overflow-hidden border border-blue-500/30"
        >
          {illustrationUrl && !imageError ? (
            <Image
              src={illustrationUrl}
              alt="情景配图"
              className="w-full h-full object-cover opacity-70"
              onError={onImageError}
            />
          ) : (
            <SceneFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF2FF] via-[#EEF2FF]/60 to-transparent" />
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSpeak}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border border-blue-400 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30"
        >
          <Volume2 size={20} className="text-white" />
          <span className="font-medium">播放音频</span>
        </button>
      </div>

      <p className="text-sm text-slate-500">
        听发音，填写单词。按 <kbd className="px-1.5 py-0.5 bg-indigo-100 rounded text-xs text-slate-600">空格</kbd> 跳格
      </p>

      <div className="w-full max-w-3xl relative py-3">
        <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3 px-4">
          {words.map((word, wIdx) => {
            const correct = isWordCorrect(wIdx);
            const isCurrent = wIdx === currentWordIdx && feedback === 'none';
            const showWord = feedback !== 'none' || showAnswer;

            let borderColor = 'border-slate-600';
            let textColor = 'text-slate-800';

            if (feedback !== 'none') {
              if (correct) {
                borderColor = 'border-green-500';
                textColor = 'text-green-600';
              } else {
                borderColor = 'border-red-500';
                textColor = 'text-red-600';
              }
            } else if (isCurrent) {
              borderColor = 'border-violet-500';
            }

            return (
              <div key={`word-${wIdx}`} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <input
                    ref={(el) => { inputRefs.current[wIdx] = el; }}
                    type="text"
                    value={showWord && !correct && feedback !== 'none' ? word : wordInputs[wIdx]}
                    onChange={(e) => handleWordChange(wIdx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, wIdx)}
                    onFocus={() => setCurrentWordIdx(wIdx)}
                    disabled={feedback !== 'none'}
                    className={`w-24 h-10 text-center text-lg font-semibold bg-transparent border-b-2 ${borderColor} ${textColor} focus:outline-none transition-colors placeholder-transparent`}
                    placeholder="----"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  {feedback !== 'none' && !correct && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-green-600 whitespace-nowrap">
                      {word}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{word.length}个字母</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>已填写 {completedCount} / {words.length} 词</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {feedback === 'none' && !showAnswer && (
        <button
          type="button"
          onClick={onRevealAnswer}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Eye size={14} />
          显示答案
        </button>
      )}

      {showAnswer && feedback === 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-lg font-semibold text-cyan-600">{sentence}</p>
          <p className="text-sm text-slate-500 mt-1">{translation}</p>
        </motion.div>
      )}

      {showGrammarTags && feedback !== 'none' && wordParses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full pt-2"
        >
          <WordTagSystem
            wordParses={wordParses}
            showPhonetic
            showPartOfSpeech
            showGrammarRole
          />
        </motion.div>
      )}

      {feedback === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-orange-600">有错误，继续加油</p>
          <p className="text-sm text-slate-500 mt-1">
            正确答案：<span className="text-cyan-600 font-medium">{sentence}</span>
          </p>
        </motion.div>
      )}

      {feedback === 'none' && (
        <button
          type="button"
          onClick={handleSubmitAll}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          提交答案
        </button>
      )}
    </div>
  );
};

export default DictationMode;
