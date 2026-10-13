import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookX,
  Loader2,
  BookMarked,
  ArrowLeft,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { questionsApi } from '@client/src/api';
import type { AIQuiz, AIQuizQuestion } from '@shared/api.interface';
import WrongQuestionsView from './WrongQuestionsView';
import QuizHistoryCard from './QuizHistoryCard';

type SubjectType = 'chinese' | 'math' | 'english';
type ViewMode = 'history' | 'wrong';

const SUBJECT_TABS: { value: SubjectType; label: string }[] = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const AIQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSubject, setActiveSubject] = useState<SubjectType>('english');
  const [viewMode, setViewMode] = useState<ViewMode>('history');
  const [quizzes, setQuizzes] = useState<AIQuiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailQuestions, setDetailQuestions] = useState<AIQuizQuestion[]>([]);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const pageSize = 10;

  useEffect(() => {
    if (viewMode === 'history') {
      void fetchQuizzes();
    }
  }, [activeSubject, page, viewMode]);

  const fetchQuizzes = async (): Promise<void> => {
    setLoading(true);
    setExpandedId(null);
    setDetailQuestions([]);
    try {
      const res = await questionsApi.listAIQuizzes({
        subject: activeSubject,
        page,
        pageSize,
      });
      setQuizzes(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('获取AI出题记录失败', err as Error);
      setQuizzes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (quizId: string): Promise<void> => {
    if (expandedId === quizId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(quizId);
    setDetailLoadingId(quizId);
    try {
      const quiz = await questionsApi.getAIQuiz(quizId);
      const sorted = [...(quiz.questions ?? [])].sort(
        (a, b) => a.questionOrder - b.questionOrder,
      );
      setDetailQuestions(sorted);
    } catch (err) {
      logger.error('获取出题详情失败', err as Error);
      setDetailQuestions([]);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleSubjectChange = (subject: SubjectType): void => {
    setActiveSubject(subject);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.12)',
                 color: '#64748B',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.color = '#1E293B';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.color = '#64748B';
                 e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI 智能出题
              </h1>
               <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                查看历史出题记录与错题本
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('history')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                 background:
                   viewMode === 'history'
                     ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                      : 'rgba(255,255,255,0.05)',
                  color: viewMode === 'history' ? '#fff' : '#94A3B8',
                border:
                  viewMode === 'history'
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(99, 102, 241, 0.12)',
                boxShadow:
                  viewMode === 'history'
                    ? '0 0 16px rgba(99, 102, 241, 0.25)'
                    : 'none',
              }}
            >
              <Sparkles size={16} />
              历史记录
            </button>
            <button
              onClick={() => setViewMode('wrong')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background:
                  viewMode === 'wrong'
                    ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                     : '#F8FAFC',
                 color: viewMode === 'wrong' ? '#fff' : '#64748B',
                border:
                  viewMode === 'wrong'
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(99, 102, 241, 0.12)',
                boxShadow:
                  viewMode === 'wrong'
                    ? '0 0 16px rgba(99, 102, 241, 0.25)'
                    : 'none',
              }}
            >
              <BookMarked size={16} />
              错题本
            </button>
          </div>
        </div>

        {/* 错题本视图 */}
        {viewMode === 'wrong' && <WrongQuestionsView subject={activeSubject} />}

        {/* 历史记录视图 */}
        {viewMode === 'history' && (
          <>
            {/* 学科 Tab */}
            <div
              className="inline-flex rounded-xl p-1 mb-6"
               style={{
                  background: '#FFFFFF10',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
               }}
            >
              {SUBJECT_TABS.map((tab) => {
                const active = activeSubject === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleSubjectChange(tab.value)}
                    className="px-6 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                        : 'transparent',
                        color: active ? '#fff' : '#94A3B8',
                      boxShadow: active
                        ? '0 0 12px rgba(99, 102, 241, 0.25)'
                        : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 列表 */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2
                  className="animate-spin"
                  size={40}
                  style={{ color: '#6366F1' }}
                />
                  <p style={{ color: '#94A3B8' }}>加载中...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div
                className="rounded-2xl py-20 flex flex-col items-center gap-4"
                 style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                 }}
              >
                <BookX size={64} style={{ color: '#94A3B8' }} />
                 <h3 className="text-lg font-medium" style={{ color: '#CBD5E1' }}>
                  暂无出题记录
                </h3>
                <p className="text-sm" style={{ color: '#94A3B8' }}>
                  去教材同步页面体验 AI 智能出题吧
                </p>
                <button
                  onClick={() => navigate('/textbooks')}
                  className="mt-2 px-6 py-2 rounded-full text-sm font-medium text-white transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                    boxShadow: '0 2px 12px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  去出题
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <QuizHistoryCard
                    key={quiz.id}
                    quiz={quiz}
                    isExpanded={expandedId === quiz.id}
                    detailQuestions={
                      expandedId === quiz.id ? detailQuestions : []
                    }
                    detailLoading={detailLoadingId === quiz.id}
                    onToggle={handleExpand}
                  />
                ))}
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
                    background: '#FFFFFF10',
                    color: '#94A3B8',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                   }}
                 >
                   上一页
                </button>
                  <span className="text-sm px-4" style={{ color: '#94A3B8' }}>
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: '#FFFFFF10',
                    color: '#94A3B8',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                   }}
                 >
                   下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIQuizPage;
