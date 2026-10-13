import React, { useState, useMemo, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { GrammarComponent } from '@shared/api.interface';
import SpeechButton from '@client/src/components/ui/speech-button';
import { Image } from '@client/src/components/ui/image';

interface SentencePuzzleQuestion {
  sentence: string;
  translation: string;
  components: GrammarComponent[];
  imageUrl?: string;
}

interface UnitSentencePracticeProps {
  questions: SentencePuzzleQuestion[];
  onComplete: (correctCount: number, total: number) => void;
}

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const UnitSentencePractice: React.FC<UnitSentencePracticeProps> = ({
  questions,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffled, setShuffled] = useState<GrammarComponent[]>([]);
  const [showImage, setShowImage] = useState(true);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (currentQ) {
      setShuffled(shuffle(currentQ.components));
    }
  }, [currentIndex, currentQ]);

  const handleSelect = (id: string): void => {
    if (showResult) return;
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((s) => s !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSubmit = (): void => {
    if (selectedIds.length !== currentQ.components.length) return;
    const composed = selectedIds
      .map((id) => shuffled.find((c) => c.id === id)?.text || '')
      .join(' ');
    const target = currentQ.sentence;
    const correct = composed.replace(/\s+/g, ' ').trim().toLowerCase() ===
      target.replace(/\s+/g, ' ').trim().toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = (): void => {
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      onComplete(correctCount, questions.length);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedIds([]);
    setShowResult(false);
  };

  const handleRestart = (): void => {
    setCurrentIndex(0);
    setSelectedIds([]);
    setShowResult(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setFinished(false);
  };

  const composedText = useMemo(() => {
    return selectedIds
      .map((id) => shuffled.find((c) => c.id === id)?.text || '')
      .join(' ');
  }, [selectedIds, shuffled]);

  if (finished) {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30">
          <span className="text-4xl">🧩</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">句子组合完成</h3>
        <p className="text-slate-400 mb-6">
          共 {questions.length} 题，答对 <span className="text-emerald-400 font-semibold">{correctCount}</span> 题
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          再练一轮
        </button>
      </div>
    );
  }

  if (!currentQ) {
    return <div className="py-8 text-center text-slate-500">暂无句子练习题</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>第 {currentIndex + 1} / {questions.length} 题</span>
        <span>答对：{correctCount}</span>
      </div>

      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-slate-400 mb-2">点击下方语法成分，按正确顺序组合成完整句子</p>
            <p className="text-xl font-semibold text-white">{currentQ.translation}</p>
          </div>
          {currentQ.imageUrl && showImage && (
            <div className="w-24 h-24 rounded-xl bg-white/10 overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center border border-white/10">
              <Image
                src={currentQ.imageUrl}
                alt={currentQ.translation}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {currentQ.imageUrl && (
            <button
              onClick={() => setShowImage((prev) => !prev)}
              className="flex-shrink-0 p-2 rounded-lg bg-white/10 text-slate-400 hover:bg-white/20 hover:text-fuchsia-400 transition-colors"
              title={showImage ? '隐藏图片' : '显示图片'}
            >
              {showImage ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[60px] p-4 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
        {selectedIds.length === 0 ? (
          <p className="text-center text-slate-600 text-sm">点击下方卡片组合句子</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id, idx) => {
              const comp = shuffled.find((c) => c.id === id);
              if (!comp) return null;
              return (
                <span
                  key={id}
                  onClick={() => handleSelect(id)}
                  className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 text-sm font-medium cursor-pointer hover:bg-orange-500/30 transition-colors border border-orange-500/30"
                >
                  {idx + 1}. {comp.text}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {showResult && (
        <div
          className={`p-3 rounded-lg text-sm ${
            isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {isCorrect ? (
            '✅ 回答正确！'
          ) : (
            <div className="flex items-center gap-2">
              <span>❌ 正确答案：{currentQ.sentence}</span>
              <SpeechButton text={currentQ.sentence} size="sm" variant="ghost" />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {shuffled.map((comp) => {
          const isSelected = selectedIds.includes(comp.id);
          return (
            <div
              key={comp.id}
              className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-white/10 text-slate-500 border border-white/10 opacity-50 line-through'
                  : 'bg-white/10 text-slate-200 border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/20 hover:text-orange-300 shadow-sm'
              } disabled:cursor-not-allowed`}
            >
              <button
                onClick={() => handleSelect(comp.id)}
                disabled={showResult}
                className="flex items-center gap-1.5 disabled:cursor-not-allowed"
              >
                {comp.text}
                <span className="text-xs text-slate-500">({comp.type})</span>
              </button>
              <SpeechButton
                text={comp.text}
                size="sm"
                variant="ghost"
                className="-mr-1 -my-1 ml-1 flex-shrink-0"
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedIds([])}
          disabled={showResult || selectedIds.length === 0}
          className="px-4 py-2.5 rounded-full bg-white/10 text-slate-300 text-sm hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          重置
        </button>
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length !== currentQ.components.length}
            className="px-6 py-2.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
          >
            {currentIndex >= questions.length - 1 ? '查看结果' : '下一题'}
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center">
        已选 {selectedIds.length} / {currentQ.components.length} 个成分
      </div>
    </div>
  );
};

export default UnitSentencePractice;
