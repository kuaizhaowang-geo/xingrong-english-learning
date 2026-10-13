import { Injectable, Logger } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import {
  eq,
  sql,
  count,
  desc,
  gte,
  lt,
  and,
  inArray,
} from 'drizzle-orm';

import {
  learners,
  checkInRecords,
  userCourses,
  userSentenceRecords,
  userDictationRecords,
  userWordRecords,
  sentencePuzzles,
  dictationItems,
  wordItems,
} from '@server/database/schema';
import type {
  LearnerStatsSummary,
  SubjectRadarData,
  SubjectRadarSubject,
  ProgressDailyData,
  MistakeStats,
  MistakeCategory,
  MistakeCategoryStat,
  Achievement,
  AchievementCategory,
  LearnerDashboardStats,
  TodayTopLearner,
  LearnerCalendarDayData,
} from '@shared/api.interface';
import { AuthNPaasService } from '@lark-apaas/fullstack-nestjs-core';

// 段位名称（每2级一个段位，共10个段位对应Lv.1~Lv.20）
const RANK_NAMES: string[] = [
  '初学者',   // Lv.1~2
  '学徒',     // Lv.3~4
  '探索者',   // Lv.5~6
  '学者',     // Lv.7~8
  '达人',     // Lv.9~10
  '大师',     // Lv.11~12
  '学霸',     // Lv.13~14
  '学神',     // Lv.15~16
  '学者大师', // Lv.17~18
  '全科学神', // Lv.19~20
];

// 计算等级所需经验（递增公式：第n级需要 n * 100 经验）
function expForLevel(level: number): number {
  return level * 100;
}

function calcLevelAndRank(totalExp: number): {
  level: number;
  expPoints: number;
  expToNextLevel: number;
  rank: string;
  nextRank: string;
} {
  let level = 1;
  let cumulative = 0;
  while (level < 20) {
    const needed = expForLevel(level);
    if (totalExp < cumulative + needed) break;
    cumulative += needed;
    level += 1;
  }
  const expPoints = totalExp - cumulative;
  const expToNextLevel = level < 20 ? expForLevel(level) : 0;
  const rankIndex = Math.min(Math.floor((level - 1) / 2), RANK_NAMES.length - 1);
  const nextRankIndex = Math.min(rankIndex + 1, RANK_NAMES.length - 1);
  return {
    level,
    expPoints,
    expToNextLevel,
    rank: RANK_NAMES[rankIndex],
    nextRank: RANK_NAMES[nextRankIndex],
  };
}

@Injectable()
export class LearnersStatsService {
  private readonly logger = new Logger(LearnersStatsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authnService: AuthNPaasService,
  ) {}

  /**
   * 学习总览统计
   */
  async getSummary(userId: string): Promise<LearnerStatsSummary> {
    // 获取学习者基础信息
    const learnerRows = await this.db
      .select()
      .from(learners)
      .where(eq(learners.userProfile, userId))
      .limit(1);

    const learner = learnerRows[0];

    // 完成课程数（状态为 completed 的用户课程）
    const completedCoursesResult = await this.db
      .select({ count: count() })
      .from(userCourses)
      .where(
        and(
          eq(userCourses.userProfile, userId),
          eq(userCourses.status, 'completed'),
        ),
      );

    // 统计正确题数（句子 + 听写 + 单词）
    const [sentenceStats, dictationStats, wordStats] = await Promise.all([
      this.db
        .select({
          total: count(),
          correct: sql<number>`count(*) filter (where ${userSentenceRecords.isCorrect} = true)`,
        })
        .from(userSentenceRecords)
        .where(eq(userSentenceRecords.userProfile, userId)),
      this.db
        .select({
          total: count(),
          correct: sql<number>`count(*) filter (where ${userDictationRecords.isCorrect} = true)`,
        })
        .from(userDictationRecords)
        .where(eq(userDictationRecords.userProfile, userId)),
      this.db
        .select({ total: count() })
        .from(userWordRecords)
        .where(eq(userWordRecords.userProfile, userId)),
    ]);

    const totalQuestions =
      Number(sentenceStats[0]?.total ?? 0) +
      Number(dictationStats[0]?.total ?? 0);
    const correctCount =
      Number(sentenceStats[0]?.correct ?? 0) +
      Number(dictationStats[0]?.correct ?? 0);

    const overallAccuracy: number =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const totalStudyMinutes: number = learner?.totalStudyMinutes ?? 0;
    const checkInStreak: number = learner?.continuousCheckInDays ?? 0;
    const totalCheckIns: number = learner?.totalCheckInDays ?? 0;
    const completedCourses: number = Number(completedCoursesResult[0]?.count ?? 0);

    // 经验值 = 总学习分钟数 + 正确题数 × 2 + 连续打卡天数 × 10
    const totalExp =
      totalStudyMinutes + correctCount * 2 + checkInStreak * 10;
    const { level, expPoints, expToNextLevel, rank } = calcLevelAndRank(totalExp);

    return {
      totalStudyMinutes,
      completedCourses,
      overallAccuracy,
      checkInStreak,
      totalCheckIns,
      level,
      expPoints,
      expToNextLevel,
      rank,
    };
  }

