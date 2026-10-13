import React, { useState } from 'react';
import {
  Settings,
  List,
  Layers,
  Pause,
  RotateCcw,
  Flag,
  Play,
  ArrowLeft,
  Clock,
  Zap,
} from 'lucide-react';
import type { PracticeMode } from '@client/src/components/practice-toolbar';

const MODE_NAMES: Record<PracticeMode, string> = {
  'watch-speak': '中译英',
  dictation: '听力模式',
  typing: '打字练习',
  shadowing: '口语练习',
};

import SettingsModal from './modals/SettingsModal';
import SentenceListModal from './modals/SentenceListModal';
import ModeSelectorModal from './modals/ModeSelectorModal';
import { ResetConfirmModal, FeedbackModal } from './modals/ActionModals';

interface PracticeTopBarProps {
  onBack: () => void;
  unitTitle: string;
  textbookTitle: string;
  progress: { current: number; total: number };
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onResetProgress: () => void;
  settings: {
    selectedVoice: string;
    speechRate: number;
    soundEffectsEnabled: boolean;
    keyboardVisible: boolean;
    fingerGuideEnabled: boolean;
    autoSpeakEnabled: boolean;
    letterSpeakEnabled: boolean;
    autoNextEnabled: boolean;
    soundVolume: number;
    animationLevel: string;
    rememberMode: boolean;
    phoneticVisible: boolean;
    partOfSpeechVisible: boolean;
    showGrammarTags: boolean;
    showIllustration: boolean;
    wordRearrangeMode: boolean;
  };
  onSettingsChange: (key: string, value: unknown) => void;
  sentenceList: Array<{ id: string; sentence: string; translation: string }>;
  currentIndex: number;
  onJumpTo: (index: number) => void;
  currentSentence: string;
  currentTranslation: string;
  onSubmitFeedback: (data: {
    errorType: string;
    description: string;
  }) => void;
  masteryMap: Record<string, 'mastered' | 'review'>;
  completedSet: Set<string>;
  onBatchMastered: () => void;
  onBatchUnfamiliar: () => void;
  elapsedSeconds: number;
  score: number;
}

const IconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}> = ({ icon, label, onClick, active, badge }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
      active
        ? 'bg-gradient-to-br from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/40'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    {badge !== undefined && (
       <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] rounded-full bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white leading-none flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const TextIconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}> = ({ icon, label, onClick, active, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative h-7 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition-all ${
      active
        ? 'bg-gradient-to-br from-[#6366F1] to-[#2563EB] text-white shadow-sm shadow-[#6366F1]/40'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && (
      <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 text-[9px] rounded-full bg-gradient-to-r from-[#EF476F] to-[#F97316] text-white leading-none flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const PracticeTopBar: React.FC<PracticeTopBarProps> = ({
  onBack,
  unitTitle,
  textbookTitle,
  progress,
  currentMode,
  onModeChange,
  isPaused,
  onPauseToggle,
  onResetProgress,
  settings,
  onSettingsChange,
  sentenceList,
  currentIndex,
  onJumpTo,
  currentSentence,
  currentTranslation,
  onSubmitFeedback,
  masteryMap,
  completedSet,
  onBatchMastered,
  onBatchUnfamiliar,
  elapsedSeconds,
  score,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
       <div className="px-3 py-1 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
         {/* 第一行：标题 + 控件 */}
         <div className="flex items-center justify-between">
          {/* 左侧：返回按钮 + 标题 + 副标题 */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
                title="返回"
              >
                <ArrowLeft size={16} />
             </button>
              <div className="flex flex-col min-w-0 leading-tight">
                 <span className="text-sm font-semibold text-white truncate">
                   {unitTitle || '综合练习'}
                   <span className="text-[11px] font-medium text-fuchsia-400 ml-1">
                    ({progress.current}/{progress.total})
                  </span>
                </span>
                 <span className="text-[11px] text-slate-400 truncate">
                  {textbookTitle || '句子练习'}
                </span>
              </div>
          </div>

           {/* 右侧：计时器 + 得分 + 文字+图标按钮 */}
           <div className="flex items-center gap-0.5 flex-shrink-0">
             <div className="flex items-center gap-1 mr-1 px-2 py-0.5 rounded-md bg-white/5 border border-fuchsia-500/20">
               <Zap size={13} className="text-[#FFD166]" />
               <span className="text-xs font-mono text-[#FFD166] tabular-nums font-semibold whitespace-nowrap">
                 {score}
               </span>
             </div>
             <div className="flex items-center gap-1 mr-1">
               <Clock size={13} className="text-[#6366F1]" />
               <span className="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                 {formatTime(elapsedSeconds)}
               </span>
             </div>
             <TextIconButton
               icon={<Settings size={14} />}
               label="设置"
               onClick={() => setShowSettings(true)}
             />
             <TextIconButton
               icon={<List size={14} />}
               label="学习内容"
               onClick={() => setShowList(true)}
               badge={progress.total}
             />
             <TextIconButton
               icon={<Layers size={14} />}
               label="练习模式"
               onClick={() => setShowModeSelector(true)}
               active
             />
             <TextIconButton
               icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
               label={isPaused ? '继续练习' : '暂停练习'}
               onClick={onPauseToggle}
             />
             <TextIconButton
               icon={<RotateCcw size={14} />}
               label="重置进度"
               onClick={() => setShowResetConfirm(true)}
             />
             <TextIconButton
               icon={<Flag size={14} />}
               label="报告错误"
               onClick={() => setShowFeedback(true)}
             />
           </div>
        </div>

       </div>

      {/* Modals */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        selectedVoice={settings.selectedVoice}
        speechRate={settings.speechRate}
        onVoiceChange={(v: string) => onSettingsChange('selectedVoice', v)}
        onSpeechRateChange={(v: number) => onSettingsChange('speechRate', v)}
        autoSpeakEnabled={settings.autoSpeakEnabled}
        onAutoSpeakChange={(v: boolean) => onSettingsChange('autoSpeakEnabled', v)}
        letterSpeakEnabled={settings.letterSpeakEnabled}
        onLetterSpeakChange={(v: boolean) => onSettingsChange('letterSpeakEnabled', v)}
        autoNextEnabled={settings.autoNextEnabled}
        onAutoNextChange={(v: boolean) => onSettingsChange('autoNextEnabled', v)}
        soundEffectsEnabled={settings.soundEffectsEnabled}
        onSoundEffectsChange={(v: boolean) => onSettingsChange('soundEffectsEnabled', v)}
        soundVolume={settings.soundVolume}
        onSoundVolumeChange={(v: number) => onSettingsChange('soundVolume', v)}
        animationLevel={settings.animationLevel as 'off' | 'simple' | 'standard' | 'rich'}
        onAnimationLevelChange={(v: string) => onSettingsChange('animationLevel', v)}
        rememberMode={settings.rememberMode}
        onRememberModeChange={(v: boolean) => onSettingsChange('rememberMode', v)}
        keyboardVisible={settings.keyboardVisible}
        onKeyboardVisibleChange={(v: boolean) => onSettingsChange('keyboardVisible', v)}
        phoneticVisible={settings.phoneticVisible}
        onPhoneticVisibleChange={(v: boolean) => onSettingsChange('phoneticVisible', v)}
        partOfSpeechVisible={settings.partOfSpeechVisible}
        onPartOfSpeechVisibleChange={(v: boolean) => onSettingsChange('partOfSpeechVisible', v)}
        showGrammarTags={settings.showGrammarTags}
        onToggleGrammarTags={() => onSettingsChange('showGrammarTags', !settings.showGrammarTags)}
        showIllustration={settings.showIllustration}
        onToggleIllustration={() => onSettingsChange('showIllustration', !settings.showIllustration)}
        wordRearrangeMode={settings.wordRearrangeMode}
        onToggleWordRearrange={() => onSettingsChange('wordRearrangeMode', !settings.wordRearrangeMode)}
        fingerGuideEnabled={settings.fingerGuideEnabled}
        onFingerGuideChange={(v: boolean) => onSettingsChange('fingerGuideEnabled', v)}
      />

      <SentenceListModal
        open={showList}
        onClose={() => setShowList(false)}
        sentenceList={sentenceList}
        currentIndex={currentIndex}
        onJumpTo={onJumpTo}
        masteryMap={masteryMap}
        completedSet={completedSet}
        onBatchMastered={onBatchMastered}
        onBatchUnfamiliar={onBatchUnfamiliar}
      />

      <ModeSelectorModal
        open={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        currentMode={currentMode}
        onModeChange={onModeChange}
      />

      <ResetConfirmModal
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={onResetProgress}
      />

      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        currentSentence={currentSentence}
        currentTranslation={currentTranslation}
        onSubmit={onSubmitFeedback}
      />
    </>
  );
};

export default PracticeTopBar;
