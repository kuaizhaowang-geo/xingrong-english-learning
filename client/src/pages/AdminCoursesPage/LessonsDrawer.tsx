import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Mic,
  BookMarked,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@client/src/components/ui/table';
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
import { Badge } from '@client/src/components/ui/badge';
import type {
  CourseLesson,
  AdminSentenceItem,
  DictationItem,
  WordItem,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';
import LessonDialog from './LessonDialog';
import SentenceDialog from './SentenceDialog';
import DictationDialog from './DictationDialog';
import WordDialog from './WordDialog';

interface LessonsDrawerProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

const contentTypeLabel: Record<string, string> = {
  sentence: '句子',
  word: '单词',
  dictation: '听写',
  mixed: '混合',
};

interface LessonContent {
  sentences: AdminSentenceItem[];
  dictations: DictationItem[];
  loaded: boolean;
}

const LessonsDrawer: React.FC<LessonsDrawerProps> = ({
  open,
  onClose,
  courseId,
  courseTitle,
}) => {
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [contentMap, setContentMap] = useState<Record<string, LessonContent>>({});

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);

  const [sentenceDialogOpen, setSentenceDialogOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState<AdminSentenceItem | null>(null);
  const [activeLessonIdForSentence, setActiveLessonIdForSentence] = useState('');

  const [dictationDialogOpen, setDictationDialogOpen] = useState(false);
  const [editingDictation, setEditingDictation] = useState<DictationItem | null>(null);
  const [activeLessonIdForDictation, setActiveLessonIdForDictation] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<CourseLesson | null>(null);

  const [deleteSentenceConfirmOpen, setDeleteSentenceConfirmOpen] = useState(false);
  const [deletingSentence, setDeletingSentence] = useState<{
    lessonId: string;
    sentenceId: string;
  } | null>(null);

  const [deleteDictationConfirmOpen, setDeleteDictationConfirmOpen] = useState(false);
  const [deletingDictation, setDeletingDictation] = useState<{
    lessonId: string;
    dictationId: string;
  } | null>(null);

  // 课程单词
  const [words, setWords] = useState<WordItem[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordDialogOpen, setWordDialogOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);

  const [deleteWordConfirmOpen, setDeleteWordConfirmOpen] = useState(false);
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null);

  const loadLessons = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await adminApi.getCourseLessons(courseId);
      const sorted = [...data].sort(
        (a: CourseLesson, b: CourseLesson) =>
          a.lessonOrder - b.lessonOrder,
      );
      setLessons(sorted);
    } catch (err) {
      logger.error('Failed to load lessons', { error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadWords = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setWordsLoading(true);
    try {
      const data = await adminApi.getCourseWords(courseId);
      const sorted = [...data].sort(
        (a: WordItem, b: WordItem) => (a.wordOrder ?? 0) - (b.wordOrder ?? 0),
      );
      setWords(sorted);
    } catch (err) {
      logger.error('Failed to load course words', { error: String(err) });
    } finally {
      setWordsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (open && courseId) {
      loadLessons();
      loadWords();
    }
  }, [open, courseId, loadLessons, loadWords]);

  const loadLessonContent = useCallback(
    async (lessonId: string): Promise<void> => {
      try {
        const [sentences, dictations] = await Promise.all([
          adminApi.getLessonSentences(lessonId),
          adminApi.getLessonDictations(lessonId),
        ]);
        setContentMap((prev) => ({
          ...prev,
          [lessonId]: { sentences, dictations, loaded: true },
        }));
      } catch (err) {
        logger.error('Failed to load lesson content', {
          error: String(err),
          lessonId,
        });
      }
    },
    [],
  );

  const toggleExpand = async (lessonId: string): Promise<void> => {
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
    } else {
      setExpandedLessonId(lessonId);
      const existing = contentMap[lessonId];
      if (!existing || !existing.loaded) {
        await loadLessonContent(lessonId);
      }
    }
  };

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
      setLessons((prev) =>
        prev.filter((l: CourseLesson) => l.id !== deletingLesson.id),
      );
      setContentMap((prev) => {
        const next = { ...prev };
        delete next[deletingLesson.id];
        return next;
      });
    } catch (err) {
      logger.error('Failed to delete lesson', { error: String(err) });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingLesson(null);
    }
  };

  const handleAddSentence = (lessonId: string): void => {
    setActiveLessonIdForSentence(lessonId);
    setEditingSentence(null);
    setSentenceDialogOpen(true);
  };

  const handleEditSentence = (
    lessonId: string,
    sentence: AdminSentenceItem,
  ): void => {
    setActiveLessonIdForSentence(lessonId);
    setEditingSentence(sentence);
    setSentenceDialogOpen(true);
  };

  const handleDeleteSentence = (lessonId: string, sentenceId: string): void => {
    setDeletingSentence({ lessonId, sentenceId });
    setDeleteSentenceConfirmOpen(true);
  };

  const handleDeleteSentenceConfirm = async (): Promise<void> => {
    if (!deletingSentence) return;
    const { lessonId, sentenceId } = deletingSentence;
    try {
      await adminApi.deleteLessonSentence(lessonId, sentenceId);
      setContentMap((prev) => {
        const lesson = prev[lessonId];
        if (!lesson) return prev;
        return {
          ...prev,
          [lessonId]: {
            ...lesson,
            sentences: lesson.sentences.filter(
              (s: AdminSentenceItem) => s.id !== sentenceId,
            ),
          },
        };
      });
    } catch (err) {
      logger.error('Failed to delete sentence', { error: String(err) });
    } finally {
      setDeleteSentenceConfirmOpen(false);
      setDeletingSentence(null);
    }
  };

  const handleAddDictation = (lessonId: string): void => {
    setActiveLessonIdForDictation(lessonId);
    setEditingDictation(null);
    setDictationDialogOpen(true);
  };

  const handleEditDictation = (
    lessonId: string,
    dictation: DictationItem,
  ): void => {
    setActiveLessonIdForDictation(lessonId);
    setEditingDictation(dictation);
    setDictationDialogOpen(true);
  };

  const handleDeleteDictation = (lessonId: string, dictationId: string): void => {
    setDeletingDictation({ lessonId, dictationId });
    setDeleteDictationConfirmOpen(true);
  };

  const handleDeleteDictationConfirm = async (): Promise<void> => {
    if (!deletingDictation) return;
    const { lessonId, dictationId } = deletingDictation;
    try {
      await adminApi.deleteLessonDictation(lessonId, dictationId);
      setContentMap((prev) => {
        const lesson = prev[lessonId];
        if (!lesson) return prev;
        return {
          ...prev,
          [lessonId]: {
            ...lesson,
            dictations: lesson.dictations.filter(
              (d: DictationItem) => d.id !== dictationId,
            ),
          },
        };
      });
    } catch (err) {
      logger.error('Failed to delete dictation', { error: String(err) });
    } finally {
      setDeleteDictationConfirmOpen(false);
      setDeletingDictation(null);
    }
  };

  const handleSentenceSaved = (): void => {
    if (activeLessonIdForSentence) {
      void loadLessonContent(activeLessonIdForSentence);
    }
  };

  const handleDictationSaved = (): void => {
    if (activeLessonIdForDictation) {
      void loadLessonContent(activeLessonIdForDictation);
    }
  };

  const handleAddWord = (): void => {
    setEditingWord(null);
    setWordDialogOpen(true);
  };

  const handleEditWord = (word: WordItem): void => {
    setEditingWord(word);
    setWordDialogOpen(true);
  };

  const handleDeleteWord = (wordId: string): void => {
    setDeletingWordId(wordId);
    setDeleteWordConfirmOpen(true);
  };

  const handleDeleteWordConfirm = async (): Promise<void> => {
    if (!deletingWordId) return;
    try {
      await adminApi.deleteCourseWord(courseId, deletingWordId);
      setWords((prev) =>
        prev.filter((w: WordItem) => w.id !== deletingWordId),
      );
    } catch (err) {
      logger.error('Failed to delete word', { error: String(err) });
    } finally {
      setDeleteWordConfirmOpen(false);
      setDeletingWordId(null);
    }
  };

  const handleWordSaved = (): void => {
    void loadWords();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl shadow-xl flex flex-col animate-in slide-in-from-right border-l border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">
              课程内容管理
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">{courseTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddLesson}>
              <Plus size={16} />
              新增课时
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
                className="text-slate-400"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* 课程单词区块 */}
          <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookMarked size={16} className="text-[#FF6B35]" />
                  <span className="text-base font-semibold text-[#1A1A2E]">
                    课程单词
                  </span>
                  <span className="text-xs text-gray-400">
                    共 {words.length} 个
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-[#4361EE]"
                  onClick={handleAddWord}
                >
                  <Plus size={12} />
                  添加
                </Button>
              </div>
              {wordsLoading ? (
                <div className="py-4 text-center text-gray-400 text-sm">
                  加载中...
                </div>
              ) : words.length === 0 ? (
                <div className="py-4 text-center text-gray-400 text-sm">
                  暂无单词
                </div>
              ) : (
                <div className="glass-card rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">序号</TableHead>
                        <TableHead>单词</TableHead>
                        <TableHead className="w-20">词性</TableHead>
                        <TableHead className="w-32">释义</TableHead>
                        <TableHead className="w-24 text-right">
                          操作
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {words.map((w: WordItem, i: number) => (
                        <TableRow key={w.id}>
                          <TableCell className="text-xs text-gray-400">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-[#1A1A2E]">
                              {w.word}
                              {w.phonetic && (
                                <span className="text-xs text-gray-400 ml-2 font-normal">
                                  {w.phonetic}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {w.partOfSpeech || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-600 truncate max-w-[180px]">
                              {w.meaning}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditWord(w)}
                              >
                                <Pencil
                                  size={12}
                                  className="text-[#4361EE]"
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteWord(w.id)}
                              >
                                <Trash2
                                  size={12}
                                  className="text-red-500"
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">加载中...</div>
          ) : lessons.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              暂无课时，点击上方"新增课时"按钮添加
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lessons.map((lesson: CourseLesson, idx: number) => {
                const isExpanded = expandedLessonId === lesson.id;
                const content = contentMap[lesson.id];
                return (
                  <div key={lesson.id}>
                    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          void toggleExpand(lesson.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-500" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-8">
                            #{idx + 1}
                          </span>
                          <span className="font-medium text-[#1A1A2E] truncate">
                            {lesson.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {contentTypeLabel[lesson.contentType] ??
                              lesson.contentType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>排序：{lesson.lessonOrder}</span>
                          <span>时长：{lesson.durationMinutes} 分钟</span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            句子 {lesson.sentenceCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mic size={12} />
                            听写 {lesson.dictationCount ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#4361EE]"
                          onClick={() => handleEditLesson(lesson)}
                        >
                          <Pencil size={12} />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500"
                          onClick={() => handleDeleteClick(lesson)}
                        >
                          <Trash2 size={12} />
                          删除
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="bg-gray-50 px-4 pb-4">
                        {!content || !content.loaded ? (
                          <div className="py-6 text-center text-gray-400 text-sm">
                            加载中...
                          </div>
                        ) : (
                          <div className="space-y-4">
                             <div className="glass-card rounded-lg overflow-hidden">
                               <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
                                 <div className="flex items-center gap-2">
                                   <BookOpen
                                     size={14}
                                     className="text-cyan-400"
                                   />
                                   <span className="text-sm font-medium text-white">
                                     句子列表
                                   </span>
                                  <span className="text-xs text-gray-400">
                                    共 {content.sentences.length} 条
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-[#4361EE]"
                                  onClick={() => handleAddSentence(lesson.id)}
                                >
                                  <Plus size={12} />
                                  添加
                                </Button>
                              </div>
                              {content.sentences.length === 0 ? (
                                <div className="py-6 text-center text-gray-400 text-sm">
                                  暂无句子
                                </div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">
                                        序号
                                      </TableHead>
                                      <TableHead>句子</TableHead>
                                      <TableHead className="w-24 text-right">
                                        操作
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {content.sentences.map(
                                      (
                                        s: AdminSentenceItem,
                                        i: number,
                                      ) => (
                                        <TableRow key={s.id}>
                                          <TableCell className="text-xs text-gray-400">
                                            {i + 1}
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm font-medium text-[#1A1A2E] truncate max-w-md">
                                              {s.sentence}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-md">
                                              {s.translation}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                  handleEditSentence(
                                                    lesson.id,
                                                    s,
                                                  )
                                                }
                                              >
                                                <Pencil
                                                  size={12}
                                                  className="text-[#4361EE]"
                                                />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                  handleDeleteSentence(
                                                    lesson.id,
                                                    s.id,
                                                  )
                                                }
                                              >
                                                <Trash2
                                                  size={12}
                                                  className="text-red-500"
                                                />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ),
                                    )}
                                  </TableBody>
                                </Table>
                              )}
                            </div>

                             <div className="glass-card rounded-lg overflow-hidden">
                               <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
                                 <div className="flex items-center gap-2">
                                   <Mic size={14} className="text-fuchsia-400" />
                                   <span className="text-sm font-medium text-white">
                                     听写列表
                                   </span>
                                  <span className="text-xs text-gray-400">
                                    共 {content.dictations.length} 条
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-[#4361EE]"
                                  onClick={() => handleAddDictation(lesson.id)}
                                >
                                  <Plus size={12} />
                                  添加
                                </Button>
                              </div>
                              {content.dictations.length === 0 ? (
                                <div className="py-6 text-center text-gray-400 text-sm">
                                  暂无听写
                                </div>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">
                                        序号
                                      </TableHead>
                                      <TableHead>听写内容</TableHead>
                                      <TableHead className="w-24 text-right">
                                        操作
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {content.dictations.map(
                                      (d: DictationItem, i: number) => (
                                        <TableRow key={d.id}>
                                          <TableCell className="text-xs text-gray-400">
                                            {i + 1}
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm font-medium text-[#1A1A2E] truncate max-w-md">
                                              {d.sentence}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-md">
                                              {d.translation}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                  handleEditDictation(
                                                    lesson.id,
                                                    d,
                                                  )
                                                }
                                              >
                                                <Pencil
                                                  size={12}
                                                  className="text-[#4361EE]"
                                                />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                  handleDeleteDictation(
                                                    lesson.id,
                                                    d.id,
                                                  )
                                                }
                                              >
                                                <Trash2
                                                  size={12}
                                                  className="text-red-500"
                                                />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ),
                                    )}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        courseId={courseId}
        lesson={editingLesson}
        onSaved={loadLessons}
      />

      <SentenceDialog
        open={sentenceDialogOpen}
        onOpenChange={setSentenceDialogOpen}
        lessonId={activeLessonIdForSentence}
        sentence={editingSentence}
        onSaved={handleSentenceSaved}
      />

      <DictationDialog
        open={dictationDialogOpen}
        onOpenChange={setDictationDialogOpen}
        lessonId={activeLessonIdForDictation}
        dictation={editingDictation}
        onSaved={handleDictationSaved}
      />

      <WordDialog
        open={wordDialogOpen}
        onOpenChange={setWordDialogOpen}
        courseId={courseId}
        word={editingWord}
        onSaved={handleWordSaved}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该课时吗？课时内的句子和听写也会被移除。
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

      <AlertDialog
        open={deleteSentenceConfirmOpen}
        onOpenChange={setDeleteSentenceConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该句子吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteSentenceConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDictationConfirmOpen}
        onOpenChange={setDeleteDictationConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该听写吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteDictationConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteWordConfirmOpen}
        onOpenChange={setDeleteWordConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该单词吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteWordConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LessonsDrawer;
