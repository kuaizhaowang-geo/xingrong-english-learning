import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { asc, eq, and, sql, count } from 'drizzle-orm';
import {
  preschoolLetters,
  preschoolWords,
  preschoolPhonics,
  preschoolSentences,
  preschoolSongs,
  preschoolProgress,
} from '@server/database/schema';

const GAMES_TOTAL_ITEMS = 6;

export interface UpsertProgressDto {
  module: string;
  contentId: string;
  mode: string;
  status?: string;
  stars?: number;
  score?: number;
  correctCount?: number;
  totalCount?: number;
  completed?: boolean;
}

export interface ProgressSummaryResponse {
  totalStars: number;
  modules: {
    [moduleKey: string]: {
      totalItems: number;
      completedItems: number;
      stars: number;
      progressPercent: number;
    };
  };
}

const WORD_CATEGORIES = [
  { value: 'animals', label: '动物', emoji: '🐾', color: '#22c55e' },
  { value: 'colors', label: '颜色', emoji: '🎨', color: '#ec4899' },
  { value: 'numbers', label: '数字', emoji: '🔢', color: '#3b82f6' },
  { value: 'fruits', label: '水果', emoji: '🍎', color: '#ef4444' },
  { value: 'vegetables', label: '蔬菜', emoji: '🥬', color: '#84cc16' },
  { value: 'body', label: '身体', emoji: '🧒', color: '#f97316' },
  { value: 'family', label: '家庭', emoji: '👨‍👩‍👧‍👦', color: '#eab308' },
  { value: 'food', label: '食物', emoji: '🍽️', color: '#f59e0b' },
  { value: 'clothes', label: '衣物', emoji: '👕', color: '#8b5cf6' },
  { value: 'transportation', label: '交通工具', emoji: '🚗', color: '#06b6d4' },
  { value: 'weather', label: '天气', emoji: '☀️', color: '#facc15' },
  { value: 'school', label: '学校', emoji: '🏫', color: '#6366f1' },
];

const SENTENCE_CATEGORIES = [
  { value: 'greetings', label: '问候', emoji: '👋', color: '#22c55e' },
  { value: 'self_intro', label: '自我介绍', emoji: '🙋', color: '#3b82f6' },
  { value: 'family', label: '家庭', emoji: '👨‍👩‍👧', color: '#eab308' },
  { value: 'daily', label: '日常活动', emoji: '☀️', color: '#f97316' },
  { value: 'requests', label: '请求与感谢', emoji: '🙏', color: '#8b5cf6' },
  { value: 'asking', label: '询问', emoji: '❓', color: '#06b6d4' },
  { value: 'likes', label: '喜欢与不喜欢', emoji: '❤️', color: '#ec4899' },
  { value: 'abilities', label: '能力', emoji: '💪', color: '#10b981' },
];

const MODULES = [
  {
    key: 'alphabet',
    title: '字母乐园',
    subtitle: '认识26个英文字母',
    emoji: '🔤',
    color: 'from-pink-400 to-rose-500',
    bgColor: '#FDF2F8',
  },
  {
    key: 'phonics',
    title: '自然拼读',
    subtitle: 'Phonics 入门',
    emoji: '🔊',
    color: 'from-blue-400 to-indigo-500',
    bgColor: '#EFF6FF',
  },
  {
    key: 'words',
    title: '单词世界',
    subtitle: '主题单词学习',
    emoji: '📚',
    color: 'from-green-400 to-emerald-500',
    bgColor: '#ECFDF5',
  },
  {
    key: 'sentences',
    title: '句子城堡',
    subtitle: '简单日常句子',
    emoji: '🏰',
    color: 'from-orange-400 to-amber-500',
    bgColor: '#FFF7ED',
  },
  {
    key: 'songs',
    title: '儿歌天地',
    subtitle: '英文儿歌学唱',
    emoji: '🎵',
    color: 'from-purple-400 to-fuchsia-500',
    bgColor: '#FAF5FF',
  },
  {
    key: 'games',
    title: '游戏乐园',
    subtitle: '趣味英语小游戏',
    emoji: '🎮',
    color: 'from-cyan-400 to-blue-500',
    bgColor: '#ECFEFF',
  },
];

