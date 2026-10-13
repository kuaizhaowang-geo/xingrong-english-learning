import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface RecordingButtonProps {
  isRecording: boolean;
  onClick: () => void;
  label?: string;
  recordingLabel?: string;
  disabled?: boolean;
  size?: 'md' | 'lg';
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onClick,
  label = '开始录音',
  recordingLabel = '正在录音...',
  disabled = false,
  size = 'lg',
}) => {
  const containerSize = size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';
  const iconSize = size === 'lg' ? 36 : 26;
  const ringSize = size === 'lg' ? 'w-36 h-36' : 'w-28 h-28';

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`relative ${containerSize} rounded-full flex items-center justify-center transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {isRecording && (
          <>
            <motion.div
              className={`absolute ${ringSize} rounded-full border-2 border-red-500/50`}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className={`absolute ${ringSize} rounded-full border border-red-400/40`}
              animate={{
                scale: [1.1, 1.25, 1.1],
                opacity: [0.4, 0.1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.3,
              }}
            />
          </>
        )}

        <motion.div
          className={`absolute inset-0 rounded-full ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : 'bg-gradient-to-br from-violet-500 to-blue-600'
          } shadow-lg`}
          animate={isRecording ? { scale: [1, 1.02, 1] } : { scale: 1 }}
          transition={{
            duration: 0.8,
            repeat: isRecording ? Infinity : 0,
            ease: 'easeInOut',
          }}
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          style={{
            boxShadow: isRecording
              ? '0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.25)'
              : '0 0 30px rgba(99, 102, 241, 0.35), 0 0 60px rgba(59, 130, 246, 0.25)',
          }}
        />

        <Mic
          size={iconSize}
          className="relative z-10 text-white drop-shadow-lg"
          strokeWidth={2}
        />
      </button>

      <div className="text-center">
        <p className={`font-semibold ${isRecording ? 'text-red-500' : 'text-slate-700'}`}>
          {isRecording ? recordingLabel : label}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">按空格键</p>
      </div>
    </div>
  );
};

export default RecordingButton;
