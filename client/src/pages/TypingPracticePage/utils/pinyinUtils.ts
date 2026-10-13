// 拼音处理工具：去声调、匹配、汉字拼音查找等
import { CHINESE_CHARS } from '../data/typingData';

// 带声调的元音字母 → 无声调映射
const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v',
  Ā: 'A', Á: 'A', Ǎ: 'A', À: 'A',
  Ō: 'O', Ó: 'O', Ǒ: 'O', Ò: 'O',
  Ē: 'E', É: 'E', Ě: 'E', È: 'E',
  Ī: 'I', Í: 'I', Ǐ: 'I', Ì: 'I',
  Ū: 'U', Ú: 'U', Ǔ: 'U', Ù: 'U',
  Ǖ: 'V', Ǘ: 'V', Ǚ: 'V', Ǜ: 'V', Ü: 'V',
};

/**
 * 去除拼音字符串中的声调
 * @param pinyin 带声调的拼音，如 "nǐ hǎo"
 * @returns 无声调拼音，如 "ni hao"
 */
export function removeTones(pinyin: string): string {
  let result = '';
  for (const ch of pinyin) {
    result += TONE_MAP[ch] ?? ch;
  }
  return result;
}

/**
 * 判断字符是否是标点符号
 */
export function isPunctuation(char: string): boolean {
  return /[\u3000-\u303F\uff00-\uffef，。！？、；：""''（）《》【】…—·]/.test(char);
}

/**
 * 拼音匹配（忽略声调、忽略大小写）
 * @param input 用户输入
 * @param target 目标拼音（带声调）
 * @returns 是否匹配
 */
export function pinyinMatch(input: string, target: string): boolean {
  return removeTones(input).toLowerCase() === removeTones(target).toLowerCase();
}

/**
 * 逐字符比较输入与目标
 * 返回每个位置的状态：correct / wrong / pending
 */
export function compareInput(input: string, target: string): Array<'correct' | 'wrong' | 'pending'> {
  const result: Array<'correct' | 'wrong' | 'pending'> = [];
  for (let i = 0; i < target.length; i += 1) {
    if (i >= input.length) {
      result.push('pending');
    } else if (input[i].toLowerCase() === target[i].toLowerCase()) {
      result.push('correct');
    } else {
      result.push('wrong');
    }
  }
  return result;
}

/**
 * 获取中文句子中每个字符对应的目标拼音（带声调）
 * 如果是标点符号，返回标点本身
 */
export function getCharTarget(char: string, pinyin: string): string {
  if (isPunctuation(char)) return char;
  return removeTones(pinyin).toLowerCase();
}

/**
 * 构建中文内容项列表，每个项包含：显示的汉字、对应的拼音（去声调）、是否是标点
 */
export interface CharItem {
  char: string;
  pinyin: string; // 带声调的原始拼音
  target: string; // 去声调低后的目标输入
  isPunctuation: boolean;
}

export function buildCharItems(chars: string[], pinyinList: string[]): CharItem[] {
  const items: CharItem[] = [];
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const py = pinyinList[i] ?? '';
    const isPunc = isPunctuation(char);
    items.push({
      char,
      pinyin: py,
      target: isPunc ? char : removeTones(py).toLowerCase(),
      isPunctuation: isPunc,
    });
  }
  return items;
}

/**
 * 计算打字速度（字/分钟）
 * @param charCount 字符数
 * @param seconds 秒数
 */
export function calcSpeed(charCount: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round(charCount / (seconds / 60));
}

/**
 * 计算正确率
 */
export function calcAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((correct / total) * 1000) / 10;
}

// ─── 汉字 → 拼音查找（基于内置数据） ────────────────────────────────

let pinyinMap: Map<string, string> | null = null;

function getPinyinMap(): Map<string, string> {
  if (!pinyinMap) {
    pinyinMap = new Map<string, string>();
    for (const item of CHINESE_CHARS) {
      pinyinMap.set(item.char, item.pinyin);
    }
  }
  return pinyinMap;
}

/**
 * 单个汉字查拼音（带声调）
 * 查不到返回空字符串
 * @param char 单个汉字
 * @returns 带声调的拼音，如 "nǐ"；查不到返回 ""
 */
export function getPinyinForChar(char: string): string {
  return getPinyinMap().get(char) ?? '';
}

/**
 * 一段汉字 → 拼音数组（逐字查，标点/空格/非汉字字符直接返回自身）
 * @param text 中文文本，如 "你好，世界！"
 * @returns 每个字符对应的拼音数组，如 ["nǐ", "hǎo", "，", "shì", "jiè", "！"]
 */
export function getPinyinForText(text: string): string[] {
  const result: string[] = [];
  for (const ch of text) {
    const py = getPinyinForChar(ch);
    result.push(py || ch);
  }
  return result;
}
