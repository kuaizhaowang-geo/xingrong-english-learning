import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: '', label: '全部学科' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
];

const TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'sentence', label: '句子' },
  { value: 'word', label: '单词' },
  { value: 'character', label: '生字' },
  { value: 'question', label: '题目' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待复习' },
  { value: 'mastered', label: '已掌握' },
];

interface FilterButtonProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  options,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || '全部';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: 'rgba(30, 27, 58, 0.8)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: '#E2E8F0',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
        }}
      >
        <Filter size={14} style={{ color: '#818CF8' }} />
        <span>{currentLabel}</span>
        {open ? (
          <ChevronUp size={14} style={{ color: '#94A3B8' }} />
        ) : (
          <ChevronDown size={14} style={{ color: '#94A3B8' }} />
        )}
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg py-1 z-20 min-w-full"
          style={{
             background: 'rgba(15, 13, 36, 0.95)',
             border: '1px solid rgba(168, 85, 247, 0.3)',
             boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm transition-colors"
              style={{
                 color: value === opt.value ? '#E879F9' : '#E2E8F0',
                 background:
                   value === opt.value
                     ? 'rgba(168, 85, 247, 0.15)'
                     : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) {
                   e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface FilterBarProps {
  subject: string;
  itemType: string;
  status: string;
  dueOnly: boolean;
  total: number;
  onSubjectChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onDueOnlyToggle: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  subject,
  itemType,
  status,
  dueOnly,
  total,
  onSubjectChange,
  onTypeChange,
  onStatusChange,
  onDueOnlyToggle,
}) => {
  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl"
      style={{
        background: 'rgba(26, 22, 53, 0.6)',
        border: '1px solid rgba(99, 102, 241, 0.08)',
      }}
    >
      <FilterButton
        options={SUBJECT_OPTIONS}
        value={subject}
        onChange={onSubjectChange}
      />
      <FilterButton
        options={TYPE_OPTIONS}
        value={itemType}
        onChange={onTypeChange}
      />
      <FilterButton
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatusChange}
      />
      <button
        onClick={onDueOnlyToggle}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: dueOnly
            ? 'rgba(34, 211, 238, 0.2)'
            : 'rgba(30, 27, 58, 0.8)',
          border: dueOnly
            ? '1px solid rgba(34, 211, 238, 0.6)'
            : '1px solid rgba(99, 102, 241, 0.2)',
          color: dueOnly ? '#06B6D4' : '#E2E8F0',
        }}
      >
        <Sparkles size={14} />
        仅看今日到期
      </button>
      <div className="ml-auto text-sm" style={{ color: '#64748B' }}>
        共 {total} 条
      </div>
    </div>
  );
};

export default FilterBar;
