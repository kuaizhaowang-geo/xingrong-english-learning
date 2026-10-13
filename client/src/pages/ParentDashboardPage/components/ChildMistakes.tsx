import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import ReactECharts from 'echarts-for-react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  BookOpen,
  XCircle,
} from 'lucide-react';
import * as parentApi from '@client/src/api/parent';
import type { ChildMistakeItem, ChildMistakesResponse } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';

interface ChildMistakesProps {
  childId: string;
}

const subjectTabs = [
  { key: 'all', label: '全部', color: 'text-gray-700' },
  { key: 'english', label: '英语', color: 'text-blue-600' },
  { key: 'chinese', label: '语文', color: 'text-emerald-600' },
  { key: 'math', label: '数学', color: 'text-orange-600' },
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

const ChildMistakes: React.FC<ChildMistakesProps> = ({ childId }) => {
  const [data, setData] = useState<ChildMistakesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (childId) loadMistakes();
  }, [childId, activeSubject]);

  const loadMistakes = async () => {
    setLoading(true);
    try {
      const result = await parentApi.getChildMistakes(childId, {
        subject: activeSubject === 'all' ? undefined : activeSubject,
        page: 1,
        pageSize: 20,
      });
      setData(result);
    } catch (error) {
      logger.error('加载错题报告失败', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const pieOption = () => {
    if (!data?.summary?.subjectStats?.length) return {};
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}题 ({d}%)',
      },
      series: [
        {
          type: 'pie',
          radius: ['55%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: data.summary.subjectStats.map((s) => ({
            name: subjectNames[s.subject] || s.subject,
            value: s.count,
            itemStyle: { color: subjectColors[s.subject] || '#999' },
          })),
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

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-gray-500">总错题数</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              {data?.summary?.totalMistakes ?? 0}
              <span className="text-sm font-normal text-gray-400 ml-1">题</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-gray-500">本周新增</div>
            <div className="text-2xl font-bold text-rose-500 mt-1">
              +{data?.summary?.weekNew ?? 0}
              <span className="text-sm font-normal text-gray-400 ml-1">题</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">各学科错题占比</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <ReactECharts option={pieOption()} style={{ height: 100, width: 140 }} notMerge />
              <div className="flex-1 space-y-1.5">
                {data?.summary?.subjectStats?.map((s) => (
                  <div key={s.subject} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subjectColors[s.subject] || '#999' }}
                    />
                    <span className="text-gray-600 w-12">{subjectNames[s.subject] || s.subject}</span>
                    <span className="font-medium text-gray-800">{s.count}题</span>
                    <span className="text-gray-400 ml-auto">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学科筛选 Tab */}
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-1">
            {subjectTabs.map((tab) => (
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

      {/* 错题列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">错题列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!data?.items?.length ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <XCircle size={48} className="mb-3 text-gray-300" />
              <p>暂无错题记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((item: ChildMistakeItem) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-14 rounded-full shrink-0 mt-1"
                        style={{ backgroundColor: subjectColors[item.subject] || '#999' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: `${subjectColors[item.subject] || '#999'}15`,
                              color: subjectColors[item.subject] || '#999',
                            }}
                          >
                            {subjectNames[item.subject] || item.subject}
                          </span>
                          <span className="text-xs text-gray-400">{item.questionType}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div
                          className={`text-sm text-gray-800 ${isExpanded ? '' : 'line-clamp-2'}`}
                        >
                          <span className="font-medium">题目：</span>
                          {item.question}
                        </div>
                        {isExpanded && (
                          <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
                            <div className="text-sm">
                              <span className="text-gray-500">我的答案：</span>
                              <span className="text-rose-600 font-medium">{item.userAnswer}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">正确答案：</span>
                              <span className="text-emerald-600 font-medium">{item.correctAnswer}</span>
                            </div>
                          </div>
                        )}
                        <button
                          className="flex items-center gap-1 text-xs text-[#4361EE] mt-2 hover:underline"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        >
                          {isExpanded ? (
                            <>收起 <ChevronUp size={14} /></>
                          ) : (
                            <>查看详情 <ChevronDown size={14} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildMistakes;
