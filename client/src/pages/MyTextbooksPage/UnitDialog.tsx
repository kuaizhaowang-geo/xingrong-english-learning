import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface TextbookUnit {
  id: string;
  textbookId: string;
  title: string;
  unitOrder: number;
  description?: string;
  wordCount: number;
  sentenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitDto {
  title: string;
  unitOrder: number;
  description?: string;
}

interface UnitDialogProps {
  open: boolean;
  editingUnit: TextbookUnit | null;
  onClose: () => void;
  onSubmit: (data: CreateUnitDto) => Promise<void>;
  submitting: boolean;
}

const UnitDialog: React.FC<UnitDialogProps> = ({
  open,
  editingUnit,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [formData, setFormData] = useState<CreateUnitDto>({
    title: '',
    unitOrder: 1,
    description: '',
  });

  useEffect(() => {
    if (editingUnit) {
      setFormData({
        title: editingUnit.title,
        unitOrder: editingUnit.unitOrder,
        description: editingUnit.description || '',
      });
    } else {
      setFormData({
        title: '',
        unitOrder: 1,
        description: '',
      });
    }
  }, [editingUnit, open]);

  if (!open) return null;

  const handleSubmit = async (): Promise<void> => {
    if (!formData.title.trim()) return;
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
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {editingUnit ? '编辑单元' : '新建单元'}
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
              单元名称
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入单元名称，如 Unit 1 Hello"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-gray-500"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              序号
            </label>
            <input
              type="number"
              min={1}
              value={formData.unitOrder}
              onChange={(e) =>
                setFormData({ ...formData, unitOrder: parseInt(e.target.value, 10) || 1 })
              }
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{
                background: '#EEF2FF',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              单元描述（可选）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="本单元主题、重点内容等..."
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
            disabled={submitting || !formData.title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
            }}
          >
            {submitting
              ? '保存中...'
              : editingUnit
                ? '保存修改'
                : '创建单元'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitDialog;
