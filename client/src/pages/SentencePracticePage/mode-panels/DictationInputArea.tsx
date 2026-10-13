import React from 'react';
import { Volume2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import ClickableSentence from '../components/ClickableSentence';
import SentenceWordDetailModal from '../components/SentenceWordDetailModal';
import { useSentenceWordDetail } from '../hooks/useSentenceWordDetail';

interface DictationInputAreaProps {
  sentence: string;
  wordInputs: string[];
  currentWordIdx: number;
  showAnswer: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  onWordChange: (idx: number, value: string) => void;
  onWordKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => void;
  inputRefs?: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onSpeak: () => void;
  onReveal: () => void;
}

const DictationInputArea: React.FC<DictationInputAreaProps> = ({
  sentence,
  wordInputs,
  currentWordIdx,
  showAnswer,
  feedback,
  onWordChange,
  onWordKeyDown,
  inputRefs,
  onSpeak,
  onReveal,
}) => {
  const words = sentence.split(' ');
  const completedCount = wordInputs.filter((w) => w.trim() !== '').length;
  const { detailWord, detailLoading, activeWord, openWordDetail, closeWordDetail } = useSentenceWordDetail();
  const highlightSet = activeWord ? new Set<string>([activeWord]) : new Set<string>();

  const isWordCorrect = (idx: number): boolean | null => {
    if (feedback === 'none') return null;
    return wordInputs[idx].toLowerCase() === words[idx].toLowerCase();
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* 播放按钮 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSpeak}
           className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(59_130_246_0.15)] border border-[rgba(59_130_246_0.3)] text-[#2563EB] hover:bg-[rgba(59_130_246_0.25)] transition-colors text-xs font-medium"
        >
            <Volume2 size={14} />
          播放听力
        </button>
        {!showAnswer && feedback === 'none' && (
          <button
            type="button"
            onClick={onReveal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-indigo-200 text-slate-500 hover:bg-indigo-50 hover:text-slate-700 transition-colors text-xs"
          >
            <Eye size={14} />
            显示答案
          </button>
        )}
      </div>

      {/* 输入横线区 */}
      <div className="w-full max-w-3xl">
        <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2 px-2">
          {words.map((word, idx) => {
            const correct = isWordCorrect(idx);
            const isCurrent = idx === currentWordIdx && feedback === 'none';
            const displayWord = showAnswer ? word : wordInputs[idx] || '';
            const wordLen = word.length;

            return (
              <div
                key={`word-${idx}`}
                className="relative flex flex-col items-center gap-0.5 min-w-[2rem]"
              >
                <div className="flex items-end">
                  {Array.from({ length: wordLen }).map((_, cIdx) => {
                    const char = displayWord[cIdx] || '';
                     let borderColor = 'border-[#E0E7FF]';
                      let textColor = 'text-slate-800';
 
                     if (correct === true) {
                       borderColor = 'border-[#06B6D4]';
                       textColor = 'text-[#06B6D4]';
                     } else if (correct === false) {
                       borderColor = 'border-[#EF476F]';
                       textColor = 'text-[#EF476F]';
                     } else if (isCurrent) {
                       borderColor = 'border-[#6366F1]';
                     }

                    return (
                      <span
                        key={cIdx}
                        className={`relative inline-flex flex-col items-center min-w-[0.7em] h-8 ${
                          cIdx === 0 ? '' : ''
                        }`}
                      >
                        <span className={`text-[24px] font-semibold leading-none ${textColor}`}>
                          {char || '\u00A0'}
                        </span>
                        <span
                          className={`absolute bottom-0 left-0 right-0 border-b-2 ${borderColor} transition-colors`}
                        />
                      </span>
                    );
                  })}
                </div>
                <input
                  ref={(el) => {
                    if (inputRefs) inputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={wordInputs[idx] || ''}
                  onChange={(e) => onWordChange(idx, e.target.value)}
                  onKeyDown={(e) => onWordKeyDown(e, idx)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 进度文字 */}
      <div className="w-full max-w-md">
         <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>
            已完成 {completedCount} / {words.length} 词
          </span>
        </div>
      </div>

      {/* 显示答案时显示翻译 */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-white/5 border border-fuchsia-500/15 text-center"
        >
          <p className="text-base font-bold text-white">
             <ClickableSentence
               sentence={sentence}
               onWordClick={openWordDetail}
               highlightWords={highlightSet}
                wordColorClass="text-white"
            />
          </p>
        </motion.div>
      )}

      {feedback === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
           <p className="text-base font-bold text-[#EF476F]">还需加油</p>
        </motion.div>
      )}

      <SentenceWordDetailModal
        wordDetail={detailWord}
        loading={detailLoading}
        onClose={closeWordDetail}
      />
    </div>
  );
};

export default DictationInputArea;
