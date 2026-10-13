import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { preschoolApi } from '@client/src/api';
import type { PreschoolLetter, LearningMode } from '@client/src/api/preschool';
import { speak } from './speak';
import LearningModeSelector from './LearningModeSelector';
import { TypingMode, DictationMode, FollowMode, LookSpeakMode } from './Modes';

interface AlphabetViewProps {
  onBack: () => void;
  addStar: () => void;
}

const AlphabetView: React.FC<AlphabetViewProps> = ({ onBack, addStar }) => {
  const [letters, setLetters] = useState<PreschoolLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<PreschoolLetter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const [modeSelectorOpen, setModeSelectorOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<LearningMode | null>(null);

  useEffect(() => {
    let mounted = true;
    preschoolApi.getLetters().then((data: PreschoolLetter[]) => {
      if (mounted) {
        setLetters(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleLetterClick = (letter: PreschoolLetter): void => {
    setBounceId(letter.id);
    speak(letter.uppercase, 0.7);
    setTimeout(() => {
      setSelectedLetter(letter);
      setBounceId(null);
    }, 300);
    addStar();
  };

  const saveProgress = (mode: LearningMode, contentId: string): void => {
    preschoolApi.updateProgress({
      module: 'alphabet',
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
    if (!selectedLetter || !currentMode) return;
    saveProgress(currentMode, selectedLetter.letter);
    toast.success('太棒啦！你又学会了一个字母 ⭐', {
      description: '继续加油，你做得非常好！',
    });
    setCurrentMode(null);
  };

  const handleModeBack = (): void => {
    setCurrentMode(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-2xl text-purple-500">
        加载中...
      </div>
    );
  }

  if (selectedLetter && currentMode) {
    const target = selectedLetter.uppercase;
    const accent = selectedLetter.color?.includes('#')
      ? selectedLetter.color
      : '#818CF8';

    if (currentMode === 'typing') {
      return (
        <TypingMode
          targetText={target}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'dictation') {
      return (
        <DictationMode
          targetText={target}
          translation={selectedLetter.phonetic}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'follow') {
      return (
        <FollowMode
          targetText={target}
          translation={selectedLetter.phonetic}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'lookSpeak') {
      return (
        <LookSpeakMode
          targetText={target}
          imageEmoji={selectedLetter.exampleWords[0]?.emoji || '🔤'}
          hintText={selectedLetter.phonetic}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
  }

  if (selectedLetter) {
    return (
      <div className="p-4 space-y-4">
        <button
          onClick={() => setSelectedLetter(null)}
          className="flex items-center gap-2 text-purple-600 font-bold"
        >
          <ArrowLeft size={20} /> 返回字母表
        </button>

        <div
          className="w-full rounded-3xl shadow-lg overflow-hidden"
          style={{ background: selectedLetter.color || 'linear-gradient(135deg, #F472B6 0%, #818CF8 100%)' }}
        >
          <button
            onClick={() => speak(selectedLetter.uppercase, 0.6)}
            className="w-full p-8 text-white text-center active:scale-[0.98] transition-transform"
          >
            <div className="text-9xl font-bold drop-shadow-lg">
              {selectedLetter.uppercase}
              <span className="text-7xl ml-4 opacity-80">{selectedLetter.lowercase}</span>
            </div>
            <div className="text-2xl mt-4 opacity-90">{selectedLetter.phonetic}</div>
            <div className="flex items-center justify-center gap-2 mt-4 bg-white/20 rounded-full px-4 py-2 inline-flex">
              <Volume2 size={24} />
              <span className="font-bold">点我听发音</span>
            </div>
          </button>
          <button
            onClick={() => setModeSelectorOpen(true)}
            className="w-full py-4 bg-white/85 text-gray-800 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
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

         <h3 className="text-lg font-bold text-white">📚 例词</h3>
        <div className="space-y-3">
          {selectedLetter.exampleWords.map((w, idx: number) => (
            <button
              key={idx}
              onClick={() => speak(w.word, 0.75)}
              className="w-full flex items-center gap-4 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-md active:scale-95 transition-transform"
            >
              <div className="text-5xl">{w.emoji}</div>
              <div className="text-left flex-1">
                <div className="text-2xl font-bold text-white">{w.word}</div>
                <div className="text-slate-400">{w.meaning}</div>
              </div>
              <Volume2 size={24} className="text-purple-500" />
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedLetter(null)}
          className="w-full py-4 bg-purple-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          返回字母表
        </button>

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
      <div className="grid grid-cols-6 gap-2">
        {letters.map((letter: PreschoolLetter) => (
          <button
            key={letter.id}
            onClick={() => handleLetterClick(letter)}
            className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-md active:scale-90 transition-all duration-200 ${
              bounceId === letter.id ? 'animate-bounce' : ''
            }`}
            style={{ background: letter.color || 'linear-gradient(135deg, #F472B6 0%, #818CF8 100%)' }}
          >
            <span className="text-3xl leading-none">{letter.uppercase}</span>
            <span className="text-lg opacity-80 mt-1">{letter.lowercase}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlphabetView;
