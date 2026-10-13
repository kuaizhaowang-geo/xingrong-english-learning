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
import type { AdminMathTopicItem, TextbookUnit } from '@shared/api.interface';

interface MathTopicFormDialogProps {
  open: boolean;
  topicId: string | null;
  textbookId: string;
  units: TextbookUnit[];
  defaultUnitId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MathTopicFormData {
  title: string;
  domain: string;
  description: string;
  keyPoints: string;
  topicOrder: string;
  unitId: string;
  exampleQuestion: string;
  exampleSolution: string;
  exampleAnswer: string;
}

const DEFAULT_FORM: MathTopicFormData = {
  title: '',
  domain: '',
  description: '',
  keyPoints: '',
  topicOrder: '',
  unitId: '',
  exampleQuestion: '',
  exampleSolution: '',
  exampleAnswer: '',
};

const DOMAIN_OPTIONS = [
  '数与代数',
  '图形与几何',
  '统计与概率',
  '综合与实践',
];

const MathTopicFormDialog: React.FC<MathTopicFormDialogProps> = ({
  open,
  topicId,
  textbookId,
  units,
  defaultUnitId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<MathTopicFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (topicId) {
        setLoading(true);
        adminApi
          .getMathTopic(topicId)
          .then((data: AdminMathTopicItem) => {
            const firstExample = data.examples?.[0];
            setForm({
              title: data.title,
              domain: data.domain ?? '',
              description: data.description ?? '',
              keyPoints: data.keyPoints ?? '',
              topicOrder: data.topicOrder !== undefined ? String(data.topicOrder) : '',
              unitId: data.unitId ?? defaultUnitId ?? '',
              exampleQuestion: firstExample?.question ?? '',
              exampleSolution: firstExample?.solution ?? '',
              exampleAnswer: firstExample?.answer ?? '',
            });
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch math topic', { error: String(err) });
          })
          .finally(() => setLoading(false));
      } else {
        setForm({
          ...DEFAULT_FORM,
          unitId: defaultUnitId ?? '',
        });
      }
    }
  }, [open, topicId, defaultUnitId]);

  const updateField = useCallback(
    (field: keyof MathTopicFormData, value: string): void => {
      setForm((prev: MathTopicFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!form.title.trim()) return;
    if (!form.unitId) return;
    setSubmitting(true);
    try {
      const examples: Array<{ question: string; solution: string; answer: string }> = [];
      if (form.exampleQuestion.trim() && form.exampleAnswer.trim()) {
        examples.push({
          question: form.exampleQuestion.trim(),
          solution: form.exampleSolution.trim(),
          answer: form.exampleAnswer.trim(),
        });
      }

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        textbookId,
        unitId: form.unitId,
      };
      if (form.domain) payload.domain = form.domain;
      if (form.description) payload.description = form.description;
      if (form.keyPoints) payload.keyPoints = form.keyPoints;
      if (form.topicOrder) payload.topicOrder = Number(form.topicOrder);
      if (examples.length > 0) payload.examples = examples;

      if (topicId) {
        await adminApi.updateMathTopic(topicId, payload);
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
          <DialogTitle>{topicId ? '编辑知识点' : '新增知识点'}</DialogTitle>
          <DialogDescription>
            填写数学知识点的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading ? (
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
              <Label className="text-sm">知识领域</Label>
              <Select
                value={form.domain}
                onValueChange={(val: string) => updateField('domain', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择领域" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((d: string) => (
                    <SelectItem key={d} value={d}>
                      {d}
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
              <Label className="text-sm">排序</Label>
              <Input
                type="number"
                value={form.topicOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('topicOrder', e.target.value)
                }
                placeholder="排序号"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">知识点描述</Label>
              <Textarea
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('description', e.target.value)
                }
                placeholder="请输入知识点的详细描述"
                rows={3}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">知识要点</Label>
              <Textarea
                value={form.keyPoints}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('keyPoints', e.target.value)
                }
                placeholder="请输入知识要点，多个要点用分号分隔"
                rows={2}
              />
            </div>
            <div className="col-span-2 border-t border-gray-100 pt-3">
              <Label className="text-sm font-medium">示例题目（可选）</Label>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">题目</Label>
              <Input
                value={form.exampleQuestion}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('exampleQuestion', e.target.value)
                }
                placeholder="示例题目内容"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">答案</Label>
              <Input
                value={form.exampleAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('exampleAnswer', e.target.value)
                }
                placeholder="正确答案"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">解析</Label>
              <Input
                value={form.exampleSolution}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('exampleSolution', e.target.value)
                }
                placeholder="解题思路"
              />
            </div>
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

export default MathTopicFormDialog;
