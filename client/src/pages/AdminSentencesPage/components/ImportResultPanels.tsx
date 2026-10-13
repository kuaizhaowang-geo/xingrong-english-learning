import React, { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import type { ParsedSentence } from '../utils/batchImport';

interface SentencePreviewTableProps {
  parsed: ParsedSentence[];
}

const SentencePreviewTable: React.FC<SentencePreviewTableProps> = ({ parsed }) => {
  const preview = useMemo(() => parsed.slice(0, 5), [parsed]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-sm font-medium text-[#1A1A2E]">
            解析成功 {parsed.length} 条
          </span>
        </div>
        <span className="text-xs text-[#6B7280]">展示前 5 条预览</span>
      </div>
      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>英文句子</TableHead>
              <TableHead>中文翻译</TableHead>
              <TableHead className="w-16">难度</TableHead>
              <TableHead className="w-16">核心词</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((s: ParsedSentence, idx: number) => (
              <TableRow key={idx}>
                <TableCell className="text-[#6B7280]">{idx + 1}</TableCell>
                <TableCell className="font-medium max-w-[260px] truncate">
                  {s.sentence}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-[#475569]">
                  {s.translation}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{s.difficulty ?? 1}</Badge>
                </TableCell>
                <TableCell className="text-[#6B7280]">
                  {s.wordParses?.length ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface ParseErrorListProps {
  errors: string[];
}

const ParseErrorList: React.FC<ParseErrorListProps> = ({ errors }) => {
  const display = useMemo(() => errors.slice(0, 10), [errors]);
  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-red-600">
        <XCircle size={16} />
        <span className="text-sm font-medium">解析失败 {errors.length} 条</span>
      </div>
      <ul className="text-xs text-red-500 space-y-1 max-h-24 overflow-y-auto">
        {display.map((err: string, idx: number) => (
          <li key={idx}>· {err}</li>
        ))}
        {errors.length > 10 && (
          <li>· 其余 {errors.length - 10} 条省略...</li>
        )}
      </ul>
    </div>
  );
};

interface ImportResultPanelProps {
  result: {
    success: number;
    failed: number;
    errors: Array<{ index: number; sentence?: string; error: string }>;
  };
}

const ImportResultPanel: React.FC<ImportResultPanelProps> = ({ result }) => {
  const display = useMemo(() => result.errors.slice(0, 10), [result.errors]);
  return (
    <div
      className={`border rounded-lg p-4 space-y-2 ${
        result.failed > 0
          ? 'bg-amber-50 border-amber-100'
          : 'bg-[#F0FDF4] border-emerald-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">
            成功 {result.success} 条
          </span>
        </div>
        {result.failed > 0 && (
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-500" />
            <span className="text-sm font-medium text-red-600">
              失败 {result.failed} 条
            </span>
          </div>
        )}
      </div>
      {result.failed > 0 && result.errors.length > 0 && (
        <div className="pt-2 border-t border-amber-100 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-red-600 mb-1">失败详情：</p>
          <ul className="text-xs text-red-500 space-y-0.5">
            {display.map(
              (
                e: { index: number; sentence?: string; error: string },
                idx: number,
              ) => (
                <li key={idx}>
                  · 第{e.index}条
                  {e.sentence ? `（${e.sentence}）` : ''}：{e.error}
                </li>
              ),
            )}
            {result.errors.length > 10 && (
              <li>· 其余 {result.errors.length - 10} 条省略...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export { SentencePreviewTable, ParseErrorList, ImportResultPanel };
