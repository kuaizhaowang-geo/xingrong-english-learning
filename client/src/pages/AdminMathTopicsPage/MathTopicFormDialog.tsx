import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import * as adminApi from '@client/src/api/admin';
import type { AdminMathTopicItem, Textbook, TextbookUnit } from '@shared/api.interface';

interface MathTopicFormDialogProps {
  open: boolean;
  editingId: string | null;
  textbookId?: string;
  unitId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MathTopicFormData {
  title: string;
  textbookId: string;
  unitId: string;
  topicOrder: string;
  domain: string;
  description: string;
  keyPoints: string;
  examples: string;
}

const DEFAULT_FORM: MathTopicFormData = {
  title: '',
  textbookId: '',
  unitId: '',
  topicOrder: '0',
  domain: '',
  description: '',
  keyPoints: '',
  examples: '',
};

const DOMAIN_OPTIONS = [
  { value: 'numbers', label: '数的认识' },
  { value: 'arithmetic', label: '运算' },
  { value: 'geometry', label: '几何' },
  { value: 'measurement', label: '测量' },
  { value: 'data', label: '统计与概率' },
  { value: 'algebra', label: '代数' },
  { value: 'fractions', label: '分数' },
  { value: 'word_problems', label: '应用题' },
];

const MathTopicFormDialog: React.FC<MathTopicFormDialogProps> = ({
  open,
  editingId,
  textbookId,
  unitId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<MathTopicFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [textbooksLoading, setTextbooksLoading] = useState<boolean>(false);
  const [unitsLoading, setUnitsLoading] = useState<boolean>(false);

  const loadTextbooks = useCallback(async (): Promise<void> => {
    setTextbooksLoading(true);
    try {
      const data = await adminApi.getTextbooks({ page: 1, pageSize: 100 });
      const list = Array.isArray((data as unknown as Record<string, unknown>).items)
        ? ((data as unknown as Record<string, unknown>).items as Textbook[])
        : (data as unknown as Textbook[]);
      setTextbooks(list);
    } catch (err) {
      logger.error('Failed to fetch textbooks', { error: String(err) });
    } finally {
      setTextbooksLoading(false);
    }
  }, []);

  const loadUnits = useCallback(async (tbId: string): Promise<void> => {
    if (!tbId) {
      setUnits([]);
      return;
    }
    setUnitsLoading(true);
    try {
      const list = await adminApi.getUnits(tbId);
      setUnits(list ?? []);
    } catch (err) {
      logger.error('Failed to fetch units', { error: String(err) });
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      loadTextbooks();
      if (textbookId) {
        setForm((prev: MathTopicFormData) => ({ ...prev, textbookId }));
        loadUnits(textbookId);
      }
      if (unitId) {
        setForm((prev: MathTopicFormData) => ({ ...prev, unitId }));
      }
      if (editingId) {
        setLoading(true);
        adminApi
          .getMathTopic(editingId)
          .then((data: AdminMathTopicItem) => {
            const examplesJson = data.examples && data.examples.length > 0
              ? JSON.stringify(data.examples, null, 2)
              : '';
            setForm({
              title: data.title,
              textbookId: data.textbookId,
              unitId: data.unitId,
              topicOrder: data.topicOrder !== undefined ? String(data.topicOrder) : '0',
              domain: data.domain ?? '',
              description: data.description ?? '',
              keyPoints: data.keyPoints ?? '',
              examples: examplesJson,
            });
            loadUnits(data.textbookId);
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch math topic detail', { error: String(err) });
          })
          .finally(() => setLoading(false));
      }
    }
  }, [open, editingId, textbookId, unitId, loadTextbooks, loadUnits]);

  const updateField = useCallback(
    (field: keyof MathTopicFormData, value: string): void => {
      setForm((prev: MathTopicFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleTextbookChange = (val: string): void => {
    updateField('textbookId', val);
    updateField('unitId', '');
    loadUnits(val);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.title.trim()) return;
    if (!form.textbookId) return;
    if (!form.unitId) return;
    if (!form.description.trim()) return;
    if (!form.keyPoints.trim()) return;

    let examples: Array<{ question: string; solution: string; answer: string }> = [];
    if (form.examples.trim()) {
      try {
        const parsed = JSON.parse(form.examples);
        if (Array.isArray(parsed)) {
          examples = parsed;
        }
      } catch (err) {
        logger.error('Failed to parse examples JSON', { error: String(err) });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        textbookId: form.textbookId,
        unitId: form.unitId,
        description: form.description.trim(),
        keyPoints: form.keyPoints.trim(),
      };
      if (form.topicOrder) payload.topicOrder = Number(form.topicOrder);
      if (form.domain) payload.domain = form.domain;
      if (examples.length > 0) payload.examples = examples;

      if (editingId) {
        await adminApi.updateMathTopic(editingId, payload);
      } else {
        await adminApi.createMathTopic(
          payload as Parameters<typeof adminApi.createMathTopic>[0],
        );
      }
      onSuccess();
    } catch (err) {
      logger.error('Failed to save math topic', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? '编辑知识点' : '新增知识点'}</DialogTitle>
          <DialogDescription>
            填写知识点的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading || textbooksLoading ? (
          <div className="py-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                知识点标题 <span className="text-[#EF476F]">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('title', e.target.value)
                }
                placeholder="请输入知识点标题"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                所属教材 <span className="text-[#EF476F]">*</span>
              </Label>
              <Select value={form.textbookId} onValueChange={handleTextbookChange}>
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
              <Label className="text-sm">
                所属单元 <span className="text-[#EF476F]">*</span>
              </Label>
              <Select
                value={form.unitId}
                onValueChange={(val: string) => updateField('unitId', val)}
                disabled={!form.textbookId || unitsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择单元" />
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
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">知识领域</Label>
              <Select
                value={form.domain}
                onValueChange={(val: string) => updateField('domain', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择领域" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((opt: { value: string; label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">排序号</Label>
              <Input
                type="number"
                value={form.topicOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('topicOrder', e.target.value)
                }
                placeholder="排序号，默认0"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                知识点描述 <span className="text-[#EF476F]">*</span>
              </Label>
              <Textarea
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('description', e.target.value)
                }
                placeholder="请输入知识点描述"
                rows={3}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                知识要点 <span className="text-[#EF476F]">*</span>
              </Label>
              <Textarea
                value={form.keyPoints}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('keyPoints', e.target.value)
                }
                placeholder="请输入知识要点"
                rows={3}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">例题（JSON 数组）</Label>
              <Textarea
                value={form.examples}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('examples', e.target.value)
                }
                placeholder={
                  '[\n  {"question": "1+1=?", "solution": "1+1=2", "answer": "2"}\n]'
                }
                rows={5}
                className="font-mono text-xs"
              />
              <p className="text-xs text-[#6B7280]">
                格式：JSON 数组，每个元素包含 question、solution、answer 三个字段
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting || loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '保存中...' : editingId ? '保存修改' : '确认新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MathTopicFormDialog;
