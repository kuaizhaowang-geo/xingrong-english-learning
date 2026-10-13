import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Award } from 'lucide-react';
import type { RankItem, RankingType } from '@shared/api.interface';

interface RankingPodiumProps {
  items: RankItem[];
  type: RankingType;
}

const getAvatarGradient = (name: string): string => {
  const colors = [
    'from-purple-400 to-indigo-600',
    'from-blue-400 to-cyan-600',
    'from-pink-400 to-purple-600',
    'from-cyan-400 to-blue-600',
    'from-violet-400 to-purple-700',
    'from-sky-400 to-indigo-600',
    'from-fuchsia-400 to-purple-600',
    'from-indigo-400 to-blue-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatValue = (value: number, type: RankingType): string => {
  switch (type) {
    case 'studyTime':
      return `${(value / 60).toFixed(1)} 小时`;
    case 'wins':
      return `${value} 胜`;
    case 'winRate':
      return `${value.toFixed(1)}% 胜率`;
    case 'typingWpm':
      return `${value.toFixed(1)} WPM`;
    case 'typingAccuracy':
      return `${value.toFixed(1)}% 准确率`;
  }
};

interface PodiumCardProps {
  item?: RankItem;
  position: 1 | 2 | 3;
  delay: number;
  type: RankingType;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ item, position, delay, type }) => {
  const isFirst = position === 1;

  const config = {
    1: {
       badgeIcon: Crown,
       badgeGradient: 'from-yellow-300 via-amber-400 to-yellow-600',
       badgeGlow: 'shadow-[0_0_20px_rgba(252_211_77_0.6)]',
       avatarSize: 'w-14 h-14 sm:w-20 sm:h-20',
       avatarRing: 'ring-3 sm:ring-4 ring-yellow-400/60',
       avatarGlow: 'shadow-[0_0_25px_rgba(252_211_77_0.5)]',
       nameSize: 'text-sm sm:text-lg font-bold',
       podiumHeight: 'h-32 sm:h-44',
      podiumGradient: 'from-yellow-500/30 via-amber-600/40 to-yellow-700/60',
      podiumBorder: 'border-yellow-500/50',
      podiumGlow: 'shadow-[0_0_30px_rgba(252_211_77_0.25)]',
      numberColor: 'text-yellow-200/90',
      order: 'order-2',
    },
    2: {
       badgeIcon: Medal,
       badgeGradient: 'from-slate-200 via-slate-300 to-slate-500',
       badgeGlow: 'shadow-[0_0_16px_rgba(203_213_225_0.5)]',
       avatarSize: 'w-12 h-12 sm:w-16 sm:h-16',
       avatarRing: 'ring-2 sm:ring-3 ring-slate-300/50',
       avatarGlow: 'shadow-[0_0_18px_rgba(203_213_225_0.4)]',
       nameSize: 'text-xs sm:text-base font-semibold',
       podiumHeight: 'h-24 sm:h-32',
      podiumGradient: 'from-slate-400/25 via-slate-500/35 to-slate-700/55',
      podiumBorder: 'border-slate-400/40',
      podiumGlow: 'shadow-[0_0_20px_rgba(148_163_184_0.2)]',
      numberColor: 'text-slate-200/80',
       order: 'order-1 pt-8 sm:pt-16',
    },
    3: {
       badgeIcon: Award,
       badgeGradient: 'from-orange-400 via-amber-500 to-orange-700',
       badgeGlow: 'shadow-[0_0_16px_rgba(217_119_6_0.5)]',
       avatarSize: 'w-12 h-12 sm:w-16 sm:h-16',
       avatarRing: 'ring-2 sm:ring-3 ring-orange-500/50',
       avatarGlow: 'shadow-[0_0_18px_rgba(217_119_6_0.4)]',
       nameSize: 'text-xs sm:text-base font-semibold',
       podiumHeight: 'h-20 sm:h-28',
      podiumGradient: 'from-orange-500/25 via-amber-600/35 to-orange-800/55',
      podiumBorder: 'border-orange-500/40',
      podiumGlow: 'shadow-[0_0_20px_rgba(217_119_6_0.2)]',
      numberColor: 'text-orange-200/80',
       order: 'order-3 pt-8 sm:pt-16',
    },
  }[position];

  const Icon = config.badgeIcon;
  const userName = item?.userName || '虚位以待';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
       className={`flex flex-col items-center flex-1 max-w-[100px] sm:max-w-[150px] ${config.order}`}
    >
      {/* 奖杯徽章 */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.3, type: 'spring', stiffness: 200, damping: 15 }}
         className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${config.badgeGradient} flex items-center justify-center mb-1 sm:mb-2 ${config.badgeGlow}`}
      >
         <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />
      </motion.div>

      {/* 头像 */}
      <div
        className={`${config.avatarSize} rounded-full bg-gradient-to-br ${
          item ? getAvatarGradient(userName) : 'from-slate-600 to-slate-700'
        } flex items-center justify-center text-white font-bold ${config.avatarRing} ${config.avatarGlow}`}
      >
         <span className={isFirst ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}>
          {item ? userName.charAt(0) : '?'}
        </span>
      </div>

      {/* 昵称 */}
       <div className={`mt-2 text-white truncate w-full text-center ${config.nameSize}`}>
        {userName}
      </div>

      {/* 排行数值 */}
        <div className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">
         {item ? formatValue(item.value, type) : '-'}
       </div>

      {/* 领奖台底座 */}
      <div
        className={`w-full mt-3 rounded-t-xl bg-gradient-to-b ${config.podiumGradient} ${config.podiumHeight} flex items-start justify-center pt-3 border-t border-x ${config.podiumBorder} ${config.podiumGlow} backdrop-blur-sm`}
      >
         <span className={`text-2xl sm:text-4xl font-black ${config.numberColor} drop-shadow-lg`}>
          {position}
        </span>
      </div>
    </motion.div>
  );
};

const RankingPodium: React.FC<RankingPodiumProps> = ({ items, type }) => {
  const first = items[0];
  const second = items[1];
  const third = items[2];

  return (
     <div className="relative py-4 sm:py-8 px-2 sm:px-4">
      {/* 背景光效 */}
      <div className="absolute inset-0 -top-4 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-gradient-to-b from-purple-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[200px] h-[120px] bg-gradient-to-t from-cyan-500/15 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-1/4 w-[200px] h-[120px] bg-gradient-to-t from-purple-500/15 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative flex items-end justify-center gap-2 sm:gap-3 max-w-lg mx-auto">
        <PodiumCard item={second} position={2} delay={0.15} type={type} />
        <PodiumCard item={first} position={1} delay={0} type={type} />
        <PodiumCard item={third} position={3} delay={0.3} type={type} />
      </div>
    </div>
  );
};

export default RankingPodium;
