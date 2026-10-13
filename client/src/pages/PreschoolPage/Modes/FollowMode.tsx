import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Mic, Star, RefreshCw } from 'lucide-react';
import { useSpeechRecognition } from '../use-speech-recognition';
import { speak } from '../speak';

interface FollowModeProps {
  targetText: string;
  translation?: string;
  imageEmoji?: string;
  onComplete: (result: { score: number; recognized: string }) => void;
  onBack: () => void;
  accentColor?: string;
}

function calculateSimilarity(a: string, b: string): number {
  const sa = a.toLowerCase().trim();
  const sb = b.toLowerCase().trim();
  if (sa === sb) return 100;
  if (sa.length === 0 || sb.length === 0) return 0;

  // 简单字符级匹配
  let matches = 0;
  const longer = sa.length >= sb.length ? sa : sb;
  const shorter = sa.length < sb.length ? sa : sb;

  for (let i = 0; i < shorter.length; i++) {
    if (sa[i] === sb[i]) matches++;
  }

  // 额外考虑单词级匹配
  const wordsA = sa.split(/\s+/);
  const wordsB = sb.split(/\s+/);
  let wordMatches = 0;
  for (const w of wordsA) {
    if (wordsB.includes(w)) wordMatches++;
  }
  const wordScore = wordsA.length > 0 ? (wordMatches / wordsA.length) * 100 : 0;
  const charScore = (matches / longer.length) * 100;

  return Math.round(charScore * 0.6 + wordScore * 0.4);
}

function getScoreLabel(score: number): { text: string; color: string; emoji: string } {
  if (score >= 90) return { text: '优秀！', color: 'text-green-500', emoji: '🌟' };
  if (score >= 70) return { text: '良好', color: 'text-blue-500', emoji: '👍' };
  return { text: '继续努力', color: 'text-orange-500', emoji: '💪' };
}

const FollowMode: React.FC<FollowModeProps> = ({
  targetText,
  translation,
  imageEmoji,
  onComplete,
  onBack,
  accentColor = '#34D399',
}) => {
  const { isListening, transcript, supported, start, stop } = useSpeechRecognition();
  const [score, setScore] = useState<number | null>(null);
  const [recognized, setRecognized] = useState<string>('');
  const [showStars, setShowStars] = useState<boolean>(false);
  const [hasResult, setHasResult] = useState<boolean>(false);

  useEffect(() => {
    if (!isListening && transcript && !hasResult && transcript !== recognized) {
      // 录音结束，计算得分
      const s = calculateSimilarity(transcript, targetText);
      setScore(s);
      setRecognized(transcript);
      setHasResult(true);
      if (s >= 70) {
        setShowStars(true);
      }
    }
  }, [isListening, transcript, targetText, hasResult, recognized]);

  const handleMicClick = (): void => {
    if (isListening) {
      stop();
    } else {
      setHasResult(false);
      setScore(null);
      setRecognized('');
      setShowStars(false);
      start();
    }
  };

  const handleRetry = (): void => {
    setScore(null);
    setRecognized('');
    setHasResult(false);
    setShowStars(false);
  };

  const handleFinish = (): void => {
    const finalScore = score ?? calculateSimilarity(recognized, targetText);
    onComplete({ score: finalScore, recognized });
  };

  const scoreInfo = score !== null ? getScoreLabel(score) : null;

  if (!supported) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-emerald-600 font-medium"
          >
            <ArrowLeft size={20} />
            返回
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">浏览器不支持语音识别</h3>
          <p className="text-gray-500">
            当前浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器体验跟读模式。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-emerald-600 font-medium"
        >
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="text-gray-500 text-sm">跟读练习</div>
        <div className="w-16" />
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {imageEmoji && (
          <div className="text-6xl mb-3">{imageEmoji}</div>
        )}

        {/* 目标文字 */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-800 mb-1">{targetText}</div>
          {translation && (
            <div className="text-gray-500">{translation}</div>
          )}
        </div>

        {/* 播放标准发音 */}
        <button
          onClick={() => speak(targetText, 0.7)}
          className="mb-6 px-5 py-2 bg-emerald-100 text-emerald-600 rounded-full text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Volume2 size={18} />
          听标准发音
        </button>

        {/* 录音大按钮 */}
        <button
          onClick={handleMicClick}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all ${
            isListening
              ? 'bg-red-500 animate-pulse'
              : 'bg-gradient-to-br from-emerald-400 to-teal-500'
          }`}
        >
          <Mic size={48} className="text-white" />
          {isListening && (
            <span className="absolute -bottom-8 text-red-500 font-bold text-sm">
              正在听...
            </span>
          )}
        </button>

        {/* 实时转写 */}
        {(isListening || recognized) && (
          <div className="mt-10 w-full max-w-md px-4 py-3 bg-gray-50 rounded-xl text-center min-h-[3rem]">
            <div className="text-xs text-gray-500 mb-1">你说的是</div>
            <div className="text-lg font-medium text-gray-700">
              {isListening ? transcript || '...' : recognized}
            </div>
          </div>
        )}

        {/* 评分结果 */}
        {score !== null && scoreInfo && (
          <div className="mt-4 text-center">
            <div className="text-5xl font-bold mb-1" style={{ color: accentColor }}>
              {score}分
            </div>
            <div className={`text-xl font-bold ${scoreInfo.color}`}>
              {scoreInfo.emoji} {scoreInfo.text}
            </div>

            {/* 正确答案对比 */}
            <div className="mt-3 bg-green-50 rounded-xl px-4 py-2">
                <div className="text-xs text-gray-500 mb-1">正确答案</div>
              <div className="text-green-600 font-medium">{targetText}</div>
            </div>

            {/* 星星动画 */}
            {showStars && (
              <div className="mt-3 flex justify-center gap-2">
                {[0, 1, 2].map((i: number) => (
                  <Star
                    key={i}
                    className="text-yellow-400 fill-yellow-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                    size={32}
                  />
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-5 justify-center">
              <button
                onClick={handleRetry}
                className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform"
              >
                <RefreshCw size={16} />
                再读一次
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-2 text-white rounded-full text-sm font-bold active:scale-95 transition-transform shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                下一个
              </button>
            </div>
          </div>
        )}

        {score === null && !isListening && (
          <div className="mt-10 text-gray-500 text-sm">
            点击麦克风开始跟读
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowMode;
