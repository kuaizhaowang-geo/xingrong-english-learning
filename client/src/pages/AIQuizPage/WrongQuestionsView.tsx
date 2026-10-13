import React, { useState, useEffect } from 'react';
import {
  BookX,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  CheckSquare,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { questionsApi } from '@client/src/api';
import type { AIWrongQuestion, Question } from '@shared/api.interface';

interface WrongQuestionsViewProps {
  subject: string;
}

const WrongQuestionsView: React.FC<WrongQuestionsViewProps> = ({ subject }) => {
  const [items, setItems] = useState<AIWrongQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 10;

  useEffect(() => {
    void fetchWrongQuestions();
  }, [subject, page]);

  const fetchWrongQuestions = async (): Promise<void> => {
    setLoading(true);
    setExpandedId(null);
    try {
      const res = await questionsApi.listAIWrongQuestions({
        subject,
        mastered: false,
        page,
        pageSize,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('获取错题本失败', err as Error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string): void => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleMarkMastered = (id: string): void => {
    // UI 占位，暂不接后端
    setMasteredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderDetail = (wq: AIWrongQuestion): React.ReactNode => {
    const q: Question | undefined = wq.question;
    if (!q) return null;
    const isChoice =
      q.questionType === 'choice' ||
      q.questionType === 'spelling_choice' ||
      q.questionType === 'pinyin_choice' ||
      q.questionType === 'reading_comprehension' ||
      q.questionType === 'true_false';

    return (
      <div
        className="p-4 rounded-xl"
        style={{
           background: 'rgba(255, 255, 255, 0.8)',
           border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
         <p className="text-sm leading-relaxed mb-3" style={{ color: '#1E293B' }}>
          {q.stem}
        </p>

        {isChoice && q.options && (
          <div className="space-y-2 mb-3">
            {q.options.map((opt) => {
              const isCorrectOpt =
                opt.label.toUpperCase() === q.answer.toUpperCase();
              return (
                <div
                  key={opt.label}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{
                    background: isCorrectOpt
                      ? 'rgba(34, 211, 238, 0.1)'
                      : '#F8FAFC',
                    border: isCorrectOpt
                      ? '1px solid rgba(34, 211, 238, 0.6)'
                      : '1px solid rgba(99, 102, 241, 0.08)',
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isCorrectOpt ? '#06B6D4' : '#E0E7FF',
                      color: '#fff',
                    }}
                  >
                    {opt.label}
                  </span>
                   <span className="flex-1 text-xs" style={{ color: '#475569' }}>
                    {opt.content}
                  </span>
                  {isCorrectOpt && (
                    <CheckCircle2 size={14} style={{ color: '#06B6D4' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isChoice && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-xs">
               <span style={{ color: '#64748B' }}>正确答案：</span>
              <span style={{ color: '#06B6D4' }}>{q.answer}</span>
            </div>
          </div>
        )}

        {q.analysis && (
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{
              background: 'rgba(34, 211, 238, 0.08)',
              border: '1px solid rgba(34, 211, 238, 0.2)',
            }}
          >
            <Lightbulb size={14} style={{ color: '#06B6D4', flexShrink: 0 }} />
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: '#06B6D4' }}
              >
                解析
              </p>
               <p className="text-xs" style={{ color: '#475569' }}>
                 {q.analysis}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleMarkMastered(wq.id)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
            style={{
              background: masteredIds.has(wq.id)
                ? 'rgba(34, 211, 238, 0.15)'
                 : '#F8FAFC',
               color: masteredIds.has(wq.id) ? '#06B6D4' : '#64748B',
               border: masteredIds.has(wq.id)
                 ? '1px solid rgba(34, 211, 238, 0.4)'
                 : '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <CheckSquare size={14} />
            {masteredIds.has(wq.id) ? '已标记掌握' : '标记已掌握'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
       <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        共 {total} 道错题，坚持复习，错题越来越少 💪
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2
            className="animate-spin"
            size={40}
            style={{ color: '#6366F1' }}
          />
           <p style={{ color: '#64748B' }}>加载中...</p>
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl py-20 flex flex-col items-center gap-4"
          style={{
             background: 'rgba(255, 255, 255, 0.8)',
             border: '1px solid rgba(99, 102, 241, 0.15)',
          }}
        >
          <CheckCircle2 size={64} style={{ color: '#06B6D4' }} />
           <h3 className="text-lg font-medium" style={{ color: '#1E293B' }}>
            太棒了！暂无错题
          </h3>
          <p className="text-sm" style={{ color: '#64748B' }}>
            继续保持，你的学习效果非常好
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((wq) => {
            const isExpanded = expandedId === wq.id;
            const lastWrong = wq.lastWrongAt
              ? new Date(wq.lastWrongAt).toLocaleDateString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                })
              : '';

            return (
              <div
                key={wq.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                   background: 'rgba(255, 255, 255, 0.8)',
                   border: '1px solid rgba(239, 71, 111, 0.2)',
                }}
              >
                <button
                  onClick={() => handleToggle(wq.id)}
                  className="w-full p-4 flex items-start gap-3 text-left transition-colors"
                  style={{
                    background: isExpanded
                      ? 'rgba(239, 71, 111, 0.05)'
                      : 'transparent',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(239, 71, 111, 0.15)',
                    }}
                  >
                    <XCircle size={18} style={{ color: '#EF476F' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                       className="text-sm leading-relaxed line-clamp-2"
                       style={{ color: '#1E293B' }}
                     >
                       {wq.question?.stem || '题目加载失败'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span
                        className="px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgba(239, 71, 111, 0.1)',
                          color: '#F87171',
                          border: '1px solid rgba(239, 71, 111, 0.2)',
                        }}
                      >
                        错误 {wq.wrongCount} 次
                      </span>
                      <span style={{ color: '#64748B' }}>
                        最近：{lastWrong}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 mt-1">
                    {isExpanded ? (
                       <ChevronDown size={18} style={{ color: '#64748B' }} />
                     ) : (
                       <ChevronRight size={18} style={{ color: '#64748B' }} />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="border-t px-4 py-3"
                    style={{
                       borderColor: 'rgba(239, 71, 111, 0.2)',
                       background: 'rgba(248, 250, 252, 0.8)',
                    }}
                  >
                    {renderDetail(wq)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
               background: '#F8FAFC',
               color: '#64748B',
               border: '1px solid rgba(99, 102, 241, 0.15)',
             }}
           >
             上一页
          </button>
           <span className="text-sm px-4" style={{ color: '#64748B' }}>
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
               background: '#F8FAFC',
               color: '#64748B',
               border: '1px solid rgba(99, 102, 241, 0.15)',
             }}
           >
             下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default WrongQuestionsView;
