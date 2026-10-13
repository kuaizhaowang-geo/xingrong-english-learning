import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, RotateCcw, BookOpen, Lightbulb, PenTool } from 'lucide-react';
import { useSpeech } from '@client/src/hooks/use-speech';
import * as chinesePracticeApi from '@client/src/api/chinese-practice';
import type { ChineseLesson } from '@shared/api.interface';

interface LessonReadingViewProps {
  textbookId: string;
  unitId: string;
}

const LessonReadingView: React.FC<LessonReadingViewProps> = ({
  textbookId,
  unitId,
}) => {
  const { speak, speaking, stop } = useSpeech();
  const [lessons, setLessons] = useState<ChineseLesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParaIndex, setCurrentParaIndex] = useState<number>(-1);
  const [isFullReading, setIsFullReading] = useState<boolean>(false);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [showNewWords, setShowNewWords] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!textbookId || !unitId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await chinesePracticeApi.getChineseLessons({
          textbookId,
          unitId,
        });
        if (!cancelled) {
          setLessons(data);
          if (data.length > 0 && !selectedLessonId) {
            setSelectedLessonId(data[0].id);
          }
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
    const lesson = lessons.find((l: ChineseLesson) => l.id === selectedLessonId);
    if (lesson) {
      const paras = lesson.content
        .split(/\r?\n\r?\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      setParagraphs(paras);
    } else {
      setParagraphs([]);
    }
    setCurrentParaIndex(-1);
    setIsFullReading(false);
    stop();
  }, [selectedLessonId, lessons]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      stop();
    };
  }, [stop]);

  const currentLesson = lessons.find(
    (l: ChineseLesson) => l.id === selectedLessonId,
  );

  const playParagraph = (index: number): void => {
    if (index < 0 || index >= paragraphs.length) return;
    setCurrentParaIndex(index);
    speak(paragraphs[index], {
      lang: 'zh-CN',
      rate: 0.85,
    });
  };

  const handlePlayPara = (index: number): void => {
    setIsFullReading(false);
    playParagraph(index);
  };

  const playNext = (): void => {
    const next = currentParaIndex + 1;
    if (next >= paragraphs.length) {
      setCurrentParaIndex(-1);
      setIsFullReading(false);
      return;
    }
    setCurrentParaIndex(next);
    speak(paragraphs[next], {
      lang: 'zh-CN',
      rate: 0.85,
    });
    // 估算朗读时长，自动播放下一段
    const estDuration = paragraphs[next].length * 300 + 500;
    timerRef.current = window.setTimeout(() => {
      playNext();
    }, estDuration);
  };

  const handleFullRead = (): void => {
    if (isFullReading) {
      // 暂停
      stop();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsFullReading(false);
      return;
    }
    if (paragraphs.length === 0) return;
    setIsFullReading(true);
    setCurrentParaIndex(0);
    speak(paragraphs[0], {
      lang: 'zh-CN',
      rate: 0.85,
    });
    const estDuration = paragraphs[0].length * 300 + 500;
    timerRef.current = window.setTimeout(() => {
      playNext();
    }, estDuration);
  };

  const handleStop = (): void => {
    stop();
    setIsFullReading(false);
    setCurrentParaIndex(-1);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 课文选择器 */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-300">选择课文：</span>
          <div className="flex gap-1 flex-wrap">
            {lessons.map((l: ChineseLesson) => (
              <button
                key={l.id}
                onClick={() => setSelectedLessonId(l.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedLessonId === l.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {l.lessonOrder}. {l.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentLesson && (
        <div className="glass-card rounded-2xl p-6 border border-white/10">
          {/* 课文标题 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-red-400 mb-1">
              {currentLesson.title}
            </h2>
            {currentLesson.author && (
              <p className="text-sm text-slate-400">—— {currentLesson.author}</p>
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
             <button
               onClick={handleFullRead}
               className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
             >
               {isFullReading ? (
                 <>
                   <Pause size={16} />
                   暂停朗读
                 </>
               ) : (
                 <>
                   <Play size={16} />
                   全文朗读
                 </>
               )}
             </button>
              <button
                onClick={() => setShowNewWords(!showNewWords)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium hover:bg-emerald-500/25 border border-emerald-500/20 transition-all"
              >
               <PenTool size={16} />
               {showNewWords ? '收起生字' : '本课生字'}
             </button>
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500/15 text-amber-400 font-medium hover:bg-amber-500/25 border border-amber-500/20 transition-all"
              >
               <Lightbulb size={16} />
               {showAnalysis ? '收起解析' : '课文解析'}
             </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 text-slate-300 font-medium hover:bg-white/10 border border-white/10 transition-all"
              >
               <RotateCcw size={16} />
               停止
             </button>
           </div>

          {/* 课文段落 */}
          <div className="space-y-4">
             {paragraphs.map((para: string, idx: number) => (
               <div
                 key={idx}
                  className={`group relative p-4 rounded-xl transition-all cursor-pointer ${
                    currentParaIndex === idx
                      ? 'bg-orange-500/20 border-2 border-orange-500/40 shadow-md shadow-orange-500/20'
                      : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }`}
                 onClick={() => handlePlayPara(idx)}
               >
                 <button
                    className={`absolute right-3 top-3 p-1.5 rounded-full transition-all ${
                      currentParaIndex === idx
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-slate-400 opacity-0 group-hover:opacity-100'
                    }`}
                   onClick={(e: React.MouseEvent) => {
                     e.stopPropagation();
                     handlePlayPara(idx);
                   }}
                 >
                   <Volume2 size={14} />
                 </button>
                  <p className="text-base leading-loose text-slate-200 tracking-wide pr-10">
                   {para}
                 </p>
               </div>
             ))}
           </div>

           {/* 生字表 */}
           {showNewWords && currentLesson.newWords && currentLesson.newWords.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-3">
                 <PenTool size={14} />
                 本课生字
                  <span className="ml-auto text-xs text-emerald-400">
                   共 {currentLesson.newWords.length} 字
                 </span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {currentLesson.newWords.slice(0, 20).map((w, i) => (
                   <div
                     key={i}
                      className="px-3 py-1.5 bg-white/5 rounded-lg border border-emerald-500/20 text-sm"
                    >
                      <span className="font-semibold text-slate-200">{w.word}</span>
                      <span className="ml-1 text-xs text-emerald-400">{w.pinyin}</span>
                   </div>
                 ))}
                 {currentLesson.newWords.length > 20 && (
                   <div className="px-3 py-1.5 text-xs text-emerald-400">
                     +{currentLesson.newWords.length - 20} 字
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* 课文解析 */}
            {showAnalysis && currentLesson.analysis && currentLesson.analysis.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-3">
                 <Lightbulb size={14} />
                 课文解析要点
               </div>
               <ul className="space-y-2">
                 {currentLesson.analysis.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                     <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center font-medium">
                       {i + 1}
                     </span>
                     <div>
                        <div className="font-medium text-slate-200">{pt.point}</div>
                       {pt.detail && (
                          <div className="text-xs text-slate-400 mt-0.5">{pt.detail}</div>
                       )}
                     </div>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      )}

      {!currentLesson && !loading && (
        <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
          暂无课文数据
        </div>
      )}
    </div>
  );
};

export default LessonReadingView;
