import { APP_FILTER } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';
import EventEmitter from 'events';

EventEmitter.defaultMaxListeners = 30;

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AdminContextModule } from './modules/admin-context.module';
import { CoursesModule } from './modules/courses/courses.module';
import { TextbooksModule } from './modules/textbooks/textbooks.module';
import { LearnersModule } from './modules/learners/learners.module';
import { UserCoursesModule } from './modules/user-courses/user-courses.module';
import { PracticeModule } from './modules/practice/practice.module';
import { WordsModule } from './modules/words/words.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { JournalModule } from './modules/journal/journal.module';
import { AICoursesModule } from './modules/ai-courses/ai-courses.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AdminCoursesModule } from './modules/admin-courses/admin-courses.module';
import { AdminTextbooksModule } from './modules/admin-textbooks/admin-textbooks.module';
import { AdminWordsModule } from './modules/admin-words/admin-words.module';
import { AdminChineseCharsModule } from './modules/admin-chinese-chars/admin-chinese-chars.module';
import { AdminMathModule } from './modules/admin-math/admin-math.module';
import { AdminSentencesModule } from './modules/admin-sentences/admin-sentences.module';
import { AdminDictationsModule } from './modules/admin-dictations/admin-dictations.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { AdminAuditModule } from './modules/admin-audit/admin-audit.module';
import { LearningPlanModule } from './modules/learning-plan/learning-plan.module';
import { WrongBookModule } from './modules/wrong-book/wrong-book.module';
import { PkArenaModule } from './modules/pk-arena/pk-arena.module';
import { ParentModule } from './modules/parent/parent.module';
import { GamesModule } from './modules/games/games.module';
import { PreschoolModule } from './modules/preschool/preschool.module';
import { WordbookModule } from './modules/wordbook/wordbook.module';
import { ContentMarketModule } from './modules/content-market/content-market.module';
import { CreatorModule } from './modules/creator/creator.module';
import { CourseFavoritesModule } from './modules/course-favorites/course-favorites.module';
import { SentenceFavoritesModule } from './modules/sentence-favorites/sentence-favorites.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AntiAddictionModule } from './modules/anti-addiction/anti-addiction.module';
import { ContentAuditModule } from './modules/content-audit/content-audit.module';
import { TypingModule } from './modules/typing/typing.module';
import { ApiConfigModule } from './modules/api-config/api-config.module';
import { ChineseDictationModule } from './modules/chinese-dictation/chinese-dictation.module';
import { MathPracticeModule } from './modules/math-practice/math-practice.module';
import { PhonicsModule } from './modules/phonics/phonics.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { StudyPlanModule } from './modules/study-plan/study-plan.module';
import { StudyReportModule } from './modules/study-report/study-report.module';
import { ReviewItemsModule } from './modules/review-items/review-items.module';
import { UserTextbooksModule } from './modules/user-textbooks/user-textbooks.module';
import { UserCreatedCoursesModule } from './modules/user-created-courses/user-created-courses.module';
import { AdminUgcModule } from './modules/admin-ugc/admin-ugc.module';
import { AiIllustrationModule } from './modules/ai-illustration/ai-illustration.module';
import { AdminIllustrationModule } from './modules/admin-illustration/admin-illustration.module';
import { HealthModule } from './modules/health/health.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // AdminContextModule 必须在 PlatformModule 之后导入，
    // 这样 AdminContextMiddleware + SqlExecutionContextMiddleware 组合
    // 会在内层重新设置 admin 的 preSql（service_role），覆盖外层的 anon/authenticated。
    AdminContextModule,
    // ====== @route-section: business-modules START ======
    CoursesModule,
    TextbooksModule,
    LearnersModule,
    UserCoursesModule,
    PracticeModule,
    WordsModule,
    CheckInModule,
    RankingModule,
    JournalModule,
    AICoursesModule,
    AiChatModule,
    AdminAuthModule,
    AdminDashboardModule,
    AdminCoursesModule,
    AdminTextbooksModule,
    AdminWordsModule,
    AdminChineseCharsModule,
    AdminMathModule,
    AdminSentencesModule,
    AdminDictationsModule,
    AdminUsersModule,
    AdminAuditModule,
    LearningPlanModule,
    WrongBookModule,
    PkArenaModule,
    GamesModule,
    WordbookModule,
    ContentMarketModule,
    CreatorModule,
    CourseFavoritesModule,
    SentenceFavoritesModule,
    ParentModule,
    QuestionsModule,
    AntiAddictionModule,
    ContentAuditModule,
    TypingModule,
    ApiConfigModule,
    ChineseDictationModule,
    MathPracticeModule,
    PhonicsModule,
    AchievementsModule,
    StudyPlanModule,
    StudyReportModule,
    ReviewItemsModule,
    UserTextbooksModule,
    UserCreatedCoursesModule,
    AdminUgcModule,
    AiIllustrationModule,
    AdminIllustrationModule,
    HealthModule,
    PreschoolModule,
    // ====== @route-section: business-modules END ======

    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}
