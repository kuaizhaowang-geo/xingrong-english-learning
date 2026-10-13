import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';

export type VoiceAgeCategory = 'elder' | 'middle' | 'youth' | 'child';
export type VoiceGender = 'male' | 'female' | 'unknown';

export interface VoiceInfo {
  name: string;
  lang: string;
  displayName: string;
  category: string;
  native: boolean;
  ageCategory: VoiceAgeCategory;
  gender: VoiceGender;
  emoji: string;
}

const VOICE_CATEGORY_MAP: Record<string, string> = {
  'zh-CN': '中文',
  'en-US': '英语(美)',
  'en-GB': '英语(英)',
  'en-AU': '英语(澳)',
  'en-CA': '英语(加)',
  'en-IN': '英语(印)',
  'ja-JP': '日语',
  'ko-KR': '韩语',
};

// 年龄关键词（越具体越靠前，优先匹配）
const AGE_PATTERNS: Array<{ category: VoiceAgeCategory; label: string; re: RegExp }> = [
  {
    category: 'child',
    label: '童',
    re: /child|kid|boy|girl|少儿|儿童|小孩|童|学生|student|baby|infant/,
  },
  {
    category: 'elder',
    label: '老年',
    re: /senior|old|老年|老人| elder |grandpa|grandma|grandfather|grandmother|爷爷|奶奶|姥爷|姥姥|外公|外婆/,
  },
  {
    category: 'middle',
    label: '中年',
    re: /middle|adult|中年|成人|mature|大叔|阿姨|先生|女士/,
  },
  {
    category: 'youth',
    label: '青年',
    re: /young|youth|青年/,
  },
];

// 性别关键词
const MALE_RE = /\bmale\b|\bman\b|\bmen\b|男声|男生|男|先生|大叔|爷爷|姥爷|外公|爸爸|哥哥|弟弟|\bboy\b| grandpa |grandpa|grandfather|daniel|alex|fred|tom|george|mark|david|aaron|james|john|robert|michael|kangkang/;
const FEMALE_RE = /\bfemale\b|\bwoman\b|\bwomen\b|女声|女生|女|女士|小姐|奶奶|姥姥|外婆|妈妈|姐姐|妹妹|\bgirl\b| grandma |grandma|grandmother|xiaoxiao|xiaoyi|tingting|meijia|karen|samantha|victoria|tessa|kate|allison|ava|joanne|monica|serena|susan|zira|rihi|yuna|hanhan|linda|mary|patricia|jennifer/;

const CATEGORY_EMOJI: Record<VoiceAgeCategory, Record<VoiceGender, string>> = {
  elder: { male: '👴', female: '👵', unknown: '🧓' },
  middle: { male: '👨‍🦳', female: '👩‍🦳', unknown: '🧑' },
  youth: { male: '👨', female: '👩', unknown: '🧑' },
  child: { male: '👦', female: '👧', unknown: '🧒' },
};

const CATEGORY_LABEL: Record<VoiceAgeCategory, Record<VoiceGender, string>> = {
  elder: { male: '老年男声', female: '老年女声', unknown: '老年声' },
  middle: { male: '中年男声', female: '中年女声', unknown: '中年声' },
  youth: { male: '青年男声', female: '青年女声', unknown: '青年声' },
  child: { male: '男童声', female: '女童声', unknown: '儿童声' },
};

interface VoiceCategorization {
  ageCategory: VoiceAgeCategory;
  gender: VoiceGender;
  category: string;
  emoji: string;
}

function categorizeVoice(voice: SpeechSynthesisVoice): VoiceCategorization {
  const name = voice.name.toLowerCase();

  // 年龄匹配
  let ageCategory: VoiceAgeCategory = 'youth';
  for (const pattern of AGE_PATTERNS) {
    if (pattern.re.test(name)) {
      ageCategory = pattern.category;
      break;
    }
  }

  // 性别匹配（儿童里 boy/girl 已在年龄层判断，但也贡献性别）
  let gender: VoiceGender = 'unknown';
  const isMale = MALE_RE.test(name);
  const isFemale = FEMALE_RE.test(name);

  if (isFemale && !isMale) {
    gender = 'female';
  } else if (isMale && !isFemale) {
    gender = 'male';
  } else if (isMale && isFemale) {
    // 两个都命中时看谁的特征更明显：优先匹配名字中的关键性别词
    // 默认按 female 处理（大多数 TTS 引擎女声命名更丰富）
    gender = 'female';
  }

  // 儿童 + 性别未明确时，从 boy/girl 推断
  if (ageCategory === 'child' && gender === 'unknown') {
    if (/boy/.test(name)) gender = 'male';
    else if (/girl/.test(name)) gender = 'female';
  }

  return {
    ageCategory,
    gender,
    category: CATEGORY_LABEL[ageCategory][gender],
    emoji: CATEGORY_EMOJI[ageCategory][gender],
  };
}

function buildVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
  const cat = categorizeVoice(voice);
  const langLabel = VOICE_CATEGORY_MAP[voice.lang] ||
    VOICE_CATEGORY_MAP[voice.lang.split('-')[0]] ||
    voice.lang;
  return {
    name: voice.name,
    lang: voice.lang,
    displayName: `${cat.category}·${langLabel}`,
    category: cat.category,
    native: voice.default || false,
    ageCategory: cat.ageCategory,
    gender: cat.gender,
    emoji: cat.emoji,
  };
}

