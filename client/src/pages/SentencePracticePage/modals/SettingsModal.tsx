import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Mic,
  ChevronDown,
  ChevronUp,
  Zap,
  Monitor,
  Dumbbell,
  Layers,
  Lightbulb,
  SpellCheck,
  Hash,
  Tags,
  Image,
  Shuffle,
  MousePointerClick,
  Sparkles,
  Save,
} from 'lucide-react';
import ModalShell from '../PracticeModalShell';

// ─── Types ────────────────────────────────────────────────────────────────

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;

  // 语音设置
  selectedVoice: string;
  speechRate: number;
  autoSpeakEnabled: boolean;
  letterSpeakEnabled: boolean;
  onVoiceChange: (v: string) => void;
  onSpeechRateChange: (v: number) => void;
  onAutoSpeakChange: (v: boolean) => void;
  onLetterSpeakChange: (v: boolean) => void;

  // 交互设置
  autoNextEnabled: boolean;
  soundEffectsEnabled: boolean;
  soundVolume: number;
  animationLevel: 'off' | 'simple' | 'standard' | 'rich';
  rememberMode: boolean;
  onAutoNextChange: (v: boolean) => void;
  onSoundEffectsChange: (v: boolean) => void;
  onSoundVolumeChange: (v: number) => void;
  onAnimationLevelChange: (v: string) => void;
  onRememberModeChange: (v: boolean) => void;

  // 显示设置
  keyboardVisible: boolean;
  phoneticVisible: boolean;
  partOfSpeechVisible: boolean;
  showGrammarTags: boolean;
  showIllustration: boolean;
  onKeyboardVisibleChange: (v: boolean) => void;
  onPhoneticVisibleChange: (v: boolean) => void;
  onPartOfSpeechVisibleChange: (v: boolean) => void;
  onToggleGrammarTags: () => void;
  onToggleIllustration: () => void;

  // 练习设置
  wordRearrangeMode: boolean;
  fingerGuideEnabled: boolean;
  onToggleWordRearrange: () => void;
  onFingerGuideChange: (v: boolean) => void;
}

type AnimationLevel = 'off' | 'simple' | 'standard' | 'rich';

// ─── Toggle Switch (clean style) ──────────────────────────────────────────

const SwitchToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
}> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${
     checked
       ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB]'
       : 'bg-[#E0E7FF]'
    }`}
  >
    <motion.div
      animate={{ x: checked ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
    />
  </button>
);

// ─── Slider (clean style) ─────────────────────────────────────────────────

const CleanSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}> = ({ value, min, max, step, onChange, unit = '' }) => {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
           [&::-webkit-slider-thumb]:border-2
           [&::-webkit-slider-thumb]:border-[#6366F1]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-sm
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-white
           [&::-moz-range-thumb]:border-2
           [&::-moz-range-thumb]:border-[#6366F1]
          [&::-moz-range-thumb]:shadow-sm"
        style={{
          background: `linear-gradient(to right, #6366F1 0%, #2563EB ${percent}%, #E0E7FF ${percent}%, #E0E7FF 100%)`,
        }}
      />
       <div className="flex justify-between text-xs text-[#64748b]">
        <span>
          {min}
          {unit}
        </span>
         <span className="text-[#6366F1] font-medium">
          {value}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

// ─── Setting Row (label + control) ───────────────────────────────────────

const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description?: string;
  control: React.ReactNode;
}> = ({ icon, label, description, control }) => (
   <div className="flex items-center justify-between py-3 border-b border-[rgba(124_58_237_0.15)] last:border-b-0">
     <div className="flex items-center gap-3 flex-1 pr-4">
       <div className="text-[#64748b] flex-shrink-0">{icon}</div>
       <div className="flex flex-col">
         <span className="text-sm text-slate-700 font-medium">{label}</span>
         {description && (
           <span className="text-xs text-[#64748B]">{description}</span>
         )}
      </div>
    </div>
    <div className="flex-shrink-0">{control}</div>
  </div>
);

// ─── Collapsible Group Card ──────────────────────────────────────────────

const GroupCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
     <div className="rounded-xl border border-[rgba(124_58_237_0.3)] bg-[#F8FAFC] overflow-hidden">
       <button
         type="button"
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between px-4 py-3
           bg-[rgba(124_58_237_0.1)] hover:bg-[rgba(124_58_237_0.2)]
           transition-colors"
       >
         <div className="flex items-center gap-2">
           <div className="text-[#6366F1]">{icon}</div>
           <span className="text-sm font-semibold text-slate-800">
            {title}
          </span>
        </div>
         <motion.div
           animate={{ rotate: isOpen ? 180 : 0 }}
           transition={{ duration: 0.2 }}
           className="text-[#64748b]"
         >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 py-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Voice Selection Grid ────────────────────────────────────────────────

const voiceOptions: { value: string; label: string }[] = [
  { value: 'young_female', label: '年轻女声' },
  { value: 'mature_female', label: '成熟女声' },
  { value: 'young_male', label: '年轻男声' },
  { value: 'mature_male', label: '成熟男声' },
];

// ─── Animation Level Select ──────────────────────────────────────────────

const animationOptions: { value: AnimationLevel; label: string }[] = [
  { value: 'off', label: '关闭' },
  { value: 'simple', label: '简单' },
  { value: 'standard', label: '标准' },
  { value: 'rich', label: '丰富' },
];

