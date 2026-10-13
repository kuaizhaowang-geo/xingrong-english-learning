import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Loader2,
  Lightbulb,
  Calculator,
  Box,
  CheckCircle2,
  XCircle,
  BookX,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi } from '@client/src/api';
import type {
  MathTopic,
  MathPracticeItem,
  ShapePuzzleItem,
  MathPracticeOption,
} from '@shared/api.interface';

interface MathTopicViewProps {
  topicId: string;
  onBack: () => void;
}

type ActiveTab = 'practice' | 'puzzle';

const MathTopicView: React.FC<MathTopicViewProps> = ({ topicId, onBack }) => {
  const [topic, setTopic] = useState<MathTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<Set<string>>(
    new Set(),
  );
  const [puzzleAnswers, setPuzzleAnswers] = useState<Record<string, number>>({});
  const [puzzleSubmitted, setPuzzleSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await textbooksApi.getMathTopic(topicId);
      setTopic(data);
    } catch (err) {
      logger.error('获取知识点详情失败', err as Error);
      setTopic(null);
    } finally {
      setLoading(false);
    }
  };

  const getCorrectIndex = (item: MathPracticeItem): number => {
    if (!item.options || item.options.length === 0) return -1;
    return item.options.findIndex(
      (opt: MathPracticeOption) => opt.text === item.correctAnswer,
    );
  };

  const getPuzzleCorrectIndex = (puzzle: ShapePuzzleItem): number => {
    if (!puzzle.pieces || puzzle.pieces.length === 0) return -1;
    return puzzle.pieces.findIndex((p) => p.correct);
  };

  const handleSelectPracticeAnswer = (
    itemId: string,
    optionIndex: number,
  ): void => {
    if (practiceSubmitted.has(itemId)) return;
    setPracticeAnswers((prev) => ({ ...prev, [itemId]: optionIndex }));
  };

  const handleSubmitPractice = (item: MathPracticeItem): void => {
    setPracticeSubmitted((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleSelectPuzzleAnswer = (
    puzzleId: string,
    optionIndex: number,
  ): void => {
    if (puzzleSubmitted.has(puzzleId)) return;
    setPuzzleAnswers((prev) => ({ ...prev, [puzzleId]: optionIndex }));
  };

  const handleSubmitPuzzle = (puzzle: ShapePuzzleItem): void => {
    setPuzzleSubmitted((prev) => {
      const next = new Set(prev);
      next.add(puzzle.id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="text-blue-400 animate-spin" size={40} />
         <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (!topic) {
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
           <h3 className="text-lg font-medium text-slate-300">知识点不存在</h3>
           <p className="text-sm text-slate-500">该知识点可能已被移除，请返回重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={20} />
        <span>返回列表</span>
      </button>

      {/* 知识点标题 */}
      <div className="relative glass-card p-6 overflow-hidden">
         <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
         <div className="absolute bottom-0 right-0 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />
         <div className="relative flex items-center gap-2 mb-2">
           <span className="px-2 py-0.5 bg-blue-500/80 text-white text-xs font-medium rounded-md">
             第 {topic.topicOrder} 个知识点
           </span>
           <span className="px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 text-xs font-medium rounded-md border border-fuchsia-500/30">
             {topic.domain}
           </span>
         </div>
         <h1 className="relative text-2xl font-bold text-white">{topic.title}</h1>
      </div>

      {/* 入口按钮 */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-medium shadow-md transition-all ${
            activeTab === 'practice'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:border-blue-500/40'
           }`}
        >
          <Calculator size={20} />
          <span>口算练习</span>
          {topic.practiceItems && topic.practiceItems.length > 0 && (
            <span className="text-xs opacity-80">
              ({topic.practiceItems.length}题)
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('puzzle')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-medium shadow-md transition-all ${
            activeTab === 'puzzle'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:border-fuchsia-500/40'
           }`}
        >
          <Box size={20} />
          <span>3D 图形拼图</span>
          {topic.shapePuzzles && topic.shapePuzzles.length > 0 && (
            <span className="text-xs opacity-80">
              ({topic.shapePuzzles.length}题)
            </span>
          )}
        </button>
      </div>

      {/* 知识点讲解 */}
       <div className="glass-card p-6">
         <div className="flex items-center gap-2 mb-4">
           <Lightbulb size={18} className="text-yellow-400" />
           <h2 className="text-lg font-semibold text-white">知识点讲解</h2>
         </div>
         <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
           {topic.explanation || topic.description || '暂无讲解内容'}
         </div>
         {topic.keyPoints && (
           <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
             <p className="text-sm font-medium text-blue-300 mb-1">重点要点</p>
             <p className="text-sm text-slate-300">{topic.keyPoints}</p>
           </div>
         )}
       </div>

      {/* 例题 */}
       <div className="glass-card p-6">
         <div className="flex items-center gap-2 mb-4">
           <Calculator size={18} className="text-blue-400" />
           <h2 className="text-lg font-semibold text-white">例题</h2>
         </div>
         {topic.examples && topic.examples.length > 0 ? (
           topic.examples.map((ex, idx) => (
             <div
               key={idx}
               className="bg-white/5 rounded-lg p-4 border border-white/10 mb-3 last:mb-0"
             >
               <p className="text-white font-medium mb-2">{ex.question}</p>
               {ex.solution && (
                 <p className="text-sm text-slate-400 mb-2">解析：{ex.solution}</p>
               )}
               <div className="flex items-center gap-2 text-sm text-emerald-400">
                 <CheckCircle2 size={16} />
                 <span>答案：{ex.answer}</span>
               </div>
             </div>
           ))
         ) : topic.exampleQuestion ? (
           <div className="bg-white/5 rounded-lg p-4 border border-white/10">
             <p className="text-white font-medium mb-3">
               {topic.exampleQuestion}
             </p>
             <div className="flex items-center gap-2 text-sm text-emerald-400">
               <CheckCircle2 size={16} />
               <span>答案：{topic.exampleAnswer}</span>
             </div>
           </div>
         ) : (
           <div className="text-sm text-slate-500">暂无例题</div>
         )}
       </div>

      {/* 口算练习 */}
      {activeTab === 'practice' && (
        <div className="glass-card p-6">
           <div className="flex items-center gap-2 mb-6">
             <Calculator size={18} className="text-blue-400" />
             <h2 className="text-lg font-semibold text-white">口算练习</h2>
          </div>
          {topic.practiceItems && topic.practiceItems.length > 0 ? (
            <div className="space-y-6">
              {topic.practiceItems.map((item, idx) => {
                const selected = practiceAnswers[item.id];
                const submitted = practiceSubmitted.has(item.id);
                const correctIdx = getCorrectIndex(item);
                const isCorrect = submitted && selected === correctIdx;

                return (
                  <div
                    key={item.id}
                     className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                     <p className="text-white font-medium pt-0.5">
                         {item.question}
                       </p>
                    </div>
                    {item.options && item.options.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 ml-9">
                        {item.options.map(
                          (opt: MathPracticeOption, optIdx: number) => {
                            let optClass =
                               'bg-white/10 border border-white/10 text-slate-200 hover:border-blue-500/50 hover:bg-blue-500/20';
                             if (selected === optIdx && !submitted) {
                               optClass =
                                 'bg-blue-500/20 border-2 border-blue-400 text-blue-300';
                            }
                             if (submitted) {
                               if (optIdx === correctIdx) {
                                 optClass =
                                   'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300';
                               } else if (selected === optIdx && !isCorrect) {
                                 optClass =
                                   'bg-red-500/20 border-2 border-red-400 text-red-300';
                               } else {
                                 optClass =
                                   'bg-white/5 border border-white/10 text-slate-500';
                               }
                             }

                            return (
                              <button
                                key={optIdx}
                                onClick={() =>
                                  handleSelectPracticeAnswer(item.id, optIdx)
                                }
                                disabled={submitted}
                                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${optClass} ${
                                  submitted ? 'cursor-default' : 'cursor-pointer'
                                }`}
                              >
                                {opt.label
                                  ? `${opt.label}. ${opt.text}`
                                  : opt.text}
                              </button>
                            );
                          },
                        )}
                      </div>
                    ) : (
                       <div className="ml-9 text-sm text-slate-500">
                           （填空题/无选项）
                         </div>
                    )}
                    <div className="ml-9 mt-3 flex items-center gap-3">
                      {!submitted ? (
                        <button
                          onClick={() => handleSubmitPractice(item)}
                          disabled={selected === undefined}
                          className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          提交答案
                        </button>
                      ) : isCorrect ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-sm">
                          <CheckCircle2 size={16} />
                          <span>回答正确！</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle size={16} />
                          <span>回答错误，正确答案是 {item.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-8 text-slate-500 text-sm">
               暂无练习题
             </div>
          )}
        </div>
      )}

      {/* 3D 图形拼图 */}
      {activeTab === 'puzzle' && (
        <div className="glass-card p-6">
           <div className="flex items-center gap-2 mb-6">
             <Box size={18} className="text-fuchsia-400" />
             <h2 className="text-lg font-semibold text-white">3D 图形拼图</h2>
          </div>
          {topic.shapePuzzles && topic.shapePuzzles.length > 0 ? (
            <div className="space-y-6">
              {topic.shapePuzzles.map((puzzle, idx) => {
                const selected = puzzleAnswers[puzzle.id];
                const submitted = puzzleSubmitted.has(puzzle.id);
                const correctIdx = getPuzzleCorrectIndex(puzzle);
                const isCorrect = submitted && selected === correctIdx;

                return (
                  <div
                    key={puzzle.id}
                     className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="pt-0.5">
                         <p className="text-white font-medium">
                           {puzzle.title}
                         </p>
                         {puzzle.description && (
                           <p className="text-sm text-slate-400 mt-1">
                            {puzzle.description}
                          </p>
                        )}
                         <span className="inline-block mt-1 px-2 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 text-xs rounded-md border border-fuchsia-500/30">
                          {puzzle.puzzleType}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 ml-9 sm:grid-cols-4">
                      {puzzle.pieces.map((piece, optIdx) => {
                        let optClass =
                           'bg-white/10 border border-white/10 text-slate-200 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/20 min-h-[80px] flex flex-col items-center justify-center text-center p-2 gap-1';
                         if (selected === optIdx && !submitted) {
                           optClass =
                             'bg-fuchsia-500/20 border-2 border-fuchsia-400 text-fuchsia-300 min-h-[80px] flex flex-col items-center justify-center text-center p-2 gap-1';
                        }
                        if (submitted) {
                           if (optIdx === correctIdx) {
                                 optClass =
                                   'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 min-h-[80px] flex flex-col items-center justify-center text-center p-2 gap-1';
                               } else if (selected === optIdx && !isCorrect) {
                                 optClass =
                                   'bg-red-500/20 border-2 border-red-400 text-red-300 min-h-[80px] flex flex-col items-center justify-center text-center p-2 gap-1';
                               } else {
                                 optClass =
                                   'bg-white/5 border border-white/10 text-slate-500 min-h-[80px] flex flex-col items-center justify-center text-center p-2 gap-1';
                          }
                        }

                        return (
                          <button
                            key={piece.id}
                            onClick={() =>
                              handleSelectPuzzleAnswer(puzzle.id, optIdx)
                            }
                            disabled={submitted}
                            className={`rounded-lg text-sm font-medium transition-all ${optClass} ${
                              submitted ? 'cursor-default' : 'cursor-pointer'
                            }`}
                          >
                            <span className="text-lg">{piece.shape}</span>
                            <span className="text-xs opacity-80">
                              {piece.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="ml-9 mt-3 flex items-center gap-3">
                      {!submitted ? (
                        <button
                          onClick={() => handleSubmitPuzzle(puzzle)}
                          disabled={selected === undefined}
                          className="px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          提交答案
                        </button>
                      ) : isCorrect ? (
                         <div className="flex items-center gap-1 text-emerald-400 text-sm">
                             <CheckCircle2 size={16} />
                             <span>拼对了！</span>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle size={16} />
                          <span>拼错了，正确答案是选项 {correctIdx + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-8 text-slate-500 text-sm">
               暂无图形拼图
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MathTopicView;
