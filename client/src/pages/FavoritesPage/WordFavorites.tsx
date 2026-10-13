import React, { useState } from 'react';
import { Heart, Volume2, Sparkles, BookMarked } from 'lucide-react';
import type { WordItem } from '@shared/api.interface';

interface WordFavoritesProps {
  items: WordItem[];
  onRemove: (id: string) => void;
}

// 词性标签颜色映射（参考 AGENTS.md 词性标签颜色）
const posColors: Record<string, { bg: string; text: string; border: string }> = {
  noun: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  verb: { bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.3)' },
  adjective: { bg: 'rgba(234, 179, 8, 0.15)', text: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' },
  adverb: { bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.3)' },
  preposition: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4', border: 'rgba(6, 182, 212, 0.3)' },
  pronoun: { bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  auxiliary: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  conjunction: { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF', border: 'rgba(107, 114, 128, 0.3)' },
  article: { bg: 'rgba(146, 64, 14, 0.15)', text: '#D97706', border: 'rgba(146, 64, 14, 0.3)' },
  numeral: { bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
};

const posLabels: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  preposition: '介词',
  pronoun: '代词',
  auxiliary: '助动词',
  conjunction: '连词',
  article: '冠词',
  numeral: '数词',
};

const WordFavorites: React.FC<WordFavoritesProps> = ({ items, onRemove }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ): void => {
    e.stopPropagation();
    onRemove(id);
  };

  const selectedWord = items.find((w) => w.id === selectedId);
  const posColor = selectedWord
    ? posColors[selectedWord.partOfSpeech || 'noun'] || posColors.noun
    : posColors.noun;

  // 空状态
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(26, 22, 53, 0.3) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            background:
              'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          }}
        >
          <BookMarked className="w-14 h-14" style={{ color: '#2563EB' }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: '#F1F5F9' }}
        >
          暂无珍藏单词
        </h3>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          在单词训练中点亮❤️，把喜欢的词加入珍藏夹
        </p>
        <button
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          去背单词
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
        data-ai-section-type="card-list"
      >
        {items.map((word) => {
          const color = posColors[word.partOfSpeech || 'noun'] || posColors.noun;
          return (
            <div
              key={word.id}
              onClick={() => setSelectedId(word.id)}
              className="rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(26, 22, 53, 0.8)',
                border: `1px solid ${color.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${color.bg}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* 顶部光晕装饰 */}
              <div
                className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 blur-2xl"
                style={{ backgroundColor: color.text }}
              />

              {/* 顶栏：单词 + 珍藏按钮 */}
              <div className="flex items-start justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3
                    className="text-xl font-bold truncate group-hover:scale-105 transition-transform origin-left"
                    style={{ color: '#F1F5F9' }}
                  >
                    {word.word}
                  </h3>
                  <button
                    className="p-1 rounded-full flex-shrink-0 transition-colors hover:bg-white/5"
                    style={{ color: '#64748B' }}
                    title="朗读发音"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={(e) => handleRemoveClick(e, word.id)}
                  className="p-1.5 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0 ml-2"
                  style={{ color: '#EF476F' }}
                  title="移出珍藏"
                >
                  <Heart
                    className="w-4 h-4"
                    style={{ fill: '#EF476F' }}
                  />
                </button>
              </div>

              {/* 音标 */}
              {word.phonetic && (
                <p
                  className="text-sm mb-3 font-mono"
                  style={{ color: '#E879F9' }}
                >
                  /{word.phonetic}/
                </p>
              )}

              {/* 词性标签 */}
              <div className="mb-3">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                >
                  {posLabels[word.partOfSpeech || 'noun'] || word.partOfSpeech}
                </span>
              </div>

              {/* 释义 */}
              <p
                className="text-sm line-clamp-2 leading-relaxed"
                style={{ color: '#94A3B8' }}
              >
                {word.meaning}
              </p>
            </div>
          );
        })}
      </div>

      {/* 单词详情弹窗 */}
      {selectedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(13, 11, 31, 0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 relative"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: '0 20px 60px rgba(99, 102, 241, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: '#64748B', backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              ✕
            </button>

            {/* 单词 */}
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: '#F1F5F9' }}
            >
              {selectedWord.word}
            </h2>

            {/* 音标 + 发音 */}
            <div className="flex items-center gap-3 mb-6">
              {selectedWord.phonetic && (
                <span
                  className="text-base font-mono"
                  style={{ color: '#E879F9' }}
                >
                  /{selectedWord.phonetic}/
                </span>
              )}
              <button
                className="p-1.5 rounded-full transition-colors hover:bg-white/10"
                style={{ color: '#06B6D4' }}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* 词性 */}
            <div className="mb-4">
              <span
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{
                  backgroundColor: posColor.bg,
                  color: posColor.text,
                  border: `1px solid ${posColor.border}`,
                }}
              >
                {posLabels[selectedWord.partOfSpeech || 'noun'] ||
                  selectedWord.partOfSpeech}
              </span>
            </div>

            {/* 释义 */}
            <div>
              <p
                className="text-xs uppercase tracking-wider mb-2"
                style={{ color: '#64748B' }}
              >
                中文释义
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: '#F1F5F9' }}
              >
                {selectedWord.meaning}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WordFavorites;
