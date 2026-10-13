import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Sparkles, AlertCircle } from 'lucide-react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

type PhoneticMode = 'none' | 'default' | 'breakdown' | 'phonics';

interface WordItem {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
}

interface WordPracticeContentAreaProps {
  mode: PracticeMode;
  wordItem: WordItem;
  showMeaning: boolean;
  showExample: boolean;
  showIllustration: boolean;
  letterBreakdown: boolean;
  letterScramble: boolean;
  phoneticMode: PhoneticMode;
  onPhoneticModeChange: (mode: PhoneticMode) => void;
  isUnfamiliar: boolean;
  onMarkUnfamiliar: () => void;
  // Typing mode
  userInput: string;
  feedback: 'none' | 'correct' | 'wrong';
  answerHidden: boolean;
  // Dictation mode
  dictationInput: string;
  dictationShowAnswer: boolean;
  onDictationSpeak: () => void;
  onDictationReveal: () => void;
  // Shadowing mode
  isRecording: boolean;
  shadowingScore: number | null;
  shadowingHasRecorded: boolean;
  shadowingShowAnswer: boolean;
  onRecordToggle: () => void;
  onRetryRecording: () => void;
  onShadowingReveal: () => void;
  // Watch-speak mode
  watchSpeakHasRecorded: boolean;
  watchSpeakScore: number | null;
  watchSpeakShowAnswer: boolean;
  onWatchSpeakRecordToggle: () => void;
  onWatchSpeakReveal: () => void;
  isWatchSpeakRecording: boolean;
  // Scrambled letters (for letter scramble mode)
  scrambledLetters: string[];
  selectedLetterIndexes: number[];
  onLetterClick: (idx: number) => void;
  onLetterReset: () => void;
}

// 词性标签颜色（霓虹深色风格）
const POS_COLORS: Record<string, string> = {
  'n.': 'bg-[rgba(34_197_94_0.15)] text-[#22C55E] border-[rgba(34_197_94_0.4)]',
  'v.': 'bg-[rgba(249_115_22_0.15)] text-[#F97316] border-[rgba(249_115_22_0.4)]',
  'adj.': 'bg-[rgba(234_179_8_0.15)] text-[#EAB308] border-[rgba(234_179_8_0.4)]',
  'adv.': 'bg-[rgba(236_72_153_0.15)] text-[#EC4899] border-[rgba(236_72_153_0.4)]',
  'v./n.': 'bg-[rgba(168_85_247_0.15)] text-[#A855F7] border-[rgba(168_85_247_0.4)]',
};

