import React, { memo } from 'react';
import { Eye, Shuffle } from 'lucide-react';

interface SwitchToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  icon: React.ReactNode;
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({ checked, onChange, label, icon }) => (
  <button
    type="button"
    onClick={onChange}
    aria-checked={checked}
    role="switch"
     className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all ${
       checked
         ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white border-transparent shadow-sm shadow-[#6366F1]/30'
         : 'bg-transparent text-slate-400 border-transparent hover:text-fuchsia-400'
     }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface PracticeControlBarProps {
  showIllustration: boolean;
  onToggleIllustration: () => void;
  wordRearrangeMode: boolean;
  onToggleWordRearrange: () => void;
}

const PracticeControlBar: React.FC<PracticeControlBarProps> = ({
  showIllustration,
  onToggleIllustration,
  wordRearrangeMode,
  onToggleWordRearrange,
}) => {
  return (
      <div className="flex items-center justify-start gap-1 px-3 py-0.5 bg-white/5 backdrop-blur-sm border-b border-fuchsia-500/15">
      <SwitchToggle
        checked={wordRearrangeMode}
        onChange={onToggleWordRearrange}
        label="拆句重组"
        icon={<Shuffle size={14} />}
      />
      <SwitchToggle
        checked={showIllustration}
        onChange={onToggleIllustration}
        label="显示图片"
        icon={<Eye size={14} />}
      />
    </div>
  );
};

export default memo(PracticeControlBar);
