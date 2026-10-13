import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  BookX,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi } from '@client/src/api';
import { getSubjectIllustration } from '@client/src/utils/practice-illustrations';
import { Image } from '@client/src/components/ui/image';
import type {
  TextbookTreeItem,
  TextbookUnit,
  ChineseLesson,
  MathTopic,
  UnitLessonsResponse,
} from '@shared/api.interface';

type SubjectType = 'chinese' | 'math';

type SemesterType = 'upper' | 'lower';

interface SubjectTreeViewProps {
  subject: SubjectType;
  activeGrade: string;
  semester: SemesterType;
  onSelectLesson: (lessonId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onAIQuiz?: (unit: { id: string; title: string; topic?: string }) => void;
}

interface ExpandedUnitData {
  chineseLessons?: ChineseLesson[];
  mathTopics?: MathTopic[];
  loading?: boolean;
}

interface TextbookWithExpand extends TextbookTreeItem {
  expanded?: boolean;
  unitData?: Record<string, ExpandedUnitData>;
}

const GRADE_LABELS: Record<string, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级',
};

const SEMESTER_LABELS: Record<SemesterType, string> = {
  upper: '上册',
  lower: '下册',
};

const SubjectTreeView: React.FC<SubjectTreeViewProps> = ({
  subject,
  activeGrade,
  semester,
  onSelectLesson,
  onSelectTopic,
  onAIQuiz,
}) => {
  const [treeData, setTreeData] = useState<TextbookWithExpand[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTextbookId, setExpandedTextbookId] = useState<string | null>(
    null,
  );
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());

  const isChinese = subject === 'chinese';

  useEffect(() => {
    fetchTree();
  }, [subject]);

  // 切换学期时重置展开状态
  useEffect(() => {
    setExpandedTextbookId(null);
    setExpandedUnitIds(new Set());
  }, [semester]);

  const fetchTree = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await textbooksApi.getTextbookTree(subject);
      const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
      setTreeData(sorted);
      setExpandedTextbookId(null);
    } catch (err) {
      logger.error('获取教材树失败', err as Error);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTextbooks = treeData.filter(
    (t) => t.grade === activeGrade && t.semester === semester,
  );

  const handleToggleTextbook = (textbookId: string): void => {
    if (expandedTextbookId === textbookId) {
      setExpandedTextbookId(null);
    } else {
      setExpandedTextbookId(textbookId);
    }
  };

  const handleToggleUnit = async (
    textbookId: string,
    unit: TextbookUnit,
  ): Promise<void> => {
    const isExpanded = expandedUnitIds.has(unit.id);

    if (isExpanded) {
      // 收起
      setExpandedUnitIds((prev) => {
        const next = new Set(prev);
        next.delete(unit.id);
        return next;
      });
      return;
    }

    // 展开
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      next.add(unit.id);
      return next;
    });

    // 如果数据已加载过，不重复请求
    const textbook = treeData.find((t) => t.id === textbookId);
    const existing = textbook?.unitData?.[unit.id];
    if (
      existing &&
      ((isChinese && existing.chineseLessons) ||
        (!isChinese && existing.mathTopics))
    ) {
      return;
    }

    // 设置 loading
    setTreeData((prev) =>
      prev.map((tb) => {
        if (tb.id !== textbookId) return tb;
        const unitData = tb.unitData ?? {};
        return {
          ...tb,
          unitData: {
            ...unitData,
            [unit.id]: { ...unitData[unit.id], loading: true },
          },
        };
      }),
    );

    try {
      const data: UnitLessonsResponse = await textbooksApi.getUnitLessons(
        textbookId,
        unit.id,
      );
      setTreeData((prev) =>
        prev.map((tb) => {
          if (tb.id !== textbookId) return tb;
          const unitData = tb.unitData ?? {};
          const sortedLessons = data.chineseLessons
            ? [...data.chineseLessons].sort((a, b) => a.lessonOrder - b.lessonOrder)
            : [];
          const sortedTopics = data.mathTopics
            ? [...data.mathTopics].sort((a, b) => a.topicOrder - b.topicOrder)
            : [];
          return {
            ...tb,
            unitData: {
              ...unitData,
              [unit.id]: {
                chineseLessons: sortedLessons,
                mathTopics: sortedTopics,
                loading: false,
              },
            },
          };
        }),
      );
    } catch (err) {
      logger.error('获取单元内容失败', err as Error);
      setTreeData((prev) =>
        prev.map((tb) => {
          if (tb.id !== textbookId) return tb;
          const unitData = tb.unitData ?? {};
          return {
            ...tb,
            unitData: {
              ...unitData,
              [unit.id]: { ...unitData[unit.id], loading: false },
            },
          };
        }),
      );
    }
  };

  const isUnitExpanded = (unitId: string): boolean => {
    return expandedUnitIds.has(unitId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2
          className={isChinese ? 'text-red-500 animate-spin' : 'text-blue-500 animate-spin'}
          size={40}
        />
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (filteredTextbooks.length === 0) {
    return (
      <div className="glass-card py-20 flex flex-col items-center gap-4">
         <BookX className="text-slate-500" size={64} />
         <h3 className="text-lg font-medium text-slate-300">暂无内容</h3>
         <p className="text-sm text-slate-500">
          {GRADE_LABELS[activeGrade] || '该年级'}{SEMESTER_LABELS[semester] || ''}的
          {isChinese ? '语文' : '数学'}教材正在准备中，敬请期待
        </p>
        <button
          onClick={fetchTree}
          className={`mt-2 px-6 py-2 rounded-full text-white text-sm font-medium transition-colors ${
            isChinese
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTextbooks.map((textbook) => {
        const isTextbookExpanded = expandedTextbookId === textbook.id;
        const sortedUnits = [...(textbook.units ?? [])].sort(
          (a, b) => a.unitOrder - b.unitOrder,
        );

        return (
          <div
            key={textbook.id}
            className="glass-card overflow-hidden transition-all hover:shadow-lg"
          >
            <button
              onClick={() => handleToggleTextbook(textbook.id)}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
            >
              <Image
                src={getSubjectIllustration(subject)}
                alt={textbook.title}
                width={64}
                height={80}
                className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                 <h3 className="text-lg font-semibold text-white truncate">
                    {textbook.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                  {textbook.publisher} · {textbook.grade}
                  {textbook.semester}
                </p>
                <div className="flex items-center gap-4 mt-2">
                   <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                     <BookOpen size={12} />
                     {textbook.totalUnits || 0} 个单元
                   </span>
                   {textbook.description && (
                     <span className="text-xs text-slate-500 truncate max-w-xs">
                      {textbook.description}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {isTextbookExpanded ? (
                   <ChevronDown className="text-slate-500" size={24} />
                 ) : (
                   <ChevronRight className="text-slate-500" size={24} />
                )}
              </div>
            </button>

             {isTextbookExpanded && (
               <div className="border-t border-white/10 bg-white/5 p-4 space-y-3">
                {sortedUnits.map((unit) => {
                      const unitExpanded = isUnitExpanded(unit.id);
                      const unitData = textbook.unitData?.[unit.id];
                      const items = isChinese
                        ? unitData?.chineseLessons
                        : unitData?.mathTopics;

                  return (
                    <div
                      key={unit.id}
                       className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                    >
                      <button
                        onClick={() => handleToggleUnit(textbook.id, unit)}
                         className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold text-white flex-shrink-0 ${
                            isChinese ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        >
                          {unit.unitOrder}
                        </span>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-semibold text-white truncate">
                              {unit.title}
                            </h4>
                            {unit.topic && (
                              <p className="text-sm text-slate-400 mt-0.5 truncate">
                              {unit.topic}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {onAIQuiz && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAIQuiz({
                                  id: unit.id,
                                  title: unit.title,
                                  topic: unit.topic,
                                });
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                              style={{
                                background:
                                  'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59,130,246,0.1) 100%)',
                                color: '#6366F1',
                                border: '1px solid rgba(99, 102, 241, 0.15)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.2) 100%)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59,130,246,0.1) 100%)';
                              }}
                            >
                              <Sparkles size={12} />
                              AI出题
                            </button>
                          )}
                          {unitData?.loading ? (
                            <Loader2
                              className={
                                isChinese
                                  ? 'text-red-500 animate-spin'
                                  : 'text-blue-500 animate-spin'
                              }
                              size={18}
                            />
                          ) : unitExpanded ? (
                             <ChevronDown className="text-slate-500" size={20} />
                           ) : (
                             <ChevronRight className="text-slate-500" size={20} />
                          )}
                        </div>
                      </button>

                       {unitExpanded && items && items.length > 0 && (
                         <div className="border-t border-white/10 bg-white/5 p-3 space-y-2">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (isChinese) {
                                  onSelectLesson(item.id);
                                } else {
                                  onSelectTopic(item.id);
                                }
                              }}
                               className="w-full p-3 flex items-center gap-3 bg-white/10 rounded-md border border-white/10 hover:border-fuchsia-500/30 hover:shadow-sm transition-all text-left"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                  isChinese ? 'bg-red-400' : 'bg-blue-400'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                 <span className="text-xs text-slate-500 mr-2">
                                   第 {item.lessonOrder ?? item.topicOrder ?? ''} 课
                                 </span>
                                 <span className="text-sm font-medium text-slate-200 truncate">
                                  {item.title}
                                </span>
                              </div>
                               <ChevronRight
                                 className="text-slate-500 flex-shrink-0"
                                 size={16}
                               />
                            </button>
                          ))}
                        </div>
                      )}

                       {unitExpanded && items && items.length === 0 && (
                         <div className="border-t border-white/10 bg-white/5 p-4 text-center text-sm text-slate-500">
                          暂无{isChinese ? '课文' : '知识点'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SubjectTreeView;
