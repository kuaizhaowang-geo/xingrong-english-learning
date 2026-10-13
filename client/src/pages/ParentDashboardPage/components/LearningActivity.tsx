import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  BookOpen,
  CalendarCheck,
  Gamepad2,
  FileText,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import * as parentApi from '@client/src/api/parent';
import type { LearningActivityItem } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';

interface LearningActivityProps {
  childId: string;
}

const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number }>; color: string; bg: string; label: string }> = {
  practice: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-500', label: '练习' },
  checkin: { icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-500', label: '打卡' },
  game: { icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-500', label: '游戏' },
  lesson: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-500', label: '课时' },
  exam: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-500', label: '考试' },
};

const subjectColors: Record<string, string> = {
  english: '#4361EE',
  chinese: '#2EC4B6',
  math: '#FF6B35',
  all: '#6B7280',
};

const subjectNames: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
  all: '全科',
};

const subjectFilters = [
  { key: 'all', label: '全部' },
  { key: 'english', label: '英语' },
  { key: 'chinese', label: '语文' },
  { key: 'math', label: '数学' },
];

const LearningActivity: React.FC<LearningActivityProps> = ({ childId }) => {
  const [activities, setActivities] = useState<LearningActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');

  useEffect(() => {
    if (childId) loadActivities();
  }, [childId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const list = await parentApi.getChildActivity(childId, 14);
      setActivities(list);
    } catch (error) {
      logger.error('加载学习动态失败', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeSubject === 'all'
    ? activities
    : activities.filter((a: LearningActivityItem) => a.subject === activeSubject);

  // 按日期分组
  const grouped = new Map<string, LearningActivityItem[]>();
  for (const item of filtered) {
    const date = new Date(item.createdAt).toLocaleDateString('zh-CN');
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)?.push(item);
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toLocaleDateString('zh-CN');
    return dateStr === today;
  };

  const isYesterday = (dateStr: string) => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN');
    return dateStr === yesterday;
  };

  const formatDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return '今天';
    if (isYesterday(dateStr)) return '昨天';
    return dateStr;
  };

  return (
    <div className="space-y-4">
      {/* 筛选 */}
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-1">
            {subjectFilters.map((tab) => (
              <button
                key={tab.key}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSubject === tab.key
                    ? 'bg-[#4361EE] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveSubject(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 时间线 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles size={18} className="text-[#4361EE]" />
            学习动态
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Clock size={48} className="mb-3 text-gray-300" />
              <p>暂无学习动态</p>
            </div>
          ) : (
            <div className="relative">
              {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#4361EE]" />
                    <span className="text-sm font-semibold text-gray-700">
                      {formatDateLabel(date)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {items.length} 条动态
                    </span>
                    <div className="flex-1 h-px bg-gray-100 ml-2" />
                  </div>

                  <div className="relative pl-4 border-l-2 border-gray-100 ml-1 space-y-3">
                    {items.map((item: LearningActivityItem) => {
                      const config = typeConfig[item.type] || typeConfig.practice;
                      const Icon = config.icon;
                      return (
                        <div
                          key={item.id}
                          className="relative flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {/* 时间线圆点 */}
                          <div
                            className={`absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-white ${config.bg}`}
                          />

                          {/* 图标 */}
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 ${config.bg}`}
                          >
                            <Icon size={16} />
                          </div>

                          {/* 内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-800">
                                {item.title}
                              </span>
                              <span
                                className="px-1.5 py-0.5 text-xs rounded"
                                style={{
                                  backgroundColor: `${subjectColors[item.subject] || '#999'}15`,
                                  color: subjectColors[item.subject] || '#999',
                                }}
                              >
                                {subjectNames[item.subject] || item.subject}
                              </span>
                              {item.score !== undefined && (
                                <span className="ml-auto px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-semibold">
                                  {item.score}分
                                </span>
                              )}
                            </div>
                            {item.result && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.result}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningActivity;
