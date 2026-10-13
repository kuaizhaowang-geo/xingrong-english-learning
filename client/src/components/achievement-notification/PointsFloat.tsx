import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

export interface PointsFloatProps {
  points: number;
  index: number;
}

const PointsFloat: React.FC<PointsFloatProps> = ({ points, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -60 - index * 10,
        scale: [0.8, 1.1, 1, 1],
      }}
      exit={{ opacity: 0, y: -80 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        border: '1px solid rgba(255, 215, 0, 0.4)',
        boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
      }}
    >
      <Coins size={14} style={{ color: '#FFD700' }} />
      <span className="text-sm font-bold" style={{ color: '#FFD700' }}>
        +{points} 积分
      </span>
    </motion.div>
  );
};

export default PointsFloat;