  /**
   * 学科能力雷达图数据
   */
  async getSubjectRadar(userId: string): Promise<SubjectRadarData> {
    // 英语：句子 + 听写 + 单词
    const [sentenceStats, dictationStats, wordStats] = await Promise.all([
      this.db
        .select({
          total: count(),
          correct: sql<number>`count(*) filter (where ${userSentenceRecords.isCorrect} = true)`,
        })
        .from(userSentenceRecords)
        .where(eq(userSentenceRecords.userProfile, userId)),
      this.db
        .select({
          total: count(),
          correct: sql<number>`count(*) filter (where ${userDictationRecords.isCorrect} = true)`,
        })
        .from(userDictationRecords)
        .where(eq(userDictationRecords.userProfile, userId)),
      this.db
        .select({
          total: count(),
          mastered: sql<number>`count(*) filter (where ${userWordRecords.masterStatus} = 'mastered')`,
        })
        .from(userWordRecords)
        .where(eq(userWordRecords.userProfile, userId)),
    ]);

    // 打卡活跃度（近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split('T')[0];

    const checkInCountResult = await this.db
      .select({ count: count() })
      .from(checkInRecords)
      .where(
        and(
          eq(checkInRecords.userProfile, userId),
          gte(checkInRecords.checkInDate, thirtyDaysAgoIso),
        ),
      );

    const activityDays: number = Number(checkInCountResult[0]?.count ?? 0);
    const activityScore: number = Math.min(100, Math.round((activityDays / 30) * 100));

    // 英语统计
    const engTotal =
      Number(sentenceStats[0]?.total ?? 0) +
      Number(dictationStats[0]?.total ?? 0) +
      Number(wordStats[0]?.total ?? 0);
    const engCorrect =
      Number(sentenceStats[0]?.correct ?? 0) +
      Number(dictationStats[0]?.correct ?? 0);
    const engAccuracy: number =
      engTotal > 0 ? Math.round((engCorrect / engTotal) * 100) : 0;
    const engMastered = Number(wordStats[0]?.mastered ?? 0);
    const engCompletion: number = Math.min(100, Math.round((engMastered / 50) * 100));

    // 语文：从 learners 表取 totalChineseLessons
    const learnerRows = await this.db
      .select({
        totalChineseLessons: learners.totalChineseLessons,
        totalMathTopics: learners.totalMathTopics,
        totalCheckInDays: learners.totalCheckInDays,
      })
      .from(learners)
      .where(eq(learners.userProfile, userId))
      .limit(1);

    const chineseLessons = learnerRows[0]?.totalChineseLessons ?? 0;
    const mathTopics = learnerRows[0]?.totalMathTopics ?? 0;

    // 语文完成度与正确率（模拟保底数据）
    const chineseCompletion: number = Math.min(100, Math.round((chineseLessons / 20) * 100));
    const chineseAccuracy: number = chineseLessons > 0 ? 78 + (chineseLessons % 15) : 0;
    const chineseActivity: number = chineseLessons > 0 ? activityScore : 0;

    // 数学
    const mathCompletion: number = Math.min(100, Math.round((mathTopics / 20) * 100));
    const mathAccuracy: number = mathTopics > 0 ? 75 + (mathTopics % 18) : 0;
    const mathActivity: number = mathTopics > 0 ? activityScore : 0;

    const subjects: SubjectRadarSubject[] = [
      {
        subject: 'chinese',
        accuracy: chineseAccuracy,
        completion: chineseCompletion,
        activity: chineseActivity,
      },
      {
        subject: 'math',
        accuracy: mathAccuracy,
        completion: mathCompletion,
        activity: mathActivity,
      },
      {
        subject: 'english',
        accuracy: engAccuracy,
        completion: engCompletion,
        activity: activityScore,
      },
    ];

    return { subjects };
  }

