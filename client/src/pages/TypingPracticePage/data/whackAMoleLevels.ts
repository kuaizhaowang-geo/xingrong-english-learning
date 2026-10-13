export interface LevelConfig {
  name: string;
  charSet: string;
  stayDuration: number;
  spawnInterval: number;
  maxMoles: number;
  passScore: number;
  description: string;
}

// 6 levels
export const LEVELS: LevelConfig[] = [
  {
    name: '第1关：基准键',
    charSet: 'homeRow',
    stayDuration: 2500,
    spawnInterval: 1800,
    maxMoles: 1,
    passScore: 100,
    description: 'A S D F J K L ; — 慢',
  },
  {
    name: '第2关：A-N',
    charSet: 'a2n',
    stayDuration: 2000,
    spawnInterval: 1400,
    maxMoles: 1,
    passScore: 200,
    description: 'A-N 14个字母 — 中速',
  },
  {
    name: '第3关：全字母',
    charSet: 'fullAlpha',
    stayDuration: 1700,
    spawnInterval: 1100,
    maxMoles: 2,
    passScore: 350,
    description: 'A-Z 26字母 — 快',
  },
  {
    name: '第4关：字母+数字',
    charSet: 'alphaNum',
    stayDuration: 1400,
    spawnInterval: 900,
    maxMoles: 2,
    passScore: 500,
    description: 'A-Z + 0-9 — 很快',
  },
  {
    name: '第5关：符号挑战',
    charSet: 'symbols',
    stayDuration: 1100,
    spawnInterval: 700,
    maxMoles: 3,
    passScore: 700,
    description: '字母 + 数字 + 符号 — 极快',
  },
  {
    name: '第6关：无尽模式',
    charSet: 'endless',
    stayDuration: 1200,
    spawnInterval: 800,
    maxMoles: 3,
    passScore: 999999,
    description: '越来越快，挑战最高分',
  },
];

const CHAR_SETS: Record<string, string[]> = {
  homeRow: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
  a2n: 'abcdefghijklmn'.split(''),
  fullAlpha: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  alphaNum: 'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
  symbols: 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%'.split(''),
  endless: 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'.split(''),
};

/**
 * Get available characters for a level
 * @param levelIndex 0-indexed level
 * @param speedTier for endless mode, higher = more chars gradually
 */
export function getLevelChars(levelIndex: number, speedTier: number = 0): string[] {
  const level = LEVELS[levelIndex];
  const base = CHAR_SETS[level.charSet];
  if (!base) return CHAR_SETS.fullAlpha;

  // Endless mode: gradually unlock more symbols with speed tiers
  if (levelIndex === LEVELS.length - 1) {
    // Start with full alpha + digits, add symbols progressively
    const alphaNum = CHAR_SETS.alphaNum;
    const allSymbols = '!@#$%^&*()'.split('');
    const symbolCount = Math.min(allSymbols.length, Math.floor(speedTier / 2) + 2);
    return [...alphaNum, ...allSymbols.slice(0, symbolCount)];
  }

  return base;
}
