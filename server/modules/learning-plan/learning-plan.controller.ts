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
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { LearningPlanService } from './learning-plan.service';
import type {
  LearningPlan,
  CreateLearningPlanDto,
  UpdateLearningProgressDto,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/learning-plans')
export class LearningPlanController {
  constructor(private readonly learningPlanService: LearningPlanService) {}

  @Get()
  async getPlans(
    @Req() req: Request,
    @Query('planType') planType?: 'sentence' | 'word',
  ): Promise<LearningPlan[]> {
    const { userId } = req.userContext;
    return this.learningPlanService.getPlans(userId, planType);
  }

  @Post()
  async addToPlan(
    @Req() req: Request,
    @Body() dto: CreateLearningPlanDto,
  ): Promise<LearningPlan> {
    const { userId } = req.userContext;
    return this.learningPlanService.addToPlan(userId, dto);
  }

  @Delete(':id')
  async removeFromPlan(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.learningPlanService.removeFromPlan(userId, id);
  }

  @Patch(':id/progress')
  async updateProgress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateLearningProgressDto,
  ): Promise<LearningPlan> {
    const { userId } = req.userContext;
    return this.learningPlanService.updateProgress(userId, id, dto);
  }
}
