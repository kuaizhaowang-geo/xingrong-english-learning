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
import type { AdminChineseCharItem, Textbook, TextbookUnit } from '@shared/api.interface';
import ChineseCharFormDialog from '@client/src/pages/AdminTextbooksPage/ChineseCharFormDialog';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const AdminChineseCharsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<AdminChineseCharItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);

  // filters
  const [filterTextbookId, setFilterTextbookId] = useState<string>('');
  const [filterUnitId, setFilterUnitId] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  // dialog states
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTextbookId, setEditingTextbookId] = useState<string>('');
  const [batchOpen, setBatchOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminChineseCharItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // batch import state
  const [batchTextbookId, setBatchTextbookId] = useState<string>('');
  const [batchUnitId, setBatchUnitId] = useState<string>('');
  const [batchUnits, setBatchUnits] = useState<TextbookUnit[]>([]);
  const [batchJsonText, setBatchJsonText] = useState<string>('');
  const [batchImporting, setBatchImporting] = useState<boolean>(false);

  const fetchChars = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      };
      if (filterTextbookId) params.textbookId = filterTextbookId;
      if (filterUnitId) params.unitId = filterUnitId;
      if (filterKeyword) params.keyword = filterKeyword;
      if (filterDifficulty) params.difficulty = filterDifficulty;
      const data = await adminApi.getChineseChars(params);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      logger.error('Failed to fetch chinese chars', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterTextbookId, filterUnitId, filterKeyword, filterDifficulty]);

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
    fetchChars();
  }, [fetchChars]);

  useEffect(() => {
    fetchUnits(filterTextbookId);
    setFilterUnitId('');
  }, [filterTextbookId, fetchUnits]);

  const handleSearch = (): void => {
    setPage(1);
    fetchChars();
  };

  const handleAdd = (): void => {
    if (!filterTextbookId) return;
    setEditingId(null);
    setEditingTextbookId(filterTextbookId);
    setFormOpen(true);
  };

  const handleEdit = (item: AdminChineseCharItem): void => {
    setEditingId(item.id);
    setEditingTextbookId(item.textbookId);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: AdminChineseCharItem): void => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteChineseChar(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchChars();
    } catch (err) {
      logger.error('Failed to delete chinese char', { error: String(err) });
    } finally {
      setDeleting(false);
    }
  };

  // batch import handlers
  const handleBatchTextbookChange = (val: string): void => {
    setBatchTextbookId(val);
    setBatchUnitId('');
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

  const handleBatchImport = async (): Promise<void> => {
    if (!batchJsonText.trim()) return;
    let parsedChars: Array<Record<string, unknown>> = [];
    try {
      const parsed = JSON.parse(batchJsonText);
      if (Array.isArray(parsed)) {
        parsedChars = parsed;
      } else {
        return;
      }
    } catch {
      return;
    }
    if (parsedChars.length === 0) return;

    setBatchImporting(true);
    try {
      const chars = parsedChars.map((c: Record<string, unknown>) => ({
        character: String(c.character ?? ''),
        pinyin: c.pinyin ? String(c.pinyin) : undefined,
        radical: c.radical ? String(c.radical) : undefined,
        strokes: c.strokes !== undefined ? Number(c.strokes) : undefined,
        meaning: c.meaning ? String(c.meaning) : undefined,
        examples: c.examples ? String(c.examples) : undefined,
        charOrder: c.charOrder !== undefined ? Number(c.charOrder) : undefined,
        structure: c.structure ? String(c.structure) : undefined,
        words: Array.isArray(c.words) ? (c.words as string[]) : undefined,
        difficulty: c.difficulty ? String(c.difficulty) : undefined,
        textbookId: batchTextbookId || String(c.textbookId ?? ''),
        unitId: batchUnitId || String(c.unitId ?? ''),
      })).filter((c: { character: string; textbookId: string; unitId: string }) =>
        c.character && c.textbookId && c.unitId,
      );

      await adminApi.batchCreateChineseChars({
        textbookId: batchTextbookId || undefined,
        unitId: batchUnitId || undefined,
        chars: chars as Array<Partial<AdminChineseCharItem> & {
          character: string;
          textbookId: string;
          unitId: string;
        }>,
      });
      setBatchOpen(false);
      setBatchJsonText('');
      fetchChars();
    } catch (err) {
      logger.error('Failed to batch import chinese chars', { error: String(err) });
    } finally {
      setBatchImporting(false);
    }
  };

  const resetBatchDialog = (): void => {
    setBatchTextbookId('');
    setBatchUnitId('');
    setBatchUnits([]);
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

  const getDifficultyLabel = (difficulty?: string): string => {
    const found = DIFFICULTY_OPTIONS.find(
      (opt: { value: string; label: string }) => opt.value === difficulty,
    );
    return found?.label ?? difficulty ?? '-';
  };

  return (
    <div className="space-y-6" data-ai-section-type="card-list">
      {/* 顶部标题 + 操作 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">汉字管理</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBatchOpen(true)}>
            <Upload size={16} />
            批量导入
          </Button>
          <Button onClick={handleAdd} disabled={!filterTextbookId}>
            <Plus size={16} />
            新增汉字
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <Label className="text-sm text-[#6B7280]">教材</Label>
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
            <Label className="text-sm text-[#6B7280]">单元</Label>
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
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <Label className="text-sm text-[#6B7280]">难度</Label>
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
            <Label className="text-sm text-[#6B7280]">关键词</Label>
            <div className="flex gap-2">
              <Input
                placeholder="搜索汉字、拼音或释义"
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
        {!filterTextbookId && (
          <p className="text-xs text-[#EF476F] mt-2">
            提示：新增汉字前请先选择教材
          </p>
        )}
      </div>

      {/* 表格区 */}
      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>汉字</TableHead>
                <TableHead>拼音</TableHead>
                <TableHead>部首</TableHead>
                <TableHead>笔画</TableHead>
                <TableHead>释义</TableHead>
                <TableHead>难度</TableHead>
                <TableHead>所属教材</TableHead>
                <TableHead>所属单元</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-[#6B7280]">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item: AdminChineseCharItem) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-[#1A1A2E] text-lg">
                      {item.character}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {item.pinyin ?? '-'}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {item.radical ?? '-'}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {item.strokes ?? '-'}
                    </TableCell>
                    <TableCell className="text-[#1A1A2E] max-w-[200px] truncate">
                      {item.meaning ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDifficultyLabel(item.difficulty)}</Badge>
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
                      {item.textbookTitle ?? '-'}
                    </TableCell>
                    <TableCell className="text-[#6B7280]">
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
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-[#6B7280]">
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

      {/* 新增/编辑汉字弹窗 */}
      <ChineseCharFormDialog
        open={formOpen}
        charId={editingId}
        textbookId={editingTextbookId}
        units={units.filter((u: TextbookUnit) => u.textbookId === editingTextbookId)}
        defaultUnitId={filterUnitId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchChars();
        }}
      />

      {/* 批量导入弹窗 */}
      <Dialog open={batchOpen} onOpenChange={resetBatchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量导入汉字</DialogTitle>
            <DialogDescription>
              选择教材和单元，粘贴 JSON 格式的汉字数组（字段：character, pinyin, radical, strokes, meaning, structure, difficulty 等）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  onValueChange={setBatchUnitId}
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">JSON 数据</Label>
              <Textarea
                value={batchJsonText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBatchJsonText(e.target.value)
                }
                placeholder={
                  '[\n  {"character": "汉", "pinyin": "hàn", "radical": "氵", "strokes": 5, "meaning": "汉族", "difficulty": "easy"},\n  {"character": "字", "pinyin": "zì", "radical": "宀", "strokes": 6, "meaning": "文字", "difficulty": "easy"}\n]'
                }
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-xs text-[#6B7280]">
                格式：JSON 数组，每条至少包含 character 字段。textbookId 和 unitId 可在上方统一设置。
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
              确定要删除汉字「{deleteTarget?.character}」吗？此操作不可撤销。
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

export default AdminChineseCharsPage;
