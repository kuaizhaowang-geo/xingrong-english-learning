import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Loader2,
  BookOpen,
  Volume2,
  PenLine,
  BookX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi } from '@client/src/api';
import type { ChineseLesson, ChineseNewWord } from '@shared/api.interface';
import DictationConfigPanel from '../DictationPage/DictationConfigPanel';
import type { DictationSession } from '@shared/api.interface';

interface ChineseLessonViewProps {
  lessonId: string;
  onBack: () => void;
}

const ChineseLessonView: React.FC<ChineseLessonViewProps> = ({
  lessonId,
  onBack,
}) => {
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<ChineseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTip, setShowTip] = useState<string | null>(null);
  const [dictationOpen, setDictationOpen] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await textbooksApi.getChineseLesson(lessonId);
      setLesson(data);
    } catch (err) {
      logger.error('获取课文详情失败', err as Error);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReadAloud = (): void => {
    setShowTip('课本点读功能即将上线，敬请期待！');
    setTimeout(() => setShowTip(null), 2500);
  };

  const handleDictation = (): void => {
    setDictationOpen(true);
  };

  const handleStartDictation = (session: DictationSession): void => {
    setDictationOpen(false);
    navigate(`/dictation/${session.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="text-red-400 animate-spin" size={40} />
         <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
           className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={20} />
          <span>返回列表</span>
        </button>
         <div className="glass-card py-20 flex flex-col items-center gap-4">
           <BookX className="text-slate-500" size={64} />
           <h3 className="text-lg font-medium text-slate-300">课文不存在</h3>
           <p className="text-sm text-slate-500">该课文可能已被移除，请返回重试</p>
        </div>
      </div>
    );
  }

  const paragraphs = lesson.content.split('\n').filter((p) => p.trim());

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
           className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft size={20} />
        <span>返回列表</span>
      </button>

      {/* 课文标题 */}
       <div className="relative glass-card p-6 overflow-hidden">
         <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
         <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
         <div className="relative flex items-center gap-2 mb-2">
           <span className="px-2 py-0.5 bg-red-500/80 text-white text-xs font-medium rounded-md">
             第 {lesson.lessonOrder} 课
           </span>
           <span className="text-xs text-red-300">语文</span>
         </div>
         <h1 className="relative text-2xl font-bold text-white">{lesson.title}</h1>
         {lesson.author && (
           <p className="relative text-sm text-slate-400 mt-2">作者：{lesson.author}</p>
         )}
       </div>

      {/* 功能按钮 */}
      <div className="flex gap-4">
        <button
          onClick={handleReadAloud}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Volume2 size={20} />
          <span>课本点读</span>
        </button>
        <button
          onClick={handleDictation}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
        >
          <PenLine size={20} />
          <span>生字听写</span>
        </button>
      </div>

      {/* 提示 toast */}
      {showTip && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-800 text-white rounded-lg shadow-lg text-sm">
          {showTip}
        </div>
      )}

      {/* 听写配置弹窗 */}
      <DictationConfigPanel
        open={dictationOpen}
        onClose={() => setDictationOpen(false)}
        onStart={handleStartDictation}
        preset={{
          grade: undefined,
          semester: undefined,
          textbookId: lesson?.textbookId,
          unitId: lesson?.unitId,
          unitTitle: lesson?.title,
        }}
      />

       {/* 课文正文 */}
       <div className="glass-card p-6">
         <div className="flex items-center gap-2 mb-4">
           <BookOpen size={18} className="text-red-400" />
           <h2 className="text-lg font-semibold text-white">课文正文</h2>
         </div>
         <div className="space-y-4 text-slate-300 leading-loose text-base">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="indent-8">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* 生字词表 */}
       {lesson.newWords && lesson.newWords.length > 0 && (
         <div className="glass-card p-6">
           <div className="flex items-center gap-2 mb-4">
             <PenLine size={18} className="text-red-400" />
             <h2 className="text-lg font-semibold text-white">生字词表</h2>
             <span className="text-sm text-slate-500">
               共 {lesson.newWords.length} 个
             </span>
           </div>
           <div className="grid gap-3 sm:grid-cols-2">
             {lesson.newWords.map((word: ChineseNewWord, idx: number) => (
               <div
                 key={`${word.word}-${idx}`}
                 className="p-4 rounded-lg border border-white/10 bg-red-500/10 hover:shadow-sm transition-shadow"
               >
                 <div className="flex items-baseline gap-3 mb-2">
                   <span className="text-xl font-bold text-white">
                     {word.word}
                   </span>
                   <span className="text-sm text-red-400 font-medium">
                     {word.pinyin}
                   </span>
                 </div>
                 <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                   {word.radical && <span>部首：{word.radical}</span>}
                   {word.strokes !== undefined && (
                     <span>笔画：{word.strokes} 画</span>
                   )}
                   {word.partOfSpeech && <span>词性：{word.partOfSpeech}</span>}
                 </div>
                 <p className="text-sm text-slate-300 mt-2">{word.meaning}</p>
               </div>
             ))}
           </div>
         </div>
       )}

      {/* 课后词语表 */}
      {lesson.wordList && lesson.wordList.length > 0 && (
         <div className="glass-card p-6">
           <div className="flex items-center gap-2 mb-4">
             <BookOpen size={18} className="text-red-400" />
             <h2 className="text-lg font-semibold text-white">课后词语</h2>
             <span className="text-sm text-slate-500">
               共 {lesson.wordList.length} 个
             </span>
           </div>
           <div className="flex flex-wrap gap-2">
             {lesson.wordList.map((word, idx) => (
               <span
                 key={idx}
                 className="px-3 py-1.5 rounded-full text-sm bg-red-500/20 text-red-300 border border-red-500/30"
               >
                {word.word}
                <span className="ml-1 text-red-400 text-xs">{word.pinyin}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChineseLessonView;
