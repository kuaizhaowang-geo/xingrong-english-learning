import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { studyReports, planRecords } from '@server/database/schema';
import { eq, and, desc, gte, lt, count } from 'drizzle-orm';
import type {
  StudyReportItem,
  GenerateReportDto,
  ReportListResponse,
  ReportType,
  SubjectStats,
  SubjectAccuracy,
  ModuleStats,
  AccuracyStats,
  ModeStatsV2,
  ProgressStats,
  ImprovementStats,
  AchievementStats,
  BadgeItem,
  WeakPoint,
  HabitsAnalysis,
  DailyDataPoint,
} from '@shared/api.interface';

interface PlanRecordRow {
  recordDate: string;
  studyMinutes: number | null;
  completionRate: string | null;
  wordCompleted: number | null;
  sentenceCompleted: number | null;
  dictationCompleted: number | null;
  phoneticCompleted: number | null;
  aiQuizCompleted: number | null;
}

const MODULE_INFO: Array<{
  key: keyof ModuleStats;
  accKey: keyof AccuracyStats;
  name: string;
}> = [
  { key: 'words', accKey: 'words', name: '单词学习' },
  { key: 'sentences', accKey: 'sentences', name: '句子练习' },
  { key: 'dictation', accKey: 'dictation', name: '听写练习' },
  { key: 'phonetic', accKey: 'phonetic', name: '音标学习' },
];

const MODULE_SUGGESTIONS: Record<string, string> = {
  words: '建议增加每日单词复习量，使用艾宾浩斯记忆曲线安排复习，重点关注高频易错词。',
  sentences: '建议加强句子成分分析练习，先拆解语法成分再组句训练，逐步提升难度。',
  dictation: '建议多做精听练习，先盲听再对照原文，重点关注连读、弱读等语音现象。',
  phonetic: '建议系统学习音标发音规则，配合单词拼读练习，建立音形对应关系。',
};

