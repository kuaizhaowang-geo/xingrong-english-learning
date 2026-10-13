import React from 'react';
import { motion } from 'framer-motion';
import type { RankItem, RankingType } from '@shared/api.interface';

interface RankListItemProps {
  item: RankItem;
  index: number;
  isMe: boolean;
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
      return (value / 60).toFixed(1);
    case 'wins':
      return String(value);
    case 'winRate':
    case 'typingAccuracy':
      return `${value.toFixed(1)}%`;
    case 'typingWpm':
      return `${value.toFixed(1)} WPM`;
  }
};

const getValueUnit = (type: RankingType): string => {
  switch (type) {
    case 'studyTime': return '小时';
    case 'wins': return '胜';
    case 'winRate': return '胜率';
    case 'typingWpm': return 'WPM';
    case 'typingAccuracy': return '准确率';
  }
};

const getRankGradient = (rank: number): string | null => {
  if (rank === 4) return 'from-purple-500 to-indigo-500';
  if (rank === 5) return 'from-blue-500 to-cyan-500';
  if (rank === 6) return 'from-cyan-500 to-teal-500';
  if (rank === 7) return 'from-teal-500 to-emerald-500';
  if (rank === 8) return 'from-emerald-500 to-green-500';
  if (rank === 9) return 'from-green-500 to-lime-500';
  if (rank === 10) return 'from-lime-500 to-amber-500';
  return null;
};

const RankListItem: React.FC<RankListItemProps> = ({ item, index, isMe, type }) => {
  const rankGradient = getRankGradient(item.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
       className={`
         flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 min-h-[48px]
          ${isMe
           ? 'bg-fuchsia-500/15 border border-fuchsia-400/40 shadow-[0_0_20px_rgba(236_72_153_0.2)]'
           : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/30'
         }
      `}
    >
      {/* 排名数字 */}
      {rankGradient ? (
        <div
           className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${rankGradient} flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-md`}
        >
          {item.rank}
        </div>
      ) : (
          <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-slate-400 font-semibold">
          {item.rank}
        </div>
      )}

      {/* 头像 */}
       <div
         className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
           item.userName,
         )} flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0 shadow-md ring-2 ring-purple-500/20`}
       >
        {item.userName.charAt(0)}
      </div>

      {/* 昵称 + 签名 */}
      <div className="flex-1 min-w-0">
          <div className={`text-sm sm:text-base font-medium truncate ${isMe ? 'text-fuchsia-300' : 'text-white'}`}>
           {item.userName}
           {isMe && <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-fuchsia-400">（我）</span>}
         </div>
          <div className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5 hidden sm:block">
          {item.level || '英语爱好者'}
        </div>
      </div>

      {/* 排行数值 */}
       <div className="text-right flex-shrink-0">
          <div className={`text-sm sm:text-base font-semibold ${isMe ? 'text-fuchsia-400' : 'text-cyan-400'}`}>
           {formatValue(item.value, type)}
         </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{getValueUnit(type)}</div>
       </div>
    </motion.div>
  );
};

export default RankListItem;
