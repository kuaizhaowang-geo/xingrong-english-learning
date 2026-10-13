import React, { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import * as adminApi from '@client/src/api/admin';
import type { StatusAction } from './course-utils';

export type { StatusAction };

interface CourseStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  action: StatusAction | null;
  onDone: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  submit_review: '提交审核',
  approve_review: '审核通过',
  reject_review: '审核驳回',
  publish: '发布课程',
  offline: '下架课程',
  delete: '删除课程',
};

const ACTION_PROMPTS: Record<string, string> = {
  submit_review: '确定要将该课程提交审核吗？提交后将进入审核流程。',
  approve_review: '确定要审核通过该课程吗？通过后课程将可以发布。',
  reject_review: '请填写驳回原因，驳回后课程将退回草稿状态。',
  publish: '确定要发布该课程吗？发布后学员将可以看到并加入该课程。',
  offline: '确定要下架该课程吗？下架后学员将无法看到该课程。',
  delete: '确定要删除该课程吗？删除后其下所有课时也将被删除，此操作不可恢复。',
};

const CourseStatusDialog: React.FC<CourseStatusDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  action,
  onDone,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const actionLabel = action ? ACTION_LABELS[action] : '';
  const prompt = action ? ACTION_PROMPTS[action] : '';
  const isReject = action === 'reject_review';
  const isDestructive = action === 'delete' || action === 'offline' || action === 'reject_review';

  const handleConfirm = async (): Promise<void> => {
    if (!action || !courseId) return;
    if (isReject && !reason.trim()) return;
    setLoading(true);
    try {
      switch (action) {
        case 'submit_review':
          await adminApi.submitCourseReview(courseId);
          break;
        case 'approve_review':
          await adminApi.approveCourseReview(courseId);
          break;
        case 'reject_review':
          await adminApi.rejectCourseReview(courseId, reason.trim());
          break;
        case 'publish':
          await adminApi.publishCourse(courseId);
          break;
        case 'offline':
          await adminApi.offlineCourse(courseId);
          break;
        case 'delete':
          await adminApi.deleteCourse(courseId);
          break;
        default:
          break;
      }
      setReason('');
      onDone();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to perform course status action', {
        action,
        error: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean): void => {
    if (!val) {
      setReason('');
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>确认{actionLabel}</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-[#1A1A2E]">{courseTitle}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-[#6B7280]">{prompt}</p>
          {isReject && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="reject-reason">驳回原因</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReason(e.target.value)
                }
                placeholder="请输入驳回原因"
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading || (isReject && !reason.trim())}
          >
            {loading ? '处理中...' : `确认${actionLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseStatusDialog;
