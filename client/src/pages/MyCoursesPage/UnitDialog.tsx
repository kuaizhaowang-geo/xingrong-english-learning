import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import type {
  CourseUnit,
  CreateUnitDto,
  UpdateUnitDto,
} from '@client/src/api/user-created-courses';

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: CourseUnit | null;
  defaultOrder?: number;
  onSaved: () => void | Promise<void>;
  onCreate: (dto: CreateUnitDto) => Promise<CourseUnit>;
  onUpdate: (unitId: string, dto: UpdateUnitDto) => Promise<CourseUnit>;
}

const UnitDialog: React.FC<UnitDialogProps> = ({
  open,
  onOpenChange,
  unit,
  defaultOrder = 1,
  onSaved,
  onCreate,
  onUpdate,
}) => {
  const isEdit = !!unit;
  const [title, setTitle] = useState('');
  const [unitOrder, setUnitOrder] = useState(1);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(unit?.title ?? '');
      setUnitOrder(unit?.unitOrder ?? defaultOrder);
      setDescription(unit?.description ?? '');
    }
  }, [open, unit, defaultOrder]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEdit && unit) {
        await onUpdate(unit.id, {
          title: title.trim(),
          unitOrder,
          description: description.trim() || undefined,
        });
      } else {
        await onCreate({
          title: title.trim(),
          unitOrder,
          description: description.trim() || undefined,
        });
      }
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      logger.error('Failed to save unit', { error: String(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑单元' : '新建单元'}</DialogTitle>
          <DialogDescription>
            单元是课程的基本结构，每个单元可包含单词和句子。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-title">单元名称 <span className="text-red-500">*</span></Label>
            <Input
              id="unit-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="如：Unit 1 Hello"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-order">序号</Label>
            <Input
              id="unit-order"
              type="number"
              min={1}
              value={unitOrder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitOrder(Number(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-desc">单元简介（可选）</Label>
            <Textarea
              id="unit-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="简要描述本单元的学习目标"
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              <X size={14} />
              取消
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || saving}
              className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]"
            >
              {saving ? '保存中...' : isEdit ? '保存修改' : '创建单元'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnitDialog;
