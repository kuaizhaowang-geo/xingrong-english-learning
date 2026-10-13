import React, { useState } from 'react';
import {
  ArrowLeft,
  History,
  MessageSquare,
  BookOpen,
  MessagesSquare,
  Sparkles,
  Check,
  Plus,
  Loader2,
  Wand2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

type ModeKey = 'sentence' | 'word' | 'dialogue' | 'custom';
type DifficultyKey = 'easy' | 'medium' | 'hard';
type QuantityKey = 5 | 10 | 20;

interface ModeCard {
  key: ModeKey;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

interface ResultItem {
  id: string;
  text: string;
  translation: string;
}

const MODES: ModeCard[] = [
  {
    key: 'sentence',
    name: 'AI生成句子',
    desc: '智能生成主题例句',
    icon: <MessageSquare size={18} />,
  },
  {
    key: 'word',
    name: 'AI生成单词',
    desc: '批量生成词汇释义',
    icon: <BookOpen size={18} />,
  },
  {
    key: 'dialogue',
    name: 'AI生成对话',
    desc: '情景对话自动创作',
    icon: <MessagesSquare size={18} />,
  },
  {
    key: 'custom',
    name: '自定义课程',
    desc: '一键生成专属课程',
    icon: <Sparkles size={18} />,
  },
];

const DIFFICULTIES: { key: DifficultyKey; label: string }[] = [
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
];

const QUANTITIES: { key: QuantityKey; label: string }[] = [
  { key: 5, label: '5个' },
  { key: 10, label: '10个' },
  { key: 20, label: '20个' },
];

const AIStudioPage: React.FC = () => {
  const [mode, setMode] = useState<ModeKey>('sentence');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [quantity, setQuantity] = useState<QuantityKey>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const handleGenerate = (): void => {
    if (loading || !topic.trim()) return;
    // TODO: 接入真实 AI 生成接口后，此处调用后端 API
    // 临时占位：仅清空结果保持空状态，避免展示假数据
    setLoading(true);
    setResults([]);
    setHasGenerated(false);
    setTimeout(() => {
      setLoading(false);
      setHasGenerated(true);
    }, 600);
  };

  const handleAdd = (item: ResultItem): void => {
    // TODO: 接入加入学习逻辑
    logger.info('加入学习:', String(item.id));
  };

  return (
    <div className="h-screen w-full text-white flex flex-col overflow-hidden">
      {/* 背景光晕 */}
      <div className="fixed top-0 left-1/4 w-96 h-96
        rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96
        rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* 顶部栏 */}
         <div className="relative h-[40px] flex items-center justify-between px-4 border-b border-fuchsia-500/15">
          <button className="flex items-center gap-1.5 text-slate-300 hover:text-fuchsia-300 transition-colors">
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">AI创作坊</span>
        </button>
         <button className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors">
          <History size={16} />
          <span className="text-xs">历史记录</span>
        </button>
      </div>

      {/* 功能模式卡片区 */}
      <div className="relative py-3 px-4">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {MODES.map((m: ModeCard) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                 className={`relative flex-shrink-0 w-36 p-3 rounded-xl border transition-all duration-300 text-left
                   ${active
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/15 shadow-[0_0_20px_rgba(217_70_239_0.4)]'
                      : 'border-white/10 bg-white/5 hover:border-fuchsia-500/40 hover:bg-white/10 backdrop-blur-md'
                   }`}
              >
                {active && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5
                    bg-gradient-to-br from-violet-500 to-cyan-500
                    rounded-full flex items-center justify-center
                    shadow-lg shadow-violet-500/50">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2
                    ${active
                      ? 'bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white'
                      : 'bg-white/10 text-slate-400'
                   }`}>
                  {m.icon}
                </div>
                 <div className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-200'}`}>
                   {m.name}
                 </div>
                 <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {m.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 输入配置区 */}
      <div className="relative flex-1 px-4 min-h-0 flex flex-col gap-3">
        {/* 主题输入 */}
        <div>
           <label className="text-xs text-slate-400 mb-1.5 block">学习主题</label>
          <textarea
            value={topic}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
            placeholder="输入学习主题，如：旅行中的英语对话"
            rows={2}
             className="w-full px-3 py-2.5 text-sm rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder:text-slate-500
                focus:outline-none focus:border-fuchsia-500/50
                focus:ring-1 focus:ring-fuchsia-500/30
                resize-none transition-all duration-300"
          />
        </div>

        {/* 难度选择 */}
        <div>
           <label className="text-xs text-slate-400 mb-1.5 block">难度等级</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d: { key: DifficultyKey; label: string }) => {
              const active = difficulty === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                   className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-300
                     ${active
                        ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-md'
                     }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 数量选择 */}
        <div>
           <label className="text-xs text-slate-400 mb-1.5 block">生成数量</label>
          <div className="flex gap-2">
            {QUANTITIES.map((q: { key: QuantityKey; label: string }) => {
              const active = quantity === q.key;
              return (
                <button
                  key={q.key}
                  onClick={() => setQuantity(q.key)}
                   className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-300
                     ${active
                        ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-md'
                     }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-2 w-full py-3.5 rounded-full
            bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500
            text-white font-semibold text-base
             shadow-[0_0_25px_rgba(217_70_239_0.5)]
             hover:shadow-[0_0_35px_rgba(217_70_239_0.7)]
            hover:scale-[1.01] active:scale-[0.99]
            transition-all duration-300
            flex items-center justify-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>AI 生成中...</span>
            </>
          ) : (
            <>
              <Wand2 size={18} />
              <span>开始生成</span>
            </>
          )}
        </button>
      </div>

      {/* 结果预览区 */}
        <div className="relative h-32 flex flex-col px-4 pb-3 pt-2 border-t border-fuchsia-500/15">
        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
          <span className="w-1 h-3.5 bg-gradient-to-b from-fuchsia-400 to-cyan-400 rounded-full" />
           <span className="text-xs font-medium text-slate-300">生成结果预览</span>
          {hasGenerated && results.length > 0 && (
            <span className="text-[10px] text-slate-400">（共 {results.length} 条）</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i: number) => (
                <div
                  key={i}
                    className="h-10 rounded-lg bg-white/5 overflow-hidden relative border border-white/10"
                  style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="absolute inset-0 bg-gradient-to-r
                    from-transparent via-fuchsia-500/20 to-transparent
                    animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && !hasGenerated && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Sparkles size={24} className="mb-2 opacity-40" />
              <p className="text-xs">输入主题后点击生成，预览将显示在这里</p>
            </div>
          )}

          {!loading && hasGenerated && results.length > 0 && (
            <div className="space-y-2">
              {results.map((item: ResultItem, idx: number) => (
                <div
                  key={item.id}
                   className="group p-2.5 rounded-lg glass-card
                     hover:border-fuchsia-500/40 hover:bg-fuchsia-500/10
                     transition-all duration-200
                     animate-[fadeIn_0.3s_ease-out_both]"
                  style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                       <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {item.text}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 whitespace-pre-line">
                        {item.translation}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(item)}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1
                        rounded-full text-[10px] font-medium
                       bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30
                          hover:bg-fuchsia-500/30 hover:text-white
                        transition-all duration-200">
                      <Plus size={12} />
                      加入学习
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && hasGenerated && results.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Sparkles size={20} className="mb-2 opacity-40" />
              <p className="text-xs">AI 生成服务接入中，敬请期待</p>
               <p className="text-[10px] text-slate-500 mt-1">
                功能上线后将在此展示生成结果
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStudioPage;
