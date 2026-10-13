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
import type {
  AdminMathPracticeItem,
  AdminMathTopicItem,
  Textbook,
  TextbookUnit,
} from '@shared/api.interface';

interface MathPracticeFormDialogProps {
  open: boolean;
  editingId: string | null;
  textbookId?: string;
  unitId?: string;
  topicId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface MathPracticeFormData {
  question: string;
  topicId: string;
  textbookId: string;
  unitId: string;
  options: string;
  correctAnswer: string;
  solution: string;
  difficulty: string;
  itemOrder: string;
  itemType: string;
  grade: string;
  semester: string;
  knowledgePoint: string;
}

const DEFAULT_FORM: MathPracticeFormData = {
  question: '',
  topicId: '',
  textbookId: '',
  unitId: '',
  options: '',
  correctAnswer: '',
  solution: '',
  difficulty: '2',
  itemOrder: '0',
  itemType: '',
  grade: '',
  semester: '',
  knowledgePoint: '',
};

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

const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
];

const SEMESTER_OPTIONS = [
  { value: 'upper', label: '上册' },
  { value: 'lower', label: '下册' },
];

const MathPracticeFormDialog: React.FC<MathPracticeFormDialogProps> = ({
  open,
  editingId,
  textbookId,
  unitId,
  topicId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<MathPracticeFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [topics, setTopics] = useState<AdminMathTopicItem[]>([]);
  const [textbooksLoading, setTextbooksLoading] = useState<boolean>(false);
  const [unitsLoading, setUnitsLoading] = useState<boolean>(false);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(false);

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

  const loadTopics = useCallback(async (tbId: string, uId: string): Promise<void> => {
    if (!tbId || !uId) {
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    try {
      const data = await adminApi.getMathTopics({
        textbookId: tbId,
        unitId: uId,
        page: 1,
        pageSize: 200,
      });
      setTopics(data.items ?? []);
    } catch (err) {
      logger.error('Failed to fetch math topics', { error: String(err) });
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      loadTextbooks();
      if (textbookId) {
        setForm((prev: MathPracticeFormData) => ({ ...prev, textbookId }));
        loadUnits(textbookId);
      }
      if (unitId) {
        setForm((prev: MathPracticeFormData) => ({ ...prev, unitId }));
        if (textbookId) loadTopics(textbookId, unitId);
      }
      if (topicId) {
        setForm((prev: MathPracticeFormData) => ({ ...prev, topicId }));
      }
      if (editingId) {
        setLoading(true);
        adminApi
          .getMathPracticeItem(editingId)
          .then((data: AdminMathPracticeItem) => {
            const optionsJson = data.options && data.options.length > 0
              ? JSON.stringify(data.options, null, 2)
              : '';
            setForm({
              question: data.question,
              topicId: data.topicId,
              textbookId: data.textbookId,
              unitId: data.unitId,
              options: optionsJson,
              correctAnswer: data.correctAnswer,
              solution: data.solution ?? '',
              difficulty: String(data.difficulty ?? 2),
              itemOrder: data.itemOrder !== undefined ? String(data.itemOrder) : '0',
              itemType: data.itemType ?? '',
              grade: data.grade ?? '',
              semester: data.semester ?? '',
              knowledgePoint: data.knowledgePoint ?? '',
            });
            loadUnits(data.textbookId);
            loadTopics(data.textbookId, data.unitId);
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch math practice detail', { error: String(err) });
          })
          .finally(() => setLoading(false));
      }
    }
  }, [open, editingId, textbookId, unitId, topicId, loadTextbooks, loadUnits, loadTopics]);

  const updateField = useCallback(
    (field: keyof MathPracticeFormData, value: string): void => {
      setForm((prev: MathPracticeFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleTextbookChange = (val: string): void => {
    updateField('textbookId', val);
    updateField('unitId', '');
    updateField('topicId', '');
    setTopics([]);
    loadUnits(val);
  };

  const handleUnitChange = (val: string): void => {
    updateField('unitId', val);
    updateField('topicId', '');
    if (form.textbookId && val) {
      loadTopics(form.textbookId, val);
    } else {
      setTopics([]);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.question.trim()) return;
    if (!form.topicId) return;
    if (!form.textbookId) return;
    if (!form.unitId) return;
    if (!form.correctAnswer.trim()) return;

    let options: Array<{ label: string; text: string }> | undefined;
    if (form.options.trim()) {
      try {
        const parsed = JSON.parse(form.options);
        if (Array.isArray(parsed) && parsed.length > 0) {
          options = parsed;
        }
      } catch (err) {
        logger.error('Failed to parse options JSON', { error: String(err) });
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        question: form.question.trim(),
        topicId: form.topicId,
        textbookId: form.textbookId,
        unitId: form.unitId,
        correctAnswer: form.correctAnswer.trim(),
        difficulty: Number(form.difficulty),
        itemOrder: Number(form.itemOrder),
      };
      if (options) payload.options = options;
      if (form.solution) payload.solution = form.solution;
      if (form.itemType) payload.itemType = form.itemType;
      if (form.grade) payload.grade = form.grade;
      if (form.semester) payload.semester = form.semester;
      if (form.knowledgePoint) payload.knowledgePoint = form.knowledgePoint;

      if (editingId) {
        await adminApi.updateMathPracticeItem(editingId, payload);
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
          <DialogTitle>{editingId ? '编辑习题' : '新增习题'}</DialogTitle>
          <DialogDescription>
            填写习题的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading || textbooksLoading ? (
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
                onValueChange={handleUnitChange}
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
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                所属知识点 <span className="text-[#EF476F]">*</span>
              </Label>
              <Select
                value={form.topicId}
                onValueChange={(val: string) => updateField('topicId', val)}
                disabled={!form.textbookId || !form.unitId || topicsLoading}
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
              <Label className="text-sm">题型</Label>
              <Select
                value={form.itemType}
                onValueChange={(val: string) => updateField('itemType', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择题型" />
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
                  {DIFFICULTY_OPTIONS.map((opt: { value: string; label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">年级</Label>
              <Select
                value={form.grade}
                onValueChange={(val: string) => updateField('grade', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g: string) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">学期</Label>
              <Select
                value={form.semester}
                onValueChange={(val: string) => updateField('semester', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择学期" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTER_OPTIONS.map((opt: { value: string; label: string }) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
                placeholder="请输入正确答案"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">排序号</Label>
              <Input
                type="number"
                value={form.itemOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('itemOrder', e.target.value)
                }
                placeholder="排序号，默认0"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">考点</Label>
              <Input
                value={form.knowledgePoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('knowledgePoint', e.target.value)
                }
                placeholder="请输入考点名称"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">选项（JSON 数组，仅选择题需要）</Label>
              <Textarea
                value={form.options}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('options', e.target.value)
                }
                placeholder={
                  '[\n  {"label": "A", "text": "选项A内容"},\n  {"label": "B", "text": "选项B内容"}\n]'
                }
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-[#6B7280]">
                格式：JSON 数组，每个元素包含 label 和 text 字段
              </p>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">解析</Label>
              <Textarea
                value={form.solution}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('solution', e.target.value)
                }
                placeholder="请输入题目解析"
                rows={3}
              />
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

export default MathPracticeFormDialog;
