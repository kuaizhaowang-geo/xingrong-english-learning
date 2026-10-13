import React, { useState, useCallback } from 'react';
import { Volume2, Eye, BookOpen, Gamepad2 } from 'lucide-react';
import PhoneticDetailModal from './PhoneticDetailModal';
import BrowseView from './components/BrowseView';
import LearnView from './components/LearnView';
import PracticeView from './components/PracticeView';
import { usePhonicsData } from './hooks/usePhonicsData';
import type { PhoneticItem } from '@shared/api.interface';

type Mode = 'browse' | 'learn' | 'practice';

const PhoneticsPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('browse');
  const [selectedItem, setSelectedItem] = useState<PhoneticItem | null>(null);
  const {
    allItems,
    loading,
    summary,
    learnedIds,
    markLearned,
    submitPractice,
  } = usePhonicsData();

  const handleCardClick = useCallback((item: PhoneticItem): void => {
    setSelectedItem(item);
  }, []);

  const handleCloseModal = useCallback((): void => {
    setSelectedItem(null);
  }, []);

  const handleMarkLearned = useCallback(async (): Promise<void> => {
    if (!selectedItem) return;
    await markLearned(selectedItem.id);
  }, [selectedItem, markLearned]);

  const tabs: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: 'browse', label: '浏览模式', icon: <Eye size={16} /> },
    { key: 'learn', label: '学习模式', icon: <BookOpen size={16} /> },
    { key: 'practice', label: '练习模式', icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#6366F1' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: '#2563EB' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#06B6D4' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* 页面顶部 */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-[rgba(124_58_237_0.15)] border border-[rgba(124_58_237_0.3)]">
            <Volume2 size={14} className="text-[#818CF8]" />
            <span className="text-xs text-[#818CF8] font-medium">
              IPA 国际音标系统
            </span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{
              background:
                 'linear-gradient(135deg, #F1F5F9 0%, #818CF8 50%, #22D3EE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            国际音标课程
          </h1>
          <p className="text-[#94A3B8] text-base md:text-lg">
            {summary?.totalPhonetics || 48} 个国际音标，系统学习发音
          </p>
        </div>

        {/* 模式切换 */}
        <div className="flex justify-center mb-8 md:mb-10">
           <div className="inline-flex rounded-xl p-1 bg-white/5 border border-[rgba(124_58_237_0.3)]">
            {tabs.map(
              (t: {
                key: Mode;
                label: string;
                icon: React.ReactNode;
              }) => (
                <button
                  key={t.key}
                  onClick={(): void => setMode(t.key)}
                  className={`
                    px-5 py-2 rounded-lg text-sm font-medium
                    flex items-center gap-2
                    transition-all duration-200
                    ${
                       mode === t.key
                         ? 'text-white'
                          : 'text-[#94A3B8] hover:text-[#CBD5E1]'
                    }
                  `}
                  style={
                    mode === t.key
                      ? {
                          backgroundColor: 'rgba(99, 102, 241, 0.25)',
                          boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
                        }
                      : undefined
                  }
                >
                  {t.icon}
                  {t.label}
                </button>
              ),
            )}
          </div>
        </div>

        {/* 各模式内容 */}
        {mode === 'browse' && (
          <BrowseView
            items={allItems}
            summary={summary}
            learnedIds={learnedIds}
            loading={loading}
            onCardClick={handleCardClick}
          />
        )}
        {mode === 'learn' && (
          <LearnView
            items={allItems}
            learnedIds={learnedIds}
            onMarkLearned={markLearned}
          />
        )}
        {mode === 'practice' && (
          <PracticeView items={allItems} onSubmit={submitPractice} />
        )}
      </div>

      {/* 详情弹窗 */}
      <PhoneticDetailModal
        item={selectedItem}
        allItems={allItems}
        isLearned={selectedItem ? learnedIds.has(selectedItem.id) : false}
        onClose={handleCloseModal}
        onMarkLearned={handleMarkLearned}
      />
    </div>
  );
};

export default PhoneticsPage;
