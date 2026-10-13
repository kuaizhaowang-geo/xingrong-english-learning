import React, { useState } from 'react';
import type { ReviewItem } from '@shared/api.interface';
import {
  CheckCircle2,
  Clock,
  CalendarClock,
  RefreshCw,
  Trash2,
  ChevronDown,
  Sparkles,
  Play,
} from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: '', label: '全部学科' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
];

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'sentence', label: '句子' },
  { value: 'word', label: '单词' },
  { value: 'character', label: '生字' },
  { value: 'question', label: '题目' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isTodayDue(nextReviewTime: string): boolean {
  if (!nextReviewTime) return false;
  const now = new Date();
  const next = new Date(nextReviewTime);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return next >= todayStart && next < todayEnd;
}

interface ReviewCardProps {
  item: ReviewItem;
  onMaster: (id: string) => void;
  onDelete: (id: string) => void;
  onReview: (id: string, isCorrect: boolean) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  item,
  onMaster,
  onDelete,
  onReview,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const todayDue = isTodayDue(item.nextReviewTime);
  const subjectLabel =
    SUBJECT_OPTIONS.find((s) => s.value === item.subject)?.label ||
    item.subject;
  const typeLabel =
    TYPE_OPTIONS.find((t) => t.value === item.itemType)?.label || item.itemType;

  const handleStartReview = () => {
    setShowAnswer(true);
    setReviewing(true);
  };

  const handleReviewResult = (isCorrect: boolean) => {
    onReview(item.id, isCorrect);
    setReviewing(false);
    setShowAnswer(false);
  };

  return (
    <div
      className="rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 group"
      style={{
        background: 'rgba(26, 22, 53, 0.8)',
        border: todayDue
          ? '2px solid rgba(34, 211, 238, 0.7)'
          : '1px solid rgba(99, 102, 241, 0.12)',
        boxShadow: todayDue
          ? '0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(34, 211, 238, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* 顶部标签行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-full"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818CF8',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            {subjectLabel}
          </span>
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-full"
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            {typeLabel}
          </span>
          {item.status === 'mastered' && (
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1"
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ADE80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <CheckCircle2 size={12} />
              已掌握
            </span>
          )}
          {todayDue && (
            <span
              className="px-2 py-0.5 text-xs font-bold rounded-full flex items-center gap-1"
              style={{
                background: 'rgba(34, 211, 238, 0.2)',
                color: '#06B6D4',
                border: '1px solid rgba(34, 211, 238, 0.5)',
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.3)',
              }}
            >
              <Sparkles size={12} />
              今日到期
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{ color: '#64748B' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#EF476F';
            e.currentTarget.style.background = 'rgba(239, 71, 111, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 内容 */}
      <div
        className="text-lg font-medium mb-2 leading-relaxed"
        style={{ color: '#F1F5F9' }}
      >
        {item.content}
      </div>

      {/* 答案/翻译 - 可展开 */}
      {item.answer && (
        <div className="mb-3">
          {showAnswer ? (
            <div
              className="text-sm p-3 rounded-lg"
              style={{
                background: 'rgba(34, 211, 238, 0.08)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                color: '#67E8F9',
              }}
            >
              {item.answer}
            </div>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              className="text-sm flex items-center gap-1 transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#818CF8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94A3B8';
              }}
            >
              <ChevronDown size={14} />
              点击查看答案
            </button>
          )}
        </div>
      )}

      {/* 元信息 */}
      <div
        className="flex flex-wrap items-center gap-4 text-xs mb-4 pt-3"
        style={{
          borderTop: '1px solid rgba(99, 102, 241, 0.08)',
          color: '#64748B',
        }}
      >
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>标记：{formatDate(item.markTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <RefreshCw size={12} />
          <span>复习 {item.reviewCount} 次</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarClock size={12} />
          <span>下次：{formatDate(item.nextReviewTime)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      {reviewing ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleReviewResult(true)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(34, 211, 238, 0.15)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              color: '#06B6D4',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.25)';
              e.currentTarget.style.boxShadow =
                '0 0 12px rgba(34, 211, 238, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 211, 238, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✓ 记住了
          </button>
          <button
            onClick={() => handleReviewResult(false)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(239, 71, 111, 0.15)',
              border: '1px solid rgba(239, 71, 111, 0.4)',
              color: '#F472B6',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 71, 111, 0.25)';
              e.currentTarget.style.boxShadow =
                '0 0 12px rgba(239, 71, 111, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 71, 111, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✗ 没记住
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartReview}
            className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.3) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#E2E8F0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(59, 130, 246, 0.5) 100%)';
              e.currentTarget.style.boxShadow =
                '0 0 16px rgba(99, 102, 241, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.3) 100%)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Play size={14} />
            开始复习
          </button>
          {item.status !== 'mastered' && (
            <button
              onClick={() => onMaster(item.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ADE80',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
              }}
            >
              标记掌握
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
