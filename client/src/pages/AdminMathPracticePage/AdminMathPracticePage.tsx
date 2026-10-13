import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  Upload,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
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
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
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
import type {
  AdminMathPracticeItem,
  AdminMathTopicItem,
  Textbook,
  TextbookUnit,
} from '@shared/api.interface';
import MathPracticeFormDialog from './MathPracticeFormDialog';

const ITEM_TYPE_OPTIONS = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'judge', label: '判断题' },
  { value: 'short_answer', label: '简答题' },
];

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '简单' },
  { value: '2', label: '中等' },
  { value: '3', label: '困难' },
];

const AdminMathPracticePage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<AdminMathPracticeItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [topics, setTopics] = useState<AdminMathTopicItem[]>([]);

  // filters
  const [filterTextbookId, setFilterTextbookId] = useState<string>('');
  const [filterUnitId, setFilterUnitId] = useState<string>('');
  const [filterTopicId, setFilterTopicId] = useState<string>('');
  const [filterItemType, setFilterItemType] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  // dialog states
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminMathPracticeItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // batch import state
  const [batchTextbookId, setBatchTextbookId] = useState<string>('');
  const [batchUnitId, setBatchUnitId] = useState<string>('');
  const [batchTopicId, setBatchTopicId] = useState<string>('');
  const [batchUnits, setBatchUnits] = useState<TextbookUnit[]>([]);
  const [batchTopics, setBatchTopics] = useState<AdminMathTopicItem[]>([]);
  const [batchJsonText, setBatchJsonText] = useState<string>('');
  const [batchImporting, setBatchImporting] = useState<boolean>(false);

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      };
      if (filterTextbookId) params.textbookId = filterTextbookId;
      if (filterUnitId) params.unitId = filterUnitId;
      if (filterTopicId) params.topicId = filterTopicId;
      if (filterItemType) params.itemType = filterItemType;
      if (filterDifficulty) params.difficulty = Number(filterDifficulty);
      if (filterKeyword) params.keyword = filterKeyword;
      const data = await adminApi.getMathPracticeItems(
        params as Parameters<typeof adminApi.getMathPracticeItems>[0],
      );
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      logger.error('Failed to fetch math practice items', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterTextbookId, filterUnitId, filterTopicId, filterItemType, filterDifficulty, filterKeyword]);

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

  const fetchTopics = useCallback(async (textbookId: string, unitId: string): Promise<void> => {
    if (!textbookId || !unitId) {
      setTopics([]);
      return;
    }
    try {
      const data = await adminApi.getMathTopics({
        textbookId,
        unitId,
        page: 1,
        pageSize: 200,
      });
      setTopics(data.items ?? []);
    } catch (err) {
      logger.error('Failed to fetch math topics', { error: String(err) });
    }
  }, []);

  useEffect(() => {
    fetchTextbooks();
  }, [fetchTextbooks]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchUnits(filterTextbookId);
    setFilterUnitId('');
    setTopics([]);
    setFilterTopicId('');
  }, [filterTextbookId, fetchUnits]);

  useEffect(() => {
    fetchTopics(filterTextbookId, filterUnitId);
    setFilterTopicId('');
  }, [filterUnitId, filterTextbookId, fetchTopics]);

  const handleSearch = (): void => {
    setPage(1);
    fetchItems();
  };

  const handleAdd = (): void => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (item: AdminMathPracticeItem): void => {
    setEditingId(item.id);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: AdminMathPracticeItem): void => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteMathPracticeItem(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      logger.error('Failed to delete math practice item', { error: String(err) });
    } finally {
      setDeleting(false);
    }
  };

  // batch import handlers
  const handleBatchTextbookChange = (val: string): void => {
    setBatchTextbookId(val);
    setBatchUnitId('');
    setBatchTopicId('');
    setBatchTopics([]);
    if (val) {
      adminApi
        .getUnits(val)
        .then((list: TextbookUnit[]) => {
          setBatchUnits(list ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch units for batch', { error: String(err) });
        });
    } else {
      setBatchUnits([]);
    }
  };

  const handleBatchUnitChange = (val: string): void => {
    setBatchUnitId(val);
    setBatchTopicId('');
    if (batchTextbookId && val) {
      adminApi
        .getMathTopics({
          textbookId: batchTextbookId,
          unitId: val,
          page: 1,
          pageSize: 200,
        })
        .then((data: { items: AdminMathTopicItem[] }) => {
          setBatchTopics(data.items ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch topics for batch', { error: String(err) });
        });
    } else {
      setBatchTopics([]);
    }
  };

  const handleBatchImport = async (): Promise<void> => {
    if (!batchJsonText.trim()) return;
    let parsedItems: Array<Record<string, unknown>> = [];
    try {
      const parsed = JSON.parse(batchJsonText);
      if (Array.isArray(parsed)) {
        parsedItems = parsed;
      } else {
        return;
      }
    } catch {
      return;
    }
    if (parsedItems.length === 0) return;

    setBatchImporting(true);
    try {
      const practiceItems = parsedItems.map((it: Record<string, unknown>) => ({
        question: String(it.question ?? ''),
        correctAnswer: String(it.correctAnswer ?? ''),
        options: Array.isArray(it.options) ? it.options : undefined,
        solution: it.solution ? String(it.solution) : undefined,
        difficulty: it.difficulty !== undefined ? Number(it.difficulty) : undefined,
        itemOrder: it.itemOrder !== undefined ? Number(it.itemOrder) : undefined,
        itemType: it.itemType ? String(it.itemType) : undefined,
        grade: it.grade ? String(it.grade) : undefined,
        semester: it.semester ? String(it.semester) : undefined,
        knowledgePoint: it.knowledgePoint ? String(it.knowledgePoint) : undefined,
        textbookId: batchTextbookId || String(it.textbookId ?? ''),
        unitId: batchUnitId || String(it.unitId ?? ''),
        topicId: batchTopicId || String(it.topicId ?? ''),
      })).filter((t: { question: string; correctAnswer: string; topicId: string; textbookId: string; unitId: string }) =>
        t.question && t.correctAnswer && t.topicId && t.textbookId && t.unitId,
      );

      await adminApi.batchCreateMathPracticeItems({
        textbookId: batchTextbookId || undefined,
        unitId: batchUnitId || undefined,
        topicId: batchTopicId || undefined,
        items: practiceItems as Array<Partial<AdminMathPracticeItem> & {
          question: string;
          correctAnswer: string;
        }>,
      });
      setBatchOpen(false);
      setBatchJsonText('');
      fetchItems();
    } catch (err) {
      logger.error('Failed to batch import math practice items', { error: String(err) });
    } finally {
      setBatchImporting(false);
    }
  };

  const resetBatchDialog = (): void => {
    setBatchTextbookId('');
    setBatchUnitId('');
    setBatchTopicId('');
    setBatchUnits([]);
    setBatchTopics([]);
    setBatchJsonText('');
    setBatchOpen(false);
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

  const getItemTypeLabel = (type?: string): string => {
    const found = ITEM_TYPE_OPTIONS.find(
      (opt: { value: string; label: string }) => opt.value === type,
    );
    return found?.label ?? type ?? '-';
  };

  const getDifficultyLabel = (difficulty?: number): string => {
    const found = DIFFICULTY_OPTIONS.find(
      (opt: { value: string; label: string }) => opt.value === String(difficulty),
    );
    return found?.label ?? '-';
  };

  return (
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 顶部标题 + 操作 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">数学习题管理</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBatchOpen(true)}>
            <Upload size={16} />
            批量导入
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={16} />
            新增习题
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
       <div className="glass-card rounded-xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[160px]">
             <Label className="text-sm text-slate-400">教材</Label>
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
          <div className="flex flex-col gap-1.5 min-w-[160px]">
             <Label className="text-sm text-slate-400">单元</Label>
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
          <div className="flex flex-col gap-1.5 min-w-[160px]">
             <Label className="text-sm text-slate-400">知识点</Label>
            <Select
              value={filterTopicId}
              onValueChange={setFilterTopicId}
              disabled={!filterTextbookId || !filterUnitId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部知识点" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t: AdminMathTopicItem) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
             <Label className="text-sm text-slate-400">题型</Label>
            <Select value={filterItemType} onValueChange={setFilterItemType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部题型" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPE_OPTIONS.map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
             <Label className="text-sm text-slate-400">难度</Label>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="全部难度" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
             <Label className="text-sm text-slate-400">关键词</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索题目内容"
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
       <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>题目</TableHead>
                <TableHead>题型</TableHead>
                <TableHead>难度</TableHead>
                <TableHead>知识点</TableHead>
                <TableHead>所属教材</TableHead>
                <TableHead>所属单元</TableHead>
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
                items.map((item: AdminMathPracticeItem) => (
                   <TableRow key={item.id}>
                     <TableCell className="font-medium text-white max-w-[320px] truncate">
                      {item.question}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getItemTypeLabel(item.itemType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDifficultyLabel(item.difficulty)}</Badge>
                    </TableCell>
                     <TableCell className="text-slate-400 max-w-[140px] truncate">
                       {item.topicTitle ?? '-'}
                     </TableCell>
                     <TableCell className="text-slate-400 max-w-[160px] truncate">
                       {item.textbookTitle ?? '-'}
                     </TableCell>
                     <TableCell className="text-slate-400">
                      {item.unitTitle ?? '-'}
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

      {/* 新增/编辑习题弹窗 */}
      <MathPracticeFormDialog
        open={formOpen}
        editingId={editingId}
        textbookId={filterTextbookId}
        unitId={filterUnitId}
        topicId={filterTopicId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchItems();
        }}
      />

      {/* 批量导入弹窗 */}
      <Dialog open={batchOpen} onOpenChange={resetBatchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量导入习题</DialogTitle>
            <DialogDescription>
              选择教材、单元和知识点，粘贴 JSON 格式的习题数组（字段：question, correctAnswer, options, itemType, difficulty 等）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">选择教材</Label>
                <Select value={batchTextbookId} onValueChange={handleBatchTextbookChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择教材" />
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
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">选择单元</Label>
                <Select
                  value={batchUnitId}
                  onValueChange={handleBatchUnitChange}
                  disabled={!batchTextbookId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择单元" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchUnits.map((u: TextbookUnit) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">选择知识点</Label>
                <Select
                  value={batchTopicId}
                  onValueChange={setBatchTopicId}
                  disabled={!batchTextbookId || !batchUnitId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择知识点" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchTopics.map((t: AdminMathTopicItem) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">JSON 数据</Label>
              <Textarea
                value={batchJsonText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBatchJsonText(e.target.value)
                }
                placeholder={
                  '[\n  {"question": "1+1=?", "correctAnswer": "2", "itemType": "fill", "difficulty": 1}\n]'
                }
                rows={10}
                className="font-mono text-xs"
              />
               <p className="text-xs text-slate-400">
                格式：JSON 数组，每条至少包含 question、correctAnswer 字段。textbookId、unitId、topicId 可在上方统一设置。
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetBatchDialog} disabled={batchImporting}>
              取消
            </Button>
            <Button
              onClick={handleBatchImport}
              disabled={batchImporting || !batchJsonText.trim()}
            >
              {batchImporting ? '导入中...' : '确认导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该习题吗？此操作不可撤销。
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
    </div>
  );
};

export default AdminMathPracticePage;
