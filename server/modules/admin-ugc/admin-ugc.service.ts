import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, count } from 'drizzle-orm';
import {
  userWordbooks,
  userTextbooks,
  userCreatedCourses,
  contentAuditLogs,
} from '@server/database/schema';
import type {
  UgcPendingItem,
  UgcType,
  UgcPendingListResponse,
  UgcDetailResponse,
} from '@shared/api.interface';

const PENDING_STATUS = 'pending_audit';

@Injectable()
export class AdminUgcService {
  private readonly logger = new Logger(AdminUgcService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取待审核列表
   * 分开查三张表，内存中合并排序
   */
  async getPendingList(
    type: 'all' | UgcType,
    page: number,
    pageSize: number,
  ): Promise<UgcPendingListResponse> {
    const items: UgcPendingItem[] = [];

    const includeWordbooks = type === 'all' || type === 'wordbook';
    const includeTextbooks = type === 'all' || type === 'textbook';
    const includeCourses = type === 'all' || type === 'course';

    // 查三张表 pending_audit 状态
    if (includeWordbooks) {
      const rows = await this.db
        .select({
          id: userWordbooks.id,
          name: userWordbooks.name,
          subject: userWordbooks.subject,
          status: userWordbooks.status,
          createdAt: userWordbooks.createdAt,
          createdBy: userWordbooks.createdBy,
        })
        .from(userWordbooks)
        .where(eq(userWordbooks.status, PENDING_STATUS))
        .orderBy(desc(userWordbooks.createdAt));
      for (const row of rows) {
        items.push({
          id: row.id,
          type: 'wordbook',
          name: row.name,
          authorId: row.createdBy || '',
          subject: row.subject,
          status: row.status,
          createdAt: (row.createdAt as Date).toISOString(),
        });
      }
    }

    if (includeTextbooks) {
      const rows = await this.db
        .select({
          id: userTextbooks.id,
          name: userTextbooks.name,
          subject: userTextbooks.subject,
          status: userTextbooks.status,
          createdAt: userTextbooks.createdAt,
          createdBy: userTextbooks.createdBy,
        })
        .from(userTextbooks)
        .where(eq(userTextbooks.status, PENDING_STATUS))
        .orderBy(desc(userTextbooks.createdAt));
      for (const row of rows) {
        items.push({
          id: row.id,
          type: 'textbook',
          name: row.name,
          authorId: row.createdBy || '',
          subject: row.subject,
          status: row.status,
          createdAt: (row.createdAt as Date).toISOString(),
        });
      }
    }

    if (includeCourses) {
      const rows = await this.db
        .select({
          id: userCreatedCourses.id,
          name: userCreatedCourses.name,
          subject: userCreatedCourses.subject,
          status: userCreatedCourses.status,
          createdAt: userCreatedCourses.createdAt,
          createdBy: userCreatedCourses.createdBy,
        })
        .from(userCreatedCourses)
        .where(eq(userCreatedCourses.status, PENDING_STATUS))
        .orderBy(desc(userCreatedCourses.createdAt));
      for (const row of rows) {
        items.push({
          id: row.id,
          type: 'course',
          name: row.name,
          authorId: row.createdBy || '',
          subject: row.subject,
          status: row.status,
          createdAt: (row.createdAt as Date).toISOString(),
        });
      }
    }

    // 按 createdAt 降序排序
    items.sort((a: UgcPendingItem, b: UgcPendingItem) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pagedItems = items.slice(start, start + pageSize);

    return {
      items: pagedItems,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取内容详情
   */
  async getDetail(type: UgcType, id: string): Promise<UgcDetailResponse> {
    switch (type) {
      case 'wordbook':
        return this.getWordbookDetail(id);
      case 'textbook':
        return this.getTextbookDetail(id);
      case 'course':
        return this.getCourseDetail(id);
      default:
        throw new BadRequestException('无效的内容类型');
    }
  }

  private async getWordbookDetail(id: string): Promise<UgcDetailResponse> {
    const rows = await this.db
      .select()
      .from(userWordbooks)
      .where(eq(userWordbooks.id, id))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('词库不存在');
    const row = rows[0];
    return {
      type: 'wordbook',
      id: row.id,
      name: row.name,
      subject: row.subject,
      description: row.description || undefined,
      status: row.status,
      visibility: row.visibility,
      auditNote: row.auditNote || undefined,
      authorId: row.createdBy || '',
      itemCount: row.itemCount,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  private async getTextbookDetail(id: string): Promise<UgcDetailResponse> {
    const rows = await this.db
      .select()
      .from(userTextbooks)
      .where(eq(userTextbooks.id, id))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('教材不存在');
    const row = rows[0];
    return {
      type: 'textbook',
      id: row.id,
      name: row.name,
      subject: row.subject,
      description: row.description || undefined,
      status: row.status,
      visibility: row.visibility,
      auditNote: row.auditNote || undefined,
      authorId: row.createdBy || '',
      unitCount: row.unitCount,
      grade: row.grade || undefined,
      version: row.version || undefined,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  private async getCourseDetail(id: string): Promise<UgcDetailResponse> {
    const rows = await this.db
      .select()
      .from(userCreatedCourses)
      .where(eq(userCreatedCourses.id, id))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('课程不存在');
    const row = rows[0];
    return {
      type: 'course',
      id: row.id,
      name: row.name,
      subject: row.subject,
      description: row.description || undefined,
      status: row.status,
      visibility: row.visibility,
      auditNote: row.auditNote || undefined,
      authorId: row.createdBy || '',
      unitCount: row.unitCount,
      category: row.category || undefined,
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
    };
  }

  /**
   * 审核通过
   */
  async approve(type: UgcType, id: string, operatorId: string): Promise<void> {
    const patch = { status: 'public', visibility: 'public' };
    await this.updateContent(type, id, patch);
    await this.logAudit(operatorId, 'approve', type, id, '审核通过');
  }

  /**
   * 审核拒绝
   */
  async reject(
    type: UgcType,
    id: string,
    reason: string,
    operatorId: string,
  ): Promise<void> {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('拒绝原因不能为空');
    }
    const patch = {
      status: 'rejected',
      visibility: 'private',
      auditNote: reason.trim(),
    };
    await this.updateContent(type, id, patch);
    await this.logAudit(operatorId, 'reject', type, id, `审核拒绝: ${reason.trim()}`);
  }

  /**
   * 下架
   */
  async offline(type: UgcType, id: string, operatorId: string): Promise<void> {
    const patch = { status: 'draft', visibility: 'private' };
    await this.updateContent(type, id, patch);
    await this.logAudit(operatorId, 'offline', type, id, '下架内容');
  }

  private async updateContent(
    type: UgcType,
    id: string,
    patch: { status: string; visibility: string; auditNote?: string },
  ): Promise<void> {
    const setValues = {
      status: patch.status,
      visibility: patch.visibility,
      ...(patch.auditNote !== undefined ? { auditNote: patch.auditNote } : {}),
    };

    let updated: Array<{ id: string }>;
    let label: string;

    switch (type) {
      case 'wordbook': {
        label = '词库';
        updated = await this.db
          .update(userWordbooks)
          .set(setValues as Partial<typeof userWordbooks.$inferInsert>)
          .where(eq(userWordbooks.id, id))
          .returning({ id: userWordbooks.id });
        break;
      }
      case 'textbook': {
        label = '教材';
        updated = await this.db
          .update(userTextbooks)
          .set(setValues as Partial<typeof userTextbooks.$inferInsert>)
          .where(eq(userTextbooks.id, id))
          .returning({ id: userTextbooks.id });
        break;
      }
      case 'course': {
        label = '课程';
        updated = await this.db
          .update(userCreatedCourses)
          .set(setValues as Partial<typeof userCreatedCourses.$inferInsert>)
          .where(eq(userCreatedCourses.id, id))
          .returning({ id: userCreatedCourses.id });
        break;
      }
      default:
        throw new BadRequestException('无效的内容类型');
    }

    if (updated.length === 0) {
      throw new NotFoundException(`${label}不存在`);
    }
  }

  private async logAudit(
    operatorId: string,
    action: string,
    targetType: UgcType,
    targetId: string,
    detail: string,
  ): Promise<void> {
    await this.db.insert(contentAuditLogs).values({
      operatorId,
      action,
      targetType,
      targetId,
      detail,
    });
  }

  /**
   * 统计待审核数量
   */
  async getPendingCounts(): Promise<{
    wordbook: number;
    textbook: number;
    course: number;
    total: number;
  }> {
    const [wbRes, tbRes, ccRes] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userWordbooks)
        .where(eq(userWordbooks.status, PENDING_STATUS)),
      this.db
        .select({ count: count() })
        .from(userTextbooks)
        .where(eq(userTextbooks.status, PENDING_STATUS)),
      this.db
        .select({ count: count() })
        .from(userCreatedCourses)
        .where(eq(userCreatedCourses.status, PENDING_STATUS)),
    ]);

    const wordbook = Number(wbRes[0]?.count || 0);
    const textbook = Number(tbRes[0]?.count || 0);
    const course = Number(ccRes[0]?.count || 0);

    return {
      wordbook,
      textbook,
      course,
      total: wordbook + textbook + course,
    };
  }
}
