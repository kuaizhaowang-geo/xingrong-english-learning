import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
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
import { Badge } from '@client/src/components/ui/badge';
import { Spinner } from '@client/src/components/ui/spinner';
import * as adminApi from '@client/src/api/admin';
import type {
  AdminWordItem,
  AdminSentenceItem,
  AdminChineseCharItem,
  AdminMathTopicItem,
  AdminMathPracticeItem,
  TextbookUnit,
} from '@shared/api.interface';
import WordFormDialog from '@client/src/pages/AdminWordsPage/WordFormDialog';
import SentenceFormDialog from '@client/src/pages/AdminSentencesPage/SentenceFormDialog';
import ChineseCharFormDialog from './ChineseCharFormDialog';
import MathTopicFormDialog from './MathTopicFormDialog';
import MathPracticeFormDialog from './MathPracticeFormDialog';

interface ContentEditorPanelProps {
  textbookId: string;
  subject: string;
  units: TextbookUnit[];
  selectedUnitId: string | null;
  onUnitContentChange?: () => void;
}

type ContentTab = 'words' | 'sentences' | 'chars' | 'math-topics' | 'math-practice';

const PART_OF_SPEECH_OPTIONS = [
  'n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'num.', 'art.', 'int.',
];

const ContentEditorPanel: React.FC<ContentEditorPanelProps> = ({
  textbookId,
  subject,
  units,
  selectedUnitId,
  onUnitContentChange,
}) => {
  const [tab, setTab] = useState<ContentTab>(
    subject === 'chinese' ? 'chars' : subject === 'math' ? 'math-topics' : 'words',
  );

  // words
  const [words, setWords] = useState<AdminWordItem[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordKeyword, setWordKeyword] = useState('');
  const [wordFormOpen, setWordFormOpen] = useState(false);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [wordDeleteOpen, setWordDeleteOpen] = useState(false);
  const [wordDeleteTarget, setWordDeleteTarget] = useState<AdminWordItem | null>(null);

  // sentences
  const [sentences, setSentences] = useState<AdminSentenceItem[]>([]);
  const [sentencesLoading, setSentencesLoading] = useState(false);
  const [sentenceKeyword, setSentenceKeyword] = useState('');
  const [sentenceFormOpen, setSentenceFormOpen] = useState(false);
  const [editingSentenceId, setEditingSentenceId] = useState<string | null>(null);
  const [sentenceDeleteOpen, setSentenceDeleteOpen] = useState(false);
  const [sentenceDeleteTarget, setSentenceDeleteTarget] = useState<AdminSentenceItem | null>(null);

  // chars
  const [chars, setChars] = useState<AdminChineseCharItem[]>([]);
  const [charsLoading, setCharsLoading] = useState(false);
  const [charKeyword, setCharKeyword] = useState('');
  const [charFormOpen, setCharFormOpen] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charDeleteOpen, setCharDeleteOpen] = useState(false);
  const [charDeleteTarget, setCharDeleteTarget] = useState<AdminChineseCharItem | null>(null);

  // math topics
  const [topics, setTopics] = useState<AdminMathTopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicKeyword, setTopicKeyword] = useState('');
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicDeleteOpen, setTopicDeleteOpen] = useState(false);
  const [topicDeleteTarget, setTopicDeleteTarget] = useState<AdminMathTopicItem | null>(null);

  // math practice items
  const [practiceItems, setPracticeItems] = useState<AdminMathPracticeItem[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceKeyword, setPracticeKeyword] = useState('');
  const [practiceFormOpen, setPracticeFormOpen] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [practiceDeleteOpen, setPracticeDeleteOpen] = useState(false);
  const [practiceDeleteTarget, setPracticeDeleteTarget] = useState<AdminMathPracticeItem | null>(null);

  // textbooks list for word/sentence form dialogs (they require Textbook[] type)
  const [textbookList, setTextbookList] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    setTextbookList([{ id: textbookId, title: '当前教材' }]);
  }, [textbookId]);

  const loadWords = useCallback(async (): Promise<void> => {
    if (!textbookId) return;
    setWordsLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 500, textbookId };
      if (selectedUnitId) params.unitId = selectedUnitId;
      if (wordKeyword) params.keyword = wordKeyword;
      const data = await adminApi.getWords(params);
      setWords(data.items ?? []);
    } catch (err) {
      logger.error('Failed to load words', { error: String(err) });
    } finally {
      setWordsLoading(false);
    }
  }, [textbookId, selectedUnitId, wordKeyword]);

  const loadSentences = useCallback(async (): Promise<void> => {
    if (!textbookId) return;
    setSentencesLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 500, textbookId };
      if (selectedUnitId) params.unitId = selectedUnitId;
      if (sentenceKeyword) params.keyword = sentenceKeyword;
      const data = await adminApi.getSentences(params);
      setSentences(data.items ?? []);
    } catch (err) {
      logger.error('Failed to load sentences', { error: String(err) });
    } finally {
      setSentencesLoading(false);
    }
  }, [textbookId, selectedUnitId, sentenceKeyword]);

  const loadChars = useCallback(async (): Promise<void> => {
    if (!textbookId || subject !== 'chinese') return;
    setCharsLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 500, textbookId };
      if (selectedUnitId) params.unitId = selectedUnitId;
      if (charKeyword) params.keyword = charKeyword;
      const data = await adminApi.getChineseChars(
        params as Parameters<typeof adminApi.getChineseChars>[0],
      );
      setChars(data.items ?? []);
    } catch (err) {
      logger.error('Failed to load chars', { error: String(err) });
    } finally {
      setCharsLoading(false);
    }
  }, [textbookId, subject, selectedUnitId, charKeyword]);

  const loadTopics = useCallback(async (): Promise<void> => {
    if (!textbookId || subject !== 'math') return;
    setTopicsLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 100, textbookId };
      if (selectedUnitId) params.unitId = selectedUnitId;
      if (topicKeyword) params.keyword = topicKeyword;
      const data = await adminApi.getMathTopics(
        params as Parameters<typeof adminApi.getMathTopics>[0],
      );
      setTopics(data.items ?? []);
    } catch (err) {
      logger.error('Failed to load math topics', { error: String(err) });
    } finally {
      setTopicsLoading(false);
    }
  }, [textbookId, subject, selectedUnitId, topicKeyword]);

  const loadPracticeItems = useCallback(async (): Promise<void> => {
    if (!textbookId || subject !== 'math') return;
    setPracticeLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 100, textbookId };
      if (selectedUnitId) params.unitId = selectedUnitId;
      if (practiceKeyword) params.keyword = practiceKeyword;
      const data = await adminApi.getMathPracticeItems(
        params as Parameters<typeof adminApi.getMathPracticeItems>[0],
      );
      setPracticeItems(data.items ?? []);
    } catch (err) {
      logger.error('Failed to load math practice items', { error: String(err) });
    } finally {
      setPracticeLoading(false);
    }
  }, [textbookId, subject, selectedUnitId, practiceKeyword]);

  useEffect(() => {
    if (tab === 'words') loadWords();
  }, [tab, loadWords]);

  useEffect(() => {
    if (tab === 'sentences') loadSentences();
  }, [tab, loadSentences]);

  useEffect(() => {
    if (tab === 'chars') loadChars();
  }, [tab, loadChars]);

  useEffect(() => {
    if (tab === 'math-topics') loadTopics();
  }, [tab, loadTopics]);

  useEffect(() => {
    if (tab === 'math-practice') loadPracticeItems();
  }, [tab, loadPracticeItems]);

  // Word actions
  const handleAddWord = (): void => {
    setEditingWordId(null);
    setWordFormOpen(true);
  };
  const handleEditWord = (item: AdminWordItem): void => {
    setEditingWordId(item.id);
    setWordFormOpen(true);
  };
  const handleWordDeleteClick = (item: AdminWordItem): void => {
    setWordDeleteTarget(item);
    setWordDeleteOpen(true);
  };
  const handleWordDeleteConfirm = async (): Promise<void> => {
    if (!wordDeleteTarget) return;
    try {
      await adminApi.deleteWord(wordDeleteTarget.id);
      loadWords();
      onUnitContentChange?.();
    } catch (err) {
      logger.error('Failed to delete word', { error: String(err) });
    } finally {
      setWordDeleteOpen(false);
      setWordDeleteTarget(null);
    }
  };

  // Sentence actions
  const handleAddSentence = (): void => {
    setEditingSentenceId(null);
    setSentenceFormOpen(true);
  };
  const handleEditSentence = (item: AdminSentenceItem): void => {
    setEditingSentenceId(item.id);
    setSentenceFormOpen(true);
  };
  const handleSentenceDeleteClick = (item: AdminSentenceItem): void => {
    setSentenceDeleteTarget(item);
    setSentenceDeleteOpen(true);
  };
  const handleSentenceDeleteConfirm = async (): Promise<void> => {
    if (!sentenceDeleteTarget) return;
    try {
      await adminApi.deleteSentence(sentenceDeleteTarget.id);
      loadSentences();
      onUnitContentChange?.();
    } catch (err) {
      logger.error('Failed to delete sentence', { error: String(err) });
    } finally {
      setSentenceDeleteOpen(false);
      setSentenceDeleteTarget(null);
    }
  };

  // Char actions
  const handleAddChar = (): void => {
    setEditingCharId(null);
    setCharFormOpen(true);
  };
  const handleEditChar = (item: AdminChineseCharItem): void => {
    setEditingCharId(item.id);
    setCharFormOpen(true);
  };
  const handleCharDeleteClick = (item: AdminChineseCharItem): void => {
    setCharDeleteTarget(item);
    setCharDeleteOpen(true);
  };
  const handleCharDeleteConfirm = async (): Promise<void> => {
    if (!charDeleteTarget) return;
    try {
      await adminApi.deleteChineseChar(charDeleteTarget.id);
      loadChars();
      onUnitContentChange?.();
    } catch (err) {
      logger.error('Failed to delete char', { error: String(err) });
    } finally {
      setCharDeleteOpen(false);
      setCharDeleteTarget(null);
    }
  };

  // Math topic actions
  const handleAddTopic = (): void => {
    setEditingTopicId(null);
    setTopicFormOpen(true);
  };
  const handleEditTopic = (item: AdminMathTopicItem): void => {
    setEditingTopicId(item.id);
    setTopicFormOpen(true);
  };
  const handleTopicDeleteClick = (item: AdminMathTopicItem): void => {
    setTopicDeleteTarget(item);
    setTopicDeleteOpen(true);
  };
  const handleTopicDeleteConfirm = async (): Promise<void> => {
    if (!topicDeleteTarget) return;
    try {
      await adminApi.deleteMathTopic(topicDeleteTarget.id);
      loadTopics();
      onUnitContentChange?.();
    } catch (err) {
      logger.error('Failed to delete math topic', { error: String(err) });
    } finally {
      setTopicDeleteOpen(false);
      setTopicDeleteTarget(null);
    }
  };

  // Math practice actions
  const handleAddPractice = (): void => {
    setEditingPracticeId(null);
    setPracticeFormOpen(true);
  };
  const handleEditPractice = (item: AdminMathPracticeItem): void => {
    setEditingPracticeId(item.id);
    setPracticeFormOpen(true);
  };
  const handlePracticeDeleteClick = (item: AdminMathPracticeItem): void => {
    setPracticeDeleteTarget(item);
    setPracticeDeleteOpen(true);
  };
  const handlePracticeDeleteConfirm = async (): Promise<void> => {
    if (!practiceDeleteTarget) return;
    try {
      await adminApi.deleteMathPracticeItem(practiceDeleteTarget.id);
      loadPracticeItems();
      onUnitContentChange?.();
    } catch (err) {
      logger.error('Failed to delete math practice item', { error: String(err) });
    } finally {
      setPracticeDeleteOpen(false);
      setPracticeDeleteTarget(null);
    }
  };

  const onWordSaved = (): void => {
    setWordFormOpen(false);
    loadWords();
    onUnitContentChange?.();
  };

  const onSentenceSaved = (): void => {
    setSentenceFormOpen(false);
    loadSentences();
    onUnitContentChange?.();
  };

  const onCharSaved = (): void => {
    setCharFormOpen(false);
    loadChars();
    onUnitContentChange?.();
  };

  const onTopicSaved = (): void => {
    setTopicFormOpen(false);
    loadTopics();
    onUnitContentChange?.();
  };

  const onPracticeSaved = (): void => {
    setPracticeFormOpen(false);
    loadPracticeItems();
    onUnitContentChange?.();
  };

  const defaultUnit = selectedUnitId ?? units[0]?.id ?? '';

  return (
    <div className="border-t border-gray-100 flex flex-col flex-1 min-h-0">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-[#1A1A2E]">内容编辑</h4>
          <span className="text-xs text-gray-400">
            {selectedUnitId
              ? `当前单元：${units.find((u: TextbookUnit) => u.id === selectedUnitId)?.title ?? ''}`
              : '显示全部单元内容'}
          </span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v: string) => setTab(v as ContentTab)} className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList>
            {subject === 'chinese' && (
              <TabsTrigger value="chars">汉字</TabsTrigger>
            )}
            {subject === 'math' && (
              <>
                <TabsTrigger value="math-topics">知识点</TabsTrigger>
                <TabsTrigger value="math-practice">习题</TabsTrigger>
              </>
            )}
            {subject !== 'chinese' && subject !== 'math' && (
              <>
                <TabsTrigger value="words">单词</TabsTrigger>
                <TabsTrigger value="sentences">句子</TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* 单词 Tab */}
        {subject !== 'chinese' && (
          <TabsContent value="words" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={wordKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWordKeyword(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') loadWords();
                  }}
                  placeholder="搜索单词/释义"
                  className="pl-7 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddWord}>
                <Plus size={14} />
                新增单词
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {wordsLoading ? (
                <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                  <Spinner />
                  <span>加载中...</span>
                </div>
              ) : words.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  暂无单词，点击「新增单词」添加
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>单词</TableHead>
                      <TableHead>音标</TableHead>
                      <TableHead>词性</TableHead>
                      <TableHead>释义</TableHead>
                      <TableHead className="w-28">单元</TableHead>
                      <TableHead className="w-24 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {words.map((item: AdminWordItem, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.word}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{item.phonetic || '-'}</TableCell>
                        <TableCell>
                          {item.partOfSpeech ? (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {item.partOfSpeech}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                          {item.meaning}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.unitTitle || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditWord(item)}
                            >
                              <Pencil size={13} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleWordDeleteClick(item)}
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}

        {/* 句子 Tab */}
        {subject !== 'chinese' && (
          <TabsContent value="sentences" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={sentenceKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSentenceKeyword(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') loadSentences();
                  }}
                  placeholder="搜索句子/翻译"
                  className="pl-7 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddSentence}>
                <Plus size={14} />
                新增句子
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {sentencesLoading ? (
                <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                  <Spinner />
                  <span>加载中...</span>
                </div>
              ) : sentences.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  暂无句子，点击「新增句子」添加
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>句子</TableHead>
                      <TableHead>翻译</TableHead>
                      <TableHead className="w-28">单元</TableHead>
                      <TableHead className="w-24 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentences.map((item: AdminSentenceItem, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="max-w-[300px] truncate font-medium">
                          {item.sentence}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                          {item.translation}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.unitTitle || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditSentence(item)}
                            >
                              <Pencil size={13} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSentenceDeleteClick(item)}
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}

        {/* 汉字 Tab */}
        {subject === 'chinese' && (
          <TabsContent value="chars" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={charKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCharKeyword(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') loadChars();
                  }}
                  placeholder="搜索汉字/拼音"
                  className="pl-7 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddChar}>
                <Plus size={14} />
                新增汉字
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {charsLoading ? (
                <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                  <Spinner />
                  <span>加载中...</span>
                </div>
              ) : chars.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  暂无汉字，点击「新增汉字」添加
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-16">汉字</TableHead>
                      <TableHead>拼音</TableHead>
                      <TableHead className="w-16">部首</TableHead>
                      <TableHead className="w-16">笔画</TableHead>
                      <TableHead>释义</TableHead>
                      <TableHead className="w-28">单元</TableHead>
                      <TableHead className="w-24 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chars.map((item: AdminChineseCharItem, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-lg">{item.character}</TableCell>
                        <TableCell className="text-sm text-gray-600">{item.pinyin || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{item.radical || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{item.strokes ?? '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                          {item.meaning || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.unitTitle || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditChar(item)}
                            >
                              <Pencil size={13} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCharDeleteClick(item)}
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}

        {/* 数学知识点 Tab */}
        {subject === 'math' && (
          <TabsContent value="math-topics" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={topicKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTopicKeyword(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') loadTopics();
                  }}
                  placeholder="搜索知识点"
                  className="pl-7 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddTopic}>
                <Plus size={14} />
                新增知识点
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {topicsLoading ? (
                <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                  <Spinner />
                  <span>加载中...</span>
                </div>
              ) : topics.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  暂无知识点，点击「新增知识点」添加
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead className="w-28">领域</TableHead>
                      <TableHead className="w-16">排序</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="w-28">单元</TableHead>
                      <TableHead className="w-24 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((item: AdminMathTopicItem, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          {item.domain ? (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {item.domain}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{item.topicOrder ?? '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-600">
                          {item.description || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.unitTitle || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditTopic(item)}
                            >
                              <Pencil size={13} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleTopicDeleteClick(item)}
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}

        {/* 数学习题 Tab */}
        {subject === 'math' && (
          <TabsContent value="math-practice" className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="px-4 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={practiceKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPracticeKeyword(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') loadPracticeItems();
                  }}
                  placeholder="搜索习题"
                  className="pl-7 h-8 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddPractice}>
                <Plus size={14} />
                新增习题
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {practiceLoading ? (
                <div className="py-10 flex justify-center items-center gap-2 text-gray-500">
                  <Spinner />
                  <span>加载中...</span>
                </div>
              ) : practiceItems.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  暂无习题，点击「新增习题」添加
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>题目</TableHead>
                      <TableHead className="w-20">题型</TableHead>
                      <TableHead className="w-20">难度</TableHead>
                      <TableHead className="w-24">正确答案</TableHead>
                      <TableHead className="w-28">单元</TableHead>
                      <TableHead className="w-24 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {practiceItems.map((item: AdminMathPracticeItem, idx: number) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                        <TableCell className="max-w-[300px] truncate font-medium">
                          {item.question}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {item.itemType || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {'⭐'.repeat(item.difficulty || 1)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 truncate max-w-[120px]">
                          {item.correctAnswer}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.unitTitle || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditPractice(item)}
                            >
                              <Pencil size={13} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handlePracticeDeleteClick(item)}
                            >
                              <Trash2 size={13} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* 单词表单弹窗 */}
      {subject !== 'chinese' && (
        <WordFormDialog
          open={wordFormOpen}
          wordId={editingWordId}
          textbooks={textbookList as unknown as import('@shared/api.interface').Textbook[]}
          units={units}
          partOfSpeechOptions={PART_OF_SPEECH_OPTIONS}
          onClose={() => setWordFormOpen(false)}
          onSuccess={onWordSaved}
        />
      )}

      {/* 句子表单弹窗 */}
      {subject !== 'chinese' && (
        <SentenceFormDialog
          open={sentenceFormOpen}
          sentenceId={editingSentenceId}
          textbooks={textbookList as unknown as import('@shared/api.interface').Textbook[]}
          onClose={() => setSentenceFormOpen(false)}
          onSuccess={onSentenceSaved}
        />
      )}

      {/* 汉字表单弹窗 */}
      {subject === 'chinese' && (
        <ChineseCharFormDialog
          open={charFormOpen}
          charId={editingCharId}
          textbookId={textbookId}
          units={units}
          defaultUnitId={defaultUnit}
          onClose={() => setCharFormOpen(false)}
          onSuccess={onCharSaved}
        />
      )}

      {/* 数学知识点表单弹窗 */}
      {subject === 'math' && (
        <MathTopicFormDialog
          open={topicFormOpen}
          topicId={editingTopicId}
          textbookId={textbookId}
          units={units}
          defaultUnitId={defaultUnit}
          onClose={() => setTopicFormOpen(false)}
          onSuccess={onTopicSaved}
        />
      )}

      {/* 数学习题表单弹窗 */}
      {subject === 'math' && (
        <MathPracticeFormDialog
          open={practiceFormOpen}
          practiceId={editingPracticeId}
          textbookId={textbookId}
          units={units}
          defaultUnitId={defaultUnit}
          onClose={() => setPracticeFormOpen(false)}
          onSuccess={onPracticeSaved}
        />
      )}

      {/* 删除确认 - 单词 */}
      <AlertDialog open={wordDeleteOpen} onOpenChange={setWordDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除单词</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除单词「{wordDeleteTarget?.word}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleWordDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认 - 句子 */}
      <AlertDialog open={sentenceDeleteOpen} onOpenChange={setSentenceDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除句子</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该句子吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleSentenceDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认 - 汉字 */}
      <AlertDialog open={charDeleteOpen} onOpenChange={setCharDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除汉字</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除汉字「{charDeleteTarget?.character}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleCharDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认 - 数学知识点 */}
      <AlertDialog open={topicDeleteOpen} onOpenChange={setTopicDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除知识点</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除知识点「{topicDeleteTarget?.title}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleTopicDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认 - 数学习题 */}
      <AlertDialog open={practiceDeleteOpen} onOpenChange={setPracticeDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除习题</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该习题吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handlePracticeDeleteConfirm}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentEditorPanel;
