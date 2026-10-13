import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Plus,
  Search,
  BookOpen,
  BookMarked,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@client/src/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@client/src/components/ui/alert-dialog';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import type {
  AdminCourseItem,
  TextbookTreeItem,
  CourseStatus,
  PagedResponse,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import {
  SUBJECT_OPTIONS,
  type StatusAction,
} from '../AdminCoursesPage/course-utils';
import CourseDialog from '../AdminCoursesPage/CourseDialog';
import CourseStatusDialog from '../AdminCoursesPage/CourseStatusDialog';
import TextbookDialog from '../AdminTextbooksPage/TextbookDialog';
import ContentTable, {
  type UnifiedContentItem,
} from './ContentTable';
import UnitPanelDrawer from './UnitPanelDrawer';

type ContentType = 'all' | 'course' | 'textbook';

const AdminContentPage: React.FC = () => {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  const [contentType, setContentType] = useState<ContentType>('all');
  const [subject, setSubject] = useState<string>(
    admin?.role === 'editor' ? (admin.subject ?? 'all') : 'all',
  );
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [courseTotal, setCourseTotal] = useState(0);
  const [textbooks, setTextbooks] = useState<TextbookTreeItem[]>([]);

  // 课程弹窗
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourseItem | null>(
    null,
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCourseId, setStatusCourseId] = useState('');
  const [statusCourseTitle, setStatusCourseTitle] = useState('');
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);

  // 教材弹窗
  const [textbookDialogOpen, setTextbookDialogOpen] = useState(false);
  const [editingTextbook, setEditingTextbook] =
    useState<TextbookTreeItem | null>(null);

  // 单元管理面板
  const [unitPanelOpen, setUnitPanelOpen] = useState(false);
  const [panelTextbook, setPanelTextbook] =
    useState<TextbookTreeItem | null>(null);

  // 删除确认
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'textbook';
    id: string;
    title: string;
  } | null>(null);

  const isEditor = admin?.role === 'editor';

  // ===== 数据加载 =====
  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const subjectParam = subject && subject !== 'all' ? subject : undefined;
      const keywordParam = keyword || undefined;

      if (contentType === 'course') {
        const data: PagedResponse<AdminCourseItem> = await adminApi.getCourses({
          page,
          pageSize,
          subject: subjectParam,
          keyword: keywordParam,
        });
        setCourses(data.items);
        setCourseTotal(data.total);
        setTextbooks([]);
      } else if (contentType === 'textbook') {
        const data = await adminApi.getTextbookTree(subjectParam);
        setTextbooks(data);
        setCourses([]);
        setCourseTotal(0);
      } else {
        const [courseData, textbookData] = await Promise.all([
          adminApi.getCourses({
            page: 1,
            pageSize: 9999,
            subject: subjectParam,
            keyword: keywordParam,
          }),
          adminApi.getTextbookTree(subjectParam),
        ]);
        setCourses(courseData.items);
        setCourseTotal(courseData.total);
        setTextbooks(textbookData);
      }
    } catch (err) {
      logger.error('Failed to load content', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [contentType, subject, keyword, page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ===== 合并 & 过滤（前端侧）=====
  const mergedItems = useMemo<UnifiedContentItem[]>(() => {
    const courseItems: UnifiedContentItem[] = courses.map(
      (c: AdminCourseItem) => ({
        id: c.id,
        type: 'course',
        title: c.title,
        subject: c.subject,
        coverImage: c.coverImage,
        category: c.category,
        status: c.status as CourseStatus,
        version: c.version,
        totalLessons: c.totalLessons,
        updatedAt: c.updatedAt,
        raw: c,
      }),
    );

    let filteredTextbooks = textbooks;
    if (keyword) {
      const kw = keyword.toLowerCase();
      filteredTextbooks = textbooks.filter(
        (t: TextbookTreeItem) =>
          t.title.toLowerCase().includes(kw) ||
          t.publisher.toLowerCase().includes(kw),
      );
    }

    const textbookItems: UnifiedContentItem[] = filteredTextbooks.map(
      (t: TextbookTreeItem) => ({
        id: t.id,
        type: 'textbook',
        title: t.title,
        subject: t.subject,
        coverImage: t.coverImage,
        publisher: t.publisher,
        grade: t.grade,
        semester: t.semester,
        totalUnits: t.totalUnits,
        isPublished: t.isPublished,
        raw: t,
      }),
    );

    if (contentType === 'course') return courseItems;
    if (contentType === 'textbook') return textbookItems;
    return [...courseItems, ...textbookItems];
  }, [courses, textbooks, contentType, keyword]);

  const pageData = useMemo<UnifiedContentItem[]>(() => {
    if (contentType === 'course') return mergedItems;
    const start = (page - 1) * pageSize;
    return mergedItems.slice(start, start + pageSize);
  }, [mergedItems, page, pageSize, contentType]);

  const totalCount = useMemo(() => {
    if (contentType === 'course') return courseTotal;
    return mergedItems.length;
  }, [contentType, courseTotal, mergedItems.length]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ===== 事件处理 =====
  const handleSearch = (): void => {
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleTypeChange = (val: string): void => {
    setContentType(val as ContentType);
    setPage(1);
  };

  const handleSubjectChange = (val: string): void => {
    setSubject(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: string): void => {
    setPageSize(Number(val));
    setPage(1);
  };

  const handleAddCourse = (): void => {
    setEditingCourse(null);
    setCourseDialogOpen(true);
  };

  const handleAddTextbook = (): void => {
    setEditingTextbook(null);
    setTextbookDialogOpen(true);
  };

  const handleEditCourse = (course: AdminCourseItem): void => {
    setEditingCourse(course);
    setCourseDialogOpen(true);
  };

  const handleLessons = (course: AdminCourseItem): void => {
    navigate(`/admin/content/courses/${course.id}/lessons`);
  };

  const openCourseStatusDialog = (
    course: AdminCourseItem,
    action: StatusAction,
  ): void => {
    setStatusCourseId(course.id);
    setStatusCourseTitle(course.title);
    setStatusAction(action);
    setStatusDialogOpen(true);
  };

  const handleDeleteCourseClick = (course: AdminCourseItem): void => {
    setDeleteTarget({ type: 'course', id: course.id, title: course.title });
    setDeleteConfirmOpen(true);
  };

  const handleEditTextbook = (tb: TextbookTreeItem): void => {
    setEditingTextbook(tb);
    setTextbookDialogOpen(true);
  };

  const handleDeleteTextbookClick = (tb: TextbookTreeItem): void => {
    setDeleteTarget({ type: 'textbook', id: tb.id, title: tb.title });
    setDeleteConfirmOpen(true);
  };

  const handleUnitPanelOpen = (tb: TextbookTreeItem): void => {
    setPanelTextbook(tb);
    setUnitPanelOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'course') {
        await adminApi.deleteCourse(deleteTarget.id);
      } else {
        await adminApi.deleteTextbook(deleteTarget.id);
      }
      await loadData();
    } catch (err) {
      logger.error('Failed to delete', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const refreshContent = (): void => {
    void loadData();
  };

  const handleCourseSaved = useCallback(
    (createdCourseId?: string): void => {
      refreshContent();
      if (createdCourseId) {
        navigate(`/admin/content/courses/${createdCourseId}/lessons`);
      }
    },
    [navigate, refreshContent],
  );

  return (
    <div className="space-y-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#3A0CA3] flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A2E]">内容管理</h2>
            <p className="text-sm text-gray-500">共 {totalCount} 条内容</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus size={16} />
              新增内容
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddCourse}>
              <BookOpen size={14} className="mr-2" />
              新增课程
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddTextbook}>
              <BookMarked size={14} className="mr-2" />
              新增教材
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 筛选区 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Tabs
              value={contentType}
              onValueChange={handleTypeChange}
              className="min-w-[360px]"
            >
              <TabsList>
                <TabsTrigger value="all" className="min-w-[80px]">
                  全部
                </TabsTrigger>
                <TabsTrigger value="textbook" className="min-w-[80px]">
                  教材
                </TabsTrigger>
                <TabsTrigger value="course" className="min-w-[80px]">
                  课程
                </TabsTrigger>
              </TabsList>
            </Tabs>

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
                placeholder="搜索内容名称..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
          </div>
        </CardContent>
      </Card>

      {/* 内容列表 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="p-0">
          <ContentTable
            loading={loading}
            items={pageData}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            adminRole={admin?.role}
            onEditCourse={handleEditCourse}
            onLessons={handleLessons}
            onDeleteCourse={handleDeleteCourseClick}
            onEditTextbook={handleEditTextbook}
            onUnitPanel={handleUnitPanelOpen}
            onDeleteTextbook={handleDeleteTextbookClick}
            onStatusAction={openCourseStatusDialog}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {/* 课程弹窗 */}
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
        onDone={refreshContent}
      />

      {/* 教材弹窗 */}
      <TextbookDialog
        open={textbookDialogOpen}
        onOpenChange={setTextbookDialogOpen}
        textbook={editingTextbook}
        defaultSubject={subject && subject !== 'all' ? subject : 'english'}
        onSaved={refreshContent}
      />

      {/* 单元管理面板 */}
      <UnitPanelDrawer
        open={unitPanelOpen}
        textbook={panelTextbook}
        onClose={() => setUnitPanelOpen(false)}
      />

      {/* 删除确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认删除{deleteTarget?.type === 'course' ? '课程' : '教材'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.title}」
              {deleteTarget?.type === 'textbook'
                ? '吗？删除后其下所有单元也将被删除，此操作不可恢复。'
                : '吗？删除后其下所有课时也将被删除，此操作不可恢复。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentPage;
