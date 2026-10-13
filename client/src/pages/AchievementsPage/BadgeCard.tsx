import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import type { BadgeItem } from '@shared/api.interface';

export interface BadgeCardProps {
  badge: BadgeItem;
  onClick?: () => void;
}

const LEVEL_COLORS: Record<string, { border: string; glow: string; text: string; label: string }> = {
  bronze: {
    border: '#CD7F32',
    glow: 'rgba(205, 127, 50, 0.5)',
    text: '#CD7F32',
    label: '铜章',
  },
  silver: {
    border: '#C0C0C0',
    glow: 'rgba(192, 192, 192, 0.5)',
    text: '#C0C0C0',
    label: '银章',
  },
  gold: {
    border: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.6)',
    text: '#FFD700',
    label: '金章',
  },
  diamond: {
    border: '#B9F2FF',
    glow: 'rgba(185, 242, 255, 0.6)',
    text: '#B9F2FF',
    label: '钻石',
  },
};

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, onClick }) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const levelConfig = LEVEL_COLORS[badge.level] ?? LEVEL_COLORS.bronze;

  const obtained = badge.obtained;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => setHovered(false)}
      className="relative w-full aspect-square rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-300 group"
       style={{
         backgroundColor: 'rgba(15, 23, 42, 0.6)',
         border: `1px solid ${obtained ? levelConfig.border : 'rgba(139, 92, 246, 0.25)'}`,
         boxShadow: obtained
           ? `0 0 15px ${levelConfig.glow}, inset 0 0 20px rgba(139, 92, 246, 0.08)`
           : 'none',
        filter: obtained ? 'none' : 'grayscale(100%)',
        opacity: obtained ? 1 : 0.5,
        transform: hovered && !obtained ? 'scale(1.03)' : hovered ? 'translateY(-2px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* 发光光晕（已获得） */}
      {obtained && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 25px ${levelConfig.glow}, inset 0 0 30px ${levelConfig.glow}`,
          }}
        />
      )}

      {/* 勋章图标 */}
      <div
        className="text-4xl md:text-5xl relative z-10"
        style={{
          filter: obtained ? `drop-shadow(0 0 8px ${levelConfig.glow})` : 'none',
        }}
      >
        {obtained ? badge.icon : <Lock size={28} className="text-[#64748B]" />}
      </div>

      {/* 勋章名称 */}
      <p
        className="text-xs font-medium text-center leading-tight relative z-10 line-clamp-2 w-full"
        style={{ color: obtained ? '#F1F5F9' : '#64748B' }}
      >
        {badge.name}
      </p>

      {/* 等级标签 */}
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full relative z-10"
        style={{
          backgroundColor: obtained ? `${levelConfig.border}20` : 'rgba(100, 116, 139, 0.15)',
          color: obtained ? levelConfig.text : '#64748B',
          border: `1px solid ${obtained ? levelConfig.border : 'rgba(100, 116, 139, 0.3)'}`,
        }}
      >
        {levelConfig.label}
      </span>

      {/* 悬停显示条件（未获得） */}
      {!obtained && hovered && (
        <div className="absolute inset-0 rounded-xl p-2 flex flex-col items-center justify-center gap-1 z-20 backdrop-blur-sm">
          <p
            className="text-xs text-center font-medium"
            style={{ color: '#F1F5F9' }}
          >
            {badge.description}
          </p>
          {badge.progress !== undefined && badge.progress > 0 && (
            <div className="w-full px-2">
              <div className="w-full h-1 rounded-full bg-[rgba(124_58_237_0.2)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (badge.progress / badge.conditionValue) * 100)}%`,
                    background: 'linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)',
                  }}
                />
              </div>
              <p
                className="text-[10px] text-center mt-1"
                style={{ color: '#94A3B8' }}
              >
                {badge.progress} / {badge.conditionValue}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 获得时间（已获得） */}
      {obtained && badge.obtainedAt && (
        <p
          className="text-[10px] absolute bottom-1.5 left-0 right-0 text-center relative z-10"
          style={{ color: '#94A3B8' }}
        >
          {new Date(badge.obtainedAt).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
    </button>
  );
};

export default BadgeCard;
