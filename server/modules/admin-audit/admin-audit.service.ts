import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';

import { and, count, desc, eq } from 'drizzle-orm';

import { auditLogs } from '@server/database/schema';
import type { AuditLogItem, PagedResponse } from '@shared/api.interface';

type AuditLogSelect = typeof auditLogs.$inferSelect;

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 记录操作日志
   */
  async log(params: {
    userId: string;
    userName: string;
    action: string;
    targetType: string;
    targetId?: string;
    detail?: Record<string, unknown>;
  }): Promise<void> {
    const { userId, userName, action, targetType, targetId, detail } = params;

    try {
      const insertData: typeof auditLogs.$inferInsert = {
        userId,
        userName: userName || '',
        action,
        targetType,
        targetId: targetId || undefined,
        detail: detail ?? {},
      };

      await this.db.insert(auditLogs).values(insertData);
    } catch (error) {
      // 日志失败不影响主流程
      this.logger.error(
        `写入审计日志失败: ${action} / ${targetType} / ${targetId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async getLogs(params: {
    page: number;
    pageSize: number;
    userId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
  }): Promise<PagedResponse<AuditLogItem>> {
    const { page, pageSize, userId, action, targetType, targetId } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (targetId) conditions.push(eq(auditLogs.targetId, targetId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(auditLogs)
        .where(whereClause),
      this.db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total: number = Number(countResult[0]?.count ?? 0);
    const items: AuditLogItem[] = rows.map((row: AuditLogSelect) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? undefined,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId ?? undefined,
      detail: (row.detail as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }
}
