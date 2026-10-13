import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { PKRoomDetail, PKQuestion } from '@shared/api.interface';

const QUESTION_TIME_LIMIT = 15;

interface BattleViewProps {
  room: PKRoomDetail;
  questions: PKQuestion[];
  myUserId: string;
  onAnswer: (dto: {
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }) => void;
  myScore: number;
  myCorrect: number;
  answeredCount: number;
  timeLeft: number;
}

const BattleView: React.FC<BattleViewProps> = ({
  room,
  questions,
  myUserId,
  onAnswer,
  myScore,
  myCorrect,
  answeredCount,
  timeLeft,
}) => {
  const currentIdx = answeredCount;
  const question = questions[currentIdx];
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<
    { correct: boolean; correctAnswer: string } | null
  >(null);

  useEffect(() => {
    setInputValue('');
    setSelectedOption(null);
    setShowFeedback(null);
  }, [currentIdx]);

  const opponent = room.players.find((p) => p.userId !== myUserId);
  const opponentScore = opponent?.score ?? 0;
  const opponentName = opponent?.nickname ?? '对手';

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback) return;

    let answer = '';
    let isCorrect = false;

    if (question.questionType === 'word') {
      answer = inputValue.trim();
      isCorrect = answer.toLowerCase() === question.answer.toLowerCase();
    } else {
      if (!selectedOption) return;
      answer = selectedOption;
      isCorrect = answer === question.answer;
    }

    const timeSpent = QUESTION_TIME_LIMIT - timeLeft;
    setShowFeedback({ correct: isCorrect, correctAnswer: question.answer });

    setTimeout(() => {
      onAnswer({
        questionIndex: currentIdx,
        answer,
        isCorrect,
        timeSpent: Math.max(0, timeSpent),
      });
    }, 800);
  }, [question, inputValue, selectedOption, showFeedback, timeLeft, currentIdx, onAnswer]);

  // 倒计时结束自动提交
  useEffect(() => {
    if (timeLeft <= 0 && !showFeedback && question) {
      const answer =
        question.questionType === 'word' ? inputValue : selectedOption || '';
      const isCorrect =
        question.questionType === 'word'
          ? answer.trim().toLowerCase() === question.answer.toLowerCase()
          : answer === question.answer;
      setShowFeedback({ correct: isCorrect, correctAnswer: question.answer });
      setTimeout(() => {
        onAnswer({
          questionIndex: currentIdx,
          answer,
          isCorrect,
          timeSpent: QUESTION_TIME_LIMIT,
        });
      }, 800);
    }
  }, [timeLeft, question, showFeedback, inputValue, selectedOption, currentIdx, onAnswer]);

  if (!question) {
    return <div className="text-center text-white">加载中...</div>;
  }

  const timeColor =
    timeLeft > 5 ? 'text-green-400' : timeLeft > 2 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="max-w-2xl mx-auto">
      {/* 顶部比分 */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 mb-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold mb-1">
              我
            </div>
            <div className="text-xs opacity-80">我</div>
            <div className="text-2xl font-bold">{myScore}</div>
          </div>
          <div className="px-4 text-sm opacity-70 text-center">
            <div>房间号 {room.roomCode}</div>
            <div>
              第 {currentIdx + 1}/{questions.length} 题
            </div>
            <div className={`font-bold text-lg ${timeColor}`}>
              {timeLeft}s
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold mb-1">
              {opponentName.charAt(0)}
            </div>
            <div className="text-xs opacity-80">{opponentName}</div>
            <div className="text-2xl font-bold">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium mb-3">
            {question.questionType === 'word' ? '单词拼写' : '句子选择'}
          </span>
          <div className="text-xl font-bold text-gray-800 mb-2">{question.prompt}</div>
           <div className="text-sm text-gray-500">
            {question.questionType === 'word'
              ? '请输入对应的英文单词'
              : '请选择正确的英文句子'}
          </div>
        </div>

        {question.questionType === 'word' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="输入英文单词..."
              disabled={!!showFeedback}
              autoFocus
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-lg text-center focus:outline-none focus:border-orange-400 disabled:bg-gray-50"
            />
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
              disabled={!inputValue.trim() || !!showFeedback}
              className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-amber-500 border-0"
            >
              提交答案
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {question.options?.map((opt) => {
              const isSelected = selectedOption === opt.text;
              const isCorrectOption = opt.text === question.answer;
              let btnClass =
                'w-full h-12 px-4 rounded-xl text-left font-medium transition-all border-2 ';
              if (showFeedback) {
                if (isCorrectOption) {
                  btnClass += 'border-green-500 bg-green-50 text-green-700';
                } else if (isSelected && !isCorrectOption) {
                  btnClass += 'border-red-500 bg-red-50 text-red-700';
                } else {
                  btnClass += 'border-gray-200 bg-gray-50 text-gray-400';
                }
              } else {
                btnClass += isSelected
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700';
              }
              return (
                <button
                  key={opt.label}
                  onClick={() => !showFeedback && setSelectedOption(opt.text)}
                  disabled={!!showFeedback}
                  className={btnClass}
                >
                  <span className="inline-block w-7 h-7 mr-3 rounded-full bg-orange-100 text-orange-600 text-center text-sm font-bold leading-7">
                    {opt.label}
                  </span>
                  {opt.text}
                </button>
              );
            })}
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedOption || !!showFeedback}
              className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-amber-500 border-0"
            >
              确认答案
            </Button>
          </div>
        )}

        {showFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-center font-medium ${
              showFeedback.correct
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {showFeedback.correct ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={18} /> 回答正确！
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <XCircle size={18} />
                正确答案：{showFeedback.correctAnswer}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="flex justify-center gap-8 mt-4 text-white/80 text-sm">
        <span className="flex items-center gap-1">
          <CheckCircle size={14} />
          答对 {myCorrect} 题
        </span>
        <span className="flex items-center gap-1">
          <Trophy size={14} />
          得分 {myScore}
        </span>
      </div>
    </div>
  );
};

export default BattleView;
