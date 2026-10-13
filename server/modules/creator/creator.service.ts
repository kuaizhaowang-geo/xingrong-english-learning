import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  eq, and, desc, count, sql, gt, gte,
} from 'drizzle-orm';
import type {
  CreatorStatsData,
  CreatorBadge,
  CreatorRankItem,
  CreatorRankResponse,
  AuditWordbookItem,
  AuditListResponse,
  SubmitShareDto,
  WordbookShareSettings,
  WordbookStatus,
  WordbookSubject,
  WordbookContentType,
} from '@shared/api.interface';
import {
  creatorStats,
  creatorBadges,
  userWordbooks,
  contentAuditLogs,
} from '@server/database/schema';

interface BadgeRule {
  code: string;
  name: string;
  check: (stats: typeof creatorStats.$inferSelect) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  { code: 'first_share', name: '初出茅庐', check: (s) => s.approvedCount >= 1 },
  { code: 'hundred_learns', name: '小有名气', check: (s) => s.totalLearnCount >= 100 },
  { code: 'thousand_learns', name: '家喻户晓', check: (s) => s.totalLearnCount >= 1000 },
  { code: 'ten_thousand_learns', name: '万人迷', check: (s) => s.totalLearnCount >= 10000 },
  { code: 'comment_master', name: '评论达人', check: (s) => s.totalCommentCount >= 100 },
  { code: 'favorite_master', name: '收藏达人', check: (s) => s.totalFavoriteCount >= 500 },
];

@Injectable()
export class CreatorService {
  private readonly logger = new Logger(CreatorService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createdBy(userId: string): any {
    return sql`(${userWordbooks.createdBy}).user_id = ${userId}`;
  }

  async getCreatorStats(userId: string, userName: string): Promise<CreatorStatsData> {
    const stats = await this.ensureCreatorStats(userId);
    const badges = await this.db.select().from(creatorBadges)
      .where(eq(creatorBadges.userId, userId))
      .orderBy(desc(creatorBadges.createdAt));

    return {
      userId: stats.userId,
      userName,
      totalLearnCount: stats.totalLearnCount,
      totalLikeCount: stats.totalLikeCount,
      totalFavoriteCount: stats.totalFavoriteCount,
      totalCommentCount: stats.totalCommentCount,
      contentCount: stats.contentCount,
      approvedCount: stats.approvedCount,
      creatorLevel: stats.creatorLevel,
      creatorPoints: stats.creatorPoints,
      creditLevel: stats.creditLevel as CreatorStatsData['creditLevel'],
      createdAt: stats.createdAt.toISOString(),
      updatedAt: stats.updatedAt.toISOString(),
      badges: badges.map((b) => this.toBadge(b)),
    };
  }

  async getMyContent(
    userId: string,
    status?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: AuditWordbookItem[]; total: number }> {
    const conditions = [this.createdBy(userId)];
    if (status) conditions.push(eq(userWordbooks.status, status));

    const offset = (page - 1) * pageSize;

    const [totalResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userWordbooks)
        .where(and(...conditions)),
      this.db.select().from(userWordbooks)
        .where(and(...conditions))
        .orderBy(desc(userWordbooks.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const items: AuditWordbookItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject as WordbookSubject,
      contentType: row.contentType as WordbookContentType,
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      status: row.status as WordbookStatus,
      auditNote: row.auditNote ?? undefined,
      creatorId: userId,
      creatorName: '',
      submittedAt: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, total };
  }

  async getShareSettings(userId: string, id: string): Promise<WordbookShareSettings & { status: string; auditNote?: string }> {
    const row = await this.db.select().from(userWordbooks)
      .where(and(this.createdBy(userId), eq(userWordbooks.id, id)))
      .limit(1);

    if (row.length === 0) {
      throw new NotFoundException('词库不存在或无权访问');
    }

    const wb = row[0];
    return {
      visibility: wb.visibility as WordbookShareSettings['visibility'],
      allowLearn: wb.allowLearn,
      allowCopy: wb.allowCopy,
      allowComment: wb.allowComment,
      status: wb.status,
      auditNote: wb.auditNote ?? undefined,
    };
  }

  async submitShare(userId: string, id: string, dto: SubmitShareDto): Promise<void> {
    const existing = await this.db.select().from(userWordbooks)
      .where(and(this.createdBy(userId), eq(userWordbooks.id, id)))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('词库不存在或无权访问');
    }

    const wb = existing[0];
    if (wb.status === 'pending') {
      throw new BadRequestException('当前内容正在审核中，请勿重复提交');
    }
    if (wb.itemCount === 0) {
      throw new BadRequestException('词库为空，无法提交分享');
    }

    await this.db.update(userWordbooks)
      .set({
        visibility: dto.visibility,
        allowLearn: dto.allowLearn,
        allowCopy: dto.allowCopy,
        allowComment: dto.allowComment,
        status: 'pending',
        auditNote: null,
        updatedAt: new Date(),
      })
      .where(eq(userWordbooks.id, id));

    await this.db.insert(contentAuditLogs).values({
      operatorId: userId,
      action: 'submit',
      targetType: 'wordbook',
      targetId: id,
      detail: '创作者提交分享审核',
    });

    // 更新创作者统计的 contentCount
    await this.ensureCreatorStats(userId);

    this.logger.log(`Creator ${userId} submitted wordbook ${id} for review`);
  }

  async getRanking(
    period: 'all' | 'week' | 'month',
    subject?: string,
    page = 1,
    pageSize = 20,
  ): Promise<CreatorRankResponse> {
    const offset = (page - 1) * pageSize;

    // 简化实现：period 暂时都用总积分排序
    // 后续加学习日志表后再按周/月聚合
    const rows = await this.db.select().from(creatorStats)
      .where(gt(creatorStats.creatorPoints, 0))
      .orderBy(desc(creatorStats.creatorPoints), desc(creatorStats.totalLearnCount))
      .limit(pageSize)
      .offset(offset);

    const items: CreatorRankItem[] = rows.map((row, idx) => ({
      userId: row.userId,
      userName: '',
      creatorLevel: row.creatorLevel,
      creatorPoints: row.creatorPoints,
      rank: offset + idx + 1,
    }));

    return { items, period };
  }

  async getCreatorProfile(userId: string, userName: string): Promise<CreatorStatsData & { publicWordbooks: AuditWordbookItem[] }> {
    const stats = await this.db.select().from(creatorStats)
      .where(eq(creatorStats.userId, userId))
      .limit(1);

    if (stats.length === 0) {
      // 无统计记录，返回默认值
      const emptyStats: CreatorStatsData = {
        userId,
        userName,
        totalLearnCount: 0,
        totalLikeCount: 0,
        totalFavoriteCount: 0,
        totalCommentCount: 0,
        contentCount: 0,
        approvedCount: 0,
        creatorLevel: 1,
        creatorPoints: 0,
        creditLevel: 'A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        badges: [],
      };
      return { ...emptyStats, publicWordbooks: [] };
    }

    const s = stats[0];
    const badges = await this.db.select().from(creatorBadges)
      .where(eq(creatorBadges.userId, userId))
      .orderBy(desc(creatorBadges.createdAt));

    // 该创作者公开审核通过的词库（前10个）
    const publicRows = await this.db.select().from(userWordbooks)
      .where(and(
        eq(userWordbooks.status, 'approved'),
        sql`(${userWordbooks.createdBy}).user_id = ${userId}`,
      ))
      .orderBy(desc(userWordbooks.learnCount))
      .limit(10);

    const publicWordbooks: AuditWordbookItem[] = publicRows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject as WordbookSubject,
      contentType: row.contentType as WordbookContentType,
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      status: row.status as WordbookStatus,
      auditNote: row.auditNote ?? undefined,
      creatorId: userId,
      creatorName: userName,
      submittedAt: row.approvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      userId: s.userId,
      userName,
      totalLearnCount: s.totalLearnCount,
      totalLikeCount: s.totalLikeCount,
      totalFavoriteCount: s.totalFavoriteCount,
      totalCommentCount: s.totalCommentCount,
      contentCount: s.contentCount,
      approvedCount: s.approvedCount,
      creatorLevel: s.creatorLevel,
      creatorPoints: s.creatorPoints,
      creditLevel: s.creditLevel as CreatorStatsData['creditLevel'],
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      badges: badges.map((b) => this.toBadge(b)),
      publicWordbooks,
    };
  }

