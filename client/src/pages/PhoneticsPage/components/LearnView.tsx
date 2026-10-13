import React, { useState, useMemo, useCallback } from 'react';
import { Volume2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import MouthShapeIcon from '../MouthShapeIcon';
import { speak, speakPhonetic } from '../utils/speech';
import type { PhoneticItem } from '@shared/api.interface';

interface LearnViewProps {
  items: PhoneticItem[];
  learnedIds: Set<string>;
  onMarkLearned: (id: string) => Promise<void>;
}

type CatKey = 'monophthong' | 'diphthong' | 'voiceless' | 'voiced';
const CAT_LABELS: Record<CatKey, string> = {
  monophthong: '单元音',
  diphthong: '双元音',
  voiceless: '清辅音',
  voiced: '浊辅音',
};
const CAT_ORDER: CatKey[] = ['monophthong', 'diphthong', 'voiceless', 'voiced'];

const LearnView: React.FC<LearnViewProps> = ({
  items,
  learnedIds,
  onMarkLearned,
}) => {
  const sorted: PhoneticItem[] = useMemo(
    () => [...items].sort((a: PhoneticItem, b: PhoneticItem) => a.sortOrder - b.sortOrder),
    [items],
  );
  const [idx, setIdx] = useState<number>(0);
  const total: number = sorted.length;
  const current: PhoneticItem | undefined = sorted[idx];

  const grouped = useMemo((): Record<string, PhoneticItem[]> => {
    const r: Record<string, PhoneticItem[]> = {};
    for (const item of sorted) {
      if (!r[item.category]) r[item.category] = [];
      r[item.category].push(item);
    }
    return r;
  }, [sorted]);

  const handlePrev = useCallback((): void => {
    setIdx((i: number) => Math.max(0, i - 1));
  }, []);
  const handleNext = useCallback((): void => {
    setIdx((i: number) => Math.min(total - 1, i + 1));
  }, [total]);

  const handleMarkAndNext = useCallback(async (): Promise<void> => {
    if (!current) return;
    await onMarkLearned(current.id);
    if (idx < total - 1) setIdx((i: number) => i + 1);
  }, [current, idx, total, onMarkLearned]);

  const jumpTo = useCallback((item: PhoneticItem): void => {
    const i: number = sorted.findIndex((x: PhoneticItem) => x.id === item.id);
    if (i >= 0) setIdx(i);
  }, [sorted]);

  if (!current) {
    return (
      <div className="flex items-center justify-center py-20 text-[#94A3B8]">
        加载中...
      </div>
    );
  }

  const isVowel: boolean = current.type === 'vowel';
  const accent: string = isVowel ? '#6366F1' : '#06B6D4';
  const accentLight: string = isVowel ? '#818CF8' : '#67E8F9';
  const pct: number = total > 0 ? ((idx + 1) / total) * 100 : 0;
  const learned: boolean = learnedIds.has(current.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 左侧快速跳转 */}
      <div className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
            快速跳转
          </h3>
          {CAT_ORDER.map((cat: CatKey) => {
            const catItems: PhoneticItem[] = grouped[cat] || [];
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <div className="text-xs font-medium" style={{ color: accentLight }}>
                  {CAT_LABELS[cat]}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {catItems.map((item: PhoneticItem) => {
                    const active: boolean = item.id === current.id;
                    const isLearnedItem: boolean = learnedIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={(): void => jumpTo(item)}
                        className="w-9 h-9 rounded-lg text-sm font-mono transition-all duration-200 border"
                        style={{
                          backgroundColor: active ? `${accent}30` : '#FFFFFF',
                          borderColor: active ? accent : 'rgba(99, 102, 241, 0.12)',
                          color: active ? '#fff' : '#94A3B8',
                          boxShadow: active ? `0 0 10px ${accent}40` : 'none',
                        }}
                        title={isLearnedItem ? '已学习' : '未学习'}
                      >
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                          style={{
                            backgroundColor: isLearnedItem ? '#6366F1' : '#3D3A5A',
                          }}
                        />
                        {item.symbol.replace(/\//g, '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 主学习区 */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#94A3B8] whitespace-nowrap">
            第 {idx + 1} / {total} 个
          </span>
          <div className="flex-1 h-2 rounded-full bg-[#FFFFFF] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 0 8px rgba(99, 102, 241, 0.35)',
              }}
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#16122E] to-[#FFFFFF] border border-[rgba(124_58_237_0.3)] p-6 md:p-8">
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 20px ${accent}80`,
            }}
          />
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex flex-col items-center gap-4 md:w-1/3">
              <div
                className="text-7xl md:text-8xl font-bold"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: '#F1F5F9',
                  textShadow: `0 0 25px ${accent}60`,
                }}
              >
                {current.symbol}
              </div>
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)]"
                style={{ boxShadow: `inset 0 0 30px ${accent}15` }}
              >
                <MouthShapeIcon type={current.mouthShape} size={80} color={accent} />
              </div>
              <div
                className="px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${accent}20`,
                  color: accentLight,
                  border: `1px solid ${accent}40`,
                }}
              >
                {current.name}
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: accentLight }}>
                  <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accent }} />
                  发音方法
                </h3>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  {current.pronunciationMethod}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: accentLight }}>
                  <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accent }} />
                  口型
                </h3>
                <p className="text-sm text-[#CBD5E1]">{current.mouthShape}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: accentLight }}>
                  <span className="w-1 h-4 rounded-full" style={{ backgroundColor: accent }} />
                  例词
                </h3>
                <div className="space-y-2">
                  {current.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)]"
                    >
                      <button
                        onClick={(): void => speak(ex.word)}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(124_58_237_0.2)] text-[#818CF8] hover:bg-[rgba(124_58_237_0.4)] active:scale-90 transition-transform duration-150"
                        aria-label="播放"
                      >
                        <Volume2 size={14} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#1E293B]">{ex.word}</div>
                        <div className="text-xs font-mono" style={{ color: accentLight }}>
                          {ex.phonetic}
                        </div>
                      </div>
                      <div className="text-sm text-[#94A3B8]">{ex.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-[rgba(124_58_237_0.2)] flex-wrap">
            <button
              onClick={handlePrev}
              disabled={idx === 0}
              className="px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-[#94A3B8] border border-[rgba(148_163_184_0.3)] hover:text-white hover:border-[rgba(148_163_184_0.6)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
            >
              <ChevronLeft size={18} /> 上一个
            </button>
            <button
              onClick={(): void => speakPhonetic(current)}
              className="px-5 py-2.5 rounded-xl flex items-center gap-2 text-[#2563EB] border border-[#2563EB]/50 hover:bg-[#2563EB]/10 hover:border-[#2563EB] transition-all active:scale-90"
            >
              <Volume2 size={18} /> 播放发音
            </button>
            <button
              onClick={handleMarkAndNext}
              disabled={learned && idx >= total - 1}
              className="px-5 py-2.5 rounded-xl flex items-center gap-1.5 text-white font-medium transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
              }}
            >
              <CheckCircle2 size={18} />
              {learned
                ? idx >= total - 1
                  ? '已全部完成'
                  : '下一个'
                : '标记已学并下一个'}
              {!learned && idx < total - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnView;
