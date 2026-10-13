import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Volume2, Heart, BookOpen, Sparkles, Search,
  ChevronLeft, ChevronRight, Lightbulb, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { WordDetailData } from '@client/src/utils/word-detail';
import { speakWord } from '@client/src/utils/word-detail';
import { getDictWordFull } from '@client/src/utils/word-dictionary';

interface SentenceWordDetailModalProps {
  wordDetail: WordDetailData | null;
  loading: boolean;
  onClose: () => void;
  onGoToWordLearning?: (word: string) => void;
  sentenceWords?: string[];
  currentWordIndex?: number;
  onWordIndexChange?: (idx: number) => void;
  onGoToDictionary?: (word: string) => void;
}

const POS_LABELS: Record<string, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  pronoun: '代词',
  preposition: '介词',
  conjunction: '连词',
  article: '冠词',
  numeral: '数词',
  auxiliary: '助动词',
  possessive: '物主代词',
  interjection: '感叹词',
};

const POS_COLORS: Record<string, string> = {
  noun: 'bg-green-100 text-green-700 border-green-200',
  verb: 'bg-orange-100 text-orange-700 border-orange-200',
  adjective: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  adverb: 'bg-pink-100 text-pink-700 border-pink-200',
  pronoun: 'bg-purple-100 text-purple-700 border-purple-200',
  preposition: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  conjunction: 'bg-gray-100 text-gray-600 border-gray-200',
  article: 'bg-amber-100 text-amber-700 border-amber-200',
  numeral: 'bg-red-100 text-red-700 border-red-200',
  auxiliary: 'bg-blue-100 text-blue-700 border-blue-200',
  possessive: 'bg-violet-100 text-violet-700 border-violet-200',
  interjection: 'bg-rose-100 text-rose-700 border-rose-200',
};


const SentenceWordDetailModal: React.FC<SentenceWordDetailModalProps> = ({
  wordDetail,
  loading,
  onClose,
  onGoToWordLearning,
  sentenceWords,
  currentWordIndex,
  onWordIndexChange,
  onGoToDictionary,
}) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState<boolean>(false);
  const [favLoading, setFavLoading] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [exampleSpeakingIdx, setExampleSpeakingIdx] = useState<number | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [isUnfamiliar, setIsUnfamiliar] = useState<boolean>(false);
  const [speakingUK, setSpeakingUK] = useState<boolean>(false);

  useEffect(() => {
    setIsFav(false);
    setShowAnalysis(false);
    setIsUnfamiliar(false);
    if (!wordDetail || wordDetail.source !== 'database' || !wordDetail.wordId) return;
    const checkFav = async (): Promise<void> => {
      try {
        const result = await wordsApi.checkFavorite(wordDetail.wordId);
        setIsFav(result.isFavorite);
      } catch (err) {
        logger.error('Failed to check favorite', { error: String(err) });
      }
    };
    void checkFav();
  }, [wordDetail]);

  const handleSpeak = useCallback((): void => {
    if (!wordDetail) return;
    setSpeaking(true);
    speakWord(wordDetail.word);
    setTimeout(() => setSpeaking(false), 800);
  }, [wordDetail]);

  const handleSpeakUK = useCallback((): void => {
    if (!wordDetail || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(wordDetail.word);
    utter.lang = 'en-GB';
    utter.rate = 0.9;
    setSpeakingUK(true);
    utter.onend = () => setSpeakingUK(false);
    window.speechSynthesis.speak(utter);
  }, [wordDetail]);

  const handleSpeakExample = useCallback((text: string, idx: number): void => {
    setExampleSpeakingIdx(idx);
    speakWord(text, 0.85);
    setTimeout(() => setExampleSpeakingIdx(null), 1500);
  }, []);

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    if (!wordDetail || wordDetail.source !== 'database' || !wordDetail.wordId) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await wordsApi.removeFavorite(wordDetail.wordId);
        setIsFav(false);
      } else {
        await wordsApi.addFavorite(wordDetail.wordId);
        setIsFav(true);
      }
    } catch (err) {
      logger.error('Failed to toggle favorite', { error: String(err) });
    } finally {
      setFavLoading(false);
    }
  }, [wordDetail, isFav]);

  const handleGoToDictionary = useCallback((): void => {
    if (!wordDetail) return;
    if (onGoToDictionary) {
      onGoToDictionary(wordDetail.word);
    } else {
      navigate(`/dictionary?word=${encodeURIComponent(wordDetail.word)}`);
    }
  }, [wordDetail, navigate, onGoToDictionary]);

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (wordDetail) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [wordDetail, handleKeyDown]);

  const handlePrevWord = useCallback((): void => {
    if (!sentenceWords || currentWordIndex === undefined) return;
    if (currentWordIndex > 0 && onWordIndexChange) {
      onWordIndexChange(currentWordIndex - 1);
    }
  }, [sentenceWords, currentWordIndex, onWordIndexChange]);

  const handleNextWord = useCallback((): void => {
    if (!sentenceWords || currentWordIndex === undefined) return;
    if (currentWordIndex < sentenceWords.length - 1 && onWordIndexChange) {
      onWordIndexChange(currentWordIndex + 1);
    }
  }, [sentenceWords, currentWordIndex, onWordIndexChange]);

  if (!wordDetail) return null;

  const dictEntry = wordDetail.source === 'builtin'
    ? getDictWordFull(wordDetail.word)
    : null;
  const phoneticUK = dictEntry?.phoneticUK || wordDetail.phonetic;
  const phoneticUS = dictEntry?.phoneticUS || wordDetail.phonetic;
  const definitions = dictEntry?.definitions;
  const rootData = null;

  const posLabel = POS_LABELS[wordDetail.partOfSpeech] || wordDetail.partOfSpeech;
  const posColor = POS_COLORS[wordDetail.partOfSpeech] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
