import { useMemo, useState, useEffect } from 'react';
import { getFingering, type Hand, type Finger } from '@client/src/utils/fingering-guide';

export interface VirtualHandsGuideProps {
  visible: boolean;
  targetKey: string | null;
  keyboardWidth?: number;
  height?: number;
}

const KEY_POSITIONS: Record<string, [number, number]> = {
  q:[0, 0], w:[0, 1], e:[0, 2], r:[0, 3], t:[0, 4], y:[0, 5], u:[0, 6], i:[0, 7], o:[0, 8], p:[0, 9],
  a:[1, 0.3], s:[1, 1.3], d:[1, 2.3], f:[1, 3.3], g:[1, 4.3], h:[1, 5.3], j:[1, 6.3], k:[1, 7.3], l:[1, 8.3], ';':[1, 9.3],
  z:[2, 0.8], x:[2, 1.8], c:[2, 2.8], v:[2, 3.8], b:[2, 4.8], n:[2, 5.8], m:[2, 6.8], ',':[2, 7.8], '.':[2, 8.8], '/':[2, 9.8],
};

const FINGER_CONFIG: Record<Finger, { width: number; length: number }> = {
  pinky:  { width: 11, length: 70 },
  ring:   { width: 13, length: 82 },
  middle: { width: 14, length: 90 },
  index:  { width: 13, length: 80 },
  thumb:  { width: 18, length: 55 },
};

const ROW_COUNT = 4;

function getKeyCenter(
  key: string,
  kbW: number,
  kbH: number,
): { x: number; y: number } {
  if (key === ' ' || key === 'Space') {
    return { x: kbW * 0.5, y: kbH - kbH / ROW_COUNT * 0.6 };
  }
  const pos = KEY_POSITIONS[key.toLowerCase()];
  if (!pos) return { x: kbW * 0.5, y: kbH * 0.5 };
  const [row, col] = pos;
  const colCount = 10.3;
  const unitW = kbW / colCount;
  const unitH = kbH / ROW_COUNT;
  const rowOffset = [0, unitW * 0.1, unitW * 0.2][row] || 0;
  const x = col * unitW + unitW * 0.5 + rowOffset + kbW * 0.015;
  const y = row * unitH + unitH * 0.6;
  return { x, y };
}

