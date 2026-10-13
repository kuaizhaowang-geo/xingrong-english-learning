import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  Languages,
  BookMarked,
  Calculator,
  Sparkles,
  Share2,
  Lock,
  Clock,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { showConfirm } from '@lark-apaas/client-toolkit';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import TextbookDialog, {
  type UserTextbook,
  type CreateTextbookDto,
  type TextbookSubject,
} from './TextbookDialog';
import { useNavigate } from 'react-router-dom';

const SUBJECT_OPTIONS: {
  value: TextbookSubject;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { value: 'english', label: '英语', icon: Languages, color: '#2563EB' },
  { value: 'chinese', label: '语文', icon: BookMarked, color: '#EC4899' },
  { value: 'math', label: '数学', icon: Calculator, color: '#06B6D4' },
];

const SUBJECT_INFO: Record<
  TextbookSubject,
  { label: string; icon: LucideIcon; color: string; bgGradient: string }
> = {
  english: {
    label: '英语',
    icon: Languages,
    color: '#2563EB',
    bgGradient: 'from-blue-600/20 to-blue-900/10',
  },
  chinese: {
    label: '语文',
    icon: BookMarked,
    color: '#EC4899',
    bgGradient: 'from-pink-600/20 to-pink-900/10',
  },
  math: {
    label: '数学',
    icon: Calculator,
    color: '#06B6D4',
    bgGradient: 'from-cyan-600/20 to-cyan-900/10',
  },
};

const SHARE_STATUS_INFO: Record<
  UserTextbook['shareStatus'],
  { label: string; color: string; icon: LucideIcon }
> = {
  private: { label: '私有', color: '#6B7280', icon: Lock },
  pending: { label: '审核中', color: '#FBBF24', icon: Clock },
  public: { label: '已公开', color: '#06B6D4', icon: Eye },
};

