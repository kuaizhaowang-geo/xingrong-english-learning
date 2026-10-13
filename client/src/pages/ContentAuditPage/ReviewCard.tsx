import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_LABELS: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
const STATUS_CLASSES: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50', approved: 'text-green-600 bg-green-50', rejected: 'text-red-500 bg-red-50',
};

interface ReviewCardProps {
  status: string;
  typeLabel: string;
  authorLabel?: string;
  content: string;
  autoCheck?: Record<string, unknown>;
  time: string;
  onApprove: () => void;
  onReject: () => void;
  canAct: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  status, typeLabel, authorLabel, content, autoCheck, time,
  onApprove, onReject, canAct,
}) => (
  <div className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-2">
      <Badge className={STATUS_CLASSES[status] || ''} variant="outline">
        {STATUS_LABELS[status] || status}
      </Badge>
      <span className="text-xs text-gray-500">{typeLabel}</span>
      {authorLabel && <span className="text-xs text-gray-400">{authorLabel}</span>}
    </div>
    <p className="text-sm text-gray-700 line-clamp-2 mb-2">{content || '（无内容）'}</p>
    {autoCheck && Object.keys(autoCheck).length > 0 && (
      <p className="text-xs text-gray-400 mb-3">
        自动审核：{JSON.stringify(autoCheck).slice(0, 100)}
      </p>
    )}
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{time}</span>
      <div className="flex gap-2">
        <Button
          size="sm" variant="outline"
          className="text-green-600 border-green-200 hover:bg-green-50"
          onClick={onApprove} disabled={!canAct}
        >
          <ThumbsUp className="w-4 h-4" /> 通过
        </Button>
        <Button
          size="sm" variant="outline"
          className="text-red-500 border-red-200 hover:bg-red-50"
          onClick={onReject} disabled={!canAct}
        >
          <ThumbsDown className="w-4 h-4" /> 拒绝
        </Button>
      </div>
    </div>
  </div>
);

export default ReviewCard;
