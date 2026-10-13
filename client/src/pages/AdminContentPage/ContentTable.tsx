import React from 'react';
import {
  BookOpen,
  BookMarked,
  Pencil,
  Trash2,
  LayoutList,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@client/src/components/ui/spinner';
import Image from '@client/src/components/ui/image';
import type {
  AdminCourseItem,
  TextbookTreeItem,
  AdminRole,
} from '@shared/api.interface';
import {
  subjectLabel,
  statusBadgeVariant,
  statusLabel,
  getAvailableStatusActions,
  type StatusAction,
} from '../AdminCoursesPage/course-utils';
import { COURSE_CATEGORIES } from '@shared/api.interface';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const GRADE_LABEL_MAP: Record<string, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级',
  grade7: '七年级',
  grade8: '八年级',
  grade9: '九年级',
  grade10: '高一',
  grade11: '高二',
  grade12: '高三',
};

const SEMESTER_LABELS: Record<string, string> = {
  upper: '上册',
  lower: '下册',
};

const gradeLabel = (g: string): string => GRADE_LABEL_MAP[g] ?? g;

const categoryLabel = (value: string): string =>
  COURSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

export interface UnifiedContentItem {
  id: string;
  type: 'course' | 'textbook';
  title: string;
  subject: string;
  coverImage?: string;
  category?: string;
  status?: 'draft' | 'review' | 'published' | 'offline';
  version?: number;
  totalLessons?: number;
  updatedAt?: string;
  publisher?: string;
  grade?: string;
  semester?: string;
  totalUnits?: number;
  isPublished?: boolean;
  raw: AdminCourseItem | TextbookTreeItem;
}

interface ContentTableProps {
  loading: boolean;
  items: UnifiedContentItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  adminRole?: AdminRole;
  onEditCourse: (course: AdminCourseItem) => void;
  onLessons: (course: AdminCourseItem) => void;
  onDeleteCourse: (course: AdminCourseItem) => void;
  onEditTextbook: (tb: TextbookTreeItem) => void;
  onUnitPanel: (tb: TextbookTreeItem) => void;
  onDeleteTextbook: (tb: TextbookTreeItem) => void;
  onStatusAction: (course: AdminCourseItem, action: StatusAction) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: string) => void;
}

const renderTypeBadge = (type: 'course' | 'textbook'): React.ReactNode => {
  if (type === 'course') {
    return (
      <Badge className="bg-[#4361EE]/10 text-[#4361EE] border-0">
        课程
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] border-0">
      教材
    </Badge>
  );
};

const ContentTable: React.FC<ContentTableProps> = ({
  loading,
  items,
  totalCount,
  page,
  pageSize,
  totalPages,
  adminRole,
  onEditCourse,
  onLessons,
  onDeleteCourse,
  onEditTextbook,
  onUnitPanel,
  onDeleteTextbook,
  onStatusAction,
  onPageChange,
  onPageSizeChange,
}) => {
  const renderStatusActions = (item: UnifiedContentItem): React.ReactNode => {
    if (item.type !== 'course' || !item.status) return null;
    const actions = getAvailableStatusActions(item.status, adminRole);
    if (actions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() =>
              onStatusAction(item.raw as AdminCourseItem, a.key)
            }
            className={`text-xs px-2 py-1 rounded border transition-colors hover:bg-gray-50 ${
              a.danger
                ? 'text-red-500 border-red-200 hover:bg-red-50'
                : 'text-[#4361EE] border-[#4361EE]/20 hover:bg-[#4361EE]/5'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center gap-2 text-gray-500">
        <Spinner />
        <span>加载中...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="py-16 text-center text-gray-500">暂无数据</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">类型</TableHead>
            <TableHead>名称</TableHead>
            <TableHead className="w-20">学科</TableHead>
            <TableHead className="w-24">年级</TableHead>
            <TableHead className="w-28">版本/分类</TableHead>
            <TableHead className="w-24">单元/课时</TableHead>
            <TableHead className="w-24">状态</TableHead>
            <TableHead className="w-32">更新时间</TableHead>
            <TableHead className="w-72">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item: UnifiedContentItem) => {
            const sv =
              item.type === 'course' && item.status
                ? statusBadgeVariant(item.status)
                : null;
            return (
              <TableRow key={`${item.type}-${item.id}`}>
                <TableCell>{renderTypeBadge(item.type)}</TableCell>
                <TableCell className="font-medium text-[#1A1A2E]">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {item.type === 'course' ? (
                            <BookOpen size={14} />
                          ) : (
                            <BookMarked size={14} />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                </TableCell>
                <TableCell>{subjectLabel(item.subject)}</TableCell>
                <TableCell>
                  {item.type === 'textbook'
                    ? gradeLabel(item.grade ?? '')
                    : item.grade
                      ? gradeLabel(item.grade)
                      : '-'}
                </TableCell>
                <TableCell>
                  {item.type === 'textbook'
                    ? `${item.publisher} ${SEMESTER_LABELS[item.semester ?? ''] ?? item.semester}`
                    : categoryLabel(item.category ?? '')}
                </TableCell>
                <TableCell>
                  {item.type === 'textbook'
                    ? `${item.totalUnits ?? 0} 单元`
                    : `${item.totalLessons ?? 0} 课时`}
                </TableCell>
                <TableCell>
                  {item.type === 'course' && sv ? (
                    <Badge variant={sv.variant} className={sv.className}>
                      {statusLabel(item.status as string)}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        item.isPublished
                          ? 'text-green-600 border-green-300 bg-green-50'
                          : 'text-gray-500'
                      }
                    >
                      {item.isPublished ? '已发布' : '草稿'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-gray-500 text-xs">
                  {item.type === 'course' && item.updatedAt
                    ? new Date(item.updatedAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.type === 'course' ? (
                        <>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-7 px-2 text-xs text-[#4361EE]"
                             onClick={() =>
                               onEditCourse(item.raw as AdminCourseItem)
                             }
                           >
                             <Pencil size={12} />
                             编辑封面
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-7 px-2 text-xs text-[#4361EE]"
                             onClick={() =>
                               onLessons(item.raw as AdminCourseItem)
                             }
                           >
                             <LayoutList size={12} />
                             编辑单元
                           </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500"
                            onClick={() =>
                              onDeleteCourse(item.raw as AdminCourseItem)
                            }
                          >
                            <Trash2 size={12} />
                            删除
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-[#4361EE]"
                            onClick={() =>
                              onEditTextbook(item.raw as TextbookTreeItem)
                            }
                          >
                            <Pencil size={12} />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-[#FF6B35]"
                            onClick={() =>
                              onUnitPanel(item.raw as TextbookTreeItem)
                            }
                          >
                            <LayoutList size={12} />
                            单元管理
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500"
                            onClick={() =>
                              onDeleteTextbook(item.raw as TextbookTreeItem)
                            }
                          >
                            <Trash2 size={12} />
                            删除
                          </Button>
                        </>
                      )}
                    </div>
                    {renderStatusActions(item)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>每页</span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} 条
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>共 {totalCount} 条</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-gray-600 px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ContentTable;
