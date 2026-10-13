import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { AIWordItem } from '@shared/api.interface';

interface WordListEditorProps {
  words: AIWordItem[];
  dragIndex: number | null;
  onAdd: () => void;
  onUpdate: (index: number, field: keyof AIWordItem, value: string) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (index: number) => void;
}

const partsOfSpeech = ['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'interj.'];

const WordListEditor: React.FC<WordListEditorProps> = ({
  words,
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
      {words.map((word: AIWordItem, idx: number) => (
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
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">
                  单词
                </label>
                <input
                  type="text"
                  value={word.word}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdate(idx, 'word', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 font-medium text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">
                  音标
                </label>
                <input
                  type="text"
                  value={word.phonetic || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdate(idx, 'phonetic', e.target.value)
                  }
                  placeholder="/..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 text-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">
                  词性
                </label>
                <select
                  value=""
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 text-gray-600"
                >
                  <option value="">词性</option>
                  {partsOfSpeech.map((pos: string) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">
                  中文释义
                </label>
                <input
                  type="text"
                  value={word.meaning}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdate(idx, 'meaning', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </div>
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {word.example && (
            <div className="mt-2 pl-7">
              <label className="text-[10px] text-gray-400 mb-1 block">
                例句
              </label>
              <input
                type="text"
                value={word.example}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate(idx, 'example', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300 text-gray-500 italic"
              />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 hover:bg-purple-50 hover:border-purple-300 transition-all flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        添加单词
      </button>
    </div>
  );
};

export default WordListEditor;
