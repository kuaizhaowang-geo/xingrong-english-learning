import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Mic2,
  Volume2,
  BookOpen,
  Headphones,
  Palette,
  Keyboard,
  Cog,
  Shield,
  ChevronRight,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { learnersApi } from '@client/src/api';
import type { LearnerProfile } from '@shared/api.interface';

import PronunciationSection from './sections/PronunciationSection';
import SoundEffectsSection from './sections/SoundEffectsSection';
import AnswerSettingsSection from './sections/AnswerSettingsSection';
import ListeningSection from './sections/ListeningSection';
import PersonalizationSection from './sections/PersonalizationSection';
import ShortcutsSection from './sections/ShortcutsSection';
import SystemSection from './sections/SystemSection';
import { useSettingsStore } from './store/settingsStore';
import { useNavigate } from 'react-router-dom';

type TabKey =
  | 'pronunciation'
  | 'soundEffects'
  | 'answer'
  | 'listening'
  | 'personalization'
  | 'shortcuts'
  | 'system';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { key: 'pronunciation', label: '发音设置', icon: <Mic2 size={16} /> },
  { key: 'soundEffects', label: '音效设置', icon: <Volume2 size={16} /> },
  { key: 'answer', label: '答题设置', icon: <BookOpen size={16} /> },
  { key: 'listening', label: '听力设置', icon: <Headphones size={16} /> },
  { key: 'personalization', label: '个性化', icon: <Palette size={16} /> },
  { key: 'shortcuts', label: '快捷键', icon: <Keyboard size={16} /> },
  { key: 'system', label: '系统设置', icon: <Cog size={16} /> },
];

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('pronunciation');
  const tabsListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const syncFromBackend = useSettingsStore((s) => s.syncFromBackend);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await learnersApi.getMe();
      setProfile(data);
      // 用后端偏好覆盖本地缓存
      await syncFromBackend();
    } catch (err) {
      logger.error({ level: 'error', args: ['加载个人信息失败', err] });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updated: LearnerProfile): void => {
    setProfile(updated);
  };

  const activeTabItem = tabs.find((t: TabItem) => t.key === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4 sm:space-y-6">
             <div className="h-10 bg-white/10 rounded-xl w-40" />
             <div className="h-12 bg-white/10 rounded-xl w-full" />
             <div className="h-64 sm:h-96 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = (): React.ReactNode => (
    <>
      {/* 当前标签页标题 */}
      <div className="mb-4 sm:mb-5 flex items-center gap-2">
        <span style={{ color: '#6366F1' }}>{activeTabItem?.icon}</span>
         <h2 className="text-base sm:text-lg font-semibold text-white">
          {activeTabItem?.label}
        </h2>
        <div
          className="flex-1 h-px"
          style={{
            background:
              'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, transparent 100%)',
          }}
        />
      </div>

      <TabsContent value="pronunciation">
        <PronunciationSection />
      </TabsContent>
      <TabsContent value="soundEffects">
        <SoundEffectsSection />
      </TabsContent>
      <TabsContent value="answer">
        <AnswerSettingsSection />
      </TabsContent>
      <TabsContent value="listening">
        <ListeningSection />
      </TabsContent>
      <TabsContent value="personalization">
        <PersonalizationSection />
      </TabsContent>
      <TabsContent value="shortcuts">
        <ShortcutsSection />
      </TabsContent>
      <TabsContent value="system">
        <SystemSection
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      </TabsContent>
    </>
  );

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* Page Title */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Settings
              className="w-6 h-6"
              style={{
                color: '#6366F1',
                filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))',
              }}
            />
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{
                background:
                  'linear-gradient(135deg, #6366F1 0%, #2563EB 50%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              设置
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            定制你的学习体验
          </p>
        </div>

        {/* 防沉迷设置入口卡片 */}
        <button
          onClick={() => navigate('/parent-controls')}
          className="w-full mb-4 sm:mb-6 p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 text-left transition-all hover:scale-[1.01] min-h-14"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(67, 97, 238, 0.15) 100%)',
            border: '1px solid rgba(255, 107, 53, 0.25)',
          }}
        >
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #4361EE 100%)',
            }}
          >
            <Shield size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
               <div className="text-sm font-semibold text-white">
               防沉迷设置
            </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">
              家长控制、使用时长限制、夜间模式、使用报告
            </div>
          </div>
           <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
        </button>

        {/* Tabs - 手机端横向滚动Tab，桌面端左菜单右内容 */}
          <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(val: string) => setActiveTab(val as TabKey)}
            className="w-full"
          >
            {/* 手机端：顶部横向滚动Tab */}
            <div className="md:hidden px-2 pt-4 pb-2 border-b border-purple-500/10 overflow-x-auto scrollbar-hide">
              <TabsList
                className="w-max min-w-full inline-flex gap-1 p-1.5 rounded-2xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {tabs.map((tab: TabItem) => {
                  const active = activeTab === tab.key;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="relative px-3 py-2.5 min-h-11 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300 data-[state=active]:shadow-none border border-transparent"
                      style={{
                            color: active ? '#fff' : '#94a3b8',
                         background: active
                           ? 'linear-gradient(135deg, #D946EF 0%, #06B6D4 100%)'
                           : 'transparent',
                         boxShadow: active
                           ? '0 0 15px rgba(217, 70, 239, 0.3)'
                           : 'none',
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                      </span>
                      {active && (
                        <span
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                          style={{
                             background:
                               'linear-gradient(90deg, #06B6D4 0%, #D946EF 100%)',
                            boxShadow: '0 0 8px #06B6D4',
                          }}
                        />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* 桌面端：左菜单 + 右内容 分栏布局 */}
            <div className="hidden md:flex min-h-[600px]">
              {/* 左侧菜单 */}
              <div
                className="w-56 flex-shrink-0 border-r p-5"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              >
                <TabsList className="h-auto p-0 bg-transparent flex flex-col gap-1 w-full items-stretch">
                  {tabs.map((tab: TabItem) => {
                    const active = activeTab === tab.key;
                    return (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="justify-start px-3 py-2.5 min-h-11 text-sm rounded-xl transition-all duration-300 data-[state=active]:shadow-none border border-transparent w-full"
                        style={{
                          color: active ? '#fff' : '#64748B',
                          background: active
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.2) 100%)'
                            : 'transparent',
                          borderColor: active
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'transparent',
                        }}
                      >
                        <span
                          className="flex items-center gap-2 w-full"
                           style={{ color: active ? '#4F46E5' : '#64748B' }}
                        >
                          {tab.icon}
                          {tab.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* 右侧内容 */}
              <div className="flex-1 p-6 min-w-0">
                {renderContent()}
              </div>
            </div>

            {/* 手机端内容区 */}
            <div className="md:hidden p-4">
              {renderContent()}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
