import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  BookX,
  BookOpen,
  CheckCircle2,
  Sparkles,
  BookMarked,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi, wordsApi } from '@client/src/api';
import type { Textbook, TextbookUnit, WordItem } from '@shared/api.interface';
import { AppBadge } from '@client/src/components/ui/app-badges';
import UnitDetailView from './UnitDetailView';

// ============================================================
// 三级筛选配置（学段 → 版本 → 年级）
// ============================================================

type StageKey =
  | 'primary'
  | 'primary_wusi'
  | 'junior'
  | 'junior_wusi'
  | 'senior'
  | 'university'
  | 'special'
  | 'other';

interface StageOption {
  key: StageKey;
  label: string;
}

const STAGE_OPTIONS: StageOption[] = [
  { key: 'primary', label: '小学' },
  { key: 'junior', label: '初中' },
  { key: 'primary_wusi', label: '小学(五-四学制)' },
  { key: 'junior_wusi', label: '初中(五-四学制)' },
  { key: 'senior', label: '高中' },
  { key: 'university', label: '大学' },
  { key: 'special', label: '特殊教育' },
  { key: 'other', label: '其他' },
];

type VersionKey = string;

interface VersionOption {
  key: VersionKey;
  label: string;
  publisherMatches: string[]; // 匹配数据库publisher字段的可能值
}

const ALL_VERSIONS: VersionOption[] = [
  { key: 'pep_sanqi', label: '人教版PEP（三年级起点）', publisherMatches: ['人教版PEP', '人教版', 'PEP'] },
  { key: 'pep_yiqi', label: '人教版（一年级起点）', publisherMatches: ['人教版一起', '人教版（一年级起点）'] },
  { key: 'rendadatong', label: '人教大同版', publisherMatches: ['人教大同版'] },
  { key: 'pep_jingtong', label: '人教版（精通）', publisherMatches: ['人教精通版', '人教版精通'] },
  { key: 'jijiao_yiqi', label: '冀教版（一年级起点）', publisherMatches: ['冀教版一起'] },
  { key: 'jijiao_sanqi', label: '冀教版（三年级起点）', publisherMatches: ['冀教版三起', '冀教版'] },
  { key: 'xiangshao', label: '湘少版', publisherMatches: ['湘少版'] },
  { key: 'jiaoke_eec', label: '教科版（EEC学院）', publisherMatches: ['教科版EEC'] },
  { key: 'jiaoke_guangzhou', label: '教科版（广州）', publisherMatches: ['教科版广州'] },
  { key: 'jieli', label: '接力版', publisherMatches: ['接力版'] },
  { key: 'kepu', label: '科普版', publisherMatches: ['科普版'] },
  { key: 'liaoning_shida', label: '辽宁师大版', publisherMatches: ['辽师大版'] },
  { key: 'qinghua', label: '清华大学版', publisherMatches: ['清华版'] },
  { key: 'lujiao_xiangjiao', label: '鲁教湘教版', publisherMatches: ['鲁教湘教版'] },
  { key: 'shanlv', label: '陕旅版', publisherMatches: ['陕旅版'] },
  { key: 'hujiao', label: '沪教版', publisherMatches: ['沪教版'] },
  { key: 'chuanjiao', label: '川教版', publisherMatches: ['川教版'] },
  { key: 'waiyanshe_yiqi', label: '外研社版（新标准一起）', publisherMatches: ['外研社一起', '外研社版一起'] },
  { key: 'waiyanshe_sanqi_chen', label: '外研社版(新标准三起) 陈主编', publisherMatches: ['外研社三起', '外研社版三起'] },
  { key: 'waiyanshe_xinjiaoji_gui', label: '外研社版(新交际) 桂主编', publisherMatches: ['外研社新交际'] },
  { key: 'waiyanshe_joinin_liu', label: '外研版(Join In) 刘主编', publisherMatches: ['外研社Join In'] },
  { key: 'yilin', label: '译林版', publisherMatches: ['译林版', '牛津译林版'] },
  { key: 'yuejiao_huwai', label: '粤教沪外教版', publisherMatches: ['粤教沪外教版'] },
  { key: 'beishida_sanqi', label: '北师大版（三起）', publisherMatches: ['北师大版三起', '北师大版'] },
  { key: 'chongqing_daxue', label: '重庆大学版', publisherMatches: ['重大版'] },
  { key: 'beijing', label: '北京版', publisherMatches: ['北京版'] },
  { key: 'minjiao', label: '闽教版', publisherMatches: ['闽教版'] },
  { key: 'yuejiao_yueren', label: '粤教粤人版', publisherMatches: ['粤教粤人版'] },
  { key: 'waiyanshe_sun', label: '（外研社） 孙主编', publisherMatches: ['外研社孙主编'] },
  { key: 'waiyanshe_zhang', label: '（外研社）张主编', publisherMatches: ['外研社张主编'] },
  { key: 'beishida_yiqi', label: '北师大版（一起）', publisherMatches: ['北师大版一起'] },
  { key: 'cambridge_join', label: '剑桥版 join', publisherMatches: ['剑桥版'] },
  { key: 'shanghai_xinshiji', label: '上海新世纪', publisherMatches: ['上海新世纪版'] },
  { key: 'hujiao_wusi', label: '沪教版（五·四学制）', publisherMatches: ['沪教版五四制'] },
  { key: 'niujin_shanghai', label: '牛津上海版', publisherMatches: ['牛津上海版'] },
  { key: 'head_start', label: 'HEAD START', publisherMatches: ['HEAD START'] },
];

