import { useMemo } from 'react';
import type { WordParse } from '@shared/api.interface';

const DICT: Record<string, { phonetic: string; partOfSpeech: string; meaning: string }> = {
  i: { phonetic: 'aɪ', partOfSpeech: 'pronoun', meaning: '我' },
  love: { phonetic: 'lʌv', partOfSpeech: 'verb', meaning: '爱' },
  pandas: { phonetic: 'ˈpændəz', partOfSpeech: 'noun', meaning: '熊猫' },
  the: { phonetic: 'ðə', partOfSpeech: 'article', meaning: '这个' },
  five: { phonetic: 'faɪv', partOfSpeech: 'numeral', meaning: '五' },
  star: { phonetic: 'stɑːr', partOfSpeech: 'noun', meaning: '星星' },
  red: { phonetic: 'red', partOfSpeech: 'adjective', meaning: '红色的' },
  flag: { phonetic: 'flæɡ', partOfSpeech: 'noun', meaning: '旗帜' },
  great: { phonetic: 'ɡreɪt', partOfSpeech: 'adjective', meaning: '伟大的' },
  wall: { phonetic: 'wɔːl', partOfSpeech: 'noun', meaning: '墙' },
  chinese: { phonetic: 'ˌtʃaɪˈniːz', partOfSpeech: 'adjective', meaning: '中国的' },
  food: { phonetic: 'fuːd', partOfSpeech: 'noun', meaning: '食物' },
  china: { phonetic: 'ˈtʃaɪnə', partOfSpeech: 'noun', meaning: '中国' },
  has: { phonetic: 'hæz', partOfSpeech: 'verb', meaning: '有' },
  a: { phonetic: 'ə', partOfSpeech: 'article', meaning: '一个' },
  long: { phonetic: 'lɔːŋ', partOfSpeech: 'adjective', meaning: '长的' },
  history: { phonetic: 'ˈhɪstri', partOfSpeech: 'noun', meaning: '历史' },
  tiananmen: { phonetic: 'tjenˈanmən', partOfSpeech: 'noun', meaning: '天安门' },
  square: { phonetic: 'skwer', partOfSpeech: 'noun', meaning: '广场' },
  come: { phonetic: 'kʌm', partOfSpeech: 'verb', meaning: '来' },
  from: { phonetic: 'frʌm', partOfSpeech: 'preposition', meaning: '来自' },
  am: { phonetic: 'æm', partOfSpeech: 'verb', meaning: '是' },
  proud: { phonetic: 'praʊd', partOfSpeech: 'adjective', meaning: '自豪的' },
  my: { phonetic: 'maɪ', partOfSpeech: 'pronoun', meaning: '我的' },
  home: { phonetic: 'hoʊm', partOfSpeech: 'noun', meaning: '家' },
  you: { phonetic: 'juː', partOfSpeech: 'pronoun', meaning: '你' },
  are: { phonetic: 'ɑːr', partOfSpeech: 'verb', meaning: '是' },
  welcome: { phonetic: 'ˈwelkəm', partOfSpeech: 'verb', meaning: '欢迎' },
  to: { phonetic: 'tuː', partOfSpeech: 'preposition', meaning: '到' },
  beijing: { phonetic: 'beɪˈdʒɪŋ', partOfSpeech: 'noun', meaning: '北京' },
  hello: { phonetic: 'həˈloʊ', partOfSpeech: 'interjection', meaning: '你好' },
  good: { phonetic: 'ɡʊd', partOfSpeech: 'adjective', meaning: '好的' },
  morning: { phonetic: 'ˈmɔːrnɪŋ', partOfSpeech: 'noun', meaning: '早晨' },
  nice: { phonetic: 'naɪs', partOfSpeech: 'adjective', meaning: '好的' },
  meet: { phonetic: 'miːt', partOfSpeech: 'verb', meaning: '遇见' },
  thank: { phonetic: 'θæŋk', partOfSpeech: 'verb', meaning: '感谢' },
  thanks: { phonetic: 'θæŋks', partOfSpeech: 'noun', meaning: '谢谢' },
  please: { phonetic: 'pliːz', partOfSpeech: 'adverb', meaning: '请' },
  sorry: { phonetic: 'ˈsɑːri', partOfSpeech: 'adjective', meaning: '抱歉' },
  yes: { phonetic: 'jes', partOfSpeech: 'adverb', meaning: '是的' },
  no: { phonetic: 'noʊ', partOfSpeech: 'adverb', meaning: '不' },
  what: { phonetic: 'wʌt', partOfSpeech: 'pronoun', meaning: '什么' },
  your: { phonetic: 'jʊr', partOfSpeech: 'pronoun', meaning: '你的' },
  how: { phonetic: 'haʊ', partOfSpeech: 'adverb', meaning: '怎样' },
  old: { phonetic: 'oʊld', partOfSpeech: 'adjective', meaning: '老的' },
  where: { phonetic: 'wer', partOfSpeech: 'adverb', meaning: '哪里' },
  do: { phonetic: 'duː', partOfSpeech: 'verb', meaning: '做' },
  go: { phonetic: 'ɡoʊ', partOfSpeech: 'verb', meaning: '去' },
  in: { phonetic: 'ɪn', partOfSpeech: 'preposition', meaning: '在...里' },
  on: { phonetic: 'ɑːn', partOfSpeech: 'preposition', meaning: '在...上' },
  at: { phonetic: 'æt', partOfSpeech: 'preposition', meaning: '在' },
  for: { phonetic: 'fɔːr', partOfSpeech: 'preposition', meaning: '为了' },
  with: { phonetic: 'wɪð', partOfSpeech: 'preposition', meaning: '和' },
  and: { phonetic: 'ænd', partOfSpeech: 'conjunction', meaning: '和' },
  but: { phonetic: 'bʌt', partOfSpeech: 'conjunction', meaning: '但是' },
  he: { phonetic: 'hiː', partOfSpeech: 'pronoun', meaning: '他' },
  she: { phonetic: 'ʃiː', partOfSpeech: 'pronoun', meaning: '她' },
  it: { phonetic: 'ɪt', partOfSpeech: 'pronoun', meaning: '它' },
  we: { phonetic: 'wiː', partOfSpeech: 'pronoun', meaning: '我们' },
  they: { phonetic: 'ðeɪ', partOfSpeech: 'pronoun', meaning: '他们' },
  this: { phonetic: 'ðɪs', partOfSpeech: 'pronoun', meaning: '这个' },
  that: { phonetic: 'ðæt', partOfSpeech: 'pronoun', meaning: '那个' },
  have: { phonetic: 'hæv', partOfSpeech: 'verb', meaning: '有' },
  can: { phonetic: 'kæn', partOfSpeech: 'verb', meaning: '能' },
  will: { phonetic: 'wɪl', partOfSpeech: 'verb', meaning: '将要' },
  would: { phonetic: 'wʊd', partOfSpeech: 'verb', meaning: '将要' },
  could: { phonetic: 'kʊd', partOfSpeech: 'verb', meaning: '能够' },
  should: { phonetic: 'ʃʊd', partOfSpeech: 'verb', meaning: '应该' },
  may: { phonetic: 'meɪ', partOfSpeech: 'verb', meaning: '可能' },
  might: { phonetic: 'maɪt', partOfSpeech: 'verb', meaning: '可能' },
  must: { phonetic: 'mʌst', partOfSpeech: 'verb', meaning: '必须' },
  very: { phonetic: 'ˈveri', partOfSpeech: 'adverb', meaning: '非常' },
  much: { phonetic: 'mʌtʃ', partOfSpeech: 'adverb', meaning: '很多' },
  many: { phonetic: 'ˈmeni', partOfSpeech: 'adjective', meaning: '许多' },
  beautiful: { phonetic: 'ˈbjuːtɪfl', partOfSpeech: 'adjective', meaning: '美丽的' },
  big: { phonetic: 'bɪɡ', partOfSpeech: 'adjective', meaning: '大的' },
  small: { phonetic: 'smɔːl', partOfSpeech: 'adjective', meaning: '小的' },
  new: { phonetic: 'nuː', partOfSpeech: 'adjective', meaning: '新的' },
  happy: { phonetic: 'ˈhæpi', partOfSpeech: 'adjective', meaning: '快乐的' },
  today: { phonetic: 'təˈdeɪ', partOfSpeech: 'adverb', meaning: '今天' },
  tomorrow: { phonetic: 'təˈmɔːroʊ', partOfSpeech: 'noun', meaning: '明天' },
  yesterday: { phonetic: 'ˈjestərdeɪ', partOfSpeech: 'noun', meaning: '昨天' },
  book: { phonetic: 'bʊk', partOfSpeech: 'noun', meaning: '书' },
  student: { phonetic: 'ˈstuːdnt', partOfSpeech: 'noun', meaning: '学生' },
  teacher: { phonetic: 'ˈtiːtʃər', partOfSpeech: 'noun', meaning: '老师' },
  school: { phonetic: 'skuːl', partOfSpeech: 'noun', meaning: '学校' },
  friend: { phonetic: 'frend', partOfSpeech: 'noun', meaning: '朋友' },
  family: { phonetic: 'ˈfæməli', partOfSpeech: 'noun', meaning: '家庭' },
  mother: { phonetic: 'ˈmʌðər', partOfSpeech: 'noun', meaning: '母亲' },
  father: { phonetic: 'ˈfɑːðər', partOfSpeech: 'noun', meaning: '父亲' },
  sister: { phonetic: 'ˈsɪstər', partOfSpeech: 'noun', meaning: '姐妹' },
  brother: { phonetic: 'ˈbrʌðər', partOfSpeech: 'noun', meaning: '兄弟' },
  know: { phonetic: 'noʊ', partOfSpeech: 'verb', meaning: '知道' },
  think: { phonetic: 'θɪŋk', partOfSpeech: 'verb', meaning: '想' },
  see: { phonetic: 'siː', partOfSpeech: 'verb', meaning: '看见' },
  look: { phonetic: 'lʊk', partOfSpeech: 'verb', meaning: '看' },
  want: { phonetic: 'wɑːnt', partOfSpeech: 'verb', meaning: '想要' },
  like: { phonetic: 'laɪk', partOfSpeech: 'verb', meaning: '喜欢' },
  eat: { phonetic: 'iːt', partOfSpeech: 'verb', meaning: '吃' },
  drink: { phonetic: 'drɪŋk', partOfSpeech: 'verb', meaning: '喝' },
  water: { phonetic: 'ˈwɔːtər', partOfSpeech: 'noun', meaning: '水' },
  apple: { phonetic: 'ˈæpl', partOfSpeech: 'noun', meaning: '苹果' },
  cat: { phonetic: 'kæt', partOfSpeech: 'noun', meaning: '猫' },
  dog: { phonetic: 'dɔːɡ', partOfSpeech: 'noun', meaning: '狗' },
  car: { phonetic: 'kɑːr', partOfSpeech: 'noun', meaning: '汽车' },
  house: { phonetic: 'haʊs', partOfSpeech: 'noun', meaning: '房子' },
  time: { phonetic: 'taɪm', partOfSpeech: 'noun', meaning: '时间' },
  work: { phonetic: 'wɜːrk', partOfSpeech: 'verb', meaning: '工作' },
  learn: { phonetic: 'lɜːrn', partOfSpeech: 'verb', meaning: '学习' },
  study: { phonetic: 'ˈstʌdi', partOfSpeech: 'verb', meaning: '学习' },
  english: { phonetic: 'ˈɪŋɡlɪʃ', partOfSpeech: 'noun', meaning: '英语' },
  language: { phonetic: 'ˈlæŋɡwɪdʒ', partOfSpeech: 'noun', meaning: '语言' },
  word: { phonetic: 'wɜːrd', partOfSpeech: 'noun', meaning: '单词' },
  sentence: { phonetic: 'ˈsentəns', partOfSpeech: 'noun', meaning: '句子' },
};

