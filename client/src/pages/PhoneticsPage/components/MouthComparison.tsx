import React, { useState, useMemo } from 'react';
import { X, ArrowLeftRight, Volume2 } from 'lucide-react';
import MouthDiagram from './MouthDiagram';
import { speakPhonetic } from '../utils/speech';
import type { PhoneticItem } from '@shared/api.interface';

interface MouthComparisonProps {
  itemA: PhoneticItem;
  itemB: PhoneticItem;
  onClose: () => void;
}

const MouthComparison: React.FC<MouthComparisonProps> = ({
  itemA,
  itemB,
  onClose,
}) => {
  const [view, setView] = useState<'side' | 'front'>('side');

  const differences = useMemo(() => {
    const diffs: { label: string; valueA: string; valueB: string }[] = [];
    if (itemA.tonguePosition && itemB.tonguePosition && itemA.tonguePosition !== itemB.tonguePosition) {
      diffs.push({ label: '舌位', valueA: itemA.tonguePosition, valueB: itemB.tonguePosition });
    }
    if (itemA.lipShape && itemB.lipShape && itemA.lipShape !== itemB.lipShape) {
      diffs.push({ label: '唇形', valueA: itemA.lipShape, valueB: itemB.lipShape });
    }
    if ((itemA.vocalCordVibration ?? false) !== (itemB.vocalCordVibration ?? false)) {
      diffs.push({
        label: '声带',
        valueA: itemA.vocalCordVibration ? '振动（浊）' : '不振动（清）',
        valueB: itemB.vocalCordVibration ? '振动（浊）' : '不振动（清）',
      });
    }
    if (itemA.pronunciationType && itemB.pronunciationType && itemA.pronunciationType !== itemB.pronunciationType) {
      diffs.push({ label: '发音类型', valueA: itemA.pronunciationType, valueB: itemB.pronunciationType });
    }
    return diffs;
  }, [itemA, itemB]);

  const handlePlayBoth = (): void => {
    speakPhonetic(itemA);
    window.setTimeout(() => speakPhonetic(itemB), 1000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl
          bg-gradient-to-br from-[#FFFFFF] via-[#16122E] to-[#FFFFFF]
          border border-[rgba(124_58_237_0.3)]
          shadow-[0_0_60px_rgba(124_58_237_0.25)]"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #6366F1, #06B6D4, #6366F1, transparent)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#E0E7FF]/80 text-[#94A3B8] hover:text-white hover:bg-[#3D3870] flex items-center justify-center transition-colors"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-[#F1F5F9] mb-2 flex items-center gap-3">
            <ArrowLeftRight size={22} className="text-[#6366F1]" />
            口型对比
          </h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            对比两个音标的口型差异，更准确地把握发音要领
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('side')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'side'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#1E293B] border border-[rgba(124_58_237_0.2)]'
              }`}
            >
              侧面口型
            </button>
            <button
              onClick={() => setView('front')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'front'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#1E293B] border border-[rgba(124_58_237_0.2)]'
              }`}
            >
              正面口型
            </button>
            <button
              onClick={handlePlayBoth}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all bg-[rgba(34_211_238_0.15)] text-[#06B6D4] border border-[rgba(34_211_238_0.3)] hover:bg-[rgba(34_211_238_0.25)]"
            >
              <Volume2 size={14} />
              依次播放
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8FAFC]/40 border border-[rgba(124_58_237_0.15)]">
              <div
                className="text-4xl font-bold"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: '#F1F5F9',
                  textShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
                }}
              >
                {itemA.symbol}
              </div>
              <MouthDiagram
                item={itemA}
                size={200}
                showFront={view === 'front'}
                accentColor="#6366F1"
              />
              <div className="text-sm text-[#94A3B8] text-center">
                {itemA.name}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#F8FAFC]/40 border border-[rgba(34_211_238_0.15)]">
              <div
                className="text-4xl font-bold"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: '#F1F5F9',
                  textShadow: '0 0 15px rgba(34, 211, 238, 0.6)',
                }}
              >
                {itemB.symbol}
              </div>
              <MouthDiagram
                item={itemB}
                size={200}
                showFront={view === 'front'}
                accentColor="#06B6D4"
              />
              <div className="text-sm text-[#94A3B8] text-center">
                {itemB.name}
              </div>
            </div>
          </div>

          {differences.length > 0 && (
            <div className="p-4 rounded-xl bg-[rgba(239_71_111_0.1)] border border-[rgba(239_71_111_0.3)]">
              <h3 className="text-sm font-semibold text-[#FB7185] mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#EF476F]" />
                差异对比
              </h3>
              <div className="space-y-2">
                {differences.map((diff, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center text-sm"
                  >
                    <span className="text-[#94A3B8] font-medium w-16">{diff.label}</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[rgba(124_58_237_0.2)] text-[#818CF8] text-center">
                      {diff.valueA}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-[rgba(34_211_238_0.2)] text-[#67E8F9] text-center">
                      {diff.valueB}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="p-4 rounded-xl bg-[#F8FAFC]/40 border border-[rgba(124_58_237_0.15)]">
              <h4 className="text-sm font-semibold text-[#818CF8] mb-2">发音方法</h4>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                {itemA.pronunciationMethod}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]/40 border border-[rgba(34_211_238_0.15)]">
              <h4 className="text-sm font-semibold text-[#67E8F9] mb-2">发音方法</h4>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                {itemB.pronunciationMethod}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MouthComparison;
