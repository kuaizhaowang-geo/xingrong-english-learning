import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, AlertTriangle } from 'lucide-react';
import RecordingWaveform from '../components/RecordingWaveform';
import ClickableSentence from '../components/ClickableSentence';
import SentenceWordDetailModal from '../components/SentenceWordDetailModal';
import { useSentenceWordDetail } from '../hooks/useSentenceWordDetail';
import SpeechScorePanel, {
  type SpeechScoreData,
} from '../components/SpeechScorePanel';

interface WatchSpeakPanelProps {
  translation: string;
  sentence: string;
  isRecording: boolean;
  isAnalyzing?: boolean;
  onRecordToggle: () => void;
  onRetry: () => void;
  hasRecorded: boolean;
  showAnswer: boolean;
  score: SpeechScoreData | null;
  highScore: number;
  recordingDuration?: number;
  hasPermissionError?: boolean;
  onRevealAnswer: () => void;
}

const WatchSpeakPanel: React.FC<WatchSpeakPanelProps> = ({
  translation,
  sentence,
  isRecording,
  isAnalyzing = false,
  onRecordToggle,
  onRetry,
  hasRecorded,
  showAnswer,
  score,
  highScore,
  recordingDuration = 0,
  hasPermissionError = false,
  onRevealAnswer,
}) => {
  const showScorePanel = Boolean(score) && !isAnalyzing;
  const { detailWord, detailLoading, activeWord, openWordDetail, closeWordDetail } = useSentenceWordDetail();
  const highlightSet = activeWord ? new Set<string>([activeWord]) : new Set<string>();

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 中文翻译大字显示 */}
      <div className="text-center w-full max-w-xl">
        <p className="text-xs text-[#6366F1] uppercase tracking-widest mb-2">
          看中文 · 说英文
        </p>
        <h2 className="text-2xl font-bold text-slate-800 leading-relaxed">
          {translation}
        </h2>
      </div>

      {/* 权限错误提示 */}
      <AnimatePresence>
        {hasPermissionError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-full max-w-md p-4 rounded-xl bg-[rgba(249_115_22_0.15)] border border-[rgba(249_115_22_0.3)] flex items-start gap-3"
          >
            <AlertTriangle size={20} className="text-[#F97316] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#F97316] mb-1">
                麦克风权限被拒绝
              </p>
              <p className="text-xs text-[#F97316]/70 leading-relaxed">
                需要麦克风权限才能进行发音评测，请在浏览器设置中允许本页面使用麦克风。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 评分面板（有分数时优先显示） */}
      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md"
          >
            <SpeechScorePanel
              data={{
                overall: 0,
                accuracy: 0,
                fluency: 0,
                completeness: 0,
                wordScores: [],
                suggestions: [],
              }}
              isAnalyzing
              onRetry={onRetry}
              highScore={highScore}
            />
          </motion.div>
        )}

        {showScorePanel && score && (
          <motion.div
            key="score"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md"
          >
            <SpeechScorePanel
              data={score}
              onRetry={onRetry}
              highScore={highScore}
              sentence={sentence}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 未评分时显示麦克风按钮 */}
      {!showScorePanel && !isAnalyzing && (
        <div className="py-1 flex flex-col items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onRecordToggle}
            className="relative w-[90px] h-[90px] rounded-full flex items-center justify-center transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* 光晕 */}
            {isRecording && (
              <motion.span
                className="absolute inset-0 rounded-full bg-[#6366F1] opacity-40"
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.15, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {/* 主按钮 */}
            <span
              className={`relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-md transition-all ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/40'
                  : 'bg-gradient-to-br from-[#6366F1] to-[#2563EB] shadow-[#6366F1]/40'
              }`}
            >
              <Mic size={32} className="text-white" />
            </span>
          </motion.button>

          {/* 波形动画 */}
          <div className="h-10">
            <RecordingWaveform
              isRecording={isRecording}
              durationSeconds={recordingDuration}
            />
          </div>

          <p className="text-center text-xs text-[#64748B] mt-0.5">
            {isRecording
              ? '正在录音...'
              : hasRecorded
                ? '点击重新录音'
                : '点击开始录音'}
          </p>

          {/* 录音后（无评分）显示答案入口 — 保留兼容逻辑，实际会走评分面板 */}
          {hasRecorded && !showAnswer && !score && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mt-2"
            >
              <button
                type="button"
                onClick={onRevealAnswer}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[rgba(124_58_237_0.15)] border border-[rgba(124_58_237_0.3)] text-[#6366F1] hover:bg-[rgba(124_58_237_0.25)] transition-colors text-sm font-medium"
              >
                显示英文原文
              </button>
            </motion.div>
          )}

          {hasRecorded && showAnswer && !score && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-[#64748B] text-center"
            >
              <ClickableSentence
                sentence={sentence}
                onWordClick={openWordDetail}
                highlightWords={highlightSet}
                wordColorClass="text-slate-800"
              />
            </motion.p>
          )}
        </div>
      )}

      <SentenceWordDetailModal
        wordDetail={detailWord}
        loading={detailLoading}
        onClose={closeWordDetail}
      />
    </div>
  );
};

export default WatchSpeakPanel;
