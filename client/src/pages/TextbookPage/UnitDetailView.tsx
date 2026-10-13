import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Pencil,
  Headphones,
  Puzzle,
  CheckCircle2,
  Trophy,
  Lightbulb,
  ArrowLeft,
  Languages,
  Sparkles,
  Clock,
  Zap,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { TextbookUnit, WordItem } from '@shared/api.interface';
import WordFlashCard from './WordFlashCard';
import WordPracticeV2 from './WordPracticeV2';
import AIQuestionPanel from './AIQuestionPanel';
import SpeechButton from '@client/src/components/ui/speech-button';
import PracticeModeSelector from '@client/src/components/practice/PracticeModeSelector';
import { Badge } from '@client/src/components/ui/badge';

interface UnitDetailViewProps {
  textbookId: string;
  textbookTitle: string;
  unit: TextbookUnit;
  wordDetailMap: Record<string, WordItem>;
  masteredWords: Set<string>;
  checkedUnitIds: Set<string>;
  onBack: () => void;
  onWordMaster: (wordId: string) => void;
  onUnitCheck: (unitId: string) => void;
}


type PracticeTab = 'words' | 'spelling' | 'sentence';
type PracticeMode = 'translation' | 'listening' | 'speaking';

const SENTENCE_CATEGORY_MAP: Record<string, string> = {
  hello: '打招呼问候',
  hi: '打招呼问候',
  goodbye: '告别用语',
  bye: '告别用语',
  red: '颜色',
  yellow: '颜色',
  green: '颜色',
  blue: '颜色',
  black: '颜色',
  white: '颜色',
  orange: '颜色',
  brown: '颜色',
  colour: '颜色',
  face: '身体部位',
  ear: '身体部位',
  eye: '身体部位',
  nose: '身体部位',
  mouth: '身体部位',
  arm: '身体部位',
  hand: '身体部位',
  head: '身体部位',
  body: '身体部位',
  leg: '身体部位',
  foot: '身体部位',
  cat: '动物',
  dog: '动物',
  monkey: '动物',
  panda: '动物',
  rabbit: '动物',
  duck: '动物',
  pig: '动物',
  bird: '动物',
  bear: '动物',
  elephant: '动物',
  bread: '食物',
  juice: '食物',
  egg: '食物',
  milk: '食物',
  water: '食物',
  cake: '食物',
  fish: '食物',
  rice: '食物',
  hungry: '食物',
  one: '数字',
  two: '数字',
  three: '数字',
  four: '数字',
  five: '数字',
  six: '数字',
  seven: '数字',
  eight: '数字',
  nine: '数字',
  ten: '数字',
  birthday: '数字',
};

const buildGrammarComponents = (
  sentence: string,
): { id: string; text: string; type: string }[] => {
  const clean = sentence.trim();
  const words = clean.split(/\s+/);
  const lastWord = words[words.length - 1] || '';
  const endsWithPunctuation = /[.!?]$/.test(lastWord);

  let tokenList: string[] = [];
  if (endsWithPunctuation) {
    const punc = lastWord.slice(-1);
    const main = lastWord.slice(0, -1);
    tokenList = [...words.slice(0, -1), main, punc];
  } else {
    tokenList = [...words];
  }

  return tokenList.map((token, idx) => {
    let type = '名词';
    if (/^[.!?]$/.test(token)) {
      type = '标点';
    } else if (/^(am|is|are|was|were|have|has|do|does|did|can|will|would|should)$/i.test(token)) {
      type = '动词';
    } else if (/^(I|you|he|she|it|we|they|me|him|her|us|them)$/i.test(token)) {
      type = '代词';
    } else if (/^(a|an|the|this|that|these|those|my|your|his|her)$/i.test(token)) {
      type = '限定词';
    } else if (/^(in|on|at|to|for|with|of|from|by)$/i.test(token)) {
      type = '介词';
    } else if (/^(and|but|or|so|because)$/i.test(token)) {
      type = '连词';
    } else if (/ly$/i.test(token)) {
      type = '副词';
    } else if (/^[A-Z]/.test(token)) {
      type = idx === 0 ? '主语' : '专有名词';
    }
    return { id: `c-${idx}`, text: token, type };
  });
};

