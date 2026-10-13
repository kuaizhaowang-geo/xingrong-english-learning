import React from 'react';
import { ChevronLeft, ChevronRight, Target, Zap } from 'lucide-react';
import type { WordbookStudyMode } from '@shared/api.interface';

const MODE_LABELS: Record<WordbookStudyMode, string> = {
  typing: '打字练习',
  dictation: '听写模式',
  following: '跟读模式',
  speaking: '看说模式',
  pinyin: '拼音打字',
  'character-write': '生字听写',
  'pinyin-read': '看拼音写汉字',
  'text-read': '课文跟读',
  'mental-math': '口算练习',
  'formula-memory': '公式记忆',
  'knowledge-review': '知识点复习',
  choice: '选择题练习',
};

interface StudyHeaderProps {
  wordbookName: string;
  mode: WordbookStudyMode;
  currentIndex: number;
  total: number;
  accuracy: number;
  onBack: () => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = ({
  wordbookName,
  mode,
  currentIndex,
  total,
  accuracy,
  onBack,
}) => {
  return (
    <header
      className="sticky top-0 z-10 px-6 py-4 border-b"
      style={{
        borderColor: 'rgba(99, 102, 241, 0.12)',
        background: 'rgba(13, 11, 31, 0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <ChevronLeft className="w-5 h-5" style={{ color: '#F1F5F9' }} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="text-base font-semibold truncate"
              style={{ color: '#F1F5F9' }}
            >
              {wordbookName}
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#818CF8',
              }}
            >
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm shrink-0">
          <div className="flex items-center gap-1" style={{ color: '#94A3B8' }}>
            <Target className="w-4 h-4" />
            <span>
              {currentIndex + 1}/{total}
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: '#06B6D4' }}>
            <Zap className="w-4 h-4" />
            <span>{accuracy}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};

interface StudyFooterProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export const StudyFooter: React.FC<StudyFooterProps> = ({
  currentIndex,
  total,
  onPrev,
  onNext,
}) => {
  return (
    <footer
      className="px-6 py-4 border-t"
      style={{
        borderColor: 'rgba(99, 102, 241, 0.12)',
        background: 'rgba(13, 11, 31, 0.9)',
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            color: '#F1F5F9',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </button>

        <div className="text-xs" style={{ color: '#64748B' }}>
          Enter 提交/下一题 · ← → 切换题目
        </div>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          {currentIndex >= total - 1 ? '完成' : '下一题'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
