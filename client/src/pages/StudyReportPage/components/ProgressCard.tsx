import { BookOpen, MessageSquare, Volume2, GraduationCap } from 'lucide-react';
import type { StudyReportItem, ProgressItem, ProgressStats } from '@shared/api.interface';

interface ProgressCardProps {
  report: StudyReportItem;
}

const MAIN_PROGRESS: {
  key: keyof Omit<ProgressStats, 'textbooks'>;
  label: string;
  icon: typeof BookOpen;
  color: string;
}[] = [
  { key: 'words', label: '单词学习', icon: BookOpen, color: '#6366F1' },
  { key: 'sentences', label: '句子练习', icon: MessageSquare, color: '#06B6D4' },
  { key: 'phonetics', label: '音标学习', icon: Volume2, color: '#F97316' },
];

function ProgressBar({
  item,
  color,
}: {
  item: ProgressItem;
  color: string;
}) {
  const pct = item.total > 0 ? Math.round((item.learned / item.total) * 100) : 0;
  return (
    <div className="flex items-center justify-between mb-1.5">
       <span className="text-xs text-slate-400">
         已学 {item.learned.toLocaleString()} / 总 {item.total.toLocaleString()}
       </span>
      <span
        className="text-xs font-semibold"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}

function ProgressCard({ report }: ProgressCardProps) {
  const progressStats = (report.progressStats ?? {}) as Partial<ProgressStats>;
  const safeProgress = {
    words: progressStats.words ?? { learned: 0, total: 0 },
    sentences: progressStats.sentences ?? { learned: 0, total: 0 },
    phonetics: progressStats.phonetics ?? { learned: 0, total: 0 },
    textbooks: progressStats.textbooks ?? [],
  };

  return (
    <div className="rounded-xl p-4 sm:p-5 glass-card">
      <h3 className="text-sm font-semibold text-white mb-5">
        学习进度
      </h3>

      {/* Main progress bars */}
      <div className="space-y-5">
         {MAIN_PROGRESS.map(({ key, label, icon: Icon, color }) => {
           const item = safeProgress[key];
           if (!item) return null;
           return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                 <span className="text-sm font-medium text-white">{label}</span>
              </div>
              <ProgressBar item={item} color={color} />
            </div>
          );
        })}
      </div>

      {/* Textbook progress */}
      {safeProgress.textbooks.length > 0 && (
         <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
            >
              <GraduationCap size={14} style={{ color: '#2563EB' }} />
            </div>
             <span className="text-sm font-medium text-white">教材学习进度</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
             {safeProgress.textbooks.map((tb, idx) => (
               <div
                 key={idx}
                 className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20"
               >
                 <p className="text-xs font-medium text-white mb-1 truncate">
                  {tb.grade}
                </p>
                 <p className="text-xs text-slate-400 mb-2 truncate">
                  {tb.unit}
                </p>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-semibold text-fuchsia-400">
                    {tb.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressCard;
