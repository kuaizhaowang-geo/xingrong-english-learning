import React, { useState, useMemo } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
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
import type { Textbook, TextbookUnit, AdminWordItem } from '@shared/api.interface';

interface BatchImportDialogProps {
  open: boolean;
  textbooks: Textbook[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedWord {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
}

const BatchImportDialog: React.FC<BatchImportDialogProps> = ({
  open,
  textbooks,
  onClose,
  onSuccess,
}) => {
  const [textbookId, setTextbookId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedWord[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [unitLoading, setUnitLoading] = useState<boolean>(false);

  const handleTextbookChange = (val: string): void => {
    setTextbookId(val);
    setUnitId('');
    if (val) {
      setUnitLoading(true);
      adminApi
        .getUnits(val)
        .then((list: TextbookUnit[]) => {
          setUnits(list ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch units', { error: String(err) });
        })
        .finally(() => setUnitLoading(false));
    } else {
      setUnits([]);
    }
  };

  const handleParse = (): void => {
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const result: ParsedWord[] = lines.map((line: string) => {
      const parts = line.split('|').map((p: string) => p.trim());
      return {
        word: parts[0] ?? '',
        phonetic: parts[1] ?? '',
        partOfSpeech: parts[2] ?? '',
        meaning: parts[3] ?? '',
      };
    });
    setParsed(result);
    setHasParsed(true);
  };

  const preview = useMemo(() => parsed.slice(0, 5), [parsed]);

  const handleImport = async (): Promise<void> => {
    if (parsed.length === 0) return;
    const valid = parsed.filter((w: ParsedWord) => w.word && w.meaning);
    if (valid.length === 0) return;

    setImporting(true);
    try {
      const words = valid.map((w: ParsedWord) => ({
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic || undefined,
        partOfSpeech: w.partOfSpeech || undefined,
      })) as Array<Partial<AdminWordItem> & { word: string; meaning: string }>;

      const payload: Record<string, unknown> = { words };
      if (textbookId) payload.textbookId = textbookId;
      if (unitId) payload.unitId = unitId;

      const api = adminApi as unknown as { batchCreateWords: (d: unknown) => Promise<unknown> };
      await api.batchCreateWords(payload);
      onSuccess();
    } catch (err) {
      logger.error('Failed to batch import words', { error: String(err) });
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = (): void => {
    setTextbookId('');
    setUnitId('');
    setUnits([]);
    setRawText('');
    setParsed([]);
    setHasParsed(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入单词</DialogTitle>
          <DialogDescription>
            选择教材和单元，粘贴单词列表（每行一条，格式：单词 | 音标 | 词性 | 释义）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">选择教材</Label>
              <Select value={textbookId} onValueChange={handleTextbookChange}>
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
              <Label className="text-sm">选择单元</Label>
              <Select
                value={unitId}
                onValueChange={setUnitId}
                disabled={!textbookId || unitLoading}
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">单词列表</Label>
            <Textarea
              value={rawText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setRawText(e.target.value);
                setHasParsed(false);
              }}
              placeholder={'hello | /həˈloʊ/ | int. | 你好\nworld | /wɜːrld/ | n. | 世界'}
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-[#6B7280]">
              格式：单词 | 音标 | 词性 | 释义，每行一个。用 | 分隔字段，可缺省音标和词性。
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleParse} disabled={!rawText.trim()}>
              解析预览
            </Button>
          </div>

          {hasParsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-[#1A1A2E]">
                  解析预览（共 {parsed.length} 条，展示前 5 条）
                </div>
              </div>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>单词</TableHead>
                      <TableHead>音标</TableHead>
                      <TableHead>词性</TableHead>
                      <TableHead>释义</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-[#6B7280]">
                          无可预览的数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      preview.map((w: ParsedWord, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-[#6B7280]">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{w.word || '-'}</TableCell>
                          <TableCell className="text-[#6B7280]">{w.phonetic || '-'}</TableCell>
                          <TableCell>{w.partOfSpeech || '-'}</TableCell>
                          <TableCell>{w.meaning || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={importing}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || parsed.length === 0}
          >
            {importing ? '导入中...' : `确认导入（${parsed.length}条）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportDialog;
