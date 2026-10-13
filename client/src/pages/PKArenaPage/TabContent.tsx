import React from 'react';
import { Zap, Play, Users, Flame } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import RoomCard from './RoomCard';
import type { PKRoom, PKRoomType } from '@shared/api.interface';

interface TabContentProps {
  activeTab: string;
  rooms: PKRoom[];
  roomsLoading: boolean;
  filteredRooms: PKRoom[];
  onQuickMatch: () => void;
  onOpenCreate: (type: PKRoomType) => void;
  onJoinRoom: (roomId: string, hasPassword?: boolean) => void;
  onJoinByCode: () => void;
}

const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  rooms,
  roomsLoading,
  filteredRooms,
  onQuickMatch,
  onOpenCreate,
  onJoinRoom,
  onJoinByCode,
}) => {
  const renderRoomList = (list: PKRoom[], emptyText: string) => {
    if (roomsLoading) {
       return <div className="text-center py-12 text-gray-500">加载中...</div>;
    }
    if (list.length === 0) {
      return (
          <div className="text-center py-12 glass-card rounded-2xl text-slate-400">
          {emptyText}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((room) => (
          <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
        ))}
      </div>
    );
  };

  if (activeTab === '1v1') {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <Button variant="default" size="lg" onClick={onQuickMatch}
            className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 border-0">
            <Zap size={20} /> 快速匹配
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onOpenCreate('1v1')}
            className="flex-1 h-14 text-lg">
            <Play size={20} /> 创建房间
          </Button>
        </div>
        <Button variant="outline" onClick={onJoinByCode}
          className="w-full h-10 text-sm border-gray-200 text-gray-600 hover:bg-gray-50">
          输入房号加入
        </Button>
        <div>
           <h2 className="text-lg font-semibold text-white mb-3">1v1 房间列表</h2>
          {renderRoomList(filteredRooms, '暂无 1v1 房间')}
        </div>
      </div>
    );
  }

  if (activeTab === 'multi') {
    return (
      <div className="space-y-6">
        <Button variant="default" size="lg" onClick={() => onOpenCreate('multi')}
          className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 border-0">
          <Users size={20} /> 创建多人房间
        </Button>
        <Button variant="outline" onClick={onJoinByCode}
          className="w-full h-10 text-sm border-gray-200 text-gray-600 hover:bg-gray-50">
          输入房号加入
        </Button>
        <div>
           <h2 className="text-lg font-semibold text-white mb-3">多人房间列表</h2>
          {renderRoomList(filteredRooms, '暂无多人房间')}
        </div>
      </div>
    );
  }

  if (activeTab === 'arena') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Flame size={24} /> 自由竞技场
          </h2>
          <p className="text-sm opacity-90 mb-4">任意房间均可加入，与全服玩家自由对战</p>
          <div className="flex gap-3">
            <Button variant="default" size="lg" onClick={onQuickMatch}
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20">
              <Zap size={18} /> 随机加入
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onOpenCreate('1v1')}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Play size={18} /> 开新房间
            </Button>
          </div>
        </div>
        <div>
           <h2 className="text-lg font-semibold text-white mb-3">全部房间</h2>
          {renderRoomList(rooms, '暂无房间')}
        </div>
      </div>
    );
  }

  return null;
};

export default TabContent;
