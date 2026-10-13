import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, gte, lt, desc, sum, sql } from 'drizzle-orm';
import { userUsageLogs, parentControls, usageReports } from '@server/database/schema';
import type {
  AntiAddictionStatus,
  ParentControls,
  UsageReport,
  UsageDailyItem,
  UsageModuleItem,
} from '@shared/api.interface';
import * as crypto from 'crypto';

const AGE_LIMITS: Record<string, { weekday: number; weekend: number; session: number }> = {
  child: { weekday: 60, weekend: 120, session: 30 },
  teen: { weekday: 90, weekend: 180, session: 45 },
  adult: { weekday: 0, weekend: 0, session: 0 },
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isNightTime(now: Date, start: string, end: string): boolean {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin > endMin) {
    return current >= startMin || current < endMin;
  }
  return current >= startMin && current < endMin;
}

@Injectable()
export class AntiAddictionService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private async getControls(userId: string): Promise<{
    ageGroup: string;
    dailyLimitWeekday: number;
    dailyLimitWeekend: number;
    sessionLimit: number;
    nightModeStart: string;
    nightModeEnd: string;
    parentPassword?: string;
  }> {
    const rows = await this.db
      .select({
        ageGroup: parentControls.ageGroup,
        dailyLimitWeekday: parentControls.dailyLimitWeekday,
        dailyLimitWeekend: parentControls.dailyLimitWeekend,
        sessionLimit: parentControls.sessionLimit,
        nightModeStart: parentControls.nightModeStart,
        nightModeEnd: parentControls.nightModeEnd,
        parentPassword: parentControls.parentPassword,
      })
      .from(parentControls)
      .where(eq(parentControls.userId, userId))
      .limit(1);

    if (rows.length > 0 && rows[0]) {
      return rows[0] as {
        ageGroup: string;
        dailyLimitWeekday: number;
        dailyLimitWeekend: number;
        sessionLimit: number;
        nightModeStart: string;
        nightModeEnd: string;
        parentPassword?: string;
      };
    }
    return {
      ageGroup: 'adult',
      dailyLimitWeekday: 0,
      dailyLimitWeekend: 0,
      sessionLimit: 0,
      nightModeStart: '22:00',
      nightModeEnd: '06:00',
    };
  }

  async getStatus(userId: string): Promise<AntiAddictionStatus> {
    const controls = await this.getControls(userId);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const todayRows = await this.db
      .select({ total: sum(userUsageLogs.duration) })
      .from(userUsageLogs)
      .where(and(eq(userUsageLogs.userId, userId), eq(userUsageLogs.logDate, todayStr)));

    let todayTotal = 0;
    if (todayRows[0]?.total) {
      todayTotal = Number(todayRows[0].total);
    }

    const sessionRows = await this.db
      .select({
        id: userUsageLogs.id,
        startTime: userUsageLogs.startTime,
      })
      .from(userUsageLogs)
      .where(and(eq(userUsageLogs.userId, userId), eq(userUsageLogs.logDate, todayStr)))
      .orderBy(desc(userUsageLogs.startTime))
      .limit(1);

    let sessionMinutes = 0;
    if (sessionRows[0]?.startTime) {
      const start = new Date(sessionRows[0].startTime as unknown as string);
      sessionMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    }

    const weekend = isWeekend(now);
    const dailyLimit = weekend ? controls.dailyLimitWeekend : controls.dailyLimitWeekday;
    const sessionLimit = controls.sessionLimit;
    const isNight = controls.ageGroup !== 'adult' &&
      isNightTime(now, controls.nightModeStart, controls.nightModeEnd);

    let isLocked = false;
    let lockReason: 'daily_limit' | 'session_limit' | 'night_mode' | undefined;
    let lockEndTime: string | undefined;

    if (isNight) {
      isLocked = true;
      lockReason = 'night_mode';
      const [eh, em] = controls.nightModeEnd.split(':').map(Number);
      const end = new Date(now);
      end.setHours(eh, em, 0, 0);
      if (end <= now) end.setDate(end.getDate() + 1);
      lockEndTime = end.toISOString();
    } else if (dailyLimit > 0 && todayTotal >= dailyLimit) {
      isLocked = true;
      lockReason = 'daily_limit';
    } else if (sessionLimit > 0 && sessionMinutes >= sessionLimit) {
      isLocked = true;
      lockReason = 'session_limit';
    }

    const warnAtMinutes = dailyLimit > 0 ? Math.floor(dailyLimit * 0.8) : 0;

    return {
      ageGroup: controls.ageGroup as 'child' | 'teen' | 'adult',
      todayTotalMinutes: todayTotal,
      todayRemainingMinutes: dailyLimit > 0 ? Math.max(0, dailyLimit - todayTotal) : -1,
      currentSessionMinutes: sessionMinutes,
      dailyLimitMinutes: dailyLimit,
      sessionLimitMinutes: sessionLimit,
      isNightMode: isNight,
      nightModeStart: controls.nightModeStart,
      nightModeEnd: controls.nightModeEnd,
      isLocked,
      lockReason,
      lockEndTime,
      warnAtMinutes,
    };
  }

  async startSession(
    userId: string,
    moduleName?: string,
  ): Promise<{ sessionId: string; startTime: string }> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const inserted = await this.db
      .insert(userUsageLogs)
      .values({
        userId,
        logDate: todayStr,
        startTime: now,
        module: moduleName ?? 'app',
        duration: 0,
      })
      .returning({ id: userUsageLogs.id, startTime: userUsageLogs.startTime });

    const row = inserted[0];
    return {
      sessionId: row.id,
      startTime: (row.startTime as unknown as Date).toISOString(),
    };
  }

  async endSession(userId: string, sessionId: string): Promise<number> {
    const now = new Date();
    const row = await this.db
      .select({
        startTime: userUsageLogs.startTime,
        userId: userUsageLogs.userId,
      })
      .from(userUsageLogs)
      .where(eq(userUsageLogs.id, sessionId))
      .limit(1);

    if (!row[0] || row[0].userId !== userId) {
      return 0;
    }
    const start = new Date(row[0].startTime as unknown as string);
    const duration = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 60000));

    await this.db
      .update(userUsageLogs)
      .set({
        endTime: now,
        duration,
        updatedAt: now,
      })
      .where(eq(userUsageLogs.id, sessionId));

    return duration;
  }

  async heartbeat(userId: string, sessionId: string): Promise<number> {
    const status = await this.getStatus(userId);
    if (status.isLocked) {
      return 0;
    }
    const remaining = status.dailyLimitMinutes > 0
      ? status.todayRemainingMinutes
      : 1440;
    return remaining;
  }

  async getParentControls(userId: string): Promise<ParentControls> {
    const controls = await this.getControls(userId);
    return {
      id: userId,
      userId,
      ageGroup: controls.ageGroup,
      dailyLimitWeekday: controls.dailyLimitWeekday,
      dailyLimitWeekend: controls.dailyLimitWeekend,
      sessionLimit: controls.sessionLimit,
      nightModeStart: controls.nightModeStart,
      nightModeEnd: controls.nightModeEnd,
      hasParentPassword: Boolean(controls.parentPassword),
    };
  }

  async upsertParentControls(
    userId: string,
    dto: Record<string, unknown>,
  ): Promise<ParentControls> {
    const existing = await this.db
      .select()
      .from(parentControls)
      .where(eq(parentControls.userId, userId))
      .limit(1);

    const patch: Record<string, unknown> = {};
    if (dto.ageGroup !== undefined) patch.ageGroup = dto.ageGroup;
    if (dto.dailyLimitWeekday !== undefined) patch.dailyLimitWeekday = dto.dailyLimitWeekday;
    if (dto.dailyLimitWeekend !== undefined) patch.dailyLimitWeekend = dto.dailyLimitWeekend;
    if (dto.sessionLimit !== undefined) patch.sessionLimit = dto.sessionLimit;
    if (dto.nightModeStart !== undefined) patch.nightModeStart = dto.nightModeStart;
    if (dto.nightModeEnd !== undefined) patch.nightModeEnd = dto.nightModeEnd;
    if (dto.parentUserId !== undefined) patch.parentUserId = dto.parentUserId;

    if (dto.newPassword) {
      if (existing[0]?.parentPassword && dto.oldPassword) {
        const oldHash = hashPassword(dto.oldPassword as string);
        if (oldHash !== existing[0].parentPassword) {
          throw new ForbiddenException('原密码错误');
        }
      }
      patch.parentPassword = hashPassword(dto.newPassword as string);
    }

    if (existing.length > 0) {
      patch._updatedAt = new Date();
      await this.db.update(parentControls).set(patch).where(eq(parentControls.userId, userId));
    } else {
      const defaults = AGE_LIMITS[String(dto.ageGroup ?? 'adult')];
      await this.db.insert(parentControls).values({
        userId,
        ageGroup: String(dto.ageGroup ?? 'adult'),
        dailyLimitWeekday: (dto.dailyLimitWeekday as number) ?? defaults.weekday,
        dailyLimitWeekend: (dto.dailyLimitWeekend as number) ?? defaults.weekend,
        sessionLimit: (dto.sessionLimit as number) ?? defaults.session,
        nightModeStart: String(dto.nightModeStart ?? '22:00'),
        nightModeEnd: String(dto.nightModeEnd ?? '06:00'),
        parentPassword: patch.parentPassword as string | undefined,
        parentUserId: (dto.parentUserId as string) ?? undefined,
      });
    }

    return this.getParentControls(userId);
  }

  async verifyParentPassword(userId: string, password: string): Promise<boolean> {
    const controls = await this.getControls(userId);
    if (!controls.parentPassword) return false;
    return hashPassword(password) === controls.parentPassword;
  }

  async extendUsage(userId: string, password: string, extendMinutes: number): Promise<number> {
    const valid = await this.verifyParentPassword(userId, password);
    if (!valid) {
      throw new ForbiddenException('家长密码错误');
    }
    const actualMinutes = Math.min(extendMinutes, 30);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const rows = await this.db
      .select()
      .from(parentControls)
      .where(eq(parentControls.userId, userId))
      .limit(1);

    const weekend = isWeekend(now);
    const key = weekend ? 'dailyLimitWeekend' : 'dailyLimitWeekday';
    if (rows[0]) {
      const currentLimit = Number(rows[0][key]) || 0;
      await this.db
        .update(parentControls)
        .set({ [key]: currentLimit + actualMinutes, updatedAt: now })
        .where(eq(parentControls.userId, userId));
    }

    return actualMinutes;
  }

  async getReport(userId: string, type: 'weekly' | 'monthly'): Promise<UsageReport> {
    const now = new Date();
    const days = type === 'weekly' ? 7 : 30;
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(end.getDate() - days + 1);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = new Date(end.getTime() + 86400000).toISOString().slice(0, 10);

    const rows = await this.db
      .select({
        logDate: userUsageLogs.logDate,
        module: userUsageLogs.module,
        duration: userUsageLogs.duration,
      })
      .from(userUsageLogs)
      .where(
        and(
          eq(userUsageLogs.userId, userId),
          gte(userUsageLogs.logDate, startStr),
          lt(userUsageLogs.logDate, endStr),
        ),
      );

    const dailyMap = new Map<string, number>();
    const moduleMap = new Map<string, number>();
    let total = 0;

    for (let i = 0; i < days; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      dailyMap.set(ds, 0);
    }

    for (const row of rows) {
      const dateStr = String(row.logDate);
      const dur = Number(row.duration) || 0;
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + dur);
      const mod = row.module || 'app';
      moduleMap.set(mod, (moduleMap.get(mod) || 0) + dur);
      total += dur;
    }

    const dailyData: UsageDailyItem[] = Array.from(dailyMap.entries()).map(
      ([date, durationMinutes]) => ({ date, durationMinutes }),
    );
    const moduleData: UsageModuleItem[] = Array.from(moduleMap.entries())
      .map(([mod, durationMinutes]) => ({ module: mod, durationMinutes }))
      .sort((a, b) => b.durationMinutes - a.durationMinutes);

    const reportDateStr = now.toISOString().slice(0, 10);
    const existing = await this.db
      .select({ id: usageReports.id })
      .from(usageReports)
      .where(
        and(
          eq(usageReports.userId, userId),
          eq(usageReports.reportType, type),
          eq(usageReports.reportDate, reportDateStr),
        ),
      )
      .limit(1);

    let reportId: string;
    if (existing[0]?.id) {
      reportId = existing[0].id;
      await this.db
        .update(usageReports)
        .set({
          totalDuration: total,
          dailyData: dailyData as unknown as Record<string, unknown>[],
          moduleData: moduleData as unknown as Record<string, unknown>[],
        })
        .where(eq(usageReports.id, reportId));
    } else {
      const inserted = await this.db
        .insert(usageReports)
        .values({
          userId,
          reportType: type,
          reportDate: reportDateStr,
          totalDuration: total,
          dailyData: dailyData as unknown as Record<string, unknown>[],
          moduleData: moduleData as unknown as Record<string, unknown>[],
        })
        .returning({ id: usageReports.id });
      reportId = inserted[0].id;
    }

    return {
      id: reportId,
      reportType: type,
      reportDate: reportDateStr,
      totalDuration: total,
      dailyData,
      moduleData,
      createdAt: now.toISOString(),
    };
  }

  async getLogs(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Array<{ date: string; durationMinutes: number; module?: string }>> {
    const rows = await this.db
      .select({
        logDate: userUsageLogs.logDate,
        module: userUsageLogs.module,
        duration: userUsageLogs.duration,
      })
      .from(userUsageLogs)
      .where(
        and(
          eq(userUsageLogs.userId, userId),
          gte(userUsageLogs.logDate, startDate),
          lt(userUsageLogs.logDate, new Date(new Date(endDate).getTime() + 86400000).toISOString().slice(0, 10)),
        ),
      );

    return rows.map((row) => ({
      date: String(row.logDate),
      durationMinutes: Number(row.duration) || 0,
      module: row.module || undefined,
    }));
  }
}
