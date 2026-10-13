import React, { useState, useEffect } from 'react';
import { Languages, Headphones, Mic, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';

type PracticeMode = 'translation' | 'listening' | 'speaking';

interface PracticeModeSelectorProps {
  open: boolean;
  onSelect: (mode: PracticeMode) => void;
  onClose: () => void;
  currentMode?: PracticeMode;
  title?: string;
}

interface ModeConfig {
  key: PracticeMode;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  recommended?: boolean;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    key: 'translation',
    name: '中译英模式',
    description: '看到中文提示，尝试用英文表达',
    icon: Languages,
    recommended: true,
  },
  {
    key: 'listening',
    name: '听力模式',
    description: '先播放英语音频，培养语感后作答',
    icon: Headphones,
  },
  {
    key: 'speaking',
    name: '口语矫正',
    description: '跟读句子练习发音，让口语表达更自然流畅',
    icon: Mic,
  },
];

const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({
  open,
  onSelect,
  onClose,
  currentMode,
  title = '选择练习模式',
}) => {
  const [selected, setSelected] = useState<PracticeMode | undefined>(currentMode);

  useEffect(() => {
    if (open) {
      setSelected(currentMode);
    }
  }, [open, currentMode]);

  const handleConfirm = (): void => {
    if (!selected) return;
    onSelect(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen: boolean) => {
      if (!nextOpen) onClose();
    }}>
      <DialogContent
        className="max-w-3xl p-6 sm:p-8"
        showCloseButton
      >
        <DialogHeader className="text-center mb-2">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {MODE_CONFIGS.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selected === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setSelected(mode.key)}
                className={`relative flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-white ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-200 shadow-md'
                    : 'border-gray-100 shadow-sm hover:border-orange-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    isSelected
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-orange-50 text-orange-500'
                  }`}
                >
                  <Icon size={24} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {mode.name}
                  </h3>
                  {mode.recommended && (
                    <Badge
                      variant="default"
                      className="bg-orange-500 text-white border-transparent text-[10px] px-2 py-0 h-5"
                    >
                      新手推荐
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>

        <DialogFooter className="sm:justify-center mt-2">
          <Button
            size="lg"
            disabled={!selected}
            onClick={handleConfirm}
            className="w-full sm:w-auto sm:min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 font-medium"
          >
            开始练习
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModeSelector;
