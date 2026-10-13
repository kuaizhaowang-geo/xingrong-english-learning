import React from 'react';
import { motion } from 'framer-motion';
import type { BadgeItem } from '@shared/api.interface';

export interface BadgeToastProps {
  badge: BadgeItem;
}

const LEVEL_COLORS: Record<string, { border: string; glow: string }> = {
  bronze: { border: '#CD7F32', glow: 'rgba(205, 127, 50, 0.6)' },
  silver: { border: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.6)' },
  gold: { border: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' },
  diamond: { border: '#B9F2FF', glow: 'rgba(185, 242, 255, 0.6)' },
};

const BadgeToast: React.FC<BadgeToastProps> = ({ badge }) => {
  const lvl = LEVEL_COLORS[badge.level] ?? LEVEL_COLORS.bronze;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="pointer-events-auto"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border min-w-[240px]"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: lvl.border,
          boxShadow: `0 0 20px ${lvl.glow}`,
        }}
      >
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            filter: `drop-shadow(0 0 6px ${lvl.glow})`,
          }}
        >
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: '#06B6D4' }}>
            🏆 获得新勋章！
          </p>
          <p
            className="text-sm font-semibold truncate"
            style={{ color: '#F1F5F9' }}
          >
            {badge.name}
          </p>
          <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
            {badge.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeToast;
