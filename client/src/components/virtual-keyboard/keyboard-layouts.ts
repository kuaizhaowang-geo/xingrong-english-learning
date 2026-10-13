// 虚拟键盘布局定义
// 三套布局：英文 QWERTY、拼音、数字

export type FingerSide =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'
  | 'thumb';

export interface KeyDefinition {
  label: string;         // 显示字符
  value: string;         // 输入值（小写/实际值）
  shiftValue?: string;   // 按下 shift 时的值
  keyCode?: string;      // 对应物理键盘 event.code
  width?: number;        // 宽度倍数，默认1
  finger?: FingerSide;   // 负责手指
  row: number;           // 所在行
  col: number;           // 所在列
  isSpecial?: boolean;   // 是否功能键
  specialType?: 'space' | 'backspace' | 'enter' | 'shift' | 'caps' | 'tone';
}

export type KeyboardLayout = KeyDefinition[][];

// ─── 手指颜色（hex，用于背景/边框） ──────────────────────────────────

export const FINGER_COLORS: Record<FingerSide, { main: string; light: string; label: string }> = {
  'l-pinky':  { main: '#9333EA', light: '#F3E8FF', label: '左小' },
  'l-ring':   { main: '#2563EB', light: '#DBEAFE', label: '左无' },
  'l-middle': { main: '#059669', light: '#D1FAE5', label: '左中' },
  'l-index':  { main: '#F97316', light: '#FFEDD5', label: '左食' },
  'r-index':  { main: '#EA580C', light: '#FFEDD5', label: '右食' },
  'r-middle': { main: '#0D9488', light: '#CCFBF1', label: '右中' },
  'r-ring':   { main: '#3B82F6', light: '#DBEAFE', label: '右无' },
  'r-pinky':  { main: '#7C3AED', light: '#EDE9FE', label: '右小' },
  thumb:      { main: '#6B7280', light: '#F3F4F6', label: '拇指' },
};

// ─── 霓虹主题手指颜色（深色背景下的霓虹发光） ────────────────────

export const FINGER_COLORS_NEON: Record<FingerSide, { neon: string; glow: string; glowDim: string; bgActive: string; label: string }> = {
  'l-pinky':  { neon: '#c084fc', glow: 'rgba(192,132,252,0.6)', glowDim: 'rgba(192,132,252,0.15)', bgActive: '#3b0764', label: '左小' },
  'l-ring':   { neon: '#60a5fa', glow: 'rgba(96,165,250,0.6)',  glowDim: 'rgba(96,165,250,0.15)',  bgActive: '#1e3a8a', label: '左无' },
  'l-middle': { neon: '#34d399', glow: 'rgba(52,211,153,0.6)',  glowDim: 'rgba(52,211,153,0.15)',  bgActive: '#064e3b', label: '左中' },
  'l-index':  { neon: '#fb923c', glow: 'rgba(251,146,60,0.6)',  glowDim: 'rgba(251,146,60,0.15)',  bgActive: '#431407', label: '左食' },
  'r-index':  { neon: '#f472b6', glow: 'rgba(244,114,182,0.6)', glowDim: 'rgba(244,114,182,0.15)', bgActive: '#500724', label: '右食' },
  'r-middle': { neon: '#22d3ee', glow: 'rgba(34,211,238,0.6)',  glowDim: 'rgba(34,211,238,0.15)',  bgActive: '#083344', label: '右中' },
  'r-ring':   { neon: '#38bdf8', glow: 'rgba(56,189,248,0.6)',  glowDim: 'rgba(56,189,248,0.15)',  bgActive: '#0c4a6e', label: '右无' },
  'r-pinky':  { neon: '#a78bfa', glow: 'rgba(167,139,250,0.6)', glowDim: 'rgba(167,139,250,0.15)', bgActive: '#312e81', label: '右小' },
  thumb:      { neon: '#94a3b8', glow: 'rgba(148,163,184,0.5)', glowDim: 'rgba(148,163,184,0.12)', bgActive: '#1e293b', label: '拇指' },
};

// ─── 工具函数：生成一行按键 ─────────────────────────────────────────

function buildRow(
  keys: Array<Omit<KeyDefinition, 'row' | 'col'>>,
  rowIndex: number,
): KeyDefinition[] {
  let col = 0;
  return keys.map((k) => {
    const keyDef: KeyDefinition = { ...k, row: rowIndex, col };
    col += k.width ?? 1;
    return keyDef;
  });
}

// ─── 英文 QWERTY 键盘 ─────────────────────────────────────────────

