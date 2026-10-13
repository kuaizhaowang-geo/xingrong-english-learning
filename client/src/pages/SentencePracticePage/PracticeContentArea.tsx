import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WordTagSystem from '@client/src/components/word-tag-system';
import type { WordParse } from '@shared/api.interface';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import TypingSentenceDisplay from './mode-panels/TypingSentenceDisplay';
import DictationInputArea from './mode-panels/DictationInputArea';
import WatchSpeakPanel from './mode-panels/WatchSpeakPanel';
import ShadowingPanel from './mode-panels/ShadowingPanel';
import WordRearrangePanel from './mode-panels/WordRearrangePanel';
import { Image } from '@client/src/components/ui/image';
import { getSceneComponent } from '@client/src/components/ui/scene-illustrations/matcher';

interface PracticeContentAreaProps {
  mode: PracticeMode;
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  illustrationUrl?: string;
  showGrammarTags: boolean;
  showIllustration: boolean;
  phoneticVisible?: boolean;
  partOfSpeechVisible?: boolean;
  wordRearrangeMode?: boolean;
  imageError: boolean;
  onImageError: () => void;
  sentenceType?: string;
  grammarAnalysis?: string;
  // Typing mode
  userInput?: string;
  completedWords?: number;
  answerHidden?: boolean;
  feedback?: 'none' | 'correct' | 'wrong';
  wrongAttempts?: number;
  showHint?: boolean;
  // Typing mode v2
  progress?: number;
  targetOrigIndexes?: number[];
  totalTargetChars?: number;
  wrongMarker?: number | null;
  // Dictation mode
  dictationWordInputs?: string[];
  dictationCurrentWordIdx?: number;
  dictationShowAnswer?: boolean;
  onDictationWordChange?: (idx: number, value: string) => void;
  onDictationWordKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => void;
  dictationInputRefs?: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onDictationSpeak?: () => void;
  onDictationReveal?: () => void;
  // Watch-speak mode
  isRecording?: boolean;
  isAnalyzing?: boolean;
  onRecordToggle?: () => void;
  onRetryRecording?: () => void;
  watchSpeakHasRecorded?: boolean;
  watchSpeakShowAnswer?: boolean;
  watchSpeakScore?: import('./components/SpeechScorePanel').SpeechScoreData | null;
  onWatchSpeakReveal?: () => void;
  // Shadowing mode
  onSpeak?: () => void;
  speaking?: boolean;
  shadowingHasRecorded?: boolean;
  shadowingScore?: import('./components/SpeechScorePanel').SpeechScoreData | null;
  // Shared recording
  recordingHighScore?: number;
  recordingDuration?: number;
  hasPermissionError?: boolean;
  // Word rearrange mode
  onRearrangeSubmit?: (words: string[]) => void;
  onRearrangeReset?: () => void;
  rearrangeDisabled?: boolean;
}

const SENTENCE_TYPE_LABELS: Record<string, string> = {
  simple: '简单句',
  compound: '并列句',
  complex: '复合句',
};

