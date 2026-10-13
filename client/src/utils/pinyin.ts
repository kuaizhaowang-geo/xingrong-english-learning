/**
 * 拼音工具函数
 */

const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
  ń: 'n', ǹ: 'n',
  m̄: 'm',
  // 大写
  Ā: 'A', Á: 'A', Ǎ: 'A', À: 'A',
  Ō: 'O', Ó: 'O', Ǒ: 'O', Ò: 'O',
  Ē: 'E', É: 'E', Ě: 'E', È: 'E',
  Ī: 'I', Í: 'I', Ǐ: 'I', Ì: 'I',
  Ū: 'U', Ú: 'U', Ǔ: 'U', Ù: 'U',
};

/**
 * 去掉拼音中的声调符号
 * @param pinyin 带声调的拼音字符串
 * @returns 去掉声调后的拼音字符串
 */
export function removeTones(pinyin: string): string {
  let result = '';
  for (const ch of pinyin) {
    result += TONE_MAP[ch] ?? ch;
  }
  return result;
}

/**
 * 比较两个拼音是否相同（忽略声调）
 * @param a 拼音 a
 * @param b 拼音 b
 * @returns 是否相同
 */
export function pinyinEquals(a: string, b: string): boolean {
  return removeTones(a).toLowerCase() === removeTones(b).toLowerCase();
}

/**
 * 拼音声调按键（用于虚拟键盘声调选择）
 */
export const TONE_VOWELS: Record<string, string[]> = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
  e: ['e', 'ē', 'é', 'ě', 'è'],
  i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
  ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};
