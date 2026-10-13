import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { phonetics, phonicsProgress } from '@server/database/schema';
import { asc, sql, count } from 'drizzle-orm';
import type {
  PhoneticItem,
  PhonicsProgressItem,
  PhonicsProgressSummary,
  PhonicsPracticeResult,
} from '@shared/api.interface';

@Injectable()
export class PhonicsService {
  private readonly logger = new Logger(PhonicsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getAllPhonetics(): Promise<PhoneticItem[]> {
    const rows = await this.db
      .select()
      .from(phonetics)
      .orderBy(asc(phonetics.sortOrder));
    return rows.map((row) => this.mapPhonetic(row));
  }

  async getPhoneticById(id: string): Promise<PhoneticItem> {
    const rows = await this.db
      .select()
      .from(phonetics)
      .where(sql`${phonetics.id} = ${id}::uuid`)
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('音标不存在');
    return this.mapPhonetic(rows[0]);
  }

  async getPhoneticsByCategory(category: string): Promise<PhoneticItem[]> {
    const rows = await this.db
      .select()
      .from(phonetics)
      .where(sql`${phonetics.category} = ${category}`)
      .orderBy(asc(phonetics.sortOrder));
    return rows.map((row) => this.mapPhonetic(row));
  }

  async getProgress(userId: string): Promise<PhonicsProgressItem[]> {
    const rows = await this.db
      .select()
      .from(phonicsProgress)
      .where(sql`(${phonicsProgress.userId}).user_id = ${userId}`);
    return rows.map((row) => this.mapProgress(row));
  }

  async getProgressSummary(userId: string): Promise<PhonicsProgressSummary> {
    const [phoneticCountResult, progressRows] = await Promise.all([
      this.db.select({ count: count() }).from(phonetics),
      this.db
        .select({
          learned: phonicsProgress.learned,
          practiceCount: phonicsProgress.practiceCount,
          correctCount: phonicsProgress.correctCount,
        })
        .from(phonicsProgress)
        .where(sql`(${phonicsProgress.userId}).user_id = ${userId}`),
    ]);

    const totalPhonetics = Number(phoneticCountResult[0]?.count || 0);
    let learnedCount = 0;
    let totalPractice = 0;
    let totalCorrect = 0;
    for (const row of progressRows) {
      if (row.learned) learnedCount += 1;
      totalPractice += row.practiceCount;
      totalCorrect += row.correctCount;
    }
    const accuracy = totalPractice > 0 ? Math.round((totalCorrect / totalPractice) * 100) : 0;

    return { totalPhonetics, learnedCount, totalPractice, totalCorrect, accuracy };
  }

  async markLearned(userId: string, phoneticId: string): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO ${phonicsProgress} (user_id, phonetic_id, learned)
      VALUES (ROW(${userId})::user_profile, ${phoneticId}::uuid, true)
      ON CONFLICT (((user_id).user_id), phonetic_id) DO UPDATE SET
        learned = true,
        _updated_at = CURRENT_TIMESTAMP
    `);
  }

  async recordPractice(userId: string, results: PhonicsPracticeResult[]): Promise<void> {
    for (const result of results) {
      const addCorrect = result.isCorrect ? 1 : 0;
      await this.db.execute(sql`
        INSERT INTO ${phonicsProgress} (user_id, phonetic_id, learned, practice_count, correct_count, last_practice_time)
        VALUES (ROW(${userId})::user_profile, ${result.phoneticId}::uuid, true, 1, ${addCorrect}, CURRENT_TIMESTAMP)
        ON CONFLICT (((user_id).user_id), phonetic_id) DO UPDATE SET
          practice_count = ${phonicsProgress.practiceCount} + 1,
          correct_count = ${phonicsProgress.correctCount} + ${addCorrect},
          last_practice_time = CURRENT_TIMESTAMP,
          learned = true,
          _updated_at = CURRENT_TIMESTAMP
      `);
    }
  }

  private mapPhonetic(row: typeof phonetics.$inferSelect): PhoneticItem {
    return {
      id: row.id,
      symbol: row.symbol,
      name: row.name,
      type: row.type,
      category: row.category,
      pronunciationMethod: row.pronunciationMethod || '',
      mouthShape: row.mouthShape || '',
      examples: (row.examples || []) as PhoneticItem['examples'],
      sentences: (row.sentences || []) as PhoneticItem['sentences'],
      similarSounds: row.similarSounds || [],
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      mouthDiagramSvg: row.mouthDiagramSvg || undefined,
      frontMouthDiagramSvg: row.frontMouthDiagramSvg || undefined,
      tonguePosition: row.tonguePosition || undefined,
      lipShape: row.lipShape || undefined,
      vocalCordVibration: row.vocalCordVibration ?? undefined,
      pronunciationType: row.pronunciationType || undefined,
    };
  }

  private mapProgress(row: typeof phonicsProgress.$inferSelect): PhonicsProgressItem {
    return {
      id: row.id,
      phoneticId: row.phoneticId,
      learned: row.learned,
      practiceCount: row.practiceCount,
      correctCount: row.correctCount,
      lastPracticeTime: row.lastPracticeTime ? row.lastPracticeTime.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
