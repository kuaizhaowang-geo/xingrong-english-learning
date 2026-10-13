export interface ParsedSentence {
  sentence: string;
  translation: string;
  difficulty?: number;
  source?: string;
  wordParses?: Array<{
    word: string;
    phonetic?: string;
    meaning?: string;
    partOfSpeech?: string;
    grammarRole?: string;
  }>;
  grammarComponents?: Array<{ id: string; text: string; type: string }>;
  tags?: string[];
  puzzleOrder?: number;
  sentenceType?: string;
  sentenceAnalysis?: string;
}

export interface ParseResult {
  sentences: ParsedSentence[];
  errors: string[];
}

export const SAMPLE_JSON = `[
  {
    "sentence": "Hello, how are you?",
    "translation": "你好，你好吗？",
    "difficulty": 1,
    "wordParses": [
      { "word": "hello", "phonetic": "/həˈloʊ/", "meaning": "你好", "partOfSpeech": "int." }
    ],
    "grammarComponents": [
      { "id": "1", "text": "Hello", "type": "interjection" },
      { "id": "2", "text": ",", "type": "punctuation" },
      { "id": "3", "text": "how are you", "type": "greeting" },
      { "id": "4", "text": "?", "type": "punctuation" }
    ],
    "tags": ["日常", "问候"]
  }
]`;

export function parseSentenceJson(data: unknown): ParseResult {
  const errors: string[] = [];
  const sentences: ParsedSentence[] = [];

  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (
    data &&
    typeof data === 'object' &&
    'sentences' in data &&
    Array.isArray((data as { sentences: unknown }).sentences)
  ) {
    list = (data as { sentences: unknown[] }).sentences;
  } else {
    return { sentences: [], errors: ['JSON 顶层必须是数组，或包含 sentences 数组的对象'] };
  }

  list.forEach((item: unknown, idx: number) => {
    if (!item || typeof item !== 'object') {
      errors.push(`第 ${idx + 1} 条：不是有效对象`);
      return;
    }
    const obj = item as Record<string, unknown>;
    if (!obj.sentence || typeof obj.sentence !== 'string') {
      errors.push(`第 ${idx + 1} 条：缺少 sentence（英文原句）字段`);
      return;
    }
    if (!obj.translation || typeof obj.translation !== 'string') {
      errors.push(
        `第 ${idx + 1} 条（${String(obj.sentence)}）：缺少 translation（中文翻译）字段`,
      );
      return;
    }

    sentences.push({
      sentence: obj.sentence,
      translation: obj.translation,
      difficulty: typeof obj.difficulty === 'number' ? obj.difficulty : undefined,
      source: typeof obj.source === 'string' ? obj.source : undefined,
      wordParses: parseWordParses(obj.wordParses, idx),
      grammarComponents: parseGrammarComponents(obj.grammarComponents, idx),
      tags: Array.isArray(obj.tags) ? (obj.tags as string[]) : undefined,
      puzzleOrder: typeof obj.puzzleOrder === 'number' ? obj.puzzleOrder : undefined,
      sentenceType: typeof obj.sentenceType === 'string' ? obj.sentenceType : undefined,
      sentenceAnalysis:
        typeof obj.sentenceAnalysis === 'string' ? obj.sentenceAnalysis : undefined,
    });
  });

  return { sentences, errors };
}

function parseWordParses(
  raw: unknown,
  _idx: number,
): ParsedSentence['wordParses'] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((wp: unknown) => wp && typeof wp === 'object')
    .map((wp: unknown) => {
      const w = wp as Record<string, unknown>;
      return {
        word: String(w.word ?? ''),
        phonetic: typeof w.phonetic === 'string' ? w.phonetic : undefined,
        meaning: typeof w.meaning === 'string' ? w.meaning : undefined,
        partOfSpeech: typeof w.partOfSpeech === 'string' ? w.partOfSpeech : undefined,
        grammarRole: typeof w.grammarRole === 'string' ? w.grammarRole : undefined,
      };
    });
}

function parseGrammarComponents(
  raw: unknown,
  _idx: number,
): ParsedSentence['grammarComponents'] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((gc: unknown) => gc && typeof gc === 'object')
    .map((gc: unknown) => {
      const g = gc as Record<string, unknown>;
      return {
        id: String(g.id ?? ''),
        text: String(g.text ?? ''),
        type: String(g.type ?? ''),
      };
    });
}

export function buildImportPayload(
  sentences: ParsedSentence[],
  targetMode: 'textbook' | 'course',
  textbookId: string,
  unitId: string,
  courseId: string,
  lessonId: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sentences: sentences.map((s: ParsedSentence) => ({
      sentence: s.sentence,
      translation: s.translation,
      difficulty: s.difficulty,
      wordParses: s.wordParses,
      grammarComponents: s.grammarComponents,
      tags: s.tags,
      puzzleOrder: s.puzzleOrder,
      sentenceType: s.sentenceType,
      sentenceAnalysis: s.sentenceAnalysis,
    })),
  };
  if (targetMode === 'textbook') {
    payload.textbookId = textbookId;
    if (unitId) payload.unitId = unitId;
  } else {
    payload.courseId = courseId;
    if (lessonId) payload.lessonId = lessonId;
  }
  return payload;
}
