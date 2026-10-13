import React, { useState, useEffect } from 'react';
import { X, Heart, Volume2, BookOpen, Lightbulb, Sparkles, Play, Link2, PenLine, Star } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { WordItem, WordRelatedGroup, AddWordbookItemDto } from '@shared/api.interface';
import type { WordRecordLite } from './WordCardGrid';
import { wordsApi } from '@client/src/api';
import NotesTab from './NotesTab';
import LearningStatsTab from './LearningStatsTab';
import AddToWordbookDialog from '@client/src/components/AddToWordbookDialog';

interface WordDetailModalProps {
  word: WordItem | null;
  isFav: boolean;
  record?: WordRecordLite;
  wordRecords?: Map<string, WordRecordLite>;
  onClose: () => void;
  onToggleFavorite: () => void;
  onStartRecite: () => void;
  onStartFillBlank?: () => void;
  onNoteChange?: (hasNote: boolean) => void;
  onSelectRelatedWord?: (word: WordItem) => void;
}

const POS_COLORS: Record<string, string> = {
  noun: 'bg-green-500/20 text-green-400 border-green-500/30',
  verb: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  adjective: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  adverb: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  pronoun: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  preposition: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  conjunction: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  article: 'bg-amber-800/20 text-amber-500 border-amber-700/30',
  numeral: 'bg-red-500/20 text-red-400 border-red-500/30',
  auxiliary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

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
};

