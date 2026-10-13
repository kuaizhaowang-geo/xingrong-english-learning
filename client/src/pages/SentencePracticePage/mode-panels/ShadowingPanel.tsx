import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, AlertTriangle } from 'lucide-react';
import RecordingWaveform from '../components/RecordingWaveform';
import ClickableSentence from '../components/ClickableSentence';
import SentenceWordDetailModal from '../components/SentenceWordDetailModal';
import { useSentenceWordDetail } from '../hooks/useSentenceWordDetail';
import SpeechScorePanel, {
  type SpeechScoreData,
} from '../components/SpeechScorePanel';

interface ShadowingPanelProps {
  sentence: string;
  onSpeak: () => void;
  speaking: boolean;
  isRecording: boolean;
  isAnalyzing?: boolean;
  onRecordToggle: () => void;
  onRetry: () => void;
  score: SpeechScoreData | null;
  highScore: number;
  recordingDuration?: number;
  hasPermissionError?: boolean;
}

const ShadowingPanel: React.FC<ShadowingPanelProps> = ({
  sentence,
  onSpeak,
  speaking,
  isRecording,
  isAnalyzing = false,
  onRecordToggle,
  onRetry,
  score,
  highScore,
  recordingDuration = 0,
  hasPermissionError = false,
}) => {
  const showScorePanel = Boolean(score) && !isAnalyzing;
  const showRecordingState = isRecording || isAnalyzing;
  const { detailWord, detailLoading, activeWord, openWordDetail, closeWordDetail } = useSentenceWordDetail();
  const highlightSet = activeWord ? new Set<string>([activeWord]) : new Set<string>();

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 播放原文 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSpeak}
          disabled={isRecording || isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(59_130_246_0.15)] border border-[rgba(59_130_246_0.3)] text-[#2563EB] hover:bg-[rgba(59_130_246_0.25)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Volume2 size={16} className={speaking ? 'animate-pulse' : ''} />
          {speaking ? '播放中...' : '播放原文'}
        </button>
      </div>

      {/* 英文句子完整显示 */}
      <div className="text-center w-full max-w-2xl">
        <p className="text-xs text-[#6366F1] uppercase tracking-widest mb-2">
          跟读句子
        </p>
        <h2 className="text-xl font-bold text-slate-800 leading-relaxed tracking-wide">
          <ClickableSentence
            sentence={sentence}
            onWordClick={openWordDetail}
            highlightWords={highlightSet}
            wordColorClass="text-slate-800"
          />
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

      {/* 麦克风 + 波形区域 */}
      {!showScorePanel && (
        <div className="py-1 flex flex-col items-center gap-2">
          <motion.button
            type="button"
            onClick={onRecordToggle}
            disabled={isAnalyzing}
            className="relative w-[90px] h-[90px] rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed"
            whileHover={!isRecording && !isAnalyzing ? { scale: 1.05 } : {}}
            whileTap={!isAnalyzing ? { scale: 0.95 } : {}}
          >
            {/* 录音时光晕 */}
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
                  : isAnalyzing
                    ? 'bg-gradient-to-br from-[#6366F1]/60 to-[#2563EB]/60 shadow-[#6366F1]/20'
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

          <p className="text-center text-xs text-[#64748B]">
            {isRecording
              ? '正在录音...'
              : isAnalyzing
                ? '分析中...'
                : score
                  ? '点击重新跟读'
                  : '点击开始跟读'}
          </p>
        </div>
      )}

      {/* 评分面板 */}
      <AnimatePresence mode="wait">
        {isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
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
            className="w-full"
          >
            <SpeechScorePanel
              data={score}
              onRetry={onRetry}
              highScore={highScore}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分析/评分状态下隐藏录制提示，避免重复 */}
      {!showRecordingState && !showScorePanel && !score && null}

      <SentenceWordDetailModal
        wordDetail={detailWord}
        loading={detailLoading}
        onClose={closeWordDetail}
      />
    </div>
  );
};

export default ShadowingPanel;
