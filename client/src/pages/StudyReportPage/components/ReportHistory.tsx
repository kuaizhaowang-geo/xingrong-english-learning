import { Trash2, Eye, CalendarClock } from 'lucide-react';
import type { ReportListResponse, StudyReportItem } from '@shared/api.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface ReportHistoryProps {
  loading: boolean;
  list: ReportListResponse | null;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  weekly: '周报',
  monthly: '月报',
  custom: '自定义',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

function ReportHistory({ loading, list, onView, onDelete }: ReportHistoryProps) {
  const handleDelete = async (report: StudyReportItem) => {
    const confirmed = await showConfirm(
      `确定要删除「${report.title}」吗？此操作不可撤销。`,
    );
    if (confirmed) {
      onDelete(report.id);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-5 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg animate-pulse bg-fuchsia-500/20" />
          <div className="h-4 w-24 rounded animate-pulse bg-fuchsia-500/20" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg mb-2 animate-pulse bg-white/5"
          />
        ))}
      </div>
    );
  }

  const items = list?.items ?? [];

  return (
    <div className="mt-4 sm:mt-6 rounded-xl p-4 sm:p-5 glass-card">
      <div className="flex items-center gap-2 mb-4">
         <div
           className="w-8 h-8 rounded-lg flex items-center justify-center"
           style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
         >
           <CalendarClock size={16} style={{ color: '#A855F7' }} />
        </div>
         <h3 className="text-sm font-semibold text-white">
           历史报告
           {list && <span className="text-slate-400 font-normal ml-2">共 {list.total} 份</span>}
         </h3>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
           <p className="text-sm text-slate-400">暂无历史报告</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header (desktop only) */}
           <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-400">
            <div className="col-span-3">报告标题</div>
            <div className="col-span-2">类型</div>
            <div className="col-span-2">日期范围</div>
            <div className="col-span-2">总时长</div>
            <div className="col-span-1">正确率</div>
            <div className="col-span-2 text-right">操作</div>
          </div>

          {items.map((report) => (
             <div
               key={report.id}
               className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-2 items-center p-3 rounded-lg transition-colors bg-white/5 border border-white/10 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/20"
             >
              {/* Title */}
              <div className="md:col-span-3">
                 <p className="text-sm font-medium text-white truncate">
                  {report.title}
                </p>
                 <p className="text-xs text-slate-400 md:hidden">
                  {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
                  {' · '}
                  {formatDate(report.startDate)} ~ {formatDate(report.endDate)}
                </p>
              </div>

              {/* Type (desktop) */}
              <div className="hidden md:block md:col-span-2">
                 <span
                   className="inline-block px-2 py-0.5 text-xs rounded-full"
                   style={{
                     backgroundColor: 'rgba(168, 85, 247, 0.15)',
                     color: '#E879F9',
                     border: '1px solid rgba(168, 85, 247, 0.3)',
                   }}
                 >
                  {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType}
                </span>
              </div>

              {/* Date range (desktop) */}
               <div className="hidden md:block md:col-span-2 text-xs text-slate-400">
                {formatDate(report.startDate)} ~ {formatDate(report.endDate)}
              </div>

              {/* Duration */}
              <div className="md:col-span-2">
                 <span className="text-sm text-cyan-400 font-medium">
                  {(report.totalDuration / 60).toFixed(1)} 小时
                </span>
              </div>

              {/* Accuracy */}
              <div className="md:col-span-1">
                 <span className="text-sm text-yellow-400">
                  {Math.round(report.totalAccuracy)}%
                </span>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => onView(report.id)}
                   className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-400 rounded-md transition-colors hover:bg-cyan-500/10"
                >
                  <Eye size={12} />
                  <span className="hidden sm:inline">查看详情</span>
                </button>
                <button
                  onClick={() => handleDelete(report)}
                   className="flex items-center gap-1 px-2 py-1 text-xs text-pink-400 rounded-md transition-colors hover:bg-pink-500/10"
                >
                  <Trash2 size={12} />
                  <span className="hidden sm:inline">删除</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportHistory;
