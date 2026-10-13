import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ImageOff,
  Upload,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Label } from '@client/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@client/src/components/ui/pagination';
import * as adminApi from '@client/src/api/admin';
import type { AdminSentenceItem, Textbook, TextbookUnit } from '@shared/api.interface';
import SentenceFormDialog from './SentenceFormDialog';
import SentenceBatchImportDialog from './SentenceBatchImportDialog';

const AdminSentencesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<AdminSentenceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);

  const [filterTextbookId, setFilterTextbookId] = useState<string>('');
  const [filterUnitId, setFilterUnitId] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminSentenceItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [batchOpen, setBatchOpen] = useState<boolean>(false);

  const fetchSentences = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filterTextbookId) params.textbookId = filterTextbookId;
      if (filterUnitId) params.unitId = filterUnitId;
      if (filterKeyword) params.keyword = filterKeyword;
      const data = await adminApi.getSentences(params);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      logger.error('Failed to fetch sentences', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterTextbookId, filterUnitId, filterKeyword]);

  const fetchTextbooks = useCallback(async (): Promise<void> => {
    try {
      const data = await adminApi.getTextbooks({ page: 1, pageSize: 100 });
      const list = Array.isArray((data as unknown as Record<string, unknown>).items)
        ? ((data as unknown as Record<string, unknown>).items as Textbook[])
        : (data as unknown as Textbook[]);
      setTextbooks(list);
    } catch (err) {
      logger.error('Failed to fetch textbooks', { error: String(err) });
    }
  }, []);

  const fetchUnits = useCallback(async (textbookId: string): Promise<void> => {
    if (!textbookId) {
      setUnits([]);
      return;
    }
    try {
      const list = await adminApi.getUnits(textbookId);
      setUnits(list ?? []);
    } catch (err) {
      logger.error('Failed to fetch units', { error: String(err) });
    }
  }, []);

  useEffect(() => {
    fetchTextbooks();
  }, [fetchTextbooks]);

  useEffect(() => {
    fetchSentences();
  }, [fetchSentences]);

  useEffect(() => {
    fetchUnits(filterTextbookId);
    setFilterUnitId('');
  }, [filterTextbookId, fetchUnits]);

  const handleSearch = (): void => {
    setPage(1);
    fetchSentences();
  };

  const handleAdd = (): void => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (item: AdminSentenceItem): void => {
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: AdminSentenceItem): void => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteSentence(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchSentences();
    } catch (err) {
      logger.error('Failed to delete sentence', { error: String(err) });
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderPaginationItems = (): React.ReactNode => {
    const pages: React.ReactNode[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i += 1) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => setPage(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    return pages;
  };

  return (
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 顶部标题 + 操作 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">句子管理</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBatchOpen(true)}>
            <Upload size={16} />
            批量导入
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            新增句子
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <Label className="text-sm text-slate-300">教材</Label>
            <Select value={filterTextbookId} onValueChange={setFilterTextbookId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部教材" />
              </SelectTrigger>
              <SelectContent>
                {textbooks.map((tb: Textbook) => (
                  <SelectItem key={tb.id} value={tb.id}>
                    {tb.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <Label className="text-sm text-slate-300">单元</Label>
            <Select
              value={filterUnitId}
              onValueChange={setFilterUnitId}
              disabled={!filterTextbookId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部单元" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u: TextbookUnit) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
            <Label className="text-sm text-slate-300">关键词</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索英文句子或中文翻译"
                value={filterKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilterKeyword(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button onClick={handleSearch}>
                <Search size={16} />
                搜索
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格区 */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-[280px]">英文句子</TableHead>
                <TableHead className="max-w-[200px]">中文翻译</TableHead>
                <TableHead>逐词数</TableHead>
                <TableHead>所属教材</TableHead>
                <TableHead>所属单元</TableHead>
                <TableHead>插图</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                     暂无数据
                   </TableCell>
                </TableRow>
              ) : (
                items.map((item: AdminSentenceItem) => (
                  <TableRow key={item.id}>
                     <TableCell className="text-white max-w-[280px] truncate">
                       {item.sentence}
                     </TableCell>
                     <TableCell className="text-slate-300 max-w-[200px] truncate">
                       {item.translation}
                     </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(item.wordParses ?? []).length}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-slate-400">
                       {item.textbookTitle ?? '-'}
                     </TableCell>
                     <TableCell className="text-slate-400">
                       {item.unitTitle ?? '-'}
                     </TableCell>
                    <TableCell>
                       {item.imageUrl ? (
                         <span className="flex items-center gap-1 text-teal-400 text-xs">
                           <ImageIcon size={14} /> 有
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-slate-500 text-xs">
                           <ImageOff size={14} /> 无
                         </span>
                       )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-7 px-2 text-[#4361EE] hover:text-[#4361EE]"
                        >
                          <Edit2 size={14} />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          className="h-7 px-2 text-[#EF476F] hover:text-[#EF476F]"
                        >
                          <Trash2 size={14} />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* 分页 */}
        {!loading && total > 0 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              共 {total} 条，第 {page} / {totalPages} 页
            </div>
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {page > 3 && totalPages > 7 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                    </PaginationItem>
                    {page > 4 && <PaginationEllipsis />}
                  </>
                )}
                {renderPaginationItems()}
                {page < totalPages - 2 && totalPages > 7 && (
                  <>
                    {page < totalPages - 3 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p: number) => Math.min(totalPages, p + 1))
                    }
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* 新增/编辑句子弹窗 */}
      <SentenceFormDialog
        open={formOpen}
        sentenceId={editingId}
        textbooks={textbooks}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchSentences();
        }}
      />

      {/* 删除确认弹窗 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该句子吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SentenceBatchImportDialog
        open={batchOpen}
        textbooks={textbooks}
        onClose={() => setBatchOpen(false)}
        onSuccess={() => {
          setBatchOpen(false);
          fetchSentences();
        }}
      />
    </div>
  );
};

export default AdminSentencesPage;
