import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';

export interface LevelUpModalProps {
  level: number;
  levelName: string;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  levelName,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-auto"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 22,
        }}
        className="relative z-10 pointer-events-auto"
      >
        <div
          className="relative rounded-2xl p-8 w-80 text-center border"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)',
            borderColor: 'rgba(99, 102, 241, 0.35)',
            boxShadow:
              '0 0 40px rgba(99, 102, 241, 0.25), inset 0 0 30px rgba(99, 102, 241, 0.08)',
          }}
        >
          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={(e): void => {
              e.currentTarget.style.color = '#F1F5F9';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e): void => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          {/* 顶部光晕 */}
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
            }}
          />

          {/* 等级图标 */}
          <div className="relative mb-4">
            <motion.div
              initial={{ rotate: -20, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                boxShadow:
                  '0 0 30px rgba(99, 102, 241, 0.3), 0 0 60px rgba(34, 211, 238, 0.3)',
              }}
            >
              <Trophy size={36} className="text-white" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-xs font-medium mb-1 tracking-widest"
            style={{ color: '#06B6D4' }}
          >
            ✦ 恭喜升级 ✦
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-2xl font-bold mb-2"
            style={{
              background:
                'linear-gradient(135deg, #F1F5F9 0%, #818CF8 50%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LV{level} {levelName}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm"
            style={{ color: '#94A3B8' }}
          >
            你已解锁新等级，继续加油！
          </motion.p>

          {/* 装饰星星 */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
            className="absolute top-6 left-6"
            style={{ color: '#FFD700' }}
          >
            <Star size={16} fill="currentColor" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
            className="absolute top-8 right-8"
            style={{ color: '#06B6D4' }}
          >
            <Sparkles size={14} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.7 }}
            className="absolute bottom-10 left-8"
            style={{ color: '#818CF8' }}
          >
            <Star size={12} fill="currentColor" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LevelUpModal;