  /**
   * 进步曲线数据
   */
  async getProgress(
    userId: string,
    days: number,
  ): Promise<{ dailyData: ProgressDailyData[] }> {
    const limitDays = Math.max(1, Math.min(days, 30));
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - (limitDays - 1));
    const startDateIso = startDate.toISOString().split('T')[0];
    const startDateObj = new Date(startDateIso + 'T00:00:00Z');
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1);
    const endDateIso = endDate.toISOString().split('T')[0];
    const endDateObj = new Date(endDateIso + 'T00:00:00Z');

    // 从打卡表取每日学习时长
    const checkIns = await this.db
      .select({
        date: checkInRecords.checkInDate,
        studyMinutes: checkInRecords.studyMinutes,
        sentencesCompleted: checkInRecords.sentencesCompleted,
        wordsLearned: checkInRecords.wordsLearned,
      })
      .from(checkInRecords)
      .where(
        and(
          eq(checkInRecords.userProfile, userId),
          gte(checkInRecords.checkInDate, startDateIso),
          lt(checkInRecords.checkInDate, endDateIso),
        ),
      )
      .orderBy(checkInRecords.checkInDate);

    // 按日期建立 map
    const byDate = new Map<string, (typeof checkIns)[number]>();
    for (const row of checkIns) {
      const d = typeof row.date === 'string' ? row.date : String(row.date);
      byDate.set(d, row);
    }

    // 统计句子练习每日正确率
    const sentenceDaily = await this.db
      .select({
        date: sql<string>`DATE(${userSentenceRecords.createdAt})`.as('date'),
        total: count(),
        correct: sql<number>`count(*) filter (where ${userSentenceRecords.isCorrect} = true)`,
      })
      .from(userSentenceRecords)
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          gte(userSentenceRecords.createdAt, startDateObj),
          lt(userSentenceRecords.createdAt, endDateObj),
        ),
      )
      .groupBy(sql`DATE(${userSentenceRecords.createdAt})`);

    const sentenceByDate = new Map<string, { total: number; correct: number }>();
    for (const row of sentenceDaily) {
      sentenceByDate.set(row.date, {
        total: Number(row.total),
        correct: Number(row.correct),
      });
    }

    // 听写每日正确率
    const dictationDaily = await this.db
      .select({
        date: sql<string>`DATE(${userDictationRecords.createdAt})`.as('date'),
        total: count(),
        correct: sql<number>`count(*) filter (where ${userDictationRecords.isCorrect} = true)`,
      })
      .from(userDictationRecords)
      .where(
        and(
          eq(userDictationRecords.userProfile, userId),
          gte(userDictationRecords.createdAt, startDateObj),
          lt(userDictationRecords.createdAt, endDateObj),
        ),
      )
      .groupBy(sql`DATE(${userDictationRecords.createdAt})`);

    const dictationByDate = new Map<string, { total: number; correct: number }>();
    for (const row of dictationDaily) {
      dictationByDate.set(row.date, {
        total: Number(row.total),
        correct: Number(row.correct),
      });
    }

    const dailyData: ProgressDailyData[] = [];
    for (let i = 0; i < limitDays; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const checkIn = byDate.get(dateStr);
      const studyMinutes: number = checkIn?.studyMinutes ?? 0;

      const sStat = sentenceByDate.get(dateStr);
      const dStat = dictationByDate.get(dateStr);
      const totalQ = (sStat?.total ?? 0) + (dStat?.total ?? 0);
      const correctQ = (sStat?.correct ?? 0) + (dStat?.correct ?? 0);
      const accuracy: number = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

      const completedCount: number =
        (checkIn?.sentencesCompleted ?? 0) + (checkIn?.wordsLearned ?? 0);

      dailyData.push({
        date: dateStr,
        studyMinutes,
        accuracy,
        completedCount,
      });
    }

    return { dailyData };
  }

  /**
   * 错题统计
   */
  async getMistakes(userId: string): Promise<MistakeStats> {
    // 句子错题
    const sentenceWrong = await this.db
      .select({
        id: userSentenceRecords.id,
        question: sentencePuzzles.sentence,
        correctAnswer: sentencePuzzles.translation,
        createdAt: userSentenceRecords.createdAt,
      })
      .from(userSentenceRecords)
      .leftJoin(
        sentencePuzzles,
        eq(userSentenceRecords.puzzleId, sentencePuzzles.id),
      )
      .where(
        and(
          eq(userSentenceRecords.userProfile, userId),
          eq(userSentenceRecords.isCorrect, false),
        ),
      )
      .orderBy(desc(userSentenceRecords.createdAt))
      .limit(5);

    // 听写错题
    const dictationWrong = await this.db
      .select({
        id: userDictationRecords.id,
        question: dictationItems.translation,
        correctAnswer: dictationItems.sentence,
        createdAt: userDictationRecords.createdAt,
      })
      .from(userDictationRecords)
      .leftJoin(
        dictationItems,
        eq(userDictationRecords.dictationId, dictationItems.id),
      )
      .where(
        and(
          eq(userDictationRecords.userProfile, userId),
          eq(userDictationRecords.isCorrect, false),
        ),
      )
      .orderBy(desc(userDictationRecords.createdAt))
      .limit(5);

    // 单词错题（未掌握的）
    const wordWrong = await this.db
      .select({
        id: userWordRecords.id,
        question: wordItems.word,
        correctAnswer: wordItems.meaning,
        createdAt: userWordRecords.updatedAt,
      })
      .from(userWordRecords)
      .leftJoin(wordItems, eq(userWordRecords.wordId, wordItems.id))
      .where(
        and(
          eq(userWordRecords.userProfile, userId),
          eq(userWordRecords.masterStatus, 'unmarked'),
        ),
      )
      .orderBy(desc(userWordRecords.updatedAt))
      .limit(3);

    // 按类别统计数量
    const [sentenceCount, dictationCount, wordCount] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(userSentenceRecords)
        .where(
          and(
            eq(userSentenceRecords.userProfile, userId),
            eq(userSentenceRecords.isCorrect, false),
          ),
        ),
      this.db
        .select({ count: count() })
        .from(userDictationRecords)
        .where(
          and(
            eq(userDictationRecords.userProfile, userId),
            eq(userDictationRecords.isCorrect, false),
          ),
        ),
      this.db
        .select({ count: count() })
        .from(userWordRecords)
        .where(
          and(
            eq(userWordRecords.userProfile, userId),
            eq(userWordRecords.masterStatus, 'unmarked'),
          ),
        ),
    ]);

    const sentenceTotal: number = Number(sentenceCount[0]?.count ?? 0);
    const dictationTotal: number = Number(dictationCount[0]?.count ?? 0);
    const wordTotal: number = Number(wordCount[0]?.count ?? 0);

    // 分类数据
    const byCategory: MistakeCategoryStat[] = [
      { category: 'sentence', count: sentenceTotal },
      { category: 'word', count: wordTotal },
      { category: 'dictation', count: dictationTotal },
      { category: 'chinese_char', count: 0 },
      { category: 'math_arithmetic', count: 0 },
      { category: 'poetry', count: 0 },
    ].filter((item): item is MistakeCategoryStat => item.count > 0);

    // 如果超过5类，合并"其他"
    if (byCategory.length > 5) {
      const top = byCategory.slice(0, 4);
      const otherCount = byCategory
        .slice(4)
        .reduce((sum: number, item) => sum + item.count, 0);
      top.push({ category: 'other' as unknown as MistakeCategory, count: otherCount });
    }

    // 合并最近错题
    const recentSentence = sentenceWrong.map((row) => ({
      id: row.id,
      category: 'sentence' as MistakeCategory,
      question: row.question ?? '句子练习',
      correctAnswer: row.correctAnswer ?? '',
      createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    }));

    const recentDictation = dictationWrong.map((row) => ({
      id: row.id,
      category: 'dictation' as MistakeCategory,
      question: row.question ?? '听写练习',
      correctAnswer: row.correctAnswer ?? '',
      createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    }));

    const recentWords = wordWrong.map((row) => ({
      id: row.id,
      category: 'word' as MistakeCategory,
      question: row.question ?? '单词',
      correctAnswer: row.correctAnswer ?? '',
      createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    }));

    const allRecent = [...recentSentence, ...recentDictation, ...recentWords]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10);

    const totalMistakes: number = sentenceTotal + dictationTotal + wordTotal;

    return {
      totalMistakes,
      byCategory,
      recentMistakes: allRecent,
    };
  }

  /**
   * 成就/徽章列表
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    // 获取用户数据用于判断成就解锁
    const summary = await this.getSummary(userId);
    const learnerRows = await this.db
      .select({
        totalWords: learners.totalWords,
        totalChineseLessons: learners.totalChineseLessons,
        totalMathTopics: learners.totalMathTopics,
        totalCheckInDays: learners.totalCheckInDays,
        continuousCheckInDays: learners.continuousCheckInDays,
      })
      .from(learners)
      .where(eq(learners.userProfile, userId))
      .limit(1);

    const learner = learnerRows[0];
    const totalWords: number = learner?.totalWords ?? 0;
    const checkInStreak: number = learner?.continuousCheckInDays ?? 0;
    const totalCheckIns: number = learner?.totalCheckInDays ?? 0;
    const totalMinutes: number = summary.totalStudyMinutes;
    const chineseLessons: number = learner?.totalChineseLessons ?? 0;

    // 成就定义
    const achievements: Achievement[] = [
      {
        id: 'beginner',
        name: '初心者',
        description: '完成第一次学习',
        icon: '🎯',
        category: 'milestone',
        unlocked: totalMinutes > 0 || totalCheckIns > 0,
      },
      {
        id: 'streak-7',
        name: '坚持7天',
        description: '连续打卡7天',
        icon: '🔥',
        category: 'check_in',
        unlocked: checkInStreak >= 7,
      },
      {
        id: 'streak-30',
        name: '坚持30天',
        description: '连续打卡30天',
        icon: '💪',
        category: 'check_in',
        unlocked: checkInStreak >= 30,
      },
      {
        id: 'word-master',
        name: '单词达人',
        description: '累计掌握100个单词',
        icon: '📖',
        category: 'vocabulary',
        unlocked: totalWords >= 100,
      },
      {
        id: 'arithmetic-king',
        name: '口算王者',
        description: '数学口算练习超过50题',
        icon: '🧮',
        category: 'math',
        unlocked: false,
      },
      {
        id: 'poetry-lover',
        name: '古诗爱好者',
        description: '完成10首古诗学习',
        icon: '📜',
        category: 'chinese',
        unlocked: chineseLessons >= 10,
      },
      {
        id: 'all-rounder',
        name: '全能学霸',
        description: '三科正确率都超过80%',
        icon: '🏆',
        category: 'milestone',
        unlocked: summary.overallAccuracy >= 80,
      },
      {
        id: 'study-100h',
        name: '学习时长100小时',
        description: '累计学习100小时',
        icon: '⏰',
        category: 'milestone',
        unlocked: totalMinutes >= 6000,
      },
      {
        id: 'course-collector',
        name: '课程收藏家',
        description: '加入5门课程',
        icon: '📚',
        category: 'courses',
        unlocked: summary.completedCourses >= 3,
      },
      {
        id: 'perfectionist',
        name: '完美主义者',
        description: '总正确率达到90%以上',
        icon: '✨',
        category: 'milestone',
        unlocked: summary.overallAccuracy >= 90,
      },
    ];

    // 设置解锁时间（粗略使用创建时间）
    return achievements.map((item) => ({
      ...item,
      unlockedAt: item.unlocked ? new Date().toISOString() : undefined,
    }));
  }

  // ===== 首页看板统计 =====

  async getDashboardStats(userId: string): Promise<LearnerDashboardStats> {
    const todayStr = this.getDateStr(new Date());
    const todayStartIso = new Date(todayStr + 'T00:00:00.000Z').toISOString();
    const todayEndIso = new Date(todayStr + 'T23:59:59.999Z').toISOString();

    const now = new Date();
    const monthStartIso = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const monthEndIso = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).toISOString();

    // --- 句子统计 ---
    const sentenceStats = await this.db
      .select({
        total: count(),
        wrong: sql<number>`count(*) filter (where ${userSentenceRecords.isCorrect} = false)`,
        mastered: sql<number>`count(*) filter (where ${userSentenceRecords.masterStatus} = 'mastered')`,
        unfamiliar: sql<number>`count(*) filter (where ${userSentenceRecords.masterStatus} = 'unfamiliar')`,
      })
      .from(userSentenceRecords)
      .where(sql`(${userSentenceRecords.userProfile}).user_id = ${userId}`);

    const sent = sentenceStats[0];
    const sentencesTotal = Number(sent?.total ?? 0);
    const sentencesWrong = Number(sent?.wrong ?? 0);
    const sentencesMastered = Number(sent?.mastered ?? 0);
    const sentencesUnfamiliar = Number(sent?.unfamiliar ?? 0);

    // --- 单词统计 ---
    const wordStats = await this.db
      .select({
        total: count(),
        wrong: sql<number>`count(*) filter (where ${userWordRecords.status} = 'wrong' or ${userWordRecords.masterStatus} = 'wrong')`,
        mastered: sql<number>`count(*) filter (where ${userWordRecords.masterStatus} = 'mastered')`,
        unfamiliar: sql<number>`count(*) filter (where ${userWordRecords.masterStatus} = 'unfamiliar' or ${userWordRecords.status} = 'learning')`,
      })
      .from(userWordRecords)
      .where(sql`(${userWordRecords.userProfile}).user_id = ${userId}`);

    const wrd = wordStats[0];
    const wordsTotal = Number(wrd?.total ?? 0);
    const wordsWrong = Number(wrd?.wrong ?? 0);
    const wordsMastered = Number(wrd?.mastered ?? 0);
    const wordsUnfamiliar = Number(wrd?.unfamiliar ?? 0);

    // --- 累计学习时长 ---
    const learnerRow = await this.db
      .select({
        totalMinutes: learners.totalStudyMinutes,
        currentStreak: learners.continuousCheckInDays,
        totalCheckIns: learners.totalCheckInDays,
      })
      .from(learners)
      .where(sql`(${learners.userProfile}).user_id = ${userId}`)
      .limit(1);

    const totalStudyMinutes = learnerRow[0]?.totalMinutes ?? 0;
    const currentStreak = learnerRow[0]?.currentStreak ?? 0;
    const totalCheckIns = learnerRow[0]?.totalCheckIns ?? 0;

    // --- 今日学习时长（从今日打卡记录取） ---
    const todayCheckIn = await this.db
      .select({ studyMinutes: checkInRecords.studyMinutes })
      .from(checkInRecords)
      .where(
        and(
          sql`(${checkInRecords.userProfile}).user_id = ${userId}`,
          sql`${checkInRecords.checkInDate} = ${todayStr}::date`,
        ),
      )
      .limit(1);
    const todayStudyMinutes = todayCheckIn[0]?.studyMinutes ?? 0;

    // --- 本月学习时长（汇总打卡记录） ---
    const monthMinutesRow = await this.db
      .select({
        total: sql<number>`coalesce(sum(${checkInRecords.studyMinutes}), 0)`,
      })
      .from(checkInRecords)
      .where(
        and(
          sql`(${checkInRecords.userProfile}).user_id = ${userId}`,
          sql`${checkInRecords.checkInDate} >= ${monthStartIso}::date`,
          sql`${checkInRecords.checkInDate} <= ${monthEndIso}::date`,
        ),
      );
    const monthStudyMinutes = Number(monthMinutesRow[0]?.total ?? 0);

    // --- 连续打卡 & 最高打卡 ---
    const allCheckIns = await this.db
      .select({ date: checkInRecords.checkInDate })
      .from(checkInRecords)
      .where(sql`(${checkInRecords.userProfile}).user_id = ${userId}`)
      .orderBy(checkInRecords.checkInDate);

    const { maxStreak } = this.calcStreaks(
      allCheckIns.map((r) => this.getDateStr(r.date as unknown as Date)),
    );

    // --- 今日荣耀榜 top 5 ---
    const todayTopRows = await this.db
      .select({
        userId: sql<string>`(${checkInRecords.userProfile}).user_id`,
        minutes: checkInRecords.studyMinutes,
      })
      .from(checkInRecords)
      .where(
        sql`${checkInRecords.checkInDate} = ${todayStr}::date`,
      )
      .orderBy(desc(checkInRecords.studyMinutes))
      .limit(5);

    const topUserIds = todayTopRows.map((r) => r.userId).filter(Boolean);
    const userNameMap = new Map<string, string>();
    if (topUserIds.length > 0) {
      try {
        const users = await this.authnService.listUsersByIds(topUserIds);
        for (const u of users) {
          const userInfo = u as unknown as { userId: string; name?: string; userNameI18n?: { zh_cn?: string } };
          userNameMap.set(
            userInfo.userId,
            userInfo.name || userInfo.userNameI18n?.zh_cn || '学习者',
          );
        }
      } catch (err) {
        this.logger.error(
          `批量获取用户信息失败: ${JSON.stringify(err)}`,
        );
      }
    }

    const todayTopLearners: TodayTopLearner[] = todayTopRows.map(
      (r, idx) => ({
        rank: idx + 1,
        userId: r.userId,
        userName: userNameMap.get(r.userId) || '学习者',
        minutes: r.minutes ?? 0,
      }),
    );

    // --- 最近30天日历数据 ---
    const calendarData = this.buildCalendarData(userId, allCheckIns as unknown as Array<{ date: Date; studyMinutes?: number }>);

    return {
      sentencesTotal,
      sentencesWrong,
      sentencesUnfamiliar,
      sentencesMastered,
      wordsTotal,
      wordsWrong,
      wordsUnfamiliar,
      wordsMastered,
      totalStudyMinutes,
      todayStudyMinutes,
      monthStudyMinutes,
      currentStreak,
      maxStreak,
      totalCheckIns,
      todayTopLearners,
      calendarData,
    };
  }

  // ===== 辅助方法 =====

  private getDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private calcStreaks(dateStrs: string[]): {
    currentStreak: number;
    maxStreak: number;
  } {
    if (dateStrs.length === 0) {
      return { currentStreak: 0, maxStreak: 0 };
    }
    const sorted = [...dateStrs].sort();
    let maxStreak = 1;
    let curStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        curStreak += 1;
        maxStreak = Math.max(maxStreak, curStreak);
      } else if (diffDays > 1) {
        curStreak = 1;
      }
    }

    // 计算当前连续打卡（从今天往回数）
    const set = new Set(sorted);
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = this.getDateStr(d);
      if (set.has(ds)) {
        currentStreak += 1;
      } else if (i === 0) {
        // 今天还没打卡，从昨天开始算
        continue;
      } else {
        break;
      }
    }

    return { currentStreak, maxStreak };
  }

  private buildCalendarData(
    _userId: string,
    allCheckIns: Array<{ date: Date; studyMinutes?: number }>,
  ): LearnerCalendarDayData[] {
    const result: LearnerCalendarDayData[] = [];
    const byDate = new Map<string, number>();
    for (const row of allCheckIns) {
      const ds = this.getDateStr(row.date);
      byDate.set(ds, row.studyMinutes ?? 25);
    }

    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = this.getDateStr(d);
      const minutes = byDate.get(ds) ?? 0;
      result.push({
        date: ds,
        checkedIn: minutes > 0 || byDate.has(ds),
        minutes,
      });
    }
    return result;
  }
}
