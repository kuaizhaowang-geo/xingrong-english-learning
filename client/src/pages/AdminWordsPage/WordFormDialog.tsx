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
import type { AdminWordItem, Textbook, TextbookUnit } from '@shared/api.interface';

interface WordFormDialogProps {
  open: boolean;
  wordId: string | null;
  textbooks: Textbook[];
  units: TextbookUnit[];
  partOfSpeechOptions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

interface WordFormData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
  imageUrl: string;
  level: string;
  wordOrder: string;
  textbookId: string;
  unitId: string;
}

const DEFAULT_FORM: WordFormData = {
  word: '',
  phonetic: '',
  partOfSpeech: '',
  meaning: '',
  exampleSentence: '',
  exampleTranslation: '',
  imageUrl: '',
  level: '',
  wordOrder: '',
  textbookId: '',
  unitId: '',
};

const WordFormDialog: React.FC<WordFormDialogProps> = ({
  open,
  wordId,
  textbooks,
  units,
  partOfSpeechOptions,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<WordFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [unitOptions, setUnitOptions] = useState<TextbookUnit[]>(units);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      setUnitOptions(units);
      if (wordId) {
        setLoading(true);
        adminApi
          .getWord(wordId)
          .then((data: AdminWordItem) => {
            setForm({
              word: data.word,
              phonetic: data.phonetic ?? '',
              partOfSpeech: data.partOfSpeech ?? '',
              meaning: data.meaning,
              exampleSentence: data.exampleSentence ?? '',
              exampleTranslation: data.exampleTranslation ?? '',
              imageUrl: data.imageUrl ?? '',
              level: '',
              wordOrder: data.wordOrder !== undefined ? String(data.wordOrder) : '',
              textbookId: data.textbookId ?? '',
              unitId: data.unitId ?? '',
            });
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch word detail', { error: String(err) });
          })
          .finally(() => setLoading(false));
      }
    }
  }, [open, wordId, units]);

  useEffect(() => {
    if (form.textbookId) {
      adminApi
        .getUnits(form.textbookId)
        .then((list: TextbookUnit[]) => {
          setUnitOptions(list);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch units', { error: String(err) });
        });
    } else {
      setUnitOptions([]);
    }
  }, [form.textbookId]);

  const updateField = useCallback(
    (field: keyof WordFormData, value: string): void => {
      setForm((prev: WordFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = async (): Promise<void> => {
    if (!form.word.trim()) {
      return;
    }
    if (!form.meaning.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        word: form.word.trim(),
        meaning: form.meaning.trim(),
      };
      if (form.phonetic) payload.phonetic = form.phonetic;
      if (form.partOfSpeech) payload.partOfSpeech = form.partOfSpeech;
      if (form.exampleSentence) payload.exampleSentence = form.exampleSentence;
      if (form.exampleTranslation) payload.exampleTranslation = form.exampleTranslation;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.level) payload.level = form.level;
      if (form.wordOrder) payload.wordOrder = Number(form.wordOrder);
      if (form.textbookId) payload.textbookId = form.textbookId;
      if (form.unitId) payload.unitId = form.unitId;

      if (wordId) {
        await adminApi.updateWord(wordId, payload);
      } else {
        await adminApi.createWord(payload as Parameters<typeof adminApi.createWord>[0]);
      }
      onSuccess();
    } catch (err) {
      logger.error('Failed to save word', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{wordId ? '编辑单词' : '新增单词'}</DialogTitle>
          <DialogDescription>
            填写单词的详细信息，带 * 号为必填项
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">
                单词 <span className="text-[#EF476F]">*</span>
              </Label>
              <Input
                value={form.word}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('word', e.target.value)
                }
                placeholder="请输入英文单词"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">音标</Label>
              <Input
                value={form.phonetic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('phonetic', e.target.value)
                }
                placeholder="/həˈloʊ/"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">词性</Label>
              <Select
                value={form.partOfSpeech}
                onValueChange={(val: string) => updateField('partOfSpeech', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择词性" />
                </SelectTrigger>
                <SelectContent>
                  {partOfSpeechOptions.map((pos: string) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">难度等级</Label>
              <Select
                value={form.level}
                onValueChange={(val: string) => updateField('level', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">入门</SelectItem>
                  <SelectItem value="elementary">初级</SelectItem>
                  <SelectItem value="intermediate">中级</SelectItem>
                  <SelectItem value="advanced">高级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">
                中文释义 <span className="text-[#EF476F]">*</span>
              </Label>
              <Input
                value={form.meaning}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('meaning', e.target.value)
                }
                placeholder="请输入中文释义"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">英文例句</Label>
              <Textarea
                value={form.exampleSentence}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('exampleSentence', e.target.value)
                }
                placeholder="请输入英文例句"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">中文例句</Label>
              <Textarea
                value={form.exampleTranslation}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateField('exampleTranslation', e.target.value)
                }
                placeholder="请输入中文例句翻译"
                rows={2}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label className="text-sm">插图URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('imageUrl', e.target.value)
                }
                placeholder="https://..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">所属教材</Label>
              <Select
                value={form.textbookId}
                onValueChange={(val: string) => {
                  updateField('textbookId', val);
                  updateField('unitId', '');
                }}
              >
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
              <Label className="text-sm">所属单元</Label>
              <Select
                value={form.unitId}
                onValueChange={(val: string) => updateField('unitId', val)}
                disabled={!form.textbookId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择单元" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u: TextbookUnit) => (
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
                value={form.wordOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateField('wordOrder', e.target.value)
                }
                placeholder="数字越小越靠前"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting || loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '保存中...' : wordId ? '保存修改' : '确认新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WordFormDialog;
