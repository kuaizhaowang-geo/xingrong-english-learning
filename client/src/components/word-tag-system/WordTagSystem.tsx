import React from 'react';
import type { WordParse } from '@shared/api.interface';

export const PART_OF_SPEECH_COLORS: Record<string, string> = {
  pronoun: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  auxiliary: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  noun: 'bg-green-500/20 text-green-300 border-green-500/40',
  verb: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  adjective: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  adverb: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  preposition: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  conjunction: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  article: 'bg-amber-700/20 text-amber-300 border-amber-700/40',
  numeral: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export const PART_OF_SPEECH_LABELS: Record<string, string> = {
  pronoun: '代词',
  auxiliary: '助动词',
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
  adverb: '副词',
  preposition: '介词',
  conjunction: '连词',
  article: '冠词',
  numeral: '数词',
};

export const GRAMMAR_ROLE_COLORS: Record<string, string> = {
  subject: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  predicate: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  predicative: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  object: 'bg-green-500/20 text-green-300 border-green-500/40',
  attributive: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  adverbial: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  complement: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
};

export const GRAMMAR_ROLE_LABELS: Record<string, string> = {
  subject: '主语',
  predicate: '谓语',
  predicative: '表语',
  object: '宾语',
  attributive: '定语',
  adverbial: '状语',
  complement: '补语',
};

interface WordTagSystemProps {
  wordParses: WordParse[];
  showPhonetic?: boolean;
  showPartOfSpeech?: boolean;
  showGrammarRole?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const WordTagSystem: React.FC<WordTagSystemProps> = ({
  wordParses,
  showPhonetic = true,
  showPartOfSpeech = true,
  showGrammarRole = true,
  size = 'md',
  className = '',
}) => {
  if (!wordParses || wordParses.length === 0) return null;

  const tagSizeClass = size === 'xs'
    ? 'text-[10px] px-1.5 py-0 h-5'
    : size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 h-5'
      : 'text-xs px-2 py-0.5';
  const phoneticClass = size === 'xs'
    ? 'text-[10px]'
    : size === 'sm'
      ? 'text-[11px]'
      : 'text-sm';
  const wordClass = size === 'xs'
    ? 'text-sm'
    : size === 'sm'
      ? 'text-base'
      : 'text-xl';

  return (
    <div className={`flex flex-wrap items-end justify-center gap-x-3 gap-y-1 ${className}`}>
      {wordParses.map((wp, idx) => (
        <div key={idx} className="flex flex-col items-center gap-0.5">
          {showPhonetic && wp.phonetic && (
            <span className={`${phoneticClass} text-fuchsia-400 font-mono`}>
              /{wp.phonetic}/
            </span>
          )}
          <span className={`${wordClass} font-bold text-white tracking-wide`}>
            {wp.word}
          </span>
          <div className="flex flex-col items-center gap-1">
            {showPartOfSpeech && wp.partOfSpeech && (
              <span
                className={`${tagSizeClass} rounded-full border font-medium ${
                  PART_OF_SPEECH_COLORS[wp.partOfSpeech] ||
                  'bg-gray-500/20 text-gray-300 border-gray-500/40'
                }`}
              >
                {PART_OF_SPEECH_LABELS[wp.partOfSpeech] || wp.partOfSpeech}
              </span>
            )}
            {showGrammarRole && wp.grammarRole && (
              <span
                className={`${tagSizeClass} rounded-full border font-medium ${
                  GRAMMAR_ROLE_COLORS[wp.grammarRole] ||
                  'bg-gray-500/20 text-gray-300 border-gray-500/40'
                }`}
              >
                {GRAMMAR_ROLE_LABELS[wp.grammarRole] || wp.grammarRole}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WordTagSystem;
