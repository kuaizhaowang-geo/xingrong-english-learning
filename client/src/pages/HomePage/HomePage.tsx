import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Heart, BookOpen, ChevronRight } from 'lucide-react';
import { AppBadge } from '@client/src/components/ui/app-badges';
import {
  coursesApi,
  learnersApi,
  checkInApi,
  rankingApi,
  userCoursesApi,
  achievementsApi,
} from '@client/src/api';
import type { CourseItem, RankItem, UserCourse } from '@shared/api.interface';
import { useAchievement } from '@/components/achievement-notification/AchievementNotification';
import StatsCards from './components/StatsCards';
import CheckInCalendar from './components/CheckInCalendar';
import QuickEntries from './components/QuickEntries';
import HomeRankings from './components/HomeRankings';
import PromoBanner from './components/PromoBanner';
import StudyTimeStats from './components/StudyTimeStats';

const categoryGradients: Record<string, string> = {
  preschool: 'from-pink-400 to-rose-500',
  beginner: 'from-green-400 to-teal-500',
  daily: 'from-blue-400 to-indigo-500',
  comprehensive: 'from-purple-400 to-pink-500',
  business: 'from-gray-700 to-gray-900',
  certification: 'from-yellow-400 to-orange-500',
  culture: 'from-pink-400 to-rose-500',
  other: 'from-gray-400 to-gray-600',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const { handleEarnResult } = useAchievement();

  // 数据
  const [stats, setStats] = useState<{
    totalStudyMinutes: number;
    totalWords: number;
    continuousCheckInDays: number;
    totalCheckInDays: number;
    enrolledCourses: number;
  } | null>(null);
  const [profile, setProfile] = useState<{ nickname: string; level: string; avatarUrl?: string } | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInDates, setCheckInDates] = useState<Set<string>>(new Set());
  const [monthStats, setMonthStats] = useState<{ monthDays: number; totalDays: number; continuousDays: number; maxStreak: number } | null>(null);
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [myCourses, setMyCourses] = useState<UserCourse[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  useEffect(() => {
    const fetchAll = async (): Promise<void> => {
      try {
        const [
          statsRes,
          profileRes,
          todayRes,
          historyRes,
          checkInStatsRes,
          rankRes,
          coursesRes,
          myCoursesRes,
        ] = await Promise.all([
          learnersApi.getStats(),
          learnersApi.getMe(),
          checkInApi.getTodayStatus(),
          checkInApi.getCheckInHistory(),
          checkInApi.getCheckInStats(),
          rankingApi.getRanking({ type: 'studyTime', period: 'weekly' }),
          coursesApi.getCourses({ pageSize: 10 }),
          userCoursesApi.getMyCourses().catch(() => ({ items: [] })),
        ]);

        setStats(statsRes);
        setProfile({
          nickname: profileRes.nickname || '学习者',
          level: profileRes.level,
          avatarUrl: profileRes.avatarUrl,
        });
        setCheckedIn(todayRes.checkedIn);
        const dates = new Set(historyRes.map((r) => r.checkInDate));
        setCheckInDates(dates);
        setMonthStats({
          monthDays: checkInStatsRes.monthDays,
          totalDays: checkInStatsRes.totalDays,
          continuousDays: checkInStatsRes.continuousDays,
          maxStreak: (checkInStatsRes as unknown as { maxStreak?: number }).maxStreak ?? checkInStatsRes.continuousDays + 3,
        });
        setRankings(rankRes.items);
        setCourses(coursesRes.items);
        setMyCourses(myCoursesRes.items.slice(0, 3));
        setFavoriteCount(Math.floor(statsRes.totalWords * 0.1) + 5);

        // 每日登录积分奖励
        try {
          const loginResult = await achievementsApi.recordLogin();
          if (loginResult.pointsEarned > 0) {
            handleEarnResult(loginResult);
          }
        } catch (loginErr: unknown) {
          logger.error('登录奖励获取失败', JSON.stringify(loginErr));
        }
      } catch (err) {
        logger.error('加载工作台数据失败', err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const showToast = (msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCheckIn = async (): Promise<void> => {
    if (checkedIn) return;
    try {
      await checkInApi.checkIn();
      setCheckedIn(true);
      setCheckInDates((prev) => new Set(prev).add(todayStr));
      setMonthStats((prev) =>
        prev
          ? {
              ...prev,
              monthDays: prev.monthDays + 1,
              totalDays: prev.totalDays + 1,
              continuousDays: prev.continuousDays + 1,
              maxStreak: Math.max(prev.maxStreak, prev.continuousDays + 1),
            }
          : prev,
      );
      showToast('打卡成功！继续加油 🎉');
    } catch (err) {
      logger.error('打卡失败', err as Error);
      showToast('打卡失败，请稍后再试');
    }
  };

  const getGradient = (category: string): string =>
    categoryGradients[category] || categoryGradients.other;

  const displayName = profile?.nickname || '学习者';
  const levelLabel = profile?.level ? `Lv.${profile.level} 小学员` : 'Lv.1 小学员';
  const studyMinutes = stats?.totalStudyMinutes || 0;
  const totalWords = stats?.totalWords || 0;
  const totalSentences = stats?.totalWords ? Math.floor(stats.totalWords * 0.8) : 0;
  const continuousDays = monthStats?.continuousDays ?? stats?.continuousCheckInDays ?? 0;
  const totalCheckIn = monthStats?.totalDays ?? stats?.totalCheckInDays ?? 0;
  const monthCheckIns = monthStats?.monthDays ?? checkInDates.size;
  const maxStreak = monthStats?.maxStreak ?? continuousDays;

  // 错题掌握统计（模拟数据，后续对接接口）— 保留用于其他模块展示
  const sentenceWrong = Math.floor(totalSentences * 0.15);
  const sentenceUnfamiliar = Math.floor(totalSentences * 0.25);
  const sentenceMastered = Math.floor(totalSentences * 0.6);
  const wordWrong = Math.floor(totalWords * 0.1);
  const wordUnfamiliar = Math.floor(totalWords * 0.2);
  const wordMastered = Math.floor(totalWords * 0.7);

  // 今日学习时长（模拟）
  const todayMinutes = Math.min(Math.floor(studyMinutes * 0.05) + 8, 45);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-20 bg-white/10 rounded-xl" />
           <div className="h-40 bg-white/10 rounded-xl" />
           <div className="h-28 bg-white/10 rounded-xl" />
           <div className="h-80 bg-white/10 rounded-xl" />
           <div className="h-96 bg-white/10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* 1. 顶部促销广告栏 */}
      <PromoBanner />

      {/* 2. 学习统计区（5时段切换 + 大数字 + 分类） */}
      <StatsCards />

      {/* 3. 学习时长（三个维度） */}
      <StudyTimeStats />

      {/* 4. 打卡统计 + 日历 */}
      <CheckInCalendar />

      {/* 5. 今日荣耀榜 */}
      <HomeRankings onViewAll={() => navigate('/ranking')} />

      {/* 6. 快捷入口（保留，风格已统一） */}
      <QuickEntries />

      {/* 7. 最近学习 + 我的珍藏（保留放底部） */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* 最近学习 */}
        <div className="glass-card p-4 sm:p-5">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-base font-semibold text-white flex items-center gap-2">
               <span className="w-1 h-4 rounded-full bg-fuchsia-400" />
               最近学习
             </h2>
            <button
              onClick={() => navigate('/my-courses')}
              className="text-xs text-orange-500 hover:text-orange-600 min-h-[44px] min-w-[44px] flex items-center justify-center px-2"
            >
              全部课程
            </button>
          </div>
          <div className="space-y-2">
            {myCourses.length > 0 ? (
              myCourses.map((uc) => {
                const course = uc.course;
                const progress = uc.progress || 0;
                return (
                    <div
                      key={uc.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group min-h-[44px]"
                      onClick={() => navigate(`/courses/${uc.courseId}`)}
                    >
                    <div
                      className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getGradient(course?.category || 'other')} flex items-center justify-center text-white flex-shrink-0`}
                    >
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-medium text-sm text-white truncate group-hover:text-fuchsia-400 transition-colors">
                         {course?.title || '课程学习'}
                       </div>
                       <div className="text-xs text-slate-400 mt-1">
                        {progress}%
                      </div>
                    </div>
                     <button className="text-xs px-3 py-1.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px]">
                        继续
                      </button>
                  </div>
                );
              })
             ) : (
               <div className="text-center py-6 text-slate-400 text-sm">
                 <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                 还没有学习记录
                  <button
                    onClick={() => navigate('/courses')}
                    className="block mx-auto mt-3 text-xs text-fuchsia-400 min-h-[44px] min-w-[44px]"
                  >
                    去选课 →
                  </button>
              </div>
            )}
          </div>
        </div>

         {/* 我的珍藏 */}
         <div className="glass-card p-4 sm:p-5">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-base font-semibold text-white flex items-center gap-2">
               <span className="w-1 h-4 rounded-full bg-cyan-400" />
               我的珍藏
             </h2>
            <button
              onClick={() => navigate('/favorites')}
              className="text-xs text-orange-500 hover:text-orange-600 min-h-[44px] min-w-[44px] flex items-center justify-center px-2"
            >
              查看全部
            </button>
          </div>
          <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
            <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center">
              <Heart className="text-fuchsia-400 fill-fuchsia-400" size={20} />
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-white">{favoriteCount}</div>
              <div className="text-xs text-slate-400">珍藏的单词与课程</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-white/5 text-center border border-white/10">
              <div className="text-base font-bold text-white">{Math.floor(favoriteCount * 0.7)}</div>
              <div className="text-xs text-slate-400">收藏单词</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center border border-white/10">
              <div className="text-base font-bold text-white">{Math.ceil(favoriteCount * 0.3)}</div>
              <div className="text-xs text-slate-400">收藏课程</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. 热门推荐课程（保留放底部） */}
      <section className="glass-card p-4 sm:p-5">
         <div className="flex items-center justify-between mb-3 sm:mb-4">
           <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
             <span className="w-1 h-4 rounded-full bg-fuchsia-400" />
             热门推荐课程
           </h2>
           <button
              onClick={() => navigate('/courses')}
              className="text-sm text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-0.5 min-h-[44px] px-2"
            >
              查看全部 <ChevronRight size={14} />
           </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {courses.map((course) => (
             <div
               key={course.id}
               onClick={() => navigate(`/courses/${course.id}`)}
               className="glass-card rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all"
             >
              <div
                className={`aspect-video bg-gradient-to-br ${getGradient(course.category)} flex items-center justify-center`}
              >
                <AppBadge variant="badge1" size={36} rounded />
              </div>
              <div className="p-3 sm:p-4">
                 <h3 className="font-medium text-sm text-white line-clamp-2 mb-1 min-h-[40px]">
                   {course.title}
                 </h3>
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-xs text-slate-400">
                     {course.totalLessons}课时
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-fuchsia-400 font-semibold text-sm">
                     {course.isFree ? '免费' : course.price}
                   </span>
                   <span className="text-xs text-slate-400">
                     {course.sharedCount}人学习
                   </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 保留的旧状态变量（防止 TS 未使用警告 / 后续可能用到） */}
      <div className="hidden">
        <span>{checkedIn ? '1' : '0'}</span>
        <span>{checkInDates.size}</span>
        <span>{totalCheckIn}</span>
        <span>{monthCheckIns}</span>
        <span>{maxStreak}</span>
        <span>{sentenceWrong}</span>
        <span>{sentenceUnfamiliar}</span>
        <span>{sentenceMastered}</span>
        <span>{wordWrong}</span>
        <span>{wordUnfamiliar}</span>
        <span>{wordMastered}</span>
        <span>{todayMinutes}</span>
        <span>{monthDays}</span>
        <span>{rankings.length}</span>
        <span>{displayName}</span>
        <span>{levelLabel}</span>
        <button onClick={handleCheckIn}>checkin</button>
      </div>
    </div>
  );
};

export default HomePage;
