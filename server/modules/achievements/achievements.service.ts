import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { badges, userBadges, userPoints, pointLogs } from '@server/database/schema';
import { eq, and, sql, desc, count, inArray, gte, lt } from 'drizzle-orm';

// ===== 等级定义 =====
interface LevelDef {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
}

const LEVELS: LevelDef[] = [
  { level: 1, name: '初学者', minPoints: 0, maxPoints: 99 },
  { level: 2, name: '入门者', minPoints: 100, maxPoints: 299 },
  { level: 3, name: '学习者', minPoints: 300, maxPoints: 599 },
  { level: 4, name: '进阶者', minPoints: 600, maxPoints: 999 },
  { level: 5, name: '熟练者', minPoints: 1000, maxPoints: 1999 },
  { level: 6, name: '精通者', minPoints: 2000, maxPoints: 3999 },
  { level: 7, name: '专家', minPoints: 4000, maxPoints: 6999 },
  { level: 8, name: '大师', minPoints: 7000, maxPoints: 9999 },
  { level: 9, name: '宗师', minPoints: 10000, maxPoints: 19999 },
  { level: 10, name: '传奇', minPoints: 20000, maxPoints: Infinity },
];

// ===== 返回类型 =====
export interface UserPoints {
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  level: number;
  levelName: string;
  nextLevelPoints: number;
  currentLevelProgress: number;
  streakDays: number;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
  category: string;
  conditionType: string;
  conditionValue: number;
  obtained: boolean;
  obtainedAt: string | null;
}

export interface PointLogItem {
  id: string;
  points: number;
  reason: string;
  source: string;
  createdAt: string;
}

export interface AchievementOverview {
  points: UserPoints;
  badges: BadgeItem[];
  recentBadges: BadgeItem[];
  pointLogs: PointLogItem[];
  stats: {
    totalBadges: number;
    obtainedBadges: number;
    totalPoints: number;
    rank: number;
  };
}

export interface EarnPointsResult {
  pointsEarned: number;
  totalPoints: number;
  leveledUp: boolean;
  newLevel: number | null;
  newBadges: BadgeItem[];
}

