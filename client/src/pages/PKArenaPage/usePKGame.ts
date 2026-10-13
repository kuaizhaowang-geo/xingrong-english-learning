import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import * as pkArenaApi from '@client/src/api/pk-arena';
import type {
  PKRoomDetail,
  PKQuestion,
  PKAnswerResponse,
  PKResultResponse,
  PKRoomType,
  PKCourseType,
} from '@shared/api.interface';

const QUESTION_TIME_LIMIT = 15;
const POLL_INTERVAL = 2000;

interface UsePKGameReturn {
  currentRoom: PKRoomDetail | null;
  questions: PKQuestion[];
  myUserId: string;
  myScore: number;
  myCorrect: number;
  answeredCount: number;
  timeLeft: number;
  result: PKResultResponse | null;
  starting: boolean;
  isCreator: boolean;
  startMatch: (room: PKRoomDetail) => void;
  createRoom: (data: {
    title: string;
    roomType: PKRoomType;
    courseType: PKCourseType;
    maxPlayers: number;
  }) => Promise<void>;
  joinRoom: (roomId: string, fallbackRoom?: PKRoomDetail) => Promise<void>;
  startBattle: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  submitAnswer: (dto: {
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }) => Promise<void>;
  resetGame: () => void;
}

export function usePKGame(): UsePKGameReturn {
  const [currentRoom, setCurrentRoom] = useState<PKRoomDetail | null>(null);
  const [questions, setQuestions] = useState<PKQuestion[]>([]);
  const [myUserId, setMyUserId] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [myCorrect, setMyCorrect] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [result, setResult] = useState<PKResultResponse | null>(null);
  const [starting, setStarting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCreator = currentRoom?.creatorId === myUserId;

  // 轮询房间状态
  useEffect(() => {
    const phase = currentRoom?.status;
    if ((phase === 'waiting' || phase === 'playing') && currentRoom && myUserId) {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await pkArenaApi.getRoom(currentRoom.id);
          setCurrentRoom(updated);
          const me = updated.players.find((p) => p.userId === myUserId);
          if (me && phase === 'playing') {
            setMyScore(me.score);
            setMyCorrect(me.correctCount);
            setAnsweredCount(me.answeredCount);
            if (updated.players.every((p) => p.status === 'finished')) {
              const res = await pkArenaApi.getResult(updated.id);
              setResult(res);
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } catch (error) {
          logger.error('轮询房间失败', error as Error);
        }
      }, POLL_INTERVAL);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    return undefined;
  }, [currentRoom?.id, currentRoom?.status, myUserId]);

  // 倒计时
  useEffect(() => {
    if (currentRoom?.status === 'playing') {
      setTimeLeft(QUESTION_TIME_LIMIT);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    return undefined;
  }, [currentRoom?.status, answeredCount]);

  const startMatch = useCallback((room: PKRoomDetail) => {
    setCurrentRoom(room);
    const me = room.players[0];
    if (me) setMyUserId(me.userId);
  }, []);

  const createRoom = useCallback(async (data: {
    title: string;
    roomType: PKRoomType;
    courseType: PKCourseType;
    maxPlayers: number;
  }) => {
    const room = await pkArenaApi.createRoom(data);
    setCurrentRoom(room);
    const me = room.players[0];
    if (me) setMyUserId(me.userId);
  }, []);

  const joinRoom = useCallback(async (roomId: string) => {
    const room = await pkArenaApi.joinRoom(roomId);
    setCurrentRoom(room);
    const me = room.players[room.players.length - 1];
    if (me) setMyUserId(me.userId);
  }, []);

  const startBattle = useCallback(async () => {
    if (!currentRoom) return;
    setStarting(true);
    try {
      const { room, questions: qs } = await pkArenaApi.startRoom(currentRoom.id);
      setCurrentRoom(room);
      setQuestions(qs);
      setMyScore(0);
      setMyCorrect(0);
      setAnsweredCount(0);
      setTimeLeft(QUESTION_TIME_LIMIT);
    } finally {
      setStarting(false);
    }
  }, [currentRoom]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;
    try {
      await pkArenaApi.leaveRoom(currentRoom.id);
    } catch (error) {
      logger.warn('离开房间API失败', error as Error);
    }
    setCurrentRoom(null);
    setQuestions([]);
    setResult(null);
    setMyScore(0);
    setMyCorrect(0);
    setAnsweredCount(0);
  }, [currentRoom]);

  const submitAnswer = useCallback(async (dto: {
    questionIndex: number;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
  }) => {
    if (!currentRoom) return;
    const res: PKAnswerResponse = await pkArenaApi.submitAnswer(currentRoom.id, dto);
    setMyScore(res.score);
    setMyCorrect(res.correctCount);
    setAnsweredCount(res.answeredCount);
    if (res.isFinished && res.isAllPlayersFinished) {
      const resData = await pkArenaApi.getResult(currentRoom.id);
      setResult(resData);
    }
  }, [currentRoom]);

  const resetGame = useCallback(() => {
    setCurrentRoom(null);
    setQuestions([]);
    setResult(null);
    setMyScore(0);
    setMyCorrect(0);
    setAnsweredCount(0);
    setMyUserId('');
  }, []);

  return {
    currentRoom,
    questions,
    myUserId,
    myScore,
    myCorrect,
    answeredCount,
    timeLeft,
    result,
    starting,
    isCreator,
    startMatch,
    createRoom,
    joinRoom,
    startBattle,
    leaveRoom,
    submitAnswer,
    resetGame,
  };
}

export default usePKGame;
