import { Controller, Get, Post, Delete, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AiChatService } from './ai-chat.service';
import type {
  AiChatSession,
  AiChatSessionWithMessages,
  SendMessageResponse,
  CreateAiChatSessionDto,
  SendMessageDto,
} from '@shared/api.interface';

@Controller('api/ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @NeedLogin()
  @Get('sessions')
  async getSessions(@Req() req: Request): Promise<AiChatSession[]> {
    const { userId } = req.userContext;
    return this.aiChatService.getSessions(userId);
  }

  @NeedLogin()
  @Post('sessions')
  async createSession(
    @Req() req: Request,
    @Body() dto: CreateAiChatSessionDto,
  ): Promise<AiChatSession> {
    const { userId } = req.userContext;
    return this.aiChatService.createSession(userId, dto);
  }

  @NeedLogin()
  @Get('sessions/:id')
  async getSessionDetail(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<AiChatSessionWithMessages> {
    const { userId } = req.userContext;
    return this.aiChatService.getSessionDetail(userId, id);
  }

  @NeedLogin()
  @Delete('sessions/:id')
  async deleteSession(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.aiChatService.deleteSession(userId, id);
    return { success: true };
  }

  @NeedLogin()
  @Post('sessions/:id/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    const { userId } = req.userContext;
    return this.aiChatService.sendMessage(userId, id, dto);
  }
}