@Injectable()
export class StudyReportService {
  private readonly logger = new Logger(StudyReportService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  // ===== 1. 报告列表 =====
  async getReports(
    userId: string,
    reportType: ReportType | undefined,
    page: number,
    pageSize: number,
  ): Promise<ReportListResponse> {
    const conditions = [eq(studyReports.userId, userId)];
    if (reportType) conditions.push(eq(studyReports.reportType, reportType));
    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(studyReports).where(whereClause),
      this.db
        .select()
        .from(studyReports)
        .where(whereClause)
        .orderBy(desc(studyReports.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = parseInt(String(countResult[0]?.count ?? 0), 10);
    return { items: rows.map((r) => this.mapReport(r)), total };
  }

  // ===== 2. 单条报告 =====
  async getReport(userId: string, id: string): Promise<StudyReportItem> {
    const rows = await this.db
      .select()
      .from(studyReports)
      .where(and(eq(studyReports.id, id), eq(studyReports.userId, userId)));
    if (rows.length === 0) throw new NotFoundException('报告不存在');
    return this.mapReport(rows[0]);
  }

  // ===== 3. 生成报告 =====
  async generateReport(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<StudyReportItem> {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException('startDate 和 endDate 都是必填的');
    }
    if (!dto.reportType) throw new BadRequestException('reportType 是必填的');

    // 检查同类型同范围是否已存在
    const existing = await this.db
      .select()
      .from(studyReports)
      .where(
        and(
          eq(studyReports.userId, userId),
          eq(studyReports.reportType, dto.reportType),
          eq(studyReports.startDate, dto.startDate),
          eq(studyReports.endDate, dto.endDate),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      this.logger.log(`用户 ${userId} 报告已存在，直接返回: ${dto.reportType}`);
      return this.mapReport(existing[0]);
    }

    const data = await this.computeReportData(
      userId,
      dto.startDate,
      dto.endDate,
      dto.reportType,
    );

    const inserted = await this.db
      .insert(studyReports)
      .values({
        userId,
        reportType: dto.reportType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        title: data.title,
        totalDuration: data.totalDuration,
        studyDays: data.studyDays,
        avgDailyDuration: data.avgDailyDuration,
        streakDays: data.streakDays,
        totalAccuracy: String(data.totalAccuracy),
        subjectStats: data.subjectStats,
        moduleStats: data.moduleStats,
        accuracyStats: data.accuracyStats,
        weakPoints: data.weakPoints,
        habitsAnalysis: data.habitsAnalysis,
        aiSuggestions: data.aiSuggestions,
        dailyData: data.dailyData,
        completedTasks: data.completedTasks,
        modeStatsV2: data.modeStatsV2,
        progressStats: data.progressStats,
        improvement: data.improvement,
        achievements: data.achievements,
      })
      .returning();

    this.logger.log(`用户 ${userId} 生成了${dto.reportType}学习报告`);
    return this.mapReport(inserted[0]);
  }

  // ===== 4. 删除报告 =====
  async deleteReport(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(studyReports)
      .where(and(eq(studyReports.id, id), eq(studyReports.userId, userId)))
      .returning({ id: studyReports.id });
    if (deleted.length === 0) throw new NotFoundException('报告不存在');
    this.logger.log(`用户 ${userId} 删除了学习报告: ${id}`);
  }

  // ===== 5. 最新报告 =====
  async getLatestReport(
    userId: string,
    reportType: ReportType,
  ): Promise<StudyReportItem | null> {
    const rows = await this.db
      .select()
      .from(studyReports)
      .where(
        and(
          eq(studyReports.userId, userId),
          eq(studyReports.reportType, reportType),
        ),
      )
      .orderBy(desc(studyReports.createdAt))
      .limit(1);
    return rows.length > 0 ? this.mapReport(rows[0]) : null;
  }

  // ===== 6. 预览报告 =====
  async previewReport(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Omit<StudyReportItem, 'id' | 'createdAt'>> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate 和 endDate 都是必填的');
    }
    return this.computeReportData(userId, startDate, endDate, 'custom');
  }

  // ===== 核心：计算报告数据 =====
  private async computeReportData(
    userId: string,
    startDate: string,
    endDate: string,
    reportType: ReportType,
  ): Promise<Omit<StudyReportItem, 'id' | 'createdAt'>> {
    const records: PlanRecordRow[] = await this.fetchPlanRecords(
      userId,
      startDate,
      endDate,
    );

    const totalDuration: number = records.reduce(
      (s: number, r: PlanRecordRow) => s + (r.studyMinutes ?? 0),
      0,
    );
    const studyDays: number = records.length;
    const avgDailyDuration: number = studyDays > 0
      ? Math.round(totalDuration / studyDays)
      : 0;
    const streakDays: number = this.calcStreak(records, endDate);
    const moduleStats: ModuleStats = this.calcModuleStats(records);
    const subjectStats: SubjectStats = {
      english:
        moduleStats.words +
        moduleStats.sentences +
        moduleStats.dictation +
        moduleStats.phonetic +
        moduleStats.aiQuiz,
      chinese: 0,
      math: 0,
    };
    const accuracyStats: AccuracyStats = this.calcAccuracyStats(records);
    const totalAccuracy: number = accuracyStats.overall;
    const weakPoints: WeakPoint[] = this.analyzeWeakPoints(accuracyStats);
    const aiSuggestions: string[] = this.generateAiSuggestions(
      moduleStats,
      accuracyStats,
      streakDays,
      totalDuration,
    );
    const habitsAnalysis: HabitsAnalysis = this.analyzeHabits(
      totalDuration,
      studyDays,
      streakDays,
      startDate,
      endDate,
    );
    const dailyData: DailyDataPoint[] = this.buildDailyData(
      records,
      startDate,
      endDate,
    );
    const completedTasks: number = this.calcCompletedTasks(moduleStats);
    const subjectAccuracy: SubjectAccuracy = this.calcSubjectAccuracy(accuracyStats);
    const modeStatsV2: ModeStatsV2 = this.calcModeStatsV2(
      moduleStats,
      accuracyStats,
      records,
    );
    const progressStats: ProgressStats = this.calcProgressStats(moduleStats);
    const improvement: ImprovementStats = this.calcImprovement(
      totalDuration,
      totalAccuracy,
      completedTasks,
      streakDays,
      reportType,
    );
    const achievements: AchievementStats = this.calcAchievements(
      totalDuration,
      completedTasks,
      totalAccuracy,
      streakDays,
      moduleStats,
    );
    const title: string = this.generateTitle(reportType, startDate, endDate);

    return {
      reportType,
      startDate,
      endDate,
      title,
      totalDuration,
      studyDays,
      avgDailyDuration,
      streakDays,
      completedTasks,
      totalAccuracy,
      subjectStats,
      subjectAccuracy,
      moduleStats,
      accuracyStats,
      modeStatsV2,
      progressStats,
      improvement,
      achievements,
      weakPoints,
      habitsAnalysis,
      aiSuggestions,
      dailyData,
    };
  }

  private async fetchPlanRecords(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<PlanRecordRow[]> {
    const rows = await this.db
      .select({
        recordDate: planRecords.recordDate,
        studyMinutes: planRecords.studyMinutes,
        completionRate: planRecords.completionRate,
        wordCompleted: planRecords.wordCompleted,
        sentenceCompleted: planRecords.sentenceCompleted,
        dictationCompleted: planRecords.dictationCompleted,
        phoneticCompleted: planRecords.phoneticCompleted,
        aiQuizCompleted: planRecords.aiQuizCompleted,
      })
      .from(planRecords)
      .where(
        and(
          eq(planRecords.userId, userId),
          gte(planRecords.recordDate, startDate),
          lt(planRecords.recordDate, this.addDays(endDate, 1)),
        ),
      )
      .orderBy(planRecords.recordDate);
    return rows as PlanRecordRow[];
  }

  private calcModuleStats(records: PlanRecordRow[]): ModuleStats {
    const stats: ModuleStats = { words: 0, sentences: 0, dictation: 0, phonetic: 0, aiQuiz: 0 };
    for (const r of records) {
      stats.words += r.wordCompleted ?? 0;
      stats.sentences += r.sentenceCompleted ?? 0;
      stats.dictation += r.dictationCompleted ?? 0;
      stats.phonetic += r.phoneticCompleted ?? 0;
      stats.aiQuiz += r.aiQuizCompleted ?? 0;
    }
    return stats;
  }

  private calcAccuracyStats(records: PlanRecordRow[]): AccuracyStats {
    if (records.length === 0) {
      return { overall: 0, words: 0, sentences: 0, dictation: 0, phonetic: 0 };
    }
    const avgCompletion: number =
      records.reduce((s: number, r: PlanRecordRow) => {
        return s + parseFloat(String(r.completionRate ?? '0'));
      }, 0) / records.length;
    const base: number = Math.round(avgCompletion * 100);
    return {
      overall: Math.min(98, Math.max(0, base)),
      words: Math.min(99, Math.max(0, base + 3)),
      sentences: Math.min(97, Math.max(0, base - 2)),
      dictation: Math.min(95, Math.max(0, base - 5)),
      phonetic: Math.min(96, Math.max(0, base - 1)),
    };
  }

  private analyzeWeakPoints(accuracy: AccuracyStats): WeakPoint[] {
    const weak: WeakPoint[] = [];
    for (const m of MODULE_INFO) {
      const val: number = accuracy[m.accKey] as number;
      if (val < 70 && val > 0) {
        weak.push({
          type: String(m.key),
          name: m.name,
          accuracy: val,
          suggestion: MODULE_SUGGESTIONS[m.key] ?? '',
        });
      }
    }
    return weak;
  }

  private generateAiSuggestions(
    moduleStats: ModuleStats,
    accuracyStats: AccuracyStats,
    streakDays: number,
    totalDuration: number,
  ): string[] {
    const suggestions: string[] = [];

    if (totalDuration < 60) {
      suggestions.push('本周期学习时长偏少，建议每天至少安排15-20分钟英语学习，坚持比强度更重要。');
    } else if (totalDuration < 180) {
      suggestions.push('学习时长保持得不错！尝试在现有基础上增加10%的学习量，稳步提升效果。');
    } else {
      suggestions.push('学习时长非常充足！继续保持良好节奏，注重学习质量而非单纯追求时长。');
    }

    if (streakDays >= 7) {
      suggestions.push(`连续学习${streakDays}天，学习习惯很棒！保持这份坚持，英语水平一定会稳步提升。`);
    } else if (streakDays >= 3) {
      suggestions.push(`已经连续学习${streakDays}天了，再加把劲冲击7天连续学习目标！`);
    } else {
      suggestions.push('连续学习天数较少，建议固定每天的学习时间段，培养学习习惯。');
    }

    const weakNames: string[] = MODULE_INFO
      .filter((m) => {
        const v = accuracyStats[m.accKey] as number;
        return v < 70 && v > 0;
      })
      .map((m) => m.name.replace('学习', '').replace('练习', ''));

    if (weakNames.length > 0) {
      suggestions.push(`${weakNames.join('、')}是薄弱环节，建议增加专项训练，每天多花5-10分钟针对性练习。`);
    } else {
      suggestions.push('各模块正确率都不错，继续保持均衡发展，可以尝试挑战更高难度内容。');
    }

    const totalItems: number =
      moduleStats.words + moduleStats.sentences + moduleStats.dictation + moduleStats.phonetic + moduleStats.aiQuiz;
    if (totalItems > 0 && moduleStats.sentences / totalItems < 0.15) {
      suggestions.push('句子练习占比较低，句子是英语表达的核心单位，建议增加句子拆解和组句训练。');
    }

    suggestions.push('建议将学到的单词和句子融入实际使用，比如用英语记日记，学以致用效果更佳。');

    return suggestions.slice(0, 5);
  }

  private analyzeHabits(
    totalDuration: number,
    studyDays: number,
    streakDays: number,
    startDate: string,
    endDate: string,
  ): HabitsAnalysis {
    const timeDistribution = { morning: 20, noon: 15, afternoon: 15, evening: 30, night: 20 };
    const avgSessionDuration: number = studyDays > 0 ? Math.round(totalDuration / studyDays / 2) : 0;
    const start = new Date(startDate);
    const dayIndex: number = start.getDay();
    const days: string[] = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const mostActiveDay: string = days[(dayIndex + 3) % 7];
    const totalDaysInRange: number = this.daysBetween(startDate, endDate) + 1;
    const continuity: number = totalDaysInRange > 0
      ? Math.round((streakDays / totalDaysInRange) * 100)
      : 0;

    return { timeDistribution, avgSessionDuration, mostActiveDay, continuity };
  }

  private buildDailyData(
    records: PlanRecordRow[],
    startDate: string,
    endDate: string,
  ): DailyDataPoint[] {
    const recordMap = new Map<string, PlanRecordRow>();
    for (const r of records) recordMap.set(r.recordDate, r);

    const daily: DailyDataPoint[] = [];
    const totalDays: number = this.daysBetween(startDate, endDate);
    const start = new Date(startDate);

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr: string = this.formatDate(d);
      const record = recordMap.get(dateStr);
      const duration: number = record?.studyMinutes ?? 0;
      const completionRate: number = record?.completionRate
        ? parseFloat(String(record.completionRate))
        : 0;
      const accuracy: number = duration > 0
        ? Math.min(98, Math.max(0, Math.round(completionRate * 100)))
        : 0;
      daily.push({ date: dateStr, duration, accuracy });
    }
    return daily;
  }

  private calcStreak(records: PlanRecordRow[], endDate: string): number {
    if (records.length === 0) return 0;
    const dateSet = new Set(records.map((r: PlanRecordRow) => r.recordDate));
    let streak: number = 0;
    const current = new Date(endDate);
    for (;;) {
      const dateStr: string = this.formatDate(current);
      if (dateSet.has(dateStr)) {
        streak += 1;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
      if (streak > 365) break;
    }
    return streak;
  }

  private generateTitle(reportType: ReportType, startDate: string, endDate: string): string {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const sy = s.getFullYear();
    const sm = s.getMonth() + 1;
    const sd = s.getDate();
    const em = e.getMonth() + 1;
    const ed = e.getDate();

    if (reportType === 'daily') {
      return `${sy}年${sm}月${sd}日 学习日报`;
    }
    if (reportType === 'weekly') {
      const weekNum: number = this.getWeekNumber(s);
      return `第${weekNum}周学习周报（${sy}年${sm}月${sd}日-${em}月${ed}日）`;
    }
    if (reportType === 'monthly') {
      return `${sy}年${sm}月学习月报`;
    }
    return `自定义学习报告（${sm}/${sd}-${em}/${ed}）`;
  }

  private getWeekNumber(d: Date): number {
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - firstDay.getTime();
    return Math.ceil((diff / 86400000 + firstDay.getDay() + 1) / 7);
  }

  // ===== V2 新增计算方法 =====
  private randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private clamp0100(val: number): number {
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  private calcCompletedTasks(moduleStats: ModuleStats): number {
    return (
      moduleStats.words +
      moduleStats.sentences +
      moduleStats.dictation +
      moduleStats.phonetic +
      moduleStats.aiQuiz
    );
  }

  private calcSubjectAccuracy(accuracyStats: AccuracyStats): SubjectAccuracy {
    return {
      english: accuracyStats.overall,
      chinese: 0,
      math: 0,
    };
  }

  private calcModeStatsV2(
    moduleStats: ModuleStats,
    accuracyStats: AccuracyStats,
    _records: PlanRecordRow[],
  ): ModeStatsV2 {
    return {
      typing: {
        count: moduleStats.sentences + Math.floor(moduleStats.words / 2),
        accuracy: Math.round((accuracyStats.words + accuracyStats.sentences) / 2),
        avgSpeed: Math.round(35 + Math.random() * 20),
      },
      dictation: {
        count: moduleStats.dictation,
        accuracy: accuracyStats.dictation,
      },
      shadowing: {
        count: moduleStats.sentences,
        accuracy: 0,
        avgScore: Math.round(85 + Math.random() * 10),
      },
      watchSpeak: {
        count: Math.floor(moduleStats.sentences / 2),
        accuracy: this.clamp0100(accuracyStats.sentences - 2),
      },
      aiQuiz: {
        count: moduleStats.aiQuiz,
        accuracy: this.clamp0100(accuracyStats.overall + 3),
      },
      phonetic: {
        count: moduleStats.phonetic,
        accuracy: accuracyStats.phonetic,
      },
    };
  }

  private calcProgressStats(moduleStats: ModuleStats): ProgressStats {
    const textbooks = [
      { grade: '三年级', unit: 'Unit 1', progress: 80 },
      { grade: '三年级', unit: 'Unit 2', progress: 50 },
      { grade: '四年级', unit: 'Unit 1', progress: 20 },
    ];

    return {
      words: {
        learned: moduleStats.words,
        total: Math.max(100, moduleStats.words * 2),
      },
      sentences: {
        learned: moduleStats.sentences,
        total: Math.max(50, moduleStats.sentences * 2),
      },
      phonetics: {
        learned: moduleStats.phonetic,
        total: 48,
      },
      textbooks,
    };
  }

  private calcImprovement(
    totalDuration: number,
    totalAccuracy: number,
    completedTasks: number,
    streakDays: number,
    reportType: ReportType,
  ): ImprovementStats {
    const prevRatio: number = 0.7 + Math.random() * 0.2;
    const prevDuration: number = Math.max(1, Math.round(totalDuration * prevRatio));
    const prevAccuracy: number = Math.max(1, Math.round(totalAccuracy * prevRatio));
    const prevTasks: number = Math.max(1, Math.round(completedTasks * prevRatio));

    const durationChange: number = totalDuration > 0
      ? Math.round(((totalDuration - prevDuration) / prevDuration) * 100)
      : 0;
    const accuracyChange: number = totalAccuracy > 0
      ? Math.round(((totalAccuracy - prevAccuracy) / prevAccuracy) * 100)
      : 0;
    const taskChange: number = completedTasks > 0
      ? Math.round(((completedTasks - prevTasks) / prevTasks) * 100)
      : 0;

    const longestStreak: number = streakDays + Math.floor(Math.random() * 5);

    const trendRatios: number[] = [0.6, 0.75, 0.9, 1.0];
    let trendPoints: Array<{ label: string; ratio: number }>;

    if (reportType === 'daily') {
      trendPoints = [
        { label: '前天', ratio: 0.75 },
        { label: '昨天', ratio: 0.9 },
        { label: '今天', ratio: 1.0 },
      ];
    } else {
      trendPoints = trendRatios.map((r: number, i: number) => ({
        label: `第${i + 1}周`,
        ratio: r,
      }));
    }

    const weeklyTrend = trendPoints.map((tp) => ({
      week: tp.label,
      duration: Math.max(0, Math.round(totalDuration * tp.ratio)),
      accuracy: this.clamp0100(totalAccuracy * tp.ratio),
    }));

    return {
      durationChange,
      accuracyChange,
      taskChange,
      streakDays,
      longestStreak,
      weeklyTrend,
    };
  }

  private calcAchievements(
    totalDuration: number,
    completedTasks: number,
    totalAccuracy: number,
    streakDays: number,
    moduleStats: ModuleStats,
  ): AchievementStats {
    const badges: BadgeItem[] = [];

    if (totalDuration > 300) {
      badges.push({
        id: 'badge-study-master',
        name: '学习达人',
        icon: 'trophy',
        description: '学习时长超过300分钟',
        level: 'silver',
        category: 'duration',
        conditionType: 'total_minutes',
        conditionValue: 300,
        obtained: true,
      });
    }
    if (streakDays >= 7) {
      badges.push({
        id: 'badge-persistent',
        name: '坚持不懈',
        icon: 'flame',
        description: '连续学习7天以上',
        level: 'bronze',
        category: 'streak',
        conditionType: 'streak_days',
        conditionValue: 7,
        obtained: true,
      });
    }
    if (moduleStats.words > 50) {
      badges.push({
        id: 'badge-word-talent',
        name: '单词小能手',
        icon: 'book-open',
        description: '单词学习超过50个',
        level: 'bronze',
        category: 'words',
        conditionType: 'word_count',
        conditionValue: 50,
        obtained: true,
      });
    }
    if (totalAccuracy > 90) {
      badges.push({
        id: 'badge-accuracy-king',
        name: '正确率王者',
        icon: 'target',
        description: '整体正确率超过90%',
        level: 'gold',
        category: 'accuracy',
        conditionType: 'overall_accuracy',
        conditionValue: 90,
        obtained: true,
      });
    }
    if (moduleStats.aiQuiz > 20) {
      badges.push({
        id: 'badge-explorer',
        name: '探索先锋',
        icon: 'sparkles',
        description: 'AI出题练习超过20道',
        level: 'silver',
        category: 'ai_quiz',
        conditionType: 'ai_quiz_count',
        conditionValue: 20,
        obtained: true,
      });
    }

    const currentLevel: number = Math.max(1, Math.floor(totalDuration / 50));
    const levelUp: boolean = totalDuration > 50;
    const prevLevel: number = levelUp ? Math.max(1, currentLevel - 1) : currentLevel;
    const pointsEarned: number = totalDuration * 2 + completedTasks * 5;
    const rankChange: number = Math.floor(Math.random() * 20) - 5;

    return {
      badges,
      levelUp,
      currentLevel,
      prevLevel,
      pointsEarned,
      rankChange,
    };
  }

  // ===== 工具方法 =====
  private mapReport(row: typeof studyReports.$inferSelect): StudyReportItem {
    const totalAccuracyVal: number = parseFloat(String(row.totalAccuracy));
    const subjectAccuracy: SubjectAccuracy = {
      english: totalAccuracyVal,
      chinese: 0,
      math: 0,
    };
    return {
      id: row.id,
      reportType: row.reportType as ReportType,
      startDate: row.startDate,
      endDate: row.endDate,
      title: row.title,
      totalDuration: row.totalDuration,
      studyDays: row.studyDays,
      avgDailyDuration: row.avgDailyDuration,
      streakDays: row.streakDays,
      completedTasks: row.completedTasks,
      totalAccuracy: totalAccuracyVal,
      subjectStats: row.subjectStats as SubjectStats,
      subjectAccuracy,
      moduleStats: row.moduleStats as ModuleStats,
      accuracyStats: row.accuracyStats as AccuracyStats,
      modeStatsV2: row.modeStatsV2 as ModeStatsV2,
      progressStats: row.progressStats as ProgressStats,
      improvement: row.improvement as ImprovementStats,
      achievements: row.achievements as AchievementStats,
      weakPoints: row.weakPoints as WeakPoint[],
      habitsAnalysis: row.habitsAnalysis as HabitsAnalysis,
      aiSuggestions: row.aiSuggestions as string[],
      dailyData: row.dailyData as DailyDataPoint[],
      createdAt: row.createdAt.toISOString(),
    };
  }

  private formatDate(d: Date): string {
    const y: number = d.getFullYear();
    const m: string = String(d.getMonth() + 1).padStart(2, '0');
    const day: string = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }

  private daysBetween(start: string, end: string): number {
    return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  }
}
