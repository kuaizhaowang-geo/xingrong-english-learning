import React from 'react';
import { Heart, Volume2, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SentencePuzzle } from '@shared/api.interface';

interface SentenceFavoritesProps {
  items: SentencePuzzle[];
  onRemove: (id: string) => void;
}

const difficultyConfig: Record<
  number,
  { key: string; label: string; bg: string; text: string; border: string }
> = {
  1: {
    key: 'easy',
    label: '入门',
    bg: 'rgba(34, 197, 94, 0.12)',
    text: '#4ADE80',
    border: 'rgba(34, 197, 94, 0.25)',
  },
  2: {
    key: 'medium',
    label: '进阶',
    bg: 'rgba(250, 204, 21, 0.12)',
    text: '#FACC15',
    border: 'rgba(250, 204, 21, 0.25)',
  },
  3: {
    key: 'hard',
    label: '挑战',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#F87171',
    border: 'rgba(239, 68, 68, 0.25)',
  },
};

const SentenceFavorites: React.FC<SentenceFavoritesProps> = ({
  items,
  onRemove,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (id: string): void => {
    navigate(`/sentence-practice/${id}`);
  };

  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ): void => {
    e.stopPropagation();
    onRemove(id);
  };

  const getDifficulty = (diff: number) => {
    return difficultyConfig[diff] || difficultyConfig[1];
  };

  // 空状态
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(34, 211, 238, 0.06) 0%, rgba(26, 22, 53, 0.3) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.15)',
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            background:
              'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
          }}
        >
          <BookOpen className="w-14 h-14" style={{ color: '#06B6D4' }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: '#F1F5F9' }}
        >
          暂无珍藏句子
        </h3>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          在句子练习中遇到喜欢的句子，点亮❤️即可珍藏
        </p>
        <button
          onClick={() => navigate('/sentence-practice')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(34, 211, 238, 0.4)',
          }}
        >
          <ArrowRight className="w-4 h-4" />
          去练句子
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ai-section-type="card-list">
      {items.map((item) => {
        const diff = getDifficulty(item.difficulty);
        return (
          <div
            key={item.id}
            onClick={() => handleCardClick(item.id)}
            className="rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(26, 22, 53, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.12)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(99, 102, 241, 0.35)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 20px rgba(99, 102, 241, 0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(99, 102, 241, 0.12)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            {/* 左侧霓虹装饰条 */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{
                background:
                  'linear-gradient(180deg, #6366F1 0%, #2563EB 50%, #06B6D4 100%)',
                opacity: 0.6,
              }}
            />

            <div className="flex items-start gap-4 pl-2">
              <div className="flex-1 min-w-0">
                {/* 顶行：难度标签 */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: diff.bg,
                      color: diff.text,
                      border: `1px solid ${diff.border}`,
                    }}
                  >
                    {diff.label}
                  </span>
                </div>

                {/* 英文句子 */}
                <div className="flex items-start gap-2 mb-2">
                  <button
                    className="p-1 rounded-full flex-shrink-0 mt-0.5 transition-colors hover:bg-white/5"
                    style={{ color: '#64748B' }}
                    title="朗读"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <p
                    className="text-base font-medium leading-relaxed group-hover:text-violet-200 transition-colors"
                    style={{ color: '#F1F5F9' }}
                  >
                    {item.sentence}
                  </p>
                </div>

                {/* 中文翻译 */}
                <p
                  className="text-sm leading-relaxed pl-6"
                  style={{ color: '#94A3B8' }}
                >
                  {item.translation}
                </p>

                {/* 底部进入练习 */}
                <div className="flex items-center gap-1 mt-4 pl-6 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ color: '#06B6D4' }}
                >
                  <span>开始练习</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 珍藏按钮 */}
              <button
                onClick={(e) => handleRemoveClick(e, item.id)}
                className="p-2.5 rounded-xl transition-all duration-300 hover:scale-110 flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(239, 71, 111, 0.1)',
                  color: '#EF476F',
                  border: '1px solid rgba(239, 71, 111, 0.2)',
                }}
                title="移出珍藏"
              >
                <Heart
                  className="w-5 h-5"
                  style={{ fill: '#EF476F' }}
                />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SentenceFavorites;
