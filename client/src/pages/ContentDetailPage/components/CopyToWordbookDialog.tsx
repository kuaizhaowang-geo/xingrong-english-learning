import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Star,
  BookPlus,
  Plus,
  Check,
  BookMarked,
  Loader2,
  Copy,
} from 'lucide-react';
import { wordbookApi } from '@client/src/api';
import type { UserWordbook, WordbookSubject } from '@shared/api.interface';

interface CopyToWordbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: WordbookSubject;
  itemCount: number;
  onConfirm: (data: { wordbookId?: string; wordbookName?: string }) => void;
  loading?: boolean;
}

const CopyToWordbookDialog: React.FC<CopyToWordbookDialogProps> = ({
  open,
  onOpenChange,
  subject,
  itemCount,
  onConfirm,
  loading = false,
}) => {
  const [wordbooks, setWordbooks] = useState<UserWordbook[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedId('');
      setShowCreate(false);
      setNewName('');
      return;
    }
    const fetchWordbooks = async (): Promise<void> => {
      setListLoading(true);
      try {
        const res = await wordbookApi.getWordbooks({ subject, pageSize: 100 });
        setWordbooks(res.items || []);
        if (res.items?.length === 1) setSelectedId(res.items[0].id);
      } catch (err) {
        logger.error('加载词库列表失败', err as Error);
        toast.error('加载词库失败');
      } finally {
        setListLoading(false);
      }
    };
    fetchWordbooks();
  }, [open, subject]);

  const handleCreate = async (): Promise<void> => {
    if (!newName.trim()) {
      toast.error('请输入词库名称');
      return;
    }
    setCreating(true);
    try {
      const created = await wordbookApi.createWordbook({
        name: newName.trim(),
        subject,
        contentType: 'word',
      });
      setWordbooks((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setShowCreate(false);
      setNewName('');
      toast.success('词库创建成功');
    } catch (err) {
      logger.error('创建词库失败', err as Error);
      toast.error('创建词库失败');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = (): void => {
    if (showCreate && newName.trim()) {
      onConfirm({ wordbookName: newName.trim() });
      return;
    }
    if (!selectedId) {
      toast.error('请选择一个词库');
      return;
    }
    onConfirm({ wordbookId: selectedId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md bg-[#FFFFFF]/95 backdrop-blur-xl
          border border-violet-500/30 shadow-2xl shadow-violet-500/20
          text-slate-100 rounded-2xl overflow-hidden
        "
      >
        <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Copy size={18} className="text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-cyan-300">
              收藏到我的词库
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            将 {itemCount} 条内容复制到您的词库中
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {listLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" />加载中...
              </div>
            ) : wordbooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <BookMarked size={28} className="mb-2 opacity-40" />
                <p className="text-sm">还没有词库，先创建一个吧</p>
              </div>
            ) : (
              wordbooks.map((wb) => {
                const selected = selectedId === wb.id;
                return (
                  <button
                    key={wb.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(wb.id);
                      setShowCreate(false);
                    }}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                      'border transition-all duration-200 text-left',
                      selected
                        ? 'bg-violet-500/20 border-violet-400/60 shadow-lg shadow-violet-500/10'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-violet-500/40 hover:bg-slate-800/70',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        selected
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                          : 'bg-slate-700/50 text-slate-400',
                      ].join(' ')}
                    >
                      <BookMarked
                        size={16}
                        className={selected ? 'text-white' : ''}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {wb.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {wb.itemCount} 个条目
                      </div>
                    </div>
                    {selected && (
                      <Check size={18} className="text-violet-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {showCreate ? (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-violet-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm text-violet-300">
                <BookPlus size={16} />
                <span>创建新词库</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewName(e.target.value)
                  }
                  placeholder="输入词库名称"
                  className="bg-slate-900/60 border-slate-700 text-sm h-9 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white h-9 px-4 shadow-lg shadow-violet-500/20"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    '创建'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowCreate(true);
                setSelectedId('');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-violet-500/40 text-violet-300 text-sm hover:bg-violet-500/10 hover:border-violet-400/60 transition-all"
            >
              <Plus size={16} />
              创建新词库
            </button>
          )}
        </div>

        <DialogFooter className="relative">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading ||
              (!selectedId && !(showCreate && newName.trim()))
            }
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />复制中
              </>
            ) : (
              <>
                <Star size={16} className="mr-2" />
                复制到词库
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyToWordbookDialog;
