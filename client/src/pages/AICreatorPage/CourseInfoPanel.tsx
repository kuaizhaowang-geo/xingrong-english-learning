import React, { useState } from 'react';
import { Type, BookOpen, Tag } from 'lucide-react';

interface CourseInfoPanelProps {
  title: string;
  description: string;
  coverColor: string;
  category: string;
  tags: string[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCoverColorChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onTagsChange: (tags: string[]) => void;
}

const coverColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
];

const categoryOptions = ['日常英语', '商务英语', '旅游英语', '考试英语', '少儿英语', '兴趣爱好'];

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({
  title,
  description,
  coverColor,
  category,
  tags,
  onTitleChange,
  onDescriptionChange,
  onCoverColorChange,
  onCategoryChange,
  onTagsChange,
}) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = (): void => {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) {
      setTagInput('');
      return;
    }
    onTagsChange([...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string): void => {
    onTagsChange(tags.filter((t: string) => t !== tag));
  };

  return (
    <div className="space-y-5">
      {/* 封面 */}
      <div className="backdrop-blur-xl bg-white/70 rounded-xl shadow-sm border border-white/60 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Type className="w-4 h-4 text-purple-500" />
          课程封面
        </h3>
        <div
          className={`w-full h-36 rounded-xl bg-gradient-to-br ${coverColor} mb-3 flex items-center justify-center relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <BookOpen className="w-12 h-12 text-white/80" />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {coverColors.map((color: string) => (
            <button
              key={color}
              onClick={() => onCoverColorChange(color)}
              className={`w-full aspect-square rounded-lg bg-gradient-to-br ${color} transition-all ${
                coverColor === color
                  ? 'ring-2 ring-purple-500 ring-offset-2 scale-110'
                  : 'hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="backdrop-blur-xl bg-white/70 rounded-xl shadow-sm border border-white/60 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-500" />
          课程信息
        </h3>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            课程标题
          </label>
          <input
            type="text"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onTitleChange(e.target.value)
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/80"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            课程描述
          </label>
          <textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onDescriptionChange(e.target.value)
            }
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/80 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
            分类
          </label>
          <select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onCategoryChange(e.target.value)
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/80"
          >
            {categoryOptions.map((cat: string) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
            <Tag className="w-3 h-3" />
            标签
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-purple-800">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTagInput(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="添加标签"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/80"
            />
            <button
              onClick={addTag}
              className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseInfoPanel;
