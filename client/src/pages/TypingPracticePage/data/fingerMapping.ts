// 手指分区映射数据
// 每个字符对应的手指和手，以及对应的霓虹颜色

export type FingerKey =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'thumb';

export type HandSide = 'left' | 'right';

export interface FingerInfo {
  finger: FingerKey;
  hand: HandSide;
}

// 手指分区定义（标准指法）
// 左手：小指 QAZ1、无名指 WSX2、中指 EDC3、食指 RT FVGB 45
// 右手：食指 YU HJ NM 67、中指 IK,8、无名指 OL.9、小指 P;/0
// 大拇指：空格

const LEFT_PINKY = ['q', 'a', 'z', '1', '`', '~', '!'];
const LEFT_RING = ['w', 's', 'x', '2', '@'];
const LEFT_MIDDLE = ['e', 'd', 'c', '3', '#'];
const LEFT_INDEX = [
  'r', 't', 'f', 'g', 'v', 'b',
  '4', '5', '$', '%',
];
const RIGHT_INDEX = [
  'y', 'u', 'h', 'j', 'n', 'm',
  '6', '7', '^', '&',
];
const RIGHT_MIDDLE = ['i', 'k', ',', '8', '*', '<'];
const RIGHT_RING = ['o', 'l', '.', '9', '(', '>'];
const RIGHT_PINKY = [
  'p', ';', '/', '0',
  "'", '"', ':', '?', ')', '-', '_', '=', '+',
  '[', ']', '{', '}', '\\', '|',
  'Backspace', 'Enter',
];
const THUMB = [' '];

function buildFingerMap(
  chars: string[],
  finger: FingerKey,
  hand: HandSide,
): Record<string, FingerInfo> {
  const map: Record<string, FingerInfo> = {};
  for (const ch of chars) {
    map[ch] = { finger, hand };
  }
  return map;
}

export const FINGER_MAP: Record<string, FingerInfo> = {
  ...buildFingerMap(LEFT_PINKY, 'left-pinky', 'left'),
  ...buildFingerMap(LEFT_RING, 'left-ring', 'left'),
  ...buildFingerMap(LEFT_MIDDLE, 'left-middle', 'left'),
  ...buildFingerMap(LEFT_INDEX, 'left-index', 'left'),
  ...buildFingerMap(RIGHT_INDEX, 'right-index', 'right'),
  ...buildFingerMap(RIGHT_MIDDLE, 'right-middle', 'right'),
  ...buildFingerMap(RIGHT_RING, 'right-ring', 'right'),
  ...buildFingerMap(RIGHT_PINKY, 'right-pinky', 'right'),
  ...buildFingerMap(THUMB, 'thumb', 'left'),
};

// 手指中文标签（完整名称）
export const FINGER_LABELS: Record<FingerKey, string> = {
  'left-pinky': '左小指',
  'left-ring': '左无名指',
  'left-middle': '左中指',
  'left-index': '左食指',
  'right-index': '右食指',
  'right-middle': '右中指',
  'right-ring': '右无名指',
  'right-pinky': '右小指',
  thumb: '大拇指',
};

// 手指短标签
export const FINGER_LABELS_SHORT: Record<FingerKey, string> = {
  'left-pinky': '左小',
  'left-ring': '左无',
  'left-middle': '左中',
  'left-index': '左食',
  'right-index': '右食',
  'right-middle': '右中',
  'right-ring': '右无',
  'right-pinky': '右小',
  thumb: '拇',
};

// 手指霓虹颜色（用于深色背景发光效果）
// 每个手指对应一个主色和一个淡色描边
export const FINGER_COLORS: Record<FingerKey, {
  neon: string;       // 主霓虹色（用于高亮发光）
  glow: string;       // 发光阴影色
  glowDim: string;    // 淡描边色
  bgTint: string;     // 淡淡底色（手指归属色）
}> = {
  'left-pinky': {
    neon: '#C084FC',
    glow: 'rgba(192, 132, 252, 0.6)',
    glowDim: 'rgba(192, 132, 252, 0.18)',
    bgTint: 'rgba(192, 132, 252, 0.06)',
  },
  'left-ring': {
    neon: '#60A5FA',
    glow: 'rgba(96, 165, 250, 0.6)',
    glowDim: 'rgba(96, 165, 250, 0.18)',
    bgTint: 'rgba(96, 165, 250, 0.06)',
  },
  'left-middle': {
    neon: '#34D399',
    glow: 'rgba(52, 211, 153, 0.6)',
    glowDim: 'rgba(52, 211, 153, 0.18)',
    bgTint: 'rgba(52, 211, 153, 0.06)',
  },
  'left-index': {
    neon: '#FB923C',
    glow: 'rgba(251, 146, 60, 0.6)',
    glowDim: 'rgba(251, 146, 60, 0.18)',
    bgTint: 'rgba(251, 146, 60, 0.06)',
  },
  'right-index': {
    neon: '#F472B6',
    glow: 'rgba(244, 114, 182, 0.6)',
    glowDim: 'rgba(244, 114, 182, 0.18)',
    bgTint: 'rgba(244, 114, 182, 0.06)',
  },
  'right-middle': {
    neon: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.6)',
    glowDim: 'rgba(34, 211, 238, 0.18)',
    bgTint: 'rgba(34, 211, 238, 0.06)',
  },
  'right-ring': {
    neon: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.6)',
    glowDim: 'rgba(56, 189, 248, 0.18)',
    bgTint: 'rgba(56, 189, 248, 0.06)',
  },
  'right-pinky': {
    neon: '#A78BFA',
    glow: 'rgba(167, 139, 250, 0.6)',
    glowDim: 'rgba(167, 139, 250, 0.18)',
    bgTint: 'rgba(167, 139, 250, 0.06)',
  },
  thumb: {
    neon: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.5)',
    glowDim: 'rgba(148, 163, 184, 0.12)',
    bgTint: 'rgba(148, 163, 184, 0.05)',
  },
};

