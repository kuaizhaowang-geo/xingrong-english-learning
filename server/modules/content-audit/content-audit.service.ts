import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase, AuthNPaasService } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, like, desc, count, gte, sql, inArray } from 'drizzle-orm';
import {
  sensitiveWords,
  aiQuestionReviews,
  userContentReviews,
  contentAuditLogs,
  userWordbooks,
  userWordbookItems,
  contentReports,
  creatorStats,
  creatorBadges,
} from '@server/database/schema';
import type {
  SensitiveWord,
  ContentCheckResult,
  AiQuestionReview,
  UserContentReview,
  AuditStats,
  AuditListResponse,
  AuditWordbookItem,
  AuditAction,
  WordbookStatus,
  ReportStatus,
  ContentReportType,
} from '@shared/api.interface';

@Injectable()
export class ContentAuditService {
  private readonly logger = new Logger(ContentAuditService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authnPaasService: AuthNPaasService,
  ) {}

  async checkContent(text: string): Promise<ContentCheckResult> {
    const allWords = await this.db.select().from(sensitiveWords);

    const matched: Array<{ word: string; category: string; level: string }> = [];
    let filtered = text;
    let highestLevel: 'none' | 'low' | 'medium' | 'high' = 'none';

    const levelOrder: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };

    for (const w of allWords) {
      const word = w.word;
      if (text.includes(word)) {
        matched.push({ word, category: w.category, level: w.level });
        if (levelOrder[w.level] > levelOrder[highestLevel]) {
          highestLevel = w.level as 'low' | 'medium' | 'high';
        }
        if (w.level === 'medium') {
          const stars = '*'.repeat(Math.max(1, word.length));
          filtered = filtered.split(word).join(stars);
        }
      }
    }

    let message = '内容安全';
    let passed = true;

    if (highestLevel === 'high') {
      passed = false;
      message = '您输入的内容包含敏感词，请修改后再提交';
    } else if (highestLevel === 'medium') {
      passed = true;
      message = '内容已自动过滤敏感词';
    } else if (highestLevel === 'low') {
      passed = true;
      message = '您输入的内容可能包含敏感词，将进入人工审核';
    }

