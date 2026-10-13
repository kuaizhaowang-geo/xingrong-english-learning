import React from 'react';
import { Brain } from 'lucide-react';
import type {
  MathPracticeStats,
  MathKnowledgeMastery,
} from '@shared/api.interface';

interface KnowledgeTabProps {
  stats: MathPracticeStats | null;
  masteryList: MathKnowledgeMastery[];
  loading: boolean;
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  stats,
  masteryList,
  loading,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-5 text-white shadow-md">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Brain size={20} />
          学习统计
        </h2>
      </div>

      {/* 总览卡片 */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-400">
              {stats.totalPracticeCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">总练习题数</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-500">
              {Math.round(stats.overallAccuracy * 100)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">总正确率</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold text-green-500">
              {stats.masteredTopics}
            </div>
            <div className="text-xs text-slate-400 mt-1">已掌握知识点</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold text-rose-500">
              {stats.wrongQuestionCount}
            </div>
            <div className="text-xs text-slate-400 mt-1">错题数</div>
          </div>
        </div>
      )}

      {/* 知识点掌握度 */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">知识点掌握度</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">加载中...</div>
        ) : masteryList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">暂无数据</div>
        ) : (
          <div className="space-y-3">
            {masteryList.map((m) => (
              <div key={m.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-medium">
                    {m.topicTitle || m.topicId}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {Math.round(m.accuracy * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeTab;