// ─── Main Component ──────────────────────────────────────────────────────

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,

  selectedVoice,
  speechRate,
  autoSpeakEnabled,
  letterSpeakEnabled,
  onVoiceChange,
  onSpeechRateChange,
  onAutoSpeakChange,
  onLetterSpeakChange,

  autoNextEnabled,
  soundEffectsEnabled,
  soundVolume,
  animationLevel,
  rememberMode,
  onAutoNextChange,
  onSoundEffectsChange,
  onSoundVolumeChange,
  onAnimationLevelChange,
  onRememberModeChange,

  keyboardVisible,
  phoneticVisible,
  partOfSpeechVisible,
  showGrammarTags,
  showIllustration,
  onKeyboardVisibleChange,
  onPhoneticVisibleChange,
  onPartOfSpeechVisibleChange,
  onToggleGrammarTags,
  onToggleIllustration,

  wordRearrangeMode,
  fingerGuideEnabled,
  onToggleWordRearrange,
  onFingerGuideChange,
}) => {
  return (
    <ModalShell open={open} onClose={onClose} title="偏好设置">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
         [&::-webkit-scrollbar-thumb]:bg-[rgba(124_58_237_0.3)]
        [&::-webkit-scrollbar-thumb]:rounded-full">
        {/* ─── 组 1：语音设置 ─── */}
        <GroupCard title="语音设置" icon={<Mic size={18} />} defaultOpen>
          <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block pt-3">
              发音音色
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voiceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onVoiceChange(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedVoice === opt.value
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/30'
                      : 'bg-[#F8FAFC] text-[#64748B] border border-[rgba(124_58_237_0.2)] hover:bg-[#E0E7FF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
               <span>语速</span>
               <span className="text-[#6366F1]">{speechRate}x</span>
            </label>
            <CleanSlider
              value={speechRate}
              min={0.5}
              max={2}
              step={0.1}
              onChange={onSpeechRateChange}
              unit="x"
            />
          </div>

          <SettingRow
            icon={<Volume2 size={18} />}
            label="自动发音"
            description="进入题目时自动播放单词/句子发音"
            control={
              <SwitchToggle
                checked={autoSpeakEnabled}
                onChange={() => onAutoSpeakChange(!autoSpeakEnabled)}
              />
            }
          />

          <SettingRow
            icon={<Volume2 size={18} />}
            label="字母发音"
            description="输入每个字母时自动播放字母发音"
            control={
              <SwitchToggle
                checked={letterSpeakEnabled}
                onChange={() => onLetterSpeakChange(!letterSpeakEnabled)}
              />
            }
          />
        </GroupCard>

        {/* ─── 组 2：交互设置 ─── */}
        <GroupCard title="交互设置" icon={<Zap size={18} />}>
          <SettingRow
            icon={<MousePointerClick size={18} />}
            label="自动下一题"
            description="提交正确后自动切换下一题"
            control={
              <SwitchToggle
                checked={autoNextEnabled}
                onChange={() => onAutoNextChange(!autoNextEnabled)}
              />
            }
          />

          <SettingRow
            icon={<Volume2 size={18} />}
            label="音效开关"
            description="练习音效总开关"
            control={
              <SwitchToggle
                checked={soundEffectsEnabled}
                onChange={() => onSoundEffectsChange(!soundEffectsEnabled)}
              />
            }
          />

           <div className="py-3 border-b border-[rgba(124_58_237_0.15)]">
             <div className="flex items-center gap-3 mb-2">
               <div className="text-[#64748b]">
                <Volume2 size={18} />
              </div>
                <span className="text-sm font-medium text-slate-700">
                 音效音量
              </span>
            </div>
            <CleanSlider
              value={soundVolume}
              min={0}
              max={100}
              step={1}
              onChange={onSoundVolumeChange}
              unit="%"
            />
          </div>

           <div className="py-3 border-b border-[rgba(124_58_237_0.15)]">
             <div className="flex items-center gap-3 mb-2">
               <div className="text-[#64748b]">
                <Sparkles size={18} />
              </div>
                <span className="text-sm font-medium text-slate-700">
                 动画效果等级
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {animationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onAnimationLevelChange(opt.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    animationLevel === opt.value
                      ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/30'
                       : 'bg-[#F8FAFC] text-slate-600 border border-indigo-200 hover:bg-indigo-50 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <SettingRow
            icon={<Save size={18} />}
            label="记住练习模式"
            description="记住上次选择的练习模式"
            control={
              <SwitchToggle
                checked={rememberMode}
                onChange={() => onRememberModeChange(!rememberMode)}
              />
            }
          />
        </GroupCard>

        {/* ─── 组 3：显示设置 ─── */}
        <GroupCard title="显示设置" icon={<Monitor size={18} />}>
          <SettingRow
            icon={<Layers size={18} />}
            label="虚拟键盘"
            description="显示屏幕虚拟键盘"
            control={
              <SwitchToggle
                checked={keyboardVisible}
                onChange={() => onKeyboardVisibleChange(!keyboardVisible)}
              />
            }
          />

          <SettingRow
            icon={<SpellCheck size={18} />}
            label="音标显示"
            description="显示单词音标"
            control={
              <SwitchToggle
                checked={phoneticVisible}
                onChange={() => onPhoneticVisibleChange(!phoneticVisible)}
              />
            }
          />

          <SettingRow
            icon={<Hash size={18} />}
            label="词性标注"
            description="显示单词词性标注"
            control={
              <SwitchToggle
                checked={partOfSpeechVisible}
                onChange={() => onPartOfSpeechVisibleChange(!partOfSpeechVisible)}
              />
            }
          />

          <SettingRow
            icon={<Tags size={18} />}
            label="语法标签"
            description="显示语法成分标签"
            control={
              <SwitchToggle
                checked={showGrammarTags}
                onChange={onToggleGrammarTags}
              />
            }
          />

          <SettingRow
            icon={<Image size={18} />}
            label="场景插图"
            description="显示场景插图"
            control={
              <SwitchToggle
                checked={showIllustration}
                onChange={onToggleIllustration}
              />
            }
          />
        </GroupCard>

        {/* ─── 组 4：练习设置 ─── */}
        <GroupCard title="练习设置" icon={<Dumbbell size={18} />}>
          <SettingRow
            icon={<Shuffle size={18} />}
            label="拆句重组模式"
            description="默认开启拆句重组练习"
            control={
              <SwitchToggle
                checked={wordRearrangeMode}
                onChange={onToggleWordRearrange}
              />
            }
          />

          <SettingRow
            icon={<Lightbulb size={18} />}
            label="目标键高亮"
            description="高亮提示下一个按键"
            control={
              <SwitchToggle
                checked={fingerGuideEnabled}
                onChange={() => onFingerGuideChange(!fingerGuideEnabled)}
              />
            }
          />
        </GroupCard>
      </div>
    </ModalShell>
  );
};

export default SettingsModal;
