import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import {
  pkRooms,
  pkPlayers,
  pkMatchRecords,
  wordItems,
  sentencePuzzles,
} from '@server/database/schema';
import { eq, and, desc, sql, inArray, count } from 'drizzle-orm';
import type {
  PKRoom,
  PKPlayer,
  PKRoomDetail,
  PKRoomListResponse,
  PKCreateRoomDto,
  PKAnswerDto,
  PKAnswerResponse,
  PKResultResponse,
  PKResultItem,
  PKStats,
  PKMatchHistoryResponse,
  PKMatchHistoryItem,
  PKQuestion,
  PKRoomStatus,
  PKCourseType,
  PKMatchResult,
  PKRoomType,
} from '@shared/api.interface';

const QUESTIONS_PER_ROOM = 5;

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function mapRoom(room: {
  id: string;
  roomCode: string;
  roomType: string;
  title: string;
  maxPlayers: number;
  courseType: string;
  status: string;
  creatorId: string;
  createdAt: Date;
}, players: PKPlayer[], playerCount: number): PKRoom {
  return {
    id: room.id,
    roomCode: room.roomCode,
    roomType: room.roomType as PKRoomType,
    title: room.title,
    maxPlayers: room.maxPlayers,
    courseType: room.courseType as PKCourseType,
    status: room.status as PKRoomStatus,
    creatorId: room.creatorId,
    createdAt: room.createdAt.toISOString(),
    players,
    playerCount,
  };
}

function mapPlayer(player: {
  id: string;
  userId: string;
  nickname: string;
  score: number;
  answeredCount: number;
  correctCount: number;
  status: string;
  joinedAt: Date;
}): PKPlayer {
  return {
    id: player.id,
    userId: player.userId,
    nickname: player.nickname,
    score: player.score,
    answeredCount: player.answeredCount,
    correctCount: player.correctCount,
    status: player.status as PKPlayer['status'],
    joinedAt: player.joinedAt.toISOString(),
  };
}

@Injectable()
export class PkArenaService {
  private readonly logger = new Logger(PkArenaService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ===== 房间列表 =====
  async listRooms(
    status?: string,
    pageSize: number = 20,
  ): Promise<PKRoomListResponse> {
    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(pkRooms.status, status));
    }

    const query = whereConditions.length > 0
      ? this.db
          .select({
            id: pkRooms.id,
            roomCode: pkRooms.roomCode,
            roomType: pkRooms.roomType,
            title: pkRooms.title,
            maxPlayers: pkRooms.maxPlayers,
            courseType: pkRooms.courseType,
            status: pkRooms.status,
            creatorId: sql<string>`(${pkRooms.creator}).user_id`,
            createdAt: pkRooms.createdAt,
          })
          .from(pkRooms)
          .where(and(...whereConditions))
      : this.db
          .select({
            id: pkRooms.id,
            roomCode: pkRooms.roomCode,
            roomType: pkRooms.roomType,
            title: pkRooms.title,
            maxPlayers: pkRooms.maxPlayers,
            courseType: pkRooms.courseType,
            status: pkRooms.status,
            creatorId: sql<string>`(${pkRooms.creator}).user_id`,
            createdAt: pkRooms.createdAt,
          })
          .from(pkRooms);

    const rooms = await query
      .orderBy(desc(pkRooms.createdAt))
      .limit(pageSize);

    const roomIds = rooms.map((r) => r.id);

    let playersByRoom: Record<string, PKPlayer[]> = {};
    if (roomIds.length > 0) {
      const allPlayers = await this.db
        .select({
          id: pkPlayers.id,
          userId: sql<string>`(${pkPlayers.userProfile}).user_id`,
          nickname: pkPlayers.nickname,
          score: pkPlayers.score,
          answeredCount: pkPlayers.answeredCount,
          correctCount: pkPlayers.correctCount,
          status: pkPlayers.status,
          joinedAt: pkPlayers.joinedAt,
          roomId: pkPlayers.roomId,
        })
        .from(pkPlayers)
        .where(inArray(pkPlayers.roomId, roomIds));

      for (const p of allPlayers) {
        const player = mapPlayer(p);
        if (!playersByRoom[p.roomId]) playersByRoom[p.roomId] = [];
        playersByRoom[p.roomId].push(player);
      }
    }

