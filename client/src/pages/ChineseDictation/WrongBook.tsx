import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { chineseDictationApi } from '@client/src/api';
import type { ChineseWrongCharacter } from '@shared/api.interface';

const STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'unmastered', label: '未掌握' },
  { value: 'learning', label: '学习中' },
  { value: 'mastered', label: '已掌握' },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  unmastered: { label: '未掌握', className: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  learning: { label: '学习中', className: 'bg-orange-500/15 text-orange-400 border border-orange-500/20' },
  mastered: { label: '已掌握', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
};

const PAGE_SIZE = 10;

const WrongBook: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ChineseWrongCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [masteringId, setMasteringId] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: { page: number; pageSize: number; status?: string } = {
        page,
        pageSize: PAGE_SIZE,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await chineseDictationApi.getWrongCharacters(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('加载错字本失败', err as Error);
      toast.error('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleMarkMastered = async (id: string): Promise<void> => {
    setMasteringId(id);
    try {
      await chineseDictationApi.markWrongCharacterMastered(id);
      toast.success('已标记为掌握');
      void loadData();
    } catch (err) {
      logger.error('标记掌握失败', err as Error);
      toast.error('操作失败，请重试');
    } finally {
      setMasteringId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getStatusInfo = (status: string) =>
    STATUS_MAP[status] || { label: status, className: 'bg-white/5 text-slate-400 border border-white/10' };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* 顶部栏 */}
      <div className="flex items-center gap-4">
        <button
          type="button"
           onClick={() => navigate('/chinese-dictation')}
           className="p-2 rounded-lg hover:bg-white/10 transition-colors"
           aria-label="返回"
         >
           <ChevronLeft className="w-5 h-5 text-slate-300" />
         </button>
         <h1 className="text-xl font-semibold text-white">我的错字本</h1>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${statusFilter === filter.value
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        </div>
      ) : items.length === 0 ? (
         <div className="text-center py-16 glass-card rounded-xl">
           <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
           <p className="text-slate-400">暂无错字记录</p>
         </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const statusInfo = getStatusInfo(item.masterStatus);
            return (
              <div
                key={item.id}
                 className="glass-card rounded-xl p-5
                   flex items-center gap-4"
              >
                {/* 左侧汉字 + 拼音 */}
                <div className="text-center min-w-[5rem]">
                   <div className="text-4xl font-bold text-white">{item.hanzi}</div>
                  <div className="text-sm text-[#FF6B35] mt-1">{item.pinyin}</div>
                </div>

                {/* 右侧信息 */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                     <span className="text-sm text-slate-400">
                       错误 <span className="text-red-400 font-medium">{item.wrongCount}</span> 次
                     </span>
                  </div>
                   <div className="text-sm text-slate-500">
                    最后错误：{formatDate(item.lastWrongAt)}
                  </div>
                </div>

                {/* 操作按钮 */}
                {item.masterStatus !== 'mastered' && (
                  <button
                    type="button"
                    onClick={() => handleMarkMastered(item.id)}
                    disabled={masteringId === item.id}
                     className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400
                       text-sm font-medium hover:bg-emerald-500/25 transition-colors border border-emerald-500/20
                       flex items-center gap-1.5
                       disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {masteringId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    已掌握
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
             className="px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-white/5 border border-white/10
               hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            上一页
          </button>
           <span className="text-sm text-slate-400 px-2">
            第 {page} / {totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
             className="px-3 py-1.5 rounded-lg text-sm text-slate-300 bg-white/5 border border-white/10
               hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default WrongBook;
