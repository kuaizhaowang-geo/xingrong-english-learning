import React, { useState } from 'react';
import { Wand2, Plus } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import type {
  WordbookSubject,
  WordbookContentType,
  AddWordbookItemDto,
} from '@shared/api.interface';
import { toast } from 'sonner';

const SUBJECT_LABEL: Record<WordbookSubject, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '生字',
  phrase: '词语',
  formula: '公式',
  question: '题目',
};

interface TextExtractFormProps {
  subject: WordbookSubject;
  contentType: WordbookContentType;
  wordbookId: string;
  onAdded: () => void;
}

const TextExtractForm: React.FC<TextExtractFormProps> = ({
  subject,
  contentType,
  wordbookId,
  onAdded,
}) => {
  const [text, setText] = useState('');
  const [extracted, setExtracted] = useState<AddWordbookItemDto[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const handleExtract = async (): Promise<void> => {
    if (!text.trim()) return;
    setExtracting(true);
    try {
      const res = await wordbookApi.extractText({ text, subject, contentType });
      setExtracted(res.items);
      setChecked(new Set(res.items.map((_, i) => i)));
    } catch (err) {
      logger.error('文本提取失败', { error: String(err) });
      toast('提取失败，请稍后重试');
    } finally {
      setExtracting(false);
    }
  };

  const toggleCheck = (idx: number): void => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddSelected = async (): Promise<void> => {
    if (checked.size === 0) return;
    const items = extracted.filter((_, i) => checked.has(i));
    try {
      await wordbookApi.addItemsBatch(wordbookId, items);
      setExtracted([]);
      setChecked(new Set());
      setText('');
      onAdded();
    } catch (err) {
      logger.error('批量添加失败', { error: String(err) });
    }
  };

  return (
    <div className="space-y-4">
      <div
         className="rounded-xl p-5 space-y-4"
         style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            粘贴文本内容
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`粘贴包含${SUBJECT_LABEL[subject]}${CONTENT_TYPE_LABEL[contentType]}的文本，系统将自动提取整理...`}
            rows={8}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder:text-slate-500 resize-none"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          />
        </div>
        <button
          onClick={handleExtract}
          disabled={extracting || !text.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Wand2 className="w-4 h-4" />
          {extracting ? '提取中...' : '智能提取'}
        </button>
      </div>

      {extracted.length > 0 && (
        <div
           className="rounded-xl p-5 space-y-3"
           style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">
              提取结果（{extracted.length} 条，已选 {checked.size} 条）
            </span>
            <button
              onClick={handleAddSelected}
              disabled={checked.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              }}
            >
              <Plus className="w-4 h-4" />
              添加选中
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {extracted.map((item, idx) => (
              <div
                key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: checked.has(idx)
                      ? '1px solid #A78BFA'
                      : '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                onClick={() => toggleCheck(idx)}
              >
                <input
                  type="checkbox"
                  checked={checked.has(idx)}
                  onChange={() => toggleCheck(idx)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-purple-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {item.content}
                  </div>
                  {item.answer && (
                    <div className="text-xs mt-0.5 truncate" style={{ color: '#94A3B8' }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextExtractForm;
