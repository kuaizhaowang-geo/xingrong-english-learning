import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AntiAddictionService } from './anti-addiction.service';
import {
  type AntiAddictionStatus,
  type ParentControls,
  type UsageReport,
} from '@shared/api.interface';
import { Logger } from '@nestjs/common';

@Controller('api/anti-addiction')
export class AntiAddictionController {
  private readonly logger = new Logger(AntiAddictionController.name);

  constructor(private readonly antiAddictionService: AntiAddictionService) {}

  @Get('status')
  async getStatus(@Req() req: { userContext: { userId: string } }): Promise<AntiAddictionStatus> {
    const { userId } = req.userContext;
    return this.antiAddictionService.getStatus(userId);
  }

  @Post('session/start')
  async startSession(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { module?: string },
  ): Promise<{ sessionId: string; startTime: string }> {
    const { userId } = req.userContext;
    const result = await this.antiAddictionService.startSession(userId, body.module);
    return result;
  }

  @Post('session/end')
  async endSession(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { sessionId: string },
  ): Promise<{ duration: number }> {
    const { userId } = req.userContext;
    const duration = await this.antiAddictionService.endSession(
      userId,
      body.sessionId,
    );
    return { duration };
  }

  @Post('session/heartbeat')
  async heartbeat(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { sessionId: string },
  ): Promise<{ ok: boolean; remainingMinutes: number }> {
    const { userId } = req.userContext;
    const remaining = await this.antiAddictionService.heartbeat(
      userId,
      body.sessionId,
    );
    return { ok: true, remainingMinutes: remaining };
  }

  @Get('parent-controls')
  async getParentControls(
    @Req() req: { userContext: { userId: string } },
  ): Promise<ParentControls> {
    const { userId } = req.userContext;
    return this.antiAddictionService.getParentControls(userId);
  }

  @Post('parent-controls')
  async upsertParentControls(
    @Req() req: { userContext: { userId: string } },
    @Body() body: Record<string, unknown>,
  ): Promise<ParentControls> {
    const { userId } = req.userContext;
    return this.antiAddictionService.upsertParentControls(userId, body);
  }

  @Post('parent-controls/verify')
  async verifyParentPassword(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { password: string },
  ): Promise<{ valid: boolean }> {
    const { userId } = req.userContext;
    const valid = await this.antiAddictionService.verifyParentPassword(
      userId,
      body.password,
    );
    return { valid };
  }

  @Post('parent-controls/extend')
  async extendUsage(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { password: string; extendMinutes: number },
  ): Promise<{ ok: boolean; extendedMinutes: number }> {
    const { userId } = req.userContext;
    const extended = await this.antiAddictionService.extendUsage(
      userId,
      body.password,
      body.extendMinutes,
    );
    return { ok: true, extendedMinutes: extended };
  }

  @Get('reports/:type')
  async getReport(
    @Req() req: { userContext: { userId: string } },
    @Param('type') type: string,
  ): Promise<UsageReport> {
    const { userId } = req.userContext;
    if (type !== 'weekly' && type !== 'monthly') {
      throw new BadRequestException('报告类型不支持');
    }
    return this.antiAddictionService.getReport(userId, type as 'weekly' | 'monthly');
  }

  @Get('logs')
  async getLogs(
    @Req() req: { userContext: { userId: string } },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{ items: Array<{ date: string; durationMinutes: number; module?: string }> }> {
    const { userId } = req.userContext;
    const items = await this.antiAddictionService.getLogs(userId, startDate, endDate);
    return { items };
  }
}