const qwertyRow0 = buildRow([
  { label: '`',  value: '`',  shiftValue: '~', keyCode: 'Backquote',   finger: 'l-pinky' },
  { label: '1',  value: '1',  shiftValue: '!', keyCode: 'Digit1',      finger: 'l-pinky' },
  { label: '2',  value: '2',  shiftValue: '@', keyCode: 'Digit2',      finger: 'l-ring' },
  { label: '3',  value: '3',  shiftValue: '#', keyCode: 'Digit3',      finger: 'l-middle' },
  { label: '4',  value: '4',  shiftValue: '$', keyCode: 'Digit4',      finger: 'l-index' },
  { label: '5',  value: '5',  shiftValue: '%', keyCode: 'Digit5',      finger: 'l-index' },
  { label: '6',  value: '6',  shiftValue: '^', keyCode: 'Digit6',      finger: 'r-index' },
  { label: '7',  value: '7',  shiftValue: '&', keyCode: 'Digit7',      finger: 'r-index' },
  { label: '8',  value: '8',  shiftValue: '*', keyCode: 'Digit8',      finger: 'r-middle' },
  { label: '9',  value: '9',  shiftValue: '(', keyCode: 'Digit9',      finger: 'r-ring' },
  { label: '0',  value: '0',  shiftValue: ')', keyCode: 'Digit0',      finger: 'r-pinky' },
  { label: '-',  value: '-',  shiftValue: '_', keyCode: 'Minus',       finger: 'r-pinky' },
  { label: '=',  value: '=',  shiftValue: '+', keyCode: 'Equal',       finger: 'r-pinky' },
  { label: '⌫',  value: 'Backspace', keyCode: 'Backspace', finger: 'r-pinky', width: 1.8, isSpecial: true, specialType: 'backspace' },
], 0);

const qwertyRow1 = buildRow([
  { label: 'Tab', value: 'Tab', keyCode: 'Tab', finger: 'l-pinky', width: 1.5, isSpecial: true },
  { label: 'Q', value: 'q', keyCode: 'KeyQ', finger: 'l-pinky' },
  { label: 'W', value: 'w', keyCode: 'KeyW', finger: 'l-ring' },
  { label: 'E', value: 'e', keyCode: 'KeyE', finger: 'l-middle' },
  { label: 'R', value: 'r', keyCode: 'KeyR', finger: 'l-index' },
  { label: 'T', value: 't', keyCode: 'KeyT', finger: 'l-index' },
  { label: 'Y', value: 'y', keyCode: 'KeyY', finger: 'r-index' },
  { label: 'U', value: 'u', keyCode: 'KeyU', finger: 'r-index' },
  { label: 'I', value: 'i', keyCode: 'KeyI', finger: 'r-middle' },
  { label: 'O', value: 'o', keyCode: 'KeyO', finger: 'r-ring' },
  { label: 'P', value: 'p', keyCode: 'KeyP', finger: 'r-pinky' },
  { label: '[', value: '[', shiftValue: '{', keyCode: 'BracketLeft',  finger: 'r-pinky' },
  { label: ']', value: ']', shiftValue: '}', keyCode: 'BracketRight', finger: 'r-pinky' },
  { label: '\\', value: '\\', shiftValue: '|', keyCode: 'Backslash', finger: 'r-pinky', width: 1.3 },
], 1);

const qwertyRow2 = buildRow([
  { label: 'Caps', value: 'CapsLock', keyCode: 'CapsLock', finger: 'l-pinky', width: 1.8, isSpecial: true, specialType: 'caps' },
  { label: 'A', value: 'a', keyCode: 'KeyA', finger: 'l-pinky' },
  { label: 'S', value: 's', keyCode: 'KeyS', finger: 'l-ring' },
  { label: 'D', value: 'd', keyCode: 'KeyD', finger: 'l-middle' },
  { label: 'F', value: 'f', keyCode: 'KeyF', finger: 'l-index' },
  { label: 'G', value: 'g', keyCode: 'KeyG', finger: 'l-index' },
  { label: 'H', value: 'h', keyCode: 'KeyH', finger: 'r-index' },
  { label: 'J', value: 'j', keyCode: 'KeyJ', finger: 'r-index' },
  { label: 'K', value: 'k', keyCode: 'KeyK', finger: 'r-middle' },
  { label: 'L', value: 'l', keyCode: 'KeyL', finger: 'r-ring' },
  { label: ';', value: ';', shiftValue: ':', keyCode: 'Semicolon', finger: 'r-pinky' },
  { label: "'", value: "'", shiftValue: '"', keyCode: 'Quote', finger: 'r-pinky' },
  { label: 'Enter', value: 'Enter', keyCode: 'Enter', finger: 'r-pinky', width: 2.2, isSpecial: true, specialType: 'enter' },
], 2);