<>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="relative glass-card rounded-2xl overflow-hidden shadow-xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-colors z-10"
              >
                <X size={16} />
              </button>

              {/* 右侧垂直工具栏 */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                <button
                  onClick={handleSpeak}
                  title="发音"
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all
                    ${speaking
                      ? 'bg-[#FF6B35] text-white scale-110 shadow-lg shadow-[#FF6B35]/30'
                      : 'bg-orange-50 text-[#FF6B35] hover:bg-orange-100 hover:scale-105 border border-orange-200'}
                  `}
                >
                  <Volume2 size={18} className={speaking ? 'animate-pulse' : ''} />
                </button>
                <button
                  onClick={handleGoToDictionary}
                  title="查看词典"
                  aria-label="查看词典"
                  data-testid="goto-dictionary-btn"
                  className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:scale-105 transition-all border border-blue-200"
                >
                  <Search size={20} />
                </button>
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading || wordDetail.source !== 'database'}
                  title={isFav ? '已收藏' : '收藏'}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all
                    ${isFav
                      ? 'bg-pink-50 text-pink-500 border border-pink-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:scale-105 border border-gray-200 hover:text-[#FF6B35] hover:border-[#FF6B35]/30'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="p-6 pr-16">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* 顶部操作按钮 */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className={`
                          px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5
                          ${showAnalysis
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}
                        `}
                      >
                        <Lightbulb size={14} />
                        解析
                      </button>
                      <button
                        onClick={() => setIsUnfamiliar(!isUnfamiliar)}
                        className={`
                          px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5
                          ${isUnfamiliar
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}
                        `}
                      >
                        <AlertCircle size={14} />
                        {isUnfamiliar ? '已标记' : '不熟悉'}
                      </button>
                    </div>

                    {/* 词根词缀解析面板 */}
                    <AnimatePresence>
                      {showAnalysis && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-4 bg-amber-50 rounded-xl p-3 border border-amber-200">
                            <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
                              <Lightbulb size={12} />
                              词根词缀
                            </p>
                            <p className="text-gray-800 text-sm mb-1">
                              {rootData ? rootData.root : '暂无词根词缀信息'}
                            </p>
                            <p className="text-gray-500 text-xs mb-2">
                              {rootData ? rootData.meaning : '该词为基础词汇，无常见词根拆解'}
                            </p>
                            {rootData && (
                              <div className="flex flex-wrap gap-1.5">
                                {rootData.examples.map((ex, idx) => (
                                  <span
                                    key={idx}
                                     className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30"
                                  >
                                    {ex}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* 单词标题 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                          {wordDetail.word}
                        </h2>
                        <button
                          onClick={handleGoToDictionary}
                          data-testid="dictionary-header-btn"
                          title="查看详细词典"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B35] text-white text-xs font-medium shadow-sm hover:bg-[#FF5A20] transition-colors"
                        >
                          <Search size={14} />
                          查词典
                        </button>
                      </div>
                      {/* 英式 + 美式音标 */}
                      <div className="flex flex-wrap gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">英</span>
  <span className="text-xs font-mono text-fuchsia-400">{phoneticUK}</span>
                           <button
                             onClick={handleSpeakUK}
                             className="text-gray-400 hover:text-fuchsia-400 transition-colors"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">美</span>
  <span className="text-xs font-mono text-fuchsia-400">{phoneticUS}</span>
                           <button
                             onClick={handleSpeak}
                             className="text-gray-400 hover:text-fuchsia-400 transition-colors"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      </div>
                      {wordDetail.partOfSpeech && (
                        <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-md border ${posColor}`}>
                          {posLabel}
                        </span>
                      )}
                    </div>

                    {/* 释义区 - 多词性多释义或单释义 */}
                    {definitions && definitions.length > 1 ? (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen size={12} />
                          中文释义
                        </h3>
                        <div className="space-y-2">
                          {definitions.map((def, idx) => {
                            const dPosLabel = POS_LABELS[def.partOfSpeech] || def.partOfSpeech;
                            const dPosColor = POS_COLORS[def.partOfSpeech] || 'bg-gray-100 text-gray-600 border-gray-200';
                            return (
                              <div key={idx} className="flex items-start gap-2">
                                <span className={`flex-shrink-0 mt-0.5 px-2 py-0.5 text-[11px] font-medium rounded-md border ${dPosColor}`}>
                                  {dPosLabel}
                                </span>
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {def.meaning}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen size={12} />
                          中文释义
                        </h3>
                        <p className="text-gray-800 text-base leading-relaxed">
                          {wordDetail.meaning}
                        </p>
                      </div>
                    )}

                    {wordDetail.examples.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles size={12} />
                          例句
                        </h3>
                        <div className="space-y-2">
                          {wordDetail.examples.slice(0, 2).map((ex, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {ex.en}
                                </p>
                                <button
                                  onClick={() => handleSpeakExample(ex.en, idx)}
                                  className={`
                                    flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all
                                    ${exampleSpeakingIdx === idx
                                      ? 'text-[#FF6B35] scale-110'
                                      : 'text-gray-400 hover:text-[#FF6B35]'}
                                  `}
                                >
                                  <Volume2 size={12} />
                                </button>
                              </div>
                              {ex.zh && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {ex.zh}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {wordDetail.relatedWords.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          相关单词
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {wordDetail.relatedWords.map((rw, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 rounded-md border border-blue-200"
                            >
                              {rw.word} <span className="text-gray-400">·</span> {rw.meaning}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 底部操作区 */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={handleToggleFavorite}
                        disabled={favLoading || wordDetail.source !== 'database'}
                        data-testid="favorite-btn"
                        className={`
                          flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                          flex items-center justify-center gap-2
                          ${isFav
                            ? 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-800'}
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
                        {isFav ? '已收藏' : '收藏'}
                      </button>
                      <button
                        onClick={handleGoToDictionary}
                        data-testid="dictionary-btn"
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FF6B35] text-white hover:bg-[#FF5A20] transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Search size={15} />
                        查词典
                      </button>
                    </div>

                    {/* 上下单词切换 */}
                    {sentenceWords && sentenceWords.length > 0 && currentWordIndex !== undefined && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 mt-4">
                        <button
                          onClick={handlePrevWord}
                          disabled={currentWordIndex <= 0}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-50 border border-gray-200 hover:text-gray-800 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={16} />
                          上一个
                        </button>
                        <span className="text-xs text-gray-400">
                          {currentWordIndex + 1} / {sentenceWords.length}
                        </span>
                        <button
                          onClick={handleNextWord}
                          disabled={currentWordIndex >= sentenceWords.length - 1}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-gray-500 bg-gray-50 border border-gray-200 hover:text-gray-800 hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          下一个
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    {wordDetail.source === 'builtin' && (
                      <p className="mt-3 text-center text-[11px] text-gray-400">
                        释义来自内置词典，仅供参考
                      </p>
                    )}
                    {wordDetail.source === 'none' && (
                      <p className="mt-3 text-center text-[11px] text-gray-400">
                        暂未收录该单词，更多信息持续更新中
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
</>
);
};

export default SentenceWordDetailModal;
