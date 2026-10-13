import React, { useCallback, useMemo } from 'react';
import { isClickableWord } from '@client/src/utils/word-detail';

interface ClickableSentenceProps {
  sentence: string;
  onWordClick: (word: string) => void;
  className?: string;
  highlightWords?: Set<string>;
  wordColorClass?: string;
}

const ClickableSentence: React.FC<ClickableSentenceProps> = ({
  sentence,
  onWordClick,
  className = '',
  highlightWords,
  wordColorClass = 'text-slate-800',
}) => {
  const tokens = useMemo(() => {
    const result: Array<{ text: string; isWord: boolean; clean: string }> = [];
    let current = '';
    for (const ch of sentence) {
      if (/[a-zA-Z'-]/.test(ch)) {
        current += ch;
      } else {
        if (current) {
          result.push({ text: current, isWord: true, clean: current.toLowerCase() });
          current = '';
        }
        if (ch !== ' ') {
          result.push({ text: ch, isWord: false, clean: '' });
        } else {
          result.push({ text: ' ', isWord: false, clean: '' });
        }
      }
    }
    if (current) {
      result.push({ text: current, isWord: true, clean: current.toLowerCase() });
    }
    return result;
  }, [sentence]);

  const handleClick = useCallback((text: string, isWord: boolean) => {
    if (!isWord) return;
    onWordClick(text);
  }, [onWordClick]);

  return (
    <span className={className}>
      {tokens.map((token, idx) => {
        if (!token.isWord) {
          return <span key={idx}>{token.text === ' ' ? '\u00A0' : token.text}</span>;
        }
        const clickable = isClickableWord(token.text);
        const highlighted = highlightWords?.has(token.clean);
        return (
          <span
            key={idx}
            onClick={() => clickable && handleClick(token.text, true)}
            className={`
              inline-block transition-all duration-150 cursor-pointer
              ${clickable ? 'hover:text-[#818CF8] hover:underline underline-offset-2' : ''}
              ${highlighted ? 'text-[#6366F1] font-semibold' : wordColorClass}
            `}
          >
            {token.text}
          </span>
        );
      })}
    </span>
  );
};

export default ClickableSentence;
