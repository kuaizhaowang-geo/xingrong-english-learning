import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, Heart, Volume2, ChevronRight } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordsApi } from '@client/src/api';
import type { TextbookTreeItem, WordItem } from '@shared/api.interface';
import type { WordSettings } from '@client/src/api/words';

interface WarehouseTabProps {
  textbooks: TextbookTreeItem[];
  loadingBooks: boolean;
  onWordClick: (word: WordItem) => void;
}

const WarehouseTab: React.FC<WarehouseTabProps> = ({ textbooks, loadingBooks, onWordClick }) => {
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');
  const [selectedSemester, setSelectedSemester] = useState<string>('upper');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const units = useMemo(() => {
    const textbook = textbooks.find(t => t.grade === selectedGrade && t.semester === selectedSemester);
    return textbook?.units || [];
  }, [textbooks, selectedGrade, selectedSemester]);

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0].id);
    }
  }, [units, selectedUnit]);

  useEffect(() => {
    if (!selectedUnit) return;
    const loadWords = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await wordsApi.getWords({ unitId: selectedUnit, page: 1, pageSize: 50 });
        setWords(data.items || []);
      } catch (err) {
        logger.error('Failed to load words', { error: String(err) });
      } finally {
        setLoading(false);
      }
    };
    void loadWords();
  }, [selectedUnit]);

  useEffect(() => {
    const loadFavorites = async (): Promise<void> => {
      try {
        const data = await wordsApi.getFavorites();
        setFavorites(new Set(data.map((item: WordItem) => item.id)));
      } catch (err) {
        logger.error('Failed to load favorites', { error: String(err) });
      }
    };
    void loadFavorites();
  }, []);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.toLowerCase();
    return words.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.meaning.includes(searchQuery)
    );
  }, [words, searchQuery]);

  const toggleFavorite = useCallback(async (wordId: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      if (favorites.has(wordId)) {
        await wordsApi.removeFavorite(wordId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(wordId);
          return next;
        });
      } else {
        await wordsApi.addFavorite(wordId);
        setFavorites(prev => new Set(prev).add(wordId));
      }
    } catch (err) {
      logger.error('Failed to toggle favorite', { error: String(err) });
    }
  }, [favorites]);

  const playPronunciation = useCallback((word: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const grades = ['grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6'];
  const gradeLabels: Record<string, string> = {
    grade1: '一年级', grade2: '二年级', grade3: '三年级',
    grade4: '四年级', grade5: '五年级', grade6: '六年级',
  };

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(124_58_237_0.2)] p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#94A3B8]" />
            <span className="text-sm text-[#94A3B8]">筛选：</span>
          </div>
          <select
            value={selectedGrade}
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedUnit(null); }}
            className="bg-[#EEF2FF] border border-[rgba(124_58_237_0.3)] rounded-lg px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#6366F1]"
          >
            {grades.map(g => (
              <option key={g} value={g}>{gradeLabels[g]}</option>
            ))}
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => { setSelectedSemester(e.target.value); setSelectedUnit(null); }}
            className="bg-[#EEF2FF] border border-[rgba(124_58_237_0.3)] rounded-lg px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#6366F1]"
          >
            <option value="upper">上册</option>
            <option value="lower">下册</option>
          </select>
          <select
            value={selectedUnit || ''}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-[#EEF2FF] border border-[rgba(124_58_237_0.3)] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] min-w-[180px]"
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.title}</option>
            ))}
          </select>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索单词..."
                className="w-full bg-[#EEF2FF] border border-[rgba(124_58_237_0.3)] rounded-lg pl-10 pr-4 py-2 text-sm text-[#1E293B] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 单词列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              onClick={() => onWordClick(word)}
              className="group bg-[#FFFFFF] rounded-xl border border-[rgba(124_58_237_0.2)] p-5 cursor-pointer transition-all duration-300 hover:border-[#6366F1]/50 hover:shadow-lg hover:shadow-[#6366F1]/10 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-[#1E293B] group-hover:text-[#6366F1] transition-colors">
                    {word.word}
                  </h3>
                  {word.phonetic && (
                    <p className="text-xs text-[#94A3B8] mt-1">{word.phonetic}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => playPronunciation(word.word, e)}
                    className="w-8 h-8 rounded-lg bg-[rgba(124_58_237_0.1)] text-[#6366F1] flex items-center justify-center hover:bg-[rgba(124_58_237_0.2)] transition-colors"
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(word.id, e)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      favorites.has(word.id)
                        ? 'bg-[rgba(239_71_111_0.15)] text-[#EF476F]'
                        : 'bg-[rgba(148_163_184_0.1)] text-[#64748B] hover:bg-[rgba(148_163_184_0.2)]'
                    }`}
                  >
                    <Heart size={14} fill={favorites.has(word.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#94A3B8] line-clamp-2 mb-3">{word.meaning}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  {word.partOfSpeech || '名词'}
                </span>
                <ChevronRight size={14} className="text-[#64748B] group-hover:text-[#6366F1] group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredWords.length === 0 && (
        <div className="text-center py-20 text-[#64748B]">
          暂无单词数据
        </div>
      )}
    </div>
  );
};

export default WarehouseTab;