const UnitDetailView: React.FC<UnitDetailViewProps> = ({
  textbookId,
  textbookTitle,
  unit,
  wordDetailMap,
  masteredWords,
  checkedUnitIds,
  onBack,
  onWordMaster,
  onUnitCheck,
}) => {
  const navigate = useNavigate();
  const [practiceTab, setPracticeTab] = useState<PracticeTab>('words');
  const [wordCardIndex, setWordCardIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('translation');
  const [modeSelectorOpen, setModeSelectorOpen] = useState<boolean>(false);
  const [pendingTab, setPendingTab] = useState<PracticeTab | null>(null);
  const [masteredSentences, setMasteredSentences] = useState<Set<number>>(new Set());
  const [unfamiliarSentences, setUnfamiliarSentences] = useState<Set<number>>(new Set());
  const [masteredWordIds, setMasteredWordsState] = useState<Set<string>>(new Set());
  const [unfamiliarWords, setUnfamiliarWords] = useState<Set<string>>(new Set());
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(false);
  const isChecked = checkedUnitIds.has(unit.id);

  // 单元学习状态（暂未接入真实学习记录，统一显示为待开始）
  const unitStatus = useMemo(() => {
    return {
      practiceMinutes: 0,
      completionCount: 0,
      status: 'not_started' as const,
    };
  }, []);

  // 单元状态标签配置（霓虹风格）
  const statusNeonConfig: Record<string, { label: string; className: string }> = {
    completed: {
      label: '已完成练习',
      className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    },
    recent: {
      label: '最近练习',
      className: 'bg-purple-500/30 text-purple-200 border border-purple-400/50',
    },
    pending: {
      label: '待完成练习',
      className: 'bg-blue-500/20 text-blue-300 border border-blue-400/40',
    },
    not_started: {
      label: '暂未练习',
      className: 'bg-gray-500/20 text-gray-400 border border-gray-400/30',
    },
  };

  const statusInfo = statusNeonConfig[unitStatus.status] || statusNeonConfig.pending;

  // 生成英文标题占位
  const getUnitEnTitle = (): string => {
    // 简单按主题生成英文占位
    const topic = unit.topic || '';
    const topicEnMap: Record<string, string> = {
      '打招呼问候': 'Greetings',
      '告别用语': 'Farewells',
      '颜色': 'Colors',
      '身体部位': 'Body Parts',
      '动物': 'Animals',
      '食物': 'Food and Drinks',
      '数字': 'Numbers',
    };
    if (topic && topicEnMap[topic]) return topicEnMap[topic];
    return `Unit ${unit.unitOrder}`;
  };

  const unitWordList = useMemo<WordItem[]>(() => {
    const result: WordItem[] = [];
    for (const kw of unit.keyWords) {
      const detail = wordDetailMap[kw.toLowerCase()];
      if (detail) {
        result.push(detail);
      } else {
        result.push({
          id: `local-${kw}`,
          word: kw,
          phonetic: '',
          meaning: SENTENCE_CATEGORY_MAP[kw.toLowerCase()] || '重点词汇',
          level: 'beginner',
          tags: [],
        });
      }
    }
    return result;
  }, [unit, wordDetailMap]);

  const dictationQuestions = useMemo(
    () =>
      unit.keySentences.map((s, idx) => ({
        sentence: s,
        translation: `第${idx + 1}句课文原句`,
      })),
    [unit.keySentences],
  );

  const sentenceQuestions = useMemo(
    () =>
      unit.keySentences.map((s, idx) => {
        const firstWord = s.split(/\s+/)[0]?.replace(/[.,!?;:]/g, '').toLowerCase() || '';
        let imageUrl: string | undefined;
        for (const word of unitWordList) {
          if (word.imageUrl && s.toLowerCase().includes(word.word.toLowerCase())) {
            imageUrl = word.imageUrl;
            break;
          }
        }
        return {
          sentence: s,
          translation: `第${idx + 1}句课文原句`,
          components: buildGrammarComponents(s),
          imageUrl,
          analysis: `本句为${idx % 2 === 0 ? '陈述句' : '疑问句'}，包含${Math.max(1, Math.floor(s.split(' ').length / 3))}个主要语法成分。注意动词时态和介词搭配的正确使用。`,
        };
      }),
    [unit.keySentences, unitWordList],
  );

  const handleTabClick = (tab: PracticeTab): void => {
    if (tab === 'words') {
      setPracticeTab(tab);
      return;
    }
    if (tab === 'sentence') {
      navigate(`/practice/sentence?textbookId=${textbookId}&unitId=${unit.id}`);
      return;
    }
    setPendingTab(tab);
    setModeSelectorOpen(true);
  };

  const handleModeSelect = (mode: PracticeMode): void => {
    setPracticeMode(mode);
    setModeSelectorOpen(false);
    if (pendingTab) {
      setPracticeTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleWordMaster = (): void => {
    const word = unitWordList[wordCardIndex];
    if (!word) return;
    onWordMaster(word.id);
    if (wordCardIndex < unitWordList.length - 1) {
      setWordCardIndex((prev) => prev + 1);
    }
  };

  const handleWordMasterV2 = (wordId: string): void => {
    setMasteredWordsState((prev) => new Set(prev).add(wordId));
    setUnfamiliarWords((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
    onWordMaster(wordId);
  };

  const handleWordUnfamiliar = (wordId: string): void => {
    setUnfamiliarWords((prev) => new Set(prev).add(wordId));
      setMasteredWordsState((prev) => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
  };

  const handleSentenceMaster = (idx: number): void => {
    setMasteredSentences((prev) => new Set(prev).add(idx));
    setUnfamiliarSentences((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const handleSentenceUnfamiliar = (idx: number): void => {
    setUnfamiliarSentences((prev) => new Set(prev).add(idx));
    setMasteredSentences((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  };

  const masteredCount = unit.keyWords.filter(
    (w) => masteredWords.has(wordDetailMap[w.toLowerCase()]?.id || `local-${w}`),
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-slate-300 text-sm hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} />
          返回单元列表
        </button>
         <div className="text-sm text-slate-500">
          {textbookTitle} / Unit {unit.unitOrder}
        </div>
      </div>

             <div className="relative rounded-2xl p-6 shadow-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 50%, #E0E7FF 100%)' }}>
        {/* 霓虹光晕装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/25 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute inset-0 border rounded-2xl pointer-events-none" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }} />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5' }}>
                Unit {unit.unitOrder}
              </span>
              {unit.topic && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#0891B2' }}>
                  主题：{unit.topic}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
             <h1 className="text-2xl font-bold mb-1 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #1E293B 0%, #6366F1 100%)' }}>
              {unit.title}
            </h1>
             <p className="text-base font-medium mb-3" style={{ color: '#64748B' }}>
              · {getUnitEnTitle()}
            </p>
             <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: '#64748B' }}>
              <span className="flex items-center gap-1.5">
                <BookMarked size={14} style={{ color: '#818CF8' }} />
                {unit.keyWords.length} 个重点单词
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} style={{ color: '#06B6D4' }} />
                {unit.keySentences.length} 个重点句型
              </span>
            </div>
            {/* 学习数据行 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(99, 102, 241, 0.12)' }}>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: '#06B6D4' }} />
                   <span className="text-sm" style={{ color: '#64748B' }}>
                     练习 <span className="font-semibold" style={{ color: '#0891B2' }}>{unitStatus.practiceMinutes}</span> 分钟
                </span>
              </div>
              {unitStatus.completionCount > 0 ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} style={{ color: '#34D399' }} />
                   <span className="text-sm" style={{ color: '#64748B' }}>
                     已完成 <span className="font-semibold" style={{ color: '#10B981' }}>{unitStatus.completionCount}</span> 次
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: '#FBBF24' }} />
                   <span className="text-sm" style={{ color: '#64748B' }}>
                     尚未完成
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="flex items-center gap-1 mb-2 justify-end">
              <Trophy size={18} style={{ color: '#FBBF24' }} />
               <span className="text-sm font-medium" style={{ color: '#475569' }}>
                 已掌握 <span className="text-lg font-bold" style={{ color: '#F59E0B' }}>{masteredCount}</span>/{unit.keyWords.length} 词
              </span>
            </div>
            {isChecked && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#6EE7B7' }}>
                <CheckCircle2 size={12} />
                今日已打卡
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setPracticeTab('words');
            setWordCardIndex(0);
          }}
          className={`p-4 rounded-xl border transition-all text-left ${
           practiceTab === 'words'
               ? 'bg-orange-500/20 border-orange-500/40 ring-2 ring-orange-500/30'
               : 'bg-white/5 border-white/10 hover:border-orange-500/40'
          }`}
        >
          <BookMarked
            size={24}
             className={practiceTab === 'words' ? 'text-orange-400' : 'text-slate-500'}
          />
          <p
            className={`mt-2 font-semibold ${
              practiceTab === 'words' ? 'text-orange-400' : 'text-slate-300'
            }`}
          >
            单词词卡
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {masteredCount}/{unit.keyWords.length} 已掌握
          </p>
        </button>

        <button
          onClick={() => handleTabClick('spelling')}
          className={`p-4 rounded-xl border transition-all text-left ${
             practiceTab === 'spelling'
               ? 'bg-orange-500/20 border-orange-500/40 ring-2 ring-orange-500/30'
               : 'bg-white/5 border-white/10 hover:border-orange-500/40'
          }`}
        >
          <Pencil
            size={24}
            className={practiceTab === 'spelling' ? 'text-orange-400' : 'text-slate-500'}
          />
          <p
            className={`mt-2 font-semibold ${
              practiceTab === 'spelling' ? 'text-orange-400' : 'text-slate-300'
            }`}
          >
            单词拼写
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {unit.keyWords.length} 个单词拼写
          </p>
          {practiceTab === 'spelling' && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {practiceMode === 'translation'
                ? '中译英'
                : practiceMode === 'listening'
                  ? '听力模式'
                  : '口语矫正'}
            </Badge>
          )}
        </button>

        <button
          onClick={() => handleTabClick('sentence')}
           className="p-4 rounded-xl border bg-white/5 border-white/10 hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10 transition-all text-left"
        >
           <Sparkles size={24} className="text-slate-500" />
           <p className="mt-2 font-semibold text-slate-300">句子练习</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {unit.keySentences.length} 句课文原句 · 4种模式
          </p>
          <Badge variant="secondary" className="mt-2 text-xs">
            进入练习
          </Badge>
        </button>

        <button
          onClick={() => setAiPanelOpen(true)}
           className="p-4 rounded-xl border bg-white/5 border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all text-left"
        >
          <Sparkles size={24} className="text-cyan-500" />
          <p className="mt-2 font-semibold text-cyan-700">AI 智能出题</p>
          <p className="text-xs text-gray-400 mt-0.5">
            根据知识点生成个性化练习题
          </p>
          <Badge variant="secondary" className="mt-2 text-xs">
            即时生成
          </Badge>
        </button>
      </div>

       <div className="glass-card p-6">
        {practiceTab === 'words' && unitWordList.length > 0 && (
          <WordFlashCard
            word={unitWordList[wordCardIndex]}
            index={wordCardIndex}
            total={unitWordList.length}
            onNext={() =>
              setWordCardIndex((prev) => Math.min(prev + 1, unitWordList.length - 1))
            }
            onPrev={() => setWordCardIndex((prev) => Math.max(prev - 1, 0))}
            onMaster={handleWordMaster}
          />
        )}

        {practiceTab === 'spelling' && (
          <WordPracticeV2
            words={unitWordList}
            mode={practiceMode}
            onComplete={(correct, total) =>
              logger.info(`单词练习完成：${correct}/${total}`)
            }
            onMarkMastered={(wordId) => handleWordMasterV2(wordId)}
            onMarkUnfamiliar={(wordId) => handleWordUnfamiliar(wordId)}
          />
        )}

      </div>

      <PracticeModeSelector
        open={modeSelectorOpen}
        currentMode={practiceMode}
        title={pendingTab === 'spelling' ? '选择单词练习模式' : '选择句子练习模式'}
        onSelect={handleModeSelect}
        onClose={() => {
          setModeSelectorOpen(false);
          setPendingTab(null);
        }}
      />

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => onUnitCheck(unit.id)}
          disabled={isChecked}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle2 size={18} />
          {isChecked ? '今日已打卡' : '完成本单元学习打卡'}
        </button>
      </div>

       <div className="glass-card p-5">
         <div className="flex items-center gap-2 mb-4">
           <Lightbulb size={18} className="text-yellow-400" />
           <h3 className="font-semibold text-white">重点句型一览</h3>
         </div>
         <div className="space-y-3">
           {unit.keySentences.map((s, idx) => (
             <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
               <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">
                 {idx + 1}
               </span>
               <div className="flex-1">
                 <div className="flex items-center gap-2">
                   <p className="text-white font-medium">{s}</p>
                   <SpeechButton text={s} size="sm" variant="ghost" />
                 </div>
                 <p className="text-sm text-slate-500 mt-0.5">
                  必背核心句型，用于{unit.topic || '单元主题'}场景
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {aiPanelOpen && (
        <AIQuestionPanel
          subject="english"
          grade={textbookTitle}
          semester="upper"
          unitId={unit.id}
          unitTitle={unit.title}
          knowledgePoint={unit.topic || ''}
          onClose={() => setAiPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default UnitDetailView;
