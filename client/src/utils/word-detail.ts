import { wordsApi } from '@client/src/api';
import type { WordItem } from '@shared/api.interface';
import { getDictWord, type DictWordEntry } from './word-dictionary';

export interface WordDetailData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  examples: Array<{ en: string; zh: string }>;
  relatedWords: Array<{ word: string; meaning: string }>;
  source: 'database' | 'builtin' | 'none';
  wordId?: string;
}

const detailCache = new Map<string, WordDetailData>();

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-zA-Z'-]/g, '');
}

export function isClickableWord(word: string): boolean {
  return /[a-zA-Z]/.test(word);
}

function wordItemToDetail(item: WordItem): WordDetailData {
  const examples: Array<{ en: string; zh: string }> = [];
  if (item.exampleSentence) {
    examples.push({ en: item.exampleSentence, zh: item.exampleTranslation || '' });
  }
  return {
    word: item.word,
    phonetic: item.phonetic || '',
    partOfSpeech: item.partOfSpeech || 'noun',
    meaning: item.meaning,
    examples,
    relatedWords: [],
    source: 'database',
    wordId: item.id,
  };
}

function dictEntryToDetail(entry: DictWordEntry): WordDetailData {
  return {
    word: entry.word,
    phonetic: entry.phonetic,
    partOfSpeech: entry.partOfSpeech,
    meaning: entry.meaning,
    examples: entry.examples,
    relatedWords: entry.relatedWords,
    source: 'builtin',
  };
}

function buildEmptyDetail(word: string): WordDetailData {
  return {
    word,
    phonetic: '',
    partOfSpeech: '',
    meaning: '暂无释义',
    examples: [],
    relatedWords: [],
    source: 'none',
  };
}

export async function getWordDetail(word: string): Promise<WordDetailData> {
  const normalized = normalizeWord(word);
  if (!normalized) return buildEmptyDetail(word);

  const cached = detailCache.get(normalized);
  if (cached) return cached;

  const dictEntry = getDictWord(normalized);
  if (dictEntry) {
    const detail = dictEntryToDetail(dictEntry);
    detailCache.set(normalized, detail);
    return detail;
  }

  try {
    const result = await wordsApi.getWords({ search: normalized, pageSize: 5 });
    const items: WordItem[] = result.items || [];
    const exact = items.find(w => w.word.toLowerCase() === normalized);
    if (exact) {
      const detail = wordItemToDetail(exact);
      detailCache.set(normalized, detail);
      return detail;
    }
    if (items.length > 0) {
      const detail = wordItemToDetail(items[0]);
      detailCache.set(normalized, detail);
      return detail;
    }
  } catch (err) {
    // 忽略查询错误，fallback到空数据
  }

  const empty = buildEmptyDetail(word);
  detailCache.set(normalized, empty);
  return empty;
}

export function clearWordDetailCache(): void {
  detailCache.clear();
}

export function speakWord(word: string, rate = 0.9): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
