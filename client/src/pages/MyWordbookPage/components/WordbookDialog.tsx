import React, { useState } from 'react';
import { X, Languages, BookMarked, Calculator, type LucideIcon } from 'lucide-react';
import type {
  UserWordbook,
  WordbookSubject,
  WordbookContentType,
  CreateWordbookDto,
} from '@shared/api.interface';

interface WordbookDialogProps {
  open: boolean;
  editingWordbook: UserWordbook | null;
  onClose: () => void;
  onSubmit: (data: CreateWordbookDto) => Promise<void>;
  submitting: boolean;
}

const SUBJECT_OPTIONS: {
  value: WordbookSubject;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { value: 'english', label: '英语', icon: Languages, color: '#2563EB' },
  { value: 'chinese', label: '语文', icon: BookMarked, color: '#EC4899' },
  { value: 'math', label: '数学', icon: Calculator, color: '#06B6D4' },
];

const CONTENT_TYPE_MAP: Record<
  WordbookSubject,
  { value: WordbookContentType; label: string }[]
> = {
  english: [
    { value: 'word', label: '单词' },
    { value: 'sentence', label: '句子' },
  ],
  chinese: [
    { value: 'character', label: '生字' },
    { value: 'phrase', label: '词语' },
  ],
  math: [
    { value: 'formula', label: '公式' },
    { value: 'question', label: '题目' },
  ],
};

const WordbookDialog: React.FC<WordbookDialogProps> = ({
  open,
  editingWordbook,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [formData, setFormData] = useState<CreateWordbookDto>(
    editingWordbook
      ? {
          name: editingWordbook.name,
          subject: editingWordbook.subject,
          contentType: editingWordbook.contentType,
          description: editingWordbook.description || '',
        }
      : { name: '', subject: 'english', contentType: 'word', description: '' },
  );

  if (!open) return null;

  const handleSubjectChange = (subject: WordbookSubject): void => {
    const firstType = CONTENT_TYPE_MAP[subject][0].value;
    setFormData((prev) => ({ ...prev, subject, contentType: firstType }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name.trim()) return;
    await onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {editingWordbook ? '编辑词库' : '新建词库'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              词库名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入词库名称"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-slate-500"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              学科
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = formData.subject === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSubjectChange(opt.value)}
                    disabled={!!editingWordbook}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all"
                     style={{
                       background: active ? `${opt.color}20` : 'rgba(255, 255, 255, 0.03)',
                       border: active
                         ? `1px solid ${opt.color}`
                         : '1px solid rgba(255, 255, 255, 0.1)',
                       color: active ? opt.color : '#94A3B8',
                       opacity: editingWordbook ? 0.5 : 1,
                       cursor: editingWordbook ? 'not-allowed' : 'pointer',
                     }}
                  >
                    <Icon className="w-5 h-5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              内容类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPE_MAP[formData.subject].map((ct) => {
                const active = formData.contentType === ct.value;
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, contentType: ct.value })
                    }
                    disabled={!!editingWordbook}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                     style={{
                       background: active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                       border: active
                         ? '1px solid #8B5CF6'
                         : '1px solid rgba(255, 255, 255, 0.1)',
                       color: active ? '#A78BFA' : '#94A3B8',
                       opacity: editingWordbook ? 0.5 : 1,
                       cursor: editingWordbook ? 'not-allowed' : 'pointer',
                     }}
                  >
                    {ct.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              描述（可选）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="简单描述一下这个词库..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-slate-500 resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
            style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
             style={{
               background: 'linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)',
               boxShadow: '0 0 20px rgba(139, 92, 246, 0.35)',
             }}
          >
            {submitting
              ? '保存中...'
              : editingWordbook
                ? '保存修改'
                : '创建词库'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordbookDialog;