const qwertyRow3 = buildRow([
  { label: 'Shift', value: 'Shift', keyCode: 'ShiftLeft',  finger: 'l-pinky', width: 2.5, isSpecial: true, specialType: 'shift' },
  { label: 'Z', value: 'z', keyCode: 'KeyZ', finger: 'l-pinky' },
  { label: 'X', value: 'x', keyCode: 'KeyX', finger: 'l-ring' },
  { label: 'C', value: 'c', keyCode: 'KeyC', finger: 'l-middle' },
  { label: 'V', value: 'v', keyCode: 'KeyV', finger: 'l-index' },
  { label: 'B', value: 'b', keyCode: 'KeyB', finger: 'l-index' },
  { label: 'N', value: 'n', keyCode: 'KeyN', finger: 'r-index' },
  { label: 'M', value: 'm', keyCode: 'KeyM', finger: 'r-index' },
  { label: ',', value: ',', shiftValue: '<', keyCode: 'Comma',  finger: 'r-middle' },
  { label: '.', value: '.', shiftValue: '>', keyCode: 'Period', finger: 'r-ring' },
  { label: '/', value: '/', shiftValue: '?', keyCode: 'Slash',  finger: 'r-pinky' },
  { label: 'Shift', value: 'Shift', keyCode: 'ShiftRight', finger: 'r-pinky', width: 3, isSpecial: true, specialType: 'shift' },
], 3);

const qwertyRow4 = buildRow([
  { label: '空格', value: ' ', keyCode: 'Space', finger: 'thumb', width: 7, isSpecial: true, specialType: 'space' },
], 4);

export const QWERTY_LAYOUT: KeyboardLayout = [
  qwertyRow0,
  qwertyRow1,
  qwertyRow2,
  qwertyRow3,
  qwertyRow4,
];

// ─── 拼音键盘 ────────────────────────────────────────────────────

const pinyinInitials = [
  'b','p','m','f','d','t','n','l',
  'g','k','h','j','q','x',
  'zh','ch','sh','r','z','c','s',
  'y','w',
];

const pinyinFinals = [
  'a','o','e','i','u','ü',
  'ai','ei','ui','ao','ou','iu','ie','üe','er',
  'an','en','in','un','ün',
  'ang','eng','ing','ong',
];

// 拼音键盘布局：声母行 + 韵母行 + 声调/功能行
const pinyinRow0 = buildRow(
  pinyinInitials.map((s, i) => {
    // 给声母分配手指（简化：按位置分配）
    const total = pinyinInitials.length;
    const pos = i / total;
    let finger: FingerSide = 'l-index';
    if (pos < 0.15) finger = 'l-pinky';
    else if (pos < 0.3) finger = 'l-ring';
    else if (pos < 0.45) finger = 'l-middle';
    else if (pos < 0.55) finger = 'l-index';
    else if (pos < 0.65) finger = 'r-index';
    else if (pos < 0.8) finger = 'r-middle';
    else if (pos < 0.92) finger = 'r-ring';
    else finger = 'r-pinky';
    return {
      label: s,
      value: s,
      keyCode: undefined,
      finger,
      width: s.length > 1 ? 1.3 : 1,
    };
  }),
  0,
);

const pinyinRow1 = buildRow(
  pinyinFinals.map((s, i) => {
    const total = pinyinFinals.length;
    const pos = i / total;
    let finger: FingerSide = 'r-index';
    if (pos < 0.15) finger = 'l-pinky';
    else if (pos < 0.3) finger = 'l-ring';
    else if (pos < 0.45) finger = 'l-middle';
    else if (pos < 0.55) finger = 'l-index';
    else if (pos < 0.65) finger = 'r-index';
    else if (pos < 0.8) finger = 'r-middle';
    else if (pos < 0.92) finger = 'r-ring';
    else finger = 'r-pinky';
    return {
      label: s,
      value: s,
      keyCode: undefined,
      finger,
      width: s.length > 1 ? 1.3 : 1,
    };
  }),
  1,
);

