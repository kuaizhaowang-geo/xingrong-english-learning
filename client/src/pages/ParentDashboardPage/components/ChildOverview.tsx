import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import ReactECharts from 'echarts-for-react';
import {
  Clock,
  BookOpen,
  Target,
  Flame,
  TrendingUp,
} from 'lucide-react';
import * as parentApi from '@client/src/api/parent';
import type { ChildOverview as ChildOverviewData } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';

interface ChildOverviewProps {
  childId: string;
  childName: string;
}

const statItems = [
  { key: 'totalStudyMinutes', label: '总学习时长', suffix: '分钟', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'completedLessons', label: '完成课时', suffix: '课', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'overallAccuracy', label: '总正确率', suffix: '%', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' },
  { key: 'checkInStreak', label: '连续打卡', suffix: '天', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50' },
];

const subjectColors: Record<string, string> = {
  english: '#4361EE',
  chinese: '#2EC4B6',
  math: '#FF6B35',
};

const subjectNames: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const ChildOverview: React.FC<ChildOverviewProps> = ({ childId, childName }) => {
  const [data, setData] = useState<ChildOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childId) loadData();
  }, [childId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const overview = await parentApi.getChildOverview(childId);
      setData(overview);
    } catch (error) {
      logger.error('加载学习总览失败', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    if (!data) return {};
    const dates = data.recentWeekActivity.map((d) => d.date.slice(5));
    const minutes = data.recentWeekActivity.map((d) => d.minutes);
    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>学习时长: {c}分钟',
      },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E5E7EB' } },
        axisLabel: { color: '#6B7280', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F3F4F6' } },
        axisLabel: { color: '#6B7280', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: minutes,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#4361EE' },
                { offset: 1, color: '#7B8FF7' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: 24,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* 顶部用户信息 */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {childName?.charAt(0) || '学'}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-gray-800">{childName}</div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  今日学习 <span className="font-semibold text-[#4361EE]">{data.todayStudyMinutes}</span> 分钟
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  连续打卡 <span className="font-semibold text-orange-500">{data.checkInStreak}</span> 天
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#4361EE]">{data.overallAccuracy}%</div>
              <div className="text-xs text-gray-400 mt-1">总正确率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          const value = (data as unknown as Record<string, number>)[item.key] ?? 0;
          return (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">
                      {value}
                      <span className="text-sm font-normal text-gray-400 ml-1">{item.suffix}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={item.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 学科能力 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">学科能力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.subjectBreakdown.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between text-sm py-1.5">
                 <span className="font-medium text-gray-700">
                   {subjectNames[subject.subject] || subject.subject}
                 </span>
                 <span className="text-gray-500">
                   {subject.studyMinutes}分钟 · 正确率{subject.accuracy}% · 完成度{Math.round(subject.completionRate)}%
                 </span>
               </div>
            ))}
          </CardContent>
        </Card>

        {/* 近7天学习时长 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">近7天学习时长</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={getChartOption()} style={{ height: 200 }} notMerge />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChildOverview;
