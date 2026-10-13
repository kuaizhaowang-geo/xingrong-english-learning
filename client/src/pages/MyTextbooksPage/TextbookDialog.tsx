import React, { useState, useEffect } from 'react';
import { X, Languages, BookMarked, Calculator, type LucideIcon } from 'lucide-react';

export type TextbookSubject = 'english' | 'chinese' | 'math';

export interface UserTextbook {
  id: string;
  name: string;
  subject: TextbookSubject;
  grade: string;
  version: string;
  description?: string;
  coverImage?: string;
  unitCount: number;
  wordCount: number;
  sentenceCount: number;
  shareStatus: 'private' | 'pending' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTextbookDto {
  name: string;
  subject: TextbookSubject;
  grade: string;
  version: string;
  description?: string;
  coverImage?: string;
}

const SUBJECT_OPTIONS: {
  value: TextbookSubject;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { value: 'english', label: '英语', icon: Languages, color: '#2563EB' },
  { value: 'chinese', label: '语文', icon: BookMarked, color: '#EC4899' },
  { value: 'math', label: '数学', icon: Calculator, color: '#06B6D4' },
];

const GRADE_OPTIONS = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级',
  '高一', '高二', '高三',
];

const VERSION_OPTIONS = [
  '人教版PEP', '人教版新起点', '外研版', '译林版',
  '牛津版', '冀教版', '北师大版', '其他',
];

interface TextbookDialogProps {
  open: boolean;
  editingTextbook: UserTextbook | null;
  onClose: () => void;
  onSubmit: (data: CreateTextbookDto) => Promise<void>;
  submitting: boolean;
}

const TextbookDialog: React.FC<TextbookDialogProps> = ({
  open,
  editingTextbook,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [formData, setFormData] = useState<CreateTextbookDto>({
    name: '',
    subject: 'english',
    grade: '',
    version: '',
    description: '',
  });

  useEffect(() => {
    if (editingTextbook) {
      setFormData({
        name: editingTextbook.name,
        subject: editingTextbook.subject,
        grade: editingTextbook.grade,
        version: editingTextbook.version,
        description: editingTextbook.description || '',
        coverImage: editingTextbook.coverImage,
      });
    } else {
      setFormData({
        name: '',
        subject: 'english',
        grade: '',
        version: '',
        description: '',
      });
    }
  }, [editingTextbook, open]);

  if (!open) return null;

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
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {editingTextbook ? '编辑教材' : '新建教材'}
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
              教材名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入教材名称"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-gray-500"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
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
                    onClick={() => setFormData({ ...formData, subject: opt.value })}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active ? `${opt.color}20` : '#EEF2FF',
                      border: active
                        ? `1px solid ${opt.color}`
                        : '1px solid rgba(99, 102, 241, 0.2)',
                      color: active ? opt.color : '#94A3B8',
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
              年级
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none appearance-none cursor-pointer"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <option value="" style={{ background: '#FFFFFF' }}>请选择年级</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g} style={{ background: '#FFFFFF' }}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              版本
            </label>
            <select
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none appearance-none cursor-pointer"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <option value="" style={{ background: '#FFFFFF' }}>请选择版本</option>
              {VERSION_OPTIONS.map((v) => (
                <option key={v} value={v} style={{ background: '#FFFFFF' }}>{v}</option>
              ))}
            </select>
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
              placeholder="简单描述一下这本教材..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-gray-500 resize-none"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
            }}
          >
            {submitting
              ? '保存中...'
              : editingTextbook
                ? '保存修改'
                : '创建教材'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextbookDialog;
