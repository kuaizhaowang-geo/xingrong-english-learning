import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { WordItem } from '@shared/api.interface';
import SpeechButton from '@client/src/components/ui/speech-button';
import { Image } from '@client/src/components/ui/image';

interface WordFlashCardProps {
  word: WordItem;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onMaster: () => void;
}

const WordFlashCard: React.FC<WordFlashCardProps> = ({
  word,
  index,
  total,
  onNext,
  onPrev,
  onMaster,
}) => {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = (): void => {
    setFlipped((prev) => !prev);
  };

  const handleNext = (): void => {
    setFlipped(false);
    onNext();
  };

  const handlePrev = (): void => {
    setFlipped(false);
    onPrev();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>第 {index + 1} / {total} 个</span>
        <span className="flex items-center gap-1">
          <RotateCcw size={14} />
          点击卡片翻面
        </span>
      </div>

      <div
        onClick={handleFlip}
        className="relative h-64 cursor-pointer perspective-1000"
      >
        <div
          className={`absolute inset-0 rounded-2xl shadow-lg border transition-transform duration-500 transform-style-preserve-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 flex flex-col items-center justify-center p-6 backface-hidden">
            <div className="absolute top-4 right-4">
              <SpeechButton text={word.word} size="md" variant="ghost" aria-label="朗读单词" />
            </div>
            {word.imageUrl && (
               <div className="w-32 h-32 rounded-xl glass-card overflow-hidden mb-4 shadow-sm flex items-center justify-center">
                <Image
                  src={word.imageUrl}
                  alt={word.word}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-3xl font-bold text-gray-800 mb-2">{word.word}</p>
            {word.phonetic && (
              <p className="text-lg text-fuchsia-400">{word.phonetic}</p>
            )}
            {word.partOfSpeech && (
              <span className="mt-3 px-3 py-1 bg-white rounded-full text-xs text-orange-500 border border-orange-200">
                {word.partOfSpeech}
              </span>
            )}
            <p className="mt-6 text-sm text-gray-400">点击查看释义</p>
          </div>

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 flex flex-col items-center justify-center p-6 backface-hidden rotate-y-180">
            <div className="absolute top-4 right-4">
              <SpeechButton text={word.exampleSentence || word.word} size="md" variant="ghost" aria-label="朗读例句" />
            </div>
            <p className="text-2xl font-semibold text-gray-800 mb-2">{word.meaning}</p>
            {word.exampleSentence && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 italic">"{word.exampleSentence}"</p>
                {word.exampleTranslation && (
                  <p className="text-xs text-gray-400 mt-1">{word.exampleTranslation}</p>
                )}
              </div>
            )}
            {word.memoryTip && (
              <div className="mt-4 px-4 py-2 bg-white/60 rounded-lg">
                <p className="text-xs text-orange-600">💡 {word.memoryTip}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="flex-1 py-2.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          上一个
        </button>
        <button
          onClick={onMaster}
          className="px-5 py-2.5 rounded-full bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"
        >
          学会了
        </button>
        <button
          onClick={handleNext}
          disabled={index === total - 1}
          className="flex-1 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一个
        </button>
      </div>
    </div>
  );
};

export default WordFlashCard;
