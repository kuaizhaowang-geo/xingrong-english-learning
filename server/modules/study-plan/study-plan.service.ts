import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { studyPlans, planRecords, planReminders } from '@server/database/schema';
import { eq, and, desc, gte, lt, sql, type Column } from 'drizzle-orm';
import type {
  StudyPlanItem,
  PlanRecordItem,
  PlanReminderItem,
  PlanOverview,
  PlanStatsResponse,
  AiPlanRecommendation,
  CreatePlanDto,
  UpdateTaskProgressDto,
  DailyTasks,
} from '@shared/api.interface';

// ===== Task type mapping =====
interface TaskTypeMap {
  key: 'wordCount' | 'sentenceCount' | 'dictationCount' | 'phoneticCount' | 'aiQuizCount';
  completedKey: 'wordCompleted' | 'sentenceCompleted' | 'dictationCompleted' | 'phoneticCompleted' | 'aiQuizCompleted';
  label: string;
  icon: string;
}

const TASK_TYPES: TaskTypeMap[] = [
  { key: 'wordCount', completedKey: 'wordCompleted', label: '单词学习', icon: 'book-open' },
  { key: 'sentenceCount', completedKey: 'sentenceCompleted', label: '句子练习', icon: 'message-square' },
  { key: 'dictationCount', completedKey: 'dictationCompleted', label: '听写练习', icon: 'headphones' },
  { key: 'phoneticCount', completedKey: 'phoneticCompleted', label: '音标学习', icon: 'volume-2' },
  { key: 'aiQuizCount', completedKey: 'aiQuizCompleted', label: 'AI出题', icon: 'sparkles' },
];

@Injectable()
export class StudyPlanService {
  private readonly logger = new Logger(StudyPlanService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ===== 1. 获取学习计划概览 =====
  async getOverview(userId: string): Promise<PlanOverview> {
    const todayStr = this.getTodayDateString();

    const [currentPlanRow, todayRecordRow] = await Promise.all([
      this.getCurrentPlanRow(userId),
      this.db
        .select()
        .from(planRecords)
        .where(
          and(
            eq(planRecords.userId, userId),
            eq(planRecords.recordDate, todayStr),
          ),
        )
        .limit(1),
    ]);

    const currentPlan = currentPlanRow ? this.mapPlan(currentPlanRow) : null;
    const todayRecord = todayRecordRow.length > 0
      ? this.mapRecord(todayRecordRow[0])
      : null;

    const [streakDays, weeklyCompletionRate] = await Promise.all([
      this.calculateStreakDays(userId, todayStr),
      this.calculateWeeklyCompletionRate(userId, todayStr),
    ]);

    const todayTasks = this.buildTodayTasks(currentPlan, todayRecord);

    return {
      currentPlan,
      todayRecord,
      streakDays,
      weeklyCompletionRate,
      todayTasks,
    };
  }

  // ===== 2. 获取用户所有计划列表 =====
  async getPlans(userId: string): Promise<StudyPlanItem[]> {
    const rows = await this.db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId))
      .orderBy(desc(studyPlans.createdAt));