    const items = rooms.map((room) => {
      const ps = playersByRoom[room.id] || [];
      return mapRoom(room, ps, ps.length);
    });

    return { items, total: items.length };
  }

  // ===== 创建房间 =====
  async createRoom(
    userId: string,
    nickname: string,
    dto: PKCreateRoomDto,
  ): Promise<PKRoomDetail> {
    if (!dto.title?.trim()) {
      throw new BadRequestException('房间标题不能为空');
    }
    if (!dto.roomType || !['1v1', 'multi'].includes(dto.roomType)) {
      throw new BadRequestException('房间类型不正确');
    }
    if (!dto.courseType || !['words', 'sentences', 'mixed'].includes(dto.courseType)) {
      throw new BadRequestException('题目类型不正确');
    }

    const maxPlayers = dto.roomType === '1v1' ? 2 : (dto.maxPlayers ?? 4);
    if (maxPlayers < 2 || maxPlayers > 8) {
      throw new BadRequestException('最大人数必须在 2-8 之间');
    }

    // 生成唯一房间号（重试最多10次）
    let roomCode: string = '';
    for (let i = 0; i < 10; i += 1) {
      const candidate = generateRoomCode();
      const existing = await this.db
        .select({ id: pkRooms.id })
        .from(pkRooms)
        .where(eq(pkRooms.roomCode, candidate))
        .limit(1);
      if (existing.length === 0) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      throw new ConflictException('房间号生成失败，请稍后重试');
    }

    const creatorProfile = sql`ROW(${userId})::user_profile`;

    const inserted = await this.db
      .insert(pkRooms)
      .values({
        roomCode,
        roomType: dto.roomType,
        title: dto.title,
        maxPlayers,
        courseType: dto.courseType,
        status: 'waiting',
        creator: creatorProfile,
      })
      .returning({
        id: pkRooms.id,
        roomCode: pkRooms.roomCode,
        roomType: pkRooms.roomType,
        title: pkRooms.title,
        maxPlayers: pkRooms.maxPlayers,
        courseType: pkRooms.courseType,
        status: pkRooms.status,
        createdAt: pkRooms.createdAt,
      });

    const room = inserted[0];
    if (!room) throw new BadRequestException('创建房间失败');

    // 创建人自动加入
    const playerInserted = await this.db
      .insert(pkPlayers)
      .values({
        roomId: room.id,
        userProfile: creatorProfile,
        nickname: nickname || '玩家',
        status: 'waiting',
      })
      .returning({
        id: pkPlayers.id,
        nickname: pkPlayers.nickname,
        score: pkPlayers.score,
        answeredCount: pkPlayers.answeredCount,
        correctCount: pkPlayers.correctCount,
        status: pkPlayers.status,
        joinedAt: pkPlayers.joinedAt,
      });

    const player = playerInserted[0];
    const players: PKPlayer[] = player
      ? [mapPlayer({ ...player, userId })]
      : [];

    return {
      ...mapRoom(
        {
          id: room.id,
          roomCode: room.roomCode,
          roomType: room.roomType,
          title: room.title,
          maxPlayers: room.maxPlayers,
          courseType: room.courseType,
          status: room.status,
          creatorId: userId,
          createdAt: room.createdAt,
        },
        players,
        1,
      ),
      currentQuestionIndex: 0,
      questions: [],
    };
  }

  // ===== 房间详情 =====
  async getRoom(roomId: string): Promise<PKRoomDetail> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        roomCode: pkRooms.roomCode,
        roomType: pkRooms.roomType,
        title: pkRooms.title,
        maxPlayers: pkRooms.maxPlayers,
        courseType: pkRooms.courseType,
        status: pkRooms.status,
        creatorId: sql<string>`(${pkRooms.creator}).user_id`,
        createdAt: pkRooms.createdAt,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length === 0) {
      throw new NotFoundException('房间不存在');
    }
    const room = roomRows[0];

    const playerRows = await this.db
      .select({
        id: pkPlayers.id,
        userId: sql<string>`(${pkPlayers.userProfile}).user_id`,
        nickname: pkPlayers.nickname,
        score: pkPlayers.score,
        answeredCount: pkPlayers.answeredCount,
        correctCount: pkPlayers.correctCount,
        status: pkPlayers.status,
        joinedAt: pkPlayers.joinedAt,
      })
      .from(pkPlayers)
      .where(eq(pkPlayers.roomId, roomId))
      .orderBy(pkPlayers.joinedAt);

    const players = playerRows.map((p) => mapPlayer(p));

    // 当前题目索引：取当前用户已答题数（这里以全员最小已答数作为下一题索引不合理，
    // 改为 0 表示未开始；playing 状态下返回玩家各自进度）
    const currentQuestionIndex = room.status === 'playing'
      ? Math.min(...players.map((p) => p.answeredCount), QUESTIONS_PER_ROOM)
      : 0;

    return {
      ...mapRoom(room, players, players.length),
      currentQuestionIndex,
      questions: [],
    };
  }

  // ===== 加入房间 =====
  async joinRoom(roomId: string, userId: string, nickname: string): Promise<PKRoomDetail> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        roomCode: pkRooms.roomCode,
        roomType: pkRooms.roomType,
        title: pkRooms.title,
        maxPlayers: pkRooms.maxPlayers,
        courseType: pkRooms.courseType,
        status: pkRooms.status,
        creatorId: sql<string>`(${pkRooms.creator}).user_id`,
        createdAt: pkRooms.createdAt,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length === 0) {
      throw new NotFoundException('房间不存在');
    }
    const room = roomRows[0];

    if (room.status !== 'waiting') {
      throw new BadRequestException('房间已开始或已结束，无法加入');
    }

    // 检查是否已在房间内
    const existingPlayer = await this.db
      .select({ id: pkPlayers.id })
      .from(pkPlayers)
      .where(and(
        eq(pkPlayers.roomId, roomId),
        sql`(${pkPlayers.userProfile}).user_id = ${userId}`,
      ))
      .limit(1);

    if (existingPlayer.length > 0) {
      return this.getRoom(roomId);
    }

    // 检查人数
    const playerCountResult = await this.db
      .select({ count: count() })
      .from(pkPlayers)
      .where(eq(pkPlayers.roomId, roomId));

    const currentCount = Number(playerCountResult[0]?.count ?? 0);
    if (currentCount >= room.maxPlayers) {
      throw new ConflictException('房间人数已满');
    }

    const userProfileSql = sql`ROW(${userId})::user_profile`;
    await this.db.insert(pkPlayers).values({
      roomId,
      userProfile: userProfileSql,
      nickname: nickname || '玩家',
      status: 'waiting',
    });

    return this.getRoom(roomId);
  }

  // ===== 开始对战 =====
  async startRoom(roomId: string, userId: string): Promise<{
    room: PKRoomDetail;
    questions: PKQuestion[];
  }> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        roomCode: pkRooms.roomCode,
        roomType: pkRooms.roomType,
        title: pkRooms.title,
        maxPlayers: pkRooms.maxPlayers,
        courseType: pkRooms.courseType,
        status: pkRooms.status,
        creatorId: sql<string>`(${pkRooms.creator}).user_id`,
        createdAt: pkRooms.createdAt,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length === 0) {
      throw new NotFoundException('房间不存在');
    }
    const room = roomRows[0];

    if (room.creatorId !== userId) {
      throw new ForbiddenException('只有房主可以开始对战');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('房间状态不正确，无法开始');
    }

    // 检查至少2人
    const playerCountResult = await this.db
      .select({ count: count() })
      .from(pkPlayers)
      .where(eq(pkPlayers.roomId, roomId));
    const playerCount = Number(playerCountResult[0]?.count ?? 0);
    if (playerCount < 2) {
      throw new BadRequestException('至少需要 2 名玩家才能开始');
    }

    // 更新状态
    await this.db
      .update(pkRooms)
      .set({ status: 'playing' })
      .where(eq(pkRooms.id, roomId));

    await this.db
      .update(pkPlayers)
      .set({ status: 'playing', score: 0, answeredCount: 0, correctCount: 0 })
      .where(eq(pkPlayers.roomId, roomId));

    // 生成题目
    const questions = await this.generateQuestions(
      room.courseType as PKCourseType,
      QUESTIONS_PER_ROOM,
    );

    const roomDetail = await this.getRoom(roomId);
    return { room: roomDetail, questions };
  }

  // ===== 生成题目 =====
  private async generateQuestions(
    courseType: PKCourseType,
    total: number,
  ): Promise<PKQuestion[]> {
    const questions: PKQuestion[] = [];

    let wordCount = 0;
    let sentenceCount = 0;

    if (courseType === 'words') {
      wordCount = total;
    } else if (courseType === 'sentences') {
      sentenceCount = total;
    } else {
      wordCount = Math.ceil(total / 2);
      sentenceCount = total - wordCount;
    }

    if (wordCount > 0) {
      const words = await this.db
        .select({
          id: wordItems.id,
          word: wordItems.word,
          meaning: wordItems.meaning,
        })
        .from(wordItems)
        .orderBy(sql`random()`)
        .limit(wordCount);

      for (const w of words) {
        questions.push({
          id: w.id,
          index: 0, // 后填
          questionType: 'word',
          prompt: w.meaning,
          answer: w.word,
        });
      }
    }

    if (sentenceCount > 0) {
      const sentences = await this.db
        .select({
          id: sentencePuzzles.id,
          sentence: sentencePuzzles.sentence,
          translation: sentencePuzzles.translation,
        })
        .from(sentencePuzzles)
        .orderBy(sql`random()`)
        .limit(sentenceCount + 3); // 多取一些做干扰项

      const correctOnes = sentences.slice(0, sentenceCount);
      const distractors = sentences.slice(sentenceCount);

      for (let i = 0; i < correctOnes.length; i += 1) {
        const s = correctOnes[i];
        // 构造4个选项：1个正确 + 3个干扰
        const options = [
          { label: 'A', text: s.sentence },
        ];

        // 从干扰池中取3个，不够则从正确池中其他的取
        const pool = [...distractors, ...correctOnes.filter((_, idx) => idx !== i)];
        const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
        for (let j = 0; j < shuffled.length && options.length < 4; j += 1) {
          options.push({
            label: String.fromCharCode(65 + options.length),
            text: shuffled[j].sentence,
          });
        }

        // 打乱选项顺序
        options.sort(() => Math.random() - 0.5);
        // 重新编号
        options.forEach((opt, idx) => {
          opt.label = String.fromCharCode(65 + idx);
        });

        questions.push({
          id: s.id,
          index: 0,
          questionType: 'sentence',
          prompt: s.translation,
          answer: s.sentence,
          options,
        });
      }
    }

    // 打乱全部题目顺序并编号
    questions.sort(() => Math.random() - 0.5);
    questions.forEach((q, idx) => {
      q.index = idx;
    });

    return questions.slice(0, total);
  }

  // ===== 离开房间 =====
  async leaveRoom(roomId: string, userId: string): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(pkPlayers)
      .where(and(
        eq(pkPlayers.roomId, roomId),
        sql`(${pkPlayers.userProfile}).user_id = ${userId}`,
      ))
      .returning({ id: pkPlayers.id });

    if (deleted.length === 0) {
      throw new NotFoundException('你不在此房间中');
    }

    // 如果是房主离开且房间还在 waiting 状态，转移房主给最早加入的玩家
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        status: pkRooms.status,
        creatorId: sql<string>`(${pkRooms.creator}).user_id`,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length > 0 && roomRows[0].creatorId === userId) {
      const remaining = await this.db
        .select({
          id: pkPlayers.id,
          userId: sql<string>`(${pkPlayers.userProfile}).user_id`,
        })
        .from(pkPlayers)
        .where(eq(pkPlayers.roomId, roomId))
        .orderBy(pkPlayers.joinedAt)
        .limit(1);

      if (remaining.length > 0) {
        const newCreatorId = remaining[0].userId;
        await this.db
          .update(pkRooms)
          .set({ creator: sql`ROW(${newCreatorId})::user_profile` })
          .where(eq(pkRooms.id, roomId));
      } else {
        // 没人了，关闭房间
        await this.db.update(pkRooms).set({ status: 'finished' }).where(eq(pkRooms.id, roomId));
      }
    }

    return { success: true };
  }

  // ===== 快速匹配 =====
  async quickMatch(
    userId: string,
    nickname: string,
    courseType: PKCourseType = 'mixed',
  ): Promise<PKRoomDetail> {
    // 找 waiting 状态且未满的 1v1 房间
    const waitingRooms = await this.db
      .select({
        id: pkRooms.id,
        roomCode: pkRooms.roomCode,
        roomType: pkRooms.roomType,
        title: pkRooms.title,
        maxPlayers: pkRooms.maxPlayers,
        courseType: pkRooms.courseType,
        status: pkRooms.status,
        creatorId: sql<string>`(${pkRooms.creator}).user_id`,
        createdAt: pkRooms.createdAt,
      })
      .from(pkRooms)
      .where(and(
        eq(pkRooms.status, 'waiting'),
        eq(pkRooms.roomType, '1v1'),
        eq(pkRooms.courseType, courseType),
      ))
      .orderBy(desc(pkRooms.createdAt))
      .limit(10);

    for (const room of waitingRooms) {
      // 跳过自己创建的
      if (room.creatorId === userId) continue;

      const countResult = await this.db
        .select({ count: count() })
        .from(pkPlayers)
        .where(eq(pkPlayers.roomId, room.id));
      const cnt = Number(countResult[0]?.count ?? 0);

      if (cnt < room.maxPlayers) {
        return this.joinRoom(room.id, userId, nickname);
      }
    }

    // 没有可加入的房间，自动创建
    return this.createRoom(userId, nickname, {
      title: '随机匹配房间',
      roomType: '1v1',
      maxPlayers: 2,
      courseType,
    });
  }

  // ===== 提交答案 =====
  async submitAnswer(
    roomId: string,
    userId: string,
    dto: PKAnswerDto,
  ): Promise<PKAnswerResponse> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        status: pkRooms.status,
        maxPlayers: pkRooms.maxPlayers,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length === 0) {
      throw new NotFoundException('房间不存在');
    }
    const room = roomRows[0];

    if (room.status !== 'playing') {
      throw new BadRequestException('对战未开始或已结束');
    }

    const playerRows = await this.db
      .select({
        id: pkPlayers.id,
        score: pkPlayers.score,
        answeredCount: pkPlayers.answeredCount,
        correctCount: pkPlayers.correctCount,
        status: pkPlayers.status,
      })
      .from(pkPlayers)
      .where(and(
        eq(pkPlayers.roomId, roomId),
        sql`(${pkPlayers.userProfile}).user_id = ${userId}`,
      ))
      .limit(1);

    if (playerRows.length === 0) {
      throw new NotFoundException('你不在此房间中');
    }
    const player = playerRows[0];

    if (player.status === 'finished') {
      throw new BadRequestException('你已完成全部题目');
    }

    // 计算得分：答对基础10分，时间越快加成越多（最多+5分）
    let addScore = 0;
    if (dto.isCorrect) {
      const timeBonus = Math.max(0, Math.min(5, Math.round(5 - dto.timeSpent / 3)));
      addScore = 10 + timeBonus;
    }

    const newScore = player.score + addScore;
    const newAnswered = player.answeredCount + 1;
    const newCorrect = player.correctCount + (dto.isCorrect ? 1 : 0);
    const isFinished = newAnswered >= QUESTIONS_PER_ROOM;

    await this.db
      .update(pkPlayers)
      .set({
        score: newScore,
        answeredCount: newAnswered,
        correctCount: newCorrect,
        status: isFinished ? 'finished' : 'playing',
      })
      .where(eq(pkPlayers.id, player.id));

    // 如果玩家完成了，检查是否全员完成，全员完成则结算
    let isAllPlayersFinished = false;
    if (isFinished) {
      const allPlayers = await this.db
        .select({ status: pkPlayers.status })
        .from(pkPlayers)
        .where(eq(pkPlayers.roomId, roomId));

      isAllPlayersFinished = allPlayers.length > 0
        && allPlayers.every((p) => p.status === 'finished');

      if (isAllPlayersFinished) {
        await this.settleMatch(roomId);
      }
    }

    return {
      score: newScore,
      answeredCount: newAnswered,
      correctCount: newCorrect,
      isFinished,
      isAllPlayersFinished,
    };
  }

  // ===== 结算对战 =====
  private async settleMatch(roomId: string): Promise<void> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        roomType: pkRooms.roomType,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);
    if (roomRows.length === 0) return;
    const room = roomRows[0];

    const players = await this.db
      .select({
        id: pkPlayers.id,
        userId: sql<string>`(${pkPlayers.userProfile}).user_id`,
        nickname: pkPlayers.nickname,
        score: pkPlayers.score,
        correctCount: pkPlayers.correctCount,
        answeredCount: pkPlayers.answeredCount,
      })
      .from(pkPlayers)
      .where(eq(pkPlayers.roomId, roomId))
      .orderBy(desc(pkPlayers.score), desc(pkPlayers.correctCount));

    if (players.length === 0) return;

    // 更新房间状态
    await this.db.update(pkRooms).set({ status: 'finished' }).where(eq(pkRooms.id, roomId));

    // 写入对战记录
    const maxScore = players[0].score;
    const minScore = players[players.length - 1].score;

    for (let i = 0; i < players.length; i += 1) {
      const p = players[i];
      let result: PKMatchResult = 'draw';
      let opponentScore = 0;
      let opponentId: string | null = null;

      if (players.length >= 2) {
        // 找最接近的对手（1v1 直接就是对方）
        const opponent = players.length === 2
          ? players[1 - i]
          : players[Math.max(0, i - 1)] || players[i + 1];

        if (opponent) {
          opponentScore = opponent.score;
          opponentId = opponent.userId;
        }

        if (p.score > opponentScore) {
          result = 'win';
        } else if (p.score < opponentScore) {
          result = 'lose';
        } else {
          result = 'draw';
        }
      }

      await this.db.insert(pkMatchRecords).values({
        roomId,
        userProfile: sql`ROW(${p.userId})::user_profile`,
        opponentProfile: opponentId ? sql`ROW(${opponentId})::user_profile` : undefined,
        result,
        score: p.score,
        opponentScore,
        roomType: room.roomType,
      });
    }
  }

  // ===== 对战结果 =====
  async getResult(roomId: string): Promise<PKResultResponse> {
    const roomRows = await this.db
      .select({
        id: pkRooms.id,
        roomType: pkRooms.roomType,
        status: pkRooms.status,
      })
      .from(pkRooms)
      .where(eq(pkRooms.id, roomId))
      .limit(1);

    if (roomRows.length === 0) {
      throw new NotFoundException('房间不存在');
    }
    const room = roomRows[0];

    const playerRows = await this.db
      .select({
        id: pkPlayers.id,
        userId: sql<string>`(${pkPlayers.userProfile}).user_id`,
        nickname: pkPlayers.nickname,
        score: pkPlayers.score,
        correctCount: pkPlayers.correctCount,
        answeredCount: pkPlayers.answeredCount,
        status: pkPlayers.status,
      })
      .from(pkPlayers)
      .where(eq(pkPlayers.roomId, roomId))
      .orderBy(desc(pkPlayers.score), desc(pkPlayers.correctCount));

    const isFinished = room.status === 'finished';
    const maxScore = playerRows.length > 0 ? playerRows[0].score : 0;
    const minScore = playerRows.length > 0
      ? playerRows[playerRows.length - 1].score
      : 0;

    const rankings: PKResultItem[] = playerRows.map((p, idx) => {
      let result: PKMatchResult = 'draw';
      if (isFinished && playerRows.length >= 2) {
        if (p.score > minScore && p.score === maxScore) {
          result = 'win';
        } else if (p.score < maxScore) {
          result = 'lose';
        } else {
          result = 'draw';
        }
      }
      return {
        rank: idx + 1,
        userId: p.userId,
        nickname: p.nickname,
        score: p.score,
        correctCount: p.correctCount,
        answeredCount: p.answeredCount,
        result,
      };
    });

    return {
      roomId,
      roomType: room.roomType as PKRoomType,
      isFinished,
      rankings,
    };
  }

  // ===== 个人战绩 =====
  async getStats(userId: string): Promise<PKStats> {
    const rows = await this.db
      .select({
        result: pkMatchRecords.result,
        total: sql<number>`count(*)`,
      })
      .from(pkMatchRecords)
      .where(sql`(${pkMatchRecords.userProfile}).user_id = ${userId}`)
      .groupBy(pkMatchRecords.result);

    let totalMatches = 0;
    let wins = 0;

    for (const r of rows) {
      const cnt = Number(r.total);
      totalMatches += cnt;
      if (r.result === 'win') wins += cnt;
    }

    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const currentTitle = this.calculateTitle(totalMatches, winRate);

    return { totalMatches, wins, winRate, currentTitle };
  }

  private calculateTitle(totalMatches: number, winRate: number): string {
    if (totalMatches >= 50 && winRate > 50) return 'PK王者';
    if (totalMatches >= 20) return 'PK大师';
    if (totalMatches >= 5) return 'PK达人';
    return 'PK新秀';
  }

  // ===== 对战历史 =====
  async getHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PKMatchHistoryResponse> {
    if (page < 1) page = 1;
    if (pageSize < 1 || pageSize > 100) pageSize = 20;
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        id: pkMatchRecords.id,
        roomId: pkMatchRecords.roomId,
        result: pkMatchRecords.result,
        score: pkMatchRecords.score,
        opponentScore: pkMatchRecords.opponentScore,
        roomType: pkMatchRecords.roomType,
        createdAt: pkMatchRecords.createdAt,
      })
      .from(pkMatchRecords)
      .where(sql`(${pkMatchRecords.userProfile}).user_id = ${userId}`)
      .orderBy(desc(pkMatchRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countResult = await this.db
      .select({ count: count() })
      .from(pkMatchRecords)
      .where(sql`(${pkMatchRecords.userProfile}).user_id = ${userId}`);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items: items.map((item): PKMatchHistoryItem => ({
        id: item.id,
        roomId: item.roomId,
        result: item.result as PKMatchResult,
        score: item.score,
        opponentScore: item.opponentScore,
        roomType: item.roomType as PKRoomType,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    };
  }
}
