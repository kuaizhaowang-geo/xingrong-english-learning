import React, { useCallback, useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Save,
  Upload,
  Layers,
  BookOpen,
  MessageSquare,
  X,
  Play,
  Keyboard,
  Headphones,
  Mic,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
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
import { ScrollArea } from '@client/src/components/ui/scroll-area';
import { toast } from 'sonner';
import * as userCourseApi from '@client/src/api/user-created-courses';
import type {
  UserCreatedCourse,
  CourseUnit,
  UnitWord,
  UnitSentence,
  CreateWordDto,
  CreateSentenceDto,
  BatchImportResult,
} from '@client/src/api/user-created-courses';
import UnitDialog from './UnitDialog';
import CourseDialog from './CourseDialog';
import WordListPanel from './WordListPanel';
import SentenceListPanel from './SentenceListPanel';

// ===== 常量 =====

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

// ===== 类型 =====

type DeleteTarget =
  | { type: 'unit'; id: string; title: string }
  | { type: 'word'; id: string; title: string }
  | { type: 'sentence'; id: string; title: string }
  | null;

// ===== 主组件 =====

const CourseEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courseId = id ?? '';

  // 课程信息
  const [course, setCourse] = useState<UserCreatedCourse | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);

  // 单元
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CourseUnit | null>(null);

  // 课程信息弹窗
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'words' | 'sentences'>('words');

  // 单词 / 句子
  const [words, setWords] = useState<UnitWord[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [sentences, setSentences] = useState<UnitSentence[]>([]);
  const [sentencesLoading, setSentencesLoading] = useState(false);
  const [addingWord, setAddingWord] = useState(false);
  const [addingSentence, setAddingSentence] = useState(false);

  // 删除确认
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  // 批量导入
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  // 学习模式弹窗
  const [studyOpen, setStudyOpen] = useState(false);

  // 保存
  const [saving, setSaving] = useState(false);

  // ===== 加载课程 =====
  const loadCourse = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setCourseLoading(true);
    try {
      const data = await userCourseApi.getCourse(courseId);
      setCourse(data);
    } catch (err) {
      logger.error('Failed to load course', { error: String(err) });
      toast.error('加载课程失败');
    } finally {
      setCourseLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // ===== 加载单元 =====
  const loadUnits = useCallback(async (): Promise<void> => {
    if (!courseId) return;
    setUnitsLoading(true);
    try {
      const data = await userCourseApi.getUnits(courseId);
      const sorted = [...data].sort((a, b) => a.unitOrder - b.unitOrder);
      setUnits(sorted);
      if (sorted.length > 0 && !selectedUnitId) {
        setSelectedUnitId(sorted[0].id);
      }
    } catch (err) {
      logger.error('Failed to load units', { error: String(err) });
    } finally {
      setUnitsLoading(false);
    }
  }, [courseId, selectedUnitId]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // ===== 加载单词 =====
  const loadWords = useCallback(async (unitId: string): Promise<void> => {
    setWordsLoading(true);
    try {
      const data = await userCourseApi.getWords(unitId);
      setWords([...data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      logger.error('Failed to load words', { error: String(err) });
    } finally {
      setWordsLoading(false);
    }
  }, []);

  // ===== 加载句子 =====
  const loadSentences = useCallback(async (unitId: string): Promise<void> => {
    setSentencesLoading(true);
    try {
      const data = await userCourseApi.getSentences(unitId);
      setSentences([...data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      logger.error('Failed to load sentences', { error: String(err) });
    } finally {
      setSentencesLoading(false);
    }
  }, []);

  // 切换单元时加载内容
  useEffect(() => {
    if (selectedUnitId) {
      if (activeTab === 'words') loadWords(selectedUnitId);
      else loadSentences(selectedUnitId);
    }
  }, [selectedUnitId, activeTab, loadWords, loadSentences]);

  // ===== 单元操作 =====

  const handleAddUnit = (): void => {
    setEditingUnit(null);
    setUnitDialogOpen(true);
  };

  const handleEditUnit = (unit: CourseUnit): void => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  };

  const handleDeleteUnit = (unit: CourseUnit): void => {
    setDeleteTarget({ type: 'unit', id: unit.id, title: unit.title });
    setDeleteOpen(true);
  };

  const onCreateUnit = async (dto: userCourseApi.CreateUnitDto): Promise<CourseUnit> => {
    return userCourseApi.createUnit(courseId, dto);
  };

  const onUpdateUnit = async (
    unitId: string,
    dto: userCourseApi.UpdateUnitDto,
  ): Promise<CourseUnit> => {
    return userCourseApi.updateUnit(unitId, dto);
  };

  // ===== 单词操作 =====

  const handleAddWord = async (dto: CreateWordDto): Promise<void> => {
    if (!selectedUnitId) return;
    setAddingWord(true);
    try {
      const created = await userCourseApi.createWord(selectedUnitId, dto);
      setWords((prev) =>
        [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      toast.success('单词已添加');
    } catch (err) {
      logger.error('Failed to add word', { error: String(err) });
      toast.error('添加失败');
    } finally {
      setAddingWord(false);
    }
  };

  const handleSaveWord = async (word: UnitWord): Promise<void> => {
    try {
      const updated = await userCourseApi.updateWord(word.id, {
        word: word.word.trim(),
        phonetic: word.phonetic?.trim() || undefined,
        partOfSpeech: word.partOfSpeech?.trim() || undefined,
        meaning: word.meaning.trim(),
        example: word.example?.trim() || undefined,
      });
      setWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
      toast.success('已保存');
    } catch (err) {
      logger.error('Failed to save word', { error: String(err) });
      toast.error('保存失败');
    }
  };

  const handleDeleteWord = (word: UnitWord): void => {
    setDeleteTarget({ type: 'word', id: word.id, title: word.word });
    setDeleteOpen(true);
  };

  // ===== 句子操作 =====

  const handleAddSentence = async (dto: CreateSentenceDto): Promise<void> => {
    if (!selectedUnitId) return;
    setAddingSentence(true);
    try {
      const created = await userCourseApi.createSentence(selectedUnitId, dto);
      setSentences((prev) =>
        [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      toast.success('句子已添加');
    } catch (err) {
      logger.error('Failed to add sentence', { error: String(err) });
      toast.error('添加失败');
    } finally {
      setAddingSentence(false);
    }
  };

  const handleSaveSentence = async (sentence: UnitSentence): Promise<void> => {
    try {
      const updated = await userCourseApi.updateSentence(sentence.id, {
        sentence: sentence.sentence.trim(),
        translation: sentence.translation?.trim() || undefined,
        grammarTag: sentence.grammarTag?.trim() || undefined,
      });
      setSentences((prev) => prev.map((s) => (s.id === sentence.id ? updated : s)));
      toast.success('已保存');
    } catch (err) {
      logger.error('Failed to save sentence', { error: String(err) });
      toast.error('保存失败');
    }
  };

  const handleDeleteSentence = (sentence: UnitSentence): void => {
    setDeleteTarget({
      type: 'sentence',
      id: sentence.id,
      title: sentence.sentence.slice(0, 30),
    });
    setDeleteOpen(true);
  };

  // ===== 删除确认 =====

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'unit') {
        await userCourseApi.deleteUnit(deleteTarget.id);
        if (selectedUnitId === deleteTarget.id) {
          const remaining = units.filter((u) => u.id !== deleteTarget.id);
          setSelectedUnitId(remaining.length > 0 ? remaining[0].id : null);
        }
        await loadUnits();
        toast.success('单元已删除');
      } else if (deleteTarget.type === 'word') {
        await userCourseApi.deleteWord(deleteTarget.id);
        setWords((prev) => prev.filter((w) => w.id !== deleteTarget.id));
        toast.success('单词已删除');
      } else if (deleteTarget.type === 'sentence') {
        await userCourseApi.deleteSentence(deleteTarget.id);
        setSentences((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        toast.success('句子已删除');
      }
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      logger.error('Failed to delete', { error: String(err) });
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // ===== 批量导入 =====

  const openImport = (tab: 'words' | 'sentences'): void => {
    setActiveTab(tab);
    setImportText('');
    setImportResult(null);
    setImportOpen(true);
  };

  const handleImport = async (): Promise<void> => {
    if (!selectedUnitId || !importText.trim()) return;
    setImporting(true);
    try {
      if (activeTab === 'words') {
        const items = parseWordImport(importText);
        if (items.length === 0) {
          toast.error('未解析到有效单词，请检查格式');
          return;
        }
        const result = await userCourseApi.importWords(selectedUnitId, items);
        setImportResult(result);
        if (result.success > 0) await loadWords(selectedUnitId);
      } else {
        const items = parseSentenceImport(importText);
        if (items.length === 0) {
          toast.error('未解析到有效句子，请检查格式');
          return;
        }
        const result = await userCourseApi.importSentences(selectedUnitId, items);
        setImportResult(result);
        if (result.success > 0) await loadSentences(selectedUnitId);
      }
    } catch (err) {
      logger.error('Failed to import', { error: String(err) });
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // ===== 分享开关 =====

  const handleShareToggle = async (checked: boolean): Promise<void> => {
    if (!course) return;
    try {
      const updated = checked
        ? await userCourseApi.shareCourse(course.id)
        : await userCourseApi.unshareCourse(course.id);
      setCourse(updated);
      toast.success(checked ? '已提交公开申请' : '已取消公开');
    } catch (err) {
      logger.error('Failed to toggle share', { error: String(err) });
      toast.error('操作失败');
    }
  };

  // ===== 学习模式 =====

  const studyModes = [
    { key: 'typing', label: '打字模式', desc: '看单词拼写，练习打字输入', icon: Keyboard },
    { key: 'dictation', label: '听写模式', desc: '看释义拼写单词，强化记忆', icon: Headphones },
    { key: 'follow', label: '跟读模式', desc: '跟着发音朗读，训练口语', icon: Mic },
    { key: 'speak', label: '看说模式', desc: '看单词想释义，快速反应', icon: Eye },
  ] as const;

  const handleStartStudy = (mode: string): void => {
    if (!selectedUnitId) {
      toast.warning('请先选择一个单元');
      return;
    }
    if (words.length === 0) {
      toast.warning('该单元暂无单词，请先添加单词');
      return;
    }
    setStudyOpen(false);
    navigate(`/word-training?unitId=${selectedUnitId}&mode=${mode}`);
  };

  // ===== 保存 =====

  const handleSaveCourse = async (): Promise<void> => {
    setSaving(true);
    try {
      await loadCourse();
      await loadUnits();
      toast.success('已保存');
    } finally {
      setSaving(false);
    }
  };

  // ===== 渲染 =====

  if (courseLoading) {
    return (
      <div className="py-20 flex justify-center items-center gap-2 text-gray-500">
        <Spinner />
        <span>加载中...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="border border-gray-100 rounded-xl shadow-sm">
        <CardContent className="py-20 text-center text-gray-500">
          课程不存在或已被删除
        </CardContent>
      </Card>
    );
  }

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? null;
  const categoryLabel = course.category
    ? CATEGORY_LABELS[course.subject]?.[course.category] ?? course.category
    : '';

  return (
    <div className="space-y-4">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/my-courses')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
              {course.name}
              <Badge variant="secondary" className="text-xs font-normal">
                {SUBJECT_LABELS[course.subject] ?? course.subject}
              </Badge>
              {categoryLabel && (
                <Badge variant="outline" className="text-xs font-normal">
                  {categoryLabel}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              {units.length} 个单元 · 学习 {course.learnCount} 次
            </p>
          </div>
        </div>
         <div className="flex items-center gap-3">
           <Button
             onClick={() => setStudyOpen(true)}
             className="bg-gradient-to-r from-[#FF6B35] to-[#FF8F6B] hover:from-[#ff5a1f] text-white border-0"
           >
             <Play size={14} />
             开始学习
           </Button>
           <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">公开分享</span>
            <Switch
              checked={course.visibility === 'public'}
              onCheckedChange={handleShareToggle}
            />
          </div>
          <Button variant="outline" onClick={() => setCourseDialogOpen(true)}>
            <Pencil size={14} />
            编辑信息
          </Button>
          <Button
            onClick={handleSaveCourse}
            disabled={saving}
            className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]"
          >
            <Save size={14} />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 主体：左侧单元 + 右侧内容 */}
      <div className="flex gap-4 h-[calc(100vh-10rem)] min-h-[600px]">
        {/* 左侧单元列表 */}
        <Card className="w-64 flex-shrink-0 border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="p-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers size={16} className="text-[#4361EE]" />
                单元列表
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#4361EE]"
                onClick={handleAddUnit}
              >
                <Plus size={14} />
                新增
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto pt-0">
            {unitsLoading ? (
              <div className="py-8 flex justify-center items-center gap-2 text-gray-500">
                <Spinner />
                <span>加载中...</span>
              </div>
            ) : units.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                暂无单元<br />点击「新增」创建
              </div>
            ) : (
              <div className="space-y-1">
                {units.map((unit: CourseUnit) => (
                  <div
                    key={unit.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUnitId === unit.id
                        ? 'bg-[#4361EE]/10 border border-[#4361EE]/20'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => setSelectedUnitId(unit.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1A1A2E] truncate">
                          <span className="text-gray-400 mr-1">{unit.unitOrder}.</span>
                          {unit.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <BookOpen size={10} />
                            {unit.wordCount} 词
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageSquare size={10} />
                            {unit.sentenceCount} 句
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEditUnit(unit);
                          }}
                        >
                          <Pencil size={12} className="text-[#4361EE]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteUnit(unit);
                          }}
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧内容编辑 */}
        <Card className="flex-1 border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {!selectedUnit ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Layers size={48} className="mx-auto mb-3 text-gray-300" />
                <p>请从左侧选择或创建一个单元</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#1A1A2E]">
                    {selectedUnit.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openImport(activeTab)}
                    >
                      <Upload size={14} />
                      批量导入
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(v: string) => setActiveTab(v as 'words' | 'sentences')}
                className="flex-1 flex flex-col"
              >
                <div className="px-4 pt-2 flex-shrink-0">
                  <TabsList>
                    <TabsTrigger value="words" className="flex items-center gap-1.5">
                      <BookOpen size={14} />
                      单词 ({words.length})
                    </TabsTrigger>
                    <TabsTrigger value="sentences" className="flex items-center gap-1.5">
                      <MessageSquare size={14} />
                      句子 ({sentences.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="words"
                  className="flex-1 flex flex-col min-h-0 m-0 border-none pt-2"
                >
                  <ScrollArea className="flex-1">
                    <WordListPanel
                      words={words}
                      loading={wordsLoading}
                      adding={addingWord}
                      unitId={selectedUnitId ?? ''}
                      onAdd={handleAddWord}
                      onUpdate={handleSaveWord}
                      onDelete={handleDeleteWord}
                      onRefresh={() => loadWords(selectedUnitId ?? '')}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent
                  value="sentences"
                  className="flex-1 flex flex-col min-h-0 m-0 border-none pt-2"
                >
                  <ScrollArea className="flex-1">
                    <SentenceListPanel
                      sentences={sentences}
                      loading={sentencesLoading}
                      adding={addingSentence}
                      onAdd={handleAddSentence}
                      onUpdate={handleSaveSentence}
                      onDelete={handleDeleteSentence}
                    />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>

      {/* 单元弹窗 */}
      <UnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        unit={editingUnit}
        defaultOrder={units.length + 1}
        onSaved={() => {
          setEditingUnit(null);
          return loadUnits();
        }}
        onCreate={onCreateUnit}
        onUpdate={onUpdateUnit}
      />

      {/* 课程信息编辑弹窗 */}
      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        course={course}
        onSaved={loadCourse}
        onCreate={userCourseApi.createCourse}
        onUpdate={userCourseApi.updateCourse}
      />

      {/* 批量导入弹窗 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              批量导入{activeTab === 'words' ? '单词' : '句子'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'words'
                ? '每行一个单词，格式：单词 / 音标 / 词性 / 释义 / 例句（仅单词和释义必填，用英文 / 分隔）'
                : '每行一个句子，格式：英文句子 / 中文翻译 / 语法标签（仅句子必填，用英文 / 分隔）'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 min-h-0">
            <Textarea
              value={importText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)}
              placeholder={
                activeTab === 'words'
                  ? "apple / ˈæpl / n. / 苹果 / I eat an apple every day.\nbanana / bəˈnænə / n. / 香蕉"
                  : "I love English. / 我爱英语。 / 一般现在时\nShe is reading a book. / 她正在读一本书。"
              }
              rows={12}
              className="font-mono text-sm"
            />

            {importResult && (
              <div className={`p-3 rounded-lg text-sm ${
                importResult.failed === 0
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <div className="font-medium mb-1">
                  导入完成：成功 {importResult.success} 条，失败 {importResult.failed} 条
                </div>
                {importResult.errors.length > 0 && (
                  <div className="space-y-0.5 text-xs max-h-24 overflow-y-auto">
                    {importResult.errors.map((err, i: number) => (
                      <div key={i}>
                        第 {err.row} 行：{err.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              <X size={14} />
              关闭
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importText.trim() || importing}
              className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]"
            >
              {importing ? '导入中...' : '开始导入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 学习模式选择弹窗 */}
      <Dialog open={studyOpen} onOpenChange={setStudyOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-lg">选择学习模式</DialogTitle>
            <DialogDescription>
              选择一种学习模式，开始练习当前单元的 {words.length} 个单词
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            {studyModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  onClick={() => handleStartStudy(mode.key)}
                  className="flex items-start gap-3 p-4 rounded-xl border border-white/10 glass-card hover:border-fuchsia-500/40 hover:shadow-[0_0_20px_rgba(217_70_239_0.15)] transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF8F6B] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                      <div className="font-medium text-white group-hover:text-fuchsia-400 transition-colors">
                      {mode.label}
                    </div>
                      <div className="text-xs text-slate-400 mt-1">
                      {mode.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStudyOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认删除
              {deleteTarget?.type === 'unit' ? '单元' : deleteTarget?.type === 'word' ? '单词' : '句子'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{deleteTarget?.title}」
              {deleteTarget?.type === 'unit'
                ? '吗？删除后其下所有单词和句子也将被删除，此操作不可恢复。'
                : '吗？此操作不可恢复。'}
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

// ===== 导入解析工具 =====

function parseWordImport(text: string): CreateWordDto[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: CreateWordDto[] = [];
  for (const line of lines) {
    const parts = line.split('/').map((p) => p.trim());
    const [word, phonetic, partOfSpeech, meaning, example] = parts;
    if (!word || !meaning) continue;
    items.push({
      word,
      phonetic: phonetic || undefined,
      partOfSpeech: partOfSpeech || undefined,
      meaning,
      example: example || undefined,
    });
  }
  return items;
}

function parseSentenceImport(text: string): CreateSentenceDto[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: CreateSentenceDto[] = [];
  for (const line of lines) {
    const parts = line.split('/').map((p) => p.trim());
    const [sentence, translation, grammarTag] = parts;
    if (!sentence) continue;
    items.push({
      sentence,
      translation: translation || undefined,
      grammarTag: grammarTag || undefined,
    });
  }
  return items;
}

export default CourseEditorPage;
