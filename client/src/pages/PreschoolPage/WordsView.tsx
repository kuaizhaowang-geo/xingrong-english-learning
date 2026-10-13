import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { preschoolApi } from '@client/src/api';
import type { PreschoolWord, LearningMode } from '@client/src/api/preschool';
import { speak } from './speak';
import LearningModeSelector from './LearningModeSelector';
import { TypingMode, DictationMode, FollowMode, LookSpeakMode } from './Modes';

interface Category {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

interface WordsViewProps {
  onBack: () => void;
  addStar: () => void;
}

const WordsView: React.FC<WordsViewProps> = ({ onBack, addStar }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<PreschoolWord[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modeSelectorOpen, setModeSelectorOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<LearningMode | null>(null);

  useEffect(() => {
    let mounted = true;
    preschoolApi.getWordCategories().then((data: Category[]) => {
      if (mounted) {
        setCategories(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const loadWords = (cat: Category): void => {
    setLoading(true);
    preschoolApi.getWords(cat.value).then((data: PreschoolWord[]) => {
      setWords(data);
      setCurrentIdx(0);
      setSelectedCategory(cat);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const prevWord = (): void => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const nextWord = (): void => {
    if (currentIdx < words.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const saveProgress = (mode: LearningMode, contentId: string): void => {
    preschoolApi.updateProgress({
      module: 'words',
      contentId,
      mode,
      status: 'completed',
      stars: 1,
      score: 100,
      correctCount: 1,
      totalCount: 1,
      completed: true,
    }).then(() => {
      addStar();
    }).catch(() => {
      // 静默失败
    });
  };

  const handleModeComplete = (): void => {
    const word = words[currentIdx];
    if (!word || !currentMode) return;
    saveProgress(currentMode, word.id);
    toast.success('太棒啦！你又掌握了一个单词 ⭐', {
      description: `${word.word} — ${word.meaning}`,
    });
    setCurrentMode(null);
  };

  const handleModeBack = (): void => {
    setCurrentMode(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-2xl text-green-500">加载中...</div>;
  }

  if (selectedCategory && words.length > 0) {
    const word = words[currentIdx];

    if (currentMode) {
      const accent = selectedCategory.color || '#22C55E';
      if (currentMode === 'typing') {
        return (
          <TypingMode
            targetText={word.word}
            imageEmoji={word.imageEmoji}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'dictation') {
        return (
          <DictationMode
            targetText={word.word}
            translation={word.meaning}
            imageEmoji={word.imageEmoji}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'follow') {
        return (
          <FollowMode
            targetText={word.word}
            translation={word.meaning}
            imageEmoji={word.imageEmoji}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'lookSpeak') {
        return (
          <LookSpeakMode
            targetText={word.word}
            imageEmoji={word.imageEmoji}
            hintText={word.meaning}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
    }

    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-green-600 font-bold">
          <ArrowLeft size={20} /> 返回主题
        </button>

        <div className="flex items-center justify-between text-slate-400 text-sm">
          <span>{selectedCategory.emoji} {selectedCategory.label}</span>
          <span>{currentIdx + 1} / {words.length}</span>
        </div>

        <div className="w-full rounded-3xl shadow-lg overflow-hidden bg-white/10 backdrop-blur border border-white/10">
          <button
            onClick={() => { speak(word.word, 0.75); addStar(); }}
            className="w-full p-8 active:scale-[0.98] transition-transform"
          >
            <div className="text-8xl mb-4">{word.imageEmoji}</div>
            <div className="text-4xl font-bold text-white">{word.word}</div>
            <div className="text-lg text-fuchsia-400 mt-2">{word.phonetic}</div>
            <div className="text-xl text-slate-300 mt-2 font-medium">{word.meaning}</div>
            <div className="flex items-center justify-center gap-2 mt-4 text-green-500">
              <Volume2 size={24} />
              <span className="font-bold">点我发音</span>
            </div>
          </button>
          <button
            onClick={() => setModeSelectorOpen(true)}
            className="w-full py-4 bg-green-500/10 text-green-400 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform border-t border-green-500/20"
          >
            🎮 选择学习模式
          </button>
        </div>

        <button
          onClick={() => setModeSelectorOpen(true)}
          className="w-full py-5 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-orange-500/40 active:scale-95 transition-transform flex items-center justify-center gap-2 animate-pulse"
          style={{ animationDuration: '2s' }}
        >
          <Gamepad2 size={28} fill="currentColor" /> 开始练习
        </button>

        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <div className="text-slate-200 italic">"{word.exampleSentence}"</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prevWord}
            disabled={currentIdx === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
              currentIdx === 0 ? 'bg-white/10 text-slate-500' : 'bg-white/10 backdrop-blur text-green-400 border border-white/10'
            }`}
          >
            <ChevronLeft size={32} />
          </button>
          <div className="flex-1 text-center text-slate-500">
             左右滑动切换单词
           </div>
          <button
            onClick={nextWord}
            disabled={currentIdx === words.length - 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
              currentIdx === words.length - 1 ? 'bg-white/10 text-slate-500' : 'bg-white/10 backdrop-blur text-green-400 border border-white/10'
            }`}
          >
            <ChevronRight size={32} />
          </button>
        </div>

        <LearningModeSelector
          open={modeSelectorOpen}
          onClose={() => setModeSelectorOpen(false)}
          onSelect={(mode: LearningMode) => setCurrentMode(mode)}
          currentMode={currentMode ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-3">
        {categories.map((cat: Category) => (
          <button
            key={cat.value}
            onClick={() => loadWords(cat)}
            className="aspect-square rounded-2xl flex flex-col items-center justify-center text-white shadow-md active:scale-95 transition-transform p-2"
            style={{ background: cat.color || 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
          >
            <div className="text-4xl mb-2">{cat.emoji}</div>
            <div className="text-sm font-bold text-center leading-tight">{cat.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WordsView;
