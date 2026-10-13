import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ParentService } from './parent.service';
import type {
  ParentChildBinding,
  AddChildDto,
  ChildOverview,
  ChildMistakesResponse,
  LearningActivityItem,
  AssignedTask,
  CreateAssignedTaskDto,
  UpdateTaskStatusDto,
  ProgressCurveData,
  PagedResponse,
} from '@shared/api.interface';

@Controller('api/parent')
export class ParentController {
  private readonly logger = new Logger(ParentController.name);

  constructor(private readonly parentService: ParentService) {}

  // ===== 孩子管理 =====

  @Get('children')
  @NeedLogin()
  async getChildren(@Req() req: { userContext: { userId: string } }): Promise<ParentChildBinding[]> {
    const { userId } = req.userContext;
    return this.parentService.getChildren(userId);
  }

  @Post('children')
  @NeedLogin()
  async addChild(
    @Req() req: { userContext: { userId: string } },
    @Body() dto: AddChildDto,
  ): Promise<ParentChildBinding> {
    const { userId } = req.userContext;
    return this.parentService.addChild(userId, dto);
  }

  @Delete('children/:id')
  @NeedLogin()
  async removeChild(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.parentService.removeChild(userId, id);
    return { success: true };
  }

  // ===== 学习总览 =====

  @Get('children/:childId/overview')
  @NeedLogin()
  async getChildOverview(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
  ): Promise<ChildOverview> {
    const { userId } = req.userContext;
    return this.parentService.getChildOverview(userId, childId);
  }

  // ===== 错题报告 =====

  @Get('children/:childId/mistakes')
  @NeedLogin()
  async getChildMistakes(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
    @Query('subject') subject?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ChildMistakesResponse> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.parentService.getChildMistakes(userId, childId, subject, pageNum, pageSizeNum);
  }

  // ===== 学习动态 =====

  @Get('children/:childId/activity')
  @NeedLogin()
  async getChildActivity(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
    @Query('days') days?: string,
  ): Promise<LearningActivityItem[]> {
    const { userId } = req.userContext;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.parentService.getChildActivity(userId, childId, daysNum);
  }

  // ===== 任务管理 =====

  @Get('children/:childId/tasks')
  @NeedLogin()
  async getChildTasks(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
  ): Promise<AssignedTask[]> {
    const { userId } = req.userContext;
    return this.parentService.getChildTasks(userId, childId);
  }

  @Post('children/:childId/tasks')
  @NeedLogin()
  async assignTask(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
    @Body() dto: CreateAssignedTaskDto,
  ): Promise<AssignedTask> {
    const { userId } = req.userContext;
    return this.parentService.assignTask(userId, childId, dto);
  }

  @Patch('tasks/:taskId')
  @NeedLogin()
  async updateTaskStatus(
    @Req() req: { userContext: { userId: string } },
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<AssignedTask> {
    const { userId } = req.userContext;
    return this.parentService.updateTaskStatus(userId, taskId, dto.status);
  }

  // ===== 进步曲线 =====

  @Get('children/:childId/progress')
  @NeedLogin()
  async getProgressCurve(
    @Req() req: { userContext: { userId: string } },
    @Param('childId') childId: string,
    @Query('period') period?: string,
  ): Promise<ProgressCurveData> {
    const { userId } = req.userContext;
    return this.parentService.getProgressCurve(userId, childId, period || '7d');
  }
}
