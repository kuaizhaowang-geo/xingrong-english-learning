import React, { useEffect, useState, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Plus, Trash2, Sparkles } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import * as adminApi from '@client/src/api/admin';
import type {
  AdminSentenceItem,
  Textbook,
  TextbookUnit,
  WordParse,
} from '@shared/api.interface';

interface SentenceFormDialogProps {
  open: boolean;
  sentenceId: string | null;
  textbooks: Textbook[];
  onClose: () => void;
  onSuccess: () => void;
}

const GRAMMAR_ROLES = [
  '主语', '谓语', '宾语', '定语', '状语', '补语', '表语',
  '同位语', '插入语', '连接词', '冠词', '介词', '助词',
];

const PART_OF_SPEECH_OPTIONS = [
  'n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'num.', 'art.', 'int.',
];

interface SentenceFormData {
  sentence: string;
  translation: string;
  sentenceAnalysis: string;
  imageUrl: string;
  puzzleOrder: string;
  difficulty: string;
  textbookId: string;
  unitId: string;
  wordParses: WordParse[];
}

const DEFAULT_FORM: SentenceFormData = {
  sentence: '',
  translation: '',
  sentenceAnalysis: '',
  imageUrl: '',
  puzzleOrder: '',
  difficulty: '',
  textbookId: '',
  unitId: '',
  wordParses: [],
};

