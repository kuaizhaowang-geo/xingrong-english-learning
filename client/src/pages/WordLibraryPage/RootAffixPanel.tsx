import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, BookMarked, Volume2, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { WordAffix, WordItem } from '@shared/api.interface';

interface RootAffixPanelProps {
  onSelectWord: (word: WordItem) => void;
}

type AffixType = 'all' | 'prefix' | 'root' | 'suffix';

const AFFIX_TABS: Array<{ key: AffixType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'prefix', label: '前缀' },
  { key: 'root', label: '词根' },
  { key: 'suffix', label: '后缀' },
];

const TYPE_LABELS: Record<string, string> = {
  prefix: '前缀',
  root: '词根',
  suffix: '后缀',
};

const TYPE_COLORS: Record<string, string> = {
  prefix: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  root: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  suffix: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const RootAffixPanel: React.FC<RootAffixPanelProps> = ({ onSelectWord }) => {
  const [type, setType] = useState<AffixType>('all');
  const [search, setSearch] = useState('');
  const [affixes, setAffixes] = useState<WordAffix[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffix, setSelectedAffix] = useState<WordAffix | null>(null);
  const [detailWords, setDetailWords] = useState<WordItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchAffixes = async (): Promise<void> => {
      setLoading(true);
      try {
        const t = type === 'all' ? undefined : type;
        const s = search || undefined;
        const data = await wordsApi.getAffixes(t, s);
        setAffixes(data || []);
      } catch (err) {
        logger.error('加载词根词缀失败', err as Error);
        setAffixes([]);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchAffixes, 300);
    return () => clearTimeout(timer);
  }, [type, search]);

  const handleOpenDetail = async (affix: WordAffix): Promise<void> => {
    setSelectedAffix(affix);
    setDetailLoading(true);
    try {
      const detail = await wordsApi.getAffixDetail(affix.id);
      setDetailWords(detail?.words || []);
    } catch (err) {
      logger.error('加载词根词缀详情失败', err as Error);
      setDetailWords([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = (): void => {
    setSelectedAffix(null);
    setDetailWords([]);
  };

  if (selectedAffix) {
    return (
      <div className="h-full flex flex-col bg-slate-800/30 rounded-xl border border-purple-900/30 overflow-hidden">
        <div className="p-3 border-b border-purple-900/30">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-slate-300 hover:text-violet-300 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>返回列表</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-700/50">
          <div className="p-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/40">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLORS[selectedAffix.affixType] || TYPE_COLORS.root}`}>
                {TYPE_LABELS[selectedAffix.affixType] || '词根'}
              </span>
              <span className="text-xs text-slate-400">
                难度 {selectedAffix.difficultyLevel || 1}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{selectedAffix.affix}</h3>
            <p className="text-sm text-slate-300">{selectedAffix.meaning}</p>
          </div>

          {selectedAffix.description && (
            <div className="p-3 rounded-xl bg-slate-800/50 border border-purple-900/30">
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedAffix.description}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <span className="w-1 h-3 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
              相关单词（{detailWords.length}）
            </h4>
            {detailLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i: number) => (
                  <div key={i} className="h-12 rounded-lg bg-purple-900/20 animate-pulse" />
                ))}
              </div>
            ) : detailWords.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Volume2 size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs">暂无相关单词</p>
              </div>
            ) : (
              <div className="space-y-2">
                {detailWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => onSelectWord(word)}
                    className="w-full text-left px-3 py-2.5 rounded-lg
                      bg-slate-800/40 border border-purple-900/30
                      hover:border-violet-500/50 hover:bg-slate-800/70
                      transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white font-medium">{word.word}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {word.phonetic || '/—/'}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{word.meaning}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-800/30 rounded-xl border border-purple-900/30 overflow-hidden">
      <div className="p-3 border-b border-purple-900/30 space-y-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索词根词缀..."
            className="w-full h-9 pl-8 pr-3 rounded-lg text-xs
              bg-slate-800/60 border border-purple-900/30
              text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-violet-500/60
              transition-all"
          />
        </div>
        <div className="flex gap-1">
          {AFFIX_TABS.map((tab) => {
            const active = type === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-700/50">
        {loading ? (
          <div className="space-y-2 p-1">
            {[0, 1, 2, 3, 4, 5].map((i: number) => (
              <div key={i} className="h-14 rounded-lg bg-purple-900/20 animate-pulse" />
            ))}
          </div>
        ) : affixes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookMarked size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">暂无匹配结果</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {affixes.map((affix) => (
              <button
                key={affix.id}
                onClick={() => handleOpenDetail(affix)}
                className="w-full text-left px-3 py-2.5 rounded-lg
                  bg-slate-800/40 border border-purple-900/30
                  hover:border-violet-500/50 hover:bg-slate-800/70
                  transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{affix.affix}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[affix.affixType] || TYPE_COLORS.root}`}>
                      {TYPE_LABELS[affix.affixType] || '词根'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {affix.exampleWordsCount || 0} 词
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{affix.meaning}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RootAffixPanel;
