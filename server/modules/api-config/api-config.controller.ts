import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ApiConfigService } from './api-config.service';
import type {
  UserApiConfig,
  ApiConfigCategory,
} from '@shared/api.interface';

export interface MaskedApiConfig {
  ttsProvider: string;
  ttsEndpoint?: string;
  ttsHasKey: boolean;
  ttsHasSecret: boolean;
  asrProvider: string;
  asrEndpoint?: string;
  asrHasKey: boolean;
  asrHasSecret: boolean;
  aiProvider: string;
  aiBaseUrl?: string;
  aiModel?: string;
  aiHasKey: boolean;
  imageProvider: string;
  imageBaseUrl?: string;
  imageHasKey: boolean;
}

const VALID_CATEGORIES: ApiConfigCategory[] = ['tts', 'asr', 'ai', 'image'];

@NeedLogin()
@Controller('api/api-config')
export class ApiConfigController {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  @Get()
  async getConfig(@Req() req: Request): Promise<MaskedApiConfig> {
    const { userId } = req.userContext;
    return this.apiConfigService.getConfig(userId);
  }

  @Put()
  async saveConfig(
    @Req() req: Request,
    @Body() dto: Partial<UserApiConfig>,
  ): Promise<MaskedApiConfig> {
    const { userId } = req.userContext;
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }
    return this.apiConfigService.saveConfig(userId, dto);
  }

  @Post('test/:category')
  async testConfig(
    @Req() req: Request,
    @Param('category') category: ApiConfigCategory,
  ): Promise<{ success: boolean; message: string }> {
    const { userId } = req.userContext;
    if (!VALID_CATEGORIES.includes(category)) {
      throw new BadRequestException(`无效的分类: ${category}`);
    }
    return this.apiConfigService.testConfig(userId, category);
  }
}
