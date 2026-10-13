import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Swords, Users, Home, Flame } from 'lucide-react';
import * as pkArenaApi from '@client/src/api/pk-arena';
import StatsCard from './StatsCard';
import CreateRoomModal from './CreateRoomModal';
import WaitingRoom from './WaitingRoom';
import BattleView from './BattleView';
import ResultView from './ResultView';
import MatchModal from './MatchModal';
import LobbyView from './LobbyView';
import MyRecordsView from './MyRecordsView';
import PasswordModal, { JoinByCodeModal } from './PasswordModal';
import TabContent from './TabContent';
import usePKGame from './usePKGame';
import type {
  PKRoom,
  PKStats,
  PKCourseType,
  PKRoomType,
  PKMatchHistoryItem,
} from '@shared/api.interface';

type TabKey = 'lobby' | '1v1' | 'multi' | 'arena';
type GamePhase = 'list' | 'records';

const TABS: {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { key: 'lobby', label: 'PK大厅', icon: Home },
  { key: '1v1', label: '双人PK', icon: Swords },
  { key: 'multi', label: '多人PK', icon: Users },
  { key: 'arena', label: '自由竞技场', icon: Flame },
];

const PKArenaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('lobby');
  const [stats, setStats] = useState<PKStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [rooms, setRooms] = useState<PKRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('list');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<PKRoomType>('1v1');
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordRoomId, setPasswordRoomId] = useState('');
  const [passwordRoomTitle, setPasswordRoomTitle] = useState('');
  const [joinByCodeOpen, setJoinByCodeOpen] = useState(false);
  const [history, setHistory] = useState<PKMatchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [onlineCount] = useState(0);

  const game = usePKGame();

  const loadStats = useCallback(async () => {
    try {
      const data = await pkArenaApi.getStats();
      setStats(data);
    } catch (error) {
      logger.warn('加载PK战绩失败', error as Error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async (status?: string) => {
    setRoomsLoading(true);
    try {
      const data = await pkArenaApi.listRooms({ status, pageSize: 20 });
      setRooms(data.items || []);
    } catch (error) {
      logger.warn('加载房间列表失败', error as Error);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await pkArenaApi.getHistory({ pageSize: 20 });
      setHistory(data.items || []);
    } catch (error) {
      logger.warn('加载对战历史失败', error as Error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadRooms();
  }, [loadStats, loadRooms]);

  // ===== 匹配相关 =====
  const handleQuickMatch = (): void => {
    setMatchModalOpen(true);
  };

  const handleMatchSuccess = async (): Promise<void> => {
    try {
      const room = await pkArenaApi.quickMatch('mixed');
      setMatchModalOpen(false);
      game.startMatch(room);
    } catch (error) {
      logger.warn('快速匹配失败', error as Error);
      setMatchModalOpen(false);
    }
  };

  // ===== 创建房间 =====
  const handleCreateRoom = (data: {
    title: string;
    roomType: PKRoomType;
    courseType: PKCourseType;
    maxPlayers: number;
  }) => {
    setCreateModalOpen(false);
    game.createRoom(data);
  };

  // ===== 加入房间 =====
  const handleJoinRoom = (roomId: string, hasPassword = false): void => {
    if (hasPassword) {
      const room = rooms.find((r) => r.id === roomId);
      setPasswordRoomId(roomId);
      setPasswordRoomTitle(room?.title || '');
      setPasswordModalOpen(true);
      return;
    }
    doJoinRoom(roomId);
  };

  const doJoinRoom = async (roomId: string): Promise<void> => {
    await game.joinRoom(roomId);
  };

  const handlePasswordSubmit = (_password: string): void => {
    setPasswordModalOpen(false);
    doJoinRoom(passwordRoomId);
  };

  const handleJoinByCode = async (code: string): Promise<void> => {
    // 通过房间号加入：先获取房间详情再加入
    try {
      // 先尝试通过 listRooms 找到对应房间，或直接尝试加入
      const roomList = await pkArenaApi.listRooms({ pageSize: 50 });
      const found = roomList.items?.find((r: PKRoom) => r.roomCode === code);
      if (found) {
        setJoinByCodeOpen(false);
        await game.joinRoom(found.id);
      } else {
        logger.warn('未找到房间号对应的房间');
      }
    } catch (error) {
      logger.warn('通过房间号加入失败', error as Error);
    }
  };

  // ===== 离开 / 返回 =====
  const handleLeaveRoom = async () => {
    await game.leaveRoom();
    loadRooms();
  };

  const handleBackToList = (): void => {
    game.resetGame();
    loadRooms();
    loadStats();
  };

  const handleViewRecords = (): void => {
    loadHistory();
    setGamePhase('records');
  };

  const filteredRooms = rooms.filter((room) => {
    if (activeTab === '1v1') return room.roomType === '1v1';
    if (activeTab === 'multi') return room.roomType === 'multi';
    return true;
  });

  const handleOpenCreate = (type: PKRoomType): void => {
    setCreateDefaultType(type);
    setCreateModalOpen(true);
  };

  const inRoom = game.currentRoom !== null;
  const isWaiting = game.currentRoom?.status === 'waiting';
  const isPlaying = game.currentRoom?.status === 'playing' && game.questions.length > 0;
  const showResult = game.result !== null;

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Swords className="text-orange-500" size={28} />
            PK 竞技场
          </h1>
          <p className="text-sm text-gray-500 mt-1">与其他玩家一决高下，提升英语实力</p>
        </div>
      </div>

      {!inRoom && gamePhase === 'list' && (
        <div className="space-y-6">
          <StatsCard stats={stats} loading={statsLoading} />

          <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-w-[90px] ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'lobby' && (
            <LobbyView
              stats={stats}
              statsLoading={statsLoading}
              rooms={rooms}
              roomsLoading={roomsLoading}
              onlineCount={onlineCount}
              onQuickStart={handleQuickMatch}
              onCreateRoom={() => handleOpenCreate('1v1')}
              onJoinRoom={handleJoinRoom}
              onRefreshRooms={() => loadRooms()}
              onJoinByCode={() => setJoinByCodeOpen(true)}
              onViewRecords={handleViewRecords}
            />
          )}

          {activeTab !== 'lobby' && (
            <TabContent
              activeTab={activeTab}
              rooms={rooms}
              roomsLoading={roomsLoading}
              filteredRooms={filteredRooms}
              onQuickMatch={handleQuickMatch}
              onOpenCreate={handleOpenCreate}
              onJoinRoom={handleJoinRoom}
              onJoinByCode={() => setJoinByCodeOpen(true)}
            />
          )}
        </div>
      )}

      {gamePhase === 'records' && (
        <MyRecordsView
          stats={stats}
          history={history}
          loading={statsLoading}
          historyLoading={historyLoading}
          onBack={() => setGamePhase('list')}
        />
      )}

      {isWaiting && game.currentRoom && (
        <WaitingRoom
          room={game.currentRoom}
          isCreator={game.isCreator}
          onStart={game.startBattle}
          onLeave={handleLeaveRoom}
          starting={game.starting}
        />
      )}

      {isPlaying && game.currentRoom && (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 -mx-6 -mt-6 px-6 pt-6 pb-8 min-h-[calc(100vh-8rem)]">
          <BattleView
            room={game.currentRoom}
            questions={game.questions}
            myUserId={game.myUserId}
            onAnswer={game.submitAnswer}
            myScore={game.myScore}
            myCorrect={game.myCorrect}
            answeredCount={game.answeredCount}
            timeLeft={game.timeLeft}
          />
        </div>
      )}

      {showResult && game.result && (
        <ResultView
          result={game.result}
          myUserId={game.myUserId}
          onPlayAgain={handleQuickMatch}
          onBack={handleBackToList}
        />
      )}

      <CreateRoomModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateRoom}
        defaultType={createDefaultType}
      />

      <MatchModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        onMatched={handleMatchSuccess}
        onlineCount={onlineCount}
      />

      <PasswordModal
        open={passwordModalOpen}
        roomTitle={passwordRoomTitle}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />

      <JoinByCodeModal
        open={joinByCodeOpen}
        onClose={() => setJoinByCodeOpen(false)}
        onSubmit={handleJoinByCode}
      />
    </div>
  );
};

export default PKArenaPage;
