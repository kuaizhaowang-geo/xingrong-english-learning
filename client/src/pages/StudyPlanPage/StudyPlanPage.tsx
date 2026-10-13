import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Sparkles,
  BarChart3,
  ListChecks,
  Plus,
} from 'lucide-react';
import { studyPlanApi } from '@client/src/api';
import { logger } from '@client/src/api';
import type {
  PlanOverview,
  StudyPlanItem,
  PlanStatsResponse,
  AiPlanRecommendation,
  CreatePlanDto,
} from '@shared/api.interface';
import TodayPlanTab from './components/TodayPlanTab';
import PlanManagementTab from './components/PlanManagementTab';
import AIRecommendationTab from './components/AIRecommendationTab';
import StatsTab from './components/StatsTab';
import PlanDialog from './components/PlanDialog';
import { showConfirm } from '@lark-apaas/client-toolkit';

type TabKey = 'today' | 'plans' | 'ai' | 'stats';

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: 'today', label: '今日计划', icon: ListChecks },
  { key: 'plans', label: '计划管理', icon: CalendarDays },
  { key: 'ai', label: 'AI推荐', icon: Sparkles },
  { key: 'stats', label: '数据统计', icon: BarChart3 },
];

function StudyPlanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [loading, setLoading] = useState<Record<string, boolean>>({
    overview: true,
    plans: false,
    stats: false,
    ai: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<PlanOverview | null>(null);
  const [plans, setPlans] = useState<StudyPlanItem[]>([]);
  const [stats, setStats] = useState<PlanStatsResponse | null>(null);
  const [aiRec, setAiRec] = useState<AiPlanRecommendation | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StudyPlanItem | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading((l) => ({ ...l, overview: true }));
      const data = await studyPlanApi.getOverview();
      setOverview(data);
      setError(null);
    } catch (err) {
      logger.error('获取概览失败', err as Error);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading((l) => ({ ...l, overview: false }));
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading((l) => ({ ...l, plans: true }));
      const data = await studyPlanApi.getPlans();
      setPlans(data);
    } catch (err) {
      logger.error('获取计划列表失败', err as Error);
    } finally {
      setLoading((l) => ({ ...l, plans: false }));
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading((l) => ({ ...l, stats: true }));
      const data = await studyPlanApi.getStats();
      setStats(data);
    } catch (err) {
      logger.error('获取统计失败', err as Error);
    } finally {
      setLoading((l) => ({ ...l, stats: false }));
    }
  }, []);

  const fetchAiRec = useCallback(async () => {
    try {
      setLoading((l) => ({ ...l, ai: true }));
      const data = await studyPlanApi.getAiRecommendation();
      setAiRec(data);
    } catch (err) {
      logger.error('获取AI推荐失败', err as Error);
    } finally {
      setLoading((l) => ({ ...l, ai: false }));
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'plans' && plans.length === 0) fetchPlans();
    if (activeTab === 'stats' && !stats) fetchStats();
    if (activeTab === 'ai' && !aiRec) fetchAiRec();
  }, [activeTab, plans.length, stats, aiRec, fetchPlans, fetchStats, fetchAiRec]);

  const handleCreatePlan = async (dto: CreatePlanDto) => {
    await studyPlanApi.createPlan(dto);
    setDialogOpen(false);
    setEditingPlan(null);
    fetchOverview();
    fetchPlans();
  };

  const handleUpdatePlan = async (id: string, dto: Partial<CreatePlanDto>) => {
    await studyPlanApi.updatePlan(id, dto);
    setDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
    fetchOverview();
  };

  const handleDeletePlan = async (id: string) => {
    if (!await showConfirm('确定要删除此计划吗？')) return;
    await studyPlanApi.deletePlan(id);
    fetchPlans();
    fetchOverview();
  };

  const handleActivatePlan = async (id: string) => {
    await studyPlanApi.activatePlan(id);
    fetchPlans();
    fetchOverview();
  };

  const handleAcceptAiRec = async (dto: CreatePlanDto) => {
    await studyPlanApi.acceptAiRecommendation(dto);
    fetchOverview();
    fetchPlans();
  };

  const openCreateDialog = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const openEditDialog = (plan: StudyPlanItem) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const goToTask = (type: string) => {
    const routes: Record<string, string> = {
      word: '/word-library',
      sentence: '/practice/sentence',
      dictation: '/practice/dictation',
      phonetic: '/phonetics',
      aiQuiz: '/ai-quiz',
    };
    const route = routes[type];
    if (route) navigate(route);
  };

  return (
    <div className="min-h-screen w-full text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">
            学习计划
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            科学规划，高效学习，每天进步一点点
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 p-1.5 rounded-xl mb-6 glass-card"
         >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === key
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                activeTab === key
                  ? {
                      background: 'linear-gradient(135deg, #D946EF 0%, #06B6D4 100%)',
                      boxShadow: '0 0 20px rgba(217, 70, 239, 0.35)',
                    }
                  : {}
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 p-4 rounded-xl text-sm text-rose-300"
             style={{
               backgroundColor: 'rgba(244, 63, 94, 0.1)',
               border: '1px solid rgba(244, 63, 94, 0.3)',
             }}
          >
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === 'today' && (
            <TodayPlanTab
              loading={loading.overview}
              overview={overview}
              onGoStudy={goToTask}
              onCreatePlan={openCreateDialog}
            />
          )}
          {activeTab === 'plans' && (
            <PlanManagementTab
              loading={loading.plans}
              plans={plans}
              onActivate={handleActivatePlan}
              onEdit={openEditDialog}
              onDelete={handleDeletePlan}
              onCreate={openCreateDialog}
              onRefresh={fetchPlans}
            />
          )}
          {activeTab === 'ai' && (
            <AIRecommendationTab
              loading={loading.ai}
              recommendation={aiRec}
              onRegenerate={fetchAiRec}
              onAccept={handleAcceptAiRec}
            />
          )}
          {activeTab === 'stats' && (
            <StatsTab loading={loading.stats} stats={stats} />
          )}
        </div>
      </div>

      {/* Floating create button for plans tab */}
      {activeTab === 'plans' && (
        <button
          onClick={openCreateDialog}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 z-40"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.35)',
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Plan Dialog */}
      {dialogOpen && (
        <PlanDialog
          plan={editingPlan}
          onClose={() => {
            setDialogOpen(false);
            setEditingPlan(null);
          }}
          onSubmit={(dto) =>
            editingPlan
              ? handleUpdatePlan(editingPlan.id, dto)
              : handleCreatePlan(dto as CreatePlanDto)
          }
        />
      )}
    </div>
  );
}

export default StudyPlanPage;