function Palm({ cx, cy, isLeft }: { cx: number; cy: number; isLeft: boolean }) {
  const w = 130;
  const h = 85;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: '45% 45% 38% 38% / 55% 55% 45% 45%',
        background: isLeft
          ? 'linear-gradient(145deg, rgba(170,185,215,0.48) 0%, rgba(145,160,195,0.4) 50%, rgba(120,135,175,0.32) 100%)'
          : 'linear-gradient(-145deg, rgba(170,185,215,0.48) 0%, rgba(145,160,195,0.4) 50%, rgba(120,135,175,0.32) 100%)',
        boxShadow:
          '0 6px 18px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.1)',
        transform: `rotateX(28deg) ${isLeft ? 'rotateY(-12deg)' : 'rotateY(12deg)'}`,
        transformStyle: 'preserve-3d',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* 手腕延伸 */}
      <div
        style={{
          position: 'absolute',
          bottom: -30,
          left: '18%',
          right: '18%',
          height: 34,
          borderRadius: '0 0 40% 40% / 0 0 65% 65%',
          background: 'linear-gradient(180deg, rgba(155,170,200,0.4) 0%, rgba(125,140,175,0.32) 100%)',
          boxShadow: '0 3px 6px rgba(0,0,0,0.18)',
        }}
      />
      {/* 掌心高光 */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '55%',
          height: '30%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

interface SingleFingerProps {
  hand: Hand;
  finger: Finger;
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
  active: boolean;
  pressed: boolean;
}

function SingleFinger({ hand, finger, baseX, baseY, tipX, tipY, active, pressed }: SingleFingerProps) {
  const cfg = FINGER_CONFIG[finger];
  const isLeft = hand === 'left';
  const isThumb = finger === 'thumb';

  const dx = tipX - baseX;
  const dy = tipY - baseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const length = Math.max(cfg.length * 0.6, Math.min(dist, cfg.length));

  const actualLength = pressed ? length * 0.92 : length;

  const bodyGradient = active
    ? 'linear-gradient(90deg, rgba(30,15,60,0.55) 0%, rgba(124,58,237,0.85) 20%, rgba(0,212,255,0.95) 50%, rgba(124,58,237,0.85) 80%, rgba(30,15,60,0.55) 100%)'
    : 'linear-gradient(90deg, rgba(90,100,140,0.3) 0%, rgba(175,190,220,0.55) 35%, rgba(215,225,240,0.65) 50%, rgba(175,190,220,0.55) 65%, rgba(90,100,140,0.3) 100%)';

  const tipGradient = active
    ? 'radial-gradient(ellipse at 50% 40%, rgba(200,245,255,1) 0%, rgba(0,212,255,0.9) 40%, rgba(124,58,237,0.8) 80%, rgba(40,10,80,0.5) 100%)'
    : 'radial-gradient(ellipse at 50% 40%, rgba(240,245,252,0.88) 0%, rgba(200,210,235,0.72) 40%, rgba(155,165,195,0.58) 75%, rgba(105,115,150,0.45) 100%)';

  const nailGradient = active
    ? 'radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.95) 0%, rgba(200,235,255,0.7) 60%, transparent 100%)'
    : 'radial-gradient(ellipse at 50% 60%, rgba(255,248,242,0.82) 0%, rgba(235,220,215,0.58) 60%, transparent 100%)';

  const glow = active
    ? '0 0 14px rgba(0,212,255,0.7), 0 0 28px rgba(124,58,237,0.5), 0 2px 6px rgba(0,0,0,0.3)'
    : '0 2px 6px rgba(0,0,0,0.2)';

  const jointY = actualLength * 0.55;

  const thumbExtraAngle = isThumb ? (isLeft ? -35 : 35) : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: baseX - cfg.width / 2,
        top: baseY,
        width: cfg.width,
        height: actualLength,
        transformOrigin: 'top center',
        transform: `rotate(${angle - 90 + thumbExtraAngle}deg)`,
        transition:
          'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), left 0.2s cubic-bezier(0.4, 0, 0.2, 1), top 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: active ? 6 : 2,
        opacity: active ? 1 : 0.7,
        willChange: 'transform, left, top',
      }}
    >
      {/* 手指主体 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: cfg.width / 2,
          background: bodyGradient,
          boxShadow: glow,
        }}
      />

      {/* 关节线 */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          top: jointY,
          height: 1.5,
          background: active
            ? 'rgba(124,58,237,0.6)'
            : 'rgba(110,125,165,0.4)',
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '18%',
          right: '18%',
          top: jointY - 2,
          height: 3,
          background: active
            ? 'rgba(124,58,237,0.3)'
            : 'rgba(110,125,165,0.25)',
          borderRadius: 2,
          filter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />

      {/* 指尖 */}
      <div
        style={{
          position: 'absolute',
          bottom: -cfg.width * 0.12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: cfg.width * 1.08,
          height: cfg.width * 0.55,
          borderRadius: '50%',
          background: tipGradient,
          boxShadow: active
            ? '0 0 10px rgba(0,212,255,0.8), 0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.25)',
          zIndex: 2,
        }}
      />

      {/* 指甲 */}
      <div
        style={{
          position: 'absolute',
          bottom: cfg.width * 0.08,
          left: '50%',
          transform: 'translateX(-50%)',
          width: cfg.width * 0.6,
          height: cfg.width * 0.4,
          borderRadius: '50% 50% 40% 40%',
          background: nailGradient,
          opacity: 0.9,
          zIndex: 3,
        }}
      />
    </div>
  );
}

interface HandGroupProps {
  hand: Hand;
  targetFinger: Finger | null;
  tX: number | null;
  tY: number | null;
  kbW: number;
  kbH: number;
}

