import React from 'react';
import { Trophy, XCircle, Users, Home, RefreshCw } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { PKResultResponse } from '@shared/api.interface';

const ResultView: React.FC<{
  result: PKResultResponse;
  myUserId: string;
  onPlayAgain: () => void;
  onBack: () => void;
}> = ({ result, myUserId, onPlayAgain, onBack }) => {
  const myRank = result.rankings.find((r) => r.userId === myUserId);
  const isWin = myRank?.result === 'win';

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white text-center shadow-xl">
        <div className="mb-4">
          {isWin ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400 flex items-center justify-center">
              <Trophy size={40} className="text-yellow-800" />
            </div>
          ) : myRank?.result === 'lose' ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-400/40 flex items-center justify-center">
              <XCircle size={40} />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center">
              <Users size={40} />
            </div>
          )}
        </div>
        <div className="text-3xl font-bold mb-2">
          {isWin ? '胜利！' : myRank?.result === 'lose' ? '惜败...' : '平局'}
        </div>
        <div className="text-white/80 mb-6">
          得分 {myRank?.score ?? 0} 分 · 答对 {myRank?.correctCount ?? 0} 题
        </div>

        <div className="space-y-2 mb-6">
          {result.rankings.map((item) => (
            <div
              key={item.userId}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                item.userId === myUserId ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                {item.rank}
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold">
                {item.nickname.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{item.nickname}</div>
                <div className="text-xs opacity-70">答对 {item.correctCount} 题</div>
              </div>
              <div className="text-lg font-bold">{item.score}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack} className="flex-1 h-12">
            <Home size={18} />
            返回大厅
          </Button>
          <Button
            variant="default"
            onClick={onPlayAgain}
            className="flex-1 h-12 bg-gradient-to-r from-amber-400 to-orange-500 border-0"
          >
            <RefreshCw size={18} />
            再来一局
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
