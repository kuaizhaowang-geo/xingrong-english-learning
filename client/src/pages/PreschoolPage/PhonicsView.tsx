import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { preschoolApi } from '@client/src/api';
import type { PreschoolPhonics, LearningMode } from '@client/src/api/preschool';
import { speak } from './speak';
import LearningModeSelector from './LearningModeSelector';
import { TypingMode, DictationMode, FollowMode, LookSpeakMode } from './Modes';

interface PhonicsWord {
  word: string;
  meaning: string;
  emoji: string;
}

interface PhonicsViewProps {
  onBack: () => void;
  addStar: () => void;
}

const PhonicsView: React.FC<PhonicsViewProps> = ({ onBack, addStar }) => {
  const [lessons, setLessons] = useState<PreschoolPhonics[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<PreschoolPhonics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [practiceIdx, setPracticeIdx] = useState<number>(0);
  const [practiceResult, setPracticeResult] = useState<string>('');
  const [selectedWord, setSelectedWord] = useState<PhonicsWord | null>(null);
  const [showWordDetail, setShowWordDetail] = useState<boolean>(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<LearningMode | null>(null);

  useEffect(() => {
    let mounted = true;
    preschoolApi.getPhonicsLessons().then((data: PreschoolPhonics[]) => {
      if (mounted) {
        setLessons(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const startPractice = (): void => {
    setPracticeMode(true);
    setPracticeIdx(0);
    setPracticeResult('');
  };

  const handlePracticeAnswer = (word: string): void => {
    if (!selectedLesson) return;
    const correct = selectedLesson.words[practiceIdx % selectedLesson.words.length].word;
    if (word === correct) {
      setPracticeResult('correct');
      addStar();
      setTimeout(() => {
        setPracticeResult('');
        setPracticeIdx(i => i + 1);
      }, 500);
    } else {
      setPracticeResult('wrong');
      setTimeout(() => setPracticeResult(''), 800);
    }
  };

  const saveProgress = (mode: LearningMode, contentId: string): void => {
    preschoolApi.updateProgress({
      module: 'phonics',
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

  const handleWordClick = (w: PhonicsWord): void => {
    speak(w.word, 0.7);
    addStar();
    setSelectedWord(w);
    setShowWordDetail(true);
  };

  const handleModeComplete = (): void => {
    if (!selectedLesson || !selectedWord || !currentMode) return;
    const contentId = `${selectedLesson.lessonNo}-${selectedWord.word}`;
    saveProgress(currentMode, contentId);
    toast.success('太棒啦！拼读练习完成 ⭐', {
      description: `${selectedWord.word} — ${selectedWord.meaning}`,
    });
    setCurrentMode(null);
    setSelectedWord(null);
    setShowWordDetail(false);
  };

  const handleModeBack = (): void => {
    setCurrentMode(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-2xl text-purple-500">加载中...</div>;
  }

  // 单词学习模式
  if (selectedWord && currentMode && selectedLesson) {
    const accent = selectedLesson.color || '#60A5FA';
    if (currentMode === 'typing') {
      return (
        <TypingMode
          targetText={selectedWord.word}
          imageEmoji={selectedWord.emoji}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'dictation') {
      return (
        <DictationMode
          targetText={selectedWord.word}
          translation={selectedWord.meaning}
          imageEmoji={selectedWord.emoji}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'follow') {
      return (
        <FollowMode
          targetText={selectedWord.word}
          translation={selectedWord.meaning}
          imageEmoji={selectedWord.emoji}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
    if (currentMode === 'lookSpeak') {
      return (
        <LookSpeakMode
          targetText={selectedWord.word}
          imageEmoji={selectedWord.emoji}
          hintText={selectedWord.meaning}
          onComplete={handleModeComplete}
          onBack={handleModeBack}
          accentColor={accent}
        />
      );
    }
  }

  if (showWordDetail && selectedLesson && selectedWord) {
    return (
      <div className="p-4 space-y-4">
        <button
          onClick={() => { setShowWordDetail(false); setSelectedWord(null); }}
          className="flex items-center gap-2 text-blue-600 font-bold"
        >
          <ArrowLeft size={20} /> 返回单词列表
        </button>

        <div
          className="w-full rounded-3xl shadow-lg overflow-hidden"
          style={{ background: selectedLesson.color || 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)' }}
        >
          <button
            onClick={() => speak(selectedWord.word, 0.7)}
            className="w-full p-8 text-white text-center active:scale-[0.98] transition-transform"
          >
            <div className="text-8xl mb-4">{selectedWord.emoji}</div>
            <div className="text-5xl font-bold drop-shadow-lg">{selectedWord.word}</div>
            <div className="text-2xl mt-3 opacity-90">{selectedWord.meaning}</div>
            <div className="flex items-center justify-center gap-2 mt-6 bg-white/20 rounded-full px-6 py-3 inline-flex">
              <Volume2 size={28} />
              <span className="font-bold text-lg">点我听发音</span>
            </div>
          </button>
          <button
            onClick={() => setModeSelectorOpen(true)}
            className="w-full py-5 bg-white/85 text-gray-800 font-bold text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
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

        <LearningModeSelector
          open={modeSelectorOpen}
          onClose={() => setModeSelectorOpen(false)}
          onSelect={(mode: LearningMode) => setCurrentMode(mode)}
        />
      </div>
    );
  }

  if (selectedLesson && practiceMode) {
    const wordList = selectedLesson.words;
    const currentIdx = practiceIdx % wordList.length;
    const target = wordList[currentIdx];
    const options = [...wordList].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!options.find(o => o.word === target.word)) options[0] = target;
    options.sort(() => Math.random() - 0.5);

    return (
      <div className="p-4 space-y-4">
        <button onClick={() => { setPracticeMode(false); }} className="flex items-center gap-2 text-blue-600 font-bold">
          <ArrowLeft size={20} /> 返回课程
        </button>

        <div className="glass-card rounded-3xl p-6 text-center">
          <h2 className="text-xl font-bold text-white mb-4">🎯 听音选词</h2>
          <button
            onClick={() => speak(target.word, 0.7)}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-lg active:scale-90 transition-transform mx-auto flex items-center justify-center"
          >
            <Volume2 size={40} />
          </button>
           <p className="text-slate-400 mt-3">听发音，选正确的单词</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, idx: number) => {
            const isCorrect = opt.word === target.word && practiceResult === 'correct';
            const isWrong = opt.word !== target.word && practiceResult === 'wrong';
            return (
              <button
                key={idx}
                onClick={() => handlePracticeAnswer(opt.word)}
                 className={`rounded-2xl p-4 shadow-md active:scale-95 transition-all ${
                  isCorrect ? 'bg-green-400 scale-105' : isWrong ? 'bg-red-400' : 'bg-white/10 border border-white/10'
                }`}
              >
                <div className="text-4xl mb-2">{opt.emoji}</div>
                 <div className={`font-bold text-lg ${isCorrect || isWrong ? 'text-white' : 'text-white'}`}>
                  {opt.word}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center text-slate-400">
          第 {practiceIdx + 1} 题
        </div>
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-blue-600 font-bold">
          <ArrowLeft size={20} /> 返回课程列表
        </button>

        <div
          className="rounded-3xl p-6 text-white shadow-lg"
          style={{ background: selectedLesson.color || 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)' }}
        >
          <div className="text-sm opacity-80">第 {selectedLesson.lessonNo} 课</div>
          <div className="text-4xl font-bold mt-2">{selectedLesson.soundPattern}</div>
          <div className="text-lg mt-2 opacity-90">{selectedLesson.titleCn}</div>
          <p className="text-sm mt-3 opacity-80">{selectedLesson.description}</p>
        </div>

        <h3 className="text-lg font-bold text-white">📖 拼读单词（点击进入练习）</h3>
        <div className="space-y-3">
          {selectedLesson.words.map((w, idx: number) => (
            <button
              key={idx}
              onClick={() => handleWordClick(w)}
              className="w-full flex items-center gap-4 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 shadow-md active:scale-95 transition-transform"
            >
              <div className="text-5xl">{w.emoji}</div>
              <div className="text-left flex-1">
                <div className="text-2xl font-bold text-white">{w.word}</div>
                 <div className="text-slate-400">{w.meaning}</div>
              </div>
               <div className="text-blue-400 text-sm font-medium">练习 →</div>
            </button>
          ))}
        </div>

        <button
          onClick={startPractice}
          className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Gamepad2 size={24} /> 听音选词挑战
        </button>

        <LearningModeSelector
          open={modeSelectorOpen}
          onClose={() => setModeSelectorOpen(false)}
          onSelect={(mode: LearningMode) => setCurrentMode(mode)}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {lessons.map((lesson: PreschoolPhonics) => (
          <button
            key={lesson.id}
            onClick={() => setSelectedLesson(lesson)}
            className="rounded-2xl p-4 text-white shadow-md active:scale-95 transition-transform text-left"
            style={{ background: lesson.color || 'linear-gradient(135deg, #60A5FA 0%, #818CF8 100%)' }}
          >
            <div className="text-xs opacity-80">第 {lesson.lessonNo} 课</div>
            <div className="text-xl font-bold mt-1">{lesson.title}</div>
            <div className="text-sm opacity-90 mt-1">{lesson.titleCn}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhonicsView;
