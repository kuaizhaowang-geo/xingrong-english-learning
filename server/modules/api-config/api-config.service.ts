import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import type { UserApiConfig, ApiConfigCategory } from '@shared/api.interface';
import { userApiConfigs } from '@server/database/schema';
import type { MaskedApiConfig } from './api-config.controller';

const DEFAULT_CONFIG: UserApiConfig = {
  ttsProvider: 'web-speech',
  asrProvider: 'web-speech',
  aiProvider: 'local',
  imageProvider: 'pollinations',
};

@Injectable()
export class ApiConfigService {
  private readonly logger = new Logger(ApiConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private maskConfig(row: typeof userApiConfigs.$inferSelect): MaskedApiConfig {
    return {
      ttsProvider: row.ttsProvider,
      ttsEndpoint: row.ttsEndpoint ?? undefined,
      ttsHasKey: Boolean(row.ttsApiKey),
      ttsHasSecret: Boolean(row.ttsApiSecret),
      asrProvider: row.asrProvider,
      asrEndpoint: row.asrEndpoint ?? undefined,
      asrHasKey: Boolean(row.asrApiKey),
      asrHasSecret: Boolean(row.asrApiSecret),
      aiProvider: row.aiProvider,
      aiBaseUrl: row.aiBaseUrl ?? undefined,
      aiModel: row.aiModel ?? undefined,
      aiHasKey: Boolean(row.aiApiKey),
      imageProvider: row.imageProvider,
      imageBaseUrl: row.imageBaseUrl ?? undefined,
      imageHasKey: Boolean(row.imageApiKey),
    };
  }

  private maskDefault(): MaskedApiConfig {
    return {
      ttsProvider: DEFAULT_CONFIG.ttsProvider,
      ttsHasKey: false,
      ttsHasSecret: false,
      asrProvider: DEFAULT_CONFIG.asrProvider,
      asrHasKey: false,
      asrHasSecret: false,
      aiProvider: DEFAULT_CONFIG.aiProvider,
      aiHasKey: false,
      imageProvider: DEFAULT_CONFIG.imageProvider,
      imageHasKey: false,
    };
  }

  async getConfig(userId: string): Promise<MaskedApiConfig> {
    try {
      const rows = await this.db
        .select()
        .from(userApiConfigs)
        .where(eq(userApiConfigs.userId, userId))
        .limit(1);

      if (rows.length === 0) {
        return this.maskDefault();
      }
      return this.maskConfig(rows[0]);
    } catch (error) {
      this.logger.error(`获取 API 配置失败: ${userId}`, JSON.stringify(error));
      throw error;
    }
  }

  async saveConfig(
    userId: string,
    dto: Partial<UserApiConfig>,
  ): Promise<MaskedApiConfig> {
    try {
      const patch: Partial<typeof userApiConfigs.$inferInsert> = {};

      if (dto.ttsProvider !== undefined) patch.ttsProvider = dto.ttsProvider;
      if (dto.ttsApiKey !== undefined) {
        patch.ttsApiKey = dto.ttsApiKey === '' ? null : dto.ttsApiKey;
      }
      if (dto.ttsApiSecret !== undefined) {
        patch.ttsApiSecret = dto.ttsApiSecret === '' ? null : dto.ttsApiSecret;
      }
      if (dto.ttsEndpoint !== undefined) {
        patch.ttsEndpoint = dto.ttsEndpoint === '' ? null : dto.ttsEndpoint;
      }

      if (dto.asrProvider !== undefined) patch.asrProvider = dto.asrProvider;
      if (dto.asrApiKey !== undefined) {
        patch.asrApiKey = dto.asrApiKey === '' ? null : dto.asrApiKey;
      }
      if (dto.asrApiSecret !== undefined) {
        patch.asrApiSecret = dto.asrApiSecret === '' ? null : dto.asrApiSecret;
      }
      if (dto.asrEndpoint !== undefined) {
        patch.asrEndpoint = dto.asrEndpoint === '' ? null : dto.asrEndpoint;
      }

      if (dto.aiProvider !== undefined) patch.aiProvider = dto.aiProvider;
      if (dto.aiApiKey !== undefined) {
        patch.aiApiKey = dto.aiApiKey === '' ? null : dto.aiApiKey;
      }
      if (dto.aiBaseUrl !== undefined) {
        patch.aiBaseUrl = dto.aiBaseUrl === '' ? null : dto.aiBaseUrl;
      }
      if (dto.aiModel !== undefined) {
        patch.aiModel = dto.aiModel === '' ? null : dto.aiModel;
      }

      if (dto.imageProvider !== undefined) {
        patch.imageProvider = dto.imageProvider;
      }
      if (dto.imageApiKey !== undefined) {
        patch.imageApiKey = dto.imageApiKey === '' ? null : dto.imageApiKey;
      }
      if (dto.imageBaseUrl !== undefined) {
        patch.imageBaseUrl = dto.imageBaseUrl === '' ? null : dto.imageBaseUrl;
      }

      patch.updatedAt = new Date();

      // Upsert: insert or update on conflict
      const inserted = await this.db
        .insert(userApiConfigs)
        .values({
          userId,
          ttsProvider: DEFAULT_CONFIG.ttsProvider,
          asrProvider: DEFAULT_CONFIG.asrProvider,
          aiProvider: DEFAULT_CONFIG.aiProvider,
          imageProvider: DEFAULT_CONFIG.imageProvider,
          ...patch,
        })
        .onConflictDoUpdate({
          target: userApiConfigs.userId,
          set: patch,
        })
        .returning();

      return this.maskConfig(inserted[0]);
    } catch (error) {
      this.logger.error(
        `保存 API 配置失败: ${userId}`,
        JSON.stringify(error),
      );
      throw error;
    }
  }

  async testConfig(
    userId: string,
    category: ApiConfigCategory,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const rows = await this.db
        .select()
        .from(userApiConfigs)
        .where(eq(userApiConfigs.userId, userId))
        .limit(1);

      if (rows.length === 0) {
        return { success: false, message: '尚未配置 API 设置' };
      }

      const row = rows[0];

      switch (category) {
        case 'tts': {
          if (!row.ttsProvider) {
            return { success: false, message: '未选择 TTS 服务商' };
          }
          if (row.ttsProvider === 'web-speech') {
            return { success: true, message: 'Web Speech 为内置免费服务，无需 API Key' };
          }
          if (!row.ttsApiKey) {
            return { success: false, message: 'TTS API Key 未配置' };
          }
          if (row.ttsApiKey.length < 8) {
            return { success: false, message: 'TTS API Key 长度过短，格式可能不正确' };
          }
          return { success: true, message: 'TTS 配置格式校验通过' };
        }
        case 'asr': {
          if (!row.asrProvider) {
            return { success: false, message: '未选择 ASR 服务商' };
          }
          if (row.asrProvider === 'web-speech') {
            return { success: true, message: 'Web Speech 为内置免费服务，无需 API Key' };
          }
          if (!row.asrApiKey) {
            return { success: false, message: 'ASR API Key 未配置' };
          }
          if (row.asrApiKey.length < 8) {
            return { success: false, message: 'ASR API Key 长度过短，格式可能不正确' };
          }
          return { success: true, message: 'ASR 配置格式校验通过' };
        }
        case 'ai': {
          if (!row.aiProvider) {
            return { success: false, message: '未选择 AI 服务商' };
          }
          if (row.aiProvider === 'local') {
            return { success: true, message: '本地模型为内置免费服务，无需 API Key' };
          }
          if (!row.aiApiKey) {
            return { success: false, message: 'AI API Key 未配置' };
          }
          if (row.aiApiKey.length < 8) {
            return { success: false, message: 'AI API Key 长度过短，格式可能不正确' };
          }
          return { success: true, message: 'AI 配置格式校验通过' };
        }
        case 'image': {
          if (!row.imageProvider) {
            return { success: false, message: '未选择图片生成服务商' };
          }
          if (row.imageProvider === 'pollinations') {
            return { success: true, message: 'Pollinations 为免费服务，无需 API Key' };
          }
          if (!row.imageApiKey) {
            return { success: false, message: '图片生成 API Key 未配置' };
          }
          if (row.imageApiKey.length < 8) {
            return { success: false, message: '图片生成 API Key 长度过短，格式可能不正确' };
          }
          return { success: true, message: '图片生成配置格式校验通过' };
        }
        default:
          return { success: false, message: `未知分类: ${category}` };
      }
    } catch (error) {
      this.logger.error(
        `测试 API 配置失败: ${userId}/${category}`,
        JSON.stringify(error),
      );
      return { success: false, message: '测试失败，请稍后重试' };
    }
  }
}
