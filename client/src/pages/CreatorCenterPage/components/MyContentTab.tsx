import React, { useState, useEffect } from 'react';
import { Edit, BarChart3, ArrowDownCircle, RefreshCw, Clock, Eye, BookOpen } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { creatorApi } from '@client/src/api';
import type { WordbookStatus, WordbookSubject, WordbookContentType } from '@shared/api.interface';
import type { CreatorContentItem } from '@client/src/api/creator';

const STATUS_FILTERS: { value: WordbookStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'removed', label: '已下架' },
];

const STATUS_STYLE: Record<WordbookStatus, { bg: string; color: string; label: string }> = {
  draft: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', label: '草稿' },
  pending: { bg: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', label: '审核中' },
  approved: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', label: '已通过' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', label: '已拒绝' },
  removed: { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280', label: '已下架' },
};

const SUBJECT_LABEL: Record<WordbookSubject, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '生字',
  phrase: '词语',
  formula: '公式',
  question: '题目',
};

const MyContentTab: React.FC = () => {
  const [filter, setFilter] = useState<WordbookStatus | 'all'>('all');
  const [items, setItems] = useState<CreatorContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const loadContent = async (): Promise<void> => {
    setLoading(true);
    try {
      const params: { status?: WordbookStatus | 'all' } = {};
      if (filter !== 'all') params.status = filter;
      const res = await creatorApi.getMyContent(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('加载我的内容失败', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filter]);

  const handleAction = (action: string, id: string): void => {
    logger.debug(`创作者操作: ${action}`, { id });
  };

  return (
    <div>
      {/* 筛选 */}
      <div
        className="flex flex-wrap rounded-xl p-1 mb-6 gap-1"
        style={{ background: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="flex-1 min-w-[80px] px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === f.value
                ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                : 'transparent',
              color: filter === f.value ? 'white' : '#94A3B8',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: '#94A3B8' }}>
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: '#6366F1' }} />
          <p className="text-white mb-2">暂无内容</p>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            去创建你的第一个词库吧
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: CreatorContentItem) => {
            const style = STATUS_STYLE[item.status];
            return (
              <div
                key={item.id}
                className="rounded-xl p-4 transition-all hover:scale-[1.005]"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{item.name}</h3>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#94A3B8' }}>
                      <span>{SUBJECT_LABEL[item.subject]}</span>
                      <span>·</span>
                      <span>{CONTENT_TYPE_LABEL[item.contentType]}</span>
                      <span>·</span>
                      <span>{item.itemCount} 条内容</span>
                    </div>
                    {item.auditNote && item.status === 'rejected' && (
                      <div
                        className="mt-2 text-xs px-3 py-2 rounded-lg"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#F87171',
                        }}
                      >
                        审核意见：{item.auditNote}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-white font-medium">{item.learnCount}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>学习</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{item.likeCount}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>点赞</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-white font-medium">{item.favoriteCount}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>收藏</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction('edit', item.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: '#94A3B8' }}
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction('stats', item.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: '#06B6D4' }}
                      title="查看数据"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    {item.status === 'approved' ? (
                      <button
                        onClick={() => handleAction('remove', item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400"
                        title="下架"
                      >
                        <ArrowDownCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('resubmit', item.id)}
                        className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors"
                        style={{ color: '#6366F1' }}
                        title="重新提交"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.08)' }}>
                  <Clock className="w-3 h-3" style={{ color: '#64748B' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    提交时间：{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '未提交'}
                  </span>
                  <Eye className="w-3 h-3 ml-3" style={{ color: '#64748B' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    创建于 {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <div className="text-center mt-4 text-sm" style={{ color: '#94A3B8' }}>
          共 {total} 条内容
        </div>
      )}
    </div>
  );
};

export default MyContentTab;
