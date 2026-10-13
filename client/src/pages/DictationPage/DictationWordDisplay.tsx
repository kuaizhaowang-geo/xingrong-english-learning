import React from 'react';
import { Volume2 } from 'lucide-react';
import type { DictationMode, DictationSessionWord } from '@shared/api.interface';

interface DictationWordDisplayProps {
  mode: DictationMode;
  word: DictationSessionWord;
  speaking: boolean;
  onSpeak: () => void;
}

/**
 * 听写大字显示区
 * 根据模式显示拼音、汉字或大喇叭按钮
 */
const DictationWordDisplay: React.FC<DictationWordDisplayProps> = ({
  mode,
  word,
  speaking,
  onSpeak,
}) => {
  if (mode === 'pinyin_to_char') {
    return (
      <div
        className="text-7xl font-bold"
        style={{
          color: '#F1F5F9',
          textShadow: '0 0 30px rgba(99, 102, 241, 0.35)',
        }}
      >
        {word.pinyin}
      </div>
    );
  }

  if (mode === 'char_to_pinyin') {
    return (
      <div
        className="text-8xl font-bold"
        style={{
          color: '#F1F5F9',
          textShadow: '0 0 30px rgba(34, 211, 238, 0.5)',
        }}
      >
        {word.word}
      </div>
    );
  }

  // audio_to_char / audio_to_pinyin
  return (
    <button
      type="button"
      onClick={onSpeak}
      className="w-40 h-40 rounded-full flex flex-col items-center justify-center
        transition-all hover:scale-105"
      style={{
        background:
          'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(26, 22, 53, 0.8) 70%)',
        border: '2px solid rgba(99, 102, 241, 0.35)',
        boxShadow: speaking
          ? '0 0 40px rgba(99, 102, 241, 0.3)'
          : '0 0 20px rgba(99, 102, 241, 0.2)',
      }}
      aria-label="播放发音"
    >
      <Volume2
        size={56}
        className={speaking ? 'animate-pulse' : ''}
        style={{ color: speaking ? '#06B6D4' : '#F1F5F9' }}
      />
      <span className="text-sm text-slate-500 mt-2">点击重听</span>
    </button>
  );
};

/**
 * 获取听写模式的提示文字
 */
export function getPromptText(mode: DictationMode): string {
  switch (mode) {
    case 'pinyin_to_char':
      return '请写出对应的汉字';
    case 'char_to_pinyin':
      return '请写出对应的拼音';
    case 'audio_to_char':
      return '请听发音写出汉字';
    case 'audio_to_pinyin':
      return '请听发音写出拼音';
    default:
      return '';
  }
}

/**
 * 判断是否是拼音作答模式
 */
export function isPinyinAnswerMode(mode: DictationMode): boolean {
  return mode === 'char_to_pinyin' || mode === 'audio_to_pinyin';
}

/**
 * 判断是否是汉字作答模式
 */
export function isCharAnswerMode(mode: DictationMode): boolean {
  return mode === 'pinyin_to_char' || mode === 'audio_to_char';
}

export default DictationWordDisplay;
