import React from 'react';
import { Award, BookOpen, ThumbsUp, Heart, FileText, Sparkles } from 'lucide-react';
import type { CreatorStatsData, CreatorBadge } from '@shared/api.interface';

interface CreatorProfileCardProps {
  stats: CreatorStatsData;
}

const BADGE_ICONS: Record<string, string> = {
  'new_creator': '🌟',
  'quality_producer': '💎',
  'top_creator': '👑',
  'popular': '🔥',
  'trusted': '🛡️',
  'innovator': '💡',
  'word_master': '📚',
  'grammar_expert': '✍️',
  'rising_star': '⭐',
  'old_driver': '🚀',
};

const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({ stats }) => {
  const nextLevelPoints = (stats.creatorLevel + 1) * 1000;
  const pointsToNext = Math.max(0, nextLevelPoints - stats.creatorPoints);

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #2D1B69 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 0 30px rgba(99, 102, 241, 0.12)',
      }}
    >
      {/* 背景装饰 */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 w-96 h-32 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(ellipse, #06B6D4 0%, transparent 70%)',
          transform: 'translateX(-50%)',
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        {/* 左侧：用户信息 */}
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl relative"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{stats.userName}</h2>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #2563EB)',
                  color: 'white',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.35)',
                }}
              >
                LV.{stats.creatorLevel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-semibold"
                style={{
                  background: 'rgba(34, 211, 238, 0.15)',
                  color: '#06B6D4',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                }}
              >
                信用 {stats.creditLevel}
              </span>
              <span className="text-xs" style={{ color: '#94A3B8' }}>
                加入于 {new Date(stats.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：总积分 */}
        <div className="lg:ml-auto lg:text-right">
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>
            总积分
          </div>
          <div
            className="text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            {stats.creatorPoints.toLocaleString()}
          </div>
           <div className="w-64 ml-auto">
             <div className="flex justify-between text-xs" style={{ color: '#94A3B8' }}>
               <span>距离 LV.{stats.creatorLevel + 1}</span>
               <span>{pointsToNext.toLocaleString()} 分</span>
             </div>
           </div>
        </div>
      </div>

      {/* 勋章展示 */}
      {stats.badges && stats.badges.length > 0 && (
        <div className="relative mt-6 pt-4" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4" style={{ color: '#FBBF24' }} />
            <span className="text-sm font-medium text-white">我的勋章</span>
            <span className="text-xs" style={{ color: '#94A3B8' }}>
              ({stats.badges.length} 枚)
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stats.badges.map((badge: CreatorBadge) => (
              <div
                key={badge.id}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <span className="text-2xl">
                  {BADGE_ICONS[badge.badgeCode] || '🏅'}
                </span>
                <span className="text-xs text-white whitespace-nowrap">
                  {badge.badgeName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const stats = [
  { key: 'totalLearnCount', label: '总学习次数', icon: BookOpen, color: '#6366F1' },
  { key: 'totalLikeCount', label: '总点赞数', icon: ThumbsUp, color: '#06B6D4' },
  { key: 'totalFavoriteCount', label: '总收藏数', icon: Heart, color: '#EC4899' },
  { key: 'contentCount', label: '已发布内容', icon: FileText, color: '#FBBF24' },
];

interface StatsGridProps {
  statsData: CreatorStatsData;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ statsData }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((item) => {
      const Icon = item.icon;
      const value = (statsData as unknown as Record<string, number>)[item.key] ?? 0;
      return (
        <div
          key={item.key}
          className="rounded-xl p-4 transition-all hover:scale-[1.02]"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${item.color}33`,
            boxShadow: `0 0 15px ${item.color}15`,
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
            style={{ background: `${item.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: item.color }} />
          </div>
          <div
            className="text-2xl font-bold mb-1"
            style={{ color: 'white' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm" style={{ color: '#94A3B8' }}>
            {item.label}
          </div>
        </div>
      );
    })}
  </div>
);

export default CreatorProfileCard;