// ===== 等级计算辅助函数 =====
function calculateLevel(totalPoints: number): {
  level: number;
  levelName: string;
  nextLevelPoints: number;
  currentLevelProgress: number;
} {
  let current: LevelDef = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalPoints >= lvl.minPoints) {
      current = lvl;
    } else {
      break;
    }
  }

  const nextLevelIdx: number = LEVELS.findIndex((l: LevelDef) => l.level === current.level) + 1;
  const nextLevel: LevelDef | undefined = LEVELS[nextLevelIdx];
  const nextLevelPoints: number = nextLevel ? nextLevel.minPoints : current.maxPoints;
  const levelRange: number = current.maxPoints - current.minPoints;
  const progressInLevel: number = totalPoints - current.minPoints;
  const currentLevelProgress: number = levelRange > 0 && levelRange !== Infinity
    ? Math.min(100, Math.round((progressInLevel / levelRange) * 100))
    : 100;

  return {
    level: current.level,
    levelName: current.name,
    nextLevelPoints,
    currentLevelProgress,
  };
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ===== 1. 获取用户积分 =====
  async getUserPoints(userId: string): Promise<UserPoints> {
    const row = await this.db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    let totalPoints: number = 0;
    let todayPoints: number = 0;
    let weekPoints: number = 0;
    let monthPoints: number = 0;

    if (row.length > 0) {
      totalPoints = row[0].totalPoints;
      todayPoints = row[0].todayPoints;
      weekPoints = row[0].weekPoints;
      monthPoints = row[0].monthPoints;
    }

    const levelInfo = calculateLevel(totalPoints);

    return {
      totalPoints,
      todayPoints,
      weekPoints,
      monthPoints,
      level: levelInfo.level,
      levelName: levelInfo.levelName,
      nextLevelPoints: levelInfo.nextLevelPoints,
      currentLevelProgress: levelInfo.currentLevelProgress,
      streakDays: 0,
    };
  }

  // ===== 2. 获取全部勋章列表 =====
  async getAllBadges(userId: string): Promise<BadgeItem[]> {
    const allBadges = await this.db.select().from(badges).orderBy(desc(badges.createdAt));
    const obtainedRows = await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const obtainedMap = new Map<string, (typeof userBadges.$inferSelect)>();
    for (const ub of obtainedRows) {
      obtainedMap.set(ub.badgeId, ub);
    }

    return allBadges.map((badge) => {
      const obtained = obtainedMap.get(badge.id);
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        level: badge.level,
        category: badge.category,
        conditionType: badge.conditionType,
        conditionValue: badge.conditionValue,
        obtained: !!obtained,
        obtainedAt: obtained ? obtained.obtainedAt.toISOString() : null,
      };
    });
  }

  // ===== 3. 获取积分记录 =====
  async getPointLogs(userId: string, limit?: number): Promise<PointLogItem[]> {
    const base = this.db
      .select()
      .from(pointLogs)
      .where(eq(pointLogs.userId, userId))
      .orderBy(desc(pointLogs.createdAt));

    const logs: (typeof pointLogs.$inferSelect)[] = limit
      ? await base.limit(limit)
      : await base;

    return logs.map((log: typeof pointLogs.$inferSelect) => ({
      id: log.id,
      points: log.points,
      reason: log.reason,
      source: log.source,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  // ===== 4. 汇总数据 =====
  async getOverview(userId: string): Promise<AchievementOverview> {
    const [points, allBadges, logs] = await Promise.all([
      this.getUserPoints(userId),
      this.getAllBadges(userId),
      this.getPointLogs(userId, 20),
    ]);

    const obtainedBadges: BadgeItem[] = allBadges.filter((b: BadgeItem) => b.obtained);
    const recentBadges: BadgeItem[] = obtainedBadges
      .filter((b: BadgeItem) => b.obtainedAt !== null)
      .sort((a: BadgeItem, b: BadgeItem) => {
        const ta: number = a.obtainedAt ? new Date(a.obtainedAt).getTime() : 0;
        const tb: number = b.obtainedAt ? new Date(b.obtainedAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);

    return {
      points,
      badges: allBadges,
      recentBadges,
      pointLogs: logs,
      stats: {
        totalBadges: allBadges.length,
        obtainedBadges: obtainedBadges.length,
        totalPoints: points.totalPoints,
        rank: 0,
      },
    };
  }

  // ===== 5. 增加积分 =====
  async earnPoints(
    userId: string,
    source: string,
    reason: string,
    points: number,
  ): Promise<EarnPointsResult> {
    if (!points || points <= 0) {
      throw new BadRequestException('积分必须为正数');
    }

    const oldLevelInfo = await this.getUserPoints(userId);
    const oldLevel: number = oldLevelInfo.level;

    // 更新或插入 user_points
    const now: Date = new Date();
    const todayStr: string = now.toISOString().slice(0, 10);

    // 先查现有记录，再决定插入还是更新
    const existing = await this.db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(userPoints).values({
        userId,
        totalPoints: points,
        todayPoints: points,
        weekPoints: points,
        monthPoints: points,
        lastLoginDate: todayStr,
      });
    } else {
      await this.db
        .update(userPoints)
        .set({
          totalPoints: existing[0].totalPoints + points,
          todayPoints: existing[0].todayPoints + points,
          weekPoints: existing[0].weekPoints + points,
          monthPoints: existing[0].monthPoints + points,
        })
        .where(eq(userPoints.userId, userId));
    }

    // 插入积分日志
    await this.db.insert(pointLogs).values({
      userId,
      points,
      reason,
      source,
    });

    // 获取更新后的积分
    const newPoints: UserPoints = await this.getUserPoints(userId);
    const newTotal: number = newPoints.totalPoints;
    const leveledUp: boolean = newPoints.level > oldLevel;

    // 检测新勋章
    const newBadges: BadgeItem[] = await this.checkAndGrantBadges(userId, newTotal);

    this.logger.log(
      `用户 ${userId} 获得 ${points} 积分 (来源: ${source}, 原因: ${reason}), ` +
      `当前总积分: ${newTotal}, 升级: ${leveledUp}, 新勋章: ${newBadges.length}`,
    );

    return {
      pointsEarned: points,
      totalPoints: newTotal,
      leveledUp,
      newLevel: leveledUp ? newPoints.level : null,
      newBadges,
    };
  }

  // ===== 6. 记录登录 =====
  async recordLogin(userId: string): Promise<EarnPointsResult> {
    const now: Date = new Date();
    const todayStr: string = now.toISOString().slice(0, 10);

    // 查询当前用户积分记录
    const existing = await this.db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    const lastLoginDateStr: string | null = existing[0]?.lastLoginDate || null;

    // 如果今天已经登录过，直接返回当前积分（不给分）
    if (lastLoginDateStr === todayStr) {
      const points: UserPoints = await this.getUserPoints(userId);
      return {
        pointsEarned: 0,
        totalPoints: points.totalPoints,
        leveledUp: false,
        newLevel: null,
        newBadges: [],
      };
    }

    // 首次登录，+5 积分
    const result: EarnPointsResult = await this.earnPoints(
      userId,
      'daily_login',
      '每日登录奖励',
      5,
    );

    // 更新 last_login_date
    if (existing.length > 0) {
      await this.db
        .update(userPoints)
        .set({ lastLoginDate: todayStr })
        .where(eq(userPoints.userId, userId));
    }

    return result;
  }

  // ===== 勋章检测与颁发 =====
  private async checkAndGrantBadges(userId: string, totalPoints: number): Promise<BadgeItem[]> {
    // 获取未获得的勋章
    const obtainedBadgeIds: string[] = (
      await this.db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId))
    ).map((row: { badgeId: string }) => row.badgeId);

    let unearnedBadges: (typeof badges.$inferSelect)[];
    if (obtainedBadgeIds.length > 0) {
      unearnedBadges = await this.db
        .select()
        .from(badges)
        .where(sql`${badges.id} NOT IN (${sql.join(
          obtainedBadgeIds.map((id: string) => sql`${id}::uuid`),
          sql`, `,
        )})`);
    } else {
      unearnedBadges = await this.db.select().from(badges);
    }

    // 基于总积分检测满足条件的勋章（各类勋章按积分近似判断）
    const newlyObtained: BadgeItem[] = [];
    const now: Date = new Date();

    // 各 condition_type 对应的积分阈值（近似映射，后续接入真实数据后可细化）
    const pointThresholds: Record<string, number> = {
      total_words: 1, // 1 单词 = 1 积分
      total_sentences: 2, // 1 句子 = 2 积分
      total_dictations: 3, // 1 听写 = 3 积分
      total_phonetics: 2, // 1 音标 = 2 积分
      streak_days: 5, // 1 天 = 5 积分（每日登录 + 学习）
      total_practices: 2, // 1 次练习 = 2 积分
      perfect_score: 10, // 首次满分约需累计 10 积分
      streak_high_score: 200, // 连续 10 次高分约需 200 积分
      reviewed_mistakes: 3, // 1 道错题复习 = 3 积分
      favorites: 1, // 1 个收藏 = 1 积分（近似）
      all_subjects: 50, // 三科都学过约需 50 积分
      early_bird: 10,
      night_owl: 10,
      weekend_learner: 10,
    };

    for (const badge of unearnedBadges) {
      const thresholdPerUnit: number = pointThresholds[badge.conditionType] ?? 1;
      const requiredPoints: number = badge.conditionValue * thresholdPerUnit;
      const satisfied: boolean = totalPoints >= requiredPoints;

      if (satisfied) {
        // 插入 user_badges
        try {
          await this.db.insert(userBadges).values({
            userId,
            badgeId: badge.id,
            obtainedAt: now,
          });

          newlyObtained.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            level: badge.level,
            category: badge.category,
            conditionType: badge.conditionType,
            conditionValue: badge.conditionValue,
            obtained: true,
            obtainedAt: now.toISOString(),
          });
        } catch (err) {
          // 唯一约束冲突，跳过
          this.logger.warn(`勋章颁发冲突，跳过: ${badge.id}, 错误: ${JSON.stringify(err)}`);
        }
      }
    }

    return newlyObtained;
  }
}
