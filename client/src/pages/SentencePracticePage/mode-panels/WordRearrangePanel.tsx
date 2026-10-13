import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCcw, Check } from 'lucide-react';

interface WordRearrangePanelProps {
  sentence: string;
  translation: string;
  feedback: 'none' | 'correct' | 'wrong';
  onSubmit: (orderedWords: string[]) => void;
  onReset: () => void;
  disabled?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const getWord = (id: string): string => id.split(':').slice(1).join(':');

interface WordCardProps {
  id: string;
  word: string;
  variant: 'answer' | 'pool';
  feedback?: 'none' | 'correct' | 'wrong';
  onClick?: () => void;
  disabled?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({
  id,
  word,
  variant,
  feedback = 'none',
  onClick,
  disabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };
   const fbBorder =
     feedback === 'correct' ? 'border-[#06B6D4]'
     : feedback === 'wrong' ? 'border-[#EF476F]'
     : variant === 'answer' ? 'border-[#6366F1]/70'
     : 'border-fuchsia-500/20 hover:border-fuchsia-400/50';
   const fbBg =
     feedback === 'correct' ? 'bg-[rgba(34_211_238_0.15)]'
     : feedback === 'wrong' ? 'bg-[rgba(239_71_111_0.15)]'
     : variant === 'answer' ? 'bg-[rgba(124_58_237_0.15)]'
     : 'bg-white/5';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: isDragging ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...attributes}
      {...listeners}
      onClick={disabled ? undefined : onClick}
      className={`
        px-3 py-1.5 rounded-lg cursor-pointer select-none text-sm font-medium
        border shadow-sm
        ${fbBorder}
        ${fbBg}
         ${feedback === 'correct' ? 'text-[#06B6D4]' : feedback === 'wrong' ? 'text-[#EF476F]' : variant === 'answer' ? 'text-fuchsia-400' : 'text-slate-200'}
        hover:-translate-y-0.5 hover:shadow transition-all
        flex items-center justify-center min-w-[48px]
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {word}
    </motion.div>
  );
};

const WordRearrangePanel: React.FC<WordRearrangePanelProps> = ({
  sentence,
  translation,
  feedback,
  onSubmit,
  onReset,
  disabled = false,
}) => {
  const correctWords = useMemo(() => sentence.split(' '), [sentence]);
  const [answerWords, setAnswerWords] = useState<string[]>([]);
  const [poolWords, setPoolWords] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const resetWords = () => {
    const indexed = correctWords.map((w, i) => `${i}:${w}`);
    setPoolWords(shuffle(indexed));
    setAnswerWords([]);
  };

  useEffect(() => { resetWords(); }, [sentence]);

  const handleReset = () => { resetWords(); onReset(); };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handlePoolClick = (wordId: string) => {
    if (disabled) return;
    setPoolWords((prev) => prev.filter((w) => w !== wordId));
    setAnswerWords((prev) => [...prev, wordId]);
  };

  const handleAnswerClick = (wordId: string) => {
    if (disabled) return;
    setAnswerWords((prev) => prev.filter((w) => w !== wordId));
    setPoolWords((prev) => [...prev, wordId]);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const aId = String(active.id), oId = String(over.id);
    if (answerWords.includes(aId) && answerWords.includes(oId)) {
      setAnswerWords((items) =>
        arrayMove(items, items.indexOf(aId), items.indexOf(oId)));
    }
  };

  const handleSubmit = () => onSubmit(answerWords.map(getWord));
  const isEmpty = answerWords.length === 0;

   const answerBorder = feedback === 'correct'
     ? 'border-[#06B6D4] bg-[rgba(34_211_238_0.15)]'
     : feedback === 'wrong'
       ? 'border-[#EF476F] bg-[rgba(239_71_111_0.15)]'
       : 'border-[rgba(124_58_237_0.3)] bg-[rgba(124_58_237_0.05)]';

  return (
     <div className="w-full flex flex-col items-center gap-3 py-2">
       <motion.div
         initial={{ opacity: 0, y: -4 }}
         animate={{ opacity: 1, y: 0 }}
         className="text-sm text-[#64748B] font-medium"
       >
         {translation}
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 答案区 */}
        <motion.div
          animate={feedback === 'wrong' ? { x: [-6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full min-h-[80px] rounded-xl border-2 border-dashed
            ${answerBorder} p-3 flex items-center justify-center
            transition-colors duration-300 relative`}
          data-ai-section-type="card-list"
        >
          {feedback === 'correct' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 1, repeat: 1 }}
             className="absolute inset-0 rounded-xl
                 bg-gradient-to-r from-[#06B6D4]/0 via-[#06B6D4]/40 to-[#06B6D4]/0
                 pointer-events-none"
            />
          )}
          {isEmpty
             ? <span className="text-xs text-[#64748b]">点击下方单词开始组句</span>
            : <SortableContext items={answerWords} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <AnimatePresence mode="popLayout">
                    {answerWords.map((wid) => (
                      <WordCard key={wid} id={wid} word={getWord(wid)} variant="answer"
                        feedback={feedback} onClick={() => handleAnswerClick(wid)} />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>}
        </motion.div>

        {/* 正确时显示原句 */}
        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-[#06B6D4] flex items-center gap-1"
            >
              <Check size={12} />
              <span className="font-mono">{sentence}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isEmpty}
               className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
               bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white text-xs font-semibold
               hover:shadow-lg hover:shadow-[#6366F1]/40
               disabled:opacity-40 disabled:cursor-not-allowed
               transition-all"
          >
            <Check size={14} /> 提交
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
               bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)]
text-[#64748B] text-xs
                hover:bg-[#E0E7FF] hover:text-[#6366F1]
               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={13} /> 重置
          </button>
        </div>

        {/* 待选单词区 */}
        <div className="w-full mt-1">
           <div className="text-[11px] text-[#64748B] mb-1.5 text-center">
            待选单词（点击添加，拖拽排序）
          </div>
          <div className="w-full min-h-[48px] rounded-lg
             bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)] p-2">
            {poolWords.length === 0
               ? <div className="text-center text-[11px] text-[#64748b] py-2">所有单词已添加到答案区</div>
              : <SortableContext items={poolWords} strategy={horizontalListSortingStrategy}>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <AnimatePresence mode="popLayout">
                      {poolWords.map((wid) => (
                        <WordCard key={wid} id={wid} word={getWord(wid)} variant="pool"
                          onClick={() => handlePoolClick(wid)} disabled={disabled} />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>}
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default WordRearrangePanel;