// 占位场景插图（霓虹深色）
const PlaceholderIllustration: React.FC<{ word: string }> = ({ word }) => (
  <div className="w-full h-full bg-gradient-to-br from-[#FFFFFF] via-[#EEF2FF] to-[#FFFFFF] flex items-center justify-center relative overflow-hidden rounded-xl border border-[rgba(124_58_237_0.2)]">
    <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-[#6366F1]/30 blur-xl" />
    <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-[#06B6D4]/20 blur-xl" />
    <div className="relative text-center z-10">
      <Sparkles className="mx-auto text-[#6366F1]/70 mb-1" size={28} />
      <span className="text-xs text-slate-500">场景配图</span>
    </div>
    <div className="absolute bottom-2 left-0 right-0 text-center">
      <span className="text-[10px] text-slate-500 font-medium">{word}</span>
    </div>
  </div>
);

// ── 音标显示工具 ──────────────────────────────────
const PhoneticDisplay: React.FC<{
  phonetic: string;
  word: string;
  mode: PhoneticMode;
  posTag?: React.ReactNode;
  className?: string;
}> = ({ phonetic, word, mode, posTag, className = '' }) => {
  if (mode === 'none') return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {mode === 'default' && (
        <span className="text-sm text-fuchsia-400/90">{phonetic || '暂无音标'}</span>
      )}
      {mode === 'breakdown' && phonetic && (
        <span className="text-sm text-[#E879F9] font-mono tracking-wide">
          {phonetic.split('').map((ch: string, i: number) => (
            <span key={i} className="inline-block mx-px">{ch}</span>
          ))}
        </span>
      )}
      {mode === 'breakdown' && !phonetic && (
        <span className="text-sm text-fuchsia-400/50">暂无音标拆解</span>
      )}
      {mode === 'phonics' && (
        <span className="text-sm text-[#E879F9] font-medium">
          {word.replace(/[aeiou]/gi, (m) => m.toUpperCase())}
        </span>
      )}
      {posTag}
    </div>
  );
};

// ── 打字模式：逐字母显示（白色卡片风格） ──────────────────────────
const TypingWordDisplay: React.FC<{
  word: string;
  userInput: string;
  answerHidden: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  letterBreakdown: boolean;
  phonetic: string;
  pos: string;
  phoneticMode: PhoneticMode;
}> = ({ word, userInput, answerHidden, feedback, letterBreakdown, phonetic, pos, phoneticMode }) => {
  const posColor = POS_COLORS[pos] || 'bg-white/5 text-slate-400 border-white/10';

  const letterSlots = word.split('').map((letter: string, idx: number) => {
    const typed = userInput[idx];
    let status: 'empty' | 'correct' | 'wrong' = 'empty';
    if (typed) {
      status = typed.toLowerCase() === letter.toLowerCase() ? 'correct' : 'wrong';
    }
    return { letter, status, typed: typed || '' };
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 音标 + 词性（在单词上方） */}
      {letterBreakdown && (
        <div className="flex flex-col items-center gap-1">
          <PhoneticDisplay
            phonetic={phonetic}
            word={word}
            mode={phoneticMode}
            className="justify-center"
          />
          <span className={`text-[11px] px-2 py-0.5 rounded-md border ${posColor}`}>
            {pos}
          </span>
        </div>
      )}

      {/* 单词字母槽位（大字，拆分成单个字母） */}
      <div className="flex gap-2 flex-wrap justify-center">
        {letterSlots.map((slot, idx: number) => (
          <div
            key={idx}
            className={`w-12 h-16 flex items-center justify-center text-3xl font-mono font-semibold rounded-xl border-b-4 transition-all ${
              slot.status === 'correct'
                ? 'border-[#06B6D4] text-[#06B6D4] bg-[rgba(34_211_238_0.1)] shadow-md shadow-[#06B6D4]/30'
                : slot.status === 'wrong'
                  ? 'border-[#EF476F] text-[#EF476F] bg-[rgba(239_71_111_0.1)]'
                  : answerHidden
                    ? 'border-white/10 text-slate-400 bg-white/5'
                    : 'border-fuchsia-500/30 text-white bg-white/5'
            }`}
          >
            {slot.status === 'correct'
              ? slot.typed
              : slot.status === 'wrong'
                ? slot.typed
                : answerHidden
                  ? '•'
                  : slot.letter.toLowerCase()}
          </div>
        ))}
      </div>

      {/* 反馈 */}
      {feedback === 'correct' && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-[#06B6D4]"
        >
          ✓ 正确！太棒了
        </motion.p>
      )}
      {feedback === 'wrong' && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-[#EF476F]"
        >
          ✗ 正确答案：<span className="text-[#6366F1]">{word}</span>
        </motion.p>
      )}
    </div>
  );
};

// ── 听写模式 ──────────────────────────────────
const DictationWordDisplay: React.FC<{
  word: string;
  meaning: string;
  input: string;
  showAnswer: boolean;
  feedback: 'none' | 'correct' | 'wrong';
  onSpeak: () => void;
  onReveal: () => void;
}> = ({ word, meaning, input, showAnswer, feedback, onSpeak, onReveal }) => {
  const fbBorder =
    feedback === 'correct'
      ? 'border-[#06B6D4] shadow-lg shadow-[#06B6D4]/30'
      : feedback === 'wrong'
        ? 'border-[#EF476F] shadow-md shadow-[#EF476F]/20'
        : 'border-[rgba(124_58_237_0.3)]';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 播放按钮 */}
      <button
        onClick={onSpeak}
        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all bg-white/5 hover:scale-105 ${fbBorder}`}
      >
        <Volume2 size={32} className="text-[#6366F1]" />
      </button>

      <div className="text-xs text-slate-400">点击播放发音</div>

      {/* 中文释义 */}
      <div className="text-base text-white text-center font-medium">{meaning}</div>

      {/* 输入显示区 */}
      <div
        className={`w-full max-w-sm bg-white/5 border border-fuchsia-500/15 rounded-xl px-4 py-3 transition-all ${fbBorder}`}
      >
        <input
          value={input}
          readOnly
          placeholder="请拼写单词..."
          className="w-full bg-transparent outline-none text-lg text-center text-white placeholder:text-slate-500 font-mono"
          spellCheck={false}
        />
      </div>

      {/* 显示答案按钮 / 答案 */}
      {showAnswer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
            className="text-xs text-slate-400"
        >
          答案：<span className="text-fuchsia-400 font-medium">{word}</span>
        </motion.div>
      ) : (
        <button
          onClick={onReveal}
          className="text-xs text-fuchsia-400 hover:text-fuchsia-300 underline-offset-2 hover:underline"
        >
          显示答案
        </button>
      )}

      {feedback === 'correct' && (
        <p className="text-sm font-bold text-[#06B6D4]">✓ 正确！</p>
      )}
      {feedback === 'wrong' && (
        <p className="text-sm font-bold text-[#EF476F]">
          ✗ 正确答案：<span className="text-[#6366F1]">{word}</span>
        </p>
      )}
    </div>
  );
};

// ── 跟读模式 ──────────────────────────────────
const ShadowingWordDisplay: React.FC<{
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  isRecording: boolean;
  hasRecorded: boolean;
  score: number | null;
  showAnswer: boolean;
  onRecordToggle: () => void;
  onRetry: () => void;
  onReveal: () => void;
  phoneticMode?: PhoneticMode;
}> = ({
  word,
  phonetic,
  pos,
  meaning,
  isRecording,
  hasRecorded,
  score,
  showAnswer,
  onRecordToggle,
  onRetry,
  onReveal,
  phoneticMode = 'default',
}) => {
  const posColor = POS_COLORS[pos] || 'bg-[#F8FAFC] text-slate-500 border-indigo-200';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 完整单词展示 */}
      {showAnswer && (
        <div className="text-center">
          <div className="text-[36px] font-bold text-slate-800 tracking-wide mb-1">{word}</div>
          <PhoneticDisplay
            phonetic={phonetic}
            word={word}
            mode={phoneticMode}
            posTag={
              <span className={`text-[11px] px-2 py-0.5 rounded-md border ${posColor}`}>
                {pos}
              </span>
            }
            className="justify-center"
          />
          <div className="text-sm text-slate-500 mt-2">{meaning}</div>
        </div>
      )}

      {!showAnswer && (
        <button
          onClick={onReveal}
          className="text-sm text-slate-500 hover:text-[#6366F1]"
        >
          显示单词
        </button>
      )}

      {/* 录音按钮 */}
      <button
        onClick={onRecordToggle}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-gradient-to-br from-[#EF476F] to-[#EC4899] shadow-lg shadow-[#EF476F]/40'
            : 'bg-gradient-to-br from-[#6366F1] to-[#2563EB] shadow-lg shadow-[#6366F1]/40 hover:scale-105'
        }`}
      >
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 rounded-full border-2 border-white/40"
          />
        )}
        <Mic size={32} className="text-white relative z-10" />
      </button>

      <div className="text-xs text-slate-500">
        {isRecording ? '录音中...' : hasRecorded ? '点击重新录制' : '点击开始跟读'}
      </div>

      {/* 分数展示 */}
      {hasRecorded && score !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-5 px-5 py-3 rounded-xl bg-[rgba(124_58_237_0.1)] border border-[rgba(124_58_237_0.3)]"
        >
          <div className="text-center">
            <div className="text-[11px] text-slate-500">发音评分</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">
              {score}
            </div>
          </div>
          <div className="w-px h-10 bg-[rgba(124_58_237_0.3)]" />
          <div className="text-center">
            <div className="text-[11px] text-slate-500">准确度</div>
            <div className="text-sm font-semibold text-[#06B6D4]">
              {score >= 90 ? '优秀' : score >= 70 ? '良好' : '继续加油'}
            </div>
          </div>
        </motion.div>
      )}

      {/* 评分功能开发中提示 */}
      {hasRecorded && score === null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(124_58_237_0.1)] border border-[rgba(124_58_237_0.3)]"
        >
          <Sparkles size={14} style={{ color: '#818CF8' }} />
          <span className="text-xs" style={{ color: '#94A3B8' }}>
            录音已完成 · 评分功能开发中
          </span>
        </motion.div>
      )}

      {/* 重试按钮 */}
      {hasRecorded && (
        <button
          onClick={onRetry}
          className="text-xs text-[#6366F1] hover:text-[#A855F7]"
        >
          重新录制
        </button>
      )}
    </div>
  );
};

