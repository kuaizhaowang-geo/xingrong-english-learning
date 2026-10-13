import React, { memo } from 'react';
import { Eye, BookOpen, VolumeX, Clock } from 'lucide-react';

type PhoneticMode = 'none' | 'default' | 'breakdown' | 'phonics';

const SwitchToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: React.ReactNode;
}> = ({ checked, onChange, label, icon }) => (
  <button
    type="button"
    onClick={onChange}
    aria-checked={checked}
    role="switch"
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      checked
        ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white border-transparent shadow-md shadow-[#6366F1]/40'
        : 'bg-white/5 text-slate-300 border-fuchsia-500/15 hover:border-fuchsia-400/50 hover:text-fuchsia-400'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const PhoneticModeSelector: React.FC<{
  mode: PhoneticMode;
  onChange: (mode: PhoneticMode) => void;
}> = ({ mode, onChange }) => {
  const options: { key: PhoneticMode; label: string }[] = [
    { key: 'none', label: '无音标' },
    { key: 'default', label: '默认音标' },
    { key: 'breakdown', label: '音标拆解' },
    { key: 'phonics', label: '自然拼读' },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/5 p-0.5 border border-fuchsia-500/15">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            mode === opt.key
             ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/30'
               : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

interface WordPracticeControlBarProps {
  showMeaning: boolean;
  onToggleMeaning: () => void;
  showExample: boolean;
  onToggleExample: () => void;
  phoneticMode: PhoneticMode;
  onPhoneticModeChange: (mode: PhoneticMode) => void;
  elapsedSeconds: number;
}

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const WordPracticeControlBar: React.FC<WordPracticeControlBarProps> = ({
  showMeaning,
  onToggleMeaning,
  showExample,
  onToggleExample,
  phoneticMode,
  onPhoneticModeChange,
  elapsedSeconds,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-[#6366F1]" />
          <span className="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <SwitchToggle
          checked={showMeaning}
          onChange={onToggleMeaning}
          label="显示释义"
          icon={<Eye size={14} />}
        />
        <SwitchToggle
          checked={showExample}
          onChange={onToggleExample}
          label="显示例句"
          icon={<BookOpen size={14} />}
        />
      </div>
      <div className="flex items-center gap-2">
        <PhoneticModeSelector
          mode={phoneticMode}
          onChange={onPhoneticModeChange}
        />
      </div>
    </div>
  );
};

export default memo(WordPracticeControlBar);