// 学段 → 版本映射
const STAGE_VERSIONS_MAP: Record<StageKey, VersionKey[]> = {
  primary: [
    'pep_sanqi', 'pep_yiqi', 'rendadatong', 'pep_jingtong',
    'jijiao_yiqi', 'jijiao_sanqi', 'xiangshao', 'jiaoke_eec',
    'jiaoke_guangzhou', 'jieli', 'kepu', 'liaoning_shida',
    'qinghua', 'lujiao_xiangjiao', 'shanlv', 'hujiao',
    'chuanjiao', 'waiyanshe_yiqi', 'waiyanshe_sanqi_chen',
    'waiyanshe_xinjiaoji_gui', 'waiyanshe_joinin_liu',
    'yilin', 'yuejiao_huwai', 'beishida_sanqi', 'chongqing_daxue',
    'beijing', 'minjiao', 'yuejiao_yueren', 'waiyanshe_sun',
    'waiyanshe_zhang', 'beishida_yiqi', 'cambridge_join',
    'shanghai_xinshiji', 'niujin_shanghai', 'head_start',
  ],
  primary_wusi: [
    'hujiao_wusi', 'beishida_sanqi', 'pep_sanqi',
  ],
  junior: [
    'pep_sanqi', 'waiyanshe_sanqi_chen', 'yilin',
    'beishida_sanqi', 'hujiao', 'waiyanshe_yiqi',
  ],
  junior_wusi: [
    'hujiao_wusi', 'pep_sanqi', 'waiyanshe_sanqi_chen',
  ],
  senior: [
    'pep_sanqi', 'waiyanshe_sanqi_chen', 'beishida_sanqi',
  ],
  university: [],
  special: [],
  other: [],
};

interface GradeOption {
  value: string;
  label: string;
}

// 学段 → 年级映射
const STAGE_GRADES_MAP: Record<StageKey, GradeOption[]> = {
  primary: [
    { value: 'grade1', label: '一年级' },
    { value: 'grade2', label: '二年级' },
    { value: 'grade3', label: '三年级' },
    { value: 'grade4', label: '四年级' },
    { value: 'grade5', label: '五年级' },
    { value: 'grade6', label: '六年级' },
  ],
  primary_wusi: [
    { value: 'grade1', label: '一年级' },
    { value: 'grade2', label: '二年级' },
    { value: 'grade3', label: '三年级' },
    { value: 'grade4', label: '四年级' },
    { value: 'grade5', label: '五年级' },
  ],
  junior: [
    { value: 'grade7', label: '七年级' },
    { value: 'grade8', label: '八年级' },
    { value: 'grade9', label: '九年级' },
  ],
  junior_wusi: [
    { value: 'grade6', label: '六年级' },
    { value: 'grade7', label: '七年级' },
    { value: 'grade8', label: '八年级' },
    { value: 'grade9', label: '九年级' },
  ],
  senior: [
    { value: 'grade10', label: '高一' },
    { value: 'grade11', label: '高二' },
    { value: 'grade12', label: '高三' },
  ],
  university: [],
  special: [],
  other: [],
};

