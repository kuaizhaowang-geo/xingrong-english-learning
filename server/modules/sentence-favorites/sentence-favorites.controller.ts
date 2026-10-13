import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { SentenceFavoritesService } from './sentence-favorites.service';
import type { SentencePuzzle } from '@shared/api.interface';

@NeedLogin()
@Controller('api/sentence-favorites')
export class SentenceFavoritesController {
  constructor(private readonly sentenceFavoritesService: SentenceFavoritesService) {}

  @Get()
  async getFavorites(@Req() req: Request): Promise<SentencePuzzle[]> {
    const { userId } = req.userContext;
    return this.sentenceFavoritesService.getFavorites(userId);
  }

  @Post()
  async addFavorite(
    @Req() req: Request,
    @Body() body: { sentenceId: string },
  ): Promise<void> {
    const { userId } = req.userContext;
    if (!body.sentenceId) throw new BadRequestException('sentenceId 不能为空');
    await this.sentenceFavoritesService.addFavorite(userId, body.sentenceId);
  }

  @Delete(':sentenceId')
  async removeFavorite(
    @Req() req: Request,
    @Param('sentenceId') sentenceId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.sentenceFavoritesService.removeFavorite(userId, sentenceId);
  }

  @Get('check/:sentenceId')
  async checkFavorite(
    @Req() req: Request,
    @Param('sentenceId') sentenceId: string,
  ): Promise<{ isFavorite: boolean }> {
    const { userId } = req.userContext;
    const isFavorite: boolean = await this.sentenceFavoritesService.checkFavorite(userId, sentenceId);
    return { isFavorite };
  }
}
