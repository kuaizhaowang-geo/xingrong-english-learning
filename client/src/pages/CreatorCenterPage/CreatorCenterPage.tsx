import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart2, Trophy, HelpCircle, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { creatorApi } from '@client/src/api';
import CreatorProfileCard, { StatsGrid } from './components/CreatorProfileCard';
import MyContentTab from './components/MyContentTab';
import DataStatsTab from './components/DataStatsTab';
import RankingTab from './components/RankingTab';
import CreationGuideTab from './components/CreationGuideTab';
import type { CreatorStatsData } from '@shared/api.interface';

type CreatorTab = 'content' | 'stats' | 'ranking' | 'guide';

const TABS: { value: CreatorTab; label: string; icon: React.ReactNode }[] = [
  { value: 'content', label: '我的内容', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'stats', label: '数据统计', icon: <BarChart2 className="w-4 h-4" /> },
  { value: 'ranking', label: '创作者排行', icon: <Trophy className="w-4 h-4" /> },
  { value: 'guide', label: '创作指引', icon: <HelpCircle className="w-4 h-4" /> },
];

const CreatorCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CreatorTab>('content');
  const [stats, setStats] = useState<CreatorStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        const data = await creatorApi.getCreatorStats();
        setStats(data);
      } catch (err) {
        logger.error('加载创作者数据失败', err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: '#6366F1' }} />
          <p style={{ color: '#94A3B8' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">创作者中心</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              管理你的内容，查看数据与收益
            </p>
          </div>
        </div>

        {/* 创作者信息卡 */}
        <div className="mb-6">
          <CreatorProfileCard stats={stats} />
        </div>

        {/* 数据概览 */}
        <div className="mb-6">
          <StatsGrid statsData={stats} />
        </div>

        {/* Tab 切换 */}
        <div
          className="flex rounded-xl p-1 mb-6 gap-1 overflow-x-auto"
           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex-1 min-w-[100px] px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{
                background: activeTab === tab.value
                  ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                  : 'transparent',
                color: activeTab === tab.value ? 'white' : '#94A3B8',
                boxShadow: activeTab === tab.value
                  ? '0 0 15px rgba(99, 102, 241, 0.25)'
                  : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        {activeTab === 'content' && <MyContentTab />}
        {activeTab === 'stats' && <DataStatsTab stats={stats} />}
        {activeTab === 'ranking' && <RankingTab />}
        {activeTab === 'guide' && <CreationGuideTab />}
      </div>
    </div>
  );
};

export default CreatorCenterPage;
