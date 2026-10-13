import { Injectable, Inject, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase, AuthNPaasService } from '@lark-apaas/fullstack-nestjs-core';
import {
  userWordbooks,
  userWordbookItems,
  contentLikes,
  contentFavorites,
  contentComments,
  contentReports,
  contentMarketViews,
  creatorStats,
} from '@server/database/schema';
import { eq, and, desc, asc, count, sql, isNull, inArray } from 'drizzle-orm';
import type {
  ContentMarketItem,
  ContentDetail,
  ContentComment,
  ContentMarketListResponse,
  ContentCommentListResponse,
  ReportContentDto,
  ContentRating,
  UserWordbookItem,
} from '@shared/api.interface';

type SortMode = 'hot' | 'new' | 'rating';

function computeContentRating(rating: number): ContentRating {
  if (rating >= 4.5) return 'featured';
  if (rating >= 4.0) return 'quality';
  return 'normal';
}

function calculateCreatorLevel(points: number): number {
  if (points >= 10000) return 6;
  if (points >= 5000) return 5;
  if (points >= 2000) return 4;
  if (points >= 500) return 3;
  if (points >= 100) return 2;
  return 1;
}

type WbRow = {
  id: string;
  name: string;
  subject: string;
  contentType: string;
  description: string | null;
  itemCount: number;
  learnCount: number;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
  rating: string | number;
  approvedAt: Date | null;
  createdAt: Date;
  creatorId: string;
  creatorLevel: number | null;
  creditLevel: string | null;
};

@Injectable()
export class ContentMarketService {
  private readonly logger = new Logger(ContentMarketService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authnPaasService: AuthNPaasService,
  ) {}

  private async resolveUserNames(userIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return new Map();
    try {
      const users = await this.authnPaasService.listUsersByIds(unique);
      const map = new Map<string, string>();
      for (let i = 0; i < users.length; i += 1) {
        const u = users[i];
        const uid = unique[i];
        const n = u ? (u as { name?: { zh_cn?: string; en_us?: string } }).name?.zh_cn
          ?? (u as { name?: { zh_cn?: string; en_us?: string } }).name?.en_us ?? uid : uid;
        map.set(uid, n);
      }
      return map;
    } catch (err) {
      this.logger.error(`解析用户姓名失败: ${JSON.stringify(err)}`);
      return new Map(unique.map(id => [id, id]));
    }
  }

  private async updateCreatorPoints(userId: string, delta: number): Promise<void> {
    if (!userId || delta === 0) return;
    const existing = await this.db
      .select({ creatorPoints: creatorStats.creatorPoints })
      .from(creatorStats)
      .where(eq(creatorStats.userId, userId))
      .limit(1);
    if (existing.length === 0) {
      const p = Math.max(0, delta);
      await this.db.insert(creatorStats).values({ userId, creatorPoints: p, creatorLevel: calculateCreatorLevel(p) });
      return;
    }
    const p = Math.max(0, existing[0].creatorPoints + delta);
    await this.db.update(creatorStats).set({
      creatorPoints: p,
      creatorLevel: calculateCreatorLevel(p),
      updatedAt: new Date(),
    }).where(eq(creatorStats.userId, userId));
  }

