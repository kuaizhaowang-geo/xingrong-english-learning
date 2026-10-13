import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, ChevronLeft, ChevronRight, MessageCircle, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { preschoolApi } from '@client/src/api';
import type { PreschoolSentence, LearningMode } from '@client/src/api/preschool';
import { speak } from './speak';
import LearningModeSelector from './LearningModeSelector';
import { TypingMode, DictationMode, FollowMode, LookSpeakMode } from './Modes';

interface Category {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

interface SentencesViewProps {
  onBack: () => void;
  addStar: () => void;
}

const SentencesView: React.FC<SentencesViewProps> = ({ onBack, addStar }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sentences, setSentences] = useState<PreschoolSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightedWord, setHighlightedWord] = useState<number>(-1);
  const [modeSelectorOpen, setModeSelectorOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<LearningMode | null>(null);

  useEffect(() => {
    let mounted = true;
    preschoolApi.getSentenceCategories().then((data: Category[]) => {
      if (mounted) {
        setCategories(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const loadSentences = (cat: Category): void => {
    setLoading(true);
    preschoolApi.getSentences(cat.value).then((data: PreschoolSentence[]) => {
      setSentences(data);
      setCurrentIdx(0);
      setSelectedCategory(cat);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const playSentence = (text: string): void => {
    speak(text, 0.7);
    addStar();
    const words = text.split(' ');
    setHighlightedWord(0);
    const interval = setInterval(() => {
      setHighlightedWord(prev => {
        if (prev >= words.length - 1) {
          clearInterval(interval);
          return -1;
        }
        return prev + 1;
      });
    }, 400);
  };

  const prev = (): void => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); };
  const next = (): void => { if (currentIdx < sentences.length - 1) setCurrentIdx(currentIdx + 1); };

  const saveProgress = (mode: LearningMode, contentId: string): void => {
    preschoolApi.updateProgress({
      module: 'sentences',
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
    const s = sentences[currentIdx];
    if (!s || !currentMode) return;
    saveProgress(currentMode, s.id);
    toast.success('太棒啦！句子练习完成 ⭐', {
      description: s.translation,
    });
    setCurrentMode(null);
  };

  const handleModeBack = (): void => {
    setCurrentMode(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-2xl text-purple-500">加载中...</div>;
  }

  if (selectedCategory && sentences.length > 0) {
    const s = sentences[currentIdx];
    const words = s.sentence.split(' ');
    const isDialogue = s.dialogue && s.dialogue.length > 0;

    if (currentMode) {
      const accent = selectedCategory.color || '#F472B6';
      if (currentMode === 'typing') {
        return (
          <TypingMode
            targetText={s.sentence}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'dictation') {
        return (
          <DictationMode
            targetText={s.sentence}
            translation={s.translation}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'follow') {
        return (
          <FollowMode
            targetText={s.sentence}
            translation={s.translation}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
      if (currentMode === 'lookSpeak') {
        return (
          <LookSpeakMode
            targetText={s.sentence}
            imageEmoji={selectedCategory.emoji}
            hintText={s.translation}
            onComplete={handleModeComplete}
            onBack={handleModeBack}
            accentColor={accent}
          />
        );
      }
    }

    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-pink-600 font-bold">
          <ArrowLeft size={20} /> 返回场景
        </button>

        <div className="text-center text-slate-400 text-sm">
          {selectedCategory.emoji} {selectedCategory.label} · {currentIdx + 1}/{sentences.length}
        </div>

        <div className="w-full rounded-3xl shadow-lg overflow-hidden bg-white/10 backdrop-blur border border-white/10">
          <div className="p-6">
            {isDialogue ? (
              <div className="space-y-3">
                {s.dialogue.map((d, idx: number) => (
                  <div key={idx} className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                        idx % 2 === 0
                       ? 'bg-white/5 rounded-tl-none border border-white/10'
                           : 'bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-tr-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle size={16} className={idx % 2 === 0 ? 'text-pink-500' : 'text-white/80'} />
                         <span className={`text-xs font-bold ${idx % 2 === 0 ? 'text-slate-400' : 'text-white/80'}`}>
                          {d.speaker}
                        </span>
                      </div>
                      <button
                        onClick={() => playSentence(d.text)}
                        className="text-left w-full"
                      >
                        <div className="text-xl font-bold leading-relaxed">{d.text}</div>
                         <div className={`text-sm mt-1 ${idx % 2 === 0 ? 'text-slate-400' : 'text-white/80'}`}>
                          {d.translation}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => playSentence(s.sentence)}
                className="w-full text-left active:scale-[0.98] transition-transform"
              >
                 <div className="text-2xl font-bold text-white leading-relaxed mb-3">
                  {words.map((w: string, i: number) => (
                    <span
                      key={i}
                      className={`inline-block mr-2 transition-all duration-200 ${
                         highlightedWord === i ? 'text-pink-400 scale-110' : 'text-white'
                      }`}
                    >
                      {w}
                    </span>
                  ))}
                </div>
                 <div className="text-lg text-slate-400">{s.translation}</div>
                <div className="flex items-center gap-2 mt-4 text-pink-500">
                  <Volume2 size={24} />
                  <span className="font-bold">点击播放</span>
                </div>
              </button>
            )}
          </div>
          <button
            onClick={() => setModeSelectorOpen(true)}
            className="w-full py-4 bg-pink-500/10 text-pink-400 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform border-t border-pink-500/20"
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

        {s.keywords && s.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {s.keywords.map((kw: string, idx: number) => (
              <span key={idx} className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/30">
                {kw}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            disabled={currentIdx === 0}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform ${
              currentIdx === 0 ? 'bg-white/10 text-slate-500' : 'bg-white/10 backdrop-blur text-pink-400 border border-white/10'
            }`}
          >
            <ChevronLeft size={32} />
          </button>
          <div className="flex-1 text-center text-slate-500">上一句 / 下一句</div>
          <button
            onClick={next}
            disabled={currentIdx === sentences.length - 1}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform ${
              currentIdx === sentences.length - 1 ? 'bg-white/10 text-slate-500' : 'bg-white/10 backdrop-blur text-pink-400 border border-white/10'
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
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat: Category) => (
          <button
            key={cat.value}
            onClick={() => loadSentences(cat)}
            className="rounded-2xl p-5 text-white shadow-md active:scale-95 transition-transform text-left"
            style={{ background: cat.color || 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' }}
          >
            <div className="text-4xl mb-2">{cat.emoji}</div>
            <div className="text-lg font-bold">{cat.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SentencesView;
