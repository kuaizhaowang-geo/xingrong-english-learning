import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Type,
  MessageCircle,
  Feather,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getTextbookUnit,
  getChineseLessons,
  getChineseCharacters,
  getChinesePoetry,
} from '@client/src/api/textbooks';
import type {
  TextbookUnit,
  ChineseLesson,
  ChineseNewWord,
  ChinesePoetry,
  ChineseWordItem,
} from '@shared/api.interface';

type TabType = 'characters' | 'words' | 'sentences' | 'poetry';

const TABS: { value: TabType; label: string; icon: React.ReactNode }[] = [
  { value: 'characters', label: '生字', icon: <Feather size={14} /> },
  { value: 'words', label: '词语', icon: <Type size={14} /> },
  { value: 'sentences', label: '句子', icon: <MessageCircle size={14} /> },
  { value: 'poetry', label: '古诗', icon: <BookOpen size={14} /> },
];

const CARD_BG = '#FFFFFF';
const BORDER_COLOR = 'rgba(99, 102, 241, 0.2)';
const BORDER_BOTTOM = 'rgba(99, 102, 241, 0.12)';
const NEON_PURPLE = '#6366F1';
const NEON_CYAN = '#06B6D4';
const TEXT_PRIMARY = '#F1F5F9';
const TEXT_SECONDARY = '#94A3B8';
const BG_COLOR = '#EEF2FF';
const GLOW = '0 0 12px rgba(99, 102, 241, 0.3)';
const GLOW_SOFT = '0 0 20px rgba(99, 102, 241, 0.25)';

