import type { AdminRole, CourseStatus } from '@shared/api.interface';

export const SUBJECT_OPTIONS = [
  { value: 'all', label: '全部学科' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审核中' },
  { value: 'published', label: '已发布' },
  { value: 'offline', label: '已下架' },
];

export const subjectLabel = (value: string): string =>
  SUBJECT_OPTIONS.find((s) => s.value === value)?.label ?? value;

export const statusLabel = (value: string): string =>
  STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;

export const statusBadgeVariant = (
  status: string,
): { variant: 'secondary' | 'default' | 'destructive' | 'outline'; className: string } => {
  switch (status) {
    case 'draft':
      return { variant: 'secondary', className: '' };
    case 'review':
      return {
        variant: 'outline',
        className: 'text-amber-600 border-amber-300 bg-amber-50',
      };
    case 'published':
      return {
        variant: 'default',
        className: 'bg-emerald-500 hover:bg-emerald-500 text-white border-0',
      };
    case 'offline':
      return { variant: 'destructive', className: '' };
    default:
      return { variant: 'secondary', className: '' };
  }
};

export const canSubmitReview = (role: AdminRole | undefined): boolean =>
  role === 'super_admin' || role === 'editor';

export const canReview = (role: AdminRole | undefined): boolean =>
  role === 'super_admin' || role === 'reviewer';

export const canDelete = (role: AdminRole | undefined): boolean =>
  role === 'super_admin' || role === 'editor';

export type StatusAction =
  | 'submit_review'
  | 'approve_review'
  | 'reject_review'
  | 'publish'
  | 'offline'
  | 'delete';

export const getAvailableStatusActions = (
  status: CourseStatus,
  role: AdminRole | undefined,
): { key: StatusAction; label: string; danger?: boolean }[] => {
  const actions: { key: StatusAction; label: string; danger?: boolean }[] = [];
  if (status === 'draft' && canSubmitReview(role)) {
    actions.push({ key: 'submit_review', label: '提交审核' });
  }
  if (status === 'review' && canReview(role)) {
    actions.push({ key: 'approve_review', label: '审核通过' });
    actions.push({ key: 'reject_review', label: '审核驳回', danger: true });
  }
  if ((status === 'draft' || status === 'offline') && canReview(role)) {
    actions.push({ key: 'publish', label: '发布' });
  }
  if (status === 'published' && canReview(role)) {
    actions.push({ key: 'offline', label: '下架', danger: true });
  }
  if (status === 'draft' && canDelete(role)) {
    actions.push({ key: 'delete', label: '删除', danger: true });
  }
  return actions;
};
