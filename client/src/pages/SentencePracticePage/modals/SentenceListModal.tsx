import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import ContentSidebar from '@client/src/components/ContentSidebar';
import type { ContentSidebarItem } from '@client/src/components/ContentSidebar';

interface SentenceListModalProps {
  open: boolean;
  onClose: () => void;
  sentenceList: Array<{ id: string; sentence: string; translation: string }>;
  currentIndex: number;
  onJumpTo: (index: number) => void;
  masteryMap: Record<string, 'mastered' | 'review'>;
  completedSet: Set<string>;
  onBatchMastered: () => void;
  onBatchUnfamiliar: () => void;
}

type ItemStatus = 'pending' | 'completed' | 'mastered' | 'review';

function getItemStatus(
  id: string,
  masteryMap: Record<string, 'mastered' | 'review'>,
  completedSet: Set<string>,
): ItemStatus {
  if (masteryMap[id] === 'mastered') return 'mastered';
  if (masteryMap[id] === 'review') return 'review';
  if (completedSet.has(id)) return 'completed';
  return 'pending';
}

const SentenceListModal: React.FC<SentenceListModalProps> = ({
  open,
  onClose,
  sentenceList,
  currentIndex,
  onJumpTo,
  masteryMap,
  completedSet,
  onBatchMastered,
  onBatchUnfamiliar,
}) => {
  const total: number = sentenceList.length;
  const completedCount: number = completedSet.size;
  const masteredCount: number = Object.values(masteryMap).filter(
    (v: string) => v === 'mastered',
  ).length;
  const reviewCount: number = Object.values(masteryMap).filter(
    (v: string) => v === 'review',
  ).length;

  const items: ContentSidebarItem[] = sentenceList.map(
    (item, idx: number) => ({
      id: item.id,
      index: idx,
      preview: item.sentence,
      subtitle: item.translation,
      status: getItemStatus(item.id, masteryMap, completedSet),
    }),
  );

  const footerActions = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">批量标记</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onBatchMastered();
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all active:scale-95"
        >
          <CheckCircle2 size={14} />
          全部掌握
        </button>
        <button
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onBatchUnfamiliar();
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all active:scale-95"
        >
          <XCircle size={14} />
          全部不熟
        </button>
      </div>
    </div>
  );

  return (
    <ContentSidebar
      open={open}
      onClose={onClose}
      title="学习内容"
      items={items}
      currentIndex={currentIndex}
      onJumpTo={onJumpTo}
      footerText={`${completedCount} / ${total}`}
      masteredCount={masteredCount}
      reviewCount={reviewCount}
      footerActions={footerActions}
    />
  );
};

export default SentenceListModal;
