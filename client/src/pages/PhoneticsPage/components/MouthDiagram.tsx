import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { speakPhonetic } from '../utils/speech';
import type { PhoneticItem } from '@shared/api.interface';

interface MouthDiagramProps {
  item: PhoneticItem;
  size?: number;
  showFront?: boolean;
  accentColor?: string;
}

const MouthDiagram: React.FC<MouthDiagramProps> = ({
  item,
  size = 180,
  showFront = false,
  accentColor = '#6366F1',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState<'rest' | 'opening' | 'hold' | 'closing'>('rest');
  const timerRef = useRef<number | null>(null);

  const svgContent = showFront
    ? item.frontMouthDiagramSvg
    : item.mouthDiagramSvg;

  const handlePlay = useCallback((): void => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimPhase('opening');

    speakPhonetic(item);

    window.setTimeout(() => setAnimPhase('hold'), 200);
    window.setTimeout(() => setAnimPhase('closing'), 600);
    window.setTimeout(() => {
      setAnimPhase('rest');
      setIsAnimating(false);
    }, 900);
  }, [item, isAnimating]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const scale = animPhase === 'hold' ? 1 : animPhase === 'opening' || animPhase === 'closing' ? 0.95 : 0.9;
  const filterGlow = isAnimating ? `drop-shadow(0 0 8px ${accentColor}80)` : 'none';

  if (!svgContent) {
    return (
      <div
        className="rounded-xl flex items-center justify-center bg-[#F8FAFC]/60 border border-[rgba(124_58_237_0.2)]"
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-[#6B7280]">暂无口型图</span>
      </div>
    );
  }

  const cleanSvg = svgContent
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-xl overflow-hidden flex items-center justify-center transition-all duration-200"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
          border: `1px solid ${accentColor}40`,
          boxShadow: isAnimating
            ? `inset 0 0 30px ${accentColor}30, 0 0 20px ${accentColor}30`
            : `inset 0 0 20px ${accentColor}10`,
        }}
      >
        <div
          style={{
            width: size * 0.85,
            height: size * 0.85,
            transform: `scale(${scale})`,
            transition: 'transform 0.2s ease-out',
            filter: filterGlow,
          }}
          dangerouslySetInnerHTML={{
            __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${showFront ? 120 : 160} ${showFront ? 100 : 120}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${cleanSvg}</svg>`,
          }}
        />

        {item.vocalCordVibration && isAnimating && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
            style={{ animation: 'vocalPulse 0.2s ease-in-out infinite alternate' }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  height: 8 + i * 2,
                  backgroundColor: '#FFD166',
                  boxShadow: '0 0 6px #FFD166',
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{
            backgroundColor: `${accentColor}40`,
            color: '#fff',
            border: `1px solid ${accentColor}60`,
          }}
          aria-label="发音动画"
        >
          <Volume2 size={14} />
        </button>
      </div>
      <span className="text-xs text-[#94A3B8]">
        {showFront ? '正面口型' : '侧面口型'}
      </span>

      <style>{`
        @keyframes vocalPulse {
          0% { transform: scaleY(0.6); opacity: 0.5; }
          100% { transform: scaleY(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MouthDiagram;
