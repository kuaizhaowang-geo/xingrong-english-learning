import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  X,
  Volume2,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dictationApi } from '@client/src/api';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import DictationResultPage from './DictationResultPage';
import DictationWordDisplay, {
  getPromptText,
  isPinyinAnswerMode,
  isCharAnswerMode,
} from './DictationWordDisplay';
import DictationAnswerInput from './DictationAnswerInput';
import { removeTones } from '@client/src/utils/pinyin';
import type {
  DictationSession,
  DictationSessionWord,
  DictationResult,
} from '@shared/api.interface';

/**
 * 获取当前输入中应该显示声调的元音
 * 规则：找最后出现的元音字母（a > o > e > i > u > v）
 */
function getActiveVowel(input: string): string | null {
  const vowels = ['a', 'o', 'e', 'i', 'u', 'v'];
  const lower = input.toLowerCase();
  for (let i = lower.length - 1; i >= 0; i -= 1) {
    const ch = lower[i];
    if (vowels.includes(ch)) {
      return ch;
    }
    // 已带声调的元音也识别
    const stripped = removeTones(ch);
    if (vowels.includes(stripped) && stripped !== ch) {
      return stripped;
    }
  }
  return null;
}

const SPEECH_RATE_MAP: Record<string, number> = {
  slow: 0.6,
  normal: 0.9,
  fast: 1.2,
};

const DictationPracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<DictationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showHint, setShowHint] = useState(false);
  const [wrongWords, setWrongWords] = useState<DictationSessionWord[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitResult, setSubmitResult] = useState<DictationResult | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const inputRef = useRef<HTMLInputElement>(null);

  // 加载会话
  useEffect(() => {
    if (!id) return;
    void loadSession();
  }, [id]);

  const loadSession = async (): Promise<void> => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await dictationApi.getDictationSession(id);
      setSession(data);
      setCurrentIndex(data.currentIndex || 0);
      // 听音模式自动播放第一题
      if (
        data.mode === 'audio_to_char' ||
        data.mode === 'audio_to_pinyin'
      ) {
        const firstWord = data.words?.[data.currentIndex || 0];
        if (firstWord) {
          setTimeout(() => speak(firstWord.word), 500);
        }
      }
    } catch (err) {
      logger.error('加载听写会话失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  // 发音
  const speak = useCallback(
    (text: string): void => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        const rate = session
          ? SPEECH_RATE_MAP[session.speechRate] ?? 0.9
          : 0.9;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        logger.error('语音播放失败', err as Error);
        setSpeaking(false);
      }
    },
    [session],
  );

  const currentWord = session?.words?.[currentIndex];
  const isPinyinMode = isPinyinAnswerMode(session.mode);
  const isCharMode = isCharAnswerMode(session.mode);

  // 判断答案正误
  const checkAnswer = (input: string, word: DictationSessionWord): boolean => {
    const trimmed = input.trim();
    if (!trimmed) return false;

    if (isPinyinMode) {
      // 拼音模式：忽略声调比较
      return removeTones(trimmed).toLowerCase() === removeTones(word.pinyin).toLowerCase();
    }
    // 汉字模式：完全匹配
    return trimmed === word.word;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!session || !currentWord || feedback !== 'none') return;
    if (!userInput.trim()) return;

    const isCorrect = checkAnswer(userInput, currentWord);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setWrongWords((prev) => [
        ...prev,
        { ...currentWord, userAnswer: userInput, isCorrect: false },
      ]);
    }

    // 提交到后端
    try {
      await dictationApi.answerDictationWord({
        sessionId: session.id,
        wordId: currentWord.id,
        wordOrder: currentWord.wordOrder,
        userAnswer: userInput.trim(),
      });
    } catch (err) {
      logger.error('提交答案失败', err as Error);
    }

    // 自动下一题
    const delay = isCorrect ? 600 : 2000;
    setTimeout(() => {
      goNext();
    }, delay);
  };

  const goNext = useCallback((): void => {
    if (!session) return;
    if (currentIndex >= session.words.length - 1) {
      void finishSession();
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUserInput('');
      setFeedback('none');
      setShowHint(false);

      // 听音模式自动播放
      const nextWord = session.words[nextIndex];
      if (
        nextWord &&
        (session.mode === 'audio_to_char' ||
          session.mode === 'audio_to_pinyin')
      ) {
        setTimeout(() => speak(nextWord.word), 300);
      }
    }
  }, [session, currentIndex, speak]);

  const finishSession = async (): Promise<void> => {
    if (!session) return;
    const answers = session.words.map((w, idx) => ({
      wordOrder: w.wordOrder,
      userAnswer: idx === currentIndex && userInput
        ? userInput.trim()
        : (w.userAnswer ?? ''),
    }));
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await dictationApi.submitDictationSession({
        sessionId: session.id,
        answers,
        durationSeconds: duration,
      });
      setSubmitResult(res);
      setFinished(true);
    } catch (err) {
      logger.error('提交会话失败', err as Error);
      setFinished(true);
    }
  };

  // 虚拟键盘输入
  const handleKeyInput = (char: string): void => {
    if (feedback !== 'none') return;
    // 如果最后一个字符是元音且当前输入也是元音字母，替换为带声调版本
    const lower = userInput.toLowerCase();
    const vowelMap: Record<string, string[]> = {
      a: ['a', 'ā', 'á', 'ǎ', 'à'],
      o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
      e: ['e', 'ē', 'é', 'ě', 'è'],
      i: ['i', 'ī', 'í', 'ǐ', 'ì'],
      u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
      v: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
    };

    // 检查是否是声调按键（带声调的元音）
    const allToneChars = Object.values(vowelMap).flat();
    if (allToneChars.includes(char)) {
      // 找到输入中最后一个元音并替换
      for (let i = lower.length - 1; i >= 0; i -= 1) {
        const ch = lower[i];
        const originalCh = userInput[i];
        const baseVowel = removeTones(ch).toLowerCase();
        if (vowelMap[baseVowel]) {
          // 替换该位置的元音为带调版本
          const newVal =
            userInput.slice(0, i) + char + userInput.slice(i + 1);
          setUserInput(newVal);
          return;
        }
        if (originalCh && vowelMap[removeTones(originalCh).toLowerCase()]) {
          const newVal =
            userInput.slice(0, i) + char + userInput.slice(i + 1);
          setUserInput(newVal);
          return;
        }
      }
    }

    setUserInput((prev) => prev + char);
  };

  const handleBackspace = (): void => {
    if (feedback !== 'none') return;
    setUserInput((prev) => prev.slice(0, -1));
  };

  // 物理键盘支持（汉字模式用隐藏 input）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (feedback === 'none') {
        void handleSubmit();
      }
    } else if (e.key === 'Backspace' && feedback !== 'none') {
      e.preventDefault();
    }
  };

  const activeVowel = isPinyinMode ? getActiveVowel(userInput) : null;

  const TONE_MAP: Record<string, string[]> = {
    a: ['a', 'ā', 'á', 'ǎ', 'à'],
    o: ['o', 'ō', 'ó', 'ǒ', 'ò'],
    e: ['e', 'ē', 'é', 'ě', 'è'],
    i: ['i', 'ī', 'í', 'ǐ', 'ì'],
    u: ['u', 'ū', 'ú', 'ǔ', 'ù'],
    v: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };

  const toneOptions = activeVowel ? TONE_MAP[activeVowel] || [] : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin" size={40} style={{ color: '#6366F1' }} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">会话不存在或已失效</p>
          <button
            type="button"
            onClick={() => navigate('/dictation')}
            className="px-5 py-2 rounded-lg bg-[#6366F1] text-white"
          >
            返回听写主页
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <DictationResultPage
        result={submitResult}
        session={session}
        wrongWords={wrongWords}
        correctCount={correctCount}
      />
    );
  }

  const total = session.words.length;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 背景装饰 */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: '#6366F1' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#2563EB' }}
      />

      {/* 顶部栏 */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dictation')}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="退出"
          >
            <X size={24} />
          </button>
          <div className="text-white text-sm font-medium">
            第 <span className="text-[#06B6D4] text-lg font-bold">{currentIndex + 1}</span>
            {' '}/ {total} 题
          </div>
          <div className="w-10" /> {/* 占位 */}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-6">
        {/* 提示文字 */}
        <p className="text-sm text-slate-400 mb-6">
          {getPromptText(session.mode)}
        </p>

        {/* 大字显示区 */}
        <div className="mb-8 text-center">
          <DictationWordDisplay
            mode={session.mode}
            word={currentWord}
            speaking={speaking}
            onSpeak={() => speak(currentWord.word)}
          />
        </div>

        {/* 操作按钮：发音 + 提示 */}
        <div className="flex items-center gap-4 mb-8">
          {(session.mode === 'audio_to_char' ||
            session.mode === 'audio_to_pinyin' ||
            true) && (
            <button
              type="button"
              onClick={() => speak(currentWord.word)}
              className="w-14 h-14 rounded-full flex items-center justify-center
                bg-white/10 backdrop-blur border border-fuchsia-500/30
                text-slate-200 hover:border-[#6366F1]
                hover:shadow-[0_0_20px_rgba(124_58_237_0.4)]
                transition-all"
              aria-label="播放发音"
            >
              <Volume2
                size={24}
                className={speaking ? 'animate-pulse text-[#06B6D4]' : ''}
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHint(true)}
            disabled={showHint}
              className="w-14 h-14 rounded-full flex items-center justify-center
                bg-white/10 backdrop-blur border border-cyan-500/30
                text-slate-300 hover:text-white hover:border-[#2563EB]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all"
            aria-label="提示"
          >
            <Lightbulb size={24} />
          </button>
        </div>

        {/* 提示内容 */}
        {showHint && (
          <div
            className="mb-6 px-5 py-3 rounded-xl text-sm text-center"
            style={{
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              color: '#06B6D4',
            }}
          >
            {currentWord.radical && <span>部首：{currentWord.radical}</span>}
            {currentWord.strokes !== undefined && (
              <span className="ml-4">笔画：{currentWord.strokes} 画</span>
            )}
            {!currentWord.radical && currentWord.strokes === undefined && (
              <span>暂无更多提示</span>
            )}
          </div>
        )}

        {/* 输入区 */}
        <DictationAnswerInput
          isCharMode={isCharMode}
          word={currentWord}
          userInput={userInput}
          feedback={feedback}
          inputRef={inputRef}
          onInputChange={setUserInput}
          onKeyDown={handleKeyDown}
        />

        {/* 拼音虚拟键盘（拼音模式时显示） */}
        {isPinyinMode && (
          <div className="w-full mt-8">
            {/* 声调行（有元音激活时显示） */}
            {toneOptions.length > 0 && (
              <div className="flex justify-center gap-2 mb-3">
                {toneOptions.map((toneChar: string) => (
                  <button
                    key={toneChar}
                    type="button"
                    disabled={feedback !== 'none'}
                    onClick={() => handleKeyInput(toneChar)}
                    className="w-14 h-12 rounded-lg text-lg font-semibold transition-all
                      bg-[#E0E7FF] text-[#06B6D4] border border-[#06B6D4]/40
                      hover:bg-[#06B6D4]/20 hover:border-[#06B6D4]
                      hover:shadow-[0_0_12px_rgba(34_211_238_0.4)]
                      active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {toneChar}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-center">
              <VirtualKeyboard
                layout="qwerty"
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleSubmit}
                onBackspace={handleBackspace}
                theme="neon"
                disabled={feedback !== 'none'}
                showNextGuide={false}
                showTypedHighlight={false}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* 提交按钮（仅汉字模式显示，拼音模式键盘已有提交） */}
        {isCharMode && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!userInput.trim() || feedback !== 'none'}
            className="mt-8 px-10 py-3 rounded-xl text-lg font-semibold text-white
              bg-gradient-to-r from-[#6366F1] to-[#2563EB]
              hover:shadow-[0_0_24px_rgba(124_58_237_0.5)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all"
          >
            提交
          </button>
        )}
      </div>
    </div>
  );
};

export default DictationPracticePage;