    return rows.map((row) => this.mapPlan(row));
  }

  // ===== 3. 创建新计划 =====
  async createPlan(userId: string, dto: CreatePlanDto): Promise<StudyPlanItem> {
    if (!dto.planName?.trim()) {
      throw new BadRequestException('计划名称不能为空');
    }

    const created = await this.db.transaction(async (tx) => {
      // 把用户其他计划设为 paused
      await tx
        .update(studyPlans)
        .set({ status: 'paused' })
        .where(
          and(
            eq(studyPlans.userId, userId),
            eq(studyPlans.status, 'active'),
          ),
        );

      const rows = await tx
        .insert(studyPlans)
        .values({
          userId,
          planName: dto.planName,
          planType: dto.planType,
          startDate: dto.startDate,
          endDate: dto.endDate || null,
          dailyTasks: dto.dailyTasks,
          dailyMinutes: dto.dailyMinutes,
          remindTime: dto.remindTime || null,
          status: 'active',
        })
        .returning();

      return rows[0];
    });

    this.logger.log(`用户 ${userId} 创建了学习计划: ${dto.planName}`);
    return this.mapPlan(created);
  }

  // ===== 4. 更新计划 =====
  async updatePlan(
    userId: string,
    planId: string,
    dto: Partial<CreatePlanDto>,
  ): Promise<StudyPlanItem> {
    const existing = await this.findPlanOrThrow(userId, planId);

    const patch: Partial<typeof studyPlans.$inferInsert> = {};
    if (dto.planName !== undefined) patch.planName = dto.planName;
    if (dto.planType !== undefined) patch.planType = dto.planType;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate || null;
    if (dto.dailyTasks !== undefined) patch.dailyTasks = dto.dailyTasks;
    if (dto.dailyMinutes !== undefined) patch.dailyMinutes = dto.dailyMinutes;
    if (dto.remindTime !== undefined) patch.remindTime = dto.remindTime || null;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(studyPlans)
      .set(patch)
      .where(and(eq(studyPlans.id, existing.id), eq(studyPlans.userId, userId)))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('计划不存在');
    }

    return this.mapPlan(updated[0]);
  }

  // ===== 5. 删除计划 =====
  async deletePlan(userId: string, planId: string): Promise<void> {
    const existing = await this.findPlanOrThrow(userId, planId);

    const deleted = await this.db
      .delete(studyPlans)
      .where(and(eq(studyPlans.id, existing.id), eq(studyPlans.userId, userId)))
      .returning({ id: studyPlans.id });

    if (deleted.length === 0) {
      throw new NotFoundException('计划不存在');
    }

    this.logger.log(`用户 ${userId} 删除了学习计划: ${planId}`);
  }

  // ===== 6. 激活计划 =====
  async activatePlan(userId: string, planId: string): Promise<void> {
    await this.findPlanOrThrow(userId, planId);

    await this.db.transaction(async (tx) => {
      await tx
        .update(studyPlans)
        .set({ status: 'paused' })
        .where(
          and(
            eq(studyPlans.userId, userId),
            eq(studyPlans.status, 'active'),
          ),
        );

      await tx
        .update(studyPlans)
        .set({ status: 'active' })
        .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)));
    });

    this.logger.log(`用户 ${userId} 激活了学习计划: ${planId}`);
  }

  // ===== 7. 获取今日记录 =====
  async getTodayRecord(userId: string): Promise<PlanRecordItem | null> {
    const currentPlan = await this.getCurrentPlanRow(userId);
    if (!currentPlan) return null;

    const todayStr = this.getTodayDateString();
    const record = await this.getOrCreateTodayRecord(userId, currentPlan.id, todayStr);
    return this.mapRecord(record);
  }

  // ===== 8. 获取日期范围记录 =====
  async getRecords(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlanRecordItem[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate 和 endDate 都是必填的');
    }

    const rows = await this.db
      .select()
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, startDate),
          lt(planRecords.recordDate, this.addDays(endDate, 1)),
        ),
      )
      .orderBy(planRecords.recordDate);

    return rows.map((row) => this.mapRecord(row));
  }

  // ===== 9. 更新任务进度 =====
  async updateTaskProgress(
    userId: string,
    dto: UpdateTaskProgressDto,
  ): Promise<PlanRecordItem> {
    if (!dto.taskType || dto.count == null) {
      throw new BadRequestException('taskType 和 count 都是必填的');
    }

    const currentPlan = await this.getCurrentPlanRow(userId);
    if (!currentPlan) {
      throw new BadRequestException('请先创建学习计划');
    }

    const todayStr = this.getTodayDateString();
    const record = await this.getOrCreateTodayRecord(userId, currentPlan.id, todayStr);

    // 映射 taskType 到 Drizzle 列对象和 DailyTasks 键
    interface ColMapping {
      col: Column;
      dailyKey: TaskTypeMap['key'];
    }

    const columnMap: Record<string, ColMapping> = {
      word: { col: planRecords.wordCompleted, dailyKey: 'wordCount' },
      wordCount: { col: planRecords.wordCompleted, dailyKey: 'wordCount' },
      sentence: { col: planRecords.sentenceCompleted, dailyKey: 'sentenceCount' },
      sentenceCount: { col: planRecords.sentenceCompleted, dailyKey: 'sentenceCount' },
      dictation: { col: planRecords.dictationCompleted, dailyKey: 'dictationCount' },
      dictationCount: { col: planRecords.dictationCompleted, dailyKey: 'dictationCount' },
      phonetic: { col: planRecords.phoneticCompleted, dailyKey: 'phoneticCount' },
      phoneticCount: { col: planRecords.phoneticCompleted, dailyKey: 'phoneticCount' },
      aiQuiz: { col: planRecords.aiQuizCompleted, dailyKey: 'aiQuizCount' },
      aiQuizCount: { col: planRecords.aiQuizCompleted, dailyKey: 'aiQuizCount' },
    };

    const mapping = columnMap[dto.taskType];
    if (!mapping) {
      throw new BadRequestException(`不支持的任务类型: ${dto.taskType}`);
    }

    const dailyTasks = (currentPlan.dailyTasks || {}) as DailyTasks;

    // 计算总任务数（有目标的任务类型数量）
    const totalTasks = TASK_TYPES.filter(
      (t: TaskTypeMap) => {
        const v = dailyTasks[t.key];
        return typeof v === 'number' && v > 0;
      },
    ).length;

    const addCount: number = dto.count;
    const addMinutes: number = dto.studyMinutes ?? 0;

    // 原子更新：累加任务完成数和学习时长
    let updatedRows: (typeof planRecords.$inferSelect)[] = [];
    switch (dto.taskType) {
      case 'word':
      case 'wordCount':
        updatedRows = await this.db
          .update(planRecords)
          .set({
            wordCompleted: sql`${planRecords.wordCompleted} + ${addCount}`,
            studyMinutes: sql`${planRecords.studyMinutes} + ${addMinutes}`,
            updatedAt: new Date(),
          })
          .where(eq(planRecords.id, record.id))
          .returning();
        break;
      case 'sentence':
      case 'sentenceCount':
        updatedRows = await this.db
          .update(planRecords)
          .set({
            sentenceCompleted: sql`${planRecords.sentenceCompleted} + ${addCount}`,
            studyMinutes: sql`${planRecords.studyMinutes} + ${addMinutes}`,
            updatedAt: new Date(),
          })
          .where(eq(planRecords.id, record.id))
          .returning();
        break;
      case 'dictation':
      case 'dictationCount':
        updatedRows = await this.db
          .update(planRecords)
          .set({
            dictationCompleted: sql`${planRecords.dictationCompleted} + ${addCount}`,
            studyMinutes: sql`${planRecords.studyMinutes} + ${addMinutes}`,
            updatedAt: new Date(),
          })
          .where(eq(planRecords.id, record.id))
          .returning();
        break;
      case 'phonetic':
      case 'phoneticCount':
        updatedRows = await this.db
          .update(planRecords)
          .set({
            phoneticCompleted: sql`${planRecords.phoneticCompleted} + ${addCount}`,
            studyMinutes: sql`${planRecords.studyMinutes} + ${addMinutes}`,
            updatedAt: new Date(),
          })
          .where(eq(planRecords.id, record.id))
          .returning();
        break;
      case 'aiQuiz':
      case 'aiQuizCount':
        updatedRows = await this.db
          .update(planRecords)
          .set({
            aiQuizCompleted: sql`${planRecords.aiQuizCompleted} + ${addCount}`,
            studyMinutes: sql`${planRecords.studyMinutes} + ${addMinutes}`,
            updatedAt: new Date(),
          })
          .where(eq(planRecords.id, record.id))
          .returning();
        break;
      default:
        throw new BadRequestException(`不支持的任务类型: ${dto.taskType}`);
    }

    const updatedRecord = updatedRows[0];

    // 重新计算 completed_tasks 和 completion_rate
    const completedTasks = this.countCompletedTasks(updatedRecord, dailyTasks);
    const completionRate: number = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const finalRows = await this.db
      .update(planRecords)
      .set({
        completedTasks,
        totalTasks,
        completionRate: String(completionRate),
      })
      .where(eq(planRecords.id, record.id))
      .returning();

    const finalRecord = finalRows[0];

    return this.mapRecord(finalRecord);
  }

  // ===== 10. 获取统计数据 =====
  async getStats(userId: string): Promise<PlanStatsResponse> {
    const todayStr = this.getTodayDateString();
    const thirtyDaysAgo = this.addDays(todayStr, -29); // 最近30天（含今日）

    // 最近30天记录
    const rows = await this.db
      .select()
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, thirtyDaysAgo),
          lt(planRecords.recordDate, this.addDays(todayStr, 1)),
        ),
      )
      .orderBy(planRecords.recordDate);

    // 构建每日完成率（补全缺失的日期为0）
    const dailyCompletion: { date: string; rate: number }[] = [];
    const recordMap = new Map<string, typeof planRecords.$inferSelect>();
    for (const row of rows) {
      recordMap.set(String(row.recordDate), row);
    }

    for (let i = 0; i < 30; i++) {
      const date = this.addDays(todayStr, -(29 - i));
      const rec = recordMap.get(date);
      const rate = rec ? Number(rec.completionRate) : 0;
      dailyCompletion.push({ date, rate });
    }

    // 本周完成率（最近7天）
    const last7Days = dailyCompletion.slice(-7);
    const weeklyCompletion = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum: number, d) => sum + d.rate, 0) / last7Days.length)
      : 0;

    // 本月完成率（自然月）
    const monthStart = todayStr.slice(0, 7) + '-01';
    const monthRecords = rows.filter(
      (r) => String(r.recordDate) >= monthStart,
    );
    const daysInMonth = this.daysFromStartToToday(monthStart, todayStr);
    const monthlyCompletion = daysInMonth > 0
      ? Math.round(
          monthRecords.reduce((sum: number, r) => sum + Number(r.completionRate), 0) / daysInMonth,
        )
      : 0;

    // 总学习时长
    const totalStudyMinutes = rows.reduce(
      (sum: number, r) => sum + (r.studyMinutes || 0),
      0,
    );

    // 任务分布
    const taskDistribution = [
      { type: '单词学习', count: rows.reduce((s: number, r) => s + (r.wordCompleted || 0), 0) },
      { type: '句子练习', count: rows.reduce((s: number, r) => s + (r.sentenceCompleted || 0), 0) },
      { type: '听写练习', count: rows.reduce((s: number, r) => s + (r.dictationCompleted || 0), 0) },
      { type: '音标学习', count: rows.reduce((s: number, r) => s + (r.phoneticCompleted || 0), 0) },
      { type: 'AI出题', count: rows.reduce((s: number, r) => s + (r.aiQuizCompleted || 0), 0) },
    ].filter((t) => t.count > 0);

    // 连续打卡天数
    const streakDays = await this.calculateStreakDays(userId, todayStr);

    return {
      dailyCompletion,
      weeklyCompletion,
      monthlyCompletion,
      totalStudyMinutes,
      taskDistribution,
      streakDays,
    };
  }

  // ===== 11. AI推荐计划 =====
  async getAiRecommendation(userId: string): Promise<AiPlanRecommendation> {
    const todayStr = this.getTodayDateString();
    const sevenDaysAgo = this.addDays(todayStr, -6);

    const rows = await this.db
      .select()
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, sevenDaysAgo),
          lt(planRecords.recordDate, this.addDays(todayStr, 1)),
        ),
      )
      .orderBy(planRecords.recordDate);

    const currentPlan = await this.getCurrentPlanRow(userId);
    const currentTasks = (currentPlan?.dailyTasks || {}) as DailyTasks;

    // 统计各任务完成率
    const taskStats: Record<string, { target: number; completed: number; rate: number }> = {};
    const activeDays: number = rows.length;
    let totalCompletion: number = 0;
    let totalMinutes: number = 0;

    for (const t of TASK_TYPES) {
      const targetVal = currentTasks[t.key];
      const targetPerDay: number = typeof targetVal === 'number' ? targetVal : 0;
      const totalTarget: number = targetPerDay * Math.max(activeDays, 1);
      let totalCompleted = 0;
      for (const r of rows) {
        totalCompleted += Number(r[t.completedKey]) || 0;
      }
      const rate: number = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
      taskStats[t.key] = { target: targetPerDay, completed: totalCompleted, rate };
    }

    for (const row of rows) {
      totalCompletion += Number(row.completionRate);
      totalMinutes += row.studyMinutes || 0;
    }

    const avgCompletion = activeDays > 0 ? Math.round(totalCompletion / activeDays) : 0;
    const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 30;

    // 找出薄弱点
    const weakPoints: string[] = [];
    const recommendations: string[] = [];

    for (const t of TASK_TYPES) {
      const stat = taskStats[t.key];
      if (stat.target > 0 && stat.rate < 60) {
        weakPoints.push(`${t.label}完成率仅${stat.rate}%，需要加强练习`);
      }
    }

    // 生成推荐配置
    let planName = '智能推荐计划';
    let dailyMinutes = avgDailyMinutes || 30;
    const dailyTasks: DailyTasks = { ...currentTasks };

    // 新用户无历史数据时给默认任务量
    const hasTasks = Object.values(dailyTasks).some(
      (v) => typeof v === 'number' && v > 0,
    );
    if (!hasTasks) {
      dailyTasks.wordCount = 15;
      dailyTasks.sentenceCount = 5;
      dailyTasks.dictationCount = 3;
      dailyTasks.phoneticCount = 5;
      dailyTasks.aiQuizCount = 2;
      dailyMinutes = 30;
    }

    if (avgCompletion < 50) {
      // 轻松计划：减少任务量
      planName = '轻松起步计划';
      dailyMinutes = Math.max(15, Math.round(dailyMinutes * 0.7));
      for (const t of TASK_TYPES) {
        const val = dailyTasks[t.key];
        if (typeof val === 'number' && val > 0) {
          dailyTasks[t.key] = Math.max(5, Math.round(val * 0.6));
        }
      }
      recommendations.push('当前完成率偏低，建议先减少每日任务量，循序渐进建立习惯');
      recommendations.push('从每天15-20分钟开始，坚持比数量更重要');
    } else if (avgCompletion > 90) {
      // 进阶计划：增加任务量
      planName = '进阶提升计划';
      dailyMinutes = Math.round(dailyMinutes * 1.3);
      for (const t of TASK_TYPES) {
        const val = dailyTasks[t.key];
        if (typeof val === 'number' && val > 0) {
          dailyTasks[t.key] = Math.round(val * 1.3);
        }
      }
      recommendations.push('你的表现非常出色！可以适当增加任务量挑战自己');
      recommendations.push('建议尝试更有难度的学习内容，保持进步动力');
    } else {
      // 稳定计划：保持当前节奏
      planName = '稳步前进计划';
      recommendations.push('你的学习节奏很稳定，继续保持！');
    }

    if (weakPoints.length > 0) {
      recommendations.push('针对薄弱环节，建议每天多花10分钟专项练习');
    }

    const expectedGoal = avgCompletion > 80
      ? '预计30天内英语能力将有显著提升'
      : avgCompletion > 50
        ? '坚持21天养成学习习惯，稳步提升英语水平'
        : '先建立学习习惯，再逐步提升难度';

    return {
      planName,
      dailyMinutes,
      dailyTasks,
      recommendations,
      weakPoints,
      expectedGoal,
    };
  }

  // ===== 12. 提醒设置 =====
  async getReminders(userId: string): Promise<PlanReminderItem[]> {
    const rows = await this.db
      .select()
      .from(planReminders)
      .where(eq(planReminders.userId, userId))
      .orderBy(desc(planReminders.createdAt));

    // 如果没有提醒设置，创建一个默认的
    if (rows.length === 0) {
      const defaultReminder = await this.db
        .insert(planReminders)
        .values({
          userId,
          remindTime: '20:00',
          enabled: true,
          reminderType: 'daily',
        })
        .returning();
      return [this.mapReminder(defaultReminder[0])];
    }

    return rows.map((row) => this.mapReminder(row));
  }

  async updateReminder(
    userId: string,
    id: string,
    dto: Partial<Pick<PlanReminderItem, 'remindTime' | 'enabled' | 'reminderType' | 'planId'>>,
  ): Promise<PlanReminderItem> {
    const existing = await this.db
      .select()
      .from(planReminders)
      .where(and(eq(planReminders.id, id), eq(planReminders.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('提醒设置不存在');
    }

    const patch: Partial<typeof planReminders.$inferInsert> = {};
    if (dto.remindTime !== undefined) patch.remindTime = dto.remindTime;
    if (dto.enabled !== undefined) patch.enabled = dto.enabled;
    if (dto.reminderType !== undefined) patch.reminderType = dto.reminderType;
    if (dto.planId !== undefined) patch.planId = dto.planId || null;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(planReminders)
      .set(patch)
      .where(and(eq(planReminders.id, id), eq(planReminders.userId, userId)))
      .returning();

    return this.mapReminder(updated[0]);
  }

  // ===== 私有辅助方法 =====

  private async getCurrentPlanRow(
    userId: string,
  ): Promise<typeof studyPlans.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, 'active')))
      .orderBy(desc(studyPlans.createdAt))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  private async findPlanOrThrow(
    userId: string,
    planId: string,
  ): Promise<typeof studyPlans.$inferSelect> {
    const rows = await this.db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('计划不存在');
    }
    return rows[0];
  }

  private async getOrCreateTodayRecord(
    userId: string,
    planId: string,
    todayStr: string,
  ): Promise<typeof planRecords.$inferSelect> {
    const existing = await this.db
      .select()
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          eq(planRecords.planId, planId),
          eq(planRecords.recordDate, todayStr),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // 查当前计划计算 totalTasks
    const plan = await this.db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.id, planId))
      .limit(1);

    const dailyTasks = (plan[0]?.dailyTasks || {}) as DailyTasks;
    const totalTasks = TASK_TYPES.filter(
      (t: TaskTypeMap) => {
        const v = dailyTasks[t.key];
        return typeof v === 'number' && v > 0;
      },
    ).length;

    const created = await this.db
      .insert(planRecords)
      .values({
        planId,
        userId,
        recordDate: todayStr,
        completedTasks: 0,
        totalTasks,
        completionRate: '0',
        studyMinutes: 0,
        wordCompleted: 0,
        sentenceCompleted: 0,
        dictationCompleted: 0,
        phoneticCompleted: 0,
        aiQuizCompleted: 0,
      })
      .onConflictDoNothing()
      .returning();

    if (created.length > 0) {
      return created[0];
    }

    // 并发情况下可能已创建，重新查询
    const retry = await this.db
      .select()
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          eq(planRecords.planId, planId),
          eq(planRecords.recordDate, todayStr),
        ),
      )
      .limit(1);

    return retry[0];
  }

  private async calculateStreakDays(userId: string, todayStr: string): Promise<number> {
    // 查询最近60天记录，从今日往前数连续完成(>=50%)的天数
    const sixtyDaysAgo = this.addDays(todayStr, -59);
    const rows = await this.db
      .select({ recordDate: planRecords.recordDate, completionRate: planRecords.completionRate })
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, sixtyDaysAgo),
          lt(planRecords.recordDate, this.addDays(todayStr, 1)),
        ),
      )
      .orderBy(desc(planRecords.recordDate));

    const recordMap = new Map<string, number>();
    for (const row of rows) {
      recordMap.set(String(row.recordDate), Number(row.completionRate));
    }

    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const date = this.addDays(todayStr, -i);
      const rate = recordMap.get(date);
      if (rate !== undefined && rate >= 50) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }

  private async calculateWeeklyCompletionRate(
    userId: string,
    todayStr: string,
  ): Promise<number> {
    const sevenDaysAgo = this.addDays(todayStr, -6);
    const rows = await this.db
      .select({ completionRate: planRecords.completionRate })
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, sevenDaysAgo),
          lt(planRecords.recordDate, this.addDays(todayStr, 1)),
        ),
      );

    if (rows.length === 0) return 0;

    const total = rows.reduce((sum: number, r) => sum + Number(r.completionRate), 0);
    // 按7天平均，未记录的天算0
    return Math.round(total / 7);
  }

  private buildTodayTasks(
    currentPlan: StudyPlanItem | null,
    todayRecord: PlanRecordItem | null,
  ): PlanOverview['todayTasks'] {
    if (!currentPlan) return [];

    const tasks: PlanOverview['todayTasks'] = [];
    const dailyTasks = currentPlan.dailyTasks;

    for (const t of TASK_TYPES) {
      const targetVal = dailyTasks[t.key];
      const target: number = typeof targetVal === 'number' ? targetVal : 0;
      if (target <= 0) continue;

      let completed = 0;
      if (todayRecord) {
        completed = todayRecord[t.completedKey] || 0;
      }

      tasks.push({
        type: t.key,
        label: t.label,
        target,
        completed,
        icon: t.icon,
      });
    }

    return tasks;
  }

  private countCompletedTasks(
    record: typeof planRecords.$inferSelect,
    dailyTasks: DailyTasks,
  ): number {
    let count = 0;
    for (const t of TASK_TYPES) {
      const targetVal = dailyTasks[t.key];
      const target: number = typeof targetVal === 'number' ? targetVal : 0;
      if (target <= 0) continue;
      const completed: number = Number(record[t.completedKey]) || 0;
      if (completed >= target) count += 1;
    }
    return count;
  }

  // ===== 日期工具方法 =====

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private daysFromStartToToday(startStr: string, todayStr: string): number {
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(todayStr + 'T00:00:00');
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  // ===== 映射方法 =====

  private mapPlan(row: typeof studyPlans.$inferSelect): StudyPlanItem {
    return {
      id: row.id,
      planName: row.planName,
      planType: row.planType as StudyPlanItem['planType'],
      startDate: String(row.startDate),
      endDate: row.endDate ? String(row.endDate) : null,
      dailyTasks: (row.dailyTasks || {}) as DailyTasks,
      dailyMinutes: row.dailyMinutes ?? 0,
      remindTime: row.remindTime ?? null,
      status: row.status as StudyPlanItem['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapRecord(row: typeof planRecords.$inferSelect): PlanRecordItem {
    return {
      id: row.id,
      planId: row.planId,
      recordDate: String(row.recordDate),
      completedTasks: row.completedTasks ?? 0,
      totalTasks: row.totalTasks ?? 0,
      completionRate: Number(row.completionRate),
      studyMinutes: row.studyMinutes ?? 0,
      wordCompleted: row.wordCompleted ?? 0,
      sentenceCompleted: row.sentenceCompleted ?? 0,
      dictationCompleted: row.dictationCompleted ?? 0,
      phoneticCompleted: row.phoneticCompleted ?? 0,
      aiQuizCompleted: row.aiQuizCompleted ?? 0,
    };
  }

  private mapReminder(row: typeof planReminders.$inferSelect): PlanReminderItem {
    return {
      id: row.id,
      planId: row.planId ?? null,
      remindTime: row.remindTime,
      enabled: row.enabled,
      reminderType: row.reminderType,
    };
  }
}
