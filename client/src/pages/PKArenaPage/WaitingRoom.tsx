import React from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { PKRoomDetail } from '@shared/api.interface';

const WaitingRoom: React.FC<{
  room: PKRoomDetail;
  isCreator: boolean;
  onStart: () => void;
  onLeave: () => void;
  starting: boolean;
}> = ({ room, isCreator, onStart, onLeave, starting }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onLeave}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <ArrowLeft size={16} />
        返回大厅
      </button>
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm opacity-80">房间号</div>
            <div className="text-3xl font-bold tracking-wider">{room.roomCode}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">
              {room.roomType === '1v1' ? '双人对战' : '多人混战'}
            </div>
            <div className="text-lg font-semibold">{room.title}</div>
          </div>
        </div>
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm">
            等待加入中 · {room.playerCount}/{room.maxPlayers}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: room.maxPlayers }).map((_, idx) => {
            const player = room.players[idx];
            return (
              <div
                key={idx}
                className={`rounded-xl p-3 text-center ${
                  player ? 'bg-white/20' : 'bg-white/10 border-2 border-dashed border-white/30'
                }`}
              >
                {player ? (
                  <>
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg font-bold mb-2">
                      {player.nickname?.charAt(0) || '?'}
                    </div>
                    <div className="text-sm font-medium truncate">{player.nickname}</div>
                    {player.userId === room.creatorId && (
                      <div className="text-xs text-amber-200 mt-1">房主</div>
                    )}
                  </>
                ) : (
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-white/50 mb-2">
                    ?
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {isCreator ? (
          <Button
            variant="default"
            size="lg"
            onClick={onStart}
            disabled={room.playerCount < 2 || starting}
            className="w-full h-12 text-lg bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg"
          >
            <Play size={20} />
            {starting ? '开始中...' : room.playerCount < 2 ? '等待更多玩家' : '开始对战'}
          </Button>
        ) : (
          <div className="text-center text-sm opacity-80">
            等待房主开始对战...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
