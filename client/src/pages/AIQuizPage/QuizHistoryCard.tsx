import React from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { AIQuiz, AIQuizQuestion, Question } from '@shared/api.interface';

interface QuizHistoryCardProps {
  quiz: AIQuiz;
  isExpanded: boolean;
  detailQuestions: AIQuizQuestion[];
  detailLoading: boolean;
  onToggle: (id: string) => void;
}

const GRADE_LABELS: Record<string, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级',
};

const SEMESTER_LABELS: Record<string, string> = {
  upper: '上册',
  lower: '下册',
};

const TYPE_LABELS: Record<string, string> = {
  choice: '选择题',
  spelling_choice: '拼写选择',
  fill_in_the_blank: '填空题',
  fill_in_blank: '填空题',
  sentence_arrangement: '句子排序',
  reading_comprehension: '阅读理解',
  calculation: '计算题',
  word_problem: '应用题',
  true_false: '判断题',
  pinyin_choice: '拼音选择',
  poem_recitation: '古诗背诵',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const isChoiceType = (qType: string): boolean =>
  qType === 'choice' ||
  qType === 'spelling_choice' ||
  qType === 'pinyin_choice' ||
  qType === 'reading_comprehension' ||
  qType === 'true_false';

const renderQuestionDetail = (qq: AIQuizQuestion): React.ReactNode => {
  const q: Question | undefined = qq.question;
  if (!q) return null;

  return (
    <div
      className="p-4 rounded-xl"
      style={{
         background: 'rgba(255, 255, 255, 0.8)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
       }}
     >
       <div className="flex items-center justify-between mb-3">
         <span className="text-xs font-medium" style={{ color: '#64748B' }}>
          第 {qq.questionOrder} 题
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: qq.isCorrect
              ? 'rgba(34, 211, 238, 0.1)'
              : 'rgba(239, 71, 111, 0.1)',
            color: qq.isCorrect ? '#06B6D4' : '#EF476F',
            border: qq.isCorrect
              ? '1px solid rgba(34, 211, 238, 0.3)'
              : '1px solid rgba(239, 71, 111, 0.3)',
          }}
        >
          {qq.isCorrect ? '正确' : '错误'}
        </span>
      </div>

       <p className="text-sm leading-relaxed mb-3" style={{ color: '#1E293B' }}>
        {q.stem}
      </p>

      {isChoiceType(q.questionType) && q.options && (
        <div className="space-y-2 mb-3">
          {q.options.map((opt) => {
            const isCorrectOpt =
              opt.label.toUpperCase() === q.answer.toUpperCase();
            const isUserSelect =
              qq.userAnswer?.toUpperCase() === opt.label.toUpperCase();
            let borderColor = 'rgba(99, 102, 241, 0.08)';
            let bgColor = '#F8FAFC';
            if (isCorrectOpt) {
              borderColor = 'rgba(34, 211, 238, 0.6)';
              bgColor = 'rgba(34, 211, 238, 0.1)';
            } else if (isUserSelect && !isCorrectOpt) {
              borderColor = 'rgba(239, 71, 111, 0.6)';
              bgColor = 'rgba(239, 71, 111, 0.1)';
            }
            return (
              <div
                key={opt.label}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isCorrectOpt
                      ? '#06B6D4'
                      : isUserSelect
                        ? '#EF476F'
                        : '#E0E7FF',
                    color: '#fff',
                  }}
                >
                  {opt.label}
                </span>
                 <span className="flex-1 text-xs" style={{ color: '#475569' }}>
                  {opt.content}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!isChoiceType(q.questionType) && (
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex items-center gap-2">
             <span style={{ color: '#64748B' }}>你的答案：</span>
            <span
              style={{
                color: qq.isCorrect ? '#06B6D4' : '#EF476F',
              }}
            >
              {qq.userAnswer || '未作答'}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
    </div>
  );
};

const QuizHistoryCard: React.FC<QuizHistoryCardProps> = ({
  quiz,
  isExpanded,
  detailQuestions,
  detailLoading,
  onToggle,
}) => {
  const score = quiz.score ?? 0;
  const correct = quiz.correctCount ?? 0;
  const totalQ = quiz.totalCount;
  const gradeLabel = GRADE_LABELS[quiz.grade] || quiz.grade;
  const semesterLabel = SEMESTER_LABELS[quiz.semester] || quiz.semester;
  const typeLabel = TYPE_LABELS[quiz.questionType] || quiz.questionType;
  const diffLabel = DIFFICULTY_LABELS[quiz.difficulty] || quiz.difficulty;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
         background: 'rgba(255, 255, 255, 0.8)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
      }}
    >
      <button
        onClick={() => onToggle(quiz.id)}
        className="w-full p-5 flex items-center gap-4 text-left transition-colors hover:bg-opacity-80"
        style={{
          background: isExpanded ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Sparkles size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
               className="text-sm font-semibold"
               style={{ color: '#1E293B' }}
             >
              {gradeLabel}
              {semesterLabel}
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(34, 211, 238, 0.1)',
                color: '#06B6D4',
                border: '1px solid rgba(34, 211, 238, 0.2)',
              }}
            >
              {typeLabel}
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                color: '#818CF8',
                border: '1px solid rgba(99, 102, 241, 0.12)',
              }}
            >
              {diffLabel}
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              {totalQ} 题
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span style={{ color: '#64748B' }}>
              {quiz.createdAt
                ? new Date(quiz.createdAt).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background:
                  quiz.status === 'completed'
                    ? 'rgba(34, 211, 238, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                color:
                  quiz.status === 'completed' ? '#06B6D4' : '#F59E0B',
              }}
            >
              {quiz.status === 'completed'
                ? '已完成'
                : quiz.status === 'in_progress'
                  ? '进行中'
                  : '待开始'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {quiz.status === 'completed' && (
            <div className="text-right">
              <div
                className="text-xl font-bold"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {score}
              </div>
              <div className="text-xs" style={{ color: '#64748B' }}>
                {correct}/{totalQ}
              </div>
            </div>
          )}
          {isExpanded ? (
           <ChevronDown size={20} style={{ color: '#64748B' }} />
           ) : (
             <ChevronRight size={20} style={{ color: '#64748B' }} />
          )}
        </div>
      </button>

      {isExpanded && (
        <div
          className="border-t px-5 py-4 space-y-3"
          style={{
             borderColor: 'rgba(99, 102, 241, 0.15)',
             background: 'rgba(248, 250, 252, 0.8)',
          }}
        >
          {detailLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2
                className="animate-spin"
                size={20}
                style={{ color: '#6366F1' }}
              />
               <span className="text-sm" style={{ color: '#64748B' }}>
                 加载详情中...
              </span>
            </div>
          ) : detailQuestions.length === 0 ? (
            <div
              className="text-center py-6 text-sm"
              style={{ color: '#64748B' }}
            >
              暂无题目详情
            </div>
          ) : (
            <div className="space-y-3">
              {detailQuestions.map((qq) => (
                <React.Fragment key={qq.id}>
                  {renderQuestionDetail(qq)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizHistoryCard;
