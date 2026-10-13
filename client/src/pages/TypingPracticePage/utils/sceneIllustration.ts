// Deterministic scene illustration generator using course id as seed.
// Produces SVG-style decorative scenes composed of simple shapes.

// Simple hash function from a string id
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Simple LCG pseudo-random generator seeded from hash
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export interface SceneShape {
  type: 'circle' | 'triangle' | 'rect' | 'star';
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  opacity: number;
}

export interface SceneData {
  bgGradient: [string, string];
  shapes: SceneShape[];
  accentColor: string;
}

const NEON_PALETTES: Array<[string, string, string]> = [
  ['#7C3AED', '#3B82F6', '#22D3EE'], // purple → blue → cyan
  ['#EC4899', '#7C3AED', '#22D3EE'], // pink → purple → cyan
  ['#3B82F6', '#06B6D4', '#22C55E'], // blue → teal → green
  ['#8B5CF6', '#EC4899', '#F97316'], // violet → pink → orange
  ['#0EA5E9', '#6366F1', '#A855F7'], // sky → indigo → purple
  ['#14B8A6', '#0EA5E9', '#6366F1'], // teal → sky → indigo
  ['#F472B6', '#A78BFA', '#60A5FA'], // pink → lavender → blue
  ['#F59E0B', '#EF4444', '#EC4899'], // amber → red → pink
];

export function generateScene(courseId: string): SceneData {
  const seed = hashString(courseId);
  const rng = makeRng(seed);
  const palette = NEON_PALETTES[Math.floor(rng() * NEON_PALETTES.length)];
  const [c1, c2, c3] = palette;

  const shapes: SceneShape[] = [];
  const shapeCount = 6 + Math.floor(rng() * 5); // 6-10 shapes
  const types: SceneShape['type'][] = ['circle', 'triangle', 'rect', 'star'];

  for (let i = 0; i < shapeCount; i += 1) {
    const t = types[Math.floor(rng() * types.length)];
    const colorIdx = Math.floor(rng() * 3);
    const color = colorIdx === 0 ? c1 : colorIdx === 1 ? c2 : c3;
    shapes.push({
      type: t,
      x: 5 + rng() * 90, // percent
      y: 15 + rng() * 70, // percent
      size: 20 + rng() * 60, // px
      color,
      rotation: rng() * 360,
      opacity: 0.25 + rng() * 0.5,
    });
  }

  // Sort by size for depth - smaller in front
  shapes.sort((a, b) => b.size - a.size);

  return {
    bgGradient: [c1, c2],
    shapes,
    accentColor: c3,
  };
}