const PREFERENCE_KEY = 'learner_preferences';

interface SpeechPreferenceBundle {
  speechVoice?: string;
  speechRate?: number;
  speechDefaultLang?: string;
}

function readPreferences(): SpeechPreferenceBundle {
  try {
    const cached = localStorage.getItem(PREFERENCE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as SpeechPreferenceBundle;
      return parsed || {};
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writePreferences(patch: SpeechPreferenceBundle): void {
  try {
    const cached = localStorage.getItem(PREFERENCE_KEY);
    const parsed = cached ? JSON.parse(cached) as SpeechPreferenceBundle : {};
    const next = { ...parsed, ...patch };
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readSpeechVoicePreference(): string {
  return readPreferences().speechVoice || '';
}

export function writeSpeechVoicePreference(voice: string): void {
  writePreferences({ speechVoice: voice });
}

export function readSpeechRatePreference(): number {
  const prefs = readPreferences();
  if (typeof prefs.speechRate === 'number' && prefs.speechRate > 0) {
    return prefs.speechRate;
  }
  return 1;
}

export function writeSpeechRatePreference(rate: number): void {
  writePreferences({ speechRate: rate });
}

export function readSpeechLangPreference(): string {
  return readPreferences().speechDefaultLang || '';
}

export function writeSpeechLangPreference(lang: string): void {
  writePreferences({ speechDefaultLang: lang });
}

const DEFAULT_RATE = 1;

export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [availableVoices, setAvailableVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRateState] = useState<number>(DEFAULT_RATE);
  const [defaultLang, setDefaultLangState] = useState<string>('');
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    setSupported(true);

    // 加载偏好
    const prefs = readPreferences();
    if (prefs.speechVoice) setSelectedVoice(prefs.speechVoice);
    if (typeof prefs.speechRate === 'number' && prefs.speechRate > 0) {
      setSpeechRateState(prefs.speechRate);
    }
    if (prefs.speechDefaultLang) setDefaultLangState(prefs.speechDefaultLang);

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);

      const seen = new Set<string>();
      const result: VoiceInfo[] = [];
      for (const v of list) {
        if (seen.has(v.name)) continue;
        seen.add(v.name);
        result.push(buildVoiceInfo(v));
      }
      setAvailableVoices(result);

      const currentSaved = readSpeechVoicePreference();
      if (currentSaved && list.some((v) => v.name === currentSaved)) {
        setSelectedVoice(currentSaved);
        return;
      }
      if (!currentSaved && list.length > 0) {
        const preferred =
          list.find((v) => v.lang.startsWith('en-US') && v.default) ||
          list.find((v) => v.lang.startsWith('en')) ||
          list[0];
        setSelectedVoice(preferred.name);
        writeSpeechVoicePreference(preferred.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const setVoice = useCallback((voiceName: string) => {
    setSelectedVoice(voiceName);
    writeSpeechVoicePreference(voiceName);
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(2, rate));
    setSpeechRateState(clamped);
    writeSpeechRatePreference(clamped);
  }, []);

  const setDefaultLang = useCallback((lang: string) => {
    setDefaultLangState(lang);
    writeSpeechLangPreference(lang);
    // 语言变更后，尝试匹配该语言下第一个音色
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const list = window.speechSynthesis.getVoices();
      const match = list.find((v) => v.lang.startsWith(lang));
      if (match) {
        setSelectedVoice(match.name);
        writeSpeechVoicePreference(match.name);
      }
    }
  }, []);

  const speak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number; volume?: number; lang?: string }) => {
      if (!supported || !text) return;

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voiceObj = voices.find((v) => v.name === selectedVoice);
        if (voiceObj) {
          utterance.voice = voiceObj;
        } else if (voices.length > 0) {
          utterance.voice = voices[0];
        }
        if (options?.lang) {
          utterance.lang = options.lang;
        } else if (voiceObj?.lang) {
          utterance.lang = voiceObj.lang;
        } else if (defaultLang) {
          utterance.lang = defaultLang;
        }
        utterance.rate = options?.rate ?? speechRate;
        utterance.pitch = options?.pitch ?? 1;
        utterance.volume = options?.volume ?? 1;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = (e) => {
          setSpeaking(false);
          if (e.error === 'interrupted' || e.error === 'canceled') {
            logger.debug('语音播放被中断', e.error);
          } else {
            logger.error('语音合成错误', e.error);
          }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        logger.error('语音播放失败', err as Error);
      }
    },
    [supported, voices, selectedVoice, speechRate, defaultLang],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    try {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } catch {
      /* ignore */
    }
  }, [supported]);

  const toggleSpeak = useCallback(
    (text: string, options?: { rate?: number; pitch?: number; volume?: number; lang?: string }) => {
      if (speaking) {
        stop();
      } else {
        speak(text, options);
      }
    },
    [speaking, speak, stop],
  );

  return {
    supported,
    voices: availableVoices,
    selectedVoice,
    setVoice,
    speechRate,
    setSpeechRate,
    defaultLang,
    setDefaultLang,
    speaking,
    speak,
    stop,
    toggleSpeak,
  };
}
