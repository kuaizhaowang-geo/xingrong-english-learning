import React from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SpeechButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  className?: string;
  'aria-label'?: string;
}

const getSpeechState = (): { speaking: boolean; speak: (text: string) => void; stop: () => void; supported: boolean } => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { speaking: false, speak: () => {}, stop: () => {}, supported: false };
  }
  let cachedVoice: SpeechSynthesisVoice | null = null;

  const getVoice = (): SpeechSynthesisVoice | null => {
    if (cachedVoice) return cachedVoice;
    const allVoices = window.speechSynthesis.getVoices();
    if (allVoices.length === 0) return null;
    try {
      const saved = localStorage.getItem('learner_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.speechVoice) {
          const found = allVoices.find((v) => v.name === parsed.speechVoice);
          if (found) {
            cachedVoice = found;
            return found;
          }
        }
      }
    } catch {
      /* ignore */
    }
    const enVoice = allVoices.find((v) => v.lang.startsWith('en')) || allVoices[0];
    cachedVoice = enVoice;
    return enVoice;
  };

  return {
    speaking: window.speechSynthesis.speaking,
    supported: true,
    speak: (text: string) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const v = getVoice();
        if (v) {
          utterance.voice = v;
          utterance.lang = v.lang;
        }
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      } catch {
        /* ignore */
      }
    },
    stop: () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    },
  };
};

const SpeechButton: React.FC<SpeechButtonProps> = ({
  text,
  size = 'md',
  variant = 'ghost',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [speaking, setSpeaking] = React.useState(false);

  const handleClick = (): void => {
    const state = getSpeechState();
    if (!state.supported) return;
    if (state.speaking) {
      state.stop();
      setSpeaking(false);
    } else {
      state.speak(text);
      setSpeaking(true);
      const check = (): void => {
        const current = getSpeechState();
        if (current.speaking) {
          requestAnimationFrame(check);
        } else {
          setSpeaking(false);
        }
      };
      setTimeout(check, 100);
    }
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const variantClasses = {
    ghost: 'text-gray-400 hover:text-orange-500 hover:bg-orange-50',
    outline: 'text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500',
    solid: 'bg-orange-500 text-white hover:bg-orange-600',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel || `朗读 ${text}`}
      className={`inline-flex items-center justify-center rounded-full transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {speaking ? (
        <Volume2 size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} className="animate-pulse" />
      ) : (
        <Volume2 size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      )}
    </button>
  );
};

export default SpeechButton;
