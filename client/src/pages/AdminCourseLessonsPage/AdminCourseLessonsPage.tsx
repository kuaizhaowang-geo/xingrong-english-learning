import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Trash2, BookOpen, FileText, Calculator, ListChecks, ArrowUp, ArrowDown } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import LessonDialog from '../AdminCoursesPage/LessonDialog';
import * as adminApi from '@client/src/api/admin';
import type { CourseLesson, AdminCourseItem } from '@shared/api.interface';

const AdminCourseLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<AdminCourseItem | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<CourseLesson | null>(null);

  const loadCourse = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    try {
      const data = await adminApi.getCourse(courseId);
      setCourse(data as unknown as AdminCourseItem);
    } catch (err) {
      logger.error('Failed to load course', { error: String(err) });
    }
  }, [courseId]);

  const loadLessons = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await adminApi.getCourseLessons(courseId);
      setLessons(data.sort((a: CourseLesson, b: CourseLesson) => a.lessonOrder - b.lessonOrder));
    } catch (err) {
      logger.error('Failed to load lessons', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
    void loadLessons();
  }, [loadCourse, loadLessons]);

  const handleAddLesson = (): void => {
    setEditingLesson(null);
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: CourseLesson): void => {
    setEditingLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleDeleteClick = (lesson: CourseLesson): void => {
    setDeletingLesson(lesson);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deletingLesson) return;
    try {
      await adminApi.deleteLesson(deletingLesson.id);
      void loadLessons();
    } catch (err) {
      logger.error('Failed to delete lesson', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingLesson(null);
    }
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down'): Promise<void> => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;
    const current = lessons[index];
    const target = lessons[targetIndex];
    try {
      await Promise.all([
        adminApi.updateLesson(current.id, { lessonOrder: target.lessonOrder }),
        adminApi.updateLesson(target.id, { lessonOrder: current.lessonOrder }),
      ]);
      void loadLessons();
    } catch (err) {
      logger.error('Failed to reorder lessons', { error: String(err) });
    }
  };

  const contentTypeLabel: Record<string, string> = {
    mixed: '综合',
    sentence: '句子',
    word: '单词',
    dictation: '听写',
    char: '汉字',
    topic: '知识点',
    practice: '习题',
  };

  const contentTypeColor: Record<string, string> = {
    mixed: 'bg-purple-100 text-purple-700',
    sentence: 'bg-blue-100 text-blue-700',
    word: 'bg-green-100 text-green-700',
    dictation: 'bg-orange-100 text-orange-700',
    char: 'bg-red-100 text-red-700',
    topic: 'bg-indigo-100 text-indigo-700',
    practice: 'bg-teal-100 text-teal-700',
  };

  const subject = course?.subject || 'english';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/admin/content" className="hover:text-[#4361EE]">
          内容管理
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate">
          {course?.title || '加载中...'}
        </span>
        <span>/</span>
        <span className="text-gray-900 font-medium">单元列表</span>
      </div>

      {/* 顶部栏 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/content')}
              className="text-gray-500"
            >
              <ChevronLeft size={18} />
              返回
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {course?.title || '加载中...'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                共 {lessons.length} 个单元
              </p>
            </div>
          </div>
          <Button onClick={handleAddLesson}>
            <Plus size={16} className="mr-2" />
            新增单元
          </Button>
        </CardContent>
      </Card>

      {/* 单元列表 */}
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">单元列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">加载中...</div>
          ) : lessons.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
              <p>暂无单元，点击右上角新增</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson: CourseLesson, index: number) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => handleMoveLesson(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={() => handleMoveLesson(index, 'down')}
                        disabled={index === lessons.length - 1}
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#4361EE]/10 text-[#4361EE] flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{lesson.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <Badge
                          variant="outline"
                          className={`${contentTypeColor[lesson.contentType] || 'bg-gray-100 text-gray-600'} border-0`}
                        >
                          {contentTypeLabel[lesson.contentType] || lesson.contentType}
                        </Badge>
                        <span>排序: {lesson.lessonOrder}</span>
                        <span>时长: {lesson.durationMinutes}分钟</span>
                        <span>单词: {lesson.wordCount}</span>
                        <span>句子: {lesson.sentenceCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {subject === 'english' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#4361EE]"
                        onClick={() =>
                          navigate(
                            `/admin/content/courses/${courseId}/lessons/${lesson.id}/words`,
                          )
                        }
                      >
                        <BookOpen size={14} className="mr-1" />
                        编辑单词
                      </Button>
                    )}
                    {subject === 'chinese' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#EF4444]"
                        onClick={() => navigate('/admin/chinese-chars')}
                      >
                        <FileText size={14} className="mr-1" />
                        编辑汉字
                      </Button>
                    )}
                    {subject === 'math' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#6366F1]"
                          onClick={() => navigate('/admin/math/topics')}
                        >
                          <Calculator size={14} className="mr-1" />
                          编辑知识点
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#0D9488]"
                          onClick={() => navigate('/admin/math/practice-items')}
                        >
                          <ListChecks size={14} className="mr-1" />
                          编辑习题
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600"
                      onClick={() => handleEditLesson(lesson)}
                    >
                      <Pencil size={14} className="mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDeleteClick(lesson)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 课时编辑弹窗 */}
      {courseId && (
        <LessonDialog
          open={lessonDialogOpen}
          onOpenChange={setLessonDialogOpen}
          courseId={courseId}
          lesson={editingLesson}
          onSaved={loadLessons}
        />
      )}

      {/* 删除确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除单元「{deletingLesson?.title}」吗？删除后该单元下的内容也将被移除，此操作不可恢复。
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

export default AdminCourseLessonsPage;
