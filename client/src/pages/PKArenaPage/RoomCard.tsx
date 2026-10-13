import React from 'react';
import { Users, Target, Lock, Hash } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import type { PKRoom } from '@shared/api.interface';

const RoomCard: React.FC<{
  room: PKRoom;
  onJoin: (roomId: string, hasPassword?: boolean) => void;
  compact?: boolean;
}> = ({ room, onJoin, compact = false }) => {
  const statusMap: Record<string, { text: string; color: string }> = {
    waiting: { text: '等待中', color: 'bg-green-100 text-green-600' },
    matching: { text: '匹配中', color: 'bg-blue-100 text-blue-600' },
    playing: { text: '对战中', color: 'bg-orange-100 text-orange-600' },
    finished: { text: '已结束', color: 'bg-gray-100 text-gray-600' },
  };
  const status = statusMap[room.status] || statusMap.waiting;
  const typeLabel = room.roomType === '1v1' ? '1v1' : `${room.maxPlayers}人混战`;
  const courseLabel = { words: '单词', sentences: '句子', mixed: '混合' }[room.courseType];
  // 模拟是否有密码（根据 roomCode 奇偶）
  const hasPassword = parseInt(room.roomCode, 10) % 5 === 0;

  if (compact) {
    return (
       <div className="min-w-[240px] rounded-xl glass-card shadow-sm hover:shadow-md transition-all p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
            {status.text}
          </span>
           <span className="text-xs text-gray-500 font-mono">
            <Hash className="w-3 h-3 inline" />
            {room.roomCode}
          </span>
        </div>
        <div className="font-semibold text-gray-800 text-sm truncate mb-1">{room.title}</div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {room.playerCount}/{room.maxPlayers}
          </span>
          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">
            {typeLabel}
          </span>
        </div>
        {room.status === 'waiting' && room.playerCount < room.maxPlayers ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => onJoin(room.id, hasPassword)}
            className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
          >
            {hasPassword ? <Lock size={12} /> : null}
            加入
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled className="w-full h-8 text-xs">
            {room.status === 'waiting' ? '已满' : '进行中'}
          </Button>
        )}
      </div>
    );
  }

  return (
     <div className="rounded-2xl glass-card shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-lg truncate flex items-center gap-2">
            {room.title}
             {hasPassword && <Lock className="w-4 h-4 text-gray-500" />}
          </div>
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            房间号: {room.roomCode}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ml-2 ${status.color}`}>
          {status.text}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 flex-wrap">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {room.playerCount}/{room.maxPlayers}
        </span>
        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs">
          {typeLabel}
        </span>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
          {courseLabel}
        </span>
      </div>
      <div className="flex items-center justify-between">
         <div className="text-xs text-gray-500 flex items-center gap-1">
          <Target size={12} />
          房主发起
        </div>
        {room.status === 'waiting' && room.playerCount < room.maxPlayers ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => onJoin(room.id, hasPassword)}
            className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
          >
            {hasPassword && <Lock size={14} />}
            立即参与
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            {room.status === 'waiting' ? '已满' : '进行中'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
