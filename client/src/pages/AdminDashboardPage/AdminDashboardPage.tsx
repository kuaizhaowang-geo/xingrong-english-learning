import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Users,
  BookOpen,
  BookMarked,
  BookText,
  Puzzle,
  Clock,
  Activity,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
} from 'lucide-react';
import * as adminApi from '@client/src/api/admin';
import type {
  DashboardStats,
  DailyStudyTrend,
  SubjectDistribution,
  UserRegisterTrend,
  AdminRankItem,
  RecentActivity,
} from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';

interface StatCardConfig {
  key: keyof DashboardStats;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
}

const statConfigs: StatCardConfig[] = [
  {
    key: 'totalUsers',
    label: '总用户数',
    icon: Users,
    color: 'text-[#4361EE]',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'totalCourses',
    label: '课程总数',
    icon: BookOpen,
    color: 'text-[#2EC4B6]',
    bgColor: 'bg-teal-50',
  },
  {
    key: 'totalTextbooks',
    label: '教材总数',
    icon: BookMarked,
    color: 'text-[#FF6B35]',
    bgColor: 'bg-orange-50',
  },
  {
    key: 'totalWords',
    label: '单词总数',
    icon: BookText,
    color: 'text-[#7209B7]',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'totalSentences',
    label: '句子总数',
    icon: Puzzle,
    color: 'text-[#F72585]',
    bgColor: 'bg-pink-50',
  },
  {
    key: 'todayStudyMinutes',
    label: '今日学习时长(分钟)',
    icon: Clock,
    color: 'text-[#FFD166]',
    bgColor: 'bg-yellow-50',
  },
  {
    key: 'todayActiveUsers',
    label: '今日活跃用户',
    icon: Activity,
    color: 'text-[#06D6A0]',
    bgColor: 'bg-emerald-50',
  },
  {
    key: 'todayCheckIns',
    label: '今日打卡数',
    icon: CalendarCheck,
    color: 'text-[#EF476F]',
    bgColor: 'bg-rose-50',
  },
];

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [studyTrend, setStudyTrend] = useState<DailyStudyTrend[]>([]);
  const [subjectDistribution, setSubjectDistribution] = useState<
    SubjectDistribution[]
  >([]);
  const [registerTrend, setRegisterTrend] = useState<UserRegisterTrend[]>([]);
  const [ranking, setRanking] = useState<AdminRankItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAll = async (): Promise<void> => {
      try {
        const [
          statsData,
          trendData,
          subjectData,
          registerData,
          rankingData,
          activitiesData,
        ] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getStudyTrend(),
          adminApi.getSubjectDistribution(),
          adminApi.getRegisterTrend(),
          adminApi.getRanking(),
          adminApi.getRecentActivities(),
        ]);
        setStats(statsData);
        setStudyTrend(trendData);
        setSubjectDistribution(subjectData);
        setRegisterTrend(registerData);
        setRanking(rankingData);
        setRecentActivities(activitiesData);
      } catch (err) {
        logger.error('Failed to fetch dashboard data', { error: String(err) });
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-700';
    if (rank === 3) return 'bg-orange-300 text-orange-900';
    return 'bg-gray-100 text-gray-500';
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'register':
        return <Users size={14} className="text-blue-500" />;
      case 'study':
        return <BookOpen size={14} className="text-green-500" />;
      case 'checkin':
        return <CalendarCheck size={14} className="text-orange-500" />;
      default:
        return <Zap size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfigs.map((config: StatCardConfig) => {
          const Icon = config.icon;
          const value = stats?.[config.key] ?? 0;
          return (
            <Card
              key={config.key}
              className="border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B7280] mb-1">{config.label}</p>
                    <p className="text-2xl font-bold text-[#1A1A2E]">
                      {loading ? '--' : value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-lg ${config.bgColor} flex items-center justify-center`}
                  >
                    <Icon size={22} className={config.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 第一行图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 学习时长趋势 */}
        <Card className="lg:col-span-2 border border-gray-100 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
              <TrendingUp size={18} className="text-[#4361EE]" />
              近7日学习时长趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex items-center justify-center text-[#6B7280] text-sm bg-gray-50 rounded-lg"
              style={{ height: '300px' }}
            >
              {loading ? (
                <span>图表加载中...</span>
              ) : studyTrend.length > 0 ? (
                <div className="w-full px-4">
                  <div className="space-y-3">
                    {studyTrend.map(
                      (item: DailyStudyTrend, idx: number) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-20 text-xs text-[#6B7280]">
                            {item.date}
                          </div>
                          <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#4361EE] to-[#7209B7] rounded-md transition-all"
                              style={{
                                width: `${Math.min(100, (item.minutes / Math.max(...studyTrend.map((t: DailyStudyTrend) => t.minutes), 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-xs text-[#1A1A2E]">
                            {item.minutes} 分钟 / {item.users} 人
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <span>暂无数据</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：学科分布 + 注册趋势 */}
        <div className="space-y-6">
          {/* 学科分布饼图占位 */}
          <Card className="border border-gray-100 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1A2E]">
                学科分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[130px] flex items-center justify-center text-[#6B7280] text-sm">
                {loading ? (
                  '图表加载中...'
                ) : subjectDistribution.length > 0 ? (
                  <div className="w-full space-y-2">
                    {subjectDistribution.map(
                      (item: SubjectDistribution, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[#1A1A2E]">{item.label}</span>
                          <span className="text-[#6B7280]">
                            {item.count} 门
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  '暂无数据'
                )}
              </div>
            </CardContent>
          </Card>

          {/* 注册增长趋势 */}
          <Card className="border border-gray-100 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Users size={18} className="text-[#2EC4B6]" />
                注册增长趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[130px] flex items-center justify-center text-[#6B7280] text-sm">
                {loading ? (
                  '图表加载中...'
                ) : registerTrend.length > 0 ? (
                  <div className="w-full flex items-end justify-between gap-1 h-full">
                    {registerTrend.map(
                      (item: UserRegisterTrend, idx: number) => {
                        const maxVal = Math.max(
                          ...registerTrend.map(
                            (r: UserRegisterTrend) => r.count,
                          ),
                          1,
                        );
                        const heightPct = (item.count / maxVal) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <div className="text-[10px] text-[#6B7280]">
                              {item.count}
                            </div>
                            <div
                              className="w-full bg-gradient-to-t from-[#2EC4B6] to-[#06D6A0] rounded-t-md"
                              style={{ height: `${Math.max(8, heightPct)}%` }}
                            />
                            <div className="text-[10px] text-[#6B7280]">
                              {item.date.slice(-2)}日
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  '暂无数据'
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 第二行：排行榜 + 最近动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学习时长排行榜 Top10 */}
        <Card className="border border-gray-100 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Award size={18} className="text-[#FFD166]" />
              学习时长排行榜 Top10
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-sm text-[#6B7280] py-8">
                加载中...
              </div>
            ) : ranking.length > 0 ? (
              <div className="space-y-2">
                {ranking.slice(0, 10).map((item: AdminRankItem, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeColor(
                        item.rank,
                      )}`}
                    >
                      {item.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1A1A2E] truncate">
                        {item.name}
                      </div>
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      {item.minutes} 分钟
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-[#6B7280] py-8">
                暂无排行数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近动态 */}
        <Card className="border border-gray-100 rounded-lg shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Zap size={18} className="text-[#FF6B35]" />
              最近动态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-sm text-[#6B7280] py-8">
                加载中...
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((item: RecentActivity) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1A1A2E]">
                        <span className="font-medium">{item.userName}</span>{' '}
                        {item.detail}
                      </div>
                      <div className="text-xs text-[#6B7280] mt-0.5">
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-[#6B7280] py-8">
                暂无动态
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
