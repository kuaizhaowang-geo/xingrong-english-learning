import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
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
import type { TextbookTreeItem, TextbookUnit } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import UnitDialog from '../AdminTextbooksPage/UnitDialog';
import ContentEditorPanel from '../AdminTextbooksPage/ContentEditorPanel';

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};

const GRADE_LABEL_MAP: Record<string, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级',
  grade7: '七年级',
  grade8: '八年级',
  grade9: '九年级',
  grade10: '高一',
  grade11: '高二',
  grade12: '高三',
};

const SEMESTER_LABELS: Record<string, string> = {
  upper: '上册',
  lower: '下册',
};

const gradeLabel = (g: string): string => GRADE_LABEL_MAP[g] ?? g;

interface UnitPanelDrawerProps {
  open: boolean;
  textbook: TextbookTreeItem | null;
  onClose: () => void;
  onTextbookDeleted?: () => void;
}

const UnitPanelDrawer: React.FC<UnitPanelDrawerProps> = ({
  open,
  textbook,
  onClose,
}) => {
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [highlightedUnitId, setHighlightedUnitId] = useState<string | null>(
    null,
  );
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TextbookUnit | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteUnit, setDeleteUnit] = useState<TextbookUnit | null>(null);

  const loadUnits = React.useCallback(
    async (textbookId: string): Promise<void> => {
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
    },
    [],
  );

  React.useEffect(() => {
    if (open && textbook) {
      setHighlightedUnitId(null);
      void loadUnits(textbook.id);
    }
  }, [open, textbook, loadUnits]);

  if (!open || !textbook) return null;

  const handleAddUnit = (): void => {
    setEditingUnit(null);
    setUnitDialogOpen(true);
  };

  const handleEditUnit = (unit: TextbookUnit): void => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  };

  const handleDeleteUnitClick = (unit: TextbookUnit): void => {
    setDeleteUnit(unit);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteUnit) return;
    try {
      await adminApi.deleteUnit(deleteUnit.id);
      await loadUnits(textbook.id);
    } catch (err) {
      logger.error('Failed to delete unit', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteUnit(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-[900px] max-w-full h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A2E]">
              单元管理 - {textbook.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {SUBJECT_LABELS[textbook.subject] ?? textbook.subject} ·{' '}
              {textbook.publisher} · {gradeLabel(textbook.grade)} ·{' '}
              {SEMESTER_LABELS[textbook.semester] ?? textbook.semester}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddUnit} size="sm">
              <Plus size={14} />
              新增单元
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* 单元列表 */}
        <div className="p-4 pb-2 flex-shrink-0 border-b border-gray-50">
          <h4 className="text-sm font-semibold text-[#1A1A2E] mb-2">
            单元列表
          </h4>
          {unitsLoading ? (
            <div className="py-6 flex justify-center items-center gap-2 text-gray-500">
              <Spinner />
              <span>加载中...</span>
            </div>
          ) : units.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              暂无单元数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">序号</TableHead>
                  <TableHead>单元标题</TableHead>
                  <TableHead className="w-32">主题</TableHead>
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit: TextbookUnit, idx: number) => (
                  <TableRow
                    key={unit.id}
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
        <div className="flex-1 min-h-0 overflow-hidden">
          <ContentEditorPanel
            key={`${textbook.id}-${contentRefreshKey}`}
            textbookId={textbook.id}
            subject={textbook.subject}
            units={units}
            selectedUnitId={highlightedUnitId}
            onUnitContentChange={() => setContentRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      {/* 单元弹窗 */}
      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        textbookId={textbook.id}
        unit={editingUnit}
        onSaved={() => loadUnits(textbook.id)}
      />

      {/* 删除单元确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除单元</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteUnit?.title}」吗？此操作不可恢复。
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

export default UnitPanelDrawer;
