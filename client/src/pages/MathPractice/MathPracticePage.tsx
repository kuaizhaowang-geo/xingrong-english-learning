import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calculator, BookX, Brain, ChevronLeft } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  createMathPracticeSession,
  finishMathSession,
  getMathWrongQuestions,
  markMathWrongMastered,
  getMathPracticeStats,
  getMathKnowledgeMastery,
} from '@client/src/api/math-practice';
import type {
  MathPracticeItem,
  MathPracticeSession,
  MathWrongQuestion,
  MathKnowledgeMastery,
  MathPracticeStats,
} from '@shared/api.interface';
import SetupPanel from './components/SetupPanel';
import QuizView from './components/QuizView';
import ResultPanel from './components/ResultPanel';
import WrongBookTab from './components/WrongBookTab';
import KnowledgeTab from './components/KnowledgeTab';

type TabType = 'practice' | 'wrong' | 'knowledge';
type ViewState = 'setup' | 'quiz' | 'result';

interface WrongRecord {
  item: MathPracticeItem;
  userAnswer: string;
}

const MathPracticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('practice');
  const [view, setView] = useState<ViewState>('setup');

  // 设置
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['oral']);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [count, setCount] = useState<number>(20);

  // 练习状态
  const [session, setSession] = useState<MathPracticeSession | null>(null);
  const [items, setItems] = useState<MathPracticeItem[]>([]);
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>([]);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);

  // 错题本 & 知识点
  const [wrongQuestions, setWrongQuestions] = useState<MathWrongQuestion[]>([]);
  const [wrongTotal, setWrongTotal] = useState<number>(0);
  const [wrongPage, setWrongPage] = useState<number>(1);
  const [stats, setStats] = useState<MathPracticeStats | null>(null);
  const [masteryList, setMasteryList] = useState<MathKnowledgeMastery[]>([]);
  const [tabLoading, setTabLoading] = useState<boolean>(false);

  // 切换 Tab 时加载对应数据
  useEffect(() => {
    if (activeTab === 'wrong') {
      loadWrongQuestions(1);
    } else if (activeTab === 'knowledge') {
      loadKnowledgeData();
    }
  }, [activeTab]);

  const loadWrongQuestions = async (page: number): Promise<void> => {
    setTabLoading(true);
    try {
      const res = await getMathWrongQuestions({ page, pageSize: 10 });
      setWrongQuestions(res.items);
      setWrongTotal(res.total);
      setWrongPage(res.page);
    } catch (err) {
      logger.error('加载错题本失败', err as Error);
    } finally {
      setTabLoading(false);
    }
  };

  const loadKnowledgeData = async (): Promise<void> => {
    setTabLoading(true);
    try {
      const [statsData, masteryData] = await Promise.all([
        getMathPracticeStats(),
        getMathKnowledgeMastery(),
      ]);
      setStats(statsData);
      setMasteryList(masteryData);
    } catch (err) {
      logger.error('加载统计数据失败', err as Error);
    } finally {
      setTabLoading(false);
    }
  };

  const toggleItemType = (type: string): void => {
    setSelectedTypes((prev) => {
      const has = prev.includes(type);
      if (has) {
        const next = prev.filter((t) => t !== type);
        return next.length === 0 ? prev : next;
      }
      return [...prev, type];
    });
  };

  const startPractice = useCallback(async () => {
    setLoading(true);
    setWrongRecords([]);
    try {
      const res = await createMathPracticeSession({
        count,
        mode: 'mixed',
        itemTypes: selectedTypes,
        difficulty,
      });
      setSession(res.session);
      setItems(res.items);
      startTimeRef.current = Date.now();
      setView('quiz');
    } catch (err) {
      logger.error('创建练习会话失败', err as Error);
    } finally {
      setLoading(false);
    }
  }, [count, selectedTypes, difficulty]);

  const handleFinishQuiz = useCallback(
    async (wrongs: WrongRecord[], duration: number) => {
      setWrongRecords(wrongs);
      setTotalDuration(duration);
      if (session) {
        try {
          await finishMathSession(session.id, duration);
        } catch (err) {
          logger.error('结束会话失败', err as Error);
        }
      }
      setView('result');
    },
    [session],
  );

  const handleRestart = (): void => {
    setView('setup');
    setSession(null);
    setItems([]);
    setWrongRecords([]);
  };

  const handleMarkMastered = async (id: string): Promise<void> => {
    try {
      await markMathWrongMastered(id);
      loadWrongQuestions(wrongPage);
    } catch (err) {
      logger.error('标记掌握失败', err as Error);
    }
  };

  const correctCount = items.length - wrongRecords.length;
  const accuracy = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0;

  // 主内容渲染
  const renderContent = (): React.ReactNode => {
    if (activeTab === 'wrong') {
      return (
        <WrongBookTab
          wrongQuestions={wrongQuestions}
          wrongTotal={wrongTotal}
          loading={tabLoading}
          onMarkMastered={handleMarkMastered}
        />
      );
    }
    if (activeTab === 'knowledge') {
      return (
        <KnowledgeTab
          stats={stats}
          masteryList={masteryList}
          loading={tabLoading}
        />
      );
    }

    // practice tab
    if (view === 'setup') {
      return (
        <SetupPanel
          selectedTypes={selectedTypes}
          difficulty={difficulty}
          count={count}
          loading={loading}
          onToggleType={toggleItemType}
          onDifficultyChange={setDifficulty}
          onCountChange={setCount}
          onStart={startPractice}
        />
      );
    }
    if (view === 'quiz' && session) {
      return (
        <QuizView
          session={session}
          items={items}
          currentIndex={0}
          onFinish={handleFinishQuiz}
        />
      );
    }
    return (
      <ResultPanel
        accuracy={accuracy}
        correctCount={correctCount}
        totalCount={items.length}
        totalDuration={totalDuration}
        wrongRecords={wrongRecords}
        loading={loading}
        onRestart={handleRestart}
        onRetry={startPractice}
      />
    );
  };

  const isDeepTheme = activeTab === 'practice' && view === 'quiz';

  return (
    <div
      className="min-h-screen pb-20 transition-colors duration-300 bg-gradient-to-br from-[#0F0A1F] via-[#1A1035] to-[#0F0A1F]"
    >
      {/* 顶部返回栏（答题态） */}
      {activeTab === 'practice' && view === 'quiz' && (
          <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 bg-black/30 backdrop-blur-xl border-b border-white/10">
            <button
              onClick={handleRestart}
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors"
            >
            <ChevronLeft size={20} />
          </button>
          <div className="text-white font-semibold">数学练习</div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">{renderContent()}</div>

      {/* 底部 Tab */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-xl border-t border-white/10 z-20">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          {[
            {
              value: 'practice' as const,
              label: '练习',
              icon: Calculator,
              color: 'text-orange-500',
            },
            {
              value: 'wrong' as const,
              label: '错题本',
              icon: BookX,
              color: 'text-rose-500',
            },
            {
              value: 'knowledge' as const,
              label: '知识点',
              icon: Brain,
              color: 'text-blue-500',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-3 flex flex-col items-center gap-1 transition-colors ${
                   isActive ? tab.color : 'text-slate-500'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MathPracticePage;
