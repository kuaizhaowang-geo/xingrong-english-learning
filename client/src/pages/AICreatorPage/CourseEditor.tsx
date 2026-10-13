import React, { useState } from 'react';
import { ArrowLeft, Save, Upload, BookOpen, MessageSquare } from 'lucide-react';
import type { AIWordItem, AISentenceItem } from '@shared/api.interface';
import CourseInfoPanel from './CourseInfoPanel';
import WordListEditor from './WordListEditor';
import SentenceListEditor from './SentenceListEditor';

export interface EditableCourse {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  category: string;
  tags: string[];
  words: AIWordItem[];
  sentences: AISentenceItem[];
}

interface CourseEditorProps {
  course: EditableCourse;
  onChange: (course: EditableCourse) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({
  course,
  onChange,
  onBack,
  onSaveDraft,
  onPublish,
}) => {
  const [activeTab, setActiveTab] = useState<'words' | 'sentences'>('words');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateField = <K extends keyof EditableCourse>(
    field: K,
    value: EditableCourse[K],
  ): void => {
    onChange({ ...course, [field]: value });
  };

  // === 单词操作 ===
  const addWord = (): void => {
    const newWord: AIWordItem = { word: '', meaning: '', phonetic: '', example: '' };
    onChange({ ...course, words: [...course.words, newWord] });
  };

  const updateWord = (index: number, field: keyof AIWordItem, value: string): void => {
    const newWords = [...course.words];
    newWords[index] = { ...newWords[index], [field]: value };
    onChange({ ...course, words: newWords });
  };

  const removeWord = (index: number): void => {
    const newWords = course.words.filter((_: AIWordItem, i: number) => i !== index);
    onChange({ ...course, words: newWords });
  };

  // === 句子操作 ===
  const addSentence = (): void => {
    const newSentence: AISentenceItem = {
      sentence: '',
      translation: '',
      components: [],
    };
    onChange({ ...course, sentences: [...course.sentences, newSentence] });
  };

  const updateSentence = (
    index: number,
    field: keyof AISentenceItem,
    value: string,
  ): void => {
    const newSentences = [...course.sentences];
    newSentences[index] = { ...newSentences[index], [field]: value };
    onChange({ ...course, sentences: newSentences });
  };

  const removeSentence = (index: number): void => {
    const newSentences = course.sentences.filter(
      (_: AISentenceItem, i: number) => i !== index,
    );
    onChange({ ...course, sentences: newSentences });
  };

  // === 拖拽排序 ===
  const handleDragStart = (index: number): void => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleDropWord = (targetIndex: number): void => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newWords = [...course.words];
    const [removed] = newWords.splice(dragIndex, 1);
    newWords.splice(targetIndex, 0, removed);
    onChange({ ...course, words: newWords });
    setDragIndex(null);
  };

  const handleDropSentence = (targetIndex: number): void => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newSentences = [...course.sentences];
    const [removed] = newSentences.splice(dragIndex, 1);
    newSentences.splice(targetIndex, 0, removed);
    onChange({ ...course, sentences: newSentences });
    setDragIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">返回</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onSaveDraft}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={onPublish}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg"
          >
            <Upload className="w-4 h-4" />
            发布课程
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：课程信息 */}
        <div className="lg:col-span-1">
          <CourseInfoPanel
            title={course.title}
            description={course.description}
            coverColor={course.coverColor}
            category={course.category}
            tags={course.tags}
            onTitleChange={(v) => updateField('title', v)}
            onDescriptionChange={(v) => updateField('description', v)}
            onCoverColorChange={(v) => updateField('coverColor', v)}
            onCategoryChange={(v) => updateField('category', v)}
            onTagsChange={(tags) => updateField('tags', tags)}
          />
        </div>

        {/* 右侧：单词/句子列表 */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('words')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'words'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/30'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                单词列表
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">
                  {course.words.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sentences')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sentences'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/30'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                句子列表
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">
                  {course.sentences.length}
                </span>
              </button>
            </div>

            <div className="p-5 max-h-[600px] overflow-y-auto">
              {activeTab === 'words' && (
                <WordListEditor
                  words={course.words}
                  dragIndex={dragIndex}
                  onAdd={addWord}
                  onUpdate={updateWord}
                  onRemove={removeWord}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDropWord}
                />
              )}
              {activeTab === 'sentences' && (
                <SentenceListEditor
                  sentences={course.sentences}
                  dragIndex={dragIndex}
                  onAdd={addSentence}
                  onUpdate={updateSentence}
                  onRemove={removeSentence}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDropSentence}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
