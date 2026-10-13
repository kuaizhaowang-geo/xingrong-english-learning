import React, { useCallback } from 'react';
import { Volume2, Check, XCircle, Sparkles } from 'lucide-react';
import type { WordItem } from '@shared/api.interface';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import { useSpeech } from '@client/src/hooks/use-speech';
import { Image } from '@client/src/components/ui/image';

export type OptionState = 'normal' | 'correct' | 'wrong' | 'reveal';

export const getOptStyle = (state: OptionState): string => {
  switch (state) {
    case 'correct':
      return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20';
    case 'wrong':
      return 'border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-lg shadow-rose-500/20';
    case 'reveal':
      return 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20 animate-pulse';
    default:
      return 'border-slate-600/50 bg-slate-800/40 text-slate-200 hover:border-violet-500/60 hover:bg-violet-500/10';
  }
};

interface StepDotsProps {
  effectiveSteps: number[];
  step: number;
}

export const StepDots: React.FC<StepDotsProps> = ({ effectiveSteps, step }) => {
  const STEP_LABELS: Record<number, string> = {
    1: '看图识词', 2: '听词辨音', 3: '拼写练习', 4: '例句理解', 5: '综合测试',
  };
  const curIdx = effectiveSteps.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {[1, 2, 3, 4, 5].map((s) => {
        const sIdx = effectiveSteps.indexOf(s);
        const isSkipped = sIdx === -1;
        const isDone = sIdx !== -1 && sIdx < curIdx;
        const isCurrent = s === step;
        if (isSkipped) {
          return (
            <div
              key={s}
              className="w-2 h-2 rounded-full bg-slate-700/40"
              title={`第${s}步：跳过`}
            />
          );
        }
        return (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-all duration-300
              ${isDone ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' : ''}
              ${isCurrent ? 'bg-violet-500 shadow-lg shadow-violet-500/50 scale-125' : ''}
              ${!isDone && !isCurrent ? 'bg-slate-600/60' : ''}
            `}
            title={`第${s}步：${STEP_LABELS[s] || ''}`}
          />
        );
      })}
    </div>
  );
};

interface StepProps {
  current: WordItem;
  onNext: () => void;
}

// ===== Step 1: 看图识词 =====
interface Step1Props extends StepProps {
  showWord: boolean;
  onShowWord: () => void;
}

export const Step1View: React.FC<Step1Props> = ({ current, showWord, onShowWord, onNext }) => {
  const { speak } = useSpeech();
  const handleSpeak = useCallback((): void => {
    speak(current.word, { lang: 'en-US' });
  }, [current.word, speak]);

  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-xs text-violet-400 mb-2 uppercase tracking-wider">第 1 步 · 看图识词</p>
      <StepDots effectiveSteps={[1, 2, 3, 4, 5]} step={1} />
      {current.imageUrl ? (
        <div className="w-48 h-48 mx-auto mb-6 rounded-2xl overflow-hidden
          border-2 border-violet-500/30 shadow-lg shadow-violet-500/20">
          <Image src={current.imageUrl} alt={current.word} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-48 h-48 mx-auto mb-6 rounded-2xl
          bg-slate-800/60 border-2 border-violet-500/30
          flex items-center justify-center">
          <Sparkles size={48} className="text-violet-400/60" />
        </div>
      )}
      <div className="flex items-center justify-center gap-3 mb-2">
        {current.partOfSpeech && (
          <span className="text-xs px-3 py-1 rounded-full
            bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {current.partOfSpeech}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{current.meaning}</h2>
      <p className="text-sm text-slate-400 mb-6">请看图，这个单词是什么意思？</p>

      {showWord ? (
        <div className="mb-6">
          <h3 className="text-4xl font-bold
            bg-clip-text text-transparent
            bg-gradient-to-r from-violet-300 via-white to-cyan-300">
            {current.word}
          </h3>
          <div className="flex items-center justify-center gap-3 mt-3">
            {current.phonetic && (
              <span className="text-sm text-slate-400">{current.phonetic}</span>
            )}
            <button
              onClick={handleSpeak}
              className="p-2 rounded-full bg-cyan-500/20 border border-cyan-500/40
                text-cyan-300 hover:bg-cyan-500/30 transition-colors"
              aria-label="发音"
            >
              <Volume2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onShowWord}
          className="px-6 py-3 mb-6 rounded-xl
            bg-gradient-to-r from-violet-600 to-indigo-600
            hover:from-violet-500 hover:to-indigo-500
            text-white font-medium shadow-lg shadow-violet-500/30 transition-all duration-300
            active:scale-95"
        >
          显示单词
        </button>
      )}

      <button
        onClick={onNext}
        disabled={!showWord}
        className="w-full max-w-xs px-6 py-3 rounded-xl
          bg-gradient-to-r from-cyan-500 to-blue-500
          text-white font-medium shadow-lg shadow-cyan-500/30
          transition-all duration-300
          disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-95"
      >
        下一步
      </button>
    </div>
  );
};

// ===== Step 2: 听词辨音 =====
export const Step2View: React.FC<StepProps> = ({ current, onNext }) => {
  const { speak } = useSpeech();
  const handleSpeak = useCallback((): void => {
    speak(current.word, { lang: 'en-US' });
  }, [current.word, speak]);

  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-xs text-violet-400 mb-2 uppercase tracking-wider">第 2 步 · 听词辨音</p>
      <StepDots effectiveSteps={[1, 2, 3, 4, 5]} step={2} />
      <div className="flex items-center justify-center gap-3 mb-2">
        {current.partOfSpeech && (
          <span className="text-xs px-3 py-1 rounded-full
            bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {current.partOfSpeech}
          </span>
        )}
      </div>
      <h2 className="text-4xl font-bold mb-3
        bg-clip-text text-transparent
        bg-gradient-to-r from-violet-300 via-white to-cyan-300">
        {current.word}
      </h2>
      {current.phonetic && (
        <p className="text-sm text-slate-400 mb-8">{current.phonetic}</p>
      )}
      <button
        onClick={handleSpeak}
        className="flex items-center gap-3 px-8 py-5 mx-auto mb-6 rounded-2xl
          bg-gradient-to-r from-violet-600/30 to-cyan-600/30
          border-2 border-violet-500/50
          hover:border-cyan-400/60 hover:from-violet-600/50 hover:to-cyan-600/50
          text-white font-medium shadow-lg shadow-violet-500/30
          transition-all duration-300 active:scale-95"
      >
        <Volume2 size={28} className="text-cyan-300" />
        <span className="text-lg">点击听发音</span>
      </button>
      <p className="text-sm text-violet-300 mb-6">📢 请大声跟读 3 遍</p>
      <button
        onClick={onNext}
        className="w-full max-w-xs px-6 py-3 rounded-xl
          bg-gradient-to-r from-cyan-500 to-blue-500
          text-white font-medium shadow-lg shadow-cyan-500/30
          transition-all duration-300 active:scale-95"
      >
        下一步
      </button>
    </div>
  );
};

// ===== Step 3: 拼写练习 =====
interface Step3Props extends StepProps {
  typed: string;
  targetWord: string;
  wrongKey: string | null;
  spellCorrect: boolean;
  onChange: (val: string) => void;
  onHint: () => void;
}

export const Step3View: React.FC<Step3Props> = ({
  current, targetWord, typed, wrongKey, spellCorrect, onChange, onHint,
}) => {
  const placeholders = targetWord.split('').map((ch: string, idx: number) => {
    const typedChar = typed[idx];
    const isCorrect = typedChar !== undefined;
    const isCurrent = idx === typed.length && !spellCorrect;
    if (ch === ' ') {
      return <span key={`sp-${idx}`} className="w-4 inline-block" />;
    }
    return (
      <div
        key={idx}
        className={`w-10 h-12 sm:w-12 sm:h-14 mx-0.5 sm:mx-1 flex items-center justify-center
          text-2xl sm:text-3xl font-bold rounded-lg border-2 transition-all duration-200
          ${isCorrect
            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 shadow-lg shadow-cyan-500/30'
            : isCurrent
              ? 'border-violet-400 bg-violet-500/10 text-transparent animate-pulse'
              : 'border-slate-600/50 bg-slate-800/30 text-transparent'
          }
          ${spellCorrect ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10' : ''}
        `}
      >
        {typedChar || (isCurrent ? '|' : '')}
      </div>
    );
  });

  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-xs text-violet-400 mb-2 uppercase tracking-wider">第 3 步 · 拼写练习</p>
      <StepDots effectiveSteps={[1, 2, 3, 4, 5]} step={3} />
      <div className="flex items-center justify-center gap-3 mb-2">
        {current.partOfSpeech && (
          <span className="text-xs px-3 py-1 rounded-full
            bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {current.partOfSpeech}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">{current.meaning}</h2>
      <p className="text-sm text-slate-400 mb-6">{targetWord.length} 个字母</p>

      <div className="flex items-center justify-center flex-wrap mb-4 min-h-[56px]">
        {placeholders}
      </div>

      {spellCorrect && (
        <p className="text-cyan-400 font-medium mb-4 flex items-center justify-center gap-2">
          <Check size={18} /> 拼写正确！
        </p>
      )}
      {wrongKey && (
        <p className="text-rose-400 text-sm mb-4 flex items-center justify-center gap-1">
          <XCircle size={14} /> 字母错误，再试试
        </p>
      )}

      <div className="mt-4">
        <VirtualKeyboard
          layout="qwerty"
          value={typed}
          onChange={onChange}
          targetWord={targetWord}
          wrongKey={wrongKey}
          showNextGuide={false}
          showTypedHighlight
          disabled={spellCorrect}
          theme="neon"
          colorScheme="default"
          toolbar={{
            hint: { onClick: onHint, label: '提示', disabled: spellCorrect },
          }}
        />
      </div>
    </div>
  );
};

// ===== Step 4: 例句理解 =====
interface Step4Props extends StepProps {
  options: string[];
  optStates: OptionState[];
  feedback: boolean;
  correct: boolean;
  onSelect: (idx: number) => void;
}

export const Step4View: React.FC<Step4Props> = ({
  current, options, optStates, feedback, correct, onSelect, onNext,
}) => {
  const { speak } = useSpeech();
  const targetWord = current.word;
  const handleSpeak = useCallback((): void => {
    if (current.exampleSentence) speak(current.exampleSentence, { lang: 'en-US' });
  }, [current.exampleSentence, speak]);

  const highlightedSentence = (current.exampleSentence || '').replace(
    new RegExp(`\\b${targetWord}\\b`, 'gi'),
    (match) => `<span class="text-violet-400 font-bold">${match}</span>`,
  );

  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-xs text-violet-400 mb-2 uppercase tracking-wider">第 4 步 · 例句理解</p>
      <StepDots effectiveSteps={[1, 2, 3, 4, 5]} step={4} />

      <button
        onClick={handleSpeak}
        className="mb-4 p-2 rounded-full bg-cyan-500/20 border border-cyan-500/40
          text-cyan-300 hover:bg-cyan-500/30 transition-colors"
        aria-label="播放例句"
      >
        <Volume2 size={18} />
      </button>

      <p
        className="text-xl font-medium text-white mb-6 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedSentence }}
      />

      <p className="text-sm text-slate-400 mb-4">请选择正确的中文翻译：</p>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {options.map((opt: string, idx: number) => (
          <button
            key={`${idx}-${opt}`}
            onClick={() => onSelect(idx)}
            disabled={feedback}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200
              ${getOptStyle(optStates[idx] || 'normal')}
              ${feedback ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}
            `}
          >
            <span className="text-xs text-slate-500 mr-2">
              {String.fromCharCode(65 + idx)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {feedback && correct && current.exampleTranslation && (
        <p className="text-cyan-300 text-sm mb-4">
          翻译：{current.exampleTranslation}
        </p>
      )}

      <button
        onClick={onNext}
        disabled={!correct}
        className="w-full max-w-xs px-6 py-3 rounded-xl
          bg-gradient-to-r from-cyan-500 to-blue-500
          text-white font-medium shadow-lg shadow-cyan-500/30
          transition-all duration-300
          disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-95"
      >
        下一步
      </button>
    </div>
  );
};

// ===== Step 5: 综合测试 =====
interface Step5Props {
  current: WordItem;
  options: WordItem[];
  optStates: OptionState[];
  feedback: boolean;
  canRetry: boolean;
  loading: boolean;
  onSelect: (idx: number) => void;
}

export const Step5View: React.FC<Step5Props> = ({
  current, options, optStates, feedback, canRetry, loading, onSelect,
}) => {
  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-xs text-violet-400 mb-2 uppercase tracking-wider">第 5 步 · 综合测试</p>
      <StepDots effectiveSteps={[1, 2, 3, 4, 5]} step={5} />
      <div className="flex items-center justify-center gap-3 mb-2">
        {current.partOfSpeech && (
          <span className="text-xs px-3 py-1 rounded-full
            bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {current.partOfSpeech}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-bold text-white mb-6">{current.meaning}</h2>
      <p className="text-sm text-slate-400 mb-4">请选择对应的英文单词：</p>

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400
            rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {options.map((opt: WordItem, idx: number) => (
              <button
                key={opt.id}
                onClick={() => onSelect(idx)}
                disabled={feedback}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-200
                  ${getOptStyle(optStates[idx] || 'normal')}
                  ${feedback ? 'cursor-default' : 'cursor-pointer active:scale-95'}
                `}
              >
                <span className="font-medium">{opt.word}</span>
              </button>
            ))}
          </div>
          {!feedback && !canRetry && (
            <p className="text-rose-400 text-sm mb-4">答错了，还有一次机会！</p>
          )}
        </>
      )}
    </div>
  );
};