@Injectable()
export class PreschoolService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  getModules() {
    return MODULES;
  }

  async getLetters() {
    return this.db
      .select()
      .from(preschoolLetters)
      .orderBy(asc(preschoolLetters.sortOrder));
  }

  async getLetter(letter: string) {
    const rows = await this.db
      .select()
      .from(preschoolLetters)
      .where(eq(preschoolLetters.letter, letter))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('字母不存在');
    return rows[0];
  }

  getWordCategories() {
    return WORD_CATEGORIES;
  }

  async getWords(category?: string) {
    if (category) {
      return this.db
        .select()
        .from(preschoolWords)
        .where(eq(preschoolWords.category, category))
        .orderBy(asc(preschoolWords.sortOrder));
    }
    return this.db
      .select()
      .from(preschoolWords)
      .orderBy(asc(preschoolWords.category), asc(preschoolWords.sortOrder));
  }

  async getPhonicsLessons() {
    return this.db
      .select()
      .from(preschoolPhonics)
      .orderBy(asc(preschoolPhonics.sortOrder));
  }

  async getPhonicsLesson(lessonNo: number) {
    const rows = await this.db
      .select()
      .from(preschoolPhonics)
      .where(eq(preschoolPhonics.lessonNo, lessonNo))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('课程不存在');
    return rows[0];
  }

  getSentenceCategories() {
    return SENTENCE_CATEGORIES;
  }

  async getSentences(category?: string) {
    if (category) {
      return this.db
        .select()
        .from(preschoolSentences)
        .where(eq(preschoolSentences.category, category))
        .orderBy(asc(preschoolSentences.sortOrder));
    }
    return this.db
      .select()
      .from(preschoolSentences)
      .orderBy(asc(preschoolSentences.category), asc(preschoolSentences.sortOrder));
  }

  async getSongs() {
    return this.db
      .select({
        id: preschoolSongs.id,
        title: preschoolSongs.title,
        titleCn: preschoolSongs.titleCn,
        keyWords: preschoolSongs.keyWords,
        sortOrder: preschoolSongs.sortOrder,
        audioUrl: preschoolSongs.audioUrl,
      })
      .from(preschoolSongs)
      .orderBy(asc(preschoolSongs.sortOrder));
  }

  async getSong(id: string) {
    const rows = await this.db
      .select()
      .from(preschoolSongs)
      .where(eq(preschoolSongs.id, id))
      .limit(1);
    if (rows.length === 0) throw new NotFoundException('儿歌不存在');
    return rows[0];
  }

  // ===== Progress =====

  async getProgress(userId: string, module?: string) {
    const conditions = [eq(preschoolProgress.userId, userId)];
    if (module) {
      conditions.push(eq(preschoolProgress.module, module));
    }
    return this.db
      .select()
      .from(preschoolProgress)
      .where(and(...conditions));
  }

  async getProgressSummary(userId: string): Promise<ProgressSummaryResponse> {
    const allModules = ['alphabet', 'phonics', 'words', 'sentences', 'songs', 'games'];

    // Count total items per module from content tables
    const [
      alphabetTotal,
      phonicsTotal,
      wordsTotal,
      sentencesTotal,
      songsTotal,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(preschoolLetters),
      this.db.select({ count: count() }).from(preschoolPhonics),
      this.db.select({ count: count() }).from(preschoolWords),
      this.db.select({ count: count() }).from(preschoolSentences),
      this.db.select({ count: count() }).from(preschoolSongs),
    ]);

    const totalItemsMap: Record<string, number> = {
      alphabet: Number(alphabetTotal[0]?.count ?? 0),
      phonics: Number(phonicsTotal[0]?.count ?? 0),
      words: Number(wordsTotal[0]?.count ?? 0),
      sentences: Number(sentencesTotal[0]?.count ?? 0),
      songs: Number(songsTotal[0]?.count ?? 0),
      games: GAMES_TOTAL_ITEMS,
    };

    // Aggregate user progress: completed unique content_ids per module + total stars
    const moduleStats = await this.db
      .select({
        module: preschoolProgress.module,
        completedItems: sql<number>`count(distinct ${preschoolProgress.contentId}) filter (where ${preschoolProgress.status} = 'completed')`,
        stars: sql<number>`coalesce(sum(${preschoolProgress.stars}), 0)`,
      })
      .from(preschoolProgress)
      .where(eq(preschoolProgress.userId, userId))
      .groupBy(preschoolProgress.module);

    const statsByModule = new Map<string, { completedItems: number; stars: number }>();
    for (const s of moduleStats) {
      statsByModule.set(s.module, {
        completedItems: Number(s.completedItems),
        stars: Number(s.stars),
      });
    }

    const modules: ProgressSummaryResponse['modules'] = {};
    let totalStars = 0;
    for (const mod of allModules) {
      const stats = statsByModule.get(mod) ?? { completedItems: 0, stars: 0 };
      const totalItems = totalItemsMap[mod] ?? 0;
      const progressPercent = totalItems > 0
        ? Math.floor((stats.completedItems / totalItems) * 100)
        : 0;
      modules[mod] = {
        totalItems,
        completedItems: stats.completedItems,
        stars: stats.stars,
        progressPercent,
      };
      totalStars += stats.stars;
    }

    return { totalStars, modules };
  }

  async upsertProgress(userId: string, dto: UpsertProgressDto) {
    if (!dto.module || !dto.contentId || !dto.mode) {
      throw new BadRequestException('module, contentId and mode are required');
    }

    const existingRows = await this.db
      .select()
      .from(preschoolProgress)
      .where(
        and(
          eq(preschoolProgress.userId, userId),
          eq(preschoolProgress.module, dto.module),
          eq(preschoolProgress.contentId, dto.contentId),
          eq(preschoolProgress.mode, dto.mode),
        ),
      )
      .limit(1);

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      const patch: {
        status?: string;
        stars?: number;
        score?: number;
        correctCount?: number;
        totalCount?: number;
        attempts?: number;
        completedAt?: Date | null;
      } = {};

      if (dto.status !== undefined) patch.status = dto.status;
      if (dto.stars !== undefined) {
        patch.stars = Math.max(existing.stars, dto.stars);
      }
      if (dto.score !== undefined) {
        patch.score = Math.max(existing.score, dto.score);
      }
      if (dto.correctCount !== undefined) {
        patch.correctCount = dto.correctCount;
      }
      if (dto.totalCount !== undefined) {
        patch.totalCount = dto.totalCount;
      }
      patch.attempts = existing.attempts + 1;

      if (dto.completed === true) {
        patch.status = 'completed';
        patch.completedAt = existing.completedAt ?? new Date();
      }

      const updated = await this.db
        .update(preschoolProgress)
        .set(patch)
        .where(eq(preschoolProgress.id, existing.id))
        .returning();
      return updated[0];
    }

    const newRecord = await this.db
      .insert(preschoolProgress)
      .values({
        userId,
        module: dto.module,
        contentId: dto.contentId,
        mode: dto.mode,
        status: dto.completed ? 'completed' : (dto.status ?? 'learning'),
        stars: dto.stars ?? 0,
        score: dto.score ?? 0,
        correctCount: dto.correctCount ?? 0,
        totalCount: dto.totalCount ?? 0,
        attempts: 1,
        completedAt: dto.completed ? new Date() : null,
      })
      .returning();
    return newRecord[0];
  }

  async batchUpsertProgress(userId: string, records: UpsertProgressDto[]) {
    if (!Array.isArray(records)) {
      throw new BadRequestException('records must be an array');
    }
    let updated = 0;
    for (const record of records) {
      await this.upsertProgress(userId, record);
      updated += 1;
    }
    return { updated };
  }
}
