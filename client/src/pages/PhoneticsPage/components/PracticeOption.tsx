import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PracticeOptionProps {
  label: string;
  sub?: string;
  isSymbol: boolean;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const PracticeOption: React.FC<PracticeOptionProps> = ({
  label,
  sub,
  isSymbol,
  isSelected,
  isCorrect,
  isWrong,
  onClick,
  disabled,
}) => {
  let borderColor: string = 'rgba(99, 102, 241, 0.2)';
  let bgColor: string = '#FFFFFF';
  let textColor: string = '#F1F5F9';
  let icon: React.ReactNode = null;
  let glow: string = 'none';

  if (isCorrect) {
    borderColor = 'rgba(34, 211, 238, 0.6)';
    bgColor = 'rgba(34, 211, 238, 0.1)';
    textColor = '#06B6D4';
    glow = '0 0 15px rgba(34, 211, 238, 0.3)';
    icon = <CheckCircle size={18} className="text-[#06B6D4]" />;
  } else if (isWrong) {
    borderColor = 'rgba(239, 71, 111, 0.6)';
    bgColor = 'rgba(239, 71, 111, 0.1)';
    textColor = '#FB7185';
    glow = '0 0 15px rgba(239, 71, 111, 0.3)';
    icon = <XCircle size={18} className="text-[#FB7185]" />;
  } else if (isSelected) {
    borderColor = 'rgba(99, 102, 241, 0.3)';
    bgColor = 'rgba(99, 102, 241, 0.12)';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        relative p-5 rounded-xl border
        flex flex-col items-center justify-center gap-1
        transition-all duration-200
        disabled:cursor-default
        hover:border-[rgba(124_58_237_0.6)]
        active:scale-[0.97] min-h-[88px] w-full
      "
      style={{
        backgroundColor: bgColor,
        borderColor,
        color: textColor,
        boxShadow: glow,
      }}
    >
      <span
        className={isSymbol ? 'text-3xl font-bold' : 'text-lg font-medium'}
        style={{
          fontFamily: isSymbol ? 'Georgia, "Times New Roman", serif' : undefined,
        }}
      >
        {label}
      </span>
      {sub && <span className="text-xs font-mono text-[#818CF8]">{sub}</span>}
      {icon && <span className="absolute top-2 right-2">{icon}</span>}
    </button>
  );
};

export default PracticeOption;
