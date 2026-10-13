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
import type { AdminChineseCharItem, TextbookUnit } from '@shared/api.interface';

interface ChineseCharFormDialogProps {
  open: boolean;
  charId: string | null;
  textbookId: string;
  units: TextbookUnit[];
  defaultUnitId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChineseCharFormData {
  character: string;
  pinyin: string;
  radical: string;
  strokes: string;
  meaning: string;
  examples: string;
  charOrder: string;
  structure: string;
  wordsStr: string;
  difficulty: string;
  unitId: string;
}

const DEFAULT_FORM: ChineseCharFormData = {
  character: '',
  pinyin: '',
  radical: '',
  strokes: '',
  meaning: '',
  examples: '',
  charOrder: '',
  structure: '',
  wordsStr: '',
  difficulty: 'easy',
  unitId: '',
};

const STRUCTURE_OPTIONS = [
  '左右结构', '上下结构', '左中右结构', '上中下结构',
  '半包围结构', '全包围结构', '独体结构', '品字形结构',
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const ChineseCharFormDialog: React.FC<ChineseCharFormDialogProps> = ({
  open,
  charId,
  textbookId,
  units,
  defaultUnitId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<ChineseCharFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (charId) {
        setLoading(true);
        adminApi
          .getChineseChar(charId)
          .then((data: AdminChineseCharItem) => {
            setForm({
              character: data.character,
              pinyin: data.pinyin ?? '',
              radical: data.radical ?? '',
              strokes: data.strokes !== undefined ? String(data.strokes) : '',
              meaning: data.meaning ?? '',
              examples: data.examples ?? '',
              charOrder: data.charOrder !== undefined ? String(data.charOrder) : '',
              structure: data.structure ?? '',
              wordsStr: (data.words ?? []).join('、'),
              difficulty: data.difficulty ?? 'easy',
              unitId: data.unitId ?? defaultUnitId ?? '',
            });
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch char detail', { error: String(err) });
          })
          .finally(() => setLoading(false));
      } else {
        setForm({
          ...DEFAULT_FORM,
          unitId: defaultUnitId ?? '',
        });
      }
    }
  }, [open, charId, defaultUnitId]);

  const updateField = useCallback(
    (field: keyof ChineseCharFormData, value: string): void => {
      setForm((prev: ChineseCharFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!form.character.trim()) return;
    if (!form.unitId) return;
    setSubmitting(true);
    try {
      const words = form.wordsStr
        ? form.wordsStr.split(/[、,，\s]+/).filter((w: string) => w.trim())
        : [];

      const payload: Record<string, unknown> = {
        character: form.character.trim(),
        textbookId,
        unitId: form.unitId,
      };
      if (form.pinyin) payload.pinyin = form.pinyin;
      if (form.radical) payload.radical = form.radical;
      if (form.strokes) payload.strokes = Number(form.strokes);
      if (form.meaning) payload.meaning = form.meaning;
      if (form.examples) payload.examples = form.examples;
      if (form.charOrder) payload.charOrder = Number(form.charOrder);
      if (form.structure) payload.structure = form.structure;
      if (words.length > 0) payload.words = words;
      if (form.difficulty) payload.difficulty = form.difficulty;

      if (charId) {
        await adminApi.updateChineseChar(charId, payload);
      } else {
        await adminApi.createChineseChar(
          payload as Parameters<typeof adminApi.createChineseChar>[0],
        );
      }
      onSuccess();
    } catch (err) {
      logger.error('Failed to save chinese char', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{charId ? '编辑汉字' : '新增汉字'}</DialogTitle>
          <DialogDescription>
            填写汉字的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                汉字 <span className="text-[#EF476F]">*</span>
              </Label>
              <Input
                value={form.character}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('character', e.target.value)
                }
                placeholder="请输入汉字"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">拼音</Label>
              <Input
                value={form.pinyin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('pinyin', e.target.value)
                }
                placeholder="hàn zì"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">部首</Label>
              <Input
                value={form.radical}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('radical', e.target.value)
                }
                placeholder="请输入部首"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">笔画数</Label>
              <Input
                type="number"
                value={form.strokes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('strokes', e.target.value)
                }
                placeholder="笔画数"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">结构</Label>
              <Select
                value={form.structure}
                onValueChange={(val: string) => updateField('structure', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择结构" />
                </SelectTrigger>
                <SelectContent>
                  {STRUCTURE_OPTIONS.map((s: string) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">难度等级</Label>
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
              <Label className="text-sm">排序</Label>
              <Input
                type="number"
                value={form.charOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('charOrder', e.target.value)
                }
                placeholder="排序号"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">释义</Label>
              <Textarea
                value={form.meaning}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('meaning', e.target.value)
                }
                placeholder="请输入释义（多个释义用分号分隔）"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">组词（用顿号或逗号分隔）</Label>
              <Input
                value={form.wordsStr}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('wordsStr', e.target.value)
                }
                placeholder="词语一、词语二、词语三"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">例句</Label>
              <Textarea
                value={form.examples}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('examples', e.target.value)
                }
                placeholder="请输入例句"
                rows={2}
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

export default ChineseCharFormDialog;