// ── 看说模式（中译英模式） ──────────────────────────────────
const WatchSpeakWordDisplay: React.FC<{
  word: string;
  meaning: string;
  isRecording: boolean;
  hasRecorded: boolean;
  score: number | null;
  showAnswer: boolean;
  onRecordToggle: () => void;
  onReveal: () => void;
}> = ({
  word,
  meaning,
  isRecording,
  hasRecorded,
  score,
  showAnswer,
  onRecordToggle,
  onReveal,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 中文提示（大字，中译英模式） */}
      <div className="text-2xl font-bold text-slate-800 text-center mb-1">{meaning}</div>
      <div className="text-xs text-slate-500 mb-2">请用英文说出该单词</div>

      {/* 语音识别按钮 */}
      <button
        onClick={onRecordToggle}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-gradient-to-br from-[#EF476F] to-[#EC4899] shadow-lg shadow-[#EF476F]/40'
            : 'bg-gradient-to-br from-[#2563EB] to-[#6366F1] shadow-lg shadow-[#2563EB]/30 hover:scale-105'
        }`}
      >
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute inset-0 rounded-full border-2 border-white/40"
          />
        )}
        <Mic size={32} className="text-white relative z-10" />
      </button>

      <div className="text-xs text-slate-500">
        {isRecording ? '识别中...' : hasRecorded ? '点击重新识别' : '点击说出单词'}
      </div>

      {/* 识别结果 */}
      {hasRecorded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl bg-[rgba(59_130_246_0.1)] border border-[rgba(59_130_246_0.3)] w-full max-w-xs"
        >
          <div className="text-[11px] text-slate-500">识别结果</div>
          {showAnswer ? (
            <>
              <div className="text-lg font-semibold text-slate-800">{word}</div>
              {score !== null && (
                <div className="text-sm font-bold text-[#2563EB]">
                  匹配度：{score}%
                </div>
              )}
              {score === null && (
                <div className="text-xs flex items-center gap-1" style={{ color: '#64748B' }}>
                  <Sparkles size={11} style={{ color: '#2563EB' }} />
                  评分功能开发中
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onReveal}
              className="text-xs text-[#2563EB] hover:text-[#60A5FA] underline-offset-2 hover:underline"
            >
              查看正确答案
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ── 字母重组模式 ──────────────────────────────────
const LetterScrambleDisplay: React.FC<{
  word: string;
  scrambledLetters: string[];
  selectedIndexes: number[];
  feedback: 'none' | 'correct' | 'wrong';
  onLetterClick: (idx: number) => void;
  onReset: () => void;
}> = ({ word, scrambledLetters, selectedIndexes, feedback, onLetterClick, onReset }) => {
  const selectedWord = selectedIndexes.map((i: number) => scrambledLetters[i]).join('');

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* 已选字母（目标区） */}
      <div className="flex gap-2 flex-wrap justify-center min-h-[64px]">
        {selectedIndexes.length === 0 && (
          <div className="text-xs text-slate-500 flex items-center">点击下方字母拼出单词</div>
        )}
        {selectedIndexes.map((letterIdx: number, i: number) => (
          <div
            key={i}
            className={`w-12 h-16 flex items-center justify-center text-3xl font-mono font-semibold rounded-xl border-b-4 ${
              feedback === 'correct'
                ? 'border-[#06B6D4] text-[#06B6D4] bg-[rgba(34_211_238_0.1)] shadow-md shadow-[#06B6D4]/30'
                : feedback === 'wrong'
                  ? 'border-[#EF476F] text-[#EF476F] bg-[rgba(239_71_111_0.1)]'
                  : 'border-[#6366F1] text-[#6366F1] bg-[rgba(124_58_237_0.1)] shadow-sm shadow-[#6366F1]/30'
            }`}
          >
            {scrambledLetters[letterIdx]}
          </div>
        ))}
      </div>

      {/* 打乱的字母 */}
      <div className="flex gap-2 flex-wrap justify-center">
        {scrambledLetters.map((letter: string, idx: number) => {
          const used = selectedIndexes.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => !used && feedback === 'none' && onLetterClick(idx)}
              disabled={used || feedback !== 'none'}
              className={`w-12 h-16 flex items-center justify-center text-2xl font-mono font-semibold rounded-xl transition-all ${
                used
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                  : 'bg-white/5 text-slate-200 border-2 border-fuchsia-500/20 hover:border-fuchsia-400 hover:text-fuchsia-400 hover:scale-105 hover:shadow-md hover:shadow-fuchsia-500/20 active:scale-95'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* 重置按钮 */}
      <button
        onClick={onReset}
         className="text-xs text-slate-400 hover:text-fuchsia-400"
      >
        重置
      </button>

      {/* 反馈 */}
      {feedback === 'correct' && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-[#06B6D4]"
        >
          ✓ 正确！太棒了
        </motion.p>
      )}
      {feedback === 'wrong' && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold text-[#EF476F]"
        >
          ✗ 正确答案：<span className="text-[#6366F1]">{word}</span>
        </motion.p>
      )}

      {selectedWord && feedback === 'none' && (
        <div className="text-[11px] text-slate-400">已选：{selectedWord.length} 个字母</div>
      )}
    </div>
  );
};

