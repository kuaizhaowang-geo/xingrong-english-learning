import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';

const PromoBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative overflow-hidden rounded-xl cursor-pointer group shadow-lg border border-fuchsia-500/30"
      onClick={() => navigate('/membership')}
      style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #D946EF 50%, #22D3EE 100%)',
      }}
    >
      {/* 装饰圆圈 */}
      <div className="absolute -top-10 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="text-white" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm sm:text-base leading-tight">
              哇学社暑假优惠倒计时
            </div>
            <div className="text-white/80 text-[11px] sm:text-xs mt-0.5 truncate">
              全年最低价，错过再等一年
            </div>
          </div>
        </div>

        <button
            className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-auto rounded-lg font-medium text-[11px] sm:text-xs text-fuchsia-600 bg-white shadow-md hover:shadow-lg transition-all flex items-center gap-0.5 group-hover:scale-105 min-h-[36px] sm:min-h-[44px]"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/membership');
          }}
        >
          立即开通
          <ChevronRight size={12} className="sm:hidden" />
          <ChevronRight size={14} className="hidden sm:inline" />
        </button>
      </div>
    </section>
  );
};

export default PromoBanner;
