import React, { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  BookMarked,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
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
import { Spinner } from '@client/src/components/ui/spinner';
import type {
  TextbookTreeItem,
  TextbookUnit,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import TextbookTree from './TextbookTree';
import TextbookInfoCard from './TextbookInfoCard';
import TextbookDialog from './TextbookDialog';
import UnitDialog from './UnitDialog';
import ContentEditorPanel from './ContentEditorPanel';

const SUBJECT_TABS = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文', math: '数学', english: '英语',
};

const AdminTextbooksPage: React.FC = () => {
  const [subject, setSubject] = useState('english');
  const [treeItems, setTreeItems] = useState<TextbookTreeItem[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [selectedTextbook, setSelectedTextbook] = useState<TextbookTreeItem | null>(null);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = useState<string | null>(null);

  const [tbDialogOpen, setTbDialogOpen] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState<TextbookTreeItem | null>(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TextbookUnit | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'textbook'; id: string; title: string } | { type: 'unit'; id: string; title: string } | null
  >(null);

  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  const unitRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const loadTree = useCallback(async (): Promise<void> => {
    setTreeLoading(true);
    try {
      const data = await adminApi.getTextbookTree(subject);
      setTreeItems(data);
      // 默认展开第一个教材节点路径
      if (data.length > 0) {
        const sorted = [...data].sort((a, b) => {
          const ga = Number(a.grade.replace('grade', ''));
          const gb = Number(b.grade.replace('grade', ''));
          return ga - gb || a.sortOrder - b.sortOrder;
        });
        const first = sorted[0];
        const gradeNum = Number(first.grade.replace('grade', ''));
        const stage = gradeNum <= 6 ? '小学' : gradeNum <= 9 ? '初中' : '高中';
        setExpanded(new Set([
          `stage-${stage}`,
          `pub-${stage}-${first.publisher}`,
          `grade-${stage}-${first.publisher}-${first.grade}`,
          `sem-${stage}-${first.publisher}-${first.grade}-${first.semester}`,
        ]));
        setSelectedTextbook(first);
      } else {
        setSelectedTextbook(null);
      }
    } catch (err) {
      logger.error('Failed to load textbook tree', { error: String(err) });
    } finally {
      setTreeLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const loadUnits = useCallback(async (textbookId: string): Promise<void> => {
    setUnitsLoading(true);
    try {
      const data = await adminApi.getUnits(textbookId);
      setUnits([...data].sort((a, b) => a.unitOrder - b.unitOrder));
    } catch (err) {
      logger.error('Failed to load units', { error: String(err) });
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTextbook) {
      loadUnits(selectedTextbook.id);
    } else {
      setUnits([]);
    }
  }, [selectedTextbook, loadUnits]);

  const handleSelectTextbook = (tb: TextbookTreeItem): void => {
    setSelectedTextbook(tb);
    setHighlightedUnitId(null);
  };

  const handleSelectUnit = (unit: TextbookUnit, tb: TextbookTreeItem): void => {
    if (selectedTextbook?.id !== tb.id) {
      setSelectedTextbook(tb);
    }
    setHighlightedUnitId(unit.id);
    setTimeout(() => {
      const el = unitRowRefs.current[unit.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const handleAddTextbook = (): void => {
    setEditingTextbook(null);
    setTbDialogOpen(true);
  };

  const handleEditTextbook = (): void => {
    if (selectedTextbook) {
      setEditingTextbook(selectedTextbook);
      setTbDialogOpen(true);
    }
  };

  const handleAddUnit = (): void => {
    setEditingUnit(null);
    setUnitDialogOpen(true);
  };

  const handleEditUnit = (unit: TextbookUnit): void => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  };

  const handleDeleteTextbookClick = (): void => {
    if (!selectedTextbook) return;
    setDeleteTarget({
      type: 'textbook',
      id: selectedTextbook.id,
      title: selectedTextbook.title,
    });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUnitClick = (unit: TextbookUnit): void => {
    setDeleteTarget({ type: 'unit', id: unit.id, title: unit.title });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'textbook') {
        await adminApi.deleteTextbook(deleteTarget.id);
        setSelectedTextbook(null);
        await loadTree();
      } else {
        await adminApi.deleteUnit(deleteTarget.id);
        if (selectedTextbook) {
          await loadUnits(selectedTextbook.id);
        }
      }
    } catch (err) {
      logger.error('Failed to delete', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center">
            <BookMarked size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A2E]">教材管理</h2>
            <p className="text-sm text-gray-500">
              {SUBJECT_LABELS[subject] ?? subject} 教材
            </p>
          </div>
        </div>
      </div>

      {/* 左右分栏 */}
      <div className="flex gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        {/* 左侧树 */}
        <Card className="w-72 flex-shrink-0 border border-gray-100 rounded-xl shadow-sm flex flex-col">
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-base font-semibold">教材树</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#FF6B35]"
                onClick={handleAddTextbook}
              >
                <Plus size={14} />
                新增
              </Button>
            </div>
          </CardHeader>
          <div className="px-3 pb-2">
            <Tabs value={subject} onValueChange={setSubject}>
              <TabsList className="w-full">
                {SUBJECT_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            {treeLoading ? (
              <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                <Spinner />
                <span>加载中...</span>
              </div>
            ) : treeItems.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                暂无教材数据
              </div>
            ) : (
              <TextbookTree
                items={treeItems}
                selectedTextbookId={selectedTextbook?.id ?? null}
                expanded={expanded}
                onToggleExpand={(id: string) =>
                  setExpanded((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onSelectTextbook={handleSelectTextbook}
                onSelectUnit={handleSelectUnit}
              />
            )}
          </CardContent>
        </Card>

        {/* 右侧内容 */}
        <Card className="flex-1 border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!selectedTextbook ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BookMarked size={48} className="mx-auto mb-3 text-gray-300" />
                <p>请从左侧选择教材</p>
              </div>
            </div>
          ) : (
            <>
              {/* 顶部操作栏 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-semibold text-[#1A1A2E]">
                  {selectedTextbook.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleEditTextbook}>
                    <Pencil size={14} />
                    编辑教材
                  </Button>
                  <Button onClick={handleAddUnit}>
                    <Plus size={14} />
                    新增单元
                  </Button>
                </div>
              </div>

              {/* 教材信息卡片 */}
              <div className="flex-shrink-0">
                <TextbookInfoCard textbook={selectedTextbook} />
              </div>

              {/* 单元列表 + 内容编辑（flex-1 分配空间） */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="p-4 pb-2 flex-shrink-0">
                  <h4 className="text-sm font-semibold text-[#1A1A2E]">单元列表</h4>
                </div>
                <div className="flex-shrink-0 overflow-y-auto max-h-[40%]">
                  {unitsLoading ? (
                    <div className="py-8 flex justify-center items-center gap-2 text-gray-500">
                      <Spinner />
                      <span>加载中...</span>
                    </div>
                  ) : units.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      暂无单元数据
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">序号</TableHead>
                          <TableHead>单元标题</TableHead>
                          <TableHead className="w-40">主题</TableHead>
                          <TableHead>关键字</TableHead>
                          <TableHead>关键句子</TableHead>
                          <TableHead className="w-28 text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((unit: TextbookUnit, idx: number) => (
                          <TableRow
                            key={unit.id}
                            ref={(el) => {
                              unitRowRefs.current[unit.id] = el;
                            }}
                            className={
                              highlightedUnitId === unit.id
                                ? 'bg-[#FF6B35]/10 cursor-pointer'
                                : 'cursor-pointer hover:bg-gray-50'
                            }
                            onClick={() => setHighlightedUnitId(unit.id)}
                          >
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium text-[#1A1A2E]">
                              {unit.title}
                            </TableCell>
                            <TableCell>{unit.topic || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <div className="flex flex-wrap gap-1">
                                {unit.keyWords.slice(0, 3).map((w: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs font-normal"
                                  >
                                    {w}
                                  </Badge>
                                ))}
                                {unit.keyWords.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{unit.keyWords.length - 3}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[260px]">
                              <div className="text-xs text-gray-600 truncate">
                                {unit.keySentences[0] || '-'}
                                {unit.keySentences.length > 1 && (
                                  <span className="text-gray-400">
                                    {' '}+{unit.keySentences.length - 1} 句
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleEditUnit(unit);
                                  }}
                                >
                                  <Pencil size={14} className="text-[#4361EE]" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleDeleteUnitClick(unit);
                                  }}
                                >
                                  <Trash2 size={14} className="text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* 内容编辑器 */}
                <ContentEditorPanel
                  key={`${selectedTextbook.id}-${contentRefreshKey}`}
                  textbookId={selectedTextbook.id}
                  subject={subject}
                  units={units}
                  selectedUnitId={highlightedUnitId}
                  onUnitContentChange={() => setContentRefreshKey((k) => k + 1)}
                />
              </div>

              {/* 底部操作栏 */}
              <div className="p-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                <Badge
                  variant="outline"
                  className={selectedTextbook.isPublished ? 'text-green-600 border-green-300 bg-green-50' : 'text-gray-500'}
                >
                  {selectedTextbook.isPublished ? '已发布' : '草稿'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={handleDeleteTextbookClick}
                >
                  <Trash2 size={14} />
                  删除教材
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 教材弹窗 */}
      <TextbookDialog
        open={tbDialogOpen}
        onOpenChange={setTbDialogOpen}
        textbook={editingTextbook}
        defaultSubject={subject}
        onSaved={loadTree}
      />

      {/* 单元弹窗 */}
      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        textbookId={selectedTextbook?.id ?? ''}
        unit={editingUnit}
        onSaved={() => {
          if (selectedTextbook) loadUnits(selectedTextbook.id);
        }}
      />

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认删除{deleteTarget?.type === 'textbook' ? '教材' : '单元'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.title}」
              {deleteTarget?.type === 'textbook'
                ? '吗？删除后其下所有单元也将被删除，此操作不可恢复。'
                : '吗？此操作不可恢复。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTextbooksPage;
