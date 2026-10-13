import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PhonicsService } from './phonics.service';
import type {
  PhoneticItem,
  PhonicsProgressItem,
  PhonicsProgressSummary,
  PhonicsPracticeResult,
} from '@shared/api.interface';

@Controller('api/phonics')
export class PhonicsController {
  constructor(private readonly phonicsService: PhonicsService) {}

  @Get()
  async getAll(
    @Query('category') category?: string,
  ): Promise<{ items: PhoneticItem[] }> {
    const items = category
      ? await this.phonicsService.getPhoneticsByCategory(category)
      : await this.phonicsService.getAllPhonetics();
    return { items };
  }

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<{ item: PhoneticItem }> {
    const item = await this.phonicsService.getPhoneticById(id);
    return { item };
  }

  @NeedLogin()
  @Get('progress/summary')
  async getProgressSummary(@Req() req: any): Promise<PhonicsProgressSummary> {
    const { userId } = req.userContext;
    return this.phonicsService.getProgressSummary(userId);
  }

  @NeedLogin()
  @Get('progress/list')
  async getProgressList(@Req() req: any): Promise<{ items: PhonicsProgressItem[] }> {
    const { userId } = req.userContext;
    const items = await this.phonicsService.getProgress(userId);
    return { items };
  }

  @NeedLogin()
  @Post('progress/:id/learned')
  async markLearned(@Req() req: any, @Param('id') phoneticId: string): Promise<void> {
    const { userId } = req.userContext;
    await this.phonicsService.markLearned(userId, phoneticId);
  }

  @NeedLogin()
  @Post('practice')
  async recordPractice(
    @Req() req: any,
    @Body() body: { results: PhonicsPracticeResult[] },
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.phonicsService.recordPractice(userId, body.results || []);
  }
}
