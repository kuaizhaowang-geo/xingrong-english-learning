import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutList,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { Spinner } from '@client/src/components/ui/spinner';
import Image from '@client/src/components/ui/image';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import {
  COURSE_CATEGORIES,
  type AdminCourseItem,
  type PagedResponse,
  type CourseStatus,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import {
  SUBJECT_OPTIONS,
  STATUS_OPTIONS,
  subjectLabel,
  statusLabel,
  statusBadgeVariant,
  getAvailableStatusActions,
  type StatusAction,
} from './course-utils';
import CourseDialog from './CourseDialog';
import CourseStatusDialog from './CourseStatusDialog';
import LessonsDrawer from './LessonsDrawer';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const categoryLabel = (value: string): string =>
  COURSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

const AdminCoursesPage: React.FC = () => {
  const { admin } = useAdminAuth();

  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const isEditor = admin?.role === 'editor';
  const defaultSubject = admin?.subject ?? 'all';
  const [subject, setSubject] = useState<string>(
    isEditor ? defaultSubject : 'all',
  );
  const [status, setStatus] = useState('all');

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourseItem | null>(
    null,
  );

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCourseId, setStatusCourseId] = useState('');
  const [statusCourseTitle, setStatusCourseTitle] = useState('');
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCourse, setDrawerCourse] = useState<AdminCourseItem | null>(
    null,
  );

  const loadCourses = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        category?: string;
        keyword?: string;
        subject?: string;
        status?: string;
      } = { page, pageSize };
      if (category !== 'all') params.category = category;
      if (keyword) params.keyword = keyword;
      if (subject && subject !== 'all') params.subject = subject;
      if (status !== 'all') params.status = status;
      const data: PagedResponse<AdminCourseItem> =
        await adminApi.getCourses(params);
      setCourses(data.items);
      setTotal(data.total);
    } catch (err) {
      logger.error('Failed to load courses', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, category, keyword, subject, status]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleSearch = (): void => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleCategoryChange = (val: string): void => {
    setCategory(val);
    setPage(1);
  };

  const handleSubjectChange = (val: string): void => {
    setSubject(val);
    setPage(1);
  };

  const handleStatusChange = (val: string): void => {
    setStatus(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string): void => {
    setPageSize(Number(val));
    setPage(1);
  };

  const handleAdd = (): void => {
    setEditingCourse(null);
    setCourseDialogOpen(true);
  };

  const handleCourseSaved = useCallback((): void => {
    void loadCourses();
  }, [loadCourses]);

  const handleEdit = (course: AdminCourseItem): void => {
    setEditingCourse(course);
    setCourseDialogOpen(true);
  };

  const handleLessons = (course: AdminCourseItem): void => {
    setDrawerCourse(course);
    setDrawerOpen(true);
  };

  const openStatusDialog = (
    course: AdminCourseItem,
    action: StatusAction,
  ): void => {
    setStatusCourseId(course.id);
    setStatusCourseTitle(course.title);
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderStatusActions = (course: AdminCourseItem): React.ReactNode => {
    const actions = getAvailableStatusActions(
      course.status as CourseStatus,
      admin?.role,
    );
    if (actions.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => openStatusDialog(course, a.key)}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#3A0CA3] flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A2E]">课程管理</h2>
            <p className="text-sm text-gray-500">共 {total} 门课程</p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={16} />
          新增课程
        </Button>
      </div>

      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-36">
              <Select
                value={subject}
                onValueChange={handleSubjectChange}
                disabled={isEditor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[240px] relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchInput(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="搜索课程标题..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">课程列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center items-center gap-2 text-gray-500">
              <Spinner />
              <span>加载中...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="py-16 text-center text-gray-500">暂无数据</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">封面</TableHead>
                    <TableHead>课程标题</TableHead>
                    <TableHead className="w-20">学科</TableHead>
                    <TableHead className="w-20">分类</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-16">版本</TableHead>
                    <TableHead className="w-16">课时</TableHead>
                    <TableHead className="w-36">更新时间</TableHead>
                    <TableHead className="w-60">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course: AdminCourseItem) => {
                    const sv = statusBadgeVariant(course.status);
                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                            {course.coverImage ? (
                              <Image
                                src={course.coverImage}
                                alt={course.title}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <BookOpen size={16} />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-[#1A1A2E]">
                          {course.title}
                        </TableCell>
                        <TableCell>{subjectLabel(course.subject)}</TableCell>
                        <TableCell>{categoryLabel(course.category)}</TableCell>
                        <TableCell>
                          <Badge variant={sv.variant} className={sv.className}>
                            {statusLabel(course.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>v{course.version}</TableCell>
                        <TableCell>{course.totalLessons}</TableCell>
                        <TableCell className="text-gray-500 text-xs">
                          {new Date(course.updatedAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-[#4361EE]"
                                onClick={() => handleEdit(course)}
                              >
                                <Pencil size={12} />
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-[#4361EE]"
                                onClick={() => handleLessons(course)}
                              >
                                <LayoutList size={12} />
                                课时
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-500"
                                onClick={() => openStatusDialog(course, 'delete')}
                              >
                                <Trash2 size={12} />
                                删除
                              </Button>
                            </div>
                            {renderStatusActions(course)}
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
                  <Select
                    value={String(pageSize)}
                    onValueChange={handlePageSizeChange}
                  >
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
                  <span>共 {total} 条</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        course={editingCourse}
        currentAdmin={admin}
        onSaved={handleCourseSaved}
      />

      <CourseStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        courseId={statusCourseId}
        courseTitle={statusCourseTitle}
        action={statusAction}
        onDone={loadCourses}
      />

      <LessonsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        courseId={drawerCourse?.id ?? ''}
        courseTitle={drawerCourse?.title ?? ''}
      />
    </div>
  );
};

export default AdminCoursesPage;
