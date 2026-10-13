import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSwap } from '@client/src/utils/animations';
import { generateScene, type SceneShape } from '../utils/sceneIllustration';

export interface SceneIllustrationProps {
  courseId: string;
  show: boolean;
  animationLevel?: 'off' | 'simple' | 'standard' | 'rich';
}

const ShapeEl: React.FC<{ shape: SceneShape }> = ({ shape }) => {
  const commonStyle: React.CSSProperties = {
    left: `${shape.x}%`,
    top: `${shape.y}%`,
    opacity: shape.opacity,
    transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
    filter: `drop-shadow(0 0 8px ${shape.color})`,
  };

  if (shape.type === 'circle') {
    return (
      <div
        className="absolute rounded-full"
        style={{
          ...commonStyle,
          width: shape.size,
          height: shape.size,
          background: `radial-gradient(circle at 30% 30%, ${shape.color}, transparent 70%)`,
        }}
      />
    );
  }
  if (shape.type === 'triangle') {
    return (
      <div
        className="absolute"
        style={{
          ...commonStyle,
          width: 0,
          height: 0,
          borderLeft: `${shape.size / 2}px solid transparent`,
          borderRight: `${shape.size / 2}px solid transparent`,
          borderBottom: `${shape.size}px solid ${shape.color}`,
          filter: `drop-shadow(0 0 6px ${shape.color})`,
        }}
      />
    );
  }
  if (shape.type === 'rect') {
    return (
      <div
        className="absolute rounded-lg"
        style={{
          ...commonStyle,
          width: shape.size,
          height: shape.size * 0.6,
          background: `linear-gradient(135deg, ${shape.color}40, ${shape.color}10)`,
          border: `1px solid ${shape.color}60`,
        }}
      />
    );
  }
  // star
  return (
    <svg
      className="absolute"
      width={shape.size}
      height={shape.size}
      viewBox="0 0 24 24"
      style={{
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        opacity: shape.opacity,
        transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
        filter: `drop-shadow(0 0 6px ${shape.color})`,
      }}
      fill={shape.color}
    >
      <path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.8 5.7 20.8 8 13.6 2 9.2h7.6z" />
    </svg>
  );
};

const SceneIllustration: React.FC<SceneIllustrationProps> = ({
  courseId,
  show,
  animationLevel = 'standard',
}) => {
  const scene = useMemo(() => generateScene(courseId), [courseId]);

  if (!show) return null;

  const animate = animationLevel !== 'off';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={courseId}
        initial={animate ? 'hidden' : false}
        animate="show"
        exit={animate ? 'exit' : undefined}
        variants={fadeSwap}
        className="relative w-full h-[120px] rounded-2xl overflow-hidden border border-[rgba(124_58_237_0.3)] mb-4"
        style={{
          background: `linear-gradient(135deg, ${scene.bgGradient[0]}20 0%, ${scene.bgGradient[1]}20 100%)`,
        }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(${scene.accentColor}30 1px, transparent 1px),
                             linear-gradient(90deg, ${scene.accentColor}30 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />

        {/* Decorative shapes */}
        {scene.shapes.map((shape: SceneShape, idx: number) => (
          <ShapeEl key={idx} shape={shape} />
        ))}

        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: `linear-gradient(to top, ${scene.bgGradient[1]}40, transparent)`,
          }}
        />

        {/* Corner accent */}
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
          style={{
            background: `${scene.accentColor}30`,
            color: scene.accentColor,
            border: `1px solid ${scene.accentColor}50`,
          }}
        >
          SCENE
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SceneIllustration;
