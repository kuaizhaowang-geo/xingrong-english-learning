import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';

export interface MoleProps {
  mole: {
    id: string;
    key: string;
    state: 'rising' | 'up' | 'hit' | 'escaping';
    isGolden: boolean;
  };
}

const Mole: React.FC<MoleProps> = ({ mole }) => {
  const { state, key, isGolden } = mole;

  const getAnimProps = () => {
    switch (state) {
      case 'rising':
        return {
          initial: { y: 60, opacity: 0, scale: 0.7 },
          animate: { y: 0, opacity: 1, scale: 1 },
          transition: { duration: 0.2, ease: 'easeOut' as const },
        };
      case 'up':
        return {
          initial: { y: 0, opacity: 1, scale: 1 },
          animate: {
            y: [0, -6, 0],
            scale: [1, 1.03, 1],
          },
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'hit':
        return {
          initial: { scale: 1, opacity: 1 },
          animate: {
            scale: [1, 1.3, 0.2],
            opacity: [1, 1, 0],
            rotate: [0, 15, -15, 0],
          },
          transition: { duration: 0.4, ease: 'easeOut' as const },
        };
      case 'escaping':
        return {
          initial: { y: 0, opacity: 1, scale: 1 },
          animate: { y: 60, opacity: 0, scale: 0.6 },
          transition: { duration: 0.3, ease: 'easeIn' as const },
        };
      default:
        return { initial: {}, animate: {}, transition: {} };
    }
  };

  const animProps = getAnimProps();
  const displayKey = key === ';' ? ';' : key.toUpperCase();

  const bgGradient = isGolden
    ? 'linear-gradient(180deg, #FFD700 0%, #F59E0B 60%, #B45309 100%)'
    : 'linear-gradient(180deg, #D97706 0%, #92400E 60%, #78350F 100%)';

  const glowColor = isGolden
    ? 'rgba(255, 215, 0, 0.6)'
    : 'rgba(249, 115, 22, 0.4)';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${mole.id}-${state}`}
        {...animProps}
        className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[70%] flex flex-col items-center z-10"
      >
        {/* Letter bubble */}
        <motion.div
          className="relative mb-1 px-2 py-0.5 rounded-lg font-black text-base md:text-lg z-20"
          style={{
            background: isGolden
              ? 'linear-gradient(135deg, #FFD700, #F59E0B)'
              : 'linear-gradient(135deg, #6366F1, #2563EB)',
            color: '#fff',
            boxShadow: isGolden
              ? '0 0 12px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 215, 0, 0.4)'
              : '0 0 12px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            minWidth: '28px',
            textAlign: 'center',
          }}
          animate={
            state === 'up' && isGolden
              ? {
                  boxShadow: [
                    '0 0 12px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 215, 0, 0.4)',
                    '0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.6)',
                    '0 0 12px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 215, 0, 0.4)',
                  ],
                }
              : {}
          }
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          {displayKey}
          {/* Triangle pointer */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
            style={{
              background: isGolden ? '#F59E0B' : '#2563EB',
            }}
          />
          {isGolden && (
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={16} className="text-[#FFD700]" />
            </motion.div>
          )}
        </motion.div>

        {/* Mole body */}
        <div
          className="relative w-full aspect-square rounded-t-full"
          style={{
            background: bgGradient,
            boxShadow: `0 4px 15px ${glowColor}, inset 0 -4px 8px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Face area - lighter */}
          <div
            className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full"
            style={{
              background: isGolden
                ? 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)'
                : 'linear-gradient(180deg, #FED7AA 0%, #FDBA74 100%)',
            }}
          />

          {/* Eyes */}
          <div className="absolute top-[38%] left-[28%] w-[14%] h-[14%] bg-[#FFFFFF] rounded-full">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-white rounded-full" />
          </div>
          <div className="absolute top-[38%] right-[28%] w-[14%] h-[14%] bg-[#FFFFFF] rounded-full">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-white rounded-full" />
          </div>

          {/* Nose */}
          <div
            className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[12%] h-[10%] rounded-full"
            style={{ background: isGolden ? '#B45309' : '#7C2D12' }}
          />

          {/* Mouth */}
          <div
            className="absolute top-[65%] left-1/2 -translate-x-1/2 w-[20%] h-[8%] border-b-2 rounded-b-full"
            style={{ borderColor: isGolden ? '#92400E' : '#7C2D12' }}
          />

          {/* Ears */}
          <div
            className="absolute -top-[5%] -left-[5%] w-[28%] h-[28%] rounded-full"
            style={{
              background: isGolden ? '#F59E0B' : '#92400E',
              boxShadow: `inset -2px -2px 6px rgba(0,0,0,0.2)`,
            }}
          >
            <div
              className="absolute top-[30%] left-[30%] w-[50%] h-[50%] rounded-full"
              style={{ background: isGolden ? '#FDE68A' : '#FDBA74' }}
            />
          </div>
          <div
            className="absolute -top-[5%] -right-[5%] w-[28%] h-[28%] rounded-full"
            style={{
              background: isGolden ? '#F59E0B' : '#92400E',
              boxShadow: `inset 2px -2px 6px rgba(0,0,0,0.2)`,
            }}
          >
            <div
              className="absolute top-[30%] left-[20%] w-[50%] h-[50%] rounded-full"
              style={{ background: isGolden ? '#FDE68A' : '#FDBA74' }}
            />
          </div>

          {/* Golden sparkle */}
          {isGolden && state === 'up' && (
            <>
              <motion.div
                className="absolute top-[15%] right-[10%]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Star size={12} className="text-[#FFD700] fill-[#FFD700]" />
              </motion.div>
              <motion.div
                className="absolute top-[20%] left-[8%]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              >
                <Star size={8} className="text-[#FEF3C7] fill-[#FEF3C7]" />
              </motion.div>
            </>
          )}
        </div>

        {/* Hit explosion effect */}
        {state === 'hit' && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full pointer-events-none"
            style={{
              background: isGolden
                ? 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)'
                : 'radial-gradient(circle, rgba(34,211,238,0.7) 0%, rgba(34,211,238,0) 70%)',
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Mole;