const pinyinRow2 = buildRow([
  { label: 'ˉ', value: '1', finger: 'l-pinky',  isSpecial: true, specialType: 'tone' },
  { label: 'ˊ', value: '2', finger: 'l-ring',   isSpecial: true, specialType: 'tone' },
  { label: 'ˇ', value: '3', finger: 'l-middle', isSpecial: true, specialType: 'tone' },
  { label: 'ˋ', value: '4', finger: 'r-middle', isSpecial: true, specialType: 'tone' },
  { label: '·', value: '5', finger: 'r-ring',   isSpecial: true, specialType: 'tone' },
  { label: '⌫', value: 'Backspace', finger: 'r-pinky', width: 1.8, isSpecial: true, specialType: 'backspace' },
  { label: '空格', value: ' ', finger: 'thumb', width: 5, isSpecial: true, specialType: 'space' },
  { label: 'Enter', value: 'Enter', finger: 'r-pinky', width: 2, isSpecial: true, specialType: 'enter' },
], 2);

export const PINYIN_LAYOUT: KeyboardLayout = [
  pinyinRow0,
  pinyinRow1,
  pinyinRow2,
];

// ─── 数字键盘 ────────────────────────────────────────────────────

const numberRow0 = buildRow([
  { label: '7', value: '7', finger: 'l-index' },
  { label: '8', value: '8', finger: 'l-middle' },
  { label: '9', value: '9', finger: 'l-ring' },
], 0);

const numberRow1 = buildRow([
  { label: '4', value: '4', finger: 'l-index' },
  { label: '5', value: '5', finger: 'l-middle' },
  { label: '6', value: '6', finger: 'r-index' },
], 1);

const numberRow2 = buildRow([
  { label: '1', value: '1', finger: 'l-index' },
  { label: '2', value: '2', finger: 'l-middle' },
  { label: '3', value: '3', finger: 'r-index' },
], 2);

const numberRow3 = buildRow([
  { label: '⌫', value: 'Backspace', finger: 'l-pinky', isSpecial: true, specialType: 'backspace' },
  { label: '0', value: '0', finger: 'thumb' },
  { label: '=', value: '=', finger: 'r-ring', isSpecial: true },
  { label: '↵', value: 'Enter', keyCode: 'NumpadEnter', finger: 'r-pinky', isSpecial: true, specialType: 'enter', width: 1.2 },
], 3);

const numberRow4 = buildRow([
  { label: '+', value: '+', finger: 'r-index' },
  { label: '−', value: '-', finger: 'r-middle' },
  { label: '×', value: '*', finger: 'r-ring' },
  { label: '÷', value: '/', finger: 'r-pinky' },
], 4);

export const NUMBER_LAYOUT: KeyboardLayout = [
  numberRow0,
  numberRow1,
  numberRow2,
  numberRow3,
  numberRow4,
];

// ─── 布局 Map ────────────────────────────────────────────────────

export const KEYBOARD_LAYOUTS: Record<'qwerty' | 'pinyin' | 'number', KeyboardLayout> = {
  qwerty: QWERTY_LAYOUT,
  pinyin: PINYIN_LAYOUT,
  number: NUMBER_LAYOUT,
};

// ─── 辅助：按 value 查找按键定义 ──────────────────────────────────

export function findKeyByValue(
  layout: KeyboardLayout,
  value: string,
): KeyDefinition | undefined {
  const lower = value.toLowerCase();
  for (const row of layout) {
    for (const key of row) {
      if (key.value.toLowerCase() === lower) return key;
      if (key.shiftValue?.toLowerCase() === lower) return key;
    }
  }
  return undefined;
}

// ─── 辅助：按 keyCode 查找按键定义 ───────────────────────────────

export function findKeyByKeyCode(
  layout: KeyboardLayout,
  code: string,
): KeyDefinition | undefined {
  for (const row of layout) {
    for (const key of row) {
      if (key.keyCode === code) return key;
    }
  }
  return undefined;
}

// ─── 辅助：收集布局中可输入的字符键（排除空格/退格/回车/shift/caps） ──

function collectTypeableKeys(layout: KeyboardLayout): string[] {
  const keys: string[] = [];
  for (const row of layout) {
    for (const k of row) {
      // 功能键不参与输入高亮（tone 是拼音声调，属于可输入键）
      if (
        k.specialType === 'space' ||
        k.specialType === 'backspace' ||
        k.specialType === 'enter' ||
        k.specialType === 'shift' ||
        k.specialType === 'caps'
      ) {
        continue;
      }
      keys.push(k.value);
      if (k.shiftValue) keys.push(k.shiftValue);
    }
  }
  return keys;
}

// ─── 辅助：根据目标文本过滤布局，只保留用到的字符键 + 功能键 ─
// 阈值：目标覆盖超过 60% 的可输入键时，不过滤（避免键盘太空旷）

