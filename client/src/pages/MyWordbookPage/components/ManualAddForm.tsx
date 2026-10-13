import React, { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import type {
  WordbookSubject,
  WordbookContentType,
  AddWordbookItemDto,
} from '@shared/api.interface';

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

function getFieldConfigs(
  subject: WordbookSubject,
  contentType: WordbookContentType,
): FieldConfig[] {
  if (subject === 'english') {
    if (contentType === 'word') {
      return [
        { key: 'content', label: '单词', placeholder: '请输入英文单词', required: true },
        { key: 'phonetic', label: '音标', placeholder: '例如：/həˈloʊ/' },
        { key: 'answer', label: '释义', placeholder: '中文释义' },
        { key: 'example', label: '例句', placeholder: '例句', multiline: true },
      ];
    }
    return [
      { key: 'content', label: '句子', placeholder: '请输入英文句子', required: true, multiline: true },
      { key: 'answer', label: '翻译', placeholder: '中文翻译', multiline: true },
      { key: 'grammar', label: '语法点', placeholder: '涉及的语法点' },
    ];
  }
  if (subject === 'chinese') {
    if (contentType === 'character') {
      return [
        { key: 'content', label: '汉字', placeholder: '请输入汉字', required: true },
        { key: 'pinyin', label: '拼音', placeholder: '拼音' },
        { key: 'strokes', label: '笔画数', placeholder: '例如：8' },
        { key: 'radical', label: '部首', placeholder: '部首' },
        { key: 'answer', label: '组词', placeholder: '常用组词，用逗号分隔' },
        { key: 'example', label: '例句', placeholder: '例句', multiline: true },
      ];
    }
    return [
      { key: 'content', label: '词语', placeholder: '请输入词语', required: true },
      { key: 'pinyin', label: '拼音', placeholder: '拼音' },
      { key: 'answer', label: '释义', placeholder: '词语释义', multiline: true },
      { key: 'synonyms', label: '近义词', placeholder: '近义词，用逗号分隔' },
      { key: 'antonyms', label: '反义词', placeholder: '反义词，用逗号分隔' },
    ];
  }
  if (contentType === 'formula') {
    return [
      { key: 'content', label: '公式名称', placeholder: '例如：勾股定理', required: true },
      { key: 'formula', label: '公式', placeholder: '公式表达式' },
      { key: 'answer', label: '说明', placeholder: '公式说明', multiline: true },
      { key: 'example', label: '例题', placeholder: '例题', multiline: true },
    ];
  }
  return [
    { key: 'content', label: '题目', placeholder: '请输入题目内容', required: true, multiline: true },
    { key: 'answer', label: '答案', placeholder: '正确答案' },
    { key: 'solutionSteps', label: '解题步骤', placeholder: '解题步骤，每行一步', multiline: true, rows: 4 },
    { key: 'knowledgePoint', label: '知识点', placeholder: '涉及的知识点' },
  ];
}

export function buildItemDto(
  subject: WordbookSubject,
  contentType: WordbookContentType,
  fields: Record<string, string>,
): AddWordbookItemDto {
  const dto: AddWordbookItemDto = {
    subject,
    contentType,
    content: fields.content || '',
    answer: fields.answer || undefined,
    example: fields.example || undefined,
    extra: {},
  };

  if (subject === 'english') {
    if (fields.phonetic) dto.extra!.phonetic = fields.phonetic;
    if (fields.grammar) dto.extra!.grammar = fields.grammar;
  } else if (subject === 'chinese') {
    if (fields.pinyin) dto.extra!.pinyin = fields.pinyin;
    if (fields.strokes) dto.extra!.strokes = Number(fields.strokes);
    if (fields.radical) dto.extra!.radical = fields.radical;
    if (fields.synonyms) {
      dto.extra!.synonyms = fields.synonyms
        .split(/[,，]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    if (fields.antonyms) {
      dto.extra!.antonyms = fields.antonyms
        .split(/[,，]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
  } else {
    if (fields.formula) dto.extra!.formula = fields.formula;
    if (fields.knowledgePoint) dto.extra!.knowledgePoint = fields.knowledgePoint;
    if (fields.solutionSteps) {
      dto.extra!.solutionSteps = fields.solutionSteps.split('\n').filter(Boolean);
    }
  }

  if (dto.extra && Object.keys(dto.extra).length === 0) {
    delete dto.extra;
  }

  return dto;
}

interface ManualAddFormProps {
  subject: WordbookSubject;
  contentType: WordbookContentType;
  wordbookId: string;
  onAdded: () => void;
}

const ManualAddForm: React.FC<ManualAddFormProps> = ({
  subject,
  contentType,
  wordbookId,
  onAdded,
}) => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldConfigs = getFieldConfigs(subject, contentType);

  const handleSubmit = async (): Promise<void> => {
    if (!fields.content?.trim()) return;
    setSubmitting(true);
    try {
      const dto: AddWordbookItemDto = buildItemDto(subject, contentType, fields);
      await wordbookApi.addWordbookItem(wordbookId, dto);
      setFields({});
      onAdded();
    } catch (err) {
      logger.error('添加内容失败', { error: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(139, 92, 246, 0.25)' }}
    >
      {fieldConfigs.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {f.label}
            {f.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          {f.multiline ? (
            <textarea
              value={fields[f.key] || ''}
              onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              rows={f.rows || 3}
               className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-slate-500 resize-none"
               style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            />
          ) : (
            <input
              type="text"
              value={fields[f.key] || ''}
              onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
              placeholder={f.placeholder}
               className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-slate-500"
               style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            />
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={submitting || !fields.content?.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        style={{
           background: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)',
           boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
        }}
      >
        {submitting ? '添加中...' : '添加内容'}
      </button>
    </div>
  );
};

export default ManualAddForm;