const WordPracticeContentArea: React.FC<WordPracticeContentAreaProps> = ({
  mode,
  wordItem,
  showMeaning,
  showExample,
  showIllustration,
  letterBreakdown,
  letterScramble,
  phoneticMode,
  onPhoneticModeChange,
  isUnfamiliar,
  onMarkUnfamiliar,
  userInput,
  feedback,
  answerHidden,
  dictationInput,
  dictationShowAnswer,
  onDictationSpeak,
  onDictationReveal,
  isRecording,
  shadowingScore,
  shadowingHasRecorded,
  shadowingShowAnswer,
  onRecordToggle,
  onRetryRecording,
  onShadowingReveal,
  watchSpeakHasRecorded,
  watchSpeakScore,
  watchSpeakShowAnswer,
  onWatchSpeakRecordToggle,
  onWatchSpeakReveal,
  isWatchSpeakRecording,
  scrambledLetters,
  selectedLetterIndexes,
  onLetterClick,
  onLetterReset,
}) => {
  const posColor = POS_COLORS[wordItem.pos] || 'bg-white/5 text-slate-400 border-fuchsia-500/15';

  return (
    <div className="flex flex-col items-center w-full">
      {/* 场景插图（可选） */}
      {showIllustration && mode !== 'dictation' && mode !== 'watch-speak' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
            className="relative w-[280px] h-[140px] rounded-xl overflow-hidden border border-fuchsia-500/20 flex-shrink-0 mb-3 mx-auto"
        >
          <PlaceholderIllustration word={wordItem.word} />
        </motion.div>
      )}

      {/* 不熟悉按钮（右上角） */}
      <div className="w-full flex justify-end mb-2">
          <button
            type="button"
            onClick={onMarkUnfamiliar}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
              isUnfamiliar
                ? 'text-[#EF476F] border-[rgba(239_71_111_0.5)] bg-[rgba(239_71_111_0.1)]'
                : 'text-slate-400 border-white/10 bg-white/5 hover:text-rose-400 hover:border-rose-400/50 hover:bg-rose-500/5'
            }`}
          >
            <AlertCircle size={12} />
            {isUnfamiliar ? '已标记' : '不熟悉'}
          </button>
      </div>

      {/* 模式特定显示区 */}
      <div className="w-full flex-shrink-0 mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${letterScramble ? 'scramble' : 'normal'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 打字模式 - 字母重组 */}
            {mode === 'typing' && letterScramble && (
              <LetterScrambleDisplay
                word={wordItem.word}
                scrambledLetters={scrambledLetters}
                selectedIndexes={selectedLetterIndexes}
                feedback={feedback}
                onLetterClick={onLetterClick}
                onReset={onLetterReset}
              />
            )}

            {/* 打字模式 - 普通 */}
            {mode === 'typing' && !letterScramble && (
              <TypingWordDisplay
                word={wordItem.word}
                userInput={userInput}
                answerHidden={answerHidden}
                feedback={feedback}
                letterBreakdown={letterBreakdown}
                phonetic={wordItem.phonetic}
                pos={wordItem.pos}
                phoneticMode={phoneticMode}
              />
            )}

            {/* 听写模式 */}
            {mode === 'dictation' && (
              <DictationWordDisplay
                word={wordItem.word}
                meaning={wordItem.meaning}
                input={dictationInput}
                showAnswer={dictationShowAnswer}
                feedback={feedback}
                onSpeak={onDictationSpeak}
                onReveal={onDictationReveal}
              />
            )}

            {/* 跟读模式 */}
            {mode === 'shadowing' && (
              <ShadowingWordDisplay
                word={wordItem.word}
                phonetic={wordItem.phonetic}
                pos={wordItem.pos}
                meaning={wordItem.meaning}
                isRecording={isRecording}
                hasRecorded={shadowingHasRecorded}
                score={shadowingScore}
                showAnswer={shadowingShowAnswer}
                onRecordToggle={onRecordToggle}
                onRetry={onRetryRecording}
                onReveal={onShadowingReveal}
                phoneticMode={phoneticMode}
              />
            )}

            {/* 看说模式（中译英） */}
            {mode === 'watch-speak' && (
              <WatchSpeakWordDisplay
                word={wordItem.word}
                meaning={wordItem.meaning}
                isRecording={isWatchSpeakRecording}
                hasRecorded={watchSpeakHasRecorded}
                score={watchSpeakScore}
                showAnswer={watchSpeakShowAnswer}
                onRecordToggle={onWatchSpeakRecordToggle}
                onReveal={onWatchSpeakReveal}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 中文释义 */}
      {showMeaning && mode !== 'dictation' && mode !== 'watch-speak' && mode !== 'shadowing' && (
        <p className="text-base text-slate-800 text-center flex-shrink-0 mb-2 font-medium">
          {wordItem.meaning}
        </p>
      )}

      {/* 例句 */}
      {showExample && feedback === 'none' && mode === 'typing' && !letterScramble && (
        <p className="text-sm text-slate-500 text-center flex-shrink-0 italic mb-2">
          e.g. {wordItem.example}
        </p>
      )}

      {/* 词性标签（打字非拆解模式显示） */}
      {mode === 'typing' && !letterBreakdown && !letterScramble && (
        <span className={`text-[11px] px-2 py-0.5 rounded-md border ${posColor}`}>
          {wordItem.pos}
        </span>
      )}
    </div>
  );
};

export default WordPracticeContentArea;