const ChineseLearningPage: React.FC = () => {
  const { textbookId, unitId } = useParams<{
    textbookId: string;
    unitId: string;
  }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [unit, setUnit] = useState<TextbookUnit | null>(null);
  const [lessons, setLessons] = useState<ChineseLesson[]>([]);
  const [characters, setCharacters] = useState<ChineseNewWord[]>([]);
  const [poetryList, setPoetryList] = useState<ChinesePoetry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  // 卡片索引
  const [charIndex, setCharIndex] = useState<number>(0);
  const [wordIndex, setWordIndex] = useState<number>(0);
  const [poetryIndex, setPoetryIndex] = useState<number>(0);
  const [poetryExpanded, setPoetryExpanded] = useState<boolean>(false);

  // 聚合词语列表（从所有课文的 wordList 合并）
  const allWords: ChineseWordItem[] = useMemo(() => {
    const result: ChineseWordItem[] = [];
    const seen = new Set<string>();
    for (const lesson of lessons) {
      if (lesson.wordList && lesson.wordList.length > 0) {
        for (const w of lesson.wordList) {
          if (!seen.has(w.word)) {
            seen.add(w.word);
            result.push(w);
          }
        }
      }
    }
    return result;
  }, [lessons]);

  const loadData = useCallback(async (): Promise<void> => {
    if (!textbookId || !unitId) {
      setLoadError('缺少参数');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [unitData, lessonsData, charsData, poetryData] =
        await Promise.all([
          getTextbookUnit(textbookId, unitId),
          getChineseLessons({ textbookId, unitId }),
          getChineseCharacters({ textbookId, unitId }),
          getChinesePoetry({ textbookId, unitId }),
        ]);
      setUnit(unitData);
      setLessons(lessonsData);
      setCharacters(charsData);
      setPoetryList(poetryData);
      setCharIndex(0);
      setWordIndex(0);
      setPoetryIndex(0);
    } catch (err: unknown) {
      logger.error(
        `ChineseLearningPage load failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      setLoadError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [textbookId, unitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const handlePrevChar = useCallback((): void => {
    setCharIndex((prev: number) =>
      prev > 0 ? prev - 1 : Math.max(0, characters.length - 1),
    );
  }, [characters.length]);

  const handleNextChar = useCallback((): void => {
    setCharIndex((prev: number) =>
      prev < characters.length - 1 ? prev + 1 : 0,
    );
  }, [characters.length]);

  const handlePrevWord = useCallback((): void => {
    setWordIndex((prev: number) =>
      prev > 0 ? prev - 1 : Math.max(0, allWords.length - 1),
    );
  }, [allWords.length]);

  const handleNextWord = useCallback((): void => {
    setWordIndex((prev: number) =>
      prev < allWords.length - 1 ? prev + 1 : 0,
    );
  }, [allWords.length]);

  const handlePrevPoetry = useCallback((): void => {
    setPoetryIndex((prev: number) =>
      prev > 0 ? prev - 1 : Math.max(0, poetryList.length - 1),
    );
    setPoetryExpanded(false);
  }, [poetryList.length]);

  const handleNextPoetry = useCallback((): void => {
    setPoetryIndex((prev: number) =>
      prev < poetryList.length - 1 ? prev + 1 : 0,
    );
    setPoetryExpanded(false);
  }, [poetryList.length]);

  const currentChar = characters[charIndex];
  const currentWord = allWords[wordIndex];
  const currentPoetry = poetryList[poetryIndex];

  // ===== 渲染 =====

  const renderLoading = (): React.ReactNode => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: NEON_PURPLE }}
        />
        <span style={{ color: TEXT_SECONDARY }} className="text-sm">
          加载中...
        </span>
      </div>
    </div>
  );

  const renderError = (): React.ReactNode => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <span style={{ color: TEXT_SECONDARY }} className="text-sm">
        {loadError}
      </span>
      <button
        onClick={() => {
          setLoadError('');
          loadData();
        }}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
          color: '#fff',
        }}
      >
        重新加载
      </button>
    </div>
  );

  // ===== 生字卡片 =====
  const renderCharacters = (): React.ReactNode => {
    if (characters.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span style={{ color: TEXT_SECONDARY }} className="text-sm">
            暂无生字
          </span>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <div className="flex items-center gap-4 w-full max-w-md">
          <button
            onClick={handlePrevChar}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="上一个"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            className="flex-1 rounded-xl p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: GLOW_SOFT,
            }}
          >
            <div
              className="text-5xl font-bold mb-3 leading-tight"
              style={{
                color: NEON_PURPLE,
                textShadow:
                  '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.25)',
              }}
            >
              {currentChar?.word}
            </div>
            <div
              className="text-xl mb-5"
              style={{ color: NEON_CYAN }}
            >
              {currentChar?.pinyin}
            </div>
            <div
              className="w-full text-sm space-y-1.5 border-t pt-4"
              style={{ color: TEXT_SECONDARY, borderColor: BORDER_BOTTOM }}
            >
              <div className="flex justify-between">
                <span>部首</span>
                <span style={{ color: TEXT_PRIMARY }}>
                  {currentChar?.radical}
                </span>
              </div>
              <div className="flex justify-between">
                <span>笔画</span>
                <span style={{ color: TEXT_PRIMARY }}>
                  {currentChar?.strokes} 画
                </span>
              </div>
              <div className="text-left pt-1">
                <div className="mb-1">释义</div>
                <div
                  className="leading-relaxed"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {currentChar?.meaning}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleNextChar}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="下一个"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // ===== 词语卡片 =====
  const renderWords = (): React.ReactNode => {
    if (allWords.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span style={{ color: TEXT_SECONDARY }} className="text-sm">
            暂无词语
          </span>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <div className="flex items-center gap-4 w-full max-w-md">
          <button
            onClick={handlePrevWord}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="上一个"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            className="flex-1 rounded-xl p-6 flex flex-col items-center text-center"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: GLOW_SOFT,
            }}
          >
            <div
              className="text-4xl font-bold mb-2"
              style={{
                color: NEON_PURPLE,
                textShadow:
                  '0 0 10px rgba(99, 102, 241, 0.4), 0 0 18px rgba(99, 102, 241, 0.25)',
              }}
            >
              {currentWord?.word}
            </div>
            <div
              className="text-lg mb-4"
              style={{ color: NEON_CYAN }}
            >
              {currentWord?.pinyin}
            </div>
            <div
              className="w-full text-sm pt-4 border-t text-center"
              style={{ color: TEXT_SECONDARY, borderColor: BORDER_BOTTOM }}
            >
              <div className="mb-1">释义</div>
              <div
                className="leading-relaxed"
                style={{ color: TEXT_PRIMARY }}
              >
                {currentWord?.meaning}
              </div>
            </div>
          </div>
          <button
            onClick={handleNextWord}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="下一个"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // ===== 句子/课文模式 =====
  const renderSentences = (): React.ReactNode => {
    if (lessons.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span style={{ color: TEXT_SECONDARY }} className="text-sm">
            暂无课文
          </span>
        </div>
      );
    }
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {lessons.map((lesson: ChineseLesson) => (
            <div
              key={lesson.id}
              className="rounded-xl p-5"
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${BORDER_COLOR}`,
              }}
            >
              <h3
                className="text-lg font-semibold mb-1"
                style={{ color: NEON_PURPLE }}
              >
                {lesson.title}
              </h3>
              {lesson.author && (
                <div className="text-xs mb-3" style={{ color: TEXT_SECONDARY }}>
                  作者：{lesson.author}
                </div>
              )}
              <div
                className="text-sm leading-loose whitespace-pre-line mb-4"
                style={{ color: TEXT_PRIMARY }}
              >
                {lesson.content}
              </div>
              {lesson.analysis && lesson.analysis.length > 0 && (
                <div
                  className="border-t pt-3 mt-3"
                  style={{ borderColor: BORDER_BOTTOM }}
                >
                  <div
                    className="text-xs font-semibold mb-2"
                    style={{ color: NEON_CYAN }}
                  >
                    关键句子
                  </div>
                  <div className="space-y-2">
                    {lesson.analysis.map(
                      (
                        point: { point: string; detail: string },
                        idx: number,
                      ) => (
                        <div
                          key={idx}
                          className="text-sm p-2.5 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.06)',
                            border: `1px solid ${BORDER_COLOR}`,
                          }}
                        >
                          <div
                            className="font-medium mb-1"
                            style={{ color: TEXT_PRIMARY }}
                          >
                            {point.point}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: TEXT_SECONDARY }}
                          >
                            {point.detail}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== 古诗卡片 =====
  const renderPoetry = (): React.ReactNode => {
    if (poetryList.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <span style={{ color: TEXT_SECONDARY }} className="text-sm">
            暂无古诗
          </span>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <div className="flex items-center gap-4 w-full max-w-md">
          <button
            onClick={handlePrevPoetry}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="上一首"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            className="flex-1 rounded-xl p-6 flex flex-col items-center text-center max-h-full overflow-hidden"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              boxShadow: GLOW_SOFT,
            }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: NEON_PURPLE }}
            >
              {currentPoetry?.title}
            </div>
            <div
              className="text-xs mb-4"
              style={{ color: NEON_CYAN }}
            >
              {currentPoetry?.dynasty
                ? `〔${currentPoetry.dynasty}〕`
                : ''}
              {currentPoetry?.author || ''}
            </div>
            <div
              className="flex-1 flex flex-col justify-center overflow-y-auto w-full mb-4"
            >
              {currentPoetry?.content?.map((line: string, idx: number) => (
                <div
                  key={idx}
                  className="text-xl leading-loose"
                  style={{ color: TEXT_PRIMARY }}
                >
                  {line}
                </div>
              ))}
            </div>
            {(currentPoetry?.translation || currentPoetry?.annotation) && (
              <button
                onClick={() => setPoetryExpanded((prev: boolean) => !prev)}
                className="w-full flex items-center justify-center gap-1 text-xs py-2 border-t"
                style={{ color: NEON_CYAN, borderColor: BORDER_BOTTOM }}
              >
                {poetryExpanded ? '收起译文注释' : '查看译文注释'}
                {poetryExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
            )}
            {poetryExpanded && (
              <div
                className="w-full text-left pt-3 space-y-3 overflow-y-auto max-h-40"
              >
                {currentPoetry?.translation && (
                  <div>
                    <div
                      className="text-xs font-semibold mb-1"
                      style={{ color: NEON_CYAN }}
                    >
                      译文
                    </div>
                    <div
                      className="text-sm leading-relaxed"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {currentPoetry.translation}
                    </div>
                  </div>
                )}
                {currentPoetry?.annotation && (
                  <div>
                    <div
                      className="text-xs font-semibold mb-1"
                      style={{ color: NEON_CYAN }}
                    >
                      注释
                    </div>
                    <div
                      className="text-sm leading-relaxed"
                      style={{ color: TEXT_PRIMARY }}
                    >
                      {currentPoetry.annotation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleNextPoetry}
            className="flex-shrink-0 p-3 rounded-full transition-all"
            style={{
              backgroundColor: CARD_BG,
              border: `1px solid ${BORDER_COLOR}`,
              color: TEXT_PRIMARY,
            }}
            aria-label="下一首"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderContent = (): React.ReactNode => {
    if (loading) return renderLoading();
    if (loadError) return renderError();
    switch (activeTab) {
      case 'characters':
        return renderCharacters();
      case 'words':
        return renderWords();
      case 'sentences':
        return renderSentences();
      case 'poetry':
        return renderPoetry();
      default:
        return null;
    }
  };

  // 进度文本
  const getProgressText = (): string => {
    if (loading || loadError) return '';
    switch (activeTab) {
      case 'characters':
        return characters.length > 0
          ? `第 ${charIndex + 1} / ${characters.length}`
          : '';
      case 'words':
        return allWords.length > 0
          ? `第 ${wordIndex + 1} / ${allWords.length}`
          : '';
      case 'poetry':
        return poetryList.length > 0
          ? `第 ${poetryIndex + 1} / ${poetryList.length}`
          : '';
      default:
        return '';
    }
  };

  const progressText = getProgressText();

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ backgroundColor: BG_COLOR, color: TEXT_PRIMARY }}
    >
      {/* ===== 顶部栏 ===== */}
      <div
        className="h-11 flex items-center justify-between px-3 flex-shrink-0 border-b"
        style={{ borderColor: BORDER_BOTTOM }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={handleBack}
            className="p-2 rounded-md transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: TEXT_SECONDARY }}
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </button>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: TEXT_PRIMARY }}
          >
            {unit?.title || '语文学习'}
          </span>
        </div>
        {/* 模式 Tab */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'rgba(26, 22, 53, 0.8)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all"
                style={
                  isActive
                    ? {
                        backgroundColor: NEON_PURPLE,
                        color: '#fff',
                        boxShadow: GLOW,
                      }
                    : {
                        color: TEXT_SECONDARY,
                      }
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 内容区 ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
        {/* 进度条 */}
        {progressText && (
          <div
            className="h-8 flex items-center justify-center text-xs flex-shrink-0 border-t"
            style={{ color: TEXT_SECONDARY, borderColor: BORDER_BOTTOM }}
          >
            {progressText}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChineseLearningPage;