const SentenceFormDialog: React.FC<SentenceFormDialogProps> = ({
  open,
  sentenceId,
  textbooks,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<SentenceFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [unitLoading, setUnitLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
      if (sentenceId) {
        setLoading(true);
        adminApi
          .getSentence(sentenceId)
          .then((data: AdminSentenceItem) => {
            setForm({
              sentence: data.sentence,
              translation: data.translation,
              sentenceAnalysis: data.sentenceAnalysis ?? '',
              imageUrl: data.imageUrl ?? '',
              puzzleOrder: data.puzzleOrder !== undefined ? String(data.puzzleOrder) : '',
              difficulty: '',
              textbookId: data.textbookId ?? '',
              unitId: data.unitId ?? '',
              wordParses: data.wordParses ?? [],
            });
            if (data.textbookId) {
              fetchUnits(data.textbookId);
            }
          })
          .catch((err: unknown) => {
            logger.error('Failed to fetch sentence detail', { error: String(err) });
          })
          .finally(() => setLoading(false));
      }
    }
  }, [open, sentenceId]);

  const fetchUnits = (textbookId: string): void => {
    setUnitLoading(true);
    adminApi
      .getUnits(textbookId)
      .then((list: TextbookUnit[]) => {
        setUnits(list ?? []);
      })
      .catch((err: unknown) => {
        logger.error('Failed to fetch units', { error: String(err) });
      })
      .finally(() => setUnitLoading(false));
  };

  const handleTextbookChange = (val: string): void => {
    setForm((prev: SentenceFormData) => ({ ...prev, textbookId: val, unitId: '' }));
    if (val) {
      fetchUnits(val);
    } else {
      setUnits([]);
    }
  };

  const updateField = useCallback(
    (field: keyof SentenceFormData, value: string | WordParse[]): void => {
      setForm((prev: SentenceFormData) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleAutoParse = (): void => {
    const words = form.sentence
      .split(/\s+/)
      .filter((w: string) => w.length > 0)
      .map((w: string) => ({
        word: w.replace(/[.,!?;:'"()]/g, ''),
        phonetic: '',
        partOfSpeech: '',
        meaning: '',
        grammarRole: '',
      }));
    setForm((prev: SentenceFormData) => ({ ...prev, wordParses: words }));
  };

  const handleAddWord = (): void => {
    const newWord: WordParse = {
      word: '',
      phonetic: '',
      partOfSpeech: '',
      meaning: '',
      grammarRole: '',
    };
    setForm((prev: SentenceFormData) => ({
      ...prev,
      wordParses: [...prev.wordParses, newWord],
    }));
  };

  const handleRemoveWord = (idx: number): void => {
    setForm((prev: SentenceFormData) => ({
      ...prev,
      wordParses: prev.wordParses.filter((_: WordParse, i: number) => i !== idx),
    }));
  };

  const handleWordFieldChange = (idx: number, field: keyof WordParse, value: string): void => {
    setForm((prev: SentenceFormData) => {
      const next = [...prev.wordParses];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, wordParses: next };
    });
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.sentence.trim() || !form.translation.trim()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        sentence: form.sentence.trim(),
        translation: form.translation.trim(),
        wordParses: form.wordParses,
      };
      if (form.sentenceAnalysis) payload.sentenceAnalysis = form.sentenceAnalysis;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.puzzleOrder) payload.puzzleOrder = Number(form.puzzleOrder);
      if (form.difficulty) payload.difficulty = Number(form.difficulty);
      if (form.textbookId) payload.textbookId = form.textbookId;
      if (form.unitId) payload.unitId = form.unitId;

      if (sentenceId) {
        await adminApi.updateSentence(sentenceId, payload);
      } else {
        await adminApi.createSentence(
          payload as Parameters<typeof adminApi.createSentence>[0],
        );
      }
      onSuccess();
    } catch (err) {
      logger.error('Failed to save sentence', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sentenceId ? '编辑句子' : '新增句子'}</DialogTitle>
          <DialogDescription>
            填写句子详情及逐词解析，带 * 为必填项
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-[#6B7280]">加载中...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-sm">
                  英文句子 <span className="text-[#EF476F]">*</span>
                </Label>
                <Textarea
                  value={form.sentence}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateField('sentence', e.target.value)
                  }
                  placeholder="请输入英文句子"
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-sm">
                  中文翻译 <span className="text-[#EF476F]">*</span>
                </Label>
                <Textarea
                  value={form.translation}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateField('translation', e.target.value)
                  }
                  placeholder="请输入中文翻译"
                  rows={2}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-sm">句子解析</Label>
                <Textarea
                  value={form.sentenceAnalysis}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateField('sentenceAnalysis', e.target.value)
                  }
                  placeholder="语法结构、重点句型、文化背景等解析"
                  rows={3}
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
                <Label className="text-sm">所属单元</Label>
                <Select
                  value={form.unitId}
                  onValueChange={(val: string) => updateField('unitId', val)}
                  disabled={!form.textbookId || unitLoading}
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
                  value={form.puzzleOrder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateField('puzzleOrder', e.target.value)
                  }
                  placeholder="数字越小越靠前"
                />
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
                    <SelectItem value="1">1 - 最简单</SelectItem>
                    <SelectItem value="2">2 - 简单</SelectItem>
                    <SelectItem value="3">3 - 中等</SelectItem>
                    <SelectItem value="4">4 - 较难</SelectItem>
                    <SelectItem value="5">5 - 最难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 逐词解析表格 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">逐词解析</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoParse}
                    disabled={!form.sentence.trim()}
                  >
                    <Sparkles size={14} />
                    自动解析
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddWord}>
                    <Plus size={14} />
                    添加单词
                  </Button>
                </div>
              </div>

              <div className="border border-gray-100 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">单词</TableHead>
                      <TableHead className="w-[140px]">音标</TableHead>
                      <TableHead className="w-[100px]">词性</TableHead>
                      <TableHead className="w-[180px]">中文释义</TableHead>
                      <TableHead className="w-[140px]">语法成分</TableHead>
                      <TableHead className="w-[60px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.wordParses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-6 text-[#6B7280]"
                        >
                          暂无逐词解析，点击「自动解析」根据句子拆分，或手动添加
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.wordParses.map((wp: WordParse, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              size={1}
                              value={wp.word}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleWordFieldChange(idx, 'word', e.target.value)
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={wp.phonetic}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleWordFieldChange(idx, 'phonetic', e.target.value)
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={wp.partOfSpeech}
                              onValueChange={(val: string) =>
                                handleWordFieldChange(idx, 'partOfSpeech', val)
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="词性" />
                              </SelectTrigger>
                              <SelectContent>
                                {PART_OF_SPEECH_OPTIONS.map((pos: string) => (
                                  <SelectItem key={pos} value={pos}>
                                    {pos}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={wp.meaning}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleWordFieldChange(idx, 'meaning', e.target.value)
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={wp.grammarRole}
                              onValueChange={(val: string) =>
                                handleWordFieldChange(idx, 'grammarRole', val)
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="语法成分" />
                              </SelectTrigger>
                              <SelectContent>
                                {GRAMMAR_ROLES.map((role: string) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#EF476F] hover:text-[#EF476F]"
                              onClick={() => handleRemoveWord(idx)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting || loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '保存中...' : sentenceId ? '保存修改' : '确认新增'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SentenceFormDialog;