const SEMESTER_OPTIONS = [
  { value: 'upper', label: '上册' },
  { value: 'lower', label: '下册' },
];

// ============================================================
// 类型定义
// ============================================================

interface TextbookWithUnits extends Textbook {
  units?: TextbookUnit[];
  loading?: boolean;
  wordDetailMap?: Record<string, WordItem>;
  hasRealData?: boolean;
}

interface EnglishSubjectViewProps {
  onAIQuiz?: (unit: { id: string; title: string; topic?: string }) => void;
}

// ============================================================
// 组件
// ============================================================

const EnglishSubjectView: React.FC<EnglishSubjectViewProps> = ({
  onAIQuiz,
}) => {
  // ---- 三级筛选状态 ----
  const [selectedStage, setSelectedStage] = useState<StageKey>('primary');
  const [selectedVersion, setSelectedVersion] = useState<VersionKey>('pep_sanqi');
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');

  // ---- 原有状态（保留）----
  const [allTextbooks, setAllTextbooks] = useState<Textbook[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [textbooks, setTextbooks] = useState<TextbookWithUnits[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeUnit, setActiveUnit] = useState<{
    textbookId: string;
    textbookTitle: string;
    unit: TextbookUnit;
    wordDetailMap: Record<string, WordItem>;
  } | null>(null);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [unitChecked, setUnitChecked] = useState<Set<string>>(new Set());

  const versionScrollRef = useRef<HTMLDivElement>(null);

  // ======================================================
  // 1. 初始加载：拉取全部英语教材
  // ======================================================
  useEffect(() => {
    const loadAll = async (): Promise<void> => {
      setAllLoading(true);
      try {
        const data = await textbooksApi.getTextbooks({ subject: 'english' });
        setAllTextbooks(data);
      } catch (err) {
        logger.error('获取英语教材列表失败', err as Error);
        setAllTextbooks([]);
      } finally {
        setAllLoading(false);
      }
    };
    void loadAll();
  }, []);

  // ======================================================
  // 筛选联动：可用版本
  // ======================================================
  const availableVersions = useMemo<VersionOption[]>(() => {
    const versionKeys = STAGE_VERSIONS_MAP[selectedStage] || [];
    return versionKeys
      .map((key: VersionKey) => ALL_VERSIONS.find((v) => v.key === key))
      .filter((v): v is VersionOption => !!v);
  }, [selectedStage]);

  // ======================================================
  // 筛选联动：可用年级
  // ======================================================
  const availableGrades = useMemo<GradeOption[]>(() => {
    return STAGE_GRADES_MAP[selectedStage] || [];
  }, [selectedStage]);

  // ======================================================
  // 校正：学段变化时，版本和年级自动调整
  // ======================================================
  useEffect(() => {
    const versionKeys = availableVersions.map((v) => v.key);
    if (versionKeys.length > 0 && !versionKeys.includes(selectedVersion)) {
      setSelectedVersion(versionKeys[0]);
    } else if (versionKeys.length === 0) {
      setSelectedVersion('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStage]);

  useEffect(() => {
    const gradeValues = availableGrades.map((g) => g.value);
    if (gradeValues.length > 0 && !gradeValues.includes(selectedGrade)) {
      setSelectedGrade(gradeValues[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStage, selectedVersion]);

  // ======================================================
  // 工具：获取版本标签
  // ======================================================
  const getVersionLabel = (versionKey: VersionKey): string => {
    return ALL_VERSIONS.find((v) => v.key === versionKey)?.label ?? versionKey;
  };

  const getGradeLabel = (gradeValue: string): string => {
    const allGrades = Object.values(STAGE_GRADES_MAP).flat();
    return allGrades.find((g) => g.value === gradeValue)?.label ?? gradeValue;
  };

  // ======================================================
  // 检查某教材是否匹配当前选中版本
  // ======================================================
  const matchesVersion = (tb: Textbook, versionKey: VersionKey): boolean => {
    const version = ALL_VERSIONS.find((v) => v.key === versionKey);
    if (!version) return false;
    return version.publisherMatches.some(
      (pub: string) => tb.publisher && tb.publisher.includes(pub),
    );
  };

  // ======================================================
  // 当前筛选下的教材列表（真实数据 + 占位数据）
  // ======================================================
  const displayTextbooks = useMemo<TextbookWithUnits[]>(() => {
    if (availableGrades.length === 0) return [];

    const result: TextbookWithUnits[] = [];

    for (const sem of SEMESTER_OPTIONS) {
      // 尝试在 allTextbooks 中找到匹配的真实教材
      const realTb = allTextbooks.find(
        (tb) =>
          tb.grade === selectedGrade &&
          tb.semester === sem.value &&
          matchesVersion(tb, selectedVersion),
      );

      if (realTb) {
        // 检查 textbooks 状态中是否已有加载过的 units
        const existing = textbooks.find((t) => t.id === realTb.id);
        result.push({
          ...realTb,
          hasRealData: true,
          units: existing?.units,
          loading: existing?.loading,
          wordDetailMap: existing?.wordDetailMap,
        });
      } else if (selectedVersion) {
        // 构造占位教材
        const versionLabel = getVersionLabel(selectedVersion);
        const gradeLabel = getGradeLabel(selectedGrade);
        const placeholderId = `placeholder-${selectedVersion}-${selectedGrade}-${sem.value}`;
        result.push({
          id: placeholderId,
          title: `${gradeLabel}${sem.label}${versionLabel}`,
          publisher: versionLabel,
          grade: selectedGrade,
          semester: sem.value,
          totalUnits: 0,
          sortOrder: 0,
          isPublished: false,
          hasRealData: false,
        });
      }
    }

    return result;
  }, [allTextbooks, selectedVersion, selectedGrade, textbooks, availableGrades.length]);

  // ======================================================
  // 处理学段切换
  // ======================================================
  const handleStageChange = (stage: StageKey): void => {
    setSelectedStage(stage);
    setExpandedId(null);
  };

  // ======================================================
  // 处理版本切换
  // ======================================================
  const handleVersionChange = (version: VersionKey): void => {
    setSelectedVersion(version);
    setExpandedId(null);
  };

  // ======================================================
  // 处理年级切换
  // ======================================================
  const handleGradeChange = (grade: string): void => {
    setSelectedGrade(grade);
    setExpandedId(null);
  };

  // ======================================================
  // 处理教材点击（复用 handleExpand 逻辑）
  // ======================================================
  const handleTextbookClick = (textbook: TextbookWithUnits): void => {
    if (!textbook.hasRealData) {
      toast.info('内容建设中，敬请期待');
      return;
    }
    void handleExpand(textbook);
  };

  // ======================================================
  // 展开/收起教材（保留原有逻辑，适配新状态结构）
  // ======================================================
  const handleExpand = async (textbook: TextbookWithUnits): Promise<void> => {
    if (expandedId === textbook.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(textbook.id);

    if (!textbook.units) {
      // 更新 textbooks 中对应项的 loading 状态
      setTextbooks((prev) => {
        const idx = prev.findIndex((t) => t.id === textbook.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], loading: true };
          return next;
        }
        return [...prev, { ...textbook, loading: true }];
      });

      try {
        const detail = await textbooksApi.getTextbookDetail(textbook.id);

        const allKeyWords: string[] = [];
        for (const u of detail.units) {
          if (u.keyWords) {
            allKeyWords.push(...u.keyWords);
          }
        }

        let wordDetailMap: Record<string, WordItem> = {};
        if (allKeyWords.length > 0) {
          try {
            const wordDetails: WordItem[] =
              await wordsApi.getWordsByList(allKeyWords);
            wordDetailMap = {};
            for (const w of wordDetails) {
              wordDetailMap[w.word.toLowerCase()] = w;
            }
          } catch (wordErr) {
            logger.error('获取单词详情失败', wordErr as Error);
          }
        }

        setTextbooks((prev) => {
          const idx = prev.findIndex((t) => t.id === textbook.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              units: detail.units,
              loading: false,
              wordDetailMap,
            };
            return next;
          }
          return prev;
        });
      } catch (err) {
        logger.error('获取教材详情失败', err as Error);
        setTextbooks((prev) => {
          const idx = prev.findIndex((t) => t.id === textbook.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], loading: false };
            return next;
          }
          return prev;
        });
      }
    }
  };

  // ======================================================
  // 进入单元详情（保留）
  // ======================================================
  const handleEnterUnit = (
    textbook: TextbookWithUnits,
    unit: TextbookUnit,
  ): void => {
    setActiveUnit({
      textbookId: textbook.id,
      textbookTitle: textbook.title,
      unit,
      wordDetailMap: textbook.wordDetailMap || {},
    });
  };

  const handleBackToList = (): void => {
    setActiveUnit(null);
  };

  const handleWordMaster = (wordId: string): void => {
    setMasteredWords((prev) => {
      const next = new Set(prev);
      next.add(wordId);
      return next;
    });
  };

  const handleUnitCheck = (unitId: string): void => {
    setUnitChecked((prev) => {
      const next = new Set(prev);
      next.add(unitId);
      return next;
    });
  };

  // ======================================================
  // 获取展开的教材数据
  // ======================================================
  const expandedTextbook = useMemo<TextbookWithUnits | undefined>(() => {
    if (!expandedId) return undefined;
    // 优先从 textbooks 状态中找（可能有加载好的 units）
    const fromState = textbooks.find((t) => t.id === expandedId);
    if (fromState) return fromState;
    // 再从 displayTextbooks 中找
    return displayTextbooks.find((t) => t.id === expandedId);
  }, [expandedId, textbooks, displayTextbooks]);

  // ======================================================
  // 单元详情视图（保留原逻辑）
  // ======================================================
  if (activeUnit) {
    return (
      <UnitDetailView
        textbookId={activeUnit.textbookId}
        textbookTitle={activeUnit.textbookTitle}
        unit={activeUnit.unit}
        wordDetailMap={activeUnit.wordDetailMap}
        masteredWords={masteredWords}
        checkedUnitIds={unitChecked}
        onBack={handleBackToList}
        onWordMaster={handleWordMaster}
        onUnitCheck={handleUnitCheck}
      />
    );
  }

  // ======================================================
  // 渲染
  // ======================================================
  return (
    <div className="min-h-screen">
      {/* ================================================ */}
      {/* 三级筛选区域（sticky 固定顶部） */}
      {/* ================================================ */}
       <div className="sticky top-0 z-20 bg-[#0F0D24]/90 backdrop-blur-md border-b border-fuchsia-500/15">
         <div className="max-w-6xl mx-auto py-3 sm:py-4 px-4 sm:px-6 space-y-2 sm:space-y-3">
           {/* 第一行：学段（移动端横向滚动 / 桌面端 flex-wrap）*/}
           <div className="flex items-start gap-3">
                <div className="hidden sm:block w-16 flex-shrink-0 pt-2 text-sm font-medium text-slate-400 text-right">
               学段
             </div>
             <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap -mx-1 px-1 sm:mx-0 sm:px-0 pb-0.5 sm:pb-0">
               {STAGE_OPTIONS.map((stage) => {
                 const isActive = selectedStage === stage.key;
                 return (
                   <button
                     key={stage.key}
                     onClick={() => handleStageChange(stage.key)}
                      className={`flex-shrink-0 sm:flex-shrink px-3 sm:px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-10 sm:min-h-0 ${
                         isActive
                           ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                           : 'text-slate-300 hover:bg-white/10'
                      }`}
                   >
                     {stage.label}
                   </button>
                 );
               })}
             </div>
           </div>

           {/* 第二行：版本（横向滚动） */}
           {availableVersions.length > 0 && (
             <div className="flex items-start gap-3">
                <div className="hidden sm:block w-16 flex-shrink-0 pt-2 text-sm font-medium text-slate-400 text-right">
                 版本
               </div>
               <div className="flex-1 min-w-0">
                 <div
                   ref={versionScrollRef}
                   className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 sm:mx-0 sm:px-0"
                   style={{ scrollbarWidth: 'thin' }}
                 >
                   {availableVersions.map((version) => {
                     const isActive = selectedVersion === version.key;
                     return (
                       <button
                         key={version.key}
                         onClick={() => handleVersionChange(version.key)}
                          className={`flex-shrink-0 px-3 py-2 sm:py-1.5 rounded-full text-xs sm:text-xs font-medium transition-all duration-200 whitespace-nowrap min-h-10 sm:min-h-0 ${
                             isActive
                               ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                               : 'text-slate-400 hover:bg-white/10'
                          }`}
                       >
                         {version.label}
                       </button>
                     );
                   })}
                 </div>
               </div>
             </div>
           )}

           {/* 第三行：年级（移动端横向滚动 / 桌面端 flex-wrap）*/}
           {availableGrades.length > 0 && (
             <div className="flex items-start gap-3">
                <div className="hidden sm:block w-16 flex-shrink-0 pt-2 text-sm font-medium text-slate-400 text-right">
                 年级
               </div>
               <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap -mx-1 px-1 sm:mx-0 sm:px-0 pb-0.5 sm:pb-0">
                 {availableGrades.map((grade) => {
                   const isActive = selectedGrade === grade.value;
                   return (
                     <button
                       key={grade.value}
                       onClick={() => handleGradeChange(grade.value)}
                       className={`flex-shrink-0 sm:flex-shrink px-3 sm:px-4 py-2 sm:py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-10 sm:min-h-0 ${
                         isActive
                           ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-md shadow-cyan-500/30'
                           : 'text-slate-300 hover:bg-white/10'
                       }`}
                     >
                       {grade.label}
                     </button>
                   );
                 })}
               </div>
             </div>
           )}
         </div>
       </div>

      {/* ================================================ */}
      {/* 教材列表区 */}
      {/* ================================================ */}
       <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {allLoading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-3">
             <Loader2 className="animate-spin" size={32} style={{ color: '#D946EF' }} />
             <p className="text-slate-400">加载中...</p>
           </div>
        ) : displayTextbooks.length === 0 ? (
           <div className="glass-card rounded-xl py-16 flex flex-col items-center gap-4">
             <BookX size={48} className="text-slate-500" />
             <h3 className="text-base font-medium text-slate-300">
               暂无教材
             </h3>
             <p className="text-sm text-slate-500">
               当前选择的学段 / 版本暂无教材内容
             </p>
           </div>
        ) : (
           <div className="glass-card rounded-xl overflow-hidden">
            {displayTextbooks.map((textbook, index) => {
              const isExpanded = expandedId === textbook.id;
              return (
                <div key={textbook.id}>
                  {/* 教材行（文本列表样式） */}
                   <div
                     onClick={() => handleTextbookClick(textbook)}
                     className={`flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0 min-h-12 ${
                        isExpanded
                          ? 'bg-fuchsia-500/10'
                          : 'hover:bg-white/5'
                      }`}
                   >
                    {/* 序号/书本图标 */}
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      {textbook.hasRealData ? (
                        <BookOpen
                          size={16}
                           className={isExpanded ? 'text-fuchsia-300' : 'text-slate-400'}
                        />
                      ) : (
                        <BookMarked
                          size={16}
                          className="text-slate-600"
                        />
                      )}
                    </div>

                    {/* 序号 */}
                     <span className="flex-shrink-0 w-6 text-sm text-slate-400">
                      {index + 1}
                    </span>

                    {/* 教材名称 */}
                    <div className="flex-1 min-w-0">
                       <span
                         className={`text-sm font-medium ${
                           textbook.hasRealData
                             ? isExpanded
                               ? 'text-fuchsia-300'
                               : 'text-white'
                             : 'text-slate-500'
                         }`}
                       >
                        {textbook.title}
                      </span>
                      {!textbook.hasRealData && (
                         <span className="ml-2 text-xs text-slate-500">（建设中）</span>
                      )}
                    </div>

                    {/* 展开箭头 */}
                    <ChevronDown
                      size={18}
                      className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* 展开的单元列表 */}
                   {isExpanded && expandedTextbook && (
                     <div className="bg-black/20 border-t border-white/10 px-3 sm:px-5 py-3 sm:py-4">
                      {expandedTextbook.loading ? (
                        <div className="flex items-center justify-center py-6 gap-2">
                          <Loader2
                            className="animate-spin"
                            size={18}
                            style={{ color: '#FF6B35' }}
                          />
                           <span className="text-sm text-slate-400">
                            加载单元中...
                          </span>
                        </div>
                      ) : !expandedTextbook.units || expandedTextbook.units.length === 0 ? (
                         <div className="text-center py-6 text-sm text-slate-500">
                          暂无单元内容
                        </div>
                      ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                           {expandedTextbook.units.map((unit: TextbookUnit) => (
                             <div
                               key={unit.id}
                               className="glass-card rounded-lg p-4 hover:border-fuchsia-500/40 hover:shadow-fuchsia-500/20 transition-all"
                             >
                               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 h-full">
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                                      <AppBadge variant="badge2" size={12} rounded />
                                      Unit {unit.unitOrder}
                                    </span>
                                    <h4 className="font-semibold text-white text-sm">
                                      {unit.title}
                                    </h4>
                                    {unitChecked.has(unit.id) && (
                                      <CheckCircle2 size={14} className="text-green-500" />
                                    )}
                                  </div>
                                  {unit.topic && (
                                    <p className="text-sm mt-1 text-slate-400">
                                      主题：{unit.topic}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                      <BookOpen size={12} />
                                      重点句子 {unit.keySentences?.length || 0} 个
                                    </span>
                                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                      <AppBadge variant="badge3" size={12} />
                                      重点单词 {unit.keyWords?.length || 0} 个
                                    </span>
                                  </div>

                                   {unit.keyWords && unit.keyWords.length > 0 && (
                                     <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5">
                                       {unit.keyWords.slice(0, 6).map((kw: string) => (
                                         <span
                                           key={kw}
                                           className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300"
                                         >
                                           {kw}
                                         </span>
                                       ))}
                                       {unit.keyWords.length > 6 && (
                                          <span className="px-2 py-0.5 rounded-full text-xs text-slate-500">
                                           +{unit.keyWords.length - 6}
                                         </span>
                                       )}
                                     </div>
                                   )}
                                 </div>
                                 <div className="flex sm:flex-col flex-row items-stretch sm:items-end gap-2 w-full sm:w-auto">
                                   <button
                                     onClick={() => handleEnterUnit(expandedTextbook, unit)}
                                     className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:brightness-110 transition-all shadow-md shadow-fuchsia-500/30 min-h-11"
                                   >
                                     进入学习
                                     <ChevronRight size={16} />
                                   </button>
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
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors min-h-9"
                                     >
                                       <Sparkles size={14} />
                                       AI出题
                                     </button>
                                   )}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================ */}
        {/* 底部版权声明 */}
        {/* ================================================ */}
         <div className="text-center py-8 mt-4 border-t border-white/10">
           <p className="text-xs text-slate-500">
            内容均由平台用户独立创作，教材版本及名称仅用于分类整理；
            如涉及侵权，请联系：waxueshe@163.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnglishSubjectView;
