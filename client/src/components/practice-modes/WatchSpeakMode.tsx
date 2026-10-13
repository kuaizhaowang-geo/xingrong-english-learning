import React from 'react';
import { motion } from 'framer-motion';
import WordTagSystem from '@client/src/components/word-tag-system';
import RecordingButton from '@client/src/components/recording-button';
import type { WordParse } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import { Eye } from 'lucide-react';
import { getSceneComponent } from '@client/src/components/ui/scene-illustrations/matcher';

interface WatchSpeakModeProps {
  sentence: string;
  translation: string;
  wordParses: WordParse[];
  illustrationUrl?: string;
  showGrammarTags: boolean;
  showIllustration: boolean;
  isRecording: boolean;
  onRecordToggle: () => void;
  showAnswer: boolean;
  onRevealAnswer: () => void;
  imageError: boolean;
  onImageError: () => void;
  hasRecorded: boolean;
}

const WatchSpeakMode: React.FC<WatchSpeakModeProps> = ({
  sentence,
  translation,
  wordParses,
  illustrationUrl,
  showGrammarTags,
  showIllustration,
  isRecording,
  onRecordToggle,
  showAnswer,
  onRevealAnswer,
  imageError,
  onImageError,
  hasRecorded,
}) => {
  const SceneFallback = getSceneComponent(sentence);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {showIllustration && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md h-32 rounded-2xl overflow-hidden border border-amber-500/30"
        >
          {illustrationUrl && !imageError ? (
            <Image
              src={illustrationUrl}
              alt="情景配图"
              className="w-full h-full object-cover opacity-60"
              onError={onImageError}
            />
          ) : (
            <SceneFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#EEF2FF] via-[#EEF2FF]/40 to-transparent" />
        </motion.div>
      )}

      <div className="text-center w-full max-w-xl">
        <p className="text-sm text-amber-600 uppercase tracking-widest mb-2">
          看中文 · 说英文
        </p>
        <h2 className="text-2xl font-bold text-slate-800 leading-relaxed">
          {translation}
        </h2>
      </div>

      <div className="py-6">
        <RecordingButton
          isRecording={isRecording}
          onClick={onRecordToggle}
          label={hasRecorded ? '重新录音' : '开始录音'}
          recordingLabel="正在录音..."
        />
      </div>

      {hasRecorded && !showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm text-slate-500">录音完成，查看答案对照</p>
          <button
            type="button"
            onClick={onRevealAnswer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 hover:bg-violet-100 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            显示英文原文
          </button>
        </motion.div>
      )}

      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 backdrop-blur-sm">
            <p className="text-xs text-violet-600 uppercase tracking-wider mb-2">
              English Original
            </p>
            <p className="text-xl font-bold text-slate-800 leading-relaxed mb-3">
              {sentence}
            </p>
            <p className="text-sm text-slate-500">{translation}</p>
          </div>

          {showGrammarTags && wordParses.length > 0 && (
            <div className="mt-5">
              <WordTagSystem
                wordParses={wordParses}
                showPhonetic
                showPartOfSpeech
                showGrammarRole
              />
            </div>
          )}
        </motion.div>
      )}

      {hasRecorded && showAnswer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
            <p className="text-sm text-slate-500">
              对照原文检查自己的发音和表达是否准确
            </p>
        </motion.div>
      )}
    </div>
  );
};

export default WatchSpeakMode;
