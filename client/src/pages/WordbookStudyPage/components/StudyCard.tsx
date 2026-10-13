import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Check,
  X,
  Eye,
  EyeOff,
  Mic,
  Play,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  UserWordbookItem,
  WordbookStudyMode,
} from '@shared/api.interface';

interface StudyCardProps {
  item: UserWordbookItem;
  mode: WordbookStudyMode;
  feedback: 'correct' | 'wrong' | null;
  showAnswer: boolean;
  userInput: string;
  selectedOption: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onReveal: () => void;
  onSelfJudge: (correct: boolean) => void;
  onOptionSelect: (option: string) => void;
  onPlayHint: () => void;
  isPlaying: boolean;
}

const StudyCard: React.FC<StudyCardProps> = ({
  item,
  mode,
  feedback,
  showAnswer,
  userInput,
  selectedOption,
  onInputChange,
  onSubmit,
  onReveal,
  onSelfJudge,
  onOptionSelect,
  onPlayHint,
  isPlaying,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && isInputMode(mode) && !feedback) {
      inputRef.current.focus();
    }
  }, [item.id, mode, feedback]);

  const isInputMode = (m: WordbookStudyMode): boolean =>
    ['typing', 'dictation', 'pinyin', 'pinyin-read', 'mental-math'].includes(m);

  const isSelfJudgeMode = (m: WordbookStudyMode): boolean =>
    [
      'following',
      'speaking',
      'character-write',
      'text-read',
      'formula-memory',
      'knowledge-review',
    ].includes(m);

  const getBorderColor = (): string => {
    if (feedback === 'correct') return '#06B6D4';
    if (feedback === 'wrong') return '#EF476F';
    return 'rgba(99, 102, 241, 0.2)';
  };

  const getBoxShadow = (): string => {
    if (feedback === 'correct') return '0 0 40px rgba(34, 211, 238, 0.3)';
    if (feedback === 'wrong') return '0 0 40px rgba(239, 71, 111, 0.3)';
    return '0 0 30px rgba(99, 102, 241, 0.08)';
  };

  const getCorrectAnswer = (): string => {
    switch (mode) {
      case 'typing':
      case 'dictation':
      case 'following':
      case 'speaking':
        return item.content;
      case 'pinyin':
        return item.extra?.pinyin || item.answer || item.content;
      case 'character-write':
      case 'pinyin-read':
      case 'text-read':
        return item.content;
      case 'mental-math':
        return item.answer || item.extra?.formula || '';
      case 'formula-memory':
        return item.extra?.formula || item.answer || item.content;
      case 'knowledge-review':
        return item.extra?.knowledgePoint || item.answer || item.content;
      default:
        return item.answer || item.content;
    }
  };

  const getQuestionText = (): string => {
    switch (mode) {
      case 'typing':
      case 'following':
      case 'text-read':
        return item.content;
      case 'dictation':
        return item.extra?.translation || item.answer || '听发音写单词';
      case 'speaking':
        return item.extra?.translation || item.answer || item.content;
      case 'pinyin':
        return item.content;
      case 'character-write':
        return item.extra?.pinyin || '请写出汉字';
      case 'pinyin-read':
        return item.extra?.pinyin || '请写出汉字';
      case 'mental-math':
        return item.content;
      case 'formula-memory':
        return item.content;
      case 'knowledge-review':
        return item.content;
      case 'choice':
        return item.content;
      default:
        return item.content;
    }
  };

  const getSubtitleText = (): string => {
    switch (mode) {
      case 'typing':
        return item.extra?.translation || item.answer || '';
      case 'dictation':
        return '点击播放按钮听发音';
      case 'following':
        return item.extra?.translation || '';
      case 'speaking':
        return '请说出对应的英文';
      case 'pinyin':
        return '请输入拼音';
      case 'character-write':
        return item.extra?.translation || item.answer || '请在纸上写出汉字';
      case 'pinyin-read':
        return '请写出对应的汉字';
      case 'text-read':
        return '请跟读句子';
      case 'mental-math':
        return '请计算结果';
      case 'formula-memory':
        return '回忆公式内容';
      case 'knowledge-review':
        return '回忆知识点内容';
      default:
        return '';
    }
  };

  const correctAnswer = getCorrectAnswer();
  const questionText = getQuestionText();
  const subtitleText = getSubtitleText();

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const renderInputMode = (): React.ReactNode => (
    <>
      {mode === 'dictation' && (
        <button
          onClick={onPlayHint}
          className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: isPlaying
              ? 'rgba(34, 211, 238, 0.2)'
              : 'rgba(99, 102, 241, 0.12)',
            border: `2px solid ${isPlaying ? '#06B6D4' : '#6366F1'}`,
            boxShadow: isPlaying
              ? '0 0 30px rgba(34, 211, 238, 0.5)'
              : '0 0 20px rgba(99, 102, 241, 0.2)',
          }}
        >
          <Volume2
            className="w-7 h-7"
            style={{ color: isPlaying ? '#06B6D4' : '#6366F1' }}
          />
        </button>
      )}

      <div
        className="text-4xl md:text-5xl font-bold text-center mb-3 leading-tight"
        style={{ color: '#F1F5F9' }}
      >
        {questionText}
      </div>

      {subtitleText && (
        <p className="text-center text-base mb-8" style={{ color: '#94A3B8' }}>
          {subtitleText}
        </p>
      )}

      <div className="relative max-w-md mx-auto">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onInputChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={feedback !== null}
          placeholder="输入答案后按回车"
          className="w-full px-5 py-4 rounded-xl text-lg text-center outline-none transition-all"
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: `2px solid ${
              feedback === 'correct'
                ? '#06B6D4'
                : feedback === 'wrong'
                  ? '#EF476F'
                  : 'rgba(99, 102, 241, 0.25)'
            }`,
            color: '#F1F5F9',
          }}
        />
      </div>

      {feedback && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {feedback === 'correct' ? (
            <>
              <CheckCircle2 className="w-6 h-6" style={{ color: '#06B6D4' }} />
              <span className="text-lg font-semibold" style={{ color: '#06B6D4' }}>
                回答正确！
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6" style={{ color: '#EF476F' }} />
              <span className="text-lg font-semibold" style={{ color: '#EF476F' }}>
                回答错误
              </span>
              <span className="ml-2 text-base" style={{ color: '#F1F5F9' }}>
                正确答案：<strong>{correctAnswer}</strong>
              </span>
            </>
          )}
        </div>
      )}
    </>
  );

  const renderSelfJudgeMode = (): React.ReactNode => {
    const hasPlayButton = mode === 'following' || mode === 'text-read';
    const showFront = !showAnswer;

    return (
      <>
        {hasPlayButton && (
          <button
            onClick={onPlayHint}
            className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isPlaying
                ? 'rgba(34, 211, 238, 0.2)'
                : 'rgba(99, 102, 241, 0.12)',
              border: `2px solid ${isPlaying ? '#06B6D4' : '#6366F1'}`,
              boxShadow: isPlaying
                ? '0 0 30px rgba(34, 211, 238, 0.5)'
                : '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            {mode === 'following' ? (
              <Mic
                className="w-7 h-7"
                style={{ color: isPlaying ? '#06B6D4' : '#6366F1' }}
              />
            ) : (
              <Play
                className="w-7 h-7"
                style={{ color: isPlaying ? '#06B6D4' : '#6366F1' }}
              />
            )}
          </button>
        )}

        <div
          className="text-4xl md:text-5xl font-bold text-center mb-3 leading-tight"
          style={{ color: '#F1F5F9' }}
        >
          {showFront ? questionText : correctAnswer}
        </div>

        {subtitleText && showFront && (
          <p className="text-center text-base mb-6" style={{ color: '#94A3B8' }}>
            {subtitleText}
          </p>
        )}

        {!showFront && mode === 'following' && item.extra?.translation && (
          <p className="text-center text-lg mb-6" style={{ color: '#94A3B8' }}>
            {item.extra.translation}
          </p>
        )}

        {showFront && !feedback && (
          <button
            onClick={onReveal}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Eye className="w-4 h-4" />
            显示答案
          </button>
        )}

        {!showFront && !feedback && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => onSelfJudge(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background: 'rgba(239, 71, 111, 0.15)',
                color: '#EF476F',
                border: '1px solid rgba(239, 71, 111, 0.4)',
              }}
            >
              <X className="w-4 h-4" />
              记错了
            </button>
            <button
              onClick={() => onSelfJudge(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
                boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)',
              }}
            >
              <Check className="w-4 h-4" />
              我记住了
            </button>
          </div>
        )}

        {feedback && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {feedback === 'correct' ? (
              <>
                <CheckCircle2 className="w-6 h-6" style={{ color: '#06B6D4' }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: '#06B6D4' }}
                >
                  太棒了！
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6" style={{ color: '#EF476F' }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: '#EF476F' }}
                >
                  再接再厉
                </span>
              </>
            )}
          </div>
        )}
      </>
    );
  };

  const renderChoiceMode = (): React.ReactNode => {
    const options = item.extra?.options || [];
    const isTrueFalse = options.length === 0;
    const displayOptions = isTrueFalse ? ['对', '错'] : options;

    return (
      <>
        <div
          className="text-3xl md:text-4xl font-bold text-center mb-8 leading-tight"
          style={{ color: '#F1F5F9' }}
        >
          {questionText}
        </div>

        <div className="space-y-3 max-w-lg mx-auto">
          {displayOptions.map((option: string, index: number) => {
            const isSelected = selectedOption === option;
            const isCorrectOption =
              feedback !== null && option === correctAnswer;
            const isWrongSelected =
              feedback === 'wrong' && isSelected && option !== correctAnswer;

            let borderColor = 'rgba(99, 102, 241, 0.2)';
            let bgColor = 'rgba(99, 102, 241, 0.04)';

            if (isCorrectOption) {
              borderColor = '#06B6D4';
              bgColor = 'rgba(34, 211, 238, 0.15)';
            } else if (isWrongSelected) {
              borderColor = '#EF476F';
              bgColor = 'rgba(239, 71, 111, 0.15)';
            } else if (isSelected && !feedback) {
              borderColor = '#6366F1';
              bgColor = 'rgba(99, 102, 241, 0.12)';
            }

            return (
              <button
                key={index}
                onClick={() => !feedback && onOptionSelect(option)}
                disabled={feedback !== null}
                className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.01] flex items-center gap-4"
                style={{
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  color: '#F1F5F9',
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: isSelected ? '#6366F1' : 'rgba(99, 102, 241, 0.12)',
                    color: isSelected ? '#fff' : '#94A3B8',
                  }}
                >
                  {isTrueFalse ? (index === 0 ? '✓' : '✗') : String.fromCharCode(65 + index)}
                </span>
                <span className="text-base">{option}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {feedback === 'correct' ? (
              <>
                <CheckCircle2 className="w-6 h-6" style={{ color: '#06B6D4' }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: '#06B6D4' }}
                >
                  回答正确！
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6" style={{ color: '#EF476F' }} />
                <span
                  className="text-lg font-semibold"
                  style={{ color: '#EF476F' }}
                >
                  回答错误
                </span>
              </>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl p-8 md:p-12 transition-all duration-300"
      style={{
        background: '#FFFFFF',
        border: `2px solid ${getBorderColor()}`,
        boxShadow: getBoxShadow(),
      }}
    >
      {isInputMode(mode) && renderInputMode()}
      {isSelfJudgeMode(mode) && renderSelfJudgeMode()}
      {mode === 'choice' && renderChoiceMode()}
    </div>
  );
};

export default StudyCard;
