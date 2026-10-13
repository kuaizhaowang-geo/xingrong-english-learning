import React, { useState } from 'react';
import { Sparkles, BookOpen, Target } from 'lucide-react';
import PhoneticCard from '../PhoneticCard';
import type {
  PhoneticItem,
  PhonicsProgressSummary,
} from '@shared/api.interface';

type VowelTab = 'monophthong' | 'diphthong';
type ConsonantTab = 'voiceless' | 'voiced';

interface BrowseViewProps {
  items: PhoneticItem[];
  summary: PhonicsProgressSummary | null;
  learnedIds: Set<string>;
  loading: boolean;
  onCardClick: (item: PhoneticItem) => void;
}

const BrowseView: React.FC<BrowseViewProps> = ({
  items,
  summary,
  learnedIds,
  loading,
  onCardClick,
}) => {
  const [vowelTab, setVowelTab] = useState<VowelTab>('monophthong');
  const [consonantTab, setConsonantTab] = useState<ConsonantTab>('voiceless');

  const vowelItems: PhoneticItem[] = items.filter(
    (i: PhoneticItem) =>
      i.type === 'vowel' && i.category === vowelTab,
  );
  const consonantItems: PhoneticItem[] = items.filter(
    (i: PhoneticItem) =>
      i.type === 'consonant' && i.category === consonantTab,
  );

  const total: number = summary?.totalPhonetics || 48;
  const learned: number = summary?.learnedCount || 0;
  const accuracy: number = summary?.accuracy || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#94A3B8]">加载中...</div>
      </div>
    );
  }

  return (
    <>
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 md:mb-12">
        <div className="relative overflow-hidden rounded-xl p-5 bg-[#FFFFFF]/80 backdrop-blur-sm border border-[rgba(124_58_237_0.2)]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.12)',
              }}
            >
              <Sparkles size={20} className="text-[#818CF8]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1E293B]">{total}</div>
              <div className="text-sm text-[#94A3B8]">国际音标总数</div>
            </div>
          </div>
          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: '#6366F1' }}
          />
        </div>

        <div className="relative overflow-hidden rounded-xl p-5 bg-[#FFFFFF]/80 backdrop-blur-sm border border-[rgba(59_130_246_0.2)]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)',
              }}
            >
              <BookOpen size={20} className="text-[#60A5FA]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1E293B]">
                {learned}/{total}
              </div>
              <div className="text-sm text-[#94A3B8]">已学习</div>
            </div>
          </div>
          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: '#2563EB' }}
          />
        </div>

        <div className="relative overflow-hidden rounded-xl p-5 bg-[#FFFFFF]/80 backdrop-blur-sm border border-[rgba(34_211_238_0.2)]">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)',
              }}
            >
              <Target size={20} className="text-[#06B6D4]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#1E293B]">
                {accuracy}%
              </div>
              <div className="text-sm text-[#94A3B8]">练习正确率</div>
            </div>
          </div>
          <div
            className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: '#06B6D4' }}
          />
        </div>
      </div>

      {/* 元音区 */}
      <section className="mb-10 md:mb-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: '#6366F1' }}
            />
            <h2 className="text-xl font-bold text-[#1E293B]">
              元音 Vowels
              <span className="ml-2 text-sm font-normal text-[#94A3B8]">
                20 个
              </span>
            </h2>
          </div>
          <div className="inline-flex rounded-lg p-1 bg-[#FFFFFF] border border-[rgba(124_58_237_0.3)]">
            <button
              onClick={(): void => setVowelTab('monophthong')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 ${
                vowelTab === 'monophthong'
                  ? 'text-white font-medium'
                  : 'text-[#94A3B8] hover:text-[#CBD5E1]'
              }`}
              style={
                vowelTab === 'monophthong'
                  ? {
                      backgroundColor: 'rgba(99, 102, 241, 0.25)',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
                    }
                  : undefined
              }
            >
              单元音 · 12
            </button>
            <button
              onClick={(): void => setVowelTab('diphthong')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 ${
                vowelTab === 'diphthong'
                  ? 'text-white font-medium'
                  : 'text-[#94A3B8] hover:text-[#CBD5E1]'
              }`}
              style={
                vowelTab === 'diphthong'
                  ? {
                      backgroundColor: 'rgba(99, 102, 241, 0.25)',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
                    }
                  : undefined
              }
            >
              双元音 · 8
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
          {vowelItems.map((item: PhoneticItem) => (
            <PhoneticCard
              key={item.id}
              item={item}
              onClick={(): void => onCardClick(item)}
              isLearned={learnedIds.has(item.id)}
            />
          ))}
        </div>
      </section>

      {/* 辅音区 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-6 rounded-full"
              style={{ backgroundColor: '#06B6D4' }}
            />
            <h2 className="text-xl font-bold text-[#1E293B]">
              辅音 Consonants
              <span className="ml-2 text-sm font-normal text-[#94A3B8]">
                28 个
              </span>
            </h2>
          </div>
          <div className="inline-flex rounded-lg p-1 bg-[#FFFFFF] border border-[rgba(34_211_238_0.3)]">
            <button
              onClick={(): void => setConsonantTab('voiceless')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 ${
                consonantTab === 'voiceless'
                  ? 'text-white font-medium'
                  : 'text-[#94A3B8] hover:text-[#CBD5E1]'
              }`}
              style={
                consonantTab === 'voiceless'
                  ? {
                      backgroundColor: 'rgba(34, 211, 238, 0.3)',
                      boxShadow: '0 0 10px rgba(34, 211, 238, 0.2)',
                    }
                  : undefined
              }
            >
              清辅音 · 11
            </button>
            <button
              onClick={(): void => setConsonantTab('voiced')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-200 ${
                consonantTab === 'voiced'
                  ? 'text-white font-medium'
                  : 'text-[#94A3B8] hover:text-[#CBD5E1]'
              }`}
              style={
                consonantTab === 'voiced'
                  ? {
                      backgroundColor: 'rgba(34, 211, 238, 0.3)',
                      boxShadow: '0 0 10px rgba(34, 211, 238, 0.2)',
                    }
                  : undefined
              }
            >
              浊辅音 · 17
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6">
          {consonantItems.map((item: PhoneticItem) => (
            <PhoneticCard
              key={item.id}
              item={item}
              onClick={(): void => onCardClick(item)}
              isLearned={learnedIds.has(item.id)}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default BrowseView;
