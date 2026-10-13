import React, { useState } from 'react';
import { Search, Filter, SortAsc, ChevronDown } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';

interface WrongBookFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterOptions: Array<{ value: string; label: string }>;
  sortOptions: Array<{ value: string; label: string }>;
}

const WrongBookFilterBar: React.FC<WrongBookFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  filterOptions,
  sortOptions,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="搜索英文/中文..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* 筛选下拉 */}
      <div className="relative">
        <button
          onClick={() => {
            setShowFilterDropdown(!showFilterDropdown);
            setShowSortDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm glass-card rounded-lg hover:border-fuchsia-500/50 transition-colors text-slate-300"
        >
          <Filter size={14} />
          {filterOptions.find((f) => f.value === filter)?.label || '筛选'}
          <ChevronDown size={14} />
        </button>
        {showFilterDropdown && (
           <div className="absolute top-full left-0 mt-1 glass-card rounded-lg shadow-lg py-1 min-w-[140px] z-10">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onFilterChange(opt.value);
                  setShowFilterDropdown(false);
                }}
                 className={`w-full text-left px-3 py-2 text-sm hover:bg-fuchsia-500/10 transition-colors ${
                   filter === opt.value ? 'text-fuchsia-400 font-medium' : 'text-slate-300'
                 }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 排序下拉 */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSortDropdown(!showSortDropdown);
            setShowFilterDropdown(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm glass-card rounded-lg hover:border-fuchsia-500/50 transition-colors text-slate-300"
        >
          <SortAsc size={14} />
          排序
          <ChevronDown size={14} />
        </button>
        {showSortDropdown && (
           <div className="absolute top-full left-0 mt-1 glass-card rounded-lg shadow-lg py-1 min-w-[160px] z-10">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSortChange(opt.value);
                  setShowSortDropdown(false);
                }}
                 className={`w-full text-left px-3 py-2 text-sm hover:bg-fuchsia-500/10 transition-colors ${
                   sortBy === opt.value ? 'text-fuchsia-400 font-medium' : 'text-slate-300'
                 }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WrongBookFilterBar;