function HandGroup({ hand, targetFinger, tX, tY, kbW, kbH }: HandGroupProps) {
  const isLeft = hand === 'left';
  const fingers: Finger[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];

  const homeKeys: Record<Finger, string> = isLeft
    ? { pinky: 'a', ring: 's', middle: 'd', index: 'f', thumb: ' ' }
    : { pinky: ';', ring: 'l', middle: 'k', index: 'j', thumb: ' ' };

  const palmCx = isLeft ? kbW * 0.22 : kbW * 0.78;
  const palmCy = -kbH * 0.05;

  const [pressedFinger, setPressedFinger] = useState<Finger | null>(null);

  useEffect(() => {
    if (targetFinger) {
      setPressedFinger(targetFinger);
      const t = window.setTimeout(() => setPressedFinger(null), 160);
      return () => window.clearTimeout(t);
    }
  }, [targetFinger]);

  const getBaseX = (f: Finger): number => {
    if (f === 'thumb') {
      return isLeft ? palmCx + 58 : palmCx - 58;
    }
    const order: Finger[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];
    const idx = order.indexOf(f);
    const spacing = 18;
    return palmCx + (idx - 1.5) * spacing * (isLeft ? 1 : -1);
  };

  const getBaseY = (f: Finger): number => {
    if (f === 'thumb') return palmCy + 20;
    return palmCy + 30;
  };

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Palm cx={palmCx} cy={palmCy} isLeft={isLeft} />

      {fingers.map((f) => {
        const { x: hx, y: hy } = getKeyCenter(homeKeys[f], kbW, kbH);
        const isTarget = targetFinger === f;
        const tipX = isTarget && tX !== null ? tX : hx;
        const tipY = isTarget && tY !== null ? tY : hy;

        return (
          <SingleFinger
            key={f}
            hand={hand}
            finger={f}
            baseX={getBaseX(f)}
            baseY={getBaseY(f)}
            tipX={tipX}
            tipY={tipY}
            active={isTarget}
            pressed={pressedFinger === f}
          />
        );
      })}
    </div>
  );
}

const VirtualHandsGuide: React.FC<VirtualHandsGuideProps> = ({
  visible,
  targetKey,
  keyboardWidth = 960,
  height = 280,
}) => {
  const kbH = height * 0.45;

  const { finger: tFinger, x: tX, y: tY, hand: tHand } = useMemo(() => {
    if (!targetKey) return { finger: null, x: null, y: null, hand: null as Hand | null };
    const fg = getFingering(targetKey);
    if (!fg) return { finger: null, x: null, y: null, hand: null as Hand | null };

    if (targetKey === ' ' || targetKey === 'Space') {
      const sx = keyboardWidth * 0.5 + (fg.hand === 'left' ? -keyboardWidth * 0.1 : keyboardWidth * 0.1);
      const sy = kbH - kbH / ROW_COUNT * 0.6;
      return { finger: fg.finger, x: sx, y: sy, hand: fg.hand };
    }

    const pos = KEY_POSITIONS[targetKey.toLowerCase()];
    if (!pos) return { finger: null, x: null, y: null, hand: null as Hand | null };

    const { x, y } = getKeyCenter(targetKey, keyboardWidth, kbH);
    return { finger: fg.finger, x, y, hand: fg.hand };
  }, [targetKey, keyboardWidth, kbH]);

  if (!visible) return null;

  return (
    <div
      className="w-full pointer-events-none select-none"
      style={{
        height,
        position: 'relative',
        overflow: 'visible',
        perspective: 1000,
        perspectiveOrigin: '50% 50%',
      }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(22deg)',
        }}
      >
        <HandGroup
          hand="left"
          targetFinger={tHand === 'left' ? tFinger : null}
          tX={tHand === 'left' ? tX : null}
          tY={tHand === 'left' ? tY : null}
          kbW={keyboardWidth}
          kbH={kbH}
        />
        <HandGroup
          hand="right"
          targetFinger={tHand === 'right' ? tFinger : null}
          tX={tHand === 'right' ? tX : null}
          tY={tHand === 'right' ? tY : null}
          kbW={keyboardWidth}
          kbH={kbH}
        />
      </div>
    </div>
  );
};

export default VirtualHandsGuide;
