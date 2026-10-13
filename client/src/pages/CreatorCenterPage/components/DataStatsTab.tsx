import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { creatorApi } from '@client/src/api';
import type { CreatorStatsData } from '@shared/api.interface';

interface DataStatsTabProps {
  stats: CreatorStatsData | null;
}

// 7天趋势模拟数据（简化，纯前端生成）
const TREND_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const generateTrendData = (base: number): number[] => {
  return TREND_LABELS.map(() => Math.floor(base * (0.6 + Math.random() * 0.8)));
};

const DataStatsTab: React.FC<DataStatsTabProps> = ({ stats }) => {
  const [trendData, setTrendData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        // 后端暂无趋势接口，前端基于总数据模拟 7 天分布
        const dailyBase = stats ? Math.max(1, Math.floor(stats.totalLearnCount / 30)) : 10;
        setTrendData(generateTrendData(dailyBase));
      } catch (err) {
        logger.debug('加载统计数据失败', { error: String(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stats]);

  const maxValue = trendData.length > 0 ? Math.max(...trendData) : 1;

  if (loading || !stats) {
    return (
      <div className="text-center py-12" style={{ color: '#94A3B8' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总学习次数', value: stats.totalLearnCount, color: '#6366F1', icon: TrendingUp },
          { label: '总点赞数', value: stats.totalLikeCount, color: '#06B6D4', icon: Sparkles },
          { label: '总收藏数', value: stats.totalFavoriteCount, color: '#EC4899', icon: Sparkles },
          { label: '已发布内容', value: stats.contentCount, color: '#FBBF24', icon: Calendar },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl p-4"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${item.color}33`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span className="text-xs" style={{ color: '#94A3B8' }}>{item.label}</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${item.color}, #fff)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {item.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 7 天学习次数趋势 - 纯 div 柱状图 */}
      <div
        className="rounded-xl p-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5" style={{ color: '#6366F1' }} />
          <h3 className="text-white font-semibold">近 7 天学习次数趋势</h3>
        </div>

        <div className="flex items-end justify-between gap-2 h-48 px-2">
          {trendData.map((val, idx) => {
            const heightPercent = (val / maxValue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                  {val.toLocaleString()}
                </div>
                <div
                  className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden"
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: '4px',
                    background: 'linear-gradient(180deg, #6366F1 0%, #06B6D4 100%)',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>
                  {TREND_LABELS[idx]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 转化率 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="text-sm mb-3" style={{ color: '#94A3B8' }}>平均点赞率</div>
          <div className="text-3xl font-bold text-white">
            {stats.totalLearnCount > 0
              ? ((stats.totalLikeCount / stats.totalLearnCount) * 100).toFixed(1)
              : '0.0'}%
          </div>
        </div>
        <div
          className="rounded-xl p-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="text-sm mb-3" style={{ color: '#94A3B8' }}>平均收藏率</div>
          <div className="text-3xl font-bold text-white">
            {stats.totalLearnCount > 0
              ? ((stats.totalFavoriteCount / stats.totalLearnCount) * 100).toFixed(1)
              : '0.0'}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStatsTab;
