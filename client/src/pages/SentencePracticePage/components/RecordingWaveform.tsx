import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface RecordingWaveformProps {
  isRecording: boolean;
  durationSeconds: number;
}

const BAR_COUNT = 24;
const BASE_HEIGHT = 6;
const MAX_HEIGHT = 28;

const RecordingWaveform: React.FC<RecordingWaveformProps> = ({
  isRecording,
  durationSeconds,
}) => {
  const [bars, setBars] = useState<number[]>(new Array(BAR_COUNT).fill(BASE_HEIGHT));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      setBars(new Array(BAR_COUNT).fill(BASE_HEIGHT));
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 80) {
        setBars((prev: number[]) => {
          const newBars: number[] = [...prev.slice(1)];
          const intensity = 0.4 + Math.random() * 0.6;
          const height = BASE_HEIGHT + Math.floor(intensity * MAX_HEIGHT);
          newBars.push(height);
          return newBars;
        });
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRecording]);

  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-0.5 h-10 px-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="w-[4px] rounded-full bg-gradient-to-t from-[#FF6B35] to-[#FF8C5A]"
            initial={false}
            animate={{ height: h }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
        ))}
      </div>
      <div className="text-xs font-mono text-[#FF6B35] tabular-nums">
        {formatTime(durationSeconds)}
      </div>
    </div>
  );
};

export default RecordingWaveform;
