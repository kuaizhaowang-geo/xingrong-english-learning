import React, { useState } from 'react';
import { motion } from 'framer-motion';
import WordTagSystem from '@client/src/components/word-tag-system';
import RecordingButton from '@client/src/components/recording-button';
import SpeakingScorePanel from '@client/src/components/speaking-score-panel';
import type { WordParse } from '@shared/api.interface';
import { Volume2, Play } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { getSceneComponent } from '@client/src/components/ui/scene-illustrations/matcher';

interface ShadowingModeProps {
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  illustrationUrl?: string;
  showGrammarTags: boolean;
  showIllustration: boolean;
  onSpeak: () => void;
  speaking: boolean;
  isRecording: boolean;
  onRecordToggle: () => void;
  hasRecorded: boolean;
  accuracyScore: number;
  fluencyScore: number;
  overallScore: number;
  wordScores?: Array<{ word: string; score: number }>;
  imageError: boolean;
  onImageError: () => void;
}

const ShadowingMode: React.FC<ShadowingModeProps> = ({
  sentence,
  translation,
  wordParses,
  illustrationUrl,
  showGrammarTags,
  showIllustration,
  onSpeak,
  speaking,
  isRecording,
  onRecordToggle,
  hasRecorded,
  accuracyScore,
  fluencyScore,
  overallScore,
  wordScores = [],
  imageError,
  onImageError,
}) => {
  const SceneFallback = getSceneComponent(sentence);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {showIllustration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md h-28 rounded-2xl overflow-hidden border border-rose-500/30"
        >
          {illustrationUrl && !imageError ? (
            <Image
              src={illustrationUrl}
              alt="情景配图"
              className="w-full h-full object-cover opacity-50"
              onError={onImageError}
            />
          ) : (
            <SceneFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF2FF] via-[#EEF2FF]/40 to-transparent" />
        </motion.div>
      )}

      <div className="w-full max-w-2xl text-center">
        <p className="text-xs text-rose-500 uppercase tracking-widest mb-2">
          跟读练习 · Shadowing
        </p>
        <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-2">
          {sentence}
        </h2>
        <p className="text-sm text-slate-500">{translation}</p>
      </div>

      {showGrammarTags && wordParses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <WordTagSystem
            wordParses={wordParses}
            showPhonetic
            showPartOfSpeech
            showGrammarRole
            size="sm"
          />
        </motion.div>
      )}

      <button
        type="button"
        onClick={onSpeak}
        disabled={speaking}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-50"
      >
        <Volume2 size={18} />
        <span className="font-medium">{speaking ? '播放中...' : '播放原声'}</span>
      </button>

      {!hasRecorded && (
        <div className="py-4">
          <RecordingButton
            isRecording={isRecording}
            onClick={onRecordToggle}
            label="开始跟读"
            recordingLabel="跟读中..."
          />
          <p className="text-xs text-slate-500 text-center mt-3">
            听原声后，跟着朗读，系统会评测你的发音准确度和流利度
          </p>
        </div>
      )}

      {hasRecorded && overallScore > 0 && (
        <SpeakingScorePanel
          accuracyScore={accuracyScore}
          fluencyScore={fluencyScore}
          overallScore={overallScore}
          wordScores={wordScores}
        />
      )}

      {hasRecorded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          <button
            type="button"
            onClick={onRecordToggle}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-slate-600 hover:bg-indigo-100 transition-colors text-sm"
          >
            <Play size={14} />
            再读一次
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ShadowingMode;
