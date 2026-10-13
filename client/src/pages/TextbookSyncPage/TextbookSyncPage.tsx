import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, BookOpen, Play, AlertCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getTextbooks, getTextbookDetail } from '@client/src/api/textbooks';
import type { Textbook, TextbookUnit } from '@shared/api.interface';

// ─── 类型定义 ─────────────────────────────────────────
type Subject = 'chinese' | 'math' | 'english';
type Stage = 'primary' | 'junior' | 'senior';
type Semester = 'upper' | 'lower';

interface FilterState {
  subject: Subject;
  stage: Stage;
  grade: string;
  semester: Semester;
  publisher: string;
}

// ─── 常量配置 ─────────────────────────────────────────
const SUBJECT_OPTIONS: { value: Subject; label: string }[] = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 'primary', label: '小学' },
  { value: 'junior', label: '初中' },
  { value: 'senior', label: '高中' },
];

const GRADE_MAP: Record<Stage, { value: string; label: string }[]> = {
  primary: [
    { value: 'grade1', label: '一年级' },
    { value: 'grade2', label: '二年级' },
    { value: 'grade3', label: '三年级' },
    { value: 'grade4', label: '四年级' },
    { value: 'grade5', label: '五年级' },
    { value: 'grade6', label: '六年级' },
  ],
  junior: [
    { value: 'grade7', label: '七年级' },
    { value: 'grade8', label: '八年级' },
    { value: 'grade9', label: '九年级' },
  ],
  senior: [
    { value: 'grade10', label: '高一' },
    { value: 'grade11', label: '高二' },
    { value: 'grade12', label: '高三' },
  ],
};

const SEMESTER_OPTIONS: { value: Semester; label: string }[] = [
  { value: 'upper', label: '上册' },
  { value: 'lower', label: '下册' },
];

const GRADE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  [...GRADE_MAP.primary, ...GRADE_MAP.junior, ...GRADE_MAP.senior].map(
    (g) => [g.value, g.label],
  ),
);

