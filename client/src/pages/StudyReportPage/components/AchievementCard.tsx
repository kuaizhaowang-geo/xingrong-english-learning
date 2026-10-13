import { Award, Star, TrendingUp, TrendingDown, Zap, Medal, Trophy, Crown } from 'lucide-react';
import type { StudyReportItem, AchievementStats } from '@shared/api.interface';

interface AchievementCardProps {
  report: StudyReportItem;
}

const BADGE_ICONS: Record<string, typeof Award> = {
  zap: Zap,
  medal: Medal,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  award: Award,
};

function getBadgeIcon(iconName: string): typeof Award {
  return BADGE_ICONS[iconName] ?? Award;
}

function AchievementCard({ report }: AchievementCardProps) {
  const raw = report.achievements ?? ({} as Partial<AchievementStats>);
  const achievements: AchievementStats = {
    badges: raw.badges ?? [],
    currentLevel: raw.currentLevel ?? 0,
    prevLevel: raw.prevLevel ?? 0,
    levelUp: raw.levelUp ?? false,
    pointsEarned: raw.pointsEarned ?? 0,
    rankChange: raw.rankChange ?? 0,
  };
  const { badges, currentLevel, prevLevel, levelUp, pointsEarned, rankChange } = achievements;

  const rankImproved = rankChange > 0;
  const levelDiff = currentLevel - prevLevel;

  return (
    <div className="rounded-xl p-4 sm:p-5 glass-card">
       <h3 className="text-sm font-semibold text-white mb-5">
        成就统计
      </h3>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Level section */}
         <div
             className="p-3 sm:p-4 rounded-xl text-center"
           style={{
             background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%)',
             border: '1px solid rgba(168, 85, 247, 0.3)',
           }}
         >
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Crown size={28} className="text-white" />
          </div>
           <p className="text-xs text-slate-400 mb-1">当前等级</p>
          <p
            className="text-3xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Lv.{currentLevel}
          </p>
          {levelUp && levelDiff > 0 ? (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
                color: '#06B6D4',
              }}
            >
              <TrendingUp size={10} />
              晋升 +{levelDiff} 级
            </div>
          ) : (
             <p className="text-xs text-slate-400">继续加油升级 🌟</p>
          )}
        </div>

        {/* Badges section */}
        <div className="flex flex-col">
           <p className="text-xs text-slate-400 mb-3">
            获得徽章 <span className="text-[#FFD166] font-semibold">{badges.length}</span> 个
          </p>
          {badges.length === 0 ? (
             <div
               className="flex-1 flex items-center justify-center rounded-lg bg-white/5 border border-white/10"
             >
               <p className="text-xs text-slate-400">继续学习解锁徽章</p>
             </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              {badges.slice(0, 4).map((badge, idx) => {
                const IconComp = getBadgeIcon(badge.icon);
                return (
                   <div
                     key={idx}
                     className="p-3 rounded-lg text-center"
                     style={{
                       backgroundColor: 'rgba(255, 209, 102, 0.12)',
                       border: '1px solid rgba(255, 209, 102, 0.3)',
                     }}
                    title={badge.description}
                  >
                    <div className="flex justify-center mb-1.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #FFD166 0%, #F97316 100%)',
                          boxShadow: '0 0 10px rgba(255, 209, 102, 0.4)',
                        }}
                      >
                        <IconComp size={18} className="text-white" />
                      </div>
                    </div>
                     <p className="text-xs font-medium text-white truncate">
                      {badge.name}
                    </p>
                     <p className="text-xs text-slate-400 truncate mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Points & rank section */}
        <div className="flex flex-col gap-3">
           <div
             className="p-4 rounded-lg flex-1"
             style={{
               backgroundColor: 'rgba(34, 211, 238, 0.12)',
               border: '1px solid rgba(34, 211, 238, 0.3)',
             }}
           >
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} style={{ color: '#06B6D4' }} />
               <span className="text-xs text-slate-400">积分获取</span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #06B6D4, #2563EB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              +{pointsEarned}
            </p>
             <p className="text-xs text-slate-400 mt-1">本期获得积分</p>
          </div>

           <div
             className="p-4 rounded-lg flex-1"
             style={{
               backgroundColor: 'rgba(168, 85, 247, 0.15)',
               border: '1px solid rgba(168, 85, 247, 0.3)',
             }}
           >
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} style={{ color: '#A855F7' }} />
               <span className="text-xs text-slate-400">排行榜变化</span>
            </div>
            <div className="flex items-center gap-2">
              <p
                className="text-2xl font-bold"
                style={{
                  color: rankImproved ? '#06B6D4' : '#EF476F',
                }}
              >
                {rankImproved ? '+' : ''}{rankChange}
              </p>
              {rankImproved ? (
                <TrendingUp size={16} style={{ color: '#06B6D4' }} />
              ) : (
                <TrendingDown size={16} style={{ color: '#EF476F' }} />
              )}
            </div>
             <p className="text-xs text-slate-400 mt-1">
              {rankImproved ? '排名上升' : rankChange === 0 ? '排名不变' : '排名下降'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementCard;