  private mapMarketItem(row: WbRow, nameMap: Map<string, string>): ContentMarketItem {
    const ratingNum = Number(row.rating ?? 0);
    return {
      id: row.id,
      name: row.name,
      subject: row.subject as ContentMarketItem['subject'],
      contentType: row.contentType as ContentMarketItem['contentType'],
      description: row.description ?? undefined,
      itemCount: row.itemCount,
      learnCount: row.learnCount,
      likeCount: row.likeCount,
      favoriteCount: row.favoriteCount,
      commentCount: row.commentCount,
      rating: ratingNum,
      contentRating: computeContentRating(ratingNum),
      creatorId: row.creatorId,
      creatorName: nameMap.get(row.creatorId) ?? row.creatorId,
      creatorLevel: row.creatorLevel ?? 1,
      creditLevel: (row.creditLevel ?? 'A') as ContentMarketItem['creditLevel'],
      approvedAt: row.approvedAt ? row.approvedAt.toISOString() : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async getCreatorId(wordbookId: string): Promise<string> {
    const rows = await this.db
      .select({ creatorId: sql<string>`(${userWordbooks.createdBy}).user_id` })
      .from(userWordbooks)
      .where(eq(userWordbooks.id, wordbookId))
      .limit(1);
    return rows[0]?.creatorId ?? '';
  }

  async getList(
    subject?: string,
    contentType?: string,
    sort: SortMode = 'hot',
    search?: string,
    page = 1,
    pageSize = 20,
  ): Promise<ContentMarketListResponse> {
    const whereConditions = [
      eq(userWordbooks.visibility, 'public'),
      eq(userWordbooks.status, 'approved'),
    ];
    if (subject) whereConditions.push(eq(userWordbooks.subject, subject));
    if (contentType) whereConditions.push(eq(userWordbooks.contentType, contentType));
    if (search) whereConditions.push(sql`${userWordbooks.name} ILIKE ${`%${search}%`}`);
    const baseWhere = and(...whereConditions);
    const offset = (page - 1) * pageSize;

    let orderExpr;
    if (sort === 'hot') {
      orderExpr = sql`${userWordbooks.learnCount} + ${userWordbooks.likeCount} * 2 + ${userWordbooks.favoriteCount} * 5 DESC`;
    } else if (sort === 'new') {
      orderExpr = desc(userWordbooks.approvedAt);
    } else {
      orderExpr = desc(userWordbooks.rating);
    }

    const [totalResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(userWordbooks).where(baseWhere),
      this.db
        .select({
          id: userWordbooks.id,
          name: userWordbooks.name,
          subject: userWordbooks.subject,
          contentType: userWordbooks.contentType,
          description: userWordbooks.description,
          itemCount: userWordbooks.itemCount,
          learnCount: userWordbooks.learnCount,
          likeCount: userWordbooks.likeCount,
          favoriteCount: userWordbooks.favoriteCount,
          commentCount: userWordbooks.commentCount,
          rating: userWordbooks.rating,
          approvedAt: userWordbooks.approvedAt,
          createdAt: userWordbooks.createdAt,
          creatorId: sql<string>`(${userWordbooks.createdBy}).user_id`,
          creatorLevel: creatorStats.creatorLevel,
          creditLevel: creatorStats.creditLevel,
        })
        .from(userWordbooks)
        .leftJoin(creatorStats, sql`(${userWordbooks.createdBy}).user_id = ${creatorStats.userId}`)
        .where(baseWhere)
        .orderBy(orderExpr)
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const nameMap = await this.resolveUserNames(rows.map(r => r.creatorId).filter(Boolean));
    const items: ContentMarketItem[] = rows.map(r => this.mapMarketItem(r as WbRow, nameMap));
    return { items, total };
  }

  async getDetail(id: string, userId?: string): Promise<ContentDetail> {
    const rows = await this.db
      .select({
        id: userWordbooks.id,
        name: userWordbooks.name,
        subject: userWordbooks.subject,
        contentType: userWordbooks.contentType,
        description: userWordbooks.description,
        itemCount: userWordbooks.itemCount,
        learnCount: userWordbooks.learnCount,
        likeCount: userWordbooks.likeCount,
        favoriteCount: userWordbooks.favoriteCount,
        commentCount: userWordbooks.commentCount,
        rating: userWordbooks.rating,
        status: userWordbooks.status,
        visibility: userWordbooks.visibility,
        allowLearn: userWordbooks.allowLearn,
        allowCopy: userWordbooks.allowCopy,
        allowComment: userWordbooks.allowComment,
        approvedAt: userWordbooks.approvedAt,
        createdAt: userWordbooks.createdAt,
        creatorId: sql<string>`(${userWordbooks.createdBy}).user_id`,
        creatorLevel: creatorStats.creatorLevel,
        creditLevel: creatorStats.creditLevel,
      })
      .from(userWordbooks)
      .leftJoin(creatorStats, sql`(${userWordbooks.createdBy}).user_id = ${creatorStats.userId}`)
      .where(eq(userWordbooks.id, id))
      .limit(1);

    if (rows.length === 0) throw new NotFoundException('词库不存在');
    const wb = rows[0];
    const creatorId = wb.creatorId;
    const isPublic = wb.visibility === 'public' && wb.status === 'approved';
    const isOwner = userId && creatorId === userId;
    if (!isPublic && !isOwner) throw new NotFoundException('词库不存在或未公开');

    await Promise.all([
      userId ? this.db.insert(contentMarketViews).values({ wordbookId: id, viewerId: userId }) : Promise.resolve(),
      this.db.update(userWordbooks).set({ learnCount: sql`${userWordbooks.learnCount} + 1` }).where(eq(userWordbooks.id, id)),
    ]);

    const [likeRow, favRow, itemRows] = await Promise.all([
      userId
        ? this.db.select({ id: contentLikes.id }).from(contentLikes)
            .where(and(eq(contentLikes.wordbookId, id), eq(contentLikes.userId, userId))).limit(1)
        : Promise.resolve([]),
      userId
        ? this.db.select({ id: contentFavorites.id }).from(contentFavorites)
            .where(and(eq(contentFavorites.wordbookId, id), eq(contentFavorites.userId, userId))).limit(1)
        : Promise.resolve([]),
      this.db.select().from(userWordbookItems).where(eq(userWordbookItems.wordbookId, id))
        .orderBy(asc(userWordbookItems.createdAt)).limit(20),
    ]);

    const nameMap = await this.resolveUserNames([creatorId]);
    const ratingNum = Number(wb.rating ?? 0);

    const items: UserWordbookItem[] = itemRows.map(it => ({
      id: it.id,
      wordbookId: it.wordbookId,
      subject: it.subject as UserWordbookItem['subject'],
      contentType: it.contentType as UserWordbookItem['contentType'],
      source: it.source as UserWordbookItem['source'],
      sourceId: it.sourceId ?? undefined,
      sourceInfo: it.sourceInfo as UserWordbookItem['sourceInfo'],
      title: it.title ?? undefined,
      subtitle: it.subtitle ?? undefined,
      content: it.content,
      example: it.example ?? undefined,
      answer: it.answer ?? undefined,
      extra: it.extra as UserWordbookItem['extra'],
      studyCount: it.studyCount,
      correctCount: it.correctCount,
      correctRate: Number(it.correctRate),
      lastStudyTime: it.lastStudyTime ? it.lastStudyTime.toISOString() : undefined,
      isStarred: it.isStarred,
      createdAt: it.createdAt.toISOString(),
    }));

    return {
      id: wb.id,
      name: wb.name,
      subject: wb.subject as ContentDetail['subject'],
      contentType: wb.contentType as ContentDetail['contentType'],
      description: wb.description ?? undefined,
      itemCount: wb.itemCount,
      learnCount: wb.learnCount + 1,
      likeCount: wb.likeCount,
      favoriteCount: wb.favoriteCount,
      commentCount: wb.commentCount,
      rating: ratingNum,
      contentRating: computeContentRating(ratingNum),
      visibility: wb.visibility as ContentDetail['visibility'],
      allowLearn: wb.allowLearn,
      allowCopy: wb.allowCopy,
      allowComment: wb.allowComment,
      creatorId,
      creatorName: nameMap.get(creatorId) ?? creatorId,
      creatorLevel: wb.creatorLevel ?? 1,
      creditLevel: (wb.creditLevel ?? 'A') as ContentDetail['creditLevel'],
      items,
      isLiked: likeRow.length > 0,
      isFavorited: favRow.length > 0,
      approvedAt: wb.approvedAt ? wb.approvedAt.toISOString() : undefined,
      createdAt: wb.createdAt.toISOString(),
    };
  }

  async toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const wb = await this.db.select({ id: userWordbooks.id }).from(userWordbooks).where(eq(userWordbooks.id, id)).limit(1);
    if (wb.length === 0) throw new NotFoundException('词库不存在');

    const existing = await this.db.select({ id: contentLikes.id }).from(contentLikes)
      .where(and(eq(contentLikes.wordbookId, id), eq(contentLikes.userId, userId))).limit(1);

    let liked: boolean;
    let delta: number;

    if (existing.length > 0) {
      await this.db.delete(contentLikes).where(and(eq(contentLikes.wordbookId, id), eq(contentLikes.userId, userId)));
      liked = false;
      delta = -1;
    } else {
      try {
        await this.db.insert(contentLikes).values({ wordbookId: id, userId });
      } catch (_err) {
        const u = await this.db.update(userWordbooks).set({ likeCount: sql`${userWordbooks.likeCount}` })
          .where(eq(userWordbooks.id, id)).returning({ likeCount: userWordbooks.likeCount });
        return { liked: true, likeCount: u[0].likeCount };
      }
      liked = true;
      delta = 1;
    }

    const updated = await this.db.update(userWordbooks)
      .set({ likeCount: sql`${userWordbooks.likeCount} + ${delta}` })
      .where(eq(userWordbooks.id, id)).returning({ likeCount: userWordbooks.likeCount });

    const creatorId = await this.getCreatorId(id);
    if (creatorId && creatorId !== userId) await this.updateCreatorPoints(creatorId, delta * 2);

    return { liked, likeCount: updated[0].likeCount };
  }

  async toggleFavorite(id: string, userId: string): Promise<{ favorited: boolean; favoriteCount: number }> {
    const wb = await this.db.select({ id: userWordbooks.id }).from(userWordbooks).where(eq(userWordbooks.id, id)).limit(1);
    if (wb.length === 0) throw new NotFoundException('词库不存在');

    const existing = await this.db.select({ id: contentFavorites.id }).from(contentFavorites)
      .where(and(eq(contentFavorites.wordbookId, id), eq(contentFavorites.userId, userId))).limit(1);

    let favorited: boolean;
    let delta: number;

    if (existing.length > 0) {
      await this.db.delete(contentFavorites).where(and(eq(contentFavorites.wordbookId, id), eq(contentFavorites.userId, userId)));
      favorited = false;
      delta = -1;
    } else {
      try {
        await this.db.insert(contentFavorites).values({ wordbookId: id, userId });
      } catch (_err) {
        const u = await this.db.update(userWordbooks).set({ favoriteCount: sql`${userWordbooks.favoriteCount}` })
          .where(eq(userWordbooks.id, id)).returning({ favoriteCount: userWordbooks.favoriteCount });
        return { favorited: true, favoriteCount: u[0].favoriteCount };
      }
      favorited = true;
      delta = 1;
    }

    const updated = await this.db.update(userWordbooks)
      .set({ favoriteCount: sql`${userWordbooks.favoriteCount} + ${delta}` })
      .where(eq(userWordbooks.id, id)).returning({ favoriteCount: userWordbooks.favoriteCount });

    const creatorId = await this.getCreatorId(id);
    if (creatorId && creatorId !== userId) await this.updateCreatorPoints(creatorId, delta * 5);

    return { favorited, favoriteCount: updated[0].favoriteCount };
  }

  async getComments(
    id: string,
    page = 1,
    pageSize = 20,
    userId?: string,
  ): Promise<ContentCommentListResponse> {
    const offset = (page - 1) * pageSize;
    const where = and(eq(contentComments.wordbookId, id), isNull(contentComments.parentId), eq(contentComments.status, 'approved'));

    const [totalResult, topLevel] = await Promise.all([
      this.db.select({ count: count() }).from(contentComments).where(where),
      this.db.select().from(contentComments).where(where)
        .orderBy(desc(contentComments.createdAt)).limit(pageSize).offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const topIds = topLevel.map(c => c.id);
    let replies: typeof contentComments.$inferSelect[] = [];
    if (topIds.length > 0) {
      replies = await this.db.select().from(contentComments)
        .where(and(inArray(contentComments.parentId, topIds), eq(contentComments.status, 'approved')))
        .orderBy(asc(contentComments.createdAt));
    }

    const allIds = new Set<string>();
    for (const c of topLevel) allIds.add(c.userId);
    for (const r of replies) allIds.add(r.userId);
    const nameMap = await this.resolveUserNames([...allIds]);

    // Group up to 2 replies per parent
    const byParent = new Map<string, typeof replies>();
    const countByParent = new Map<string, number>();
    for (const r of replies) {
      const pid = r.parentId;
      if (!pid) continue;
      const cnt = countByParent.get(pid) ?? 0;
      if (cnt < 2) {
        const arr = byParent.get(pid) ?? [];
        arr.push(r);
        byParent.set(pid, arr);
        countByParent.set(pid, cnt + 1);
      }
    }

    const mapComment = (c: typeof contentComments.$inferSelect): ContentComment => ({
      id: c.id,
      wordbookId: c.wordbookId,
      userId: c.userId,
      userName: nameMap.get(c.userId) ?? c.userId,
      parentId: c.parentId ?? undefined,
      content: c.content,
      likeCount: c.likeCount,
      isLiked: false,
      createdAt: c.createdAt.toISOString(),
    });

    const items: ContentComment[] = topLevel.map(c => {
      const replyList = byParent.get(c.id) ?? [];
      return { ...mapComment(c), replies: replyList.map(r => mapComment(r)) };
    });

    return { items, total };
    // Note: isLiked defaults to false (no content_comment_likes table in schema);
    // per-user comment likes would need a join table to toggle properly.
    void userId;
  }

  async createComment(
    id: string,
    userId: string,
    body: { content: string; parentId?: string },
  ): Promise<ContentComment> {
    if (!body.content?.trim()) throw new BadRequestException('评论内容不能为空');
    const wb = await this.db.select({ id: userWordbooks.id, allowComment: userWordbooks.allowComment })
      .from(userWordbooks).where(eq(userWordbooks.id, id)).limit(1);
    if (wb.length === 0) throw new NotFoundException('词库不存在');
    if (!wb[0].allowComment) throw new ConflictException('该词库不允许评论');

    if (body.parentId) {
      const parent = await this.db.select({ id: contentComments.id, wordbookId: contentComments.wordbookId })
        .from(contentComments).where(eq(contentComments.id, body.parentId)).limit(1);
      if (parent.length === 0 || parent[0].wordbookId !== id) throw new NotFoundException('父评论不存在');
    }

    const inserted = await this.db.insert(contentComments).values({
      wordbookId: id,
      userId,
      parentId: body.parentId,
      content: body.content.trim(),
    }).returning();

    if (!body.parentId) {
      await this.db.update(userWordbooks).set({ commentCount: sql`${userWordbooks.commentCount} + 1` })
        .where(eq(userWordbooks.id, id));
    }

    const creatorId = await this.getCreatorId(id);
    if (creatorId && creatorId !== userId) await this.updateCreatorPoints(creatorId, 1);

    const nameMap = await this.resolveUserNames([userId]);
    const c = inserted[0];
    return {
      id: c.id,
      wordbookId: c.wordbookId,
      userId: c.userId,
      userName: nameMap.get(c.userId) ?? c.userId,
      parentId: c.parentId ?? undefined,
      content: c.content,
      likeCount: c.likeCount,
      isLiked: false,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async toggleCommentLike(commentId: string): Promise<{ liked: boolean; likeCount: number }> {
    const comment = await this.db.select({ id: contentComments.id }).from(contentComments)
      .where(eq(contentComments.id, commentId)).limit(1);
    if (comment.length === 0) throw new NotFoundException('评论不存在');
    // Simplified: schema has no content_comment_likes table, so always increment.
    const updated = await this.db.update(contentComments)
      .set({ likeCount: sql`${contentComments.likeCount} + 1` })
      .where(eq(contentComments.id, commentId))
      .returning({ likeCount: contentComments.likeCount });
    return { liked: true, likeCount: updated[0].likeCount };
  }

  async reportContent(userId: string, dto: ReportContentDto): Promise<{ success: boolean }> {
    if (dto.contentType === 'wordbook') {
      const wb = await this.db.select({ id: userWordbooks.id }).from(userWordbooks)
        .where(eq(userWordbooks.id, dto.contentId)).limit(1);
      if (wb.length === 0) throw new NotFoundException('内容不存在');
      await this.db.insert(contentReports).values({
        contentType: dto.contentType,
        contentId: dto.contentId,
        reporterId: userId,
        reportType: dto.reportType,
        reportReason: dto.reportReason,
      });
      await this.db.update(userWordbooks).set({ reportCount: sql`${userWordbooks.reportCount} + 1` })
        .where(eq(userWordbooks.id, dto.contentId));
    } else {
      const c = await this.db.select({ id: contentComments.id }).from(contentComments)
        .where(eq(contentComments.id, dto.contentId)).limit(1);
      if (c.length === 0) throw new NotFoundException('评论不存在');
      await this.db.insert(contentReports).values({
        contentType: dto.contentType,
        contentId: dto.contentId,
        reporterId: userId,
        reportType: dto.reportType,
        reportReason: dto.reportReason,
      });
    }
    return { success: true };
  }

  async copyToMyWordbook(
    id: string,
    userId: string,
    body: { targetWordbookId?: string; newWordbookName?: string },
  ): Promise<{ wordbookId: string; copiedCount: number }> {
    const src = await this.db.select({
      id: userWordbooks.id, name: userWordbooks.name, subject: userWordbooks.subject,
      contentType: userWordbooks.contentType, visibility: userWordbooks.visibility,
      status: userWordbooks.status, allowCopy: userWordbooks.allowCopy,
    }).from(userWordbooks).where(eq(userWordbooks.id, id)).limit(1);
    if (src.length === 0) throw new NotFoundException('词库不存在');
    if (src[0].visibility !== 'public' || src[0].status !== 'approved') throw new ConflictException('仅公开且审核通过的词库可复制');
    if (!src[0].allowCopy) throw new ConflictException('该词库不允许复制');

    const srcItems = await this.db.select().from(userWordbookItems).where(eq(userWordbookItems.wordbookId, id));
    if (srcItems.length === 0) throw new BadRequestException('源词库没有可复制的内容');

    let targetId: string;
    if (body.targetWordbookId) {
      const target = await this.db.select({
        id: userWordbooks.id,
        creatorId: sql<string>`(${userWordbooks.createdBy}).user_id`,
      }).from(userWordbooks).where(eq(userWordbooks.id, body.targetWordbookId)).limit(1);
      if (target.length === 0) throw new NotFoundException('目标词库不存在');
      if (target[0].creatorId !== userId) throw new ConflictException('只能复制到自己的词库');
      targetId = body.targetWordbookId;
    } else {
      const name = body.newWordbookName?.trim() || `复制：${src[0].name}`;
      const ins = await this.db.insert(userWordbooks).values({
        name, subject: src[0].subject, contentType: src[0].contentType,
        description: `复制自 ${src[0].name}`,
      }).returning({ id: userWordbooks.id });
      targetId = ins[0].id;
    }

    const values = srcItems.map(it => ({
      wordbookId: targetId,
      subject: it.subject,
      contentType: it.contentType,
      source: 'custom' as const,
      sourceId: it.sourceId,
      sourceInfo: it.sourceInfo,
      title: it.title,
      subtitle: it.subtitle,
      content: it.content,
      example: it.example,
      answer: it.answer,
      extra: it.extra,
    }));
    await this.db.insert(userWordbookItems).values(values);
    await this.db.update(userWordbooks).set({ itemCount: sql`${userWordbooks.itemCount} + ${srcItems.length}` })
      .where(eq(userWordbooks.id, targetId));
    await this.db.update(userWordbooks).set({ favoriteCount: sql`${userWordbooks.favoriteCount} + 1` })
      .where(eq(userWordbooks.id, id));

    return { wordbookId: targetId, copiedCount: srcItems.length };
  }
}
