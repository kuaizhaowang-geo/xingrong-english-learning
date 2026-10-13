import React from 'react';
import { BookOpen, BookMarked, MessageCircle, Lightbulb } from 'lucide-react';
import type {
  AIWordItem,
  AISentenceItem,
  AIDialogueItem,
  AIGrammarItem,
} from '@shared/api.interface';

export type ContentTabKey = 'words' | 'sentences' | 'dialogues' | 'grammar';

interface LessonDetailPanelProps {
  activeTab: ContentTabKey;
  words?: AIWordItem[];
  sentences?: AISentenceItem[];
  dialogues?: AIDialogueItem[];
  grammar?: AIGrammarItem[];
}

const TAB_TITLE: Record<ContentTabKey, { label: string; icon: typeof BookOpen; color: string }> = {
  words: { label: '核心单词', icon: BookOpen, color: 'text-cyan-400' },
   sentences: { label: '重点句子', icon: BookMarked, color: 'text-violet-400' },
   dialogues: { label: '情景对话', icon: MessageCircle, color: 'text-emerald-400' },
   grammar: { label: '语法要点', icon: Lightbulb, color: 'text-amber-400' },
};

const LessonDetailPanel: React.FC<LessonDetailPanelProps> = ({
  activeTab,
  words,
  sentences,
  dialogues,
  grammar,
}) => {
  const tabCfg = TAB_TITLE[activeTab];
  const Icon = tabCfg.icon;

  const items: { words: AIWordItem[]; sentences: AISentenceItem[]; dialogues: AIDialogueItem[]; grammar: AIGrammarItem[] } = {
    words: words ?? [],
    sentences: sentences ?? [],
    dialogues: dialogues ?? [],
    grammar: grammar ?? [],
  };
  const currentItems = items[activeTab];
  const isEmpty = currentItems.length === 0;

  return (
     <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
      {/* 标题栏 */}
       <div className="p-5 border-b border-white/10
        bg-gradient-to-r from-violet-600/10 to-transparent">
        <h3 className={`text-base font-semibold flex items-center gap-2 ${tabCfg.color}`}>
          <Icon size={18} />
          {tabCfg.label}
          <span className="text-xs text-slate-400 font-normal ml-2">
            （共 {currentItems.length} 条）
          </span>
        </h3>
      </div>

      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {isEmpty && (
          <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full
                 bg-white/5 flex items-center justify-center border border-white/10">
               <Icon size={24} className="text-slate-400" />
             </div>
              <p className="text-slate-400 text-sm">暂无{tabCfg.label}</p>
          </div>
        )}

        {/* 单词 */}
        {activeTab === 'words' && words && words.length > 0 && (
          <div className="space-y-2">
            {words.map((word, idx: number) => (
              <div
                key={idx}
                 className="p-3 rounded-xl bg-white/5 border border-white/10
                   hover:border-violet-500/30 transition-colors">
                 <div className="flex items-baseline gap-2">
                   <span className="text-base font-semibold text-white">{word.word}</span>
                  {word.phonetic && (
                    <span className="text-xs text-fuchsia-400/90">{word.phonetic}</span>
                  )}
                </div>
                  <p className="text-sm text-slate-300 mt-1">{word.meaning}</p>
                {word.example && (
                  <p className="text-xs text-slate-400 mt-2 italic">例：{word.example}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 句子 */}
        {activeTab === 'sentences' && sentences && sentences.length > 0 && (
          <div className="space-y-2">
            {sentences.map((sentence, idx: number) => (
              <div
                key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10
                      hover:border-violet-500/30 transition-colors">
                 <p className="text-sm text-white font-medium">{sentence.sentence}</p>
                  <p className="text-sm text-slate-300 mt-1">{sentence.translation}</p>
              </div>
            ))}
          </div>
        )}

        {/* 对话 */}
        {activeTab === 'dialogues' && dialogues && dialogues.length > 0 && (
          <div className="space-y-3">
            {dialogues.map((d, idx: number) => (
              <div
                key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10
                      hover:border-violet-500/30 transition-colors">
                 <div className="flex items-start gap-2">
                   <span className="text-xs font-semibold text-emerald-400 flex-shrink-0">
                    {d.speaker}
                  </span>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm text-white">{d.text}</p>
                     <p className="text-xs text-slate-400 mt-1">{d.translation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 语法 */}
        {activeTab === 'grammar' && grammar && grammar.length > 0 && (
          <div className="space-y-2">
            {grammar.map((g, idx: number) => (
              <div
                key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10
                      hover:border-violet-500/30 transition-colors">
                 <p className="text-sm font-medium text-amber-400">{g.point}</p>
                  <p className="text-xs text-slate-300 mt-1">{g.explanation}</p>
                {g.example && (
                  <p className="text-xs text-slate-400 mt-2 italic">例：{g.example}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetailPanel;
