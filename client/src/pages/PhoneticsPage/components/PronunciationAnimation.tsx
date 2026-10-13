import React, { useState, useCallback, useEffect } from 'react';
import { Play } from 'lucide-react';

interface PronunciationAnimationProps {
  pronunciationType: string;
  size?: number;
  accentColor?: string;
}

const PRONUNCIATION_LABELS: Record<string, string> = {
  元音: '元音发音',
  爆破: '爆破音',
  摩擦: '摩擦音',
  破擦: '破擦音',
  鼻音: '鼻音',
  边音: '边音',
  半元音: '半元音',
};

const PronunciationAnimation: React.FC<PronunciationAnimationProps> = ({
  pronunciationType,
  size = 200,
  accentColor = '#06B6D4',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const label = PRONUNCIATION_LABELS[pronunciationType] || pronunciationType;

  const handlePlay = useCallback((): void => {
    if (isPlaying) return;
    setIsPlaying(true);
    window.setTimeout(() => setIsPlaying(false), 1600);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
  }, [isPlaying]);

  const renderAnimation = (): React.ReactNode => {
    const cx = size / 2;
    const cy = size / 2;

    switch (pronunciationType) {
      case '爆破':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <defs>
              <radialGradient id="burstGrad">
                <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse
              cx={cx - 10}
              cy={cy}
              rx="30"
              ry="20"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
            />
            <ellipse
              cx={cx + 10}
              cy={cy}
              rx="30"
              ry="20"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
              style={{
                transformOrigin: `${cx + 10}px ${cy}px`,
                transform: isPlaying ? 'scaleX(0.2)' : 'scaleX(1)',
                transition: isPlaying ? 'transform 0.15s ease-out' : 'transform 0.3s ease-in',
              }}
            />
            {isPlaying &&
              [...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const dist = 50 + Math.random() * 20;
                return (
                  <circle
                    key={i}
                    cx={cx + Math.cos(angle) * dist}
                    cy={cy + Math.sin(angle) * dist * 0.6}
                    r={3 + Math.random() * 3}
                    fill="url(#burstGrad)"
                    style={{
                      animation: `burst 0.6s ease-out forwards`,
                      animationDelay: `${0.15 + i * 0.02}s`,
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                  />
                );
              })}
            <path
              d={`M${cx + 40},${cy - 8} Q${cx + 70},${cy} ${cx + 90},${cy - 5}`}
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: isPlaying ? 0 : 30,
                transition: 'stroke-dashoffset 0.3s ease-out 0.2s',
                opacity: isPlaying ? 1 : 0,
              }}
            />
            <polygon
              points={`${cx + 88},${cy - 8} ${cx + 95},${cy - 2} ${cx + 88},${cy + 2}`}
              fill={accentColor}
              style={{
                opacity: isPlaying ? 1 : 0,
                transition: 'opacity 0.2s ease 0.4s',
              }}
            />
          </svg>
        );

      case '摩擦':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <path
              d={`M${cx - 35},${cy - 12} Q${cx},${cy - 8} ${cx + 35},${cy - 12} L${cx + 30},${cy + 8} Q${cx},${cy + 12} ${cx - 30},${cy + 8} Z`}
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
            />
            <line
              x1={cx - 20}
              y1={cy - 2}
              x2={cx + 20}
              y2={cy - 2}
              stroke="white"
              strokeWidth="3"
            />
            <line
              x1={cx - 20}
              y1={cy + 4}
              x2={cx + 20}
              y2={cy + 4}
              stroke="white"
              strokeWidth="3"
            />
            {[...Array(6)].map((_, i) => (
              <circle
                key={i}
                r={2 + (i % 2)}
                fill={accentColor}
                style={{
                  animation: isPlaying ? `frictionFlow 0.8s linear infinite` : 'none',
                  animationDelay: `${i * 0.15}s`,
                  opacity: isPlaying ? 0.8 : 0,
                  transform: `translate(${cx + 40 + i * 8}px, ${cy - 10 + (i % 3) * 6}px)`,
                }}
              />
            ))}
            <path
              d={`M${cx + 35},${cy} L${cx + 80},${cy - 3}`}
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,5"
              style={{
                opacity: isPlaying ? 0.6 : 0,
                transition: 'opacity 0.3s',
              }}
            />
            <polygon
              points={`${cx + 78},${cy - 6} ${cx + 85},${cy - 3} ${cx + 78},${cy}`}
              fill={accentColor}
              style={{
                opacity: isPlaying ? 0.8 : 0,
                transition: 'opacity 0.3s',
              }}
            />
          </svg>
        );

      case '破擦':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <ellipse
              cx={cx - 8}
              cy={cy}
              rx="28"
              ry="20"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
            />
            <ellipse
              cx={cx + 15}
              cy={cy}
              rx="25"
              ry="18"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
              style={{
                transformOrigin: `${cx + 15}px ${cy}px`,
                transform: isPlaying ? 'scaleX(0.4)' : 'scaleX(1)',
                transition: isPlaying ? 'transform 0.2s ease-out' : 'transform 0.3s ease-in',
              }}
            />
            <line
              x1={cx - 2}
              y1={cy - 6}
              x2={cx + 10}
              y2={cy - 6}
              stroke="white"
              strokeWidth="3"
              style={{
                opacity: isPlaying ? 0.3 : 1,
                transition: 'opacity 0.2s',
              }}
            />
            {isPlaying &&
              [...Array(5)].map((_, i) => (
                <circle
                  key={i}
                  cx={cx + 45 + i * 10}
                  cy={cy - 5 + Math.sin(i) * 5}
                  r={3 - i * 0.3}
                  fill={accentColor}
                  style={{
                    animation: `burst 0.5s ease-out forwards`,
                    animationDelay: `${0.2 + i * 0.05}s`,
                  }}
                />
              ))}
            <path
              d={`M${cx + 50},${cy} Q${cx + 75},${cy - 2} ${cx + 85},${cy + 2}`}
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4,4"
              style={{
                opacity: isPlaying ? 0.7 : 0,
                transition: 'opacity 0.3s 0.25s',
              }}
            />
          </svg>
        );

      case '鼻音':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <path
              d={`M${cx - 25},${cy - 15} Q${cx},${cy - 10} ${cx + 25},${cy - 15} L${cx + 20},${cy + 10} Q${cx},${cy + 15} ${cx - 20},${cy + 10} Z`}
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
            />
            <path
              d={`M${cx - 10},${cy - 35} Q${cx - 15},${cy - 55} ${cx - 5},${cy - 65} L${cx + 5},${cy - 65} Q${cx + 15},${cy - 55} ${cx + 10},${cy - 35} Z`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
            />
            <path
              d={`M${cx},${cy - 15} Q${cx - 3},${cy - 35} ${cx},${cy - 55}`}
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4,4"
              style={{
                strokeDashoffset: isPlaying ? 0 : 20,
                transition: 'stroke-dashoffset 0.6s ease-out',
                opacity: isPlaying ? 1 : 0,
              }}
            />
            {[...Array(5)].map((_, i) => (
              <circle
                key={i}
                r="2.5"
                fill={accentColor}
                style={{
                  transform: `translate(${cx - 2 + (i % 2) * 3}px, ${cy - 30 - i * 7}px)`,
                  animation: isPlaying ? `nasalFlow 1s ease-in-out infinite` : 'none',
                  animationDelay: `${i * 0.15}s`,
                  opacity: isPlaying ? 0.8 : 0,
                }}
              />
            ))}
            <text
              x={cx}
              y={cy - 72}
              fill="#FFD166"
              fontSize="11"
              textAnchor="middle"
              style={{ opacity: isPlaying ? 1 : 0, transition: 'opacity 0.3s' }}
            >
              鼻腔
            </text>
          </svg>
        );

      case '边音':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <path
              d={`M${cx - 30},${cy - 15} Q${cx},${cy - 12} ${cx + 30},${cy - 15} L${cx + 25},${cy + 15} Q${cx},${cy + 20} ${cx - 25},${cy + 15} Z`}
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
            />
            <path
              d={`M${cx - 15},${cy + 5} Q${cx},${cy - 10} ${cx + 15},${cy + 5}`}
              fill="#FFB6C1"
              stroke="#E91E63"
              strokeWidth="1.5"
            />
            <line
              x1={cx}
              y1={cy - 10}
              x2={cx}
              y2={cy + 2}
              stroke="white"
              strokeWidth="3"
            />
            {[-1, 1].map((side) => (
              <g key={side}>
                <path
                  d={`M${cx + side * 8},${cy} Q${cx + side * 20},${cy + 5} ${cx + side * 35},${cy}`}
                  stroke={accentColor}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="3,3"
                  style={{
                    opacity: isPlaying ? 0.8 : 0,
                    transition: 'opacity 0.3s',
                  }}
                />
                {[...Array(3)].map((_, i) => (
                  <circle
                    key={i}
                    r="2"
                    fill={accentColor}
                    style={{
                      transform: `translate(${cx + side * (12 + i * 8)}px, ${cy + 2 + (i % 2) * 3}px)`,
                      animation: isPlaying ? `lateralFlow 0.8s ease-in-out infinite` : 'none',
                      animationDelay: `${i * 0.15}s`,
                      opacity: isPlaying ? 0.8 : 0,
                    }}
                  />
                ))}
              </g>
            ))}
            <text
              x={cx}
              y={cy - 28}
              fill="#94A3B8"
              fontSize="9"
              textAnchor="middle"
            >
              舌抵上齿龈
            </text>
          </svg>
        );

      case '半元音':
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <ellipse
              cx={cx - 10}
              cy={cy}
              rx="25"
              ry="18"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
              style={{
                transformOrigin: `${cx - 10}px ${cy}px`,
                transform: isPlaying ? 'scale(0.85)' : 'scale(1)',
                transition: 'transform 0.4s ease-in-out',
              }}
            />
            <ellipse
              cx={cx + 15}
              cy={cy}
              rx="22"
              ry="16"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
              style={{
                transformOrigin: `${cx + 15}px ${cy}px`,
                transform: isPlaying ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.4s ease-in-out',
              }}
            />
            <path
              d={`M${cx - 30},${cy - 25} Q${cx + 20},${cy - 40} ${cx + 50},${cy - 15}`}
              stroke={accentColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4,4"
              style={{
                strokeDashoffset: isPlaying ? 0 : 50,
                transition: 'stroke-dashoffset 0.6s ease-out',
                opacity: isPlaying ? 0.7 : 0,
              }}
            />
            <text
              x={cx}
              y={cy - 35}
              fill="#818CF8"
              fontSize="10"
              textAnchor="middle"
              style={{ opacity: isPlaying ? 1 : 0, transition: 'opacity 0.3s' }}
            >
              快速滑动
            </text>
          </svg>
        );

      case '元音':
      default:
        return (
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
            <ellipse
              cx={cx}
              cy={cy}
              rx="35"
              ry="25"
              fill="#FF6B9D"
              stroke="#E91E63"
              strokeWidth="2"
              style={{
                transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease-in-out',
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx="20"
              ry="14"
              fill="#8B0033"
              opacity="0.6"
            />
            <ellipse
              cx={cx}
              cy={cy + 3}
              rx="14"
              ry="8"
              fill="#FFB6C1"
              opacity="0.5"
            />
            {isPlaying && (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r="30"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2"
                  style={{
                    animation: 'vowelRipple 1s ease-out infinite',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="30"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2"
                  style={{
                    animation: 'vowelRipple 1s ease-out infinite',
                    animationDelay: '0.3s',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              </>
            )}
            <text
              x={cx}
              y={cy + 50}
              fill="#94A3B8"
              fontSize="10"
              textAnchor="middle"
            >
              声带振动发声
            </text>
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-xl flex items-center justify-center overflow-hidden"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF2FF 100%)',
          border: `1px solid ${accentColor}40`,
        }}
      >
        {renderAnimation()}
        <button
          onClick={handlePlay}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
          style={{
            backgroundColor: `${accentColor}30`,
            color: '#fff',
            border: `1px solid ${accentColor}50`,
          }}
          aria-label="播放发音动画"
        >
          <Play size={12} />
        </button>
      </div>
      <div className="text-xs font-medium" style={{ color: accentColor }}>
        {label}
      </div>

      <style>{`
        @keyframes burst {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2) translateX(20px); opacity: 0; }
        }
        @keyframes frictionFlow {
          0% { transform: translateX(0); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateX(40px); opacity: 0; }
        }
        @keyframes nasalFlow {
          0% { opacity: 0; transform: translateY(0); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes lateralFlow {
          0% { opacity: 0; }
          50% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes vowelRipple {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PronunciationAnimation;