  /**
   * 检查并颁发勋章（在积分更新、内容审核通过等节点调用）
   */
  async checkAndAwardBadges(userId: string): Promise<void> {
    const statsRow = await this.db.select().from(creatorStats)
      .where(eq(creatorStats.userId, userId))
      .limit(1);

    if (statsRow.length === 0) return;
    const stats = statsRow[0];

    const earned = BADGE_RULES.filter((rule) => rule.check(stats));
    if (earned.length === 0) return;

    // INSERT ... ON CONFLICT DO NOTHING
    for (const badge of earned) {
      await this.db.insert(creatorBadges)
        .values({
          userId,
          badgeCode: badge.code,
          badgeName: badge.name,
        })
        .onConflictDoNothing({ target: [creatorBadges.userId, creatorBadges.badgeCode] });
    }

    this.logger.log(`Checked badges for creator ${userId}, earned: ${earned.map((b) => b.code).join(',')}`);
  }

  private async ensureCreatorStats(userId: string): Promise<typeof creatorStats.$inferSelect> {
    const existing = await this.db.select().from(creatorStats)
      .where(eq(creatorStats.userId, userId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const inserted = await this.db.insert(creatorStats)
      .values({ userId })
      .returning();

    return inserted[0];
  }

  private toBadge(row: typeof creatorBadges.$inferSelect): CreatorBadge {
    return {
      id: row.id,
      userId: row.userId,
      badgeCode: row.badgeCode,
      badgeName: row.badgeName,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
