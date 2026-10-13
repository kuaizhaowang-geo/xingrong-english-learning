import React, { useState, useEffect, useCallback } from 'react';
import { reviewItemsApi } from '@client/src/api/review-items';
import type { ReviewItem, ReviewStats } from '@shared/api.interface';
import {
  RefreshCw,
  BookOpen,
  Loader2,
} from 'lucide-react';
import StatCard from './StatCard';
import FilterBar from './FilterBar';
import ReviewCard from './ReviewCard';
import { logger } from '@lark-apaas/client-toolkit/logger';

const ReviewPage: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [subject, setSubject] = useState('');
  const [itemType, setItemType] = useState('');
  const [status, setStatus] = useState('');
  const [dueOnly, setDueOnly] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await reviewItemsApi.getStats();
      setStats(data);
    } catch (err) {
      logger.error('Failed to fetch review stats', String(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewItemsApi.list({
        subject: subject || undefined,
        itemType: itemType || undefined,
        status: status || undefined,
        dueOnly,
        page,
        pageSize,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('Failed to fetch review items', String(err));
    } finally {
      setLoading(false);
    }
  }, [subject, itemType, status, dueOnly, page, pageSize]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleMaster = async (id: string) => {
    try {
      await reviewItemsApi.markMastered(id);
      fetchItems();
      fetchStats();
    } catch (err) {
      logger.error('Failed to mark mastered', String(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewItemsApi.delete(id);
      fetchItems();
      fetchStats();
    } catch (err) {
      logger.error('Failed to delete', String(err));
    }
  };

  const handleReview = async (id: string, isCorrect: boolean) => {
    try {
      await reviewItemsApi.recordReview(id, isCorrect);
      fetchItems();
      fetchStats();
    } catch (err) {
      logger.error('Failed to record review', String(err));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div
      className="min-h-screen p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2.5 rounded-xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.3) 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            <RefreshCw size={24} style={{ color: '#818CF8' }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                background:
                  'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              复习中心
            </h1>
             <p className="text-sm mt-0.5 text-slate-400">
              艾宾浩斯记忆曲线 · 科学安排复习计划
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <StatCard stats={stats} loading={statsLoading} />

        {/* 筛选栏 */}
        <FilterBar
          subject={subject}
          itemType={itemType}
          status={status}
          dueOnly={dueOnly}
          total={total}
          onSubjectChange={(v) => {
            setSubject(v);
            setPage(1);
          }}
          onTypeChange={(v) => {
            setItemType(v);
            setPage(1);
          }}
          onStatusChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          onDueOnlyToggle={() => {
            setDueOnly(!dueOnly);
            setPage(1);
          }}
        />

        {/* 列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: '#6366F1' }}
            />
          </div>
        ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-xl glass-card">
               <BookOpen size={48} className="text-slate-500" />
               <p className="mt-4 text-lg font-medium text-white">
                  暂无复习内容
                </p>
                <p className="mt-1 text-sm text-slate-400">
                 在练习中标记不熟悉的内容会自动加入复习计划
               </p>
             </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  onMaster={handleMaster}
                  onDelete={handleDelete}
                  onReview={handleReview}
                />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(30, 27, 58, 0.8)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#E2E8F0',
                  }}
                >
                  上一页
                </button>
                <span className="text-sm px-4" style={{ color: '#94A3B8' }}>
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'rgba(30, 27, 58, 0.8)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#E2E8F0',
                  }}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
