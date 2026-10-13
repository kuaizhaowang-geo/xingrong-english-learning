import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Search,
  Pencil,
  Trash2,
  Share2,
  Eye,
  Layers,
  Play,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
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
import { Switch } from '@client/src/components/ui/switch';
import { Spinner } from '@client/src/components/ui/spinner';
import { Image } from '@client/src/components/ui/image';
import { toast } from 'sonner';
import * as userCourseApi from '@client/src/api/user-created-courses';
import type { UserCreatedCourse } from '@client/src/api/user-created-courses';
import CourseDialog from './CourseDialog';

const SUBJECT_OPTIONS = [
  { value: 'all', label: '全部学科' },
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
];

const SUBJECT_LABELS: Record<string, string> = {
  english: '英语', chinese: '语文', math: '数学',
};

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  english: {
    basic: '零基础入门', daily: '日常实用', comprehensive: '综合提升',
    business: '职场商务', culture: '文化兴趣', exam: '认证备考',
  },
  chinese: { reading: '阅读理解', writing: '写作提升', culture: '文化常识' },
  math: { basic: '基础运算', thinking: '思维训练', competition: '竞赛拓展' },
};

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  draft: { label: '草稿', variant: 'secondary' },
  pending: { label: '审核中', variant: 'default' },
  published: { label: '已发布', variant: 'default' },
  rejected: { label: '已驳回', variant: 'destructive' },
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: '私密',
  public: '公开',
};

const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<UserCreatedCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState('all');
  const [keyword, setKeyword] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<UserCreatedCourse | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserCreatedCourse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCourses = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: { subject?: string; keyword?: string; pageSize: number } = { pageSize: 50 };
      if (subject !== 'all') params.subject = subject;
      if (keyword.trim()) params.keyword = keyword.trim();
      const res = await userCourseApi.getCourses(params);
      setCourses(res.items);
      setTotal(res.total);
    } catch (err) {
      logger.error('Failed to load courses', { error: String(err) });
      toast.error('加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, [subject, keyword]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreate = (): void => {
    setEditingCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: UserCreatedCourse): void => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleDeleteClick = (course: UserCreatedCourse): void => {
    setDeleteTarget(course);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userCourseApi.deleteCourse(deleteTarget.id);
      toast.success('课程已删除');
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadCourses();
    } catch (err) {
      logger.error('Failed to delete course', { error: String(err) });
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleShareToggle = async (
    course: UserCreatedCourse,
    checked: boolean,
  ): Promise<void> => {
    try {
      if (checked) {
        const updated = await userCourseApi.shareCourse(course.id);
        setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
        toast.success('已提交公开申请');
      } else {
        const updated = await userCourseApi.unshareCourse(course.id);
        setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
        toast.success('已取消公开');
      }
    } catch (err) {
      logger.error('Failed to toggle share', { error: String(err) });
      toast.error('操作失败');
    }
  };

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.status === 'published').length;
    const totalUnits = courses.reduce((sum, c) => sum + (c.unitCount ?? 0), 0);
    return { total: courses.length, published, totalUnits };
  }, [courses]);

  const getCategoryLabel = (subjectKey: string, cat: string): string => {
    return CATEGORY_LABELS[subjectKey]?.[cat] ?? cat;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 顶部标题 + 统计 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#6366F1] flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-white" />
          </div>
          <div className="min-w-0">
             <h2 className="text-xl sm:text-2xl font-semibold text-white truncate">我的课程</h2>
             <p className="text-sm text-slate-400 truncate">
              共 {stats.total} 门 · {stats.published} 已发布 · {stats.totalUnits} 单元
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE] min-h-11 w-full sm:w-auto sm:flex-shrink-0">
          <Plus size={16} />
          新建课程
        </Button>
      </div>

      {/* 筛选栏 */}
       <Card className="rounded-xl">
         <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="w-full sm:w-40 order-1 sm:order-none">
            <Select value={subject} onValueChange={(v: string) => setSubject(v)}>
              <SelectTrigger>
                <SelectValue />
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
           <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-none sm:max-w-md order-2 sm:order-none w-full sm:w-auto">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
              placeholder="搜索课程名称..."
              className="pl-9"
            />
          </div>
           <div className="text-sm text-slate-400 w-full sm:w-auto sm:ml-auto text-right sm:text-left order-3 sm:order-none">
              共 {total} 条结果
            </div>
        </CardContent>
      </Card>

      {/* 课程卡片网格 */}
      {loading ? (
         <div className="py-20 flex justify-center items-center gap-2 text-slate-400">
           <Spinner />
           <span>加载中...</span>
         </div>
      ) : courses.length === 0 ? (
         <Card className="rounded-xl">
           <CardContent className="py-20 text-center">
             <BookOpen size={48} className="mx-auto mb-3 text-slate-500" />
             <p className="text-slate-400 mb-4">暂无课程，创建你的第一门课程吧</p>
            <Button onClick={handleCreate} className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]">
              <Plus size={16} />
              新建课程
            </Button>
          </CardContent>
        </Card>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" data-ai-section-type="card-list">
          {courses.map((course: UserCreatedCourse) => {
            const statusInfo = STATUS_LABELS[course.status] ?? STATUS_LABELS.draft;
            return (
               <Card
                 key={course.id}
                 className="rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col"
                 onClick={() => navigate(`/my-courses/${course.id}`)}
               >
                {/* 封面 */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-[#4361EE]/20 to-[#6366F1]/20 flex items-center justify-center overflow-hidden">
                  {course.coverImage ? (
                    <Image src={course.coverImage} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={36} className="text-[#4361EE]/60" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {SUBJECT_LABELS[course.subject] ?? course.subject}
                    </Badge>
                    {course.category && (
                       <Badge
                         variant="outline"
                         className="text-xs font-normal bg-black/20 backdrop-blur-sm border-white/20"
                       >
                        {getCategoryLabel(course.subject, course.category)}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={statusInfo.variant as 'default' | 'secondary' | 'destructive'}
                      className="text-xs font-normal"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                 <CardHeader className="p-3 sm:p-4 pb-2">
                   <CardTitle className="text-base font-semibold text-white line-clamp-1">
                     {course.name}
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-3 sm:p-4 pt-0 flex-1">
                   <p className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem]">
                    {course.description || '暂无描述'}
                  </p>
                </CardContent>
                 <CardFooter className="p-3 sm:p-4 pt-0 flex items-center justify-between border-t border-white/10">
                   <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers size={12} />
                      {course.unitCount} 单元
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {VISIBILITY_LABELS[course.visibility] ?? course.visibility}
                    </span>
                  </div>
                </CardFooter>

                {/* 操作栏 */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2 min-h-11">
                     <span className="text-xs text-slate-400">公开</span>
                    <Switch
                      checked={course.visibility === 'public'}
                      onCheckedChange={(checked: boolean) => handleShareToggle(course, checked)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 sm:h-9 sm:w-9"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleEdit(course);
                      }}
                    >
                      <Pencil size={16} className="text-[#4361EE]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 sm:h-9 sm:w-9"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteClick(course);
                      }}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE] h-11 sm:h-9"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        navigate(`/my-courses/${course.id}`);
                      }}
                    >
                      <Play size={14} />
                      开始学习
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 新建/编辑课程弹窗 */}
      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
        onSaved={loadCourses}
        onCreate={userCourseApi.createCourse}
        onUpdate={userCourseApi.updateCourse}
      />

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除课程</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.name}」吗？
              删除后其下所有单元和内容也将被删除，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyCoursesPage;
