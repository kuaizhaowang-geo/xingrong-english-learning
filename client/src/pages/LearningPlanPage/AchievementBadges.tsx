import React from 'react';
import { Trophy } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  achieved: boolean;
  progress?: string;
}

interface AchievementBadgesProps {
  achievements: Badge[];
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ achievements }) => {
  return (
    <div
      className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
      style={{
         background: 'rgba(255, 255, 255, 0.9)',
         border: '1px solid rgba(99, 102, 241, 0.15)',
         backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: '#6366F1' }} />
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
              成就徽章
           </h3>
        </div>
        <span className="text-xs" style={{ color: '#64748B' }}>
          {achievements.filter((a: Badge) => a.achieved).length}/{achievements.length} 已解锁
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
        {achievements.map((badge: Badge) => (
          <div
            key={badge.id}
             className="flex-shrink-0 flex flex-col items-center w-20 sm:w-24 group cursor-pointer transition-transform hover:scale-105"
          >
            {/* Badge icon circle */}
            <div
               className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2"
              style={{
                background: badge.achieved
                  ? badge.gradient
                  : 'rgba(100, 116, 139, 0.15)',
                boxShadow: badge.achieved
                  ? `0 0 20px ${
                      badge.id.includes('streak-7')
                        ? 'rgba(99, 102, 241, 0.35)'
                        : badge.id.includes('streak-30')
                          ? 'rgba(59, 130, 246, 0.5)'
                          : badge.id.includes('streak-100')
                            ? 'rgba(234, 179, 8, 0.5)'
                            : badge.id.includes('words')
                              ? 'rgba(34, 211, 238, 0.5)'
                              : badge.id.includes('sentences')
                                ? 'rgba(236, 72, 153, 0.5)'
                                : 'rgba(16, 185, 129, 0.5)'
                    }`
                  : 'none',
                opacity: badge.achieved ? 1 : 0.4,
                filter: badge.achieved ? 'none' : 'grayscale(100%)',
                border: badge.achieved
                  ? '2px solid rgba(255, 255, 255, 0.2)'
                  : '1px dashed rgba(100, 116, 139, 0.3)',
              }}
            >
              {/* Inner glow ring for achieved */}
              {badge.achieved && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)',
                  }}
                />
              )}
              <div className="relative" style={{ color: badge.achieved ? '#fff' : '#64748B' }}>
                {badge.icon}
              </div>
            </div>

            {/* Name */}
            <span
              className="text-xs font-medium text-center w-full truncate"
              style={{
                 color: badge.achieved ? '#334155' : '#94A3B8',
              }}
            >
              {badge.name}
            </span>

            {/* Progress / achieved indicator */}
            {badge.achieved ? (
              <span
                className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(34, 211, 238, 0.15)',
                  color: '#06B6D4',
                }}
              >
                已解锁
              </span>
            ) : (
              <span
                className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(100, 116, 139, 0.15)',
                  color: '#64748B',
                }}
              >
                {badge.progress || '未解锁'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementBadges;
