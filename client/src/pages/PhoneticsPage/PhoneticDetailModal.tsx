import React, { useState, useCallback } from 'react';
import { X, Volume2, CheckCircle2, ArrowLeftRight, Waves } from 'lucide-react';
import MouthShapeIcon from './MouthShapeIcon';
import MouthDiagram from './components/MouthDiagram';
import MouthComparison from './components/MouthComparison';
import PronunciationAnimation from './components/PronunciationAnimation';
import { speak, speakPhonetic } from './utils/speech';
import type { PhoneticItem } from '@shared/api.interface';

interface PhoneticDetailModalProps {
  item: PhoneticItem | null;
  allItems: PhoneticItem[];
  isLearned: boolean;
  onClose: () => void;
  onMarkLearned: () => void;
}

const PhoneticDetailModal: React.FC<PhoneticDetailModalProps> = ({
  item,
  allItems,
  isLearned,
  onClose,
  onMarkLearned,
}) => {
  const [activeSimilarId, setActiveSimilarId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonSymbol, setComparisonSymbol] = useState<string | null>(null);

  const handleBack = useCallback((): void => setActiveSimilarId(null), []);
  const handleSimilar = useCallback(
    (id: string): void => setActiveSimilarId(id),
    [],
  );
  const handleClose = useCallback((): void => {
    onClose();
    setActiveSimilarId(null);
    setShowComparison(false);
    setComparisonSymbol(null);
  }, [onClose]);

  const handleCompare = useCallback(
    (sym: string): void => {
      setComparisonSymbol(sym);
      setShowComparison(true);
    },
    [],
  );

  const displayItem: PhoneticItem | null = activeSimilarId
    ? allItems.find((i: PhoneticItem) => i.id === activeSimilarId) || item
    : item;

  if (!displayItem) return null;

  const isVowel: boolean = displayItem.type === 'vowel';
  const accentColor: string = isVowel ? '#6366F1' : '#06B6D4';
  const accentLight: string = isVowel ? '#818CF8' : '#67E8F9';

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <h3
      className="text-sm font-semibold mb-2 flex items-center gap-2"
      style={{ color: accentLight }}
    >
      <span
        className="w-1 h-4 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      {children}
    </h3>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="
          relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl
          bg-gradient-to-br from-[#FFFFFF] via-[#16122E] to-[#FFFFFF]
          border border-[rgba(124_58_237_0.3)]
          shadow-[0_0_40px_rgba(124_58_237_0.2)]
        "
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}80`,
          }}
        />
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#E0E7FF]/80 text-[#94A3B8] hover:text-white hover:bg-[#3D3870] flex items-center justify-center transition-colors"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
          {/* 左侧 */}
          <div className="flex flex-col items-center justify-center md:w-2/5 py-4 border-b md:border-b-0 md:border-r border-[rgba(124_58_237_0.2)] pb-6 md:pb-0 md:pr-6">
            {activeSimilarId && (
              <button
                onClick={handleBack}
                className="mb-4 text-sm text-[#818CF8] hover:text-[#C4B5FD] transition-colors"
              >
                ← 返回 {item?.symbol}
              </button>
            )}
            <div
              className="text-6xl md:text-7xl font-bold mb-6"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#F1F5F9',
                textShadow: `0 0 20px ${accentColor}60`,
              }}
            >
              {displayItem.symbol}
            </div>
            <div
              className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center bg-[#F8FAFC] border border-[rgba(124_58_237_0.3)]"
              style={{ boxShadow: `inset 0 0 30px ${accentColor}15` }}
            >
              <MouthShapeIcon
                type={displayItem.mouthShape}
                size={100}
                color={accentColor}
              />
            </div>
            <div
              className="mt-6 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentLight,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {displayItem.name}
            </div>
          </div>

          {/* 右侧 */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#F1F5F9] mb-1">
                {displayItem.symbol} 发音详解
              </h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                {displayItem.pronunciationMethod}
              </p>
            </div>

            <div>
              <SectionTitle>口型图</SectionTitle>
              <div className="flex gap-4 mb-3 flex-wrap">
                <MouthDiagram
                  item={displayItem}
                  size={130}
                  showFront={false}
                  accentColor={accentColor}
                />
                <MouthDiagram
                  item={displayItem}
                  size={130}
                  showFront={true}
                  accentColor={accentColor}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {displayItem.tonguePosition && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)]">
                    <span className="text-[#94A3B8]">舌位:</span>
                    <span className="text-[#F1F5F9] font-medium">{displayItem.tonguePosition}</span>
                  </div>
                )}
                {displayItem.lipShape && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)]">
                    <span className="text-[#94A3B8]">唇形:</span>
                    <span className="text-[#F1F5F9] font-medium">{displayItem.lipShape}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)]">
                  <span className="text-[#94A3B8]">声带:</span>
                  <span className={displayItem.vocalCordVibration ? 'text-[#FFD166] font-medium' : 'text-[#94A3B8]'}>
                    {displayItem.vocalCordVibration ? '振动（浊）' : '不振动（清）'}
                  </span>
                </div>
                {displayItem.pronunciationType && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)]">
                    <span className="text-[#94A3B8]">类型:</span>
                    <span className="text-[#06B6D4] font-medium">{displayItem.pronunciationType}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-[#CBD5E1] leading-relaxed mt-3">
                {displayItem.mouthShape}
              </p>
            </div>

            {displayItem.pronunciationType && (
              <div>
                <SectionTitle>
                  <Waves size={14} />
                  发音方法可视化
                </SectionTitle>
                <div className="flex justify-center py-2">
                  <PronunciationAnimation
                    pronunciationType={displayItem.pronunciationType}
                    size={180}
                    accentColor={accentColor}
                  />
                </div>
              </div>
            )}

            <div>
              <SectionTitle>例词练习</SectionTitle>
              <div className="space-y-2">
                {displayItem.examples.map(
                  (
                    ex: { word: string; phonetic: string; meaning: string },
                    i: number,
                  ) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.15)] hover:border-[rgba(124_58_237_0.35)] transition-colors"
                    >
                      <button
                        onClick={(): void => speak(ex.word)}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(124_58_237_0.2)] text-[#818CF8] hover:bg-[rgba(124_58_237_0.4)] active:scale-90 transition-transform duration-150"
                        aria-label={`播放 ${ex.word}`}
                      >
                        <Volume2 size={14} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#F1F5F9]">
                          {ex.word}
                        </div>
                        <div
                          className="text-xs font-mono"
                          style={{ color: accentLight }}
                        >
                          {ex.phonetic}
                        </div>
                      </div>
                      <div className="text-sm text-[#94A3B8] text-right">
                        {ex.meaning}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {displayItem.sentences.length > 0 && (
              <div>
                <SectionTitle>例句</SectionTitle>
                <div className="space-y-2">
                  {displayItem.sentences.map(
                    (s: { en: string; zh: string }, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#F8FAFC]/60 border border-[rgba(59_130_246_0.15)]"
                      >
                        <button
                          onClick={(): void => speak(s.en, 0.9)}
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[rgba(59_130_246_0.2)] text-[#60A5FA] hover:bg-[rgba(59_130_246_0.4)] active:scale-90 transition-transform duration-150"
                          aria-label="播放例句"
                        >
                          <Volume2 size={14} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[#F1F5F9] leading-relaxed">
                            {s.en}
                          </div>
                          <div className="text-xs text-[#94A3B8] mt-1">
                            {s.zh}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {displayItem.similarSounds &&
              displayItem.similarSounds.length > 0 && (
                <div>
                  <SectionTitle>
                    <ArrowLeftRight size={14} />
                    易混音对比
                  </SectionTitle>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {displayItem.similarSounds.map(
                      (sym: string, idx: number) => {
                        const sim: PhoneticItem | undefined = allItems.find(
                          (i: PhoneticItem) => i.symbol === sym,
                        );
                        return (
                          <button
                            key={idx}
                            onClick={(): void => {
                              if (sim) handleSimilar(sim.id);
                            }}
                            disabled={!sim}
                            className="px-3 py-1.5 rounded-lg bg-[rgba(239_71_111_0.15)] border border-[rgba(239_71_111_0.3)] text-[#FB7185] font-mono text-sm hover:bg-[rgba(239_71_111_0.25)] transition-colors disabled:opacity-50"
                          >
                            {sym}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <button
                    onClick={(): void => {
                      if (displayItem.similarSounds && displayItem.similarSounds.length > 0) {
                        handleCompare(displayItem.similarSounds[0]);
                      }
                    }}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-[rgba(124_58_237_0.15)] text-[#818CF8] border border-[rgba(124_58_237_0.3)] hover:bg-[rgba(124_58_237_0.25)]"
                  >
                    <ArrowLeftRight size={14} />
                    口型对比（与 {displayItem.similarSounds[0]}）
                  </button>
                </div>
              )}

            <div className="flex gap-3 mt-auto pt-2">
              <button
                onClick={(): void => speakPhonetic(displayItem)}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all duration-200 border text-[#2563EB] border-[#2563EB]/50 hover:bg-[#2563EB]/10 hover:border-[#2563EB] active:scale-[0.98]"
              >
                <Volume2 size={18} />
                标准发音
              </button>
              <button
                onClick={onMarkLearned}
                disabled={isLearned}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                }}
              >
                <CheckCircle2 size={18} />
                {isLearned ? '已学习' : '标记为已学习'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showComparison && comparisonSymbol && item && (
        <MouthComparison
          itemA={item}
          itemB={
            allItems.find((i: PhoneticItem) => i.symbol === comparisonSymbol) || item
          }
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default PhoneticDetailModal;
