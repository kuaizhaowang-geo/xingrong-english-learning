import React, { useState, useMemo, useEffect } from 'react';
import { BookX, Smile } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@client/src/components/ui/alert-dialog';
import { axiosForBackend } from '@client/src/api';
import type { WrongSentenceItem, MasterStatus } from '@shared/api.interface';
import WrongCategoryTabs from './WrongCategoryTabs';
import WrongBookFilterBar from './WrongBookFilterBar';
import WrongBookEmpty from './WrongBookEmpty';
import BatchActionBar from './BatchActionBar';
import SentenceWrongItem from './SentenceWrongItem';

type SentenceCategory = 'wrong' | 'unfamiliar' | 'mastered';

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: 'frequent', label: '错误次数>3' },
];

const sortOptions = [
  { value: 'attempts_desc', label: '按错误次数降序' },
  { value: 'recent_error', label: '按最近错误时间' },
  { value: 'added_desc', label: '按添加时间' },
];

const SentenceWrongBook: React.FC = () => {
  const [category, setCategory] = useState<SentenceCategory>('wrong');
  const [items, setItems] = useState<WrongSentenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('attempts_desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'batch-delete' | 'batch-master' | 'batch-unfamiliar' | 'delete-single' | 'clear-all';
    targetId?: string;
  } | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setLoading(true);
        const [unfamiliarRes, masteredRes] = await Promise.all([
          axiosForBackend.get('/api/wrong-book/sentences', { params: { status: 'unfamiliar' } }),
          axiosForBackend.get('/api/wrong-book/sentences', { params: { status: 'mastered' } }),
        ]);
        setItems([
          ...(unfamiliarRes.data as WrongSentenceItem[]),
          ...(masteredRes.data as WrongSentenceItem[]),
        ]);
      } catch (err) {
        logger.error('加载句子错题本失败', err as Error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const wrongCount = items.filter((i) => i.masterStatus === 'unfamiliar' && i.attempts >= 2).length;
  const unfamiliarCount = items.filter((i) => i.masterStatus === 'unfamiliar').length;
  const masteredCount = items.filter((i) => i.masterStatus === 'mastered').length;

  const displayItems = useMemo(() => {
    let list = items;
    if (category === 'wrong') list = list.filter((i) => i.masterStatus === 'unfamiliar' && i.attempts >= 2);
    else if (category === 'unfamiliar') list = list.filter((i) => i.masterStatus === 'unfamiliar');
    else list = list.filter((i) => i.masterStatus === 'mastered');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.sentence?.sentence?.toLowerCase().includes(q) ||
          i.sentence?.translation?.includes(q),
      );
    }

    if (filter === '7d' || filter === '30d') {
      const days = filter === '7d' ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      list = list.filter(
        (i) =>
          new Date((i as unknown as { updatedAt?: string }).updatedAt || Date.now()).getTime() >= cutoff,
      );
    } else if (filter === 'frequent') {
      list = list.filter((i) => i.attempts > 3);
    }

    list = [...list];
    if (sortBy === 'attempts_desc') list.sort((a, b) => b.attempts - a.attempts);
    else if (sortBy === 'recent_error') {
      list.sort((a, b) => {
        const da = new Date((a as unknown as { updatedAt?: string }).updatedAt || 0).getTime();
        const db = new Date((b as unknown as { updatedAt?: string }).updatedAt || 0).getTime();
        return db - da;
      });
    }
    return list;
  }, [items, category, searchQuery, filter, sortBy]);

  const allSelected = displayItems.length > 0 && selectedIds.size === displayItems.length;
  const isMastered = category === 'mastered';

  const toggleSelectAll = (): void => {
    setSelectedIds(allSelected ? new Set() : new Set(displayItems.map((i) => i.id)));
  };

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStatusChange = async (id: string, newStatus: MasterStatus): Promise<void> => {
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      await axiosForBackend.patch(`/api/wrong-book/sentences/${item.puzzleId}/status`, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, masterStatus: newStatus } : i)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      logger.error('更新句子状态失败', err as Error);
    }
  };

  const handleBatchDelete = async (ids: string[]): Promise<void> => {
    try {
      const puzzleIds = items.filter((i) => ids.includes(i.id)).map((i) => i.puzzleId);
      await axiosForBackend.delete('/api/wrong-book/sentences', { data: { puzzleIds } });
      setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
    } catch (err) {
      logger.error('删除句子失败', err as Error);
    }
  };

  const handleDeleteSingle = async (id: string): Promise<void> => {
    await handleBatchDelete([id]);
  };

  const handleBatchAction = (type: 'batch-master' | 'batch-unfamiliar' | 'batch-delete'): void => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({ type });
  };

  const confirmAction = (): void => {
    const ids = Array.from(selectedIds);
    if (!confirmDialog) return;
    if (confirmDialog.type === 'batch-delete') void handleBatchDelete(ids);
    else if (confirmDialog.type === 'batch-master') ids.forEach((id) => void handleStatusChange(id, 'mastered'));
    else if (confirmDialog.type === 'batch-unfamiliar') ids.forEach((id) => void handleStatusChange(id, 'unfamiliar'));
    setSelectedIds(new Set());
    setConfirmDialog(null);
  };

  const getDialogText = (): { title: string; desc: string; danger: boolean } => {
    if (!confirmDialog) return { title: '', desc: '', danger: false };
    const count = selectedIds.size;
    switch (confirmDialog.type) {
      case 'batch-delete': return { title: '批量删除确认', desc: `确定要删除选中的 ${count} 条句子吗？`, danger: true };
      case 'batch-master': return { title: '批量标记已掌握', desc: `确定要将选中的 ${count} 条句子标记为已掌握吗？`, danger: false };
      case 'batch-unfamiliar': return { title: '批量移出错题本', desc: `确定要将选中的 ${count} 条句子移出错题本吗？`, danger: false };
      case 'delete-single': return { title: '删除确认', desc: '确定要删除这条句子吗？', danger: true };
      case 'clear-all': return { title: '清空确认', desc: '确定要清空列表中的全部句子吗？', danger: true };
      default: return { title: '', desc: '', danger: false };
    }
  };

  const dialog = getDialogText();

  return (
    <div className="space-y-4">
      <WrongCategoryTabs
        category={category}
        onChange={(cat) => { setCategory(cat); setSelectedIds(new Set()); }}
        type="sentence"
        wrongCount={wrongCount}
        unfamiliarCount={unfamiliarCount}
        masteredCount={masteredCount}
        totalCount={displayItems.length}
      />

      <WrongBookFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
      />

       <div className="glass-card rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={allSelected} aria-label="全选" onCheckedChange={toggleSelectAll} />
           <span className="text-sm text-slate-300">
            {selectedIds.size > 0 ? `已选 ${selectedIds.size} 条` : '全选'}
          </span>
        </div>
        <button
          onClick={() => setConfirmDialog({ type: 'clear-all' })}
           className="text-sm text-slate-400 hover:text-pink-400 flex items-center gap-1 transition-colors"
        >
          <BookX className="w-4 h-4" />
          清空全部
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i: number) => (
             <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
               <div className="bg-fuchsia-500/20 h-5 rounded w-2/3 mb-2" />
               <div className="bg-fuchsia-500/15 h-4 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <WrongBookEmpty category={category} type="sentence" icon={<Smile className="w-10 h-10 text-emerald-400" />} />
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => (
            <SentenceWrongItem
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              showWrongBadge={category === 'wrong'}
              onToggleSelect={toggleSelect}
              onStatusChange={(id, s) => void handleStatusChange(id, s)}
              onDelete={(id) => setConfirmDialog({ type: 'delete-single', targetId: id })}
              isMastered={isMastered}
            />
          ))}
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedIds.size}
        category={category}
        onBatchMaster={() => handleBatchAction('batch-master')}
        onBatchUnfamiliar={() => handleBatchAction('batch-unfamiliar')}
        onBatchAddPlan={() => handleBatchAction('batch-master')}
        onBatchDelete={() => handleBatchAction('batch-delete')}
      />

      <AlertDialog open={!!confirmDialog} onOpenChange={(open: boolean) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className={dialog.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                if (confirmDialog?.type === 'delete-single' && confirmDialog.targetId) {
                  void handleDeleteSingle(confirmDialog.targetId);
                  setConfirmDialog(null);
                } else if (confirmDialog?.type === 'clear-all') {
                  void handleBatchDelete(displayItems.map((i) => i.id));
                  setSelectedIds(new Set());
                  setConfirmDialog(null);
                } else {
                  confirmAction();
                }
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SentenceWrongBook;
