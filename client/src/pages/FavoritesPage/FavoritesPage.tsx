import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Sparkles, BookOpen, BookMarked, GraduationCap, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { courseFavoritesApi, sentenceFavoritesApi, wordsApi } from '@client/src/api';
import CourseFavorites from './CourseFavorites';
import WordFavorites from './WordFavorites';
import SentenceFavorites from './SentenceFavorites';
import type { CourseItem } from '@shared/api.interface';
import type { SentencePuzzle } from '@shared/api.interface';
import type { WordItem } from '@shared/api.interface';

type TabKey = 'courses' | 'words' | 'sentences';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { key: 'courses', label: '课程珍藏', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'words', label: '单词珍藏', icon: <BookMarked className="w-4 h-4" /> },
  { key: 'sentences', label: '句子珍藏', icon: <BookOpen className="w-4 h-4" /> },
];

interface LoadState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  notLoggedIn: boolean;
}

const FavoritesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('courses');

  const [coursesState, setCoursesState] = useState<LoadState<CourseItem>>({
    data: [],
    loading: false,
    error: null,
    notLoggedIn: false,
  });

  const [wordsState, setWordsState] = useState<LoadState<WordItem>>({
    data: [],
    loading: false,
    error: null,
    notLoggedIn: false,
  });

  const [sentencesState, setSentencesState] = useState<LoadState<SentencePuzzle>>({
    data: [],
    loading: false,
    error: null,
    notLoggedIn: false,
  });

  const loadCourses = useCallback(async (): Promise<void> => {
    setCoursesState((prev) => ({ ...prev, loading: true, error: null, notLoggedIn: false }));
    try {
      const data: CourseItem[] = await courseFavoritesApi.getFavorites();
      setCoursesState({ data, loading: false, error: null, notLoggedIn: false });
    } catch (err) {
      const error = err as { response?: { status: number }; message?: string };
      logger.error('加载课程珍藏失败', error.message || String(err));
      if (error.response?.status === 401) {
        setCoursesState({ data: [], loading: false, error: null, notLoggedIn: true });
      } else {
        setCoursesState({
          data: [],
          loading: false,
          error: '加载失败，请稍后重试',
          notLoggedIn: false,
        });
      }
    }
  }, []);

  const loadWords = useCallback(async (): Promise<void> => {
    setWordsState((prev) => ({ ...prev, loading: true, error: null, notLoggedIn: false }));
    try {
      const data: WordItem[] = await wordsApi.getFavorites();
      setWordsState({ data, loading: false, error: null, notLoggedIn: false });
    } catch (err) {
      const error = err as { response?: { status: number }; message?: string };
      logger.error('加载单词珍藏失败', error.message || String(err));
      if (error.response?.status === 401) {
        setWordsState({ data: [], loading: false, error: null, notLoggedIn: true });
      } else {
        setWordsState({
          data: [],
          loading: false,
          error: '加载失败，请稍后重试',
          notLoggedIn: false,
        });
      }
    }
  }, []);

  const loadSentences = useCallback(async (): Promise<void> => {
    setSentencesState((prev) => ({ ...prev, loading: true, error: null, notLoggedIn: false }));
    try {
      const data: SentencePuzzle[] = await sentenceFavoritesApi.getFavorites();
      setSentencesState({ data, loading: false, error: null, notLoggedIn: false });
    } catch (err) {
      const error = err as { response?: { status: number }; message?: string };
      logger.error('加载句子珍藏失败', error.message || String(err));
      if (error.response?.status === 401) {
        setSentencesState({ data: [], loading: false, error: null, notLoggedIn: true });
      } else {
        setSentencesState({
          data: [],
          loading: false,
          error: '加载失败，请稍后重试',
          notLoggedIn: false,
        });
      }
    }
  }, []);

  // 挂载时加载课程（默认 tab）
  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  // tab 切换时加载对应数据（仅首次加载）
  useEffect(() => {
    if (activeTab === 'words' && wordsState.data.length === 0 && !wordsState.loading && !wordsState.error) {
      void loadWords();
    }
    if (activeTab === 'sentences' && sentencesState.data.length === 0 && !sentencesState.loading && !sentencesState.error) {
      void loadSentences();
    }
  }, [activeTab, loadWords, loadSentences, wordsState, sentencesState]);

  const handleRemoveCourse = useCallback(
    async (id: string): Promise<void> => {
      try {
        await courseFavoritesApi.removeFavorite(id);
        setCoursesState((prev) => ({
          ...prev,
          data: prev.data.filter((c) => c.id !== id),
        }));
      } catch (err) {
        const error = err as { message?: string };
        logger.error('取消课程珍藏失败', error.message || String(err));
      }
    },
    [],
  );

  const handleRemoveWord = useCallback(
    async (id: string): Promise<void> => {
      try {
        await wordsApi.removeFavorite(id);
        setWordsState((prev) => ({
          ...prev,
          data: prev.data.filter((w) => w.id !== id),
        }));
      } catch (err) {
        const error = err as { message?: string };
        logger.error('取消单词珍藏失败', error.message || String(err));
      }
    },
    [],
  );

  const handleRemoveSentence = useCallback(
    async (id: string): Promise<void> => {
      try {
        await sentenceFavoritesApi.removeFavorite(id);
        setSentencesState((prev) => ({
          ...prev,
          data: prev.data.filter((s) => s.id !== id),
        }));
      } catch (err) {
        const error = err as { message?: string };
        logger.error('取消句子珍藏失败', error.message || String(err));
      }
    },
    [],
  );

  const totalCount =
    coursesState.data.length + wordsState.data.length + sentencesState.data.length;

  const getCount = (key: TabKey): number => {
    switch (key) {
      case 'courses':
        return coursesState.data.length;
      case 'words':
        return wordsState.data.length;
      case 'sentences':
        return sentencesState.data.length;
    }
  };

  const renderLoading = (): React.ReactNode => (
     <div
       className="glass-card flex flex-col items-center justify-center py-20 rounded-2xl"
     >
       <Loader2 className="w-10 h-10 animate-spin mb-4 text-fuchsia-400" />
       <p className="text-sm text-slate-400">
         加载中...
       </p>
     </div>
  );

  const renderError = (message: string): React.ReactNode => (
     <div
       className="glass-card flex flex-col items-center justify-center py-20 rounded-2xl border-rose-500/30"
     >
       <p className="text-base font-medium mb-2 text-rose-300">
         {message}
       </p>
     </div>
  );

  const renderNotLoggedIn = (): React.ReactNode => (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-2xl"
      style={{
        background:
          'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, rgba(26, 22, 53, 0.3) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
      }}
    >
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
        style={{
          background:
            'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        }}
      >
        <Heart className="w-14 h-14" style={{ color: '#6366F1' }} />
      </div>
        <h3 className="text-lg font-semibold mb-2 text-white">
          登录后可同步珍藏数据
       </h3>
       <p className="text-sm text-slate-400">
        登录后即可在多设备间同步你的珍藏内容
      </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Heart
                className="w-8 h-8"
                style={{ color: '#6366F1', fill: '#6366F1' }}
              />
              <Sparkles
                className="w-4 h-4 absolute -top-1 -right-1"
                style={{ color: '#06B6D4' }}
              />
            </div>
             <h1 className="text-2xl font-bold text-white">
               我的珍藏
             </h1>
           </div>
           <p className="text-slate-400 text-sm">
            已珍藏{' '}
            <span
              className="font-semibold"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {totalCount}
            </span>{' '}
            项精选内容，持续学习不断精进
          </p>
        </div>

        {/* 分类标签栏 - 横向滚动 */}
        <div className="mb-8 overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = getCount(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 font-medium text-sm"
                  style={{
                      backgroundColor: isActive ? 'rgba(217, 70, 239, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isActive ? '#fff' : '#cbd5e1',
                     border: isActive
                       ? '1px solid rgba(217, 70, 239, 0.4)'
                       : '1px solid rgba(255, 255, 255, 0.1)',
                     boxShadow: isActive
                       ? '0 0 20px rgba(217, 70, 239, 0.25)'
                       : 'none',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                       backgroundColor: isActive
                         ? 'rgba(217, 70, 239, 0.3)'
                         : 'rgba(255, 255, 255, 0.08)',
                        color: isActive ? '#f0abfc' : '#94a3b8',
                    }}
                  >
                    {count}
                  </span>
                  {/* 底部渐变指示条 */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                      style={{
                         background:
                           'linear-gradient(90deg, #D946EF 0%, #06B6D4 100%)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 内容区 */}
        <div>
          {activeTab === 'courses' && (
            <>
              {coursesState.loading && renderLoading()}
              {!coursesState.loading && coursesState.error && renderError(coursesState.error)}
              {!coursesState.loading && !coursesState.error && coursesState.notLoggedIn && renderNotLoggedIn()}
              {!coursesState.loading && !coursesState.error && !coursesState.notLoggedIn && (
                <CourseFavorites
                  items={coursesState.data}
                  onRemove={handleRemoveCourse}
                />
              )}
            </>
          )}
          {activeTab === 'words' && (
            <>
              {wordsState.loading && renderLoading()}
              {!wordsState.loading && wordsState.error && renderError(wordsState.error)}
              {!wordsState.loading && !wordsState.error && wordsState.notLoggedIn && renderNotLoggedIn()}
              {!wordsState.loading && !wordsState.error && !wordsState.notLoggedIn && (
                <WordFavorites items={wordsState.data} onRemove={handleRemoveWord} />
              )}
            </>
          )}
          {activeTab === 'sentences' && (
            <>
              {sentencesState.loading && renderLoading()}
              {!sentencesState.loading && sentencesState.error && renderError(sentencesState.error)}
              {!sentencesState.loading && !sentencesState.error && sentencesState.notLoggedIn && renderNotLoggedIn()}
              {!sentencesState.loading && !sentencesState.error && !sentencesState.notLoggedIn && (
                <SentenceFavorites
                  items={sentencesState.data}
                  onRemove={handleRemoveSentence}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
