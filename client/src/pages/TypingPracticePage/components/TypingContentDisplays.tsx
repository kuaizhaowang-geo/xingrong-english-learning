// 打字内容展示子组件
import React from 'react';
import { motion } from 'framer-motion';

// 拼音打字单字显示
export const PinyinCharDisplay: React.FC<{
  char: string;
  pinyin: string;
  showPinyin: boolean;
  input: string;
  states: Array<'correct' | 'wrong' | 'pending'>;
  target: string;
}> = ({ char, pinyin, showPinyin, input, states, target }) => {
  const targetLower = target.toLowerCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-6xl md:text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(124_58_237_0.5)]">
        {char}
      </div>
      {showPinyin && pinyin && (
        <div className="text-2xl text-violet-300 font-medium">{pinyin}</div>
      )}
      {showPinyin && !pinyin && (
        <div className="text-base text-slate-500 italic">暂无拼音数据</div>
      )}
      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        <div className="flex items-center justify-center gap-1 font-mono text-2xl min-h-[2rem]">
          {targetLower.length === 0 ? (
            <span className="text-slate-600 text-base">请输入拼音</span>
          ) : (
            targetLower.split('').map((ch: string, idx: number) => {
              const state = states[idx] ?? 'pending';
              let className = '';
              if (state === 'correct') {
                className = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16_185_129_0.6)]';
              } else if (state === 'wrong') {
                className = 'text-rose-400 drop-shadow-[0_0_8px_rgba(244_63_94_0.6)]';
              } else {
                className = 'text-slate-600';
              }
              const isCurrent = idx === input.length;
              return (
                <motion.span
                  key={idx}
                  className={`inline-block min-w-[1.2rem] text-center ${className} ${
                    isCurrent
                      ? 'border-b-2 border-violet-400 animate-[blink_1s_infinite]'
                      : ''
                  }`}
                  animate={state === 'correct' && input.length === idx + 1 ? { scale: [1, 1.2, 1], y: [0, -4, 0] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  {state === 'pending' ? ch : (input[idx] ?? ch)}
                </motion.span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// 词语/句子打字逐字显示
export const CharByCharDisplay: React.FC<{
  chars: string[];
  pinyinList: string[];
  showPinyin: boolean;
  currentIndex: number;
  charStates: Array<'correct' | 'wrong' | 'pending'>;
  userInput: string;
  charStartIndices: number[];
}> = ({ chars, pinyinList, showPinyin, currentIndex, userInput, charStartIndices }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
      {chars.map((char: string, idx: number) => {
        const isCurrent = idx === currentIndex;
        const isDone = idx < currentIndex;
        const isPunct = /[\u3000-\u303F\uff00-\uffef，。！？、；：""''（）《》【】…—·]/.test(char);

        const startIdx = charStartIndices[idx];
        const endIdx = charStartIndices[idx + 1] ?? userInput.length;
        const charInput = userInput.slice(startIdx, endIdx);
        const charTarget = pinyinList[idx] ?? char;
        const isCorrectChar =
          isDone && !isPunct && charInput.length > 0 &&
          charInput.toLowerCase() === charTarget.toLowerCase().replace(/[，。！？、；：]/g, '');

        return (
          <div
            key={idx}
            className={`flex flex-col items-center gap-1 transition-all ${
              isCurrent ? 'scale-110' : ''
            }`}
          >
            {showPinyin && !isPunct && (
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? 'text-cyan-300'
                    : isCorrectChar
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                }`}
              >
                {pinyinList[idx]}
              </span>
            )}
            <span
              className={`text-3xl md:text-4xl font-bold transition-all ${
                isCurrent
                  ? 'text-white drop-shadow-[0_0_20px_rgba(124_58_237_0.8)] border-b-2 border-violet-400 pb-0.5'
                  : isCorrectChar
                    ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16_185_129_0.5)]'
                    : isDone
                      ? 'text-rose-400'
                      : 'text-slate-600'
              }`}
            >
              {char}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 英文打字显示
export const EnglishTypingDisplay: React.FC<{
  text: string;
  userInput: string;
  charStates: Array<'correct' | 'wrong' | 'pending'>;
  answerHidden: boolean;
  subText?: string;
}> = ({ text, userInput, charStates, answerHidden, subText }) => {
  if (answerHidden) {
    return (
      <div className="flex flex-col items-center gap-4">
        {subText && <div className="text-lg text-fuchsia-400">{subText}</div>}
        <div className="text-3xl md:text-4xl font-mono text-slate-500">
          {text.split('').map((_: string, i: number) => (
            <span key={i} className="inline-block w-5">_</span>
          ))}
        </div>
        <div className="text-xl font-mono text-violet-300 min-h-[2rem]">
          {userInput || <span className="text-slate-600">开始输入...</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {subText && <div className="text-lg text-fuchsia-400">{subText}</div>}
      <div className="text-4xl md:text-5xl font-mono font-bold tracking-wide">
        {text.split('').map((ch: string, idx: number) => {
          const state = charStates[idx] ?? 'pending';
          let className = '';
          if (state === 'correct') {
            className = 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16_185_129_0.6)]';
          } else if (state === 'wrong') {
            className = 'text-rose-400 drop-shadow-[0_0_8px_rgba(244_63_94_0.6)] line-through';
          } else {
            className = 'text-slate-500';
          }
          const isCurrent = idx === userInput.length;
          return (
            <motion.span
              key={idx}
              className={`inline-block ${className} ${
                isCurrent
                  ? 'border-b-2 border-violet-400 animate-[blink_1s_infinite] pb-0.5 text-white'
                  : ''
              }`}
              animate={state === 'correct' && userInput.length === idx + 1 ? { scale: [1, 1.2, 1], y: [0, -4, 0] } : {}}
              transition={{ duration: 0.15 }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};

// 自由练习显示
export const FreePracticeDisplay: React.FC<{
  inputText: string;
  speed: number;
  accuracy: number;
}> = ({ inputText, speed, accuracy }) => (
  <div className="w-full max-w-2xl flex flex-col items-center gap-6">
    <div className="text-center">
      <div className="text-2xl font-bold text-white mb-2">自由练习</div>
      <div className="text-sm text-slate-500">输入任意文字，实时统计速度和正确率</div>
    </div>
    <div className="w-full bg-white/5 backdrop-blur-sm rounded-xl border border-fuchsia-500/20 p-6 min-h-[120px]">
      <div className="text-2xl font-mono text-white leading-relaxed break-all">
        {inputText || <span className="text-slate-500">开始输入任意内容...</span>}
        <span className="inline-block w-0.5 h-6 bg-violet-400 ml-0.5 animate-[blink_1s_infinite]" />
      </div>
    </div>
    <div className="flex items-center gap-8">
      <div className="text-center">
        <div className="text-3xl font-bold text-cyan-400">{speed}</div>
        <div className="text-xs text-slate-500">字/分钟</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-emerald-400">{accuracy.toFixed(1)}%</div>
        <div className="text-xs text-slate-500">正确率</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-violet-400">{inputText.length}</div>
        <div className="text-xs text-slate-500">字符数</div>
      </div>
    </div>
  </div>
);