const PracticeContentArea: React.FC<PracticeContentAreaProps> = ({
  mode,
  sentence,
  translation,
  wordParses,
  illustrationUrl,
  showGrammarTags,
  showIllustration,
  phoneticVisible = true,
  partOfSpeechVisible = true,
  wordRearrangeMode = false,
  imageError,
  onImageError,
  sentenceType,
  grammarAnalysis,
  userInput = '',
  completedWords = 0,
  answerHidden = false,
  feedback = 'none',
  wrongAttempts = 0,
  showHint = false,
  progress = 0,
  targetOrigIndexes = [],
  totalTargetChars = 0,
  wrongMarker = null,
  dictationWordInputs = [],
  dictationCurrentWordIdx = 0,
  dictationShowAnswer = false,
  onDictationWordChange,
  onDictationWordKeyDown,
  dictationInputRefs,
  onDictationSpeak,
  onDictationReveal,
  isRecording = false,
  isAnalyzing = false,
  onRecordToggle,
  onRetryRecording,
  watchSpeakHasRecorded = false,
  watchSpeakShowAnswer = false,
  watchSpeakScore = null,
  onWatchSpeakReveal,
  onSpeak,
  speaking = false,
  shadowingHasRecorded = false,
  shadowingScore = null,
  recordingHighScore = 0,
  recordingDuration = 0,
  hasPermissionError = false,
  onRearrangeSubmit,
  onRearrangeReset,
  rearrangeDisabled = false,
}) => {
  const [localImgError, setLocalImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const BAD_URL_PATTERNS = [/ve_miaoda/i, /model_error/i];
  const isBadUrl = (url: string | undefined): boolean => {
    if (!url) return true;
    return BAD_URL_PATTERNS.some((p) => p.test(url));
  };
  const effectiveIllustration = isBadUrl(illustrationUrl) ? null : illustrationUrl;

  useEffect(() => {
    setLocalImgError(false);
    setImgLoading(true);
  }, [illustrationUrl]);

  const showFallback = !effectiveIllustration || localImgError || imageError;
  const SceneComp = getSceneComponent(sentence);

  const showTags = showGrammarTags && wordParses.length > 0;
  const isChineseMain = mode === 'watch-speak';

  const grammarLabel = sentenceType
    ? SENTENCE_TYPE_LABELS[sentenceType] || sentenceType
    : '';

  const isChineseChar = sentenceType === 'chinese-char';
  const isMathTopic = sentenceType === 'math-topic';

  const chineseMeta = isChineseChar && grammarAnalysis
    ? (() => {
        try { return JSON.parse(grammarAnalysis) as { character: string; pinyin: string; radical: string; strokes: number; meaning: string; partOfSpeech: string }; } catch { return null; }
      })()
    : null;

  const mathMeta = isMathTopic && grammarAnalysis
    ? (() => {
        try { return JSON.parse(grammarAnalysis) as { title: string; domain: string; description: string; keyPoints: string }; } catch { return null; }
      })()
    : null;

  return (
<>
       <div className="flex flex-col items-center w-full px-4 pt-1 pb-0 bg-transparent">
        {/* 1. 场景插图 */}
        {showIllustration && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
              className="relative w-[318px] h-[138px] rounded-xl overflow-hidden border border-fuchsia-500/20 flex-shrink-0 flex items-center justify-center bg-white/5"
            style={{
              marginBottom: '6px',
            }}
          >
            {/* 骨架屏 */}
            {imgLoading && showFallback === false && (
              <div
                 className="absolute inset-0 animate-pulse bg-white/[0.05]"
              />
            )}
            {/* 真实图片 */}
            {!showFallback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <Image
                  src={effectiveIllustration as string}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => {
                    setLocalImgError(true);
                    if (onImageError) onImageError();
                  }}
                  onLoad={() => setImgLoading(false)}
                />
              </motion.div>
            )}
            {/* SVG 场景兜底 */}
            {showFallback && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <SceneComp />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* 2. 学科信息卡 (语文生字 / 数学知识点) */}
        {isChineseChar && chineseMeta && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mb-2 px-4 py-3 rounded-xl bg-[rgba(124_58_237_0.12)] border border-[rgba(124_58_237_0.3)] flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-800">{chineseMeta.character}</span>
              <span className="text-base text-[#06B6D4] font-medium">{chineseMeta.pinyin}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B]">
              {chineseMeta.radical && <span>部首：<span className="text-[#A855F7]">{chineseMeta.radical}</span></span>}
              {chineseMeta.strokes !== undefined && <span>笔画：<span className="text-[#2563EB]">{chineseMeta.strokes}画</span></span>}
              {chineseMeta.partOfSpeech && <span>词性：<span className="text-[#F97316]">{chineseMeta.partOfSpeech}</span></span>}
            </div>
            {chineseMeta.meaning && (
  <div className="text-sm text-slate-600 mt-0.5">
                 释义：{chineseMeta.meaning}
              </div>
            )}
          </motion.div>
        )}

        {isMathTopic && mathMeta && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mb-2 px-4 py-3 rounded-xl bg-[rgba(59_130_246_0.12)] border border-[rgba(59_130_246_0.3)] flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-slate-800">{mathMeta.title}</span>
              {mathMeta.domain && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-[rgba(59_130_246_0.3)] text-[#93C5FD]">
                  {mathMeta.domain}
                </span>
              )}
            </div>
            {mathMeta.description && (
              <div className="text-sm text-slate-600">{mathMeta.description}</div>
            )}
            {mathMeta.keyPoints && (
              <div className="text-xs text-[#06B6D4] whitespace-pre-line">
                💡 {mathMeta.keyPoints}
              </div>
            )}
          </motion.div>
        )}

        {/* 3. 音标/词性标签 (在句子上方，仅非打字模式显示，打字模式已内嵌到单词行) */}
        {showTags && mode !== 'watch-speak' && mode !== 'dictation' && mode !== 'typing' && !isChineseChar && !isMathTopic && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex-shrink-0"
             style={{ marginBottom: '4px' }}
           >
             <WordTagSystem
               wordParses={wordParses}
               showPhonetic
               showPartOfSpeech
               showGrammarRole={false}
               size="xs"
             />
           </motion.div>
        )}

        {/* 3. 英文句子/模式特定显示区 */}
        <div className="w-full flex-shrink-0" style={{ marginBottom: '4px' }}>
          {mode === 'typing' && wordRearrangeMode && (
            <WordRearrangePanel
              sentence={sentence}
              translation={translation}
              feedback={feedback}
              onSubmit={onRearrangeSubmit || (() => {})}
              onReset={onRearrangeReset || (() => {})}
              disabled={rearrangeDisabled}
            />
          )}

          {mode === 'typing' && !wordRearrangeMode && (
            <TypingSentenceDisplay
               sentence={sentence}
               userInput={userInput}
               completedWords={completedWords}
               answerHidden={answerHidden}
               feedback={feedback}
               progress={progress}
               targetOrigIndexes={targetOrigIndexes}
               totalTargetChars={totalTargetChars}
               wrongMarker={wrongMarker}
               wordParses={wordParses}
               showPhonetic={phoneticVisible && showGrammarTags}
               showPartOfSpeech={partOfSpeechVisible && showGrammarTags}
               wordRearrangeMode={wordRearrangeMode}
             />
          )}

          {mode === 'dictation' && (
            <DictationInputArea
              sentence={sentence}
              wordInputs={dictationWordInputs}
              currentWordIdx={dictationCurrentWordIdx}
              showAnswer={dictationShowAnswer}
              feedback={feedback}
              onWordChange={onDictationWordChange || (() => {})}
              onWordKeyDown={onDictationWordKeyDown || (() => {})}
              inputRefs={dictationInputRefs}
              onSpeak={onDictationSpeak || (() => {})}
              onReveal={onDictationReveal || (() => {})}
            />
          )}

          {mode === 'watch-speak' && (
            <WatchSpeakPanel
              translation={translation}
              sentence={sentence}
              isRecording={isRecording}
              isAnalyzing={isAnalyzing}
              onRecordToggle={onRecordToggle || (() => {})}
              onRetry={onRetryRecording || (() => {})}
              hasRecorded={watchSpeakHasRecorded}
              showAnswer={watchSpeakShowAnswer}
              score={watchSpeakScore}
              highScore={recordingHighScore}
              recordingDuration={recordingDuration}
              hasPermissionError={hasPermissionError}
              onRevealAnswer={onWatchSpeakReveal || (() => {})}
            />
          )}

          {mode === 'shadowing' && (
            <ShadowingPanel
              sentence={sentence}
              onSpeak={onSpeak || (() => {})}
              speaking={speaking}
              isRecording={isRecording}
              isAnalyzing={isAnalyzing}
              onRecordToggle={onRecordToggle || (() => {})}
              onRetry={onRetryRecording || (() => {})}
              score={shadowingScore}
              highScore={recordingHighScore}
              recordingDuration={recordingDuration}
              hasPermissionError={hasPermissionError}
            />
          )}
        </div>

         {/* 4. 语法成分标签（句子下方） */}
         {showGrammarTags && (
           <motion.div
             initial={{ opacity: 0, y: -4 }}
             animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 flex-shrink-0"
            style={{ marginBottom: '8px' }}
           >
             {grammarLabel && (
               <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 text-[11px] font-medium border border-fuchsia-500/15">
                 {grammarLabel}
               </span>
             )}
             {grammarAnalysis && !isChineseChar && !isMathTopic && (
                <span className="px-2.5 py-0.5 rounded-full bg-[rgba(59_130_246_0.15)] text-[#2563EB] text-[11px] font-medium border border-[rgba(59_130_246_0.3)]">
                 {grammarAnalysis}
               </span>
             )}
           </motion.div>
         )}

         {/* 5. 中文翻译 */}
         {!isChineseMain && (
            <p
               className="text-sm text-[#64748B] text-center flex-shrink-0"
               style={{ marginBottom: '8px' }}
             >
               {translation}
           </p>
         )}

        {/* 6. 模式特定输入区（打字模式无额外输入区） */}
        {mode === 'typing' && <div style={{ marginBottom: '4px' }} />}

         {mode === 'typing' && feedback === 'wrong' && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-center flex-shrink-0"
            style={{ marginBottom: '8px' }}
           >
              <p className="text-sm font-bold text-[#EF476F]">还需加油</p>
  <p className="text-xs text-[#64748B] mt-0.5">
                  正确答案：<span className="text-[#6366F1] font-medium">{sentence}</span>
             </p>
           </motion.div>
         )}

         {mode === 'typing' && showHint && feedback === 'none' && !answerHidden && (
  <p className="text-xs text-[#64748B] flex-shrink-0" style={{ marginBottom: '8px' }}>
                提示：
               <span className="text-[#6366F1] font-medium">
               {sentence.split(' ')[completedWords]}
             </span>
           </p>
         )}
      </div>
</>
);
};

export default PracticeContentArea;
