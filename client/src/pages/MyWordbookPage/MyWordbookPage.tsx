import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  Play,
  Star,
  Clock,
  Target,
  FileText,
  GraduationCap,
  Sparkles,
  BookMarked,
  Languages,
  Calculator,
  type LucideIcon,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import WordbookDetail from './components/WordbookDetail';
import WordbookDialog from './components/WordbookDialog';
import type {
  UserWordbook,
  WordbookSubject,
  WordbookContentType,
  CreateWordbookDto,
} from '@shared/api.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

type ViewMode = 'list' | 'detail';

interface StatsData {
  totalWordbooks: number;
  totalItems: number;
  studiedItems: number;
}

const SUBJECT_OPTIONS: {
  value: WordbookSubject;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { value: 'english', label: '英语', icon: Languages, color: '#2563EB' },
  { value: 'chinese', label: '语文', icon: BookMarked, color: '#EC4899' },
  { value: 'math', label: '数学', icon: Calculator, color: '#06B6D4' },
];

const SUBJECT_INFO: Record<WordbookSubject, { label: string; icon: LucideIcon; color: string; bgGradient: string }> = {
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

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '生字',
  phrase: '词语',
  formula: '公式',
  question: '题目',
};

const MyWordbookPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedWordbookId, setSelectedWordbookId] = useState<string | null>(null);
  const [wordbooks, setWordbooks] = useState<UserWordbook[]>([]);
  const [stats, setStats] = useState<StatsData>({ totalWordbooks: 0, totalItems: 0, studiedItems: 0 });
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<WordbookSubject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWordbook, setEditingWordbook] = useState<UserWordbook | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        wordbookApi.getWordbooks({ pageSize: 100 }),
        wordbookApi.getOverviewStats(),
      ]);
      setWordbooks(listRes.items);
      setStats(statsRes);
    } catch (err) {
      logger.error('加载词库失败', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWordbooks = wordbooks.filter((wb: UserWordbook) => {
    if (subjectFilter !== 'all' && wb.subject !== subjectFilter) return false;
    if (searchQuery && !wb.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleOpenCreate = (): void => {
    setEditingWordbook(null);
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (wb: UserWordbook): void => {
    setEditingWordbook(wb);
    setShowCreateDialog(true);
  };

  const handleSubmit = async (data: CreateWordbookDto): Promise<void> => {
    setSubmitting(true);
    try {
      if (editingWordbook) {
        await wordbookApi.updateWordbook(editingWordbook.id, {
          name: data.name,
          description: data.description,
        });
      } else {
        await wordbookApi.createWordbook(data);
      }
      setShowCreateDialog(false);
      loadData();
    } catch (err) {
      logger.error('保存词库失败', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!await showConfirm('确定要删除这个词库吗？此操作不可恢复。')) return;
    try {
      await wordbookApi.deleteWordbook(id);
      loadData();
    } catch (err) {
      logger.error('删除词库失败', { error: String(err) });
    }
  };

  const handleEnterDetail = (id: string): void => {
    setSelectedWordbookId(id);
    setView('detail');
  };

  const handleBackToList = (): void => {
    setView('list');
    setSelectedWordbookId(null);
    loadData();
  };

  if (view === 'detail' && selectedWordbookId) {
    return (
      <div className="min-h-screen">
        <WordbookDetail
          wordbookId={selectedWordbookId}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
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
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">我的词库</h1>
              <p className="text-sm truncate" style={{ color: '#94A3B8' }}>个人学习资产管理中心</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            icon={BookOpen}
            label="总词库数"
            value={stats.totalWordbooks}
            gradient="from-violet-600 to-purple-800"
            iconColor="#6366F1"
          />
          <StatCard
            icon={FileText}
            label="总内容数"
            value={stats.totalItems}
            gradient="from-cyan-600 to-blue-800"
            iconColor="#06B6D4"
          />
          <StatCard
            icon={GraduationCap}
            label="已学习内容数"
            value={stats.studiedItems}
            gradient="from-pink-600 to-purple-800"
            iconColor="#EC4899"
          />
        </div>

        {/* 筛选行 */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
           <div className="flex rounded-xl p-1 overflow-x-auto w-full sm:w-auto" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
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
                placeholder="搜索词库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-gray-500"
              />
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
            新建词库
          </button>
        </div>

        {/* 词库列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : filteredWordbooks.length === 0 ? (
          <div
             className="rounded-xl p-12 text-center"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#6366F1' }} />
            <p className="text-white mb-2">还没有词库</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              点击「新建词库」创建你的第一个学习词库
            </p>
          </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredWordbooks.map((wb: UserWordbook) => {
              const subjectInfo = SUBJECT_INFO[wb.subject];
              const SubjectIcon = subjectInfo.icon;
              const progress = wb.itemCount > 0 ? (wb.studiedCount / wb.itemCount) * 100 : 0;

              return (
                <div
                  key={wb.id}
                  className="rounded-xl p-4 sm:p-5 transition-all hover:scale-[1.02] cursor-pointer group"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.08)',
                  }}
                  onClick={() => handleEnterDetail(wb.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br"
                      style={{ background: subjectInfo.bgGradient }}
                    >
                      <SubjectIcon className="w-5 h-5" style={{ color: subjectInfo.color }} />
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(wb); }}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors min-h-11 sm:min-h-0"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(wb.id); }}
                        className="p-2 sm:p-1.5 rounded-lg hover:bg-red-500/20 transition-colors min-h-11 sm:min-h-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-semibold mb-1 truncate">{wb.name}</h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${subjectInfo.color}20`, color: subjectInfo.color }}
                    >
                      {subjectInfo.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {CONTENT_TYPE_LABEL[wb.contentType]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: '#94A3B8' }}>
                      {wb.itemCount} 条内容
                    </span>
                    <span className="flex items-center gap-1" style={{ color: '#94A3B8' }}>
                      <Target className="w-3.5 h-3.5" />
                      {wb.correctRate.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#94A3B8' }}>
                    <span>学习进度 {progress.toFixed(0)}%</span>
                    <span>{wb.studiedCount}/{wb.itemCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#64748B' }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{wb.lastStudyTime ? formatDate(wb.lastStudyTime) : '未学习'}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEnterDetail(wb.id); }}
                      className="flex items-center justify-center gap-1 px-3 py-2 min-h-11 rounded-lg text-xs font-medium text-white transition-all hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                      }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      学习
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建/编辑词库弹窗 */}
      <WordbookDialog
        open={showCreateDialog}
        editingWordbook={editingWordbook}
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
  gradient: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, iconColor }) => {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{
        background: '#FFFFFF',
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

export default MyWordbookPage;