    return {
      passed,
      level: highestLevel,
      matchedWords: matched,
      filteredText: filtered,
      message,
    };
  }

  async createUserContentReview(
    contentType: string,
    contentId: string,
    contentText: string,
    authorId: string,
  ): Promise<void> {
    const check = await this.checkContent(contentText);
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    if (check.level === 'none' || check.level === 'low') {
      status = 'approved';
    } else if (check.level === 'high') {
      status = 'rejected';
    }

    await this.db.insert(userContentReviews).values({
      contentType,
      contentId,
      contentText,
      authorId,
      reviewStatus: status,
      autoCheckResult: check as unknown as Record<string, unknown>,
    });
  }

  async getSensitiveWords(
    page: number,
    pageSize: number,
    category?: string,
    level?: string,
    keyword?: string,
  ): Promise<{ items: SensitiveWord[]; total: number; page: number; pageSize: number }> {
    const conditions = [];
    if (category) conditions.push(eq(sensitiveWords.category, category));
    if (level) conditions.push(eq(sensitiveWords.level, level));
    if (keyword) conditions.push(like(sensitiveWords.word, `%${keyword}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: count() })
      .from(sensitiveWords)
      .where(where);
    const total = Number(countResult[0]?.count || 0);

    const rows = await this.db
      .select()
      .from(sensitiveWords)
      .where(where)
      .orderBy(desc(sensitiveWords.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: SensitiveWord[] = rows.map((row) => ({
      id: row.id,
      word: row.word,
      category: row.category,
      level: row.level as 'high' | 'medium' | 'low',
      createdAt: (row.createdAt as unknown as Date).toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async createSensitiveWord(
    word: string,
    category: string,
    level: 'high' | 'medium' | 'low',
    operatorId: string,
  ): Promise<SensitiveWord> {
    try {
      const inserted = await this.db
        .insert(sensitiveWords)
        .values({ word, category, level })
        .returning();

      await this.db.insert(contentAuditLogs).values({
        operatorId,
        action: 'create_sensitive_word',
        targetType: 'sensitive_word',
        targetId: inserted[0].id,
        detail: `添加敏感词: ${word}`,
      });

      return {
        id: inserted[0].id,
        word: inserted[0].word,
        category: inserted[0].category,
        level: inserted[0].level as 'high' | 'medium' | 'low',
        createdAt: (inserted[0].createdAt as unknown as Date).toISOString(),
      };
    } catch (err) {
      throw new BadRequestException('敏感词已存在');
    }
  }

  async updateSensitiveWord(
    id: string,
    body: { word?: string; category?: string; level?: string },
    operatorId: string,
  ): Promise<SensitiveWord> {
    const existing = await this.db
      .select()
      .from(sensitiveWords)
      .where(eq(sensitiveWords.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException('敏感词不存在');
    }

    const patch: Record<string, unknown> = {};
    if (body.word !== undefined) patch.word = body.word;
    if (body.category !== undefined) patch.category = body.category;
    if (body.level !== undefined) patch.level = body.level;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('没有可更新的字段');
    }

    const updated = await this.db
      .update(sensitiveWords)
      .set(patch)
      .where(eq(sensitiveWords.id, id))
      .returning();

    await this.db.insert(contentAuditLogs).values({
      operatorId,
      action: 'update_sensitive_word',
      targetType: 'sensitive_word',
      targetId: id,
      detail: `更新敏感词: ${JSON.stringify(patch)}`,
    });

    return {
      id: updated[0].id,
      word: updated[0].word,
      category: updated[0].category,
      level: updated[0].level as 'high' | 'medium' | 'low',
      createdAt: (updated[0].createdAt as unknown as Date).toISOString(),
    };
  }

  async deleteSensitiveWord(id: string, operatorId: string): Promise<void> {
    const existing = await this.db
      .select({ word: sensitiveWords.word })
      .from(sensitiveWords)
      .where(eq(sensitiveWords.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException('敏感词不存在');
    }

    await this.db.delete(sensitiveWords).where(eq(sensitiveWords.id, id));

    await this.db.insert(contentAuditLogs).values({
      operatorId,
      action: 'delete_sensitive_word',
      targetType: 'sensitive_word',
      targetId: id,
      detail: `删除敏感词: ${existing[0].word}`,
    });
  }

  async batchImport(
    words: Array<{ word: string; category: string; level: string }>,
    operatorId: string,
  ): Promise<{ successCount: number; failCount: number }> {
    let successCount = 0;
    let failCount = 0;

    for (const item of words) {
      try {
        await this.db
          .insert(sensitiveWords)
          .values({
            word: item.word.trim(),
            category: item.category || 'other',
            level: item.level || 'medium',
          })
          .onConflictDoNothing();
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    await this.db.insert(contentAuditLogs).values({
      operatorId,
      action: 'batch_import_sensitive_words',
      targetType: 'sensitive_word',
      targetId: 'batch',
      detail: `批量导入 ${successCount} 条，失败 ${failCount} 条`,
    });

    return { successCount, failCount };
  }

  async getAiQuestionReviews(
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<{ items: AiQuestionReview[]; total: number; page: number; pageSize: number }> {
    const where = status ? eq(aiQuestionReviews.reviewStatus, status) : undefined;

    const countResult = await this.db
      .select({ count: count() })
      .from(aiQuestionReviews)
      .where(where);
    const total = Number(countResult[0]?.count || 0);

    const rows = await this.db
      .select()
      .from(aiQuestionReviews)
      .where(where)
      .orderBy(desc(aiQuestionReviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: AiQuestionReview[] = rows.map((row) => ({
      id: row.id,
      questionId: row.questionId || undefined,
      questionType: row.questionType || undefined,
      questionContent: row.questionContent || undefined,
      reviewStatus: row.reviewStatus as 'pending' | 'approved' | 'rejected',
      reviewerId: row.reviewerId || undefined,
      reviewComment: row.reviewComment || undefined,
      autoCheckResult: row.autoCheckResult as Record<string, unknown> | undefined,
      createdAt: (row.createdAt as unknown as Date).toISOString(),
      updatedAt: (row.updatedAt as unknown as Date).toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async reviewAiQuestion(
    id: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    comment?: string,
  ): Promise<AiQuestionReview> {
    const existing = await this.db
      .select()
      .from(aiQuestionReviews)
      .where(eq(aiQuestionReviews.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException('审核记录不存在');
    }

    const updated = await this.db
      .update(aiQuestionReviews)
      .set({
        reviewStatus: status,
        reviewerId,
        reviewComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(aiQuestionReviews.id, id))
      .returning();

    await this.db.insert(contentAuditLogs).values({
      operatorId: reviewerId,
      action: status === 'approved' ? 'approve_ai_question' : 'reject_ai_question',
      targetType: 'ai_question_review',
      targetId: id,
      detail: comment || '',
    });

    return {
      id: updated[0].id,
      questionId: updated[0].questionId || undefined,
      questionType: updated[0].questionType || undefined,
      questionContent: updated[0].questionContent || undefined,
      reviewStatus: updated[0].reviewStatus as 'pending' | 'approved' | 'rejected',
      reviewerId: updated[0].reviewerId || undefined,
      reviewComment: updated[0].reviewComment || undefined,
      autoCheckResult: updated[0].autoCheckResult as Record<string, unknown> | undefined,
      createdAt: (updated[0].createdAt as unknown as Date).toISOString(),
      updatedAt: (updated[0].updatedAt as unknown as Date).toISOString(),
    };
  }

  async getUserContentReviews(
    page: number,
    pageSize: number,
    status?: string,
    contentType?: string,
  ): Promise<{ items: UserContentReview[]; total: number; page: number; pageSize: number }> {
    const conditions = [];
    if (status) conditions.push(eq(userContentReviews.reviewStatus, status));
    if (contentType) conditions.push(eq(userContentReviews.contentType, contentType));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await this.db
      .select({ count: count() })
      .from(userContentReviews)
      .where(where);
    const total = Number(countResult[0]?.count || 0);

    const rows = await this.db
      .select()
      .from(userContentReviews)
      .where(where)
      .orderBy(desc(userContentReviews.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: UserContentReview[] = rows.map((row) => ({
      id: row.id,
      contentType: row.contentType,
      contentId: row.contentId,
      contentText: row.contentText || undefined,
      authorId: row.authorId || undefined,
      reviewStatus: row.reviewStatus as 'pending' | 'approved' | 'rejected',
      reviewerId: row.reviewerId || undefined,
      reviewComment: row.reviewComment || undefined,
      autoCheckResult: row.autoCheckResult as Record<string, unknown> | undefined,
      createdAt: (row.createdAt as unknown as Date).toISOString(),
      updatedAt: (row.updatedAt as unknown as Date).toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async reviewUserContent(
    id: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    comment?: string,
  ): Promise<UserContentReview> {
    const existing = await this.db
      .select()
      .from(userContentReviews)
      .where(eq(userContentReviews.id, id))
      .limit(1);
    if (!existing[0]) {
      throw new NotFoundException('审核记录不存在');
    }

    const updated = await this.db
      .update(userContentReviews)
      .set({
        reviewStatus: status,
        reviewerId,
        reviewComment: comment,
        updatedAt: new Date(),
      })
      .where(eq(userContentReviews.id, id))
      .returning();

    await this.db.insert(contentAuditLogs).values({
      operatorId: reviewerId,
      action: status === 'approved' ? 'approve_user_content' : 'reject_user_content',
      targetType: 'user_content_review',
      targetId: id,
      detail: comment || '',
    });

    return {
      id: updated[0].id,
      contentType: updated[0].contentType,
      contentId: updated[0].contentId,
      contentText: updated[0].contentText || undefined,
      authorId: updated[0].authorId || undefined,
      reviewStatus: updated[0].reviewStatus as 'pending' | 'approved' | 'rejected',
      reviewerId: updated[0].reviewerId || undefined,
      reviewComment: updated[0].reviewComment || undefined,
      autoCheckResult: updated[0].autoCheckResult as Record<string, unknown> | undefined,
      createdAt: (updated[0].createdAt as unknown as Date).toISOString(),
      updatedAt: (updated[0].updatedAt as unknown as Date).toISOString(),
    };
  }

  async getAuditStats(): Promise<AuditStats> {
    const today = new Date().toISOString().slice(0, 10);

    const pendingResult = await this.db
      .select({ count: count() })
      .from(userContentReviews)
      .where(eq(userContentReviews.reviewStatus, 'pending'));
    const pendingCount = Number(pendingResult[0]?.count || 0);

    const aiPendingResult = await this.db
      .select({ count: count() })
      .from(aiQuestionReviews)
      .where(eq(aiQuestionReviews.reviewStatus, 'pending'));
    const totalPending = pendingCount + Number(aiPendingResult[0]?.count || 0);

    const todayDate = new Date(today);
    const todayReviewedResult = await this.db
      .select({ count: count() })
      .from(contentAuditLogs)
      .where(gte(contentAuditLogs.createdAt, todayDate));
    const todayReviewed = Number(todayReviewedResult[0]?.count || 0);

    const approvedResult = await this.db
      .select({ count: count() })
      .from(userContentReviews)
      .where(
        and(
          eq(userContentReviews.reviewStatus, 'approved'),
          gte(userContentReviews.updatedAt, todayDate),
        ),
      );
    const approvedToday = Number(approvedResult[0]?.count || 0);

    const rejectedResult = await this.db
      .select({ count: count() })
      .from(userContentReviews)
      .where(
        and(
          eq(userContentReviews.reviewStatus, 'rejected'),
          gte(userContentReviews.updatedAt, todayDate),
        ),
      );
    const rejectedToday = Number(rejectedResult[0]?.count || 0);
    const totalReviewed = approvedToday + rejectedToday;
    const approveRate = totalReviewed > 0 ? Math.round((approvedToday / totalReviewed) * 100) / 100 : 1;

    const blockedResult = await this.db
      .select({ count: count() })
      .from(userContentReviews)
      .where(eq(userContentReviews.reviewStatus, 'rejected'));
    const blockedCount = Number(blockedResult[0]?.count || 0);

    return {
      pendingCount: totalPending,
      todayReviewed,
      approveRate,
      blockedCount,
    };
  }

  // ===== 词库审核 =====

  private async getCreatorNames(userIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const map = new Map<string, string>();
    if (uniqueIds.length === 0) return map;
    try {
      const users = await this.authnPaasService.listUsersByIds(uniqueIds);
      for (let i = 0; i < users.length; i += 1) {
        const u = users[i];
        const uid = uniqueIds[i];
        const uAny = u as unknown as { name?: { zh_cn?: string; en_us?: string } };
        const n = u ? uAny.name?.zh_cn ?? uAny.name?.en_us ?? uid : uid;
        map.set(uid, n);
      }
    } catch (e) {
      this.logger.warn(`listUsersByIds failed: ${String(e)}`);
    }
    return map;
  }

  private async computeReviewStats(): Promise<{
    pendingCount: number;
    todayAuditedCount: number;
    passRate: number;
    totalReports: number;
    pendingReports: number;
  }> {
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(todayIso);

    const [pendingRes, todayApprovedRes, todayRejectedRes, totalRepRes, pendingRepRes] =
      await Promise.all([
        this.db.select({ count: count() }).from(userWordbooks).where(eq(userWordbooks.status, 'pending')),
        this.db
          .select({ count: count() })
          .from(contentAuditLogs)
          .where(and(eq(contentAuditLogs.action, 'approve_wordbook'), gte(contentAuditLogs.createdAt, todayStart))),
        this.db
          .select({ count: count() })
          .from(contentAuditLogs)
          .where(
            and(
              sql`${contentAuditLogs.action} IN ('reject_wordbook', 'remove_wordbook')`,
              gte(contentAuditLogs.createdAt, todayStart),
            ),
          ),
        this.db.select({ count: count() }).from(contentReports),
        this.db
          .select({ count: count() })
          .from(contentReports)
          .where(eq(contentReports.status, 'pending')),
      ]);

    const approvedToday = Number(todayApprovedRes[0]?.count || 0);
    const rejectedToday = Number(todayRejectedRes[0]?.count || 0);
    const todayAudited = approvedToday + rejectedToday;
    const passRate = todayAudited > 0 ? Math.round((approvedToday / todayAudited) * 1000) / 1000 : 1;

    return {
      pendingCount: Number(pendingRes[0]?.count || 0),
      todayAuditedCount: todayAudited,
      passRate,
      totalReports: Number(totalRepRes[0]?.count || 0),
      pendingReports: Number(pendingRepRes[0]?.count || 0),
    };
  }

  async getPendingWordbooks(
    subject: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<AuditListResponse> {
    const conditions = [eq(userWordbooks.status, 'pending')];
    if (subject) conditions.push(eq(userWordbooks.subject, subject));
    const where = and(...conditions);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userWordbooks).where(where),
      this.db
        .select()
        .from(userWordbooks)
        .where(where)
        .orderBy(sql`${userWordbooks.createdAt} ASC`)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const creatorIds = rows.map((r) => r.createdBy as string).filter(Boolean);
    const nameMap = await this.getCreatorNames(creatorIds);

    const items: AuditWordbookItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject as AuditWordbookItem['subject'],
      contentType: row.contentType as AuditWordbookItem['contentType'],
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      status: row.status as WordbookStatus,
      auditNote: row.auditNote ?? undefined,
      creatorId: (row.createdBy as string) || '',
      creatorName: nameMap.get(row.createdBy as string) || '',
      submittedAt: (row.createdAt as Date).toISOString(),
      createdAt: (row.createdAt as Date).toISOString(),
    }));

    const stats = await this.computeReviewStats();

    return {
      items,
      total: Number(countRes[0]?.count || 0),
      pendingCount: stats.pendingCount,
      todayAuditedCount: stats.todayAuditedCount,
      passRate: stats.passRate,
    };
  }

  async getAuditedWordbooks(
    status: 'approved' | 'rejected' | 'removed' | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: AuditWordbookItem[]; total: number }> {
    const conditions = [];
    if (status) {
      conditions.push(eq(userWordbooks.status, status));
    } else {
      conditions.push(
        sql`${userWordbooks.status} IN ('approved', 'rejected', 'removed')`,
      );
    }
    const where = and(...conditions);

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userWordbooks).where(where),
      this.db
        .select()
        .from(userWordbooks)
        .where(where)
        .orderBy(desc(userWordbooks.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const creatorIds = rows.map((r) => r.createdBy as string).filter(Boolean);
    const nameMap = await this.getCreatorNames(creatorIds);

    const items: AuditWordbookItem[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      subject: row.subject as AuditWordbookItem['subject'],
      contentType: row.contentType as AuditWordbookItem['contentType'],
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      status: row.status as WordbookStatus,
      auditNote: row.auditNote ?? undefined,
      creatorId: (row.createdBy as string) || '',
      creatorName: nameMap.get(row.createdBy as string) || '',
      submittedAt: (row.createdAt as Date).toISOString(),
      createdAt: (row.createdAt as Date).toISOString(),
    }));

    return { items, total: Number(countRes[0]?.count || 0) };
  }

  async getWordbookDetail(
    id: string,
  ): Promise<(AuditWordbookItem & { items: Array<Record<string, unknown>> }) | null> {
    const rows = await this.db.select().from(userWordbooks).where(eq(userWordbooks.id, id)).limit(1);
    if (!rows[0]) return null;
    const row = rows[0];

    const [itemsRes, nameMap] = await Promise.all([
      this.db.select().from(userWordbookItems).where(eq(userWordbookItems.wordbookId, id)),
      this.getCreatorNames([row.createdBy as string]),
    ]);

    return {
      id: row.id,
      name: row.name,
      subject: row.subject as AuditWordbookItem['subject'],
      contentType: row.contentType as AuditWordbookItem['contentType'],
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      status: row.status as WordbookStatus,
      auditNote: row.auditNote ?? undefined,
      creatorId: (row.createdBy as string) || '',
      creatorName: nameMap.get(row.createdBy as string) || '',
      submittedAt: (row.createdAt as Date).toISOString(),
      createdAt: (row.createdAt as Date).toISOString(),
      items: itemsRes.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        content: item.content,
        example: item.example,
        answer: item.answer,
        extra: item.extra,
      })),
    };
  }

  async auditWordbook(
    id: string,
    auditorId: string,
    action: AuditAction,
    note?: string,
  ): Promise<WordbookStatus> {
    const existing = await this.db
      .select({ id: userWordbooks.id, status: userWordbooks.status, createdBy: userWordbooks.createdBy })
      .from(userWordbooks)
      .where(eq(userWordbooks.id, id))
      .limit(1);
    if (!existing[0]) throw new NotFoundException('词库不存在');

    const statusMap: Record<AuditAction, WordbookStatus> = {
      approve: 'approved',
      reject: 'rejected',
      modify: 'draft',
      remove: 'removed',
    };
    const targetStatus = statusMap[action];
    if (!targetStatus) throw new BadRequestException('无效的审核操作');

    const patch: Record<string, unknown> = {
      status: targetStatus,
      auditNote: note ?? null,
      updatedAt: new Date(),
    };
    if (action === 'approve') {
      patch.approvedAt = new Date();
    }

    await this.db.update(userWordbooks).set(patch).where(eq(userWordbooks.id, id));

    await this.db.insert(contentAuditLogs).values({
      operatorId: auditorId,
      action: `${action}_wordbook`,
      targetType: 'wordbook',
      targetId: id,
      detail: note || '',
    });

    // 通过时更新创作者统计并检查勋章
    if (action === 'approve') {
      const creatorId = existing[0].createdBy as string;
      if (creatorId) {
        await this.awardCreatorOnApprove(creatorId);
      }
    }

    return targetStatus;
  }

  private async awardCreatorOnApprove(userId: string): Promise<void> {
    const existing = await this.db
      .select({
        contentCount: creatorStats.contentCount,
        approvedCount: creatorStats.approvedCount,
        creatorPoints: creatorStats.creatorPoints,
      })
      .from(creatorStats)
      .where(eq(creatorStats.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(creatorStats).values({
        userId,
        contentCount: 1,
        approvedCount: 1,
        creatorPoints: 10,
      });
      // 首次通过审核，颁发「初出茅庐」勋章
      await this.db
        .insert(creatorBadges)
        .values({ userId, badgeCode: 'first_publish', badgeName: '初出茅庐' })
        .onConflictDoNothing();
    } else {
      const prevApproved = existing[0].approvedCount;
      await this.db
        .update(creatorStats)
        .set({
          contentCount: sql`${creatorStats.contentCount} + 1`,
          approvedCount: sql`${creatorStats.approvedCount} + 1`,
          creatorPoints: sql`${creatorStats.creatorPoints} + 10`,
          updatedAt: new Date(),
        })
        .where(eq(creatorStats.userId, userId));
      if (prevApproved === 0) {
        await this.db
          .insert(creatorBadges)
          .values({ userId, badgeCode: 'first_publish', badgeName: '初出茅庐' })
          .onConflictDoNothing();
      }
    }
  }

  // ===== 举报管理 =====

  async getReports(
    page: number,
    pageSize: number,
    status?: ReportStatus,
    reportType?: ContentReportType,
  ): Promise<{
    items: Array<{
      id: string;
      contentType: string;
      contentId: string;
      reporterId: string;
      reportType: string;
      reportReason?: string;
      status: string;
      handlerId?: string;
      handleNote?: string;
      handledAt?: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const conditions = [];
    if (status) conditions.push(eq(contentReports.status, status));
    if (reportType) conditions.push(eq(contentReports.reportType, reportType));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRes, rows] = await Promise.all([
      this.db.select({ count: count() }).from(contentReports).where(where),
      this.db
        .select()
        .from(contentReports)
        .where(where)
        .orderBy(desc(contentReports.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const items = rows.map((row) => ({
      id: row.id,
      contentType: row.contentType,
      contentId: row.contentId,
      reporterId: row.reporterId,
      reportType: row.reportType,
      reportReason: row.reportReason ?? undefined,
      status: row.status,
      handlerId: row.handlerId ?? undefined,
      handleNote: row.handleNote ?? undefined,
      handledAt: row.handledAt ? (row.handledAt as Date).toISOString() : undefined,
      createdAt: (row.createdAt as Date).toISOString(),
    }));

    return { items, total: Number(countRes[0]?.count || 0) };
  }

  async handleReport(
    id: string,
    handlerId: string,
    status: 'resolved' | 'rejected',
    handleNote?: string,
    action?: 'remove_content' | 'warning' | 'none',
  ): Promise<void> {
    const existing = await this.db
      .select()
      .from(contentReports)
      .where(eq(contentReports.id, id))
      .limit(1);
    if (!existing[0]) throw new NotFoundException('举报不存在');

    await this.db
      .update(contentReports)
      .set({
        status,
        handlerId,
        handleNote: handleNote ?? null,
        handledAt: new Date(),
      })
      .where(eq(contentReports.id, id));

    // 如果 action = remove_content，把词库 status 改为 removed
    if (action === 'remove_content' && existing[0].contentType === 'wordbook') {
      await this.db
        .update(userWordbooks)
        .set({ status: 'removed', auditNote: handleNote ?? null, updatedAt: new Date() })
        .where(eq(userWordbooks.id, existing[0].contentId));
    }

    // 举报属实，给举报者积分 +5（简化：记日志）
    if (status === 'resolved') {
      await this.db.insert(contentAuditLogs).values({
        operatorId: handlerId,
        action: 'resolve_report',
        targetType: 'report',
        targetId: id,
        detail: `举报属实，举报者 ${existing[0].reporterId} 奖励积分+5 ${handleNote ? `(${handleNote})` : ''}`,
      });
    }
  }

  // ===== 审核统计 =====

  async getContentReviewStats(): Promise<{
    pendingCount: number;
    todayAuditedCount: number;
    passRate: number;
    totalReports: number;
    pendingReports: number;
  }> {
    return this.computeReviewStats();
  }

  // ===== 自动审核 =====

  autoAudit(name: string, description?: string): 'pass' | 'warning' | 'reject' {
    const sensitiveWordsList = ['政治', '色情', '暴力', '赌博', '诈骗', '广告'];
    const text = `${name} ${description ?? ''}`;
    let hitCount = 0;
    for (const word of sensitiveWordsList) {
      if (text.includes(word)) hitCount += 1;
    }
    if (hitCount >= 2) return 'reject';
    if (hitCount === 1) return 'warning';
    return 'pass';
  }
}
