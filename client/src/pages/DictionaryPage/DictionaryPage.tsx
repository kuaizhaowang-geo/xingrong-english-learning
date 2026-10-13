import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Volume2, Star, BookOpen, Sparkles,
  Shuffle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getDictWordFull,
  type DictWordEntry,
} from '@client/src/utils/word-dictionary';

type TabKey = 'dict' | 'collocation' | 'example' | 'synonym';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'dict', label: '英汉-汉英词典' },
  { key: 'collocation', label: '词组搭配' },
  { key: 'example', label: '英语例句库' },
  { key: 'synonym', label: '近义、反义、联想词' },
];

const POS_LABELS: Record<string, string> = {
  noun: '名词', verb: '动词', adjective: '形容词', adverb: '副词',
  pronoun: '代词', preposition: '介词', conjunction: '连词',
  article: '冠词', numeral: '数词', auxiliary: '助动词',
  possessive: '物主代词', interjection: '感叹词',
};

const DictionaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlWord = searchParams.get('word') || 'apple';
  const [searchInput, setSearchInput] = useState<string>(urlWord);
  const [activeTab, setActiveTab] = useState<TabKey>('dict');
  const [isFav, setIsFav] = useState<boolean>(false);
  const [isInWordbook, setIsInWordbook] = useState<boolean>(false);
  const [speakingUK, setSpeakingUK] = useState<boolean>(false);
  const [speakingUS, setSpeakingUS] = useState<boolean>(false);

  const entry: DictWordEntry | null = useMemo(
    () => getDictWordFull(urlWord),
    [urlWord],
  );

  useEffect(() => {
    setSearchInput(urlWord);
    setIsFav(false);
    setIsInWordbook(false);
  }, [urlWord]);

  const handleSearch = useCallback((): void => {
    const w = searchInput.trim().toLowerCase();
    if (!w) return;
    setSearchParams({ word: w });
  }, [searchInput, setSearchParams]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const speak = useCallback((word: string, lang: string, setSpeaking: (v: boolean) => void): void => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = lang;
    utter.rate = 0.9;
    setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const handleClickWord = useCallback((word: string): void => {
    setSearchParams({ word: word.toLowerCase() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  const handleBack = useCallback((): void => {
    navigate(-1);
  }, [navigate]);

  const allExamples = useMemo(() => {
    if (!entry) return [];
    const exs: Array<{ en: string; zh: string }> = [];
    if (entry.definitions) {
      for (const def of entry.definitions) {
        if (def.examples) exs.push(...def.examples);
      }
    }
    if (exs.length === 0) return entry.examples || [];
    return exs;
  }, [entry]);

  const recommendedWords = useMemo(() => {
    if (!entry) return [];
    return entry.related || entry.relatedWords || [];
  }, [entry]);

  if (!entry) {
    return (
      <div className="min-h-screen text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center hover:bg-fuchsia-500/25 transition-colors border border-fuchsia-500/20"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-white">词典</h1>
          </div>
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-slate-400">未收录单词 &quot;{urlWord}&quot;</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-20 bg-[#0F0D24]/80 backdrop-blur-md border-b border-fuchsia-500/15">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex-shrink-0 rounded-xl bg-fuchsia-500/15 text-fuchsia-300 flex items-center justify-center hover:bg-fuchsia-500/25 transition-colors border border-fuchsia-500/20"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-fuchsia-500/40 transition-colors">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入单词搜索..."
              className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-medium shadow-md shadow-fuchsia-500/30 hover:shadow-lg hover:shadow-fuchsia-500/40 transition-all"
          >
            搜索
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* 单词标题区 */}
        <motion.div
          key={entry.word}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-white tracking-tight mb-3">
              {entry.word}
            </h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-400">英</span>
                <span className="text-sm font-mono text-fuchsia-400">
                  {entry.phoneticUK || entry.phonetic}
                </span>
                <button
                  onClick={() => speak(entry.word, 'en-GB', setSpeakingUK)}
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center transition-all
                    ${speakingUK
                      ? 'bg-fuchsia-400 text-black scale-110'
                      : 'bg-fuchsia-400/15 text-fuchsia-400 hover:bg-fuchsia-400/30'}
                  `}
                >
                  <Volume2 size={14} className={speakingUK ? 'animate-pulse' : ''} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-400">美</span>
                <span className="text-sm font-mono text-fuchsia-400">
                  {entry.phoneticUS || entry.phonetic}
                </span>
                <button
                  onClick={() => speak(entry.word, 'en-US', setSpeakingUS)}
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center transition-all
                    ${speakingUS
                      ? 'bg-fuchsia-400 text-black scale-110'
                      : 'bg-fuchsia-400/15 text-fuchsia-400 hover:bg-fuchsia-400/30'}
                  `}
                >
                  <Volume2 size={14} className={speakingUS ? 'animate-pulse' : ''} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFav(!isFav)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                   ${isFav
                     ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                     : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}
                `}
              >
                <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                {isFav ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={() => setIsInWordbook(!isInWordbook)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                   ${isInWordbook
                     ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                     : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}
                `}
              >
                <BookOpen size={16} />
                {isInWordbook ? '已加入' : '生词本'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 标签页 */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                   ${activeTab === tab.key
                      ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-md shadow-fuchsia-500/30'
                      : 'bg-white/5 text-slate-300 border border-white/10 hover:text-white hover:border-fuchsia-500/30'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 标签内容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dict' && (
               <div className="glass-card rounded-2xl p-5 space-y-5">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <BookOpen size={14} />
                   词典释义
                 </h3>
                {entry.definitions && entry.definitions.length > 0 ? (
                  <div className="space-y-4">
                    {entry.definitions.map((def, idx) => {
                      const posLabel = POS_LABELS[def.partOfSpeech] || def.partOfSpeech;
                      return (
                        <div
                          key={idx}
                           className="pb-4 border-b border-white/10 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2 mb-2">
                             <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                              {posLabel}
                            </span>
                              <span className="text-white font-medium">
                              {def.meaning}
                            </span>
                          </div>
                          {def.examples && def.examples.length > 0 && (
                            <div className="space-y-2 ml-2">
                              {def.examples.map((ex, eIdx) => (
                                <div
                                  key={eIdx}
                                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                                >
                                    <p className="text-slate-200 text-sm leading-relaxed">
                                    {ex.en}
                                  </p>
                                  {ex.zh && (
                                     <p className="text-slate-400 text-xs mt-1">
                                      {ex.zh}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <p className="text-slate-400 text-sm">暂无详细释义</p>
                )}
              </div>
            )}

            {activeTab === 'collocation' && (
               <div className="glass-card rounded-2xl p-5 space-y-4">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <Sparkles size={14} />
                   词组搭配
                 </h3>
                {entry.collocations && entry.collocations.length > 0 ? (
                  <div className="space-y-2">
                    {entry.collocations.map((col, idx) => (
                      <div
                        key={idx}
                         className="flex items-start justify-between gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                      >
                          <span className="text-white text-sm font-medium">{col.phrase}</span>
                         <span className="text-slate-400 text-sm text-right">{col.meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-slate-400 text-sm">暂无词组搭配</p>
                )}
              </div>
            )}

            {activeTab === 'example' && (
               <div className="glass-card rounded-2xl p-5 space-y-4">
                 <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <Sparkles size={14} />
                   英语例句
                 </h3>
                {allExamples.length > 0 ? (
                  <div className="space-y-3">
                    {allExamples.map((ex, idx) => (
                      <div
                        key={idx}
                         className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-1">
                           <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-xs font-medium">
                            {idx + 1}
                          </span>
                           <p className="text-slate-200 text-sm leading-relaxed">{ex.en}</p>
                        </div>
                        {ex.zh && (
                           <p className="text-slate-400 text-sm ml-7">{ex.zh}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-slate-400 text-sm">暂无例句</p>
                )}
              </div>
            )}

            {activeTab === 'synonym' && (
              <div className="space-y-4">
                {/* 近义词 */}
                 <div className="glass-card rounded-2xl p-5">
                   <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Sparkles size={14} />
                     近义词
                   </h3>
                  {entry.synonyms && entry.synonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {entry.synonyms.map((w, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleClickWord(w)}
                           className="px-3 py-1.5 text-sm bg-cyan-500/10 text-cyan-300 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 hover:scale-105 transition-all"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  ) : (
                     <p className="text-slate-400 text-sm">暂无近义词</p>
                  )}
                </div>
                {/* 反义词 */}
                 <div className="glass-card rounded-2xl p-5">
                   <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Shuffle size={14} />
                     反义词
                   </h3>
                  {entry.antonyms && entry.antonyms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {entry.antonyms.map((w, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleClickWord(w)}
                           className="px-3 py-1.5 text-sm bg-pink-500/10 text-pink-300 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 hover:scale-105 transition-all"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  ) : (
                     <p className="text-slate-400 text-sm">暂无反义词</p>
                  )}
                </div>
                {/* 联想词 */}
                 <div className="glass-card rounded-2xl p-5">
                   <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <Star size={14} />
                     联想词
                   </h3>
                  {recommendedWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recommendedWords.map((rw, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleClickWord(rw.word)}
                           className="px-3 py-1.5 text-sm bg-fuchsia-500/10 text-fuchsia-300 rounded-lg border border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
                        >
                          <span>{rw.word}</span>
                           <span className="text-slate-400 text-xs">· {rw.meaning}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                     <p className="text-slate-400 text-sm">暂无联想词</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 底部相关推荐 */}
        {recommendedWords.length > 0 && (
           <div className="glass-card rounded-2xl p-5">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <ChevronRight size={14} />
               相关推荐
             </h3>
            <div className="grid grid-cols-2 gap-3">
              {recommendedWords.slice(0, 4).map((rw, idx) => (
                <button
                  key={idx}
                  onClick={() => handleClickWord(rw.word)}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30 transition-all group"
                >
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{rw.word}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{rw.meaning}</p>
                  </div>
                  <ChevronLeft
                    size={16}
                    className="text-slate-500 rotate-180 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage;
