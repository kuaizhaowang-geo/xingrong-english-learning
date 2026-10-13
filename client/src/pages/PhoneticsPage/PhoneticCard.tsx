import React from 'react';
import { Volume2 } from 'lucide-react';
import MouthShapeIcon from './MouthShapeIcon';
import { speakPhonetic } from './utils/speech';
import type { PhoneticItem } from '@shared/api.interface';

interface PhoneticCardProps {
  item: PhoneticItem;
  onClick: () => void;
  isLearned?: boolean;
}

const PhoneticCard: React.FC<PhoneticCardProps> = ({
  item,
  onClick,
  isLearned = false,
}) => {
  const isVowel: boolean = item.type === 'vowel';

  const borderColor: string = isVowel
    ? 'border-[rgba(124_58_237_0.4)]'
    : 'border-[rgba(34_211_238_0.4)]';

  const hoverGlow: string = isVowel
    ? 'hover:shadow-[0_0_20px_rgba(124_58_237_0.5)]'
    : 'hover:shadow-[0_0_20px_rgba(34_211_238_0.5)]';

  const accentColor: string = isVowel ? '#6366F1' : '#06B6D4';

  const playButtonBg: string = isVowel
    ? 'bg-[rgba(124_58_237_0.2)] hover:bg-[rgba(124_58_237_0.4)] active:scale-90'
    : 'bg-[rgba(34_211_238_0.2)] hover:bg-[rgba(34_211_238_0.4)] active:scale-90';

  const playButtonText: string = isVowel
    ? 'text-[#818CF8] hover:text-[#C4B5FD]'
    : 'text-[#06B6D4] hover:text-[#67E8F9]';

  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-xl p-4
         bg-white/5 backdrop-blur-sm
        border ${borderColor}
        transition-all duration-300 ease-out
        hover:-translate-y-1 ${hoverGlow}
        hover:border-opacity-80
        flex flex-col items-center justify-center gap-2
        aspect-square
      `}
    >
      {/* 顶部光晕装饰 */}
      <div
        className={`
          absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-16 h-1.5 rounded-full blur-md opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        `}
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* 音标符号 */}
      <span
        className="text-2xl md:text-3xl font-bold tracking-wide"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#F1F5F9',
          textShadow: `0 0 10px ${accentColor}40`,
        }}
      >
        {item.symbol}
      </span>

      {/* 口型图 */}
      <MouthShapeIcon type={item.mouthShape} size={36} color={accentColor} />

      {/* 示例单词 */}
      <span className="text-xs text-[#94A3B8] font-medium truncate w-full text-center">
        {item.examples[0]?.word || ''}
      </span>

      {/* 播放按钮 */}
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          speakPhonetic(item);
        }}
        className={`
          absolute bottom-2 right-2
          w-7 h-7 rounded-full flex items-center justify-center
          ${playButtonBg} ${playButtonText}
          transition-transform duration-150
          opacity-60 group-hover:opacity-100
        `}
        aria-label="播放发音"
      >
        <Volume2 size={14} />
      </button>

      {/* 学习状态圆点 */}
      <span
        className={`
          absolute bottom-2 left-2
          w-2.5 h-2.5 rounded-full
        `}
        style={{
           backgroundColor: isLearned ? '#6366F1' : '#475569',
          boxShadow: isLearned ? '0 0 6px rgba(99, 102, 241, 0.3)' : 'none',
        }}
        title={isLearned ? '已学习' : '未学习'}
      />

      {/* 类型角标 */}
      <span
        className={`
          absolute top-2 left-2
          text-[10px] px-1.5 py-0.5 rounded-full
          ${isVowel ? 'bg-[rgba(124_58_237_0.3)] text-[#818CF8]' : 'bg-[rgba(34_211_238_0.3)] text-[#06B6D4]'}
        `}
      >
        {isVowel ? '元' : '辅'}
      </span>
    </div>
  );
};

export default PhoneticCard;
