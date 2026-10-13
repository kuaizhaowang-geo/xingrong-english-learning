import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi, wordsApi } from '@client/src/api';
import type { TextbookTreeItem, WordItem } from '@shared/api.interface';

import WarehouseTab from './tabs/WarehouseTab';
import WordDetailModal from '../WordLibraryPage/WordDetailModal';

type TabKey = 'warehouse';

const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { key: 'warehouse', label: '单词仓库', icon: BookOpen },
];

const WordLearningPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab') as TabKey | null;

  const [activeTab, setActiveTab] = useState<TabKey>('warehouse');
  const [detailWord, setDetailWord] = useState<WordItem | null>(null);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [textbooks, setTextbooks] = useState<TextbookTreeItem[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    if (!detailWord) {
      setIsFav(false);
      return;
    }
    const checkFav = async (): Promise<void> => {
      try {
        const res = await wordsApi.checkFavorite(detailWord.id);
        setIsFav(res.isFavorite);
      } catch (err) {
        logger.error('Failed to check favorite', { error: String(err) });
      }
    };
    void checkFav();
  }, [detailWord]);

  useEffect(() => {
    const loadBooks = async (): Promise<void> => {
      try {
        const data = await textbooksApi.getTextbookTree();
        setTextbooks(data);
      } catch (err) {
        logger.error('Failed to load textbooks', { error: String(err) });
      } finally {
        setLoadingBooks(false);
      }
    };
    void loadBooks();
  }, []);

  const handleTabChange = useCallback((tab: TabKey): void => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const handleWordClick = useCallback((word: WordItem): void => {
    setDetailWord(word);
  }, []);

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    if (!detailWord) return;
    try {
      if (isFav) {
        await wordsApi.removeFavorite(detailWord.id);
        setIsFav(false);
      } else {
        await wordsApi.addFavorite(detailWord.id);
        setIsFav(true);
      }
    } catch (err) {
      logger.error('Failed to toggle favorite', { error: String(err) });
    }
  }, [detailWord, isFav]);

  const handleStartRecite = useCallback((): void => {
    setDetailWord(null);
  }, []);

  const tabContent = useMemo(() => {
    const commonProps = {
      textbooks,
      loadingBooks,
      onWordClick: handleWordClick,
    };
    switch (activeTab) {
      case 'warehouse':
        return <WarehouseTab {...commonProps} />;
      default:
        return null;
    }
  }, [activeTab, textbooks, loadingBooks, handleWordClick]);

  return (
     <div className="min-h-screen text-white">
      {/* 顶部装饰 */}
       <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* 标题区 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#2563EB] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
              <Sparkles size={20} />
            </div>
            <div>
               <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                 单词学习
               </h1>
                <p className="text-sm text-slate-400">浏览单词，一站式掌握</p>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="mb-6">
           <div className="inline-flex p-1.5 bg-white/5 rounded-xl border border-[rgba(124_58_237_0.3)]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300
                    flex items-center gap-2
                    ${isActive
                      ? 'text-white bg-gradient-to-r from-[#6366F1] to-[#2563EB] shadow-md shadow-[#6366F1]/20'
                        : 'text-slate-400 hover:text-white hover:bg-[rgba(124_58_237_0.15)]'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 内容区 */}
        <div
          key={activeTab}
          className="animate-fade-in"
          style={{ animation: 'fadeInUp 0.3s ease-out' }}
        >
          {tabContent}
        </div>
      </div>

      {/* 单词详情弹窗 */}
      {detailWord && (
        <WordDetailModal
          word={detailWord}
          isFav={isFav}
          onClose={() => setDetailWord(null)}
          onToggleFavorite={handleToggleFavorite}
          onStartRecite={handleStartRecite}
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WordLearningPage;