const MyTextbooksPage: React.FC = () => {
  const navigate = useNavigate();
  const [textbooks, setTextbooks] = useState<UserTextbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<TextbookSubject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState<UserTextbook | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await axiosForBackend.get('/api/user-textbooks', {
        params: { pageSize: 100 },
      });
      const rawItems = res.data?.items || [];
      const mapped: UserTextbook[] = rawItems.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        name: String(item.name || ''),
        subject: item.subject as TextbookSubject,
        grade: String(item.grade || ''),
        version: String(item.version || ''),
        description: item.description ? String(item.description) : undefined,
        coverImage: item.coverImage ? String(item.coverImage) : undefined,
        unitCount: Number(item.unitCount || 0),
        wordCount: Number(item.wordCount || 0),
        sentenceCount: Number(item.sentenceCount || 0),
        shareStatus: (item.shareStatus || item.visibility || 'private') as UserTextbook['shareStatus'],
        createdAt: String(item.createdAt || ''),
        updatedAt: String(item.updatedAt || ''),
      }));
      setTextbooks(mapped);
    } catch (err) {
      logger.error('加载教材列表失败', { error: String(err) });
      toast.error('加载教材列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = textbooks.filter((tb: UserTextbook) => {
    if (subjectFilter !== 'all' && tb.subject !== subjectFilter) return false;
    if (searchQuery && !tb.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleOpenCreate = (): void => {
    setEditingTextbook(null);
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (tb: UserTextbook): void => {
    setEditingTextbook(tb);
    setShowCreateDialog(true);
  };

  const handleSubmit = async (data: CreateTextbookDto): Promise<void> => {
    setSubmitting(true);
    try {
      if (editingTextbook) {
        await axiosForBackend.patch(`/api/user-textbooks/${editingTextbook.id}`, data);
        toast.success('教材已更新');
      } else {
        const res = await axiosForBackend.post('/api/user-textbooks', data);
        toast.success('教材创建成功');
        // 跳转到编辑器页
        const id: string = res.data?.id;
        setShowCreateDialog(false);
        setSubmitting(false);
        if (id) {
          navigate(`/my-textbooks/${id}`);
        } else {
          loadData();
        }
        return;
      }
      setShowCreateDialog(false);
      loadData();
    } catch (err) {
      logger.error('保存教材失败', { error: String(err) });
      toast.error('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!await showConfirm('确定要删除这本教材吗？所有单元、单词和句子都会被删除，此操作不可恢复。')) return;
    try {
      await axiosForBackend.delete(`/api/user-textbooks/${id}`);
      toast.success('已删除');
      loadData();
    } catch (err) {
      logger.error('删除教材失败', { error: String(err) });
      toast.error('删除失败');
    }
  };

  const handleToggleShare = async (tb: UserTextbook): Promise<void> => {
    const isCurrentlyPublic = tb.shareStatus === 'public';
    const action = isCurrentlyPublic ? '取消公开' : '申请公开';
    if (!await showConfirm(
      isCurrentlyPublic
        ? '确定要取消公开吗？取消后其他用户将无法看到这本教材。'
        : '确定要申请公开吗？公开后需通过审核才能被其他用户看到。',
    )) return;

    try {
      if (isCurrentlyPublic) {
        await axiosForBackend.post(`/api/user-textbooks/${tb.id}/unshare`);
        toast.success('已取消公开');
      } else {
        await axiosForBackend.post(`/api/user-textbooks/${tb.id}/share`);
        toast.success('已提交公开申请，请等待审核');
      }
      loadData();
    } catch (err) {
      logger.error('切换分享状态失败', { error: String(err) });
      toast.error('操作失败');
    }
  };

  const handleEnterEditor = (id: string): void => {
    navigate(`/my-textbooks/${id}`);
  };

  const totalTextbooks = textbooks.length;
  const totalUnits = textbooks.reduce((sum: number, tb: UserTextbook) => sum + tb.unitCount, 0);
  const publicCount = textbooks.filter((tb: UserTextbook) => tb.shareStatus === 'public').length;

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.35)',
              }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">我的教材</h1>
              <p className="text-sm truncate" style={{ color: '#94A3B8' }}>
                {totalTextbooks} 本 · {totalUnits} 单元
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Plus className="w-4 h-4" />
            新建教材
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard icon={BookOpen} label="教材总数" value={totalTextbooks} iconColor="#6366F1" />
          <StatCard icon={BookMarked} label="单元总数" value={totalUnits} iconColor="#06B6D4" />
          <StatCard icon={Share2} label="已公开" value={publicCount} iconColor="#EC4899" />
        </div>

        {/* 筛选行 */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
          <div
            className="flex rounded-xl p-1 overflow-x-auto w-full sm:w-auto"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <FilterChip
              active={subjectFilter === 'all'}
              onClick={() => setSubjectFilter('all')}
              label="全部"
            />
            {SUBJECT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                active={subjectFilter === opt.value}
                onClick={() => setSubjectFilter(opt.value)}
                label={opt.label}
              />
            ))}
          </div>

          <div className="flex-1 min-w-0 sm:min-w-[200px] max-w-none sm:max-w-md w-full sm:w-auto">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Search className="w-4 h-4" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="搜索教材..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* 教材列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#6366F1' }} />
            <p className="text-white mb-2">还没有教材</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              点击「新建教材」创建你的第一本教材
            </p>
          </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((tb: UserTextbook) => {
              const subjectInfo = SUBJECT_INFO[tb.subject] || SUBJECT_INFO.english;
              const SubjectIcon = subjectInfo.icon;
              const shareKey = tb.shareStatus || 'private';
              const shareInfo = SHARE_STATUS_INFO[shareKey] || SHARE_STATUS_INFO.private;
              const ShareIcon = shareInfo.icon;

              return (
                <div
                  key={tb.id}
                  className="rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02] cursor-pointer group"
                   style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.08)',
                  }}
                  onClick={() => handleEnterEditor(tb.id)}
                >
                  {/* 封面区域 */}
                  <div
                    className="h-28 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br relative overflow-hidden"
                    style={{ background: subjectInfo.bgGradient }}
                  >
                    <SubjectIcon
                      className="w-12 h-12 opacity-50"
                      style={{ color: subjectInfo.color }}
                    />
                    <span
                      className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${subjectInfo.color}30`, color: subjectInfo.color }}
                    >
                      {subjectInfo.label}
                    </span>
                    <span
                      className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: `${shareInfo.color}20`, color: shareInfo.color }}
                    >
                      <ShareIcon className="w-3 h-3" />
                      {shareInfo.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold truncate flex-1 mr-2">{tb.name}</h3>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(tb); }}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors min-h-11 sm:min-h-0"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(tb.id); }}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-red-500/20 transition-colors min-h-11 sm:min-h-0"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {tb.grade && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {tb.grade}
                      </span>
                    )}
                    {tb.version && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {tb.version}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3" style={{ color: '#94A3B8' }}>
                    <span>{tb.unitCount} 单元</span>
                    <span>{tb.wordCount} 词</span>
                    <span>{tb.sentenceCount} 句</span>
                  </div>

                  {tb.description && (
                    <p
                      className="text-xs line-clamp-2 mb-3"
                      style={{ color: '#64748B' }}
                    >
                      {tb.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#64748B' }}>
                      {formatDate(tb.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleShare(tb); }}
                      className="flex items-center justify-center gap-1 px-3 py-2 min-h-11 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: tb.shareStatus === 'public'
                          ? 'rgba(34, 211, 238, 0.2)'
                          : 'rgba(99, 102, 241, 0.12)',
                        color: tb.shareStatus === 'public' ? '#06B6D4' : '#6366F1',
                        border: `1px solid ${tb.shareStatus === 'public' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`,
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                      {tb.shareStatus === 'public' ? '已公开' : '分享'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建/编辑教材弹窗 */}
      <TextbookDialog
        open={showCreateDialog}
        editingTextbook={editingTextbook}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, iconColor }) => {
  return (
     <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: `${iconColor}20`,
          boxShadow: `0 0 20px ${iconColor}30`,
        }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm" style={{ color: '#94A3B8' }}>{label}</div>
      </div>
    </div>
  );
};

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
      style={{
        background: active ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' : 'transparent',
        color: active ? 'white' : '#94A3B8',
      }}
    >
      {label}
    </button>
  );
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default MyTextbooksPage;