// 获取字符的手指信息，找不到时返回 thumb 作为 fallback
export function getFingerInfo(char: string): FingerInfo {
  const lower = char.toLowerCase();
  return FINGER_MAP[lower] ?? FINGER_MAP[char] ?? { finger: 'thumb', hand: 'left' };
}

// 获取字符所属的手指 key
export function getFingerKey(char: string): FingerKey {
  return getFingerInfo(char).finger;
}

// 判断两个字符是否属于同一手指区域
export function isSameFinger(charA: string, charB: string): boolean {
  return getFingerKey(charA) === getFingerKey(charB);
}

// 指法分区课程：按手指分别练习
export interface FingerCourse {
  id: string;
  finger: FingerKey;
  name: string;
  description: string;
  letters: string[];
  practiceContent: string[]; // 练习内容（单词组合）
}

export const FINGER_COURSES: FingerCourse[] = [
  {
    id: 'left-pinky',
    finger: 'left-pinky',
    name: '左小指基础',
    description: '练习左小指管辖的 Q A Z 键',
    letters: ['q', 'a', 'z'],
    practiceContent: [
      'qaq', 'aza', 'zaz', 'qaz', 'zaq',
      'aqa', 'qza', 'azq', 'qaa', 'zza',
      'qaaz', 'zaaq', 'aqza', 'zqaq',
    ],
  },
  {
    id: 'left-ring',
    finger: 'left-ring',
    name: '左无名指基础',
    description: '练习左无名指管辖的 W S X 键',
    letters: ['w', 's', 'x'],
    practiceContent: [
      'www', 'sss', 'xxx', 'wsx', 'xsw',
      'sws', 'wxw', 'sxs', 'wssx', 'xsww',
      'wsxw', 'swxs', 'xwsx',
    ],
  },
  {
    id: 'left-middle',
    finger: 'left-middle',
    name: '左中指基础',
    description: '练习左中指管辖的 E D C 键',
    letters: ['e', 'd', 'c'],
    practiceContent: [
      'eee', 'ddd', 'ccc', 'edc', 'cde',
      'ded', 'ece', 'dcd', 'edce', 'cede',
      'ecde', 'decd', 'cedc',
    ],
  },
  {
    id: 'left-index',
    finger: 'left-index',
    name: '左食指基础',
    description: '练习左食指管辖的 R T F G V B 键',
    letters: ['r', 't', 'f', 'g', 'v', 'b'],
    practiceContent: [
      'rft', 'fgt', 'rvb', 'bgf', 'trf',
      'fgvb', 'bvgf', 'rftg', 'gtfr', 'vbrt',
      'rfv', 'tgb', 'fvr', 'gbt', 'rgtf',
    ],
  },
  {
    id: 'right-index',
    finger: 'right-index',
    name: '右食指基础',
    description: '练习右食指管辖的 Y U H J N M 键',
    letters: ['y', 'u', 'h', 'j', 'n', 'm'],
    practiceContent: [
      'yuh', 'jnh', 'ymu', 'hnj', 'uyh',
      'hjum', 'mujy', 'yhjn', 'njhy', 'myun',
      'yhn', 'ujm', 'hny', 'jmu', 'yjum',
    ],
  },
  {
    id: 'right-middle',
    finger: 'right-middle',
    name: '右中指基础',
    description: '练习右中指管辖的 I K 键',
    letters: ['i', 'k'],
    practiceContent: [
      'iki', 'kik', 'iik', 'kki', 'ikik',
      'kiik', 'iikk', 'kkii', 'ikkk', 'kiii',
    ],
  },
  {
    id: 'right-ring',
    finger: 'right-ring',
    name: '右无名指基础',
    description: '练习右无名指管辖的 O L 键',
    letters: ['o', 'l'],
    practiceContent: [
      'olo', 'lol', 'ool', 'llo', 'olol',
      'lool', 'ooll', 'lloo', 'olll', 'looo',
    ],
  },
  {
    id: 'right-pinky',
    finger: 'right-pinky',
    name: '右小指基础',
    description: '练习右小指管辖的 P 键',
    letters: ['p'],
    practiceContent: [
      'ppp', 'pppp', 'ppppp', 'pppppp',
    ],
  },
];
