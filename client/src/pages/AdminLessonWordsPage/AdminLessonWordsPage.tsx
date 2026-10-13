import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
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
import WordDialog from '../AdminCoursesPage/WordDialog';
import * as adminApi from '@client/src/api/admin';
import type { WordItem, CourseLesson, AdminCourseItem } from '@shared/api.interface';

const AdminLessonWordsPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<AdminCourseItem | null>(null);
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [wordDialogOpen, setWordDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingWord, setDeletingWord] = useState<WordItem | null>(null);

  const loadCourse = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    try {
      const data = await adminApi.getCourse(courseId);
      setCourse(data as unknown as AdminCourseItem);
    } catch (err) {
      logger.error('Failed to load course', { error: String(err) });
    }
  }, [courseId]);

  const loadLesson = useCallback(async (): Promise<void> => {
    if (!courseId || !lessonId) return;
    try {
      const lessons = await adminApi.getCourseLessons(courseId);
      const found = lessons.find((l: CourseLesson) => l.id === lessonId);
      if (found) setLesson(found);
    } catch (err) {
      logger.error('Failed to load lesson', { error: String(err) });
    }
  }, [courseId, lessonId]);

  const loadWords = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await adminApi.getCourseWords(courseId);
      const lessonTag = `lesson:${lessonId}`;
      const lessonWords = data.filter(
        (w: WordItem) => w.tags && w.tags.includes(lessonTag),
      );
      setAllWords(data);
      setWords(lessonWords);
    } catch (err) {
      logger.error('Failed to load words', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    void loadCourse();
    void loadLesson();
    void loadWords();
  }, [loadCourse, loadLesson, loadWords]);

  const filteredWords = words.filter((w: WordItem) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      w.word.toLowerCase().includes(kw) ||
      w.meaning.toLowerCase().includes(kw)
    );
  });

  const handleAddWord = (): void => {
    setEditingWord(null);
    setWordDialogOpen(true);
  };

  const handleEditWord = (word: WordItem): void => {
    setEditingWord(word);
    setWordDialogOpen(true);
  };

  const handleDeleteClick = (word: WordItem): void => {
    setDeletingWord(word);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deletingWord || !courseId) return;
    try {
      await adminApi.deleteCourseWord(courseId, deletingWord.id);
      void loadWords();
    } catch (err) {
      logger.error('Failed to delete word', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingWord(null);
    }
  };

  const handleWordSaved = useCallback((): void => {
    void loadWords();
  }, [loadWords]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <Link to="/admin/content" className="hover:text-fuchsia-300">
          内容管理
        </Link>
        <span>/</span>
        <Link
          to={`/admin/content/courses/${courseId}/lessons`}
           className="hover:text-fuchsia-300 truncate"
        >
          {course?.title || '加载中...'}
        </Link>
        <span>/</span>
         <span className="text-slate-300 truncate">{lesson?.title || '加载中...'}</span>
        <span>/</span>
         <span className="text-white font-medium">单词列表</span>
      </div>

      {/* 顶部栏 */}
       <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/admin/content/courses/${courseId}/lessons`)}
                className="text-slate-400"
            >
              <ChevronLeft size={18} />
              返回单元列表
            </Button>
            <div>
               <h1 className="text-xl font-semibold text-white">
                {lesson?.title || '加载中...'}
              </h1>
               <p className="text-sm text-slate-400 mt-1">
                共 {words.length} 个单词
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search
                size={16}
                 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={searchKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchKeyword(e.target.value)
                }
                placeholder="搜索单词或释义..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleAddWord}>
              <Plus size={16} className="mr-2" />
              新增单词
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 单词列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">单词列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400">加载中...</div>
          ) : filteredWords.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <BookOpen size={40} className="mx-auto mb-3 text-slate-600" />
              <p>{searchKeyword ? '没有匹配的单词' : '暂无单词，点击右上角新增'}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredWords.map((word: WordItem, index: number) => (
                <div
                  key={word.id}
                   className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <span className="font-medium text-white">{word.word}</span>
                        {word.phonetic && (
                          <span className="text-sm text-fuchsia-400/90">{word.phonetic}</span>
                        )}
                        {word.partOfSpeech && (
                           <Badge variant="outline" className="text-xs bg-white/5 text-slate-300 border-white/10">
                            {word.partOfSpeech}
                          </Badge>
                        )}
                      </div>
                       <div className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-1">
                        {word.meaning}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                        className="text-slate-300"
                      onClick={() => handleEditWord(word)}
                    >
                      <Pencil size={14} className="mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDeleteClick(word)}
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

      {/* 单词编辑弹窗 */}
      {courseId && (
        <WordDialog
          open={wordDialogOpen}
          onOpenChange={setWordDialogOpen}
          courseId={courseId}
          word={editingWord}
          onSaved={handleWordSaved}
          lessonId={lessonId}
        />
      )}

      {/* 删除确认 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除单词「{deletingWord?.word}」吗？此操作不可恢复。
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

export default AdminLessonWordsPage;
