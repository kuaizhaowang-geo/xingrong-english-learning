import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import type {
  WordbookSubject,
  WordbookContentType,
  BatchImportResult,
  AddWordbookItemDto,
} from '@shared/api.interface';

interface BatchImportFormProps {
  wordbookId: string;
  subject: WordbookSubject;
  contentType: WordbookContentType;
  onAdded: () => void;
}

interface ParseItem {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  lineNumber: number;
}

interface ParseResult {
  valid: ParseItem[];
  errors: string[];
}

const BatchImportForm: React.FC<BatchImportFormProps> = ({
  wordbookId,
  subject,
  contentType,
  onAdded,
}) => {
  const [text, setText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<BatchImportResult | null>(null);

  const parseText = (raw: string): ParseResult => {
    const valid: ParseItem[] = [];
    const errors: string[] = [];
    const lines = raw.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((s: string) => s.trim());
      const lineNum = i + 1;

      if (parts.length < 1 || !parts[0]) {
        errors.push(`第 ${lineNum} 行：内容为空`);
        continue;
      }

      const word = parts[0] || '';
      const phonetic = parts[1] || '';
      const meaning = parts[2] || '';
      const example = parts[3] || '';

      if (!word) {
        errors.push(`第 ${lineNum} 行：单词/内容不能为空`);
        continue;
      }

      valid.push({ word, phonetic, meaning, example, lineNumber: lineNum });
    }

    return { valid, errors };
  };

  const handleImport = async (): Promise<void> => {
    if (!text.trim()) return;

    const parsed = parseText(text);
    if (parsed.valid.length === 0) {
      setResult({ success: 0, failed: parsed.errors.length, errors: parsed.errors });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const items: AddWordbookItemDto[] = parsed.valid.map((item: ParseItem) => ({
        subject,
        contentType,
        content: item.word,
        answer: item.meaning,
        example: item.example,
        subtitle: item.phonetic,
      }));

      const res = await wordbookApi.addItemsBatch(wordbookId, items);
      const allErrors = [...parsed.errors, ...res.errors];
      const finalResult: BatchImportResult = {
        success: res.success,
        failed: parsed.errors.length + res.failed,
        errors: allErrors,
      };
      setResult(finalResult);

      if (res.success > 0) {
        onAdded();
      }
    } catch (err) {
      logger.error('批量导入失败', { error: String(err) });
      setResult({
        success: 0,
        failed: parsed.valid.length,
        errors: [...parsed.errors, `导入失败：${err instanceof Error ? err.message : String(err)}`],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClear = (): void => {
    setText('');
    setResult(null);
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99, 102, 241, 0.12)' }}
        >
          <Upload className="w-5 h-5" style={{ color: '#6366F1' }} />
        </div>
        <div>
          <h3 className="text-white font-semibold">批量导入</h3>
          <p className="text-sm" style={{ color: '#94A3B8' }}>
            粘贴文本批量添加内容，每行一条
          </p>
        </div>
      </div>

      {/* 格式说明 */}
      <div
        className="rounded-xl p-4 text-sm mb-4"
        style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}
      >
        <div className="text-gray-300 font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" style={{ color: '#6366F1' }} />
          格式说明（每行一条，英文逗号分隔）：
        </div>
        <div className="space-y-1" style={{ color: '#94A3B8' }}>
          <div>格式：<code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>单词,音标,释义,例句</code></div>
          <div>示例：<code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>apple,/ˈæpl/,苹果,I eat an apple every day.</code></div>
          <div>• 单词/内容为必填，其余字段可选</div>
          <div>• 最多支持 200 条一次导入</div>
        </div>
      </div>

      {/* 文本输入区 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'每行一个单词，格式：单词,音标,释义,例句\n例如：\napple,/ˈæpl/,苹果,I eat an apple.\nbook,/bʊk/,书,I read a book.'}
        className="w-full h-48 p-4 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none resize-none font-mono"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleImport}
          disabled={importing || !text.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          {importing ? '导入中...' : '开始导入'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
          style={{
            color: '#94A3B8',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          清空
        </button>
      </div>

      {/* 导入结果 */}
      {result && (
        <div
          className="mt-6 rounded-xl p-4"
           style={{
             background: 'rgba(255, 255, 255, 0.05)',
             border: '1px solid rgba(139, 92, 246, 0.2)',
           }}
        >
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#22C55E' }} />
              <span className="text-white font-medium">成功 {result.success} 条</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" style={{ color: '#EF476F' }} />
              <span className="text-white font-medium">失败 {result.failed} 条</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: '#EF476F' }}>
                失败详情：
              </div>
              <div
                className="max-h-40 overflow-y-auto space-y-1 text-xs rounded-lg p-3"
                style={{ background: 'rgba(239, 71, 111, 0.1)' }}
              >
                {result.errors.map((err: string, idx: number) => (
                  <div key={idx} style={{ color: '#F87171' }}>
                    • {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchImportForm;
