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
import type { AdminMathPracticeItem, AdminMathTopicItem, TextbookUnit } from '@shared/api.interface';

interface MathPracticeFormDialogProps {
  open: boolean;
  practiceId: string | null;
  textbookId: string;
  units: TextbookUnit[];
  defaultUnitId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MathPracticeFormData {
  question: string;
  itemType: string;
  difficulty: string;
  correctAnswer: string;
  solution: string;
  itemOrder: string;
  unitId: string;
  topicId: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  knowledgePoint: string;
}

const DEFAULT_FORM: MathPracticeFormData = {
  question: '',
  itemType: 'choice',
  difficulty: '1',
  correctAnswer: '',
  solution: '',
  itemOrder: '',
  unitId: '',
  topicId: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  knowledgePoint: '',
};

const ITEM_TYPE_OPTIONS = [
  { value: 'choice', label: '选择题' },
  { value: 'fill', label: '填空题' },
  { value: 'calculate', label: '计算题' },
  { value: 'word', label: '应用题' },
  { value: 'judge', label: '判断题' },
];

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '⭐ 简单' },
  { value: '2', label: '⭐⭐ 较易' },
  { value: '3', label: '⭐⭐⭐ 中等' },
  { value: '4', label: '⭐⭐⭐⭐ 较难' },
  { value: '5', label: '⭐⭐⭐⭐⭐ 困难' },
];

const MathPracticeFormDialog: React.FC<MathPracticeFormDialogProps> = ({
  open,
  practiceId,
  textbookId,
  units,
  defaultUnitId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<MathPracticeFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [topics, setTopics] = useState<AdminMathTopicItem[]>([]);

  useEffect(() => {
    if (open && textbookId) {
      adminApi
        .getMathTopics({ textbookId, page: 1, pageSize: 200 })
        .then((data) => {
          setTopics(data.items ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to load topics for practice form', { error: String(err) });
        });
    }
  }, [open, textbookId]);

  useEffect(() => {
    if (open) {
      if (practiceId) {
        setLoading(true);
        adminApi
          .getMathPracticeItem(practiceId)
          .then((data: AdminMathPracticeItem) => {
            const opts = data.options ?? [];
            const getOpt = (label: string): string =>
              opts.find((o) => o.label === label)?.text ?? '';
            setForm({
              question: data.question,
              itemType: data.itemType ?? 'choice',
              difficulty: String(data.difficulty ?? 1),
              correctAnswer: data.correctAnswer ?? '',
              solution: data.solution ?? '',
              itemOrder: data.itemOrder !== undefined ? String(data.itemOrder) : '',
              unitId: data.unitId ?? defaultUnitId ?? '',
              topicId: data.topicId ?? '',
              optionA: getOpt('A'),
              optionB: getOpt('B'),
              optionC: getOpt('C'),
              optionD: getOpt('D'),
              knowledgePoint: data.knowledgePoint ?? '',
            });
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch math practice item', { error: String(err) });
          })
          .finally(() => setLoading(false));
      } else {
        setForm({
          ...DEFAULT_FORM,
          unitId: defaultUnitId ?? '',
        });
      }
    }
  }, [open, practiceId, defaultUnitId]);

  const updateField = useCallback(
    (field: keyof MathPracticeFormData, value: string): void => {
      setForm((prev: MathPracticeFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!form.question.trim()) return;
    if (!form.correctAnswer.trim()) return;
    if (!form.unitId) return;
    setSubmitting(true);
    try {
      const options: Array<{ label: string; text: string }> = [];
      if (form.itemType === 'choice') {
        if (form.optionA.trim()) options.push({ label: 'A', text: form.optionA.trim() });
        if (form.optionB.trim()) options.push({ label: 'B', text: form.optionB.trim() });
        if (form.optionC.trim()) options.push({ label: 'C', text: form.optionC.trim() });
        if (form.optionD.trim()) options.push({ label: 'D', text: form.optionD.trim() });
      }

      const payload: Record<string, unknown> = {
        question: form.question.trim(),
        correctAnswer: form.correctAnswer.trim(),
        textbookId,
        unitId: form.unitId,
      };
      if (form.itemType) payload.itemType = form.itemType;
      if (form.difficulty) payload.difficulty = Number(form.difficulty);
      if (form.solution) payload.solution = form.solution;
      if (form.itemOrder) payload.itemOrder = Number(form.itemOrder);
      if (form.topicId) payload.topicId = form.topicId;
      if (form.knowledgePoint) payload.knowledgePoint = form.knowledgePoint;
      if (options.length > 0) payload.options = options;

      if (practiceId) {
        await adminApi.updateMathPracticeItem(practiceId, payload);
      } else {
        await adminApi.createMathPracticeItem(
          payload as Parameters<typeof adminApi.createMathPracticeItem>[0],
        );
      }
      onSuccess();
    } catch (err) {
      logger.error('Failed to save math practice item', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{practiceId ? '编辑习题' : '新增习题'}</DialogTitle>
          <DialogDescription>
            填写数学习题的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                题目 <span className="text-[#EF476F]">*</span>
              </Label>
              <Textarea
                value={form.question}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('question', e.target.value)
                }
                placeholder="请输入题目内容"
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">题型</Label>
              <Select
                value={form.itemType}
                onValueChange={(val: string) => updateField('itemType', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择题型" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">难度</Label>
              <Select
                value={form.difficulty}
                onValueChange={(val: string) => updateField('difficulty', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择难度" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
              <Label className="text-sm">关联知识点</Label>
              <Select
                value={form.topicId}
                onValueChange={(val: string) => updateField('topicId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择知识点" />
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
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                正确答案 <span className="text-[#EF476F]">*</span>
              </Label>
              <Input
                value={form.correctAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('correctAnswer', e.target.value)
                }
                placeholder="正确答案"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">排序</Label>
              <Input
                type="number"
                value={form.itemOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('itemOrder', e.target.value)
                }
                placeholder="排序号"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">解析</Label>
              <Textarea
                value={form.solution}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('solution', e.target.value)
                }
                placeholder="解题思路与解析"
                rows={2}
              />
            </div>

            {form.itemType === 'choice' && (
              <>
                <div className="col-span-2 border-t border-gray-100 pt-3">
                  <Label className="text-sm font-medium">选项（选择题）</Label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">选项 A</Label>
                  <Input
                    value={form.optionA}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField('optionA', e.target.value)
                    }
                    placeholder="选项 A 内容"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">选项 B</Label>
                  <Input
                    value={form.optionB}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField('optionB', e.target.value)
                    }
                    placeholder="选项 B 内容"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">选项 C</Label>
                  <Input
                    value={form.optionC}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField('optionC', e.target.value)
                    }
                    placeholder="选项 C 内容"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">选项 D</Label>
                  <Input
                    value={form.optionD}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField('optionD', e.target.value)
                    }
                    placeholder="选项 D 内容"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MathPracticeFormDialog;