// ─── 组件 ─────────────────────────────────────────
const TextbookSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    subject: 'chinese',
    stage: 'primary',
    grade: 'grade1',
    semester: 'upper',
    publisher: '',
  });
  const [searchText, setSearchText] = useState<string>('');
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [currentTextbookId, setCurrentTextbookId] = useState<string>('');
  const [loadingTextbooks, setLoadingTextbooks] = useState<boolean>(false);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const progressPercent = useMemo<number>(() => {
    return 0;
  }, [units]);

  // 切换学段时重置年级为该学段第一个
  const handleStageChange = (stage: Stage): void => {
    setFilters((prev) => ({
      ...prev,
      stage,
      grade: GRADE_MAP[stage][0].value,
    }));
  };

  const handleSubjectChange = (subject: Subject): void => {
    setFilters((prev) => ({ ...prev, subject, publisher: '' }));
  };

  // 提取出版社列表（去重）
  const publisherOptions = useMemo<{ value: string; label: string }[]>(() => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const tb of textbooks) {
      if (!seen.has(tb.publisher)) {
        seen.add(tb.publisher);
        result.push({ value: tb.publisher, label: tb.publisher });
      }
    }
    return result;
  }, [textbooks]);

  // 筛选后的教材（按 publisher 过滤）
  const filteredTextbooks = useMemo<Textbook[]>(() => {
    if (!filters.publisher) return textbooks;
    return textbooks.filter((tb: Textbook) => tb.publisher === filters.publisher);
  }, [textbooks, filters.publisher]);

  // 1. 根据筛选条件获取教材列表
  useEffect(() => {
    let cancelled = false;
    setLoadingTextbooks(true);
    setError('');
    getTextbooks({
      grade: filters.grade,
      subject: filters.subject,
      semester: filters.semester,
    })
      .then((data: Textbook[]) => {
        if (cancelled) return;
        setTextbooks(data);
        // 默认选第一个教材的 publisher
        if (data.length > 0) {
          setFilters((prev) => ({ ...prev, publisher: data[0].publisher }));
        } else {
          setFilters((prev) => ({ ...prev, publisher: '' }));
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('获取教材列表失败', JSON.stringify(err));
        setError('加载失败，请重试');
        setTextbooks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTextbooks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.subject, filters.grade, filters.semester]);

  // 2. 教材列表或 publisher 变化时，取第一个匹配教材加载详情
  useEffect(() => {
    if (filteredTextbooks.length === 0) {
      setUnits([]);
      setCurrentTextbookId('');
      return;
    }
    const firstTb = filteredTextbooks[0];
    if (firstTb.id === currentTextbookId) return;

    let cancelled = false;
    setLoadingUnits(true);
    setError('');
    getTextbookDetail(firstTb.id)
      .then((data: { textbook: Textbook; units: TextbookUnit[] }) => {
        if (cancelled) return;
        setUnits(data.units);
        setCurrentTextbookId(firstTb.id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('获取教材详情失败', JSON.stringify(err));
        setError('加载失败，请重试');
        setUnits([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUnits(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filteredTextbooks, currentTextbookId]);

  // 搜索过滤后的单元
  const filteredUnits = useMemo<TextbookUnit[]>(() => {
    if (!searchText.trim()) return units;
    const kw = searchText.toLowerCase();
    return units.filter(
      (u: TextbookUnit) =>
        u.title.toLowerCase().includes(kw) ||
        `unit ${u.unitOrder}`.includes(kw),
    );
  }, [units, searchText]);

  const handleStartLearn = (unit: TextbookUnit): void => {
    if (filters.subject === 'math') {
      navigate(`/textbook-sync/math/${currentTextbookId}/${unit.id}`);
      return;
    }
    const contentTypeMap: Record<string, string> = {
      chinese: 'chinese_char',
      english: 'word',
    };
    const ct = contentTypeMap[filters.subject] || 'word';
    navigate(`/practice/sentence?contentType=${ct}&textbookId=${currentTextbookId}&unitId=${unit.id}&mode=typing`);
  };

  const subjectLabel = SUBJECT_OPTIONS.find(
    (s) => s.value === filters.subject,
  )?.label || '';
  const gradeLabel = GRADE_LABEL_MAP[filters.grade] || '';
  const semesterLabel = SEMESTER_OPTIONS.find(
    (s) => s.value === filters.semester,
  )?.label || '';

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden text-white">
      {/* ===== 顶部栏 ===== */}
       <div
         className="h-11 sm:h-12 flex items-center justify-between px-3 sm:px-4 flex-shrink-0 border-b"
         style={{ borderColor: 'rgba(217, 70, 239, 0.15)' }}
       >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <button
            onClick={() => navigate(-1)}
             className="p-2 rounded-md transition-colors hover:bg-white/5 min-h-11 min-w-11 flex items-center justify-center"
             style={{ color: '#94a3b8' }}
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </button>
          <BookOpen size={18} style={{ color: '#6366F1' }} className="flex-shrink-0" />
          <span className="text-sm sm:text-base font-semibold tracking-wide truncate text-white">
             教材同步
           </span>
           <span
             className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
             style={{
               background: 'rgba(217, 70, 239, 0.15)',
               color: '#E879F9',
               border: '1px solid rgba(217, 70, 239, 0.3)',
             }}
           >
            {subjectLabel}
          </span>
        </div>

        {/* 搜索框 */}
         <div
           className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full w-48 md:w-56 border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
         >
           <Search size={14} style={{ color: '#94a3b8' }} />
           <input
             type="text"
             value={searchText}
             onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
               setSearchText(e.target.value)
             }
             placeholder="搜索单元..."
             className="flex-1 bg-transparent outline-none text-xs text-white placeholder:text-slate-500"
          />
        </div>
        {/* 移动端搜索按钮 */}
         <button
           className="sm:hidden p-2 rounded-md transition-colors hover:bg-white/5 min-h-11 min-w-11 flex items-center justify-center"
           style={{ color: '#94a3b8' }}
          aria-label="搜索"
          onClick={() => {
            const el = document.getElementById('mobile-search-input');
            el?.focus();
          }}
        >
          <Search size={18} />
        </button>
      </div>

      {/* 移动端搜索框 */}
       <div
         id="mobile-search-input"
         className="sm:hidden px-3 py-2 border-b flex-shrink-0"
          style={{
            borderColor: 'rgba(217, 70, 239, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
       >
         <div
           className="flex items-center gap-2 px-3 py-2 rounded-full border"
           style={{
             backgroundColor: 'rgba(255, 255, 255, 0.05)',
             borderColor: 'rgba(255, 255, 255, 0.1)',
           }}
         >
           <Search size={16} style={{ color: '#94a3b8' }} />
           <input
             type="text"
             value={searchText}
             onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
               setSearchText(e.target.value)
             }
             placeholder="搜索单元..."
             className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500 min-h-8"
          />
        </div>
      </div>

      {/* ===== 主体区 ===== */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
        {/* ===== 筛选栏（手机顶部横滚 / 平板以上左侧边栏） ===== */}
         <div
           className="w-full sm:w-56 lg:w-64 flex-shrink-0 overflow-y-auto sm:border-r p-3 sm:p-4 space-y-3 sm:space-y-4 border-b sm:border-b-0"
           style={{ borderColor: 'rgba(217, 70, 239, 0.15)' }}
         >
          {/* 学科 */}
          <div>
            <h3
               className="text-xs font-bold mb-2"
               style={{ color: '#94a3b8' }}
            >
              学科
            </h3>
            <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
              {SUBJECT_OPTIONS.map((opt) => {
                const isActive = filters.subject === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSubjectChange(opt.value)}
                    className="px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-xs transition-all min-h-10 sm:min-h-0 whitespace-nowrap flex-shrink-0"
                    style={
                       isActive
                          ? {
                              backgroundColor: '#D946EF',
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 学段 */}
          <div>
            <h3
               className="text-xs font-bold mb-2"
               style={{ color: '#94a3b8' }}
            >
              学段
            </h3>
            <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
              {STAGE_OPTIONS.map((opt) => {
                const isActive = filters.stage === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleStageChange(opt.value)}
                    className="px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-xs transition-all min-h-10 sm:min-h-0 whitespace-nowrap flex-shrink-0"
                    style={
                       isActive
                          ? {
                              backgroundColor: '#D946EF',
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 年级 */}
          <div>
            <h3
               className="text-xs font-bold mb-2"
               style={{ color: '#94a3b8' }}
            >
              年级
            </h3>
            <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
              {GRADE_MAP[filters.stage].map((opt) => {
                const isActive = filters.grade === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, grade: opt.value }))
                    }
                    className="px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-xs transition-all min-h-10 sm:min-h-0 whitespace-nowrap flex-shrink-0"
                    style={
                       isActive
                          ? {
                              backgroundColor: '#D946EF',
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 学期 */}
          <div>
            <h3
               className="text-xs font-bold mb-2"
               style={{ color: '#94a3b8' }}
            >
              学期
            </h3>
            <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
              {SEMESTER_OPTIONS.map((opt) => {
                const isActive = filters.semester === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, semester: opt.value }))
                    }
                    className="px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-xs transition-all min-h-10 sm:min-h-0 whitespace-nowrap flex-shrink-0"
                    style={
                       isActive
                          ? {
                              backgroundColor: '#D946EF',
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 版本（仅当有多个出版社时显示） */}
          {publisherOptions.length > 1 && (
            <div>
              <h3
               className="text-xs font-bold mb-2"
               style={{ color: '#94a3b8' }}
              >
                版本
              </h3>
              <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
                {publisherOptions.map((opt) => {
                  const isActive = filters.publisher === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, publisher: opt.value }))
                      }
                      className="px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-xs transition-all min-h-10 sm:min-h-0 whitespace-nowrap flex-shrink-0"
                      style={
                       isActive
                          ? {
                              backgroundColor: '#D946EF',
                              color: '#fff',
                              boxShadow: '0 0 12px rgba(217, 70, 239, 0.4)',
                            }
                          : {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 装饰：底部霓虹光点（平板以上显示） */}
          <div className="hidden sm:block">
            <div
              className="mt-4 h-20 rounded-lg relative overflow-hidden"
              style={{
                 background:
                   'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
                 border: '1px solid rgba(217, 70, 239, 0.15)',
              }}
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1">
                <span className="text-xs" style={{ color: '#94a3b8' }}>
                   学习进度
                 </span>
                <span
                  className="text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 右侧单元列表区 ===== */}
        <div className="flex-1 flex flex-col overflow-hidden px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
             <div className="flex items-center gap-2 min-w-0">
               <span
                 className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                 style={{
                   background: 'rgba(99, 102, 241, 0.08)',
                   color: '#6366F1',
                   border: '1px solid rgba(99, 102, 241, 0.2)',
                 }}
               >
                 {subjectLabel}·{gradeLabel}·{semesterLabel}
               </span>
                 <span className="text-sm sm:text-base font-semibold truncate text-white">
                 {filteredTextbooks.length > 0
                   ? filteredTextbooks[0].title
                   : 'Unit 列表'}
               </span>
             </div>
            <div
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full min-h-8 flex-shrink-0"
              style={{
               backgroundColor: 'rgba(6, 182, 212, 0.12)',
                 border: '1px solid rgba(6, 182, 212, 0.3)',
                 color: '#22d3ee',
              }}
            >
              <span>共</span>
              <span className="font-bold">{filteredUnits.length}</span>
              <span>单元</span>
            </div>
          </div>

          {/* 单元卡片 grid */}
          <div className="flex-1 overflow-y-auto">
            {/* 加载中 */}
            {(loadingTextbooks || loadingUnits) && (
              <div className="h-full flex items-center justify-center">
                 <div className="text-center" style={{ color: '#94a3b8' }}>
                   <div className="text-4xl mb-2">⏳</div>
                   <div className="text-xs">加载中...</div>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && !loadingTextbooks && !loadingUnits && (
              <div className="h-full flex items-center justify-center">
               <div className="text-center" style={{ color: '#f87171' }}>
                   <AlertCircle size={32} className="mx-auto mb-2" />
                   <div className="text-xs">{error}</div>
                </div>
              </div>
            )}

            {/* 单元卡片 grid */}
            {!loadingTextbooks && !loadingUnits && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredUnits.map((unit: TextbookUnit) => (
                  <div
                    key={unit.id}
                     className="glass-card group relative rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 min-h-[132px] sm:min-h-[140px] flex flex-col justify-between"
                     onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                       e.currentTarget.style.boxShadow =
                         '0 4px 20px rgba(217, 70, 239, 0.25), 0 0 0 1px rgba(217, 70, 239, 0.35)';
                     }}
                     onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                       e.currentTarget.style.boxShadow = '';
                     }}
                  >
                    {/* 卡片内部 */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span
                          className="text-xs sm:text-sm font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #D946EF, #06B6D4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Unit {unit.unitOrder}
                        </span>
                         <div
                           className="text-base sm:text-sm font-semibold mt-1 text-white"
                         >
                          {unit.title}
                        </div>
                      </div>
                       <BookOpen size={18} style={{ color: '#e879f9' }} />
                    </div>

                     <div
                       className="text-xs mb-3 flex items-center gap-1"
                       style={{ color: '#94a3b8' }}
                     >
                      <BookOpen size={12} />
                      <span>
                        {(unit.keyWords?.length || 0)} 关键词 · {(unit.keySentences?.length || 0)} 重点句
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartLearn(unit)}
                      className="w-full py-2.5 sm:py-2 min-h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
                      style={{
                         background:
                           'linear-gradient(135deg, #D946EF 0%, #06B6D4 100%)',
                         color: '#fff',
                         boxShadow: '0 2px 8px rgba(217, 70, 239, 0.3)',
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                      开始学习
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loadingTextbooks && !loadingUnits && !error && filteredUnits.length === 0 && (
              <div className="h-full flex items-center justify-center">
                 <div className="text-center" style={{ color: '#94a3b8' }}>
                   <div className="text-4xl mb-2">🔍</div>
                   <div className="text-xs">未找到匹配的单元</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookSyncPage;
