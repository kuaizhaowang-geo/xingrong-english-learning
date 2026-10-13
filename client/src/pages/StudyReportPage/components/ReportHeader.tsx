import { Calendar, FileBarChart, Wand2 } from 'lucide-react';
import type { ReportType } from '@shared/api.interface';

const TABS: { key: ReportType; label: string }[] = [
  { key: 'daily', label: '日报' },
  { key: 'weekly', label: '周报' },
  { key: 'monthly', label: '月报' },
  { key: 'custom', label: '自定义' },
];

interface ReportHeaderProps {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  generating: boolean;
  previewLoading: boolean;
  onTabChange: (type: ReportType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onGenerate: () => void;
  onPreview: () => void;
}

function ReportHeader({
  reportType,
  startDate,
  endDate,
  generating,
  previewLoading,
  onTabChange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  onPreview,
}: ReportHeaderProps) {
  return (
    <div className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 glass-card">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Tabs */}
         <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                reportType === key
                   ? 'text-white shadow-md'
                   : 'text-slate-400 hover:text-white'
              }`}
              style={
                reportType === key
                  ? {
                      background:
                        'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                      boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
                    }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Daily date display */}
        {reportType === 'daily' && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#94A3B8]" />
             <span className="text-sm text-white">今日学习</span>
          </div>
        )}

        {/* Date range picker (only for custom) */}
        {reportType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                 className="px-3 py-1.5 rounded-lg text-sm text-white outline-none transition-colors focus:ring-2 focus:ring-fuchsia-500/50"
                 style={{
                   backgroundColor: 'rgba(168, 85, 247, 0.12)',
                   border: '1px solid rgba(168, 85, 247, 0.3)',
                 }}
               />
               <span className="text-slate-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm text-[#F1F5F9] outline-none transition-colors focus:ring-2 focus:ring-[#6366F1]/50"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              />
            </div>
            <button
              onClick={onPreview}
              disabled={previewLoading}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/10 disabled:opacity-50"
               style={{
                 border: '1px solid rgba(34, 211, 238, 0.4)',
               }}
            >
              <Wand2 size={14} />
              预览
            </button>
          </div>
        )}

        {/* Generate button */}
        <div className="md:ml-auto">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 hover:scale-105"
            style={{
              background:
                'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
            }}
          >
            <FileBarChart size={16} />
            {generating ? '生成中...' : '生成报告'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportHeader;
