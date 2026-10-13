import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { TypingService } from './typing.service';
import type {
  TypingCourse,
  TypingRecord,
  TypingStats,
  TypingCourseListResponse,
  TypingSubmitDto,
  WhackAMoleRecord,
  WhackAMoleSubmitDto,
  WhackAMoleStats,
} from '@shared/api.interface';

interface TypingTrendItem {
  date: string;
  avgWpm: number;
  avgAccuracy: number;
  duration: number;
}

interface TypingRecordListResponse {
  items: TypingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Controller('api/typing')
export class TypingController {
  constructor(private readonly typingService: TypingService) {}

  // ===== 课程 =====

  @Get('courses')
  async getCourses(
    @Req() req: Request,
    @Query('level') level?: string,
    @Query('practiceMode') practiceMode?: string,
    @Query('category') category?: string,
  ): Promise<TypingCourseListResponse> {
    const userId: string | undefined = req.userContext?.userId;
    return this.typingService.getCourses(
      level || undefined,
      practiceMode || undefined,
      category || undefined,
      userId,
    );
  }

  @Get('courses/:id')
  async getCourse(@Param('id') id: string): Promise<TypingCourse> {
    return this.typingService.getCourse(id);
  }

  // ===== 练习记录 =====

  @NeedLogin()
  @Post('records')
  async submitRecord(
    @Req() req: Request,
    @Body() dto: TypingSubmitDto,
  ): Promise<TypingRecord> {
    const { userId } = req.userContext;
    return this.typingService.submitRecord(userId, dto);
  }

  @NeedLogin()
  @Get('records')
  async getRecords(
    @Req() req: Request,
    @Query('courseId') courseId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<TypingRecordListResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.typingService.getRecords(userId, courseId, pageNum, pageSizeNum);
  }

  // ===== 统计 =====

  @NeedLogin()
  @Get('stats')
  async getStats(@Req() req: Request): Promise<TypingStats> {
    const { userId } = req.userContext;
    return this.typingService.getStats(userId);
  }

  @NeedLogin()
  @Get('stats/trend')
  async getTrend(@Req() req: Request): Promise<TypingTrendItem[]> {
    const { userId } = req.userContext;
    return this.typingService.getTrend(userId);
  }

  // ===== 打地鼠游戏 =====

  @NeedLogin()
  @Post('whack-a-mole/records')
  async submitWhackAMoleRecord(
    @Req() req: Request,
    @Body() dto: WhackAMoleSubmitDto,
  ): Promise<WhackAMoleRecord> {
    const { userId } = req.userContext;
    return this.typingService.submitWhackAMoleRecord(userId, dto);
  }

  @NeedLogin()
  @Get('whack-a-mole/stats')
  async getWhackAMoleStats(@Req() req: Request): Promise<WhackAMoleStats> {
    const { userId } = req.userContext;
    return this.typingService.getWhackAMoleStats(userId);
  }

  @NeedLogin()
  @Get('whack-a-mole/records')
  async getWhackAMoleRecords(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ): Promise<WhackAMoleRecord[]> {
    const { userId } = req.userContext;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.typingService.getWhackAMoleRecords(userId, limitNum);
  }
}