export function filterLayoutByTarget(
  layout: KeyboardLayout,
  target: string,
  layoutType: 'qwerty' | 'pinyin' | 'number',
  threshold = 0.6,
): KeyboardLayout {
  if (!target || target.trim().length === 0) return layout;

  const typeable = collectTypeableKeys(layout);
  const targetKeys = computeTypedKeys(layout, target);

  // 超过阈值则不过滤
  const ratio = targetKeys.size / typeable.length;
  if (ratio >= threshold) return layout;

  // 过滤：保留功能键 + 目标包含的字符键
  const filtered: KeyboardLayout = [];
  for (const row of layout) {
    const newRow: KeyDefinition[] = [];
    for (const k of row) {
      const isSpecial =
        k.specialType === 'space' ||
        k.specialType === 'backspace' ||
        k.specialType === 'enter' ||
        k.specialType === 'shift' ||
        k.specialType === 'caps' ||
        k.specialType === 'tone' ||
        k.value === 'Tab';
      if (isSpecial) {
        newRow.push(k);
        continue;
      }
      if (targetKeys.has(k.value)) {
        newRow.push(k);
        continue;
      }
      if (k.shiftValue && targetKeys.has(k.shiftValue)) {
        newRow.push(k);
        continue;
      }
      // 数字键与符号键：如果目标包含对应数字或 shift 值也保留
    }
    if (newRow.length > 0) {
      filtered.push(newRow);
    }
  }

  // 拼音布局可能需要保留声调行（tone 已经保留）
  // 重新计算每行的 col 位置（保持 flex 布局不需要 col，但为了 findKeyByKeyCode 等保留）
  const repositioned: KeyboardLayout = filtered.map((row) => {
    let col = 0;
    return row.map((k) => {
      const newK = { ...k, col };
      col += k.width ?? 1;
      return newK;
    });
  });

  return repositioned;
}

// ─── 辅助：根据 value 计算已输入的键值集合 ─────────────────────────
// qwerty/number: 每个字符是一个键，直接字符集合
// pinyin: 多字符键贪婪匹配扫描

export function computeTypedKeys(
  layout: KeyboardLayout,
  value: string,
): Set<string> {
  const result = new Set<string>();
  if (!value) return result;

  const typeable = collectTypeableKeys(layout);
  // 按长度从长到短排序，用于贪婪匹配
  const byLen = [...typeable].sort((a, b) => b.length - a.length);
  const maxLen = byLen.length > 0 ? byLen[0].length : 1;

  if (maxLen <= 1) {
    // 单字符布局：直接按字符集合
    const lower = value.toLowerCase();
    for (const ch of lower) {
      const keyDef = findKeyByValue(layout, ch);
      if (keyDef && !keyDef.isSpecial) {
        result.add(keyDef.value);
      }
    }
  } else {
    // 多字符布局（如拼音）：贪婪匹配扫描
    let i = 0;
    const lower = value.toLowerCase();
    while (i < lower.length) {
      let matched = false;
      for (const keyVal of byLen) {
        if (lower.startsWith(keyVal, i)) {
          result.add(keyVal);
          i += keyVal.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        i += 1; // 跳过无法匹配的字符
      }
    }
  }

  return result;
}

// ─── 辅助：计算下一个待输入的键值 ─────────────────────────────────
// 返回 key value（小写），找不到返回 null
// 会跳过空格、标点等不可输入字符，直接指向下一个可输入字母

export function computeNextKey(
  layout: KeyboardLayout,
  value: string,
  target: string,
): string | null {
  if (!target) return null;
  if (value.length >= target.length) return null;

  const remaining = target.slice(value.length);
  if (!remaining) return null;

  const typeable = collectTypeableKeys(layout);
  const byLen = [...typeable].sort((a, b) => b.length - a.length);
  const maxLen = byLen.length > 0 ? byLen[0].length : 1;
  const lower = remaining.toLowerCase();

  if (maxLen <= 1) {
    // 单字符布局：从当前位置往后找第一个可输入字符
    for (const ch of lower) {
      const keyDef = findKeyByValue(layout, ch);
      if (keyDef && !keyDef.isSpecial) return keyDef.value;
    }
    return null;
  }

  // 多字符布局（如拼音）：逐位跳过不可输入字符，贪婪匹配
  let i = 0;
  while (i < lower.length) {
    for (const keyVal of byLen) {
      if (lower.startsWith(keyVal, i)) {
        return keyVal;
      }
    }
    // 不可输入字符（空格/标点等），跳过一位继续找
    i += 1;
  }
  return null;
}
