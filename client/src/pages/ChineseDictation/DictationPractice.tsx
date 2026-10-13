import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Volume2,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { chineseDictationApi } from '@client/src/api';
import { VirtualKeyboard } from '@client/src/components/virtual-keyboard';
import CharacterCard from './CharacterCard';
import type {
  ChineseCharacter,
  ChineseDictationSession,
  SubmitDictationAnswerResponse,
} from '@shared/api.interface';

interface SessionState {
  session: ChineseDictationSession;
  characters: ChineseCharacter[];
  currentIndex: number;
}

const DictationPractice: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<SessionState | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<SubmitDictationAnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('chineseDictationSession');
    if (!saved) {
      toast.error('听写会话已过期，请重新开始');
      navigate('/chinese-dictation');
      return;
    }
    try {
      const parsed: SessionState = JSON.parse(saved);
      setState(parsed);
      setStartTime(Date.now());
    } catch (err) {
      logger.error('解析会话数据失败', err as Error);
      navigate('/chinese-dictation');
    }
  }, [navigate]);

  const currentChar = state?.characters[state.currentIndex];
  const mode = state?.session.mode ?? 'pinyin_to_char';
  const progress = state
    ? ((state.currentIndex + 1) / state.characters.length) * 100
    : 0;

  const handleBackspace = useCallback((): void => {
    if (feedback) return;
    setAnswer((prev) => prev.slice(0, -1));
  }, [feedback]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!state || !currentChar || !answer || submitting || feedback) return;

    setSubmitting(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      const result = await chineseDictationApi.submitDictationAnswer(
        state.session.id,
        {
          characterId: currentChar.id,
          userAnswer: answer,
          duration,
        },
      );
      setFeedback(result);
      toast(result.isCorrect ? '回答正确！' : '回答错误', {
        description: result.isCorrect ? '太棒了，继续加油' : `正确答案：${result.correctAnswer}`,
      });
    } catch (err) {
      logger.error('提交答案失败', err as Error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [state, currentChar, answer, submitting, feedback, startTime]);

  const handleNext = useCallback((): void => {
    if (!state) return;
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.characters.length) {
      // 结束会话
      void finishSession();
      return;
    }
    const newState = { ...state, currentIndex: nextIndex };
    setState(newState);
    localStorage.setItem('chineseDictationSession', JSON.stringify(newState));
    setAnswer('');
    setFeedback(null);
    setStartTime(Date.now());
  }, [state]);

  const finishSession = async (): Promise<void> => {
    if (!state) return;
    try {
      await chineseDictationApi.finishDictationSession(state.session.id, {
        duration: Math.round((Date.now() - startTime) / 1000),
      });
      toast.success('听写完成！');
    } catch (err) {
      logger.error('结束会话失败', err as Error);
    } finally {
      localStorage.removeItem('chineseDictationSession');
      navigate('/chinese-dictation');
    }
  };

  const handleBack = (): void => {
    localStorage.removeItem('chineseDictationSession');
    navigate('/chinese-dictation');
  };

  if (!state || !currentChar) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const isLast = state.currentIndex === state.characters.length - 1;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* 顶部栏 */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="返回"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-500">
             <span>进度</span>
             <span>
               {state.currentIndex + 1} / {state.characters.length}
             </span>
           </div>
        </div>
      </div>

      {/* 生字卡片区 */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        {mode === 'pinyin_to_char' && (
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-3">看拼音写汉字</div>
            <div className="text-5xl font-bold text-[#FF6B35] mb-6">
              {currentChar.pinyin}
            </div>
          </div>
        )}

        {mode === 'char_to_pinyin' && (
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-3">看汉字写拼音</div>
            <div className="text-6xl font-bold text-[#1A1A2E] mb-6">
              {currentChar.hanzi}
            </div>
          </div>
        )}

        {mode === 'audio_to_char' && (
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-4">听发音写词语</div>
            <button
              type="button"
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#4361EE] to-[#6B8AFF]
                flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              aria-label="播放发音"
            >
              <Volume2 className="w-10 h-10 text-white" />
            </button>
            <div className="mt-4 text-sm text-gray-400">点击播放发音</div>
          </div>
        )}

        {/* 答案输入显示 */}
        <div className="mt-6">
          <div
            className={`min-h-[3rem] text-center text-3xl font-medium tracking-wider
              border-b-2 pb-3 transition-colors
              ${feedback
                ? feedback.isCorrect
                  ? 'text-[#2EC4B6] border-[#2EC4B6]'
                  : 'text-[#EF476F] border-[#EF476F]'
                : 'text-[#1A1A2E] border-gray-200'
              }`}
          >
            {answer || <span className="text-gray-300 text-xl">请输入答案</span>}
          </div>
        </div>

        {/* 正确/错误反馈 */}
        {feedback && (
          <div className={`mt-4 flex items-center justify-center gap-2
            ${feedback.isCorrect ? 'text-[#2EC4B6]' : 'text-[#EF476F]'}`}
          >
            {feedback.isCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">回答正确</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <span className="font-medium">
                  正确答案：<span className="text-lg">{feedback.correctAnswer}</span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 生字详情卡片（反馈后显示） */}
      {feedback && (
        <CharacterCard character={feedback.character} />
      )}

      {/* 虚拟键盘 */}
      {!feedback && (
        <div className="flex justify-center">
          <VirtualKeyboard
            layout="pinyin"
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmit}
            onBackspace={handleBackspace}
            theme="neon"
            disabled={submitting || !answer}
            showNextGuide={false}
            showTypedHighlight={false}
            fullWidth
          />
        </div>
      )}

      {/* 下一个按钮 */}
      {feedback && (
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]
            text-white text-lg font-semibold shadow-md hover:shadow-lg transition-shadow
            flex items-center justify-center gap-2"
        >
          {isLast ? '完成听写' : '下一个'}
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default DictationPractice;
