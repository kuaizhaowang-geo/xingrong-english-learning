import React, { useState, useEffect } from 'react';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import * as chinesePracticeApi from '@client/src/api/chinese-practice';
import type { ChineseNewWord, ChineseLesson } from '@shared/api.interface';

interface CharacterLearningViewProps {
  textbookId: string;
  unitId: string;
}

const CharacterLearningView: React.FC<CharacterLearningViewProps> = ({
  textbookId,
  unitId,
}) => {
  const { speak } = useSpeech();
  const [characters, setCharacters] = useState<ChineseNewWord[]>([]);
  const [lessons, setLessons] = useState<ChineseLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');

  useEffect(() => {
    if (!textbookId || !unitId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const [lessonData, charData] = await Promise.all([
          chinesePracticeApi.getChineseLessons({ textbookId, unitId }),
          chinesePracticeApi.getChineseCharacters({ textbookId, unitId }),
        ]);
        if (!cancelled) {
          setLessons(lessonData);
          setCharacters(charData);
          setCurrentIndex(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [textbookId, unitId]);

  useEffect(() => {
    if (selectedLessonId === 'all') return;
    if (!textbookId || !selectedLessonId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await chinesePracticeApi.getChineseCharacters({
          textbookId,
          lessonId: selectedLessonId,
        });
        if (!cancelled) {
          setCharacters(data);
          setCurrentIndex(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLessonId, textbookId]);

  const currentChar = characters[currentIndex];

  const handleSpeak = (word: string): void => {
    speak(word, { lang: 'zh-CN', rate: 0.8 });
  };

  const handlePrev = (): void => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = (): void => {
    setCurrentIndex((prev) => Math.min(characters.length - 1, prev + 1));
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        暂无生字数据
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选 + 视图切换 */}
       <div className="glass-card rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
         <div className="flex items-center gap-2 flex-wrap">
           <span className="text-sm font-medium text-slate-300">按课文：</span>
           <button
             onClick={() => setSelectedLessonId('all')}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
               selectedLessonId === 'all'
                 ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                 : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
             }`}
           >
             全部
           </button>
           {lessons.map((l: ChineseLesson) => (
             <button
               key={l.id}
               onClick={() => setSelectedLessonId(l.id)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                 selectedLessonId === l.id
                   ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                   : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
               }`}
             >
               {l.title}
             </button>
           ))}
         </div>
         <div className="flex gap-1">
           <button
             onClick={() => setViewMode('card')}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
               viewMode === 'card'
                 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                 : 'bg-white/5 text-slate-400 border border-white/10'
             }`}
           >
             卡片
           </button>
           <button
             onClick={() => setViewMode('grid')}
             className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
               viewMode === 'grid'
                 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                 : 'bg-white/5 text-slate-400 border border-white/10'
             }`}
           >
             网格
           </button>
         </div>
       </div>

      {viewMode === 'card' && currentChar && (
         <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 text-center text-white">
            <div className="text-sm opacity-80 mb-2">
              第 {currentIndex + 1} / {characters.length} 个
            </div>
            <div className="text-7xl font-bold mb-2">{currentChar.word}</div>
            <div className="text-xl mb-3">{currentChar.pinyin}</div>
            <button
              onClick={() => handleSpeak(currentChar.word)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
            >
              <Volume2 size={16} />
              播放发音
            </button>
          </div>
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-3 gap-4">
               <div className="text-center p-3 bg-white/5 rounded-xl">
                 <div className="text-xs text-slate-400 mb-1">部首</div>
                 <div className="text-lg font-bold text-slate-200">
                   {currentChar.radical}
                 </div>
               </div>
               <div className="text-center p-3 bg-white/5 rounded-xl">
                 <div className="text-xs text-slate-400 mb-1">笔画</div>
                 <div className="text-lg font-bold text-slate-200">
                   {currentChar.strokes} 画
                 </div>
               </div>
               <div className="text-center p-3 bg-white/5 rounded-xl">
                 <div className="text-xs text-slate-400 mb-1">词性</div>
                 <div className="text-lg font-bold text-slate-200">
                   {currentChar.partOfSpeech || '—'}
                 </div>
               </div>
             </div>
             <div>
               <div className="text-xs text-slate-400 mb-2">释义</div>
               <div className="text-base text-slate-300 leading-relaxed">
                 {currentChar.meaning}
               </div>
             </div>
          </div>
           <div className="flex items-center justify-between p-4 border-t border-white/10">
             <button
               onClick={handlePrev}
               disabled={currentIndex === 0}
               className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
             >
               <ChevronLeft size={16} />
               上一个
             </button>
             <div className="text-sm text-slate-500">
               {currentIndex + 1} / {characters.length}
             </div>
             <button
               onClick={handleNext}
               disabled={currentIndex === characters.length - 1}
               className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
             >
               下一个
               <ChevronRight size={16} />
             </button>
           </div>
        </div>
      )}

      {viewMode === 'grid' && (
         <div className="glass-card rounded-2xl p-5 border border-white/10">
           <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
             {characters.map((ch: ChineseNewWord, idx: number) => (
               <div
                 key={`${ch.word}-${idx}`}
                 onClick={() => {
                   setCurrentIndex(idx);
                   setViewMode('card');
                 }}
                 className="group flex flex-col items-center p-3 rounded-xl bg-white/5 hover:bg-orange-500/15 cursor-pointer transition-all border border-white/10 hover:border-orange-500/30"
               >
                 <div className="text-3xl font-bold text-slate-200 group-hover:text-orange-400 transition-colors">
                   {ch.word}
                 </div>
                 <div className="text-xs text-slate-400 mt-1">{ch.pinyin}</div>
               </div>
             ))}
           </div>
         </div>
      )}
    </div>
  );
};

export default CharacterLearningView;
