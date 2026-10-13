import React from 'react';
import { X } from 'lucide-react';

export type LearningMode = 'typing' | 'dictation' | 'follow' | 'lookSpeak';

interface ModeOption {
  id: LearningMode;
  emoji: string;
  name: string;
  description: string;
  gradient: string;
}

const MODES: ModeOption[] = [
  {
    id: 'typing',
    emoji: '⌨️',
    name: '打字模式',
    description: '看着单词，用键盘打出来',
    gradient: 'linear-gradient(135deg, #818CF8 0%, #818CF8 100%)',
  },
  {
    id: 'dictation',
    emoji: '🎧',
    name: '听写模式',
    description: '听发音，写出你听到的内容',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FB7185 100%)',
  },
  {
    id: 'follow',
    emoji: '🎤',
    name: '跟读模式',
    description: '跟着标准发音一起读',
    gradient: 'linear-gradient(135deg, #34D399 0%, #06B6D4 100%)',
  },
  {
    id: 'lookSpeak',
    emoji: '🖼️',
    name: '看说模式',
    description: '看图片，说出对应的英文',
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
  },
];

interface LearningModeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: LearningMode) => void;
  currentMode?: LearningMode;
}

const LearningModeSelector: React.FC<LearningModeSelectorProps> = ({
  open,
  onClose,
  onSelect,
  currentMode,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎮</div>
           <h2 className="text-2xl font-bold text-white">选择学习模式</h2>
           <p className="text-slate-400 mt-1">选一种你喜欢的方式来学习吧！</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {MODES.map((mode: ModeOption) => (
            <button
              key={mode.id}
              onClick={() => {
                onSelect(mode.id);
                onClose();
              }}
              className={`relative p-5 rounded-2xl text-left text-white shadow-lg active:scale-95 transition-all hover:shadow-xl ${
                 currentMode === mode.id ? 'ring-4 ring-yellow-400 ring-offset-white/10' : ''
              }`}
              style={{ background: mode.gradient }}
            >
              <div className="text-4xl mb-3">{mode.emoji}</div>
              <div className="text-lg font-bold">{mode.name}</div>
              <div className="text-sm opacity-90 mt-1">{mode.description}</div>
              {currentMode === mode.id && (
                <div className="absolute top-2 right-2 text-yellow-300 text-xl">⭐</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningModeSelector;