function getPosColor(pos: string): string {
  return POS_COLORS[pos.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

function getPosLabel(pos: string): string {
  return POS_LABELS[pos.toLowerCase()] || pos;
}

type DetailTab = 'meaning' | 'examples' | 'affix' | 'relations' | 'stats' | 'notes';

const RELATION_TYPE_STYLES: Record<string, { dot: string; border: string; text: string; bg: string }> = {
  synonym: { dot: 'bg-cyan-400', border: 'border-cyan-400/40', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  antonym: { dot: 'bg-rose-400', border: 'border-rose-400/40', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  derivative: { dot: 'bg-violet-400', border: 'border-violet-400/40', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  similar_form: { dot: 'bg-amber-400', border: 'border-amber-400/40', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  root_word: { dot: 'bg-emerald-400', border: 'border-emerald-400/40', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

function getRelationStyle(type: string): { dot: string; border: string; text: string; bg: string } {
  return RELATION_TYPE_STYLES[type] || RELATION_TYPE_STYLES.synonym;
}

function getProficiencyDot(level: number | undefined): string {
  if (!level || level === 0) return 'bg-slate-500';
  if (level >= 5) return 'bg-cyan-400';
  return 'bg-violet-400';
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isFav,
  record,
  wordRecords,
  onClose,
  onToggleFavorite,
  onStartRecite,
  onStartFillBlank,
  onNoteChange,
  onSelectRelatedWord,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('meaning');
  const [relations, setRelations] = useState<WordRelatedGroup[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [wordbookDialogOpen, setWordbookDialogOpen] = useState(false);

  useEffect(() => {
    if (!word) {
      setRelations([]);
      return;
    }
    const fetchRelations = async (): Promise<void> => {
      setRelationsLoading(true);
      try {
        const data = await wordsApi.getWordRelations(word.id);
        setRelations(data || []);
      } catch (err) {
        logger.error('加载关联词失败', err as Error);
        setRelations([]);
      } finally {
        setRelationsLoading(false);
      }
    };
    fetchRelations();
  }, [word]);

  if (!word) return null;

  const allTabs: Array<{ key: DetailTab; label: string; show: boolean }> = [
    { key: 'meaning', label: '释义', show: true },
    { key: 'examples', label: '例句', show: Boolean(word.exampleSentence) },
    { key: 'affix', label: '词根词缀', show: Boolean(word.rootAffix) },
    { key: 'relations', label: '关联词', show: true },
    { key: 'stats', label: '学习数据', show: true },
    { key: 'notes', label: '笔记', show: true },
  ];
  const tabs = allTabs.filter((t) => t.show);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl p-6
          bg-slate-900/95 border border-violet-500/30
          shadow-2xl shadow-violet-500/20
          max-h-[90vh] overflow-y-auto"
      >
        {/* 霓虹装饰光晕 */}
        <div className="absolute -top-24 -right-24 w-48 h-48
          rounded-full bg-violet-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48
          rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full
            bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700
            transition-colors z-10"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        {/* 头部：单词 */}
        <div className="relative text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full
            bg-gradient-to-br from-violet-500/30 to-indigo-600/30
            border-2 border-violet-500/40
            flex items-center justify-center">
            <Volume2 size={32} className="text-violet-300" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2
            bg-clip-text text-transparent
            bg-gradient-to-r from-violet-300 via-white to-cyan-300">
            {word.word}
          </h2>
          <p className="text-sm text-slate-400 mb-3">
            {word.phonetic || '/—/'}
          </p>
          {word.partOfSpeech && (
            <span className={`text-xs px-3 py-1 rounded-full border ${getPosColor(word.partOfSpeech)}`}>
              {getPosLabel(word.partOfSpeech)}
            </span>
          )}
        </div>

        <div className="flex gap-1 mb-5 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'meaning' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">中文释义</span>
                </div>
                <p className="text-base text-white">{word.meaning}</p>
              </div>
              {word.memoryTip && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-pink-400" />
                    <span className="text-sm font-medium text-slate-300">记忆技巧</span>
                  </div>
                  <p className="text-sm text-slate-200">{word.memoryTip}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'examples' && word.exampleSentence && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">例句</span>
              </div>
              <p className="text-sm text-white mb-1">{word.exampleSentence}</p>
              {word.exampleTranslation && (
                <p className="text-sm text-slate-400">{word.exampleTranslation}</p>
              )}
            </div>
          )}

          {activeTab === 'affix' && word.rootAffix && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-amber-400" />
                <span className="text-sm font-medium text-slate-300">词根词缀</span>
              </div>
              <p className="text-sm text-slate-200">{word.rootAffix}</p>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="space-y-4">
              {relationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : relations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <Link2 size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">暂无关联词数据</p>
                </div>
              ) : (
                relations.map((group) => {
                  const style = getRelationStyle(group.type);
                  return (
                    <div key={group.type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span className={`text-sm font-medium ${style.text}`}>{group.label}</span>
                        <span className="text-xs text-slate-500">({group.items.length})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const rec = wordRecords?.get(item.id);
                          const dot = getProficiencyDot(rec?.ebbinghausLevel);
                          return (
                            <button
                              key={item.id}
                              onClick={() => onSelectRelatedWord?.(item)}
                              className={`text-left p-3 rounded-xl transition-all duration-200
                                ${style.bg} border ${style.border}
                                hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                  {item.word}
                                </span>
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                              </div>
                              <p className="text-[11px] text-slate-400 mb-0.5 truncate">
                                {item.phonetic || '/—/'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.meaning}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <LearningStatsTab record={record} onStartRecite={onStartRecite} />
          )}

          {activeTab === 'notes' && (
            <NotesTab wordId={word.id} onNoteChange={onNoteChange} />
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onToggleFavorite}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              border transition-all duration-300
              ${isFav
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-slate-800/70 border-slate-600/50 text-slate-300 hover:border-rose-500/50 hover:text-rose-400'
              }`}
            title={isFav ? '取消收藏' : '加入收藏'}
          >
            <Heart size={18} className={isFav ? 'fill-rose-400' : ''} />
          </button>
          <button
            onClick={() => setWordbookDialogOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              border transition-all duration-300
              bg-slate-800/70 border-slate-600/50
              text-violet-300 hover:border-violet-500/60 hover:text-violet-200"
            title="加入我的词库"
          >
            <Star size={18} />
          </button>
          <button
            onClick={onStartRecite}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
              bg-gradient-to-r from-violet-600 to-indigo-600
              hover:from-violet-500 hover:to-indigo-500
              text-white font-medium shadow-lg shadow-violet-500/30
              transition-all duration-300
              active:scale-95"
          >
            <Play size={18} />
            <span className="text-sm">开始背诵</span>
          </button>
          {onStartFillBlank && word?.exampleSentence && (
            <button
              onClick={onStartFillBlank}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                bg-cyan-500/20 border border-cyan-500/40
                text-cyan-300 hover:bg-cyan-500/30
                font-medium transition-all duration-300
                active:scale-95"
              title="例句填空"
            >
              <PenLine size={18} />
            </button>
          )}
        </div>
      </div>

      <AddToWordbookDialog
        open={wordbookDialogOpen}
        onOpenChange={setWordbookDialogOpen}
        sourceType="word"
        sourceData={word ? [wordToDto(word)] : []}
      />
    </div>
  );
};

function wordToDto(word: WordItem): AddWordbookItemDto {
  return {
    subject: 'english',
    contentType: 'word',
    source: word.textbookId ? 'textbook' : 'custom',
    sourceId: word.id,
    title: word.word,
    subtitle: word.phonetic,
    content: word.meaning,
    example: word.exampleSentence,
    extra: {
      phonetic: word.phonetic,
      translation: word.exampleTranslation,
    },
  };
}

export default WordDetailModal;
