import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, RotateCcw, SkipForward, Play } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import SpeechButton from '@client/src/components/ui/speech-button';

export interface SpeakingEvaluatorProps {
  text: string;
  type?: 'sentence' | 'word';
  onClose?: () => void;
  onComplete?: (score: number, details: EvaluationDetails) => void;
}

export interface EvaluationDetails {
  accuracy: number;
  fluency: number;
  completeness: number;
  wordFeedback: WordFeedback[];
}

export interface WordFeedback {
  word: string;
  score: number;
  status: 'accurate' | 'fair' | 'inaccurate';
}

type RecordingState = 'idle' | 'recording' | 'evaluating' | 'result';

const SpeakingEvaluator: React.FC<SpeakingEvaluatorProps> = ({
  text,
  type = 'sentence',
  onClose,
  onComplete,
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [details, setDetails] = useState<EvaluationDetails | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(7).fill(20));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const waveTimerRef = useRef<number | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const generateMockEvaluation = useCallback((): {
    total: number;
    details: EvaluationDetails;
  } => {
    const words = text.trim().split(/\s+/);
    const wordFeedback: WordFeedback[] = words.map((word) => {
      const score = Math.floor(Math.random() * 40) + 60;
      let status: 'accurate' | 'fair' | 'inaccurate';
      if (score >= 85) status = 'accurate';
      else if (score >= 70) status = 'fair';
      else status = 'inaccurate';
      return { word, score, status };
    });

    const accuracy = Math.floor(Math.random() * 20) + 75;
    const fluency = Math.floor(Math.random() * 25) + 70;
    const completeness = Math.floor(Math.random() * 20) + 75;
    const total = Math.round((accuracy + fluency + completeness) / 3);

    return {
      total,
      details: {
        accuracy,
        fluency,
        completeness,
        wordFeedback,
      },
    };
  }, [text]);

  const startRecording = useCallback(async () => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start();
      setState('recording');
      setElapsed(0);

      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);

      waveTimerRef.current = window.setInterval(() => {
        setWaveHeights(
          Array.from({ length: 7 }, () => Math.random() * 60 + 20),
        );
      }, 120);
    } catch (err) {
      logger.error('获取麦克风权限失败', err as Error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setState('evaluating');

    // 模拟评测耗时
    window.setTimeout(() => {
      const result = generateMockEvaluation();
      setTotalScore(result.total);
      setDetails(result.details);
      setState('result');
      if (onComplete) {
        onComplete(result.total, result.details);
      }
    }, 1200);
  }, [generateMockEvaluation, onComplete]);

  const handleMicClick = useCallback(() => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  const handleRetry = useCallback(() => {
    setState('idle');
    setTotalScore(0);
    setDetails(null);
    setElapsed(0);
    setWaveHeights(Array(7).fill(20));
  }, []);

  const handleNext = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Enter 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' && !e.repeat) {
        if (state === 'idle' || state === 'recording') {
          e.preventDefault();
          handleMicClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleMicClick]);

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#2EC4B6';
    if (score >= 70) return '#FFD166';
    return '#EF476F';
  };

  const getScoreText = (score: number): string => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    return '需要练习';
  };

  const circumference = 2 * Math.PI * 80;
  const progressOffset =
    circumference - (totalScore / 100) * circumference;

  const getWordStatusClass = (status: string): string => {
    switch (status) {
      case 'accurate':
        return 'text-emerald-500';
      case 'fair':
        return 'text-amber-500';
      case 'inaccurate':
        return 'text-rose-500';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className="rounded-2xl shadow-lg border border-gray-100 bg-white overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #FFF9F5 0%, #FFFFFF 60%)',
        }}
      >
        {/* 顶部：目标文本 */}
        <div className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="inline-block px-3 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: '#FF6B3520', color: '#FF6B35' }}
            >
              {type === 'word' ? '单词跟读' : '句子跟读'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <h2
              className={
                type === 'word'
                  ? 'text-4xl font-bold text-gray-900'
                  : 'text-2xl font-bold text-gray-900 leading-relaxed'
              }
            >
              {text}
            </h2>
            <SpeechButton text={text} size="lg" variant="ghost" />
          </div>
        </div>

        {/* 主体区 */}
        <div className="px-6 pb-6">
          {/* 待机状态 */}
          {state === 'idle' && (
            <div className="flex flex-col items-center py-6">
              <button
                type="button"
                onClick={handleMicClick}
                className="relative w-28 h-28 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{
                  background:
                    'linear-gradient(135deg, #FF8A5C 0%, #FF6B35 100%)',
                }}
                aria-label="开始录音"
              >
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: '#FF6B35' }}
                />
                <Mic className="w-12 h-12 relative z-10" />
              </button>
              <p className="mt-5 text-sm text-gray-500">
                点击麦克风开始跟读
                <span className="text-gray-400"> (Enter)</span>
              </p>

              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
                style={{ color: '#FF6B35' }}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voices = window.speechSynthesis.getVoices();
                    const enVoice =
                      voices.find((v) => v.lang.startsWith('en')) ||
                      voices[0];
                    if (enVoice) {
                      utterance.voice = enVoice;
                      utterance.lang = enVoice.lang;
                    }
                    utterance.rate = 0.9;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
              >
                <Play className="w-4 h-4" />
                听标准发音
              </button>
            </div>
          )}

          {/* 录音中状态 */}
          {state === 'recording' && (
            <div className="flex flex-col items-center py-6">
              {/* 波形 */}
              <div className="flex items-end justify-center gap-1 h-16 mb-4">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full transition-all duration-100"
                    style={{
                      height: `${h}px`,
                      background:
                        'linear-gradient(180deg, #FF8A5C 0%, #FF6B35 100%)',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleMicClick}
                className="relative w-28 h-28 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 bg-rose-500"
                aria-label="结束录音"
              >
                <Square className="w-10 h-10 fill-current" />
              </button>

              <p className="mt-4 text-2xl font-mono font-semibold text-gray-800">
                {formatTime(elapsed)}
              </p>
              <p className="mt-2 text-sm text-rose-500 font-medium">
                录音中... 再次点击结束
              </p>
            </div>
          )}

          {/* 评测中状态 */}
          {state === 'evaluating' && (
            <div className="flex flex-col items-center py-10">
              <div className="w-14 h-14 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              <p className="mt-4 text-sm text-gray-500">正在评测您的发音...</p>
            </div>
          )}

          {/* 结果状态 */}
          {state === 'result' && details && (
            <div className="py-4">
              {/* 总分圆环 */}
              <div className="flex justify-center mb-6">
                <div className="relative w-44 h-44">
                  <svg className="w-44 h-44 -rotate-90" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#F3F4F6"
                      strokeWidth="12"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={progressOffset}
                      style={{
                        transition: 'stroke-dashoffset 1s ease-out',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-5xl font-bold"
                      style={{ color: getScoreColor(totalScore) }}
                    >
                      {totalScore}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {getScoreText(totalScore)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 评分维度 */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">准确度</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: getScoreColor(details.accuracy) }}
                  >
                    {details.accuracy}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">流利度</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: getScoreColor(details.fluency) }}
                  >
                    {details.fluency}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">完整度</p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: getScoreColor(details.completeness) }}
                  >
                    {details.completeness}
                  </p>
                </div>
              </div>

              {/* 逐词反馈 */}
              <div className="p-4 bg-gray-50 rounded-xl mb-5">
                <p className="text-xs text-gray-500 mb-2">逐词反馈</p>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {details.wordFeedback.map((w, i) => (
                    <span
                      key={i}
                      className={`text-lg font-medium ${getWordStatusClass(
                        w.status,
                      )}`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    准确
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    一般
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    不准确
                  </span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新录音
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-colors"
                  style={{ backgroundColor: '#FF6B35' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E85A2A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FF6B35';
                  }}
                >
                  <SkipForward className="w-4 h-4" />
                  下一个
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakingEvaluator;
