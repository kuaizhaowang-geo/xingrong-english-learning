import React from 'react';
import { motion } from 'framer-motion';
import Mole from './Mole';

export interface MoleHole {
  id: string;
  key: string;
  holeIndex: number;
  state: 'rising' | 'up' | 'hit' | 'escaping';
  createdAt: number;
  isGolden: boolean;
}

export interface ScorePopup {
  id: string;
  holeIndex: number;
  text: string;
  color: string;
}

export interface GameGridProps {
  moles: MoleHole[];
  scorePopups: ScorePopup[];
}

const HOLE_COUNT = 9;

const GameGrid: React.FC<GameGridProps> = ({ moles, scorePopups }) => {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full h-full">
      {Array.from({ length: HOLE_COUNT }).map((_, idx: number) => {
        const mole = moles.find(m => m.holeIndex === idx);
        const popup = scorePopups.find(p => p.holeIndex === idx);
        return (
          <div key={idx} className="relative flex items-end justify-center overflow-visible">
            {/* Hole */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[40%] rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, #05030f 0%, #EEF2FF 70%, #FFFFFF 100%)',
                boxShadow:
                  'inset 0 6px 12px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(99,102,241,0.12)',
              }}
            />
            {/* Mole */}
            {mole && <Mole mole={mole} />}
            {/* Score popup */}
            {popup && (
              <motion.div
                key={popup.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -60, scale: 1.3 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute left-1/2 -translate-x-1/2 top-[30%] text-lg md:text-xl font-bold pointer-events-none z-20 whitespace-nowrap"
                style={{ color: popup.color, textShadow: `0 0 10px ${popup.color}` }}
              >
                {popup.text}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GameGrid;
