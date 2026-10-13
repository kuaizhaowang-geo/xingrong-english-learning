import React from 'react';
import { Plus, Trash2, GripVertical, Languages, Lightbulb } from 'lucide-react';
import type { AISentenceItem } from '@shared/api.interface';

interface SentenceListEditorProps {
  sentences: AISentenceItem[];
  dragIndex: number | null;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof AISentenceItem, value: string) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (index: number) => void;
}

const SentenceListEditor: React.FC<SentenceListEditorProps> = ({
  sentences,
  dragIndex,
  onAdd,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  return (
    <div className="space-y-3">
      {sentences.map((sentence: AISentenceItem, idx: number) => (
        <div
          key={idx}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragOver={onDragOver}
          onDrop={() => onDrop(idx)}
          className={`p-4 rounded-xl border transition-all bg-white/80 ${
            dragIndex === idx
              ? 'border-purple-400 opacity-50'
              : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="cursor-grab text-gray-300 hover:text-gray-500 pt-2">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  英文句子
                </label>
                <input
                  type="text"
                  value={sentence.sentence}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdate(idx, 'sentence', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">
                  中文翻译
                </label>
                <input
                  type="text"
                  value={sentence.translation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdate(idx, 'translation', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  语法成分
                </label>
                <div className="flex flex-wrap gap-1">
                  {sentence.components && sentence.components.length > 0 ? (
                    sentence.components.map(
                      (comp: { type: string; text: string }, ci: number) => (
                        <span
                          key={ci}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs"
                        >
                          <span className="font-medium">{comp.type}</span>:{' '}
                          {comp.text}
                        </span>
                      ),
                    )
                  ) : (
                    <span className="text-xs text-gray-400">暂无语法成分标注</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 hover:bg-purple-50 hover:border-purple-300 transition-all flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        添加句子
      </button>
    </div>
  );
};

export default SentenceListEditor;