function lookupWord(raw: string): { phonetic: string; partOfSpeech: string; meaning: string } {
  const clean = raw.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (DICT[clean]) return DICT[clean];
  if (clean.endsWith('s') && DICT[clean.slice(0, -1)]) return DICT[clean.slice(0, -1)];
  if (clean.endsWith('ed') && DICT[clean.slice(0, -2)]) return DICT[clean.slice(0, -2)];
  if (clean.endsWith('ing') && DICT[clean.slice(0, -3)]) return DICT[clean.slice(0, -3)];
  return { phonetic: '', partOfSpeech: '', meaning: '' };
}

export function enrichWordParses(
  sentence: string,
  existing?: WordParse[],
): WordParse[] {
  if (existing && existing.length > 0) return existing;
  const words = sentence.split(' ').filter(Boolean);
  return words.map((w) => {
    const info = lookupWord(w);
    return {
      word: w,
      phonetic: info.phonetic,
      partOfSpeech: info.partOfSpeech,
      meaning: info.meaning,
      grammarRole: '',
    };
  });
}

export function useEnrichedWordParses(
  sentence: string,
  wordParses: WordParse[] | undefined,
): WordParse[] {
  return useMemo(
    () => enrichWordParses(sentence, wordParses),
    [sentence, wordParses],
  );
}
