import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PkArenaService } from './pk-arena.service';
import type {
  PKRoomListResponse,
  PKRoomDetail,
  PKCreateRoomDto,
  PKAnswerDto,
  PKAnswerResponse,
  PKResultResponse,
  PKStats,
  PKMatchHistoryResponse,
  PKCourseType,
} from '@shared/api.interface';

@Controller('api/pk-arena')
export class PkArenaController {
  constructor(private readonly pkArenaService: PkArenaService) {}

  // ===== 房间列表 =====
  @NeedLogin()
  @Get('rooms')
  async listRooms(
    @Query('status') status?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PKRoomListResponse> {
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    return this.pkArenaService.listRooms(status, ps);
  }

  // ===== 创建房间 =====
  @NeedLogin()
  @Post('rooms')
  async createRoom(
    @Req() req: Request,
    @Body() dto: PKCreateRoomDto,
  ): Promise<PKRoomDetail> {
    const { userId, userName } = req.userContext;
    const nickname = userName || '玩家';
    return this.pkArenaService.createRoom(userId, nickname, dto);
  }

  // ===== 房间详情 =====
  @NeedLogin()
  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string): Promise<PKRoomDetail> {
    return this.pkArenaService.getRoom(roomId);
  }

  // ===== 加入房间 =====
  @NeedLogin()
  @Post('rooms/:roomId/join')
  async joinRoom(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<PKRoomDetail> {
    const { userId, userName } = req.userContext;
    const nickname = userName || '玩家';
    return this.pkArenaService.joinRoom(roomId, userId, nickname);
  }

  // ===== 开始对战 =====
  @NeedLogin()
  @Post('rooms/:roomId/start')
  async startRoom(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<{ room: PKRoomDetail; questions: import('@shared/api.interface').PKQuestion[] }> {
    const { userId } = req.userContext;
    return this.pkArenaService.startRoom(roomId, userId);
  }

  // ===== 离开房间 =====
  @NeedLogin()
  @Post('rooms/:roomId/leave')
  async leaveRoom(
    @Req() req: Request,
    @Param('roomId') roomId: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    return this.pkArenaService.leaveRoom(roomId, userId);
  }

  // ===== 快速匹配 =====
  @NeedLogin()
  @Post('quick-match')
  async quickMatch(
    @Req() req: Request,
    @Body() body?: { courseType?: PKCourseType },
  ): Promise<PKRoomDetail> {
    const { userId, userName } = req.userContext;
    const nickname = userName || '玩家';
    return this.pkArenaService.quickMatch(userId, nickname, body?.courseType);
  }

  // ===== 提交答案 =====
  @NeedLogin()
  @Post('rooms/:roomId/answer')
  async submitAnswer(
    @Req() req: Request,
    @Param('roomId') roomId: string,
    @Body() dto: PKAnswerDto,
  ): Promise<PKAnswerResponse> {
    const { userId } = req.userContext;
    return this.pkArenaService.submitAnswer(roomId, userId, dto);
  }

  // ===== 对战结果 =====
  @NeedLogin()
  @Get('rooms/:roomId/result')
  async getResult(@Param('roomId') roomId: string): Promise<PKResultResponse> {
    return this.pkArenaService.getResult(roomId);
  }

  // ===== 个人战绩 =====
  @NeedLogin()
  @Get('stats')
  async getStats(@Req() req: Request): Promise<PKStats> {
    const { userId } = req.userContext;
    return this.pkArenaService.getStats(userId);
  }

  // ===== 对战历史 =====
  @NeedLogin()
  @Get('history')
  async getHistory(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PKMatchHistoryResponse> {
    const { userId } = req.userContext;
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    return this.pkArenaService.getHistory(userId, p, ps);
  }
}
