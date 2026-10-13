import React, { useMemo, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import type { FingerSide, KeyDefinition } from './keyboard-layouts';

interface FingerAnimationProps {
  layout: KeyDefinition[][];
  targetKey: KeyDefinition | null;
  activeKey: string | null;
  wrongKey: string | null;
  speed: 'slow' | 'normal' | 'fast';
  visible: boolean;
  keyWidth: number;
  keyHeight: number;
  keyGap: number;
}

const HOME_KEYS: Record<FingerSide, string> = {
  'l-pinky':  'a',
  'l-ring':   's',
  'l-middle': 'd',
  'l-index':  'f',
  'r-index':  'j',
  'r-middle': 'k',
  'r-ring':   'l',
  'r-pinky':  ';',
  thumb:      ' ',
};

const FINGER_ORDER: FingerSide[] = [
  'l-pinky', 'l-ring', 'l-middle', 'l-index',
  'r-index', 'r-middle', 'r-ring', 'r-pinky',
];

const speedMap = {
  slow:   0.5,
  normal: 0.3,
  fast:   0.15,
};

const FINGER_CONFIG: Record<FingerSide, { width: number; length: number; tilt: number }> = {
  'l-pinky':  { width: 11, length: 58, tilt: -12 },
  'l-ring':   { width: 13, length: 72, tilt: -6 },
  'l-middle': { width: 14, length: 80, tilt: -2 },
  'l-index':  { width: 13, length: 74, tilt: 2 },
  'r-index':  { width: 13, length: 74, tilt: -2 },
  'r-middle': { width: 14, length: 80, tilt: 2 },
  'r-ring':   { width: 13, length: 72, tilt: 6 },
  'r-pinky':  { width: 11, length: 58, tilt: 12 },
  thumb:      { width: 18, length: 50, tilt: 0 },
};

function getKeyPosition(
  keyDef: KeyDefinition,
  keyWidth: number,
  keyHeight: number,
  keyGap: number,
): { x: number; y: number } {
  const colStart = keyDef.col;
  const width = keyWidth * (keyDef.width ?? 1) + keyGap * ((keyDef.width ?? 1) - 1);
  const x = colStart * (keyWidth + keyGap) + width / 2;
  const y = keyDef.row * (keyHeight + keyGap) + keyHeight / 2;
  return { x, y };
}

function findKeyByValue(layout: KeyDefinition[][], value: string): KeyDefinition | undefined {
  const lower = value.toLowerCase();
  for (const row of layout) {
    for (const k of row) {
      if (k.value.toLowerCase() === lower) return k;
      if (k.shiftValue?.toLowerCase() === lower) return k;
    }
  }
  return undefined;
}

interface SingleFingerProps {
  side: FingerSide;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  isTarget: boolean;
  isActive: boolean;
  isWrong: boolean;
  duration: number;
  keyHeight: number;
  hand: 'left' | 'right';
  palmX: number;
  palmY: number;
}

const SingleFinger: React.FC<SingleFingerProps> = ({
  side,
  homeX,
  homeY,
  targetX,
  targetY,
  isTarget,
  isActive,
  isWrong,
  duration,
  keyHeight,
  hand,
  palmX,
  palmY,
}) => {
  const cfg = FINGER_CONFIG[side];
  const fingerLen = cfg.length + keyHeight * 0.6;
  const fingerW = cfg.width;

  const x = useSpring(homeX, { stiffness: 260, damping: 26 });
  const y = useSpring(homeY, { stiffness: 260, damping: 26 });
  const press = useSpring(0, { stiffness: 400, damping: 30 });
  const shake = useSpring(0, { stiffness: 500, damping: 15 });

  const translateX = useTransform(x, (v) => `${v}px`);
  const translateY = useTransform(y, (v) => `${v}px`);
  const pressZ = useTransform(press, [0, 1], [0, -10]);
  const pressScale = useTransform(press, [0, 1], [1, 0.92]);
  const shakeX = useTransform(shake, (v) => `${v}px`);

  useEffect(() => {
    const controls = animate(x, targetX, { duration });
    return () => controls.stop();
  }, [targetX, duration, x]);

  useEffect(() => {
    const controls = animate(y, targetY, { duration });
    return () => controls.stop();
  }, [targetY, duration, y]);

  useEffect(() => {
    const controls = animate(press, isActive ? 1 : 0, { duration: duration * 0.4 });
    return () => controls.stop();
  }, [isActive, duration, press]);

  useEffect(() => {
    if (!isWrong) return;
    const seq = async () => {
      await animate(shake, -6, { duration: 0.05 });
      await animate(shake, 6, { duration: 0.05 });
      await animate(shake, -4, { duration: 0.05 });
      await animate(shake, 4, { duration: 0.05 });
      await animate(shake, 0, { duration: 0.05 });
    };
    seq();
  }, [isWrong, shake]);

  const baseGradient = isTarget
    ? 'linear-gradient(90deg, rgba(0,100,150,0.4) 0%, rgba(0,212,255,0.85) 35%, rgba(168,85,247,0.9) 65%, rgba(100,20,140,0.5) 100%)'
    : 'linear-gradient(90deg, rgba(80,90,130,0.35) 0%, rgba(180,195,225,0.6) 40%, rgba(220,230,245,0.7) 50%, rgba(180,195,225,0.6) 60%, rgba(80,90,130,0.35) 100%)';

  const tipGradient = isTarget
    ? 'radial-gradient(ellipse at 50% 40%, rgba(180,240,255,0.95) 0%, rgba(0,212,255,0.8) 35%, rgba(168,85,247,0.7) 70%, rgba(80,20,120,0.5) 100%)'
    : 'radial-gradient(ellipse at 50% 40%, rgba(240,245,255,0.85) 0%, rgba(200,210,235,0.7) 40%, rgba(150,160,195,0.6) 75%, rgba(100,110,150,0.5) 100%)';

  const jointColor = isTarget
    ? 'rgba(168,85,247,0.6)'
    : 'rgba(140,150,185,0.5)';

  const glowStyle = isTarget
    ? '0 0 18px rgba(0,212,255,0.7), 0 0 35px rgba(168,85,247,0.5), 0 4px 12px rgba(0,0,0,0.35)'
    : '0 4px 10px rgba(0,0,0,0.3)';

  const fingerOpacity = isTarget ? 0.95 : 0.65;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        x: translateX,
        y: translateY,
        zIndex: isTarget ? 25 : 20,
        pointerEvents: 'none',
        transformStyle: 'preserve-3d',
        perspective: 1000,
        willChange: 'transform',
      }}
    >
      <motion.div
        style={{
          x: shakeX,
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
          rotateX: 35,
          rotateZ: cfg.tilt,
          translateY: `-${fingerLen}px`,
        }}
      >
        <motion.div
          style={{
            width: fingerW,
            height: fingerLen,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transformOrigin: 'bottom center',
            z: pressZ,
            scaleY: pressScale,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: fingerW / 2,
              background: baseGradient,
              boxShadow: glowStyle,
              opacity: fingerOpacity,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: fingerW * 0.7,
              height: '30%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50% 50% 0 0',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: 0,
              right: 0,
              height: 4,
              background: jointColor,
              borderRadius: '50%',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)`,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '58%',
              left: 0,
              right: 0,
              height: 4,
              background: jointColor,
              borderRadius: '50%',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)`,
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: -fingerW * 0.2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: fingerW * 1.15,
              height: fingerW * 0.75,
              borderRadius: '50%',
              background: tipGradient,
              boxShadow: isTarget
                ? '0 0 15px rgba(0,212,255,0.8), 0 2px 6px rgba(0,0,0,0.3)'
                : '0 2px 6px rgba(0,0,0,0.25)',
              zIndex: 2,
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

interface PalmProps {
  side: 'left' | 'right';
  x: number;
  y: number;
  keyHeight: number;
}

const Palm: React.FC<PalmProps> = ({ side, x, y, keyHeight }) => {
  const width = side === 'left' ? 70 : 70;
  const height = 50;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${x - width / 2}px, ${y - height / 2}px, -5px)`,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      <div
        style={{
          width,
          height,
          borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%',
          background: 'linear-gradient(180deg, rgba(170,185,215,0.5) 0%, rgba(140,155,190,0.4) 50%, rgba(110,125,165,0.35) 100%)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)',
          transform: `rotateX(25deg) ${side === 'left' ? 'rotateY(-10deg)' : 'rotateY(10deg)'}`,
          transformStyle: 'preserve-3d',
        }}
      />
    </div>
  );
};

const FingerAnimation: React.FC<FingerAnimationProps> = ({
  layout,
  targetKey,
  activeKey,
  wrongKey,
  speed,
  visible,
  keyWidth,
  keyHeight,
  keyGap,
}) => {
  const duration = speedMap[speed];
  const containerRef = useRef<HTMLDivElement>(null);

  const homePositions = useMemo(() => {
    const positions: Partial<Record<FingerSide, { x: number; y: number }>> = {};
    for (const side of FINGER_ORDER) {
      const keyVal = HOME_KEYS[side];
      const keyDef = findKeyByValue(layout, keyVal);
      if (keyDef) {
        positions[side] = getKeyPosition(keyDef, keyWidth, keyHeight, keyGap);
      }
    }
    const spaceKey = layout.flat().find((k) => k.specialType === 'space');
    if (spaceKey) {
      positions.thumb = getKeyPosition(spaceKey, keyWidth, keyHeight, keyGap);
    }
    return positions;
  }, [layout, keyWidth, keyHeight, keyGap]);

  const targetFingerSide: FingerSide | null = useMemo(() => {
    if (!targetKey) return null;
    return targetKey.finger ?? null;
  }, [targetKey]);

  const targetPos = useMemo(() => {
    if (!targetKey) return null;
    return getKeyPosition(targetKey, keyWidth, keyHeight, keyGap);
  }, [targetKey, keyWidth, keyHeight, keyGap]);

  const activeFingerSide = useMemo(() => {
    if (!activeKey) return null;
    const keyDef = findKeyByValue(layout, activeKey);
    return keyDef?.finger ?? null;
  }, [activeKey, layout]);

  const activePos = useMemo(() => {
    if (!activeKey) return null;
    const keyDef = findKeyByValue(layout, activeKey);
    if (!keyDef) return null;
    return getKeyPosition(keyDef, keyWidth, keyHeight, keyGap);
  }, [activeKey, layout, keyWidth, keyHeight, keyGap]);

  const wrongFingerSide = useMemo(() => {
    if (!wrongKey) return null;
    const keyDef = findKeyByValue(layout, wrongKey);
    return keyDef?.finger ?? null;
  }, [wrongKey, layout]);

  const totalWidth = useMemo(() => {
    let maxColEnd = 0;
    for (const row of layout) {
      let colEnd = 0;
      for (const k of row) {
        colEnd = k.col + (k.width ?? 1);
      }
      maxColEnd = Math.max(maxColEnd, colEnd);
    }
    return maxColEnd * keyWidth + (maxColEnd - 1) * keyGap;
  }, [layout, keyWidth, keyGap]);

  const leftPalm = useMemo(() => {
    const aPos = homePositions['l-pinky'];
    if (!aPos) return { x: 0, y: -30 };
    return { x: aPos.x - 25, y: -20 };
  }, [homePositions]);

  const rightPalm = useMemo(() => {
    const sPos = homePositions['r-pinky'];
    if (!sPos) return { x: totalWidth, y: -30 };
    return { x: sPos.x + 25, y: -20 };
  }, [homePositions, totalWidth]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{
        perspective: 1000,
        perspectiveOrigin: '50% -20%',
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
        <Palm side="left" x={leftPalm.x} y={leftPalm.y} keyHeight={keyHeight} />
        <Palm side="right" x={rightPalm.x} y={rightPalm.y} keyHeight={keyHeight} />

        {FINGER_ORDER.map((side) => {
          const home = homePositions[side];
          if (!home) return null;

          const hand: 'left' | 'right' = side.startsWith('l-') ? 'left' : 'right';
          const palm = hand === 'left' ? leftPalm : rightPalm;

          let destX = home.x;
          let destY = home.y;
          let isTarget = false;
          let isActive = false;
          let isWrong = false;

          if (targetFingerSide === side && targetPos) {
            destX = targetPos.x;
            destY = targetPos.y;
            isTarget = true;
          }

          if (activeFingerSide === side && activePos) {
            destX = activePos.x;
            destY = activePos.y;
            isActive = true;
            isTarget = true;
          }

          if (wrongFingerSide === side) {
            isWrong = true;
          }

          return (
            <SingleFinger
              key={side}
              side={side}
              homeX={home.x}
              homeY={home.y}
              targetX={destX}
              targetY={destY}
              isTarget={isTarget}
              isActive={isActive}
              isWrong={isWrong}
              duration={duration}
              keyHeight={keyHeight}
              hand={hand}
              palmX={palm.x}
              palmY={palm.y}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FingerAnimation;
