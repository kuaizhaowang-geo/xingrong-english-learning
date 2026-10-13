import React from 'react';
import { Target, Flame, CheckCircle } from 'lucide-react';

interface TodayProgressProps {
  todayMinutes: number;
  targetMinutes: number;
}

const TodayProgress: React.FC<TodayProgressProps> = ({
  todayMinutes,
  targetMinutes,
}) => {
  const percent = targetMinutes > 0
    ? Math.min(100, Math.round((todayMinutes / targetMinutes) * 100))
    : 0;
  const isCompleted = todayMinutes >= targetMinutes;
  const remaining = Math.max(0, targetMinutes - todayMinutes);

  // SVG ring parameters
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
     <div
       className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden"
       style={{
         background:
           'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(59, 130, 246, 0.1) 100%)',
         border: '1px solid rgba(99, 102, 241, 0.2)',
         boxShadow: '0 0 30px rgba(99, 102, 241, 0.08)',
       }}
       data-ai-section-type="card-stat"
     >
      {/* glow effect */}
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
      />

         <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Left: Ring progress */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(99, 102, 241, 0.08)"
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              filter="url(#ringGlow)"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {percent}%
            </span>
            <span className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              完成率
            </span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 text-center md:text-left">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4" style={{ color: '#1E293B' }}>
               今日学习进度
           </h2>

           <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99, 102, 241, 0.12)' }}
              >
                <Flame className="w-4 h-4" style={{ color: '#6366F1' }} />
              </div>
              <div>
                 <div className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
                   {todayMinutes}
                  <span className="text-sm font-normal ml-1" style={{ color: '#94A3B8' }}>
                    分钟
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  今日已学习
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Target className="w-4 h-4" style={{ color: '#2563EB' }} />
              </div>
              <div>
                 <div className="text-base sm:text-lg font-semibold" style={{ color: '#1E293B' }}>
                   {targetMinutes}
                  <span className="text-sm font-normal ml-1" style={{ color: '#94A3B8' }}>
                    分钟
                  </span>
                </div>
                <div className="text-xs" style={{ color: '#94A3B8' }}>
                  每日目标
                </div>
              </div>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: isCompleted
                ? 'rgba(34, 211, 238, 0.15)'
                : 'rgba(99, 102, 241, 0.08)',
              border: isCompleted
                ? '1px solid rgba(34, 211, 238, 0.4)'
                : '1px solid rgba(99, 102, 241, 0.25)',
              color: isCompleted ? '#06B6D4' : '#818CF8',
            }}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4" />
                已达标，继续加油！
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                还差 {remaining} 分钟达标
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayProgress;
