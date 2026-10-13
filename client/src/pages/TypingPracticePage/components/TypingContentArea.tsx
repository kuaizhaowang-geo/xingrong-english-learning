import React from 'react';
import { motion } from 'framer-motion';
import type {
  ChineseMode,
  EnglishMode,
  Language,
  ChineseChar,
  ChineseWord,
  ChineseSentence,
  EnglishWord,
  EnglishSentence,
} from '../data/typingData';
import {
  PinyinCharDisplay,
  CharByCharDisplay,
  EnglishTypingDisplay,
  FreePracticeDisplay,
} from './TypingContentDisplays';
import { removeTones } from '../utils/pinyinUtils';

interface TypingContentAreaProps {
  language: Language;
  zhMode: ChineseMode;
  enMode: EnglishMode;
  zhCharItem?: ChineseChar;
  zhWordItem?: ChineseWord;
  zhSentenceItem?: ChineseSentence;
  enLetter?: string;
  enWordItem?: EnglishWord;
  enSentenceItem?: EnglishSentence;
  freeInputText?: string;
  freeSpeed?: number;
  freeAccuracy?: number;
  userInput: string;
  charStates: Array<'correct' | 'wrong' | 'pending'>;
  currentCharIndex: number;
  feedback: 'none' | 'correct' | 'wrong';
  answerHidden: boolean;
  showPinyin: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

const FeedbackBadge: React.FC<{ feedback: 'none' | 'correct' | 'wrong' }> = ({ feedback }) => {
  if (feedback === 'none') return null;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`text-lg font-bold ${
        feedback === 'correct' ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      {feedback === 'correct' ? '✓ 正确！' : '✗ 错误'}
    </motion.div>
  );
};

const DifficultyBadge: React.FC<{ difficulty: 'easy' | 'medium' | 'hard'; label: string }> = ({
  difficulty,
  label,
}) => {
  const colorMap = {
    easy: 'text-emerald-400',
    medium: 'text-yellow-400',
    hard: 'text-rose-400',
  };
  const nameMap = { easy: '简单', medium: '中等', hard: '困难' };
  return (
    <div className={`text-xs ${colorMap[difficulty]}`}>
      难度：{nameMap[difficulty]}
      {label && <span className="text-slate-500 ml-2">{label}</span>}
    </div>
  );
};

const TypingContentArea: React.FC<TypingContentAreaProps> = ({
  language,
  zhMode,
  enMode,
  zhCharItem,
  zhWordItem,
  zhSentenceItem,
  enLetter,
  enWordItem,
  enSentenceItem,
  freeInputText = '',
  freeSpeed = 0,
  freeAccuracy = 100,
  userInput,
  charStates,
  currentCharIndex,
  feedback,
  answerHidden,
  showPinyin,
  difficulty,
}) => {
  // ─── 中文：拼音打字 ───────────────────────────────
  if (language === 'zh' && zhMode === 'pinyin' && zhCharItem) {
    const target = removeTones(zhCharItem.pinyin).toLowerCase();
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <DifficultyBadge difficulty={difficulty} label="拼音打字" />
        <PinyinCharDisplay
          char={zhCharItem.char}
          pinyin={zhCharItem.pinyin}
          showPinyin={showPinyin}
          input={userInput}
          states={charStates}
          target={target}
        />
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>部首：{zhCharItem.radical}</span>
          <span>笔画：{zhCharItem.strokes}</span>
        </div>
        <FeedbackBadge feedback={feedback} />
      </div>
    );
  }

  // ─── 中文：汉字打字（隐藏拼音） ──────────────────────
  if (language === 'zh' && zhMode === 'hanzi' && zhCharItem) {
    const target = removeTones(zhCharItem.pinyin).toLowerCase();
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        <DifficultyBadge difficulty={difficulty} label="汉字打字" />
        <PinyinCharDisplay
          char={zhCharItem.char}
          pinyin={zhCharItem.pinyin}
          showPinyin={false}
          input={userInput}
          states={charStates}
          target={target}
        />
        {!answerHidden && (
          <div className="text-sm text-violet-300">
            拼音：<span className="font-medium">{zhCharItem.pinyin}</span>
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>部首：{zhCharItem.radical}</span>
          <span>笔画：{zhCharItem.strokes}</span>
        </div>
        <FeedbackBadge feedback={feedback} />
      </div>
    );
  }

  // ─── 中文：词语打字 ───────────────────────────────
  if (language === 'zh' && zhMode === 'ciyu' && zhWordItem) {
    const chars = zhWordItem.word.split('');
    const pinyinTargets = zhWordItem.pinyin.map((py) => removeTones(py).toLowerCase());
    const charStartIndices: number[] = [0];
    let pos = 0;
    for (let i = 0; i < pinyinTargets.length - 1; i += 1) {
      pos += pinyinTargets[i].length;
      charStartIndices.push(pos);
    }
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <DifficultyBadge difficulty={difficulty} label="词语练习" />
        <div className="text-xs text-slate-500">逐字输入</div>
        <CharByCharDisplay
          chars={chars}
          pinyinList={zhWordItem.pinyin}
          showPinyin={showPinyin}
          currentIndex={currentCharIndex}
          charStates={charStates}
          userInput={userInput}
          charStartIndices={charStartIndices}
        />
        <div className="text-sm text-cyan-300">{zhWordItem.meaning}</div>
        <FeedbackBadge feedback={feedback === 'correct' ? 'correct' : 'none'} />
      </div>
    );
  }

  // ─── 中文：句子打字 ───────────────────────────────
  if (language === 'zh' && zhMode === 'juzi' && zhSentenceItem) {
    const chars = zhSentenceItem.sentence.split('');
    const pinyinTargets = zhSentenceItem.pinyin.map((py) => {
      if (/[\u3000-\u303F\uff00-\uffef，。！？、；：]/.test(py)) return py;
      return removeTones(py).toLowerCase();
    });
    const charStartIndices: number[] = [0];
    let pos = 0;
    for (let i = 0; i < pinyinTargets.length - 1; i += 1) {
      pos += pinyinTargets[i].length;
      charStartIndices.push(pos);
    }
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <DifficultyBadge difficulty={difficulty} label="句子练习" />
        <div className="text-xs text-slate-500">逐字输入</div>
        <CharByCharDisplay
          chars={chars}
          pinyinList={zhSentenceItem.pinyin}
          showPinyin={showPinyin}
          currentIndex={currentCharIndex}
          charStates={charStates}
          userInput={userInput}
          charStartIndices={charStartIndices}
        />
        <div className="text-sm text-cyan-300 text-center max-w-md">
          {zhSentenceItem.meaning}
        </div>
        <FeedbackBadge feedback={feedback === 'correct' ? 'correct' : 'none'} />
      </div>
    );
  }

  // ─── 中文：自由练习 ───────────────────────────────
  if (language === 'zh' && zhMode === 'ziyou') {
    return (
      <FreePracticeDisplay
        inputText={freeInputText}
        speed={freeSpeed}
        accuracy={freeAccuracy}
      />
    );
  }

  // ─── 英文：字母练习 ───────────────────────────────
  if (language === 'en' && enMode === 'letter' && enLetter) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <DifficultyBadge difficulty={difficulty} label="字母练习" />
        <EnglishTypingDisplay
          text={enLetter}
          userInput={userInput}
          charStates={charStates}
          answerHidden={answerHidden}
        />
        <FeedbackBadge feedback={feedback} />
      </div>
    );
  }

  // ─── 英文：单词练习 ───────────────────────────────
  if (language === 'en' && enMode === 'word' && enWordItem) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <DifficultyBadge difficulty={difficulty} label="单词练习" />
        <div className="text-sm text-cyan-300">{enWordItem.meaning}</div>
        <EnglishTypingDisplay
          text={enWordItem.word}
          userInput={userInput}
          charStates={charStates}
          answerHidden={answerHidden}
          subText={answerHidden ? '' : enWordItem.phonetic}
        />
        <FeedbackBadge feedback={feedback} />
      </div>
    );
  }

  // ─── 英文：句子练习 ───────────────────────────────
  if (language === 'en' && enMode === 'sentence' && enSentenceItem) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <DifficultyBadge difficulty={difficulty} label="句子练习" />
        <div className="text-sm text-cyan-300 text-center max-w-md">
          {enSentenceItem.meaning}
        </div>
        <EnglishTypingDisplay
          text={enSentenceItem.sentence}
          userInput={userInput}
          charStates={charStates}
          answerHidden={answerHidden}
        />
        <FeedbackBadge feedback={feedback} />
      </div>
    );
  }

  return <div className="text-slate-500">加载中...</div>;
};

export default TypingContentArea;
