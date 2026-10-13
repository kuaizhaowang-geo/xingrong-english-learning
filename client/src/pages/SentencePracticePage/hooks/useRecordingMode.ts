import { useState, useCallback } from 'react';
import type { SentencePuzzle } from '@shared/api.interface';
import type { PracticeMode } from '@client/src/components/practice-toolbar';
import type { WordScore, SpeechScoreData } from '../components/SpeechScorePanel';

interface UseRecordingModeArgs {
  currentPuzzle: SentencePuzzle | undefined;
  practiceMode: PracticeMode;
  onRecordingFinish?: () => void;
}

const STORAGE_KEY = 'xr_speech_scores';

interface HighScoreRecord {
  overall: number;
  date: string;
}

type HighScoreMap = Record<string, HighScoreRecord>;

const loadHighScores = (): HighScoreMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HighScoreMap) : {};
  } catch {
    return {};
  }
};

const saveHighScore = (sentenceId: string, overall: number): void => {
  try {
    const scores = loadHighScores();
    const existing = scores[sentenceId]?.overall ?? 0;
    if (overall > existing) {
      scores[sentenceId] = { overall, date: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    }
  } catch {
    // ignore
  }
};

const getHighScore = (sentenceId: string): number => {
  const scores = loadHighScores();
  return scores[sentenceId]?.overall ?? 0;
};



export function useRecordingMode({
  currentPuzzle,
  practiceMode,
  onRecordingFinish,
}: UseRecordingModeArgs) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  // watch-speak
  const [watchSpeakState, setWatchSpeakState] = useState<{
    hasRecorded: boolean;
    showAnswer: boolean;
    score: SpeechScoreData | null;
  }>({ hasRecorded: false, showAnswer: false, score: null });

  // shadowing
  const [shadowingState, setShadowingState] = useState<{
    hasRecorded: boolean;
    score: SpeechScoreData | null;
  }>({ hasRecorded: false, score: null });

  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const sentenceId = currentPuzzle?.id || '';
  const sentenceText = currentPuzzle?.sentence || '';

  const getCurrentHighScore = (): number => {
    if (!sentenceId) return 0;
    return getHighScore(sentenceId);
  };

  const [highScore, setHighScore] = useState<number>(getCurrentHighScore());

  const finishRecording = useCallback(() => {
    if (!currentPuzzle) return;
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    setRecordingDuration(duration);

    // 录音分析阶段（评分功能即将上线，暂不显示具体分数）
    setIsAnalyzing(true);

    // 1.5 秒分析动画后显示录音已完成
    setTimeout(() => {
      setIsAnalyzing(false);

      if (practiceMode === 'watch-speak') {
        setWatchSpeakState({
          hasRecorded: true,
          showAnswer: true,
          score: null,
        });
      } else if (practiceMode === 'shadowing') {
        setShadowingState({ hasRecorded: true, score: null });
      }

      onRecordingFinish?.();
    }, 1500);
  }, [currentPuzzle, practiceMode, recordingStartTime, onRecordingFinish]);

  const handleRecordToggle = useCallback(() => {
    setHasPermissionError(false);
    if (isRecording || isAnalyzing) {
      if (isRecording) {
        setIsRecording(false);
        finishRecording();
      }
      return;
    }
    // 模拟权限检查（实际接入麦克风时在此处 getUserMedia）
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    // 最长 6 秒自动结束
    setTimeout(() => {
      setIsRecording((currently) => {
        if (currently) {
          finishRecording();
          return false;
        }
        return currently;
      });
    }, 6000);
  }, [isRecording, isAnalyzing, finishRecording]);

  const handleRetry = useCallback(() => {
    if (isAnalyzing) return;
    if (practiceMode === 'watch-speak') {
      setWatchSpeakState((prev) => ({ ...prev, score: null }));
    } else if (practiceMode === 'shadowing') {
      setShadowingState((prev) => ({ ...prev, score: null }));
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, [practiceMode, isAnalyzing]);

  const handleWatchSpeakReveal = useCallback(() => {
    setWatchSpeakState((prev) => ({ ...prev, showAnswer: true }));
  }, []);

  const handleWatchSpeakToggleAnswer = useCallback(() => {
    setWatchSpeakState((prev) => ({ ...prev, showAnswer: !prev.showAnswer }));
  }, []);

  const reset = useCallback(() => {
    setIsRecording(false);
    setIsAnalyzing(false);
    setHasPermissionError(false);
    setRecordingDuration(0);
    setWatchSpeakState({ hasRecorded: false, showAnswer: false, score: null });
    setShadowingState({ hasRecorded: false, score: null });
    setHighScore(getHighScore(sentenceId));
  }, [sentenceId]);

  const currentScore =
    practiceMode === 'watch-speak'
      ? watchSpeakState.score
      : shadowingState.score;

  const hasRecordedWithScore = Boolean(currentScore) && !isAnalyzing;

  return {
    isRecording,
    isAnalyzing,
    hasPermissionError,
    recordingDuration,
    highScore,
    // watch-speak
    watchSpeakHasRecorded: watchSpeakState.hasRecorded,
    watchSpeakShowAnswer: watchSpeakState.showAnswer,
    watchSpeakScore: watchSpeakState.score,
    // shadowing
    shadowingHasRecorded: shadowingState.hasRecorded,
    shadowingScore: shadowingState.score,
    // 兼容旧字段
    shadowingAccuracy: shadowingState.score?.accuracy ?? 0,
    shadowingFluency: shadowingState.score?.fluency ?? 0,
    shadowingOverall: shadowingState.score?.overall ?? 0,
    shadowingWordScores: shadowingState.score?.wordScores ?? [],
    // actions
    handleRecordToggle,
    handleRetry,
    handleWatchSpeakReveal,
    handleWatchSpeakToggleAnswer,
    reset,
    hasRecordedWithScore,
  };
}
