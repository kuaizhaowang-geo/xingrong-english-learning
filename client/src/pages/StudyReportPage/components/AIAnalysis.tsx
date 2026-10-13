import { Flame, Lightbulb, BarChart3, Clock, CalendarCheck } from 'lucide-react';
import type { StudyReportItem } from '@shared/api.interface';

interface AIAnalysisProps {
  report: StudyReportItem;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '早晨 06:00-09:00',
  noon: '上午 09:00-12:00',
  afternoon: '下午 12:00-18:00',
  evening: '晚上 18:00-22:00',
  night: '深夜 22:00-24:00',
};

function AIAnalysis({ report }: AIAnalysisProps) {
  // Find the most active time slot
  const mostActiveSlot = Object.entries(report.habitsAnalysis.timeDistribution).reduce(
    (acc, [slot, value]) => (value > acc.value ? { slot, value } : acc),
    { slot: 'evening', value: 0 },
  );

  return (
    <div className="space-y-4 sm:space-y-6">
       {/* Weak Points */}
       <div className="rounded-xl p-4 sm:p-5 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 71, 111, 0.2)' }}
          >
            <Flame size={16} style={{ color: '#EF476F' }} />
          </div>
           <h3 className="text-sm font-semibold text-white">
             AI 薄弱环节分析
           </h3>
        </div>

        {report.weakPoints.length === 0 ? (
           <p className="text-sm text-slate-400">
             太棒了！暂未发现明显的薄弱环节，继续保持 👍
           </p>
        ) : (
          <ul className="space-y-3">
            {report.weakPoints.map((point, idx) => (
               <li
                 key={idx}
                 className="flex items-start gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20"
               >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(239, 71, 111, 0.2)',
                    color: '#EF476F',
                  }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {point.name}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#EF476F' }}
                    >
                      正确率 {Math.round(point.accuracy)}%
                    </span>
                  </div>
                   <p className="text-xs text-slate-400">{point.suggestion}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

       {/* AI Suggestions */}
       <div className="rounded-xl p-4 sm:p-5 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 209, 102, 0.2)' }}
          >
            <Lightbulb size={16} style={{ color: '#FFD166' }} />
          </div>
           <h3 className="text-sm font-semibold text-white">
             AI 个性化建议
           </h3>
        </div>

        {report.aiSuggestions.length === 0 ? (
           <p className="text-sm text-slate-400">正在生成个性化建议...</p>
        ) : (
          <ul className="space-y-2">
            {report.aiSuggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span
                  className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                  style={{ backgroundColor: '#FFD166' }}
                />
                 <span className="text-sm text-slate-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

       {/* Habits Analysis */}
       <div className="rounded-xl p-4 sm:p-5 glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34, 211, 238, 0.2)' }}
          >
            <BarChart3 size={16} style={{ color: '#06B6D4' }} />
          </div>
           <h3 className="text-sm font-semibold text-white">
             学习习惯分析
           </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <div className="p-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
             <div className="flex items-center gap-2 mb-1">
               <Clock size={14} className="text-fuchsia-400" />
               <span className="text-xs text-slate-400">最常学习时段</span>
             </div>
             <p className="text-sm font-medium text-white">
              {TIME_SLOT_LABELS[mostActiveSlot.slot] ?? mostActiveSlot.slot}
            </p>
          </div>

           <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
             <div className="flex items-center gap-2 mb-1">
               <Clock size={14} className="text-purple-400" />
               <span className="text-xs text-slate-400">平均单次时长</span>
             </div>
             <p className="text-sm font-medium text-white">
              {report.habitsAnalysis.avgSessionDuration} 分钟
            </p>
          </div>

           <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
             <div className="flex items-center gap-2 mb-1">
               <CalendarCheck size={14} className="text-cyan-400" />
               <span className="text-xs text-slate-400">最活跃日</span>
             </div>
             <p className="text-sm font-medium text-white">
              {report.habitsAnalysis.mostActiveDay}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAnalysis;
