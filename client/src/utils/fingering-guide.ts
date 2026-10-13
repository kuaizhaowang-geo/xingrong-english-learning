// QWERTY 键盘 → 左右手 + 手指 映射表
// 用于虚拟双手指法引导动画

export type Hand = 'left' | 'right';

export type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

export interface Fingering {
  hand: Hand;
  finger: Finger;
}

// 左手小指
const LEFT_PINKY = new Set([
  'a', 'q', 'z', '1', '`', '~',
  'Tab', 'CapsLock', 'Shift',
]);

// 左手无名指
const LEFT_RING = new Set(['s', 'w', 'x', '2', '@']);

// 左手中指
const LEFT_MIDDLE = new Set(['d', 'e', 'c', '3', '#']);

// 左手食指
const LEFT_INDEX = new Set([
  'f', 'r', 'v', '4', '$',
  'g', 't', 'b', '5', '%',
]);

// 右手食指
const RIGHT_INDEX = new Set([
  'j', 'u', 'm', '7', '&',
  'h', 'y', 'n', '6', '^',
]);

// 右手中指
const RIGHT_MIDDLE = new Set(['k', 'i', ',', '8', '*', '<']);

// 右手无名指
const RIGHT_RING = new Set(['l', 'o', '.', '9', '(', '>']);

// 右手小指
const RIGHT_PINKY = new Set([
  ';', 'p', '/', '0', ')',
  "'", '[', ']', '\\', '-', '=',
  'Enter', 'Backspace', ':', '"',
  '{', '}', '|', '_', '+',
  '?',
]);

// 拇指（空格）
const THUMB = new Set([' ', 'Space']);

const FINGER_MAP: { keys: Set<string>; fingering: Fingering }[] = [
  { keys: LEFT_PINKY,  fingering: { hand: 'left',  finger: 'pinky'  } },
  { keys: LEFT_RING,   fingering: { hand: 'left',  finger: 'ring'   } },
  { keys: LEFT_MIDDLE, fingering: { hand: 'left',  finger: 'middle' } },
  { keys: LEFT_INDEX,  fingering: { hand: 'left',  finger: 'index'  } },
  { keys: RIGHT_INDEX, fingering: { hand: 'right', finger: 'index'  } },
  { keys: RIGHT_MIDDLE,fingering: { hand: 'right', finger: 'middle' } },
  { keys: RIGHT_RING,  fingering: { hand: 'right', finger: 'ring'   } },
  { keys: RIGHT_PINKY, fingering: { hand: 'right', finger: 'pinky'  } },
  { keys: THUMB,       fingering: { hand: 'right', finger: 'thumb'  } },
];

/**
 * 获取指定按键对应的指法（手 + 手指）
 * @param key 按键值（小写字母或特殊键名如 'Enter', 'Backspace', ' '）
 * @returns 指法信息，找不到返回 null（通常是空格以外的特殊键）
 */
export function getFingering(key: string): Fingering | null {
  if (!key) return null;
  const lower = key.length === 1 ? key.toLowerCase() : key;

  for (const entry of FINGER_MAP) {
    if (entry.keys.has(lower)) {
      return entry.fingering;
    }
  }
  return null;
}

/**
 * 左右手各 5 根手指的顺序（从外到内：小指→拇指）
 */
export const FINGER_ORDER_LEFT: Finger[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];
export const FINGER_ORDER_RIGHT: Finger[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];

/**
 * 基准键位（home row）映射
 */
export const HOME_KEYS: Record<string, string> = {
  'left-pinky':  'a',
  'left-ring':   's',
  'left-middle': 'd',
  'left-index':  'f',
  'right-index': 'j',
  'right-middle':'k',
  'right-ring':  'l',
  'right-pinky': ';',
  'right-thumb': ' ',
  'left-thumb':  ' ',
};

/**
 * 获取基准键位
 */
export function getHomeKey(hand: Hand, finger: Finger): string {
  return HOME_KEYS[`${hand}-${finger}`] || '';
}
