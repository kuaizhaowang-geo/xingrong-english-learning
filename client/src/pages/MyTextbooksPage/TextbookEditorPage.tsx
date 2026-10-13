import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit3,
  Save,
  Layers,
  BookOpen,
  Type,
  Languages,
  Upload,
  X,
  FileSpreadsheet,
  Copy,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { showConfirm } from '@lark-apaas/client-toolkit';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import UnitDialog, { type TextbookUnit, type CreateUnitDto } from './UnitDialog';
import { type UserTextbook } from './TextbookDialog';

// ============ Types ============

interface TextbookWord {
  id: string;
  unitId: string;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
  wordOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface TextbookSentence {
  id: string;
  unitId: string;
  sentence: string;
  translation: string;
  grammarTag?: string;
  sentenceOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateWordDto {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
}

interface CreateSentenceDto {
  sentence: string;
  translation: string;
  grammarTag?: string;
}

interface BatchImportWordItem {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meaning: string;
  example?: string;
}

interface BatchImportSentenceItem {
  sentence: string;
  translation: string;
  grammarTag?: string;
}

type ContentTab = 'words' | 'sentences';
type ImportMode = 'paste' | 'excel';

// ============ Part of speech options ============
const POS_OPTIONS = [
  'n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.', 'num.', 'interj.',
];

// ============ Main Editor Page ============

const TextbookEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const textbookId = id || '';

  const [textbook, setTextbook] = useState<UserTextbook | null>(null);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentTab>('words');

  // Words
  const [words, setWords] = useState<TextbookWord[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Sentences
  const [sentences, setSentences] = useState<TextbookSentence[]>([]);
  const [sentencesLoading, setSentencesLoading] = useState(false);

  // Unit dialog
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TextbookUnit | null>(null);
  const [unitSubmitting, setUnitSubmitting] = useState(false);

  // Word dialog
  const [showWordDialog, setShowWordDialog] = useState(false);
  const [editingWord, setEditingWord] = useState<TextbookWord | null>(null);
  const [wordForm, setWordForm] = useState<CreateWordDto>({
    word: '', phonetic: '', partOfSpeech: '', meaning: '', example: '',
  });
  const [wordSubmitting, setWordSubmitting] = useState(false);

  // Sentence dialog
  const [showSentenceDialog, setShowSentenceDialog] = useState(false);
  const [editingSentence, setEditingSentence] = useState<TextbookSentence | null>(null);
  const [sentenceForm, setSentenceForm] = useState<CreateSentenceDto>({
    sentence: '', translation: '', grammarTag: '',
  });
  const [sentenceSubmitting, setSentenceSubmitting] = useState(false);

  // Batch import
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchType, setBatchType] = useState<ContentTab>('words');
  const [importMode, setImportMode] = useState<ImportMode>('paste');
  const [pasteText, setPasteText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ Load Data ============

  const loadTextbook = async (): Promise<void> => {
    try {
      const res = await axiosForBackend.get(`/api/user-textbooks/${textbookId}`);
      setTextbook(res.data);
    } catch (err) {
      logger.error('加载教材详情失败', { error: String(err) });
    }
  };

  const loadUnits = async (): Promise<void> => {
    try {
      const res = await axiosForBackend.get(`/api/user-textbooks/${textbookId}/units`);
      const list: TextbookUnit[] = res.data || [];
      const sorted = [...list].sort((a, b) => a.unitOrder - b.unitOrder);
      setUnits(sorted);
      if (sorted.length > 0 && !selectedUnitId) {
        setSelectedUnitId(sorted[0].id);
      }
    } catch (err) {
      logger.error('加载单元列表失败', { error: String(err) });
    }
  };

  const loadWords = async (unitId: string): Promise<void> => {
    setWordsLoading(true);
    try {
      const res = await axiosForBackend.get(`/api/user-textbooks/units/${unitId}/words`);
      setWords(res.data || []);
    } catch (err) {
      logger.error('加载单词失败', { error: String(err) });
    } finally {
      setWordsLoading(false);
    }
  };

  const loadSentences = async (unitId: string): Promise<void> => {
    setSentencesLoading(true);
    try {
      const res = await axiosForBackend.get(`/api/user-textbooks/units/${unitId}/sentences`);
      setSentences(res.data || []);
    } catch (err) {
      logger.error('加载句子失败', { error: String(err) });
    } finally {
      setSentencesLoading(false);
    }
  };

  useEffect(() => {
    if (!textbookId) return;
    const init = async (): Promise<void> => {
      setLoading(true);
      await Promise.all([loadTextbook(), loadUnits()]);
      setLoading(false);
    };
    init();
  }, [textbookId]);

  useEffect(() => {
    if (!selectedUnitId) return;
    if (activeTab === 'words') {
      loadWords(selectedUnitId);
    } else {
      loadSentences(selectedUnitId);
    }
  }, [selectedUnitId, activeTab]);

  // ============ Unit Operations ============

  const handleAddUnit = (): void => {
    setEditingUnit(null);
    setShowUnitDialog(true);
  };

  const handleEditUnit = (unit: TextbookUnit): void => {
    setEditingUnit(unit);
    setShowUnitDialog(true);
  };

  const handleSubmitUnit = async (data: CreateUnitDto): Promise<void> => {
    setUnitSubmitting(true);
    try {
      if (editingUnit) {
        await axiosForBackend.patch(
          `/api/user-textbooks/units/${editingUnit.id}`,
          data,
        );
        toast.success('单元已更新');
      } else {
        const res = await axiosForBackend.post(
          `/api/user-textbooks/${textbookId}/units`,
          data,
        );
        toast.success('单元创建成功');
        if (res.data?.id && units.length === 0) {
          setSelectedUnitId(res.data.id);
        }
      }
      setShowUnitDialog(false);
      loadUnits();
      loadTextbook();
    } catch (err) {
      logger.error('保存单元失败', { error: String(err) });
      toast.error('保存失败');
    } finally {
      setUnitSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string): Promise<void> => {
    if (!await showConfirm('确定删除这个单元吗？单元内的单词和句子也会被删除。')) return;
    try {
      await axiosForBackend.delete(`/api/user-textbooks/units/${unitId}`);
      toast.success('已删除');
      if (selectedUnitId === unitId) {
        const remaining = units.filter((u) => u.id !== unitId);
        setSelectedUnitId(remaining.length > 0 ? remaining[0].id : null);
      }
      loadUnits();
      loadTextbook();
    } catch (err) {
      logger.error('删除单元失败', { error: String(err) });
      toast.error('删除失败');
    }
  };

  // ============ Word Operations ============

  const handleAddWord = (): void => {
    setEditingWord(null);
    setWordForm({ word: '', phonetic: '', partOfSpeech: '', meaning: '', example: '' });
    setShowWordDialog(true);
  };

  const handleEditWord = (word: TextbookWord): void => {
    setEditingWord(word);
    setWordForm({
      word: word.word,
      phonetic: word.phonetic || '',
      partOfSpeech: word.partOfSpeech || '',
      meaning: word.meaning,
      example: word.example || '',
    });
    setShowWordDialog(true);
  };

  const handleSubmitWord = async (): Promise<void> => {
    if (!selectedUnitId || !wordForm.word.trim() || !wordForm.meaning.trim()) return;
    setWordSubmitting(true);
    try {
      if (editingWord) {
        await axiosForBackend.patch(
          `/api/user-textbooks/words/${editingWord.id}`,
          wordForm,
        );
        toast.success('单词已更新');
      } else {
        await axiosForBackend.post(
          `/api/user-textbooks/units/${selectedUnitId}/words`,
          wordForm,
        );
        toast.success('单词已添加');
      }
      setShowWordDialog(false);
      loadWords(selectedUnitId);
    } catch (err) {
      logger.error('保存单词失败', { error: String(err) });
      toast.error('保存失败');
    } finally {
      setWordSubmitting(false);
    }
  };

  const handleDeleteWord = async (wordId: string): Promise<void> => {
    if (!await showConfirm('确定删除这个单词吗？')) return;
    try {
      await axiosForBackend.delete(`/api/user-textbooks/words/${wordId}`);
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success('已删除');
    } catch (err) {
      logger.error('删除单词失败', { error: String(err) });
      toast.error('删除失败');
    }
  };

  // ============ Sentence Operations ============

  const handleAddSentence = (): void => {
    setEditingSentence(null);
    setSentenceForm({ sentence: '', translation: '', grammarTag: '' });
    setShowSentenceDialog(true);
  };

  const handleEditSentence = (s: TextbookSentence): void => {
    setEditingSentence(s);
    setSentenceForm({
      sentence: s.sentence,
      translation: s.translation,
      grammarTag: s.grammarTag || '',
    });
    setShowSentenceDialog(true);
  };

  const handleSubmitSentence = async (): Promise<void> => {
    if (!selectedUnitId || !sentenceForm.sentence.trim() || !sentenceForm.translation.trim()) return;
    setSentenceSubmitting(true);
    try {
      if (editingSentence) {
        await axiosForBackend.patch(
          `/api/user-textbooks/sentences/${editingSentence.id}`,
          sentenceForm,
        );
        toast.success('句子已更新');
      } else {
        await axiosForBackend.post(
          `/api/user-textbooks/units/${selectedUnitId}/sentences`,
          sentenceForm,
        );
        toast.success('句子已添加');
      }
      setShowSentenceDialog(false);
      loadSentences(selectedUnitId);
    } catch (err) {
      logger.error('保存句子失败', { error: String(err) });
      toast.error('保存失败');
    } finally {
      setSentenceSubmitting(false);
    }
  };

  const handleDeleteSentence = async (sentenceId: string): Promise<void> => {
    if (!await showConfirm('确定删除这个句子吗？')) return;
    try {
      await axiosForBackend.delete(`/api/user-textbooks/sentences/${sentenceId}`);
      setSentences((prev) => prev.filter((s) => s.id !== sentenceId));
      toast.success('已删除');
    } catch (err) {
      logger.error('删除句子失败', { error: String(err) });
      toast.error('删除失败');
    }
  };

  // ============ Batch Import ============

  const openBatchImport = (type: ContentTab): void => {
    setBatchType(type);
    setImportMode('paste');
    setPasteText('');
    setShowBatchImport(true);
  };

  const parsePasteWords = (text: string): BatchImportWordItem[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const items: BatchImportWordItem[] = [];
    for (const line of lines) {
      // Try tab first, then comma
      const parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim())
        : line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const [word, meaning, phonetic = '', partOfSpeech = '', example = ''] = parts;
      if (!word || !meaning) continue;
      items.push({ word, meaning, phonetic, partOfSpeech, example });
    }
    return items;
  };

  const parsePasteSentences = (text: string): BatchImportSentenceItem[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const items: BatchImportSentenceItem[] = [];
    for (const line of lines) {
      const parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim())
        : line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const [sentence, translation, grammarTag = ''] = parts;
      if (!sentence || !translation) continue;
      items.push({ sentence, translation, grammarTag });
    }
    return items;
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file || !selectedUnitId) return;

    const reader = new FileReader();
    reader.onload = (event): void => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

        if (batchType === 'words') {
          const items: BatchImportWordItem[] = [];
          // Skip header row
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[0]) continue;
            const [word, meaning = '', phonetic = '', partOfSpeech = '', example = ''] = row.map(String);
            if (word && meaning) {
              items.push({ word: String(word), meaning: String(meaning), phonetic: String(phonetic), partOfSpeech: String(partOfSpeech), example: String(example) });
            }
          }
          doImportWords(items);
        } else {
          const items: BatchImportSentenceItem[] = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0 || !row[0]) continue;
            const [sentence, translation = '', grammarTag = ''] = row.map(String);
            if (sentence && translation) {
              items.push({ sentence: String(sentence), translation: String(translation), grammarTag: String(grammarTag) });
            }
          }
          doImportSentences(items);
        }
      } catch (err) {
        logger.error('解析 Excel 失败', { error: String(err) });
        toast.error('文件解析失败，请检查格式');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = async (): Promise<void> => {
    if (!selectedUnitId || !pasteText.trim()) return;
    if (batchType === 'words') {
      const items = parsePasteWords(pasteText);
      if (items.length === 0) {
        toast.error('未解析到有效单词，请检查格式');
        return;
      }
      doImportWords(items);
    } else {
      const items = parsePasteSentences(pasteText);
      if (items.length === 0) {
        toast.error('未解析到有效句子，请检查格式');
        return;
      }
      doImportSentences(items);
    }
  };

  const doImportWords = async (items: BatchImportWordItem[]): Promise<void> => {
    if (!selectedUnitId) return;
    setImporting(true);
    try {
      await axiosForBackend.post(
        `/api/user-textbooks/units/${selectedUnitId}/import-words`,
        { items },
      );
      toast.success(`成功导入 ${items.length} 个单词`);
      setShowBatchImport(false);
      setPasteText('');
      loadWords(selectedUnitId);
    } catch (err) {
      logger.error('批量导入单词失败', { error: String(err) });
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const doImportSentences = async (items: BatchImportSentenceItem[]): Promise<void> => {
    if (!selectedUnitId) return;
    setImporting(true);
    try {
      await axiosForBackend.post(
        `/api/user-textbooks/units/${selectedUnitId}/import-sentences`,
        { items },
      );
      toast.success(`成功导入 ${items.length} 个句子`);
      setShowBatchImport(false);
      setPasteText('');
      loadSentences(selectedUnitId);
    } catch (err) {
      logger.error('批量导入句子失败', { error: String(err) });
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // ============ Render ============

  if (loading || !textbook) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  const selectedUnit = units.find((u) => u.id === selectedUnitId) || null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div
        className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <button
          onClick={() => navigate('/my-textbooks')}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{textbook.name}</h1>
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            {textbook.grade || '未设年级'} · {textbook.version || '未设版本'} · {units.length} 个单元
          </p>
        </div>
        <button
          onClick={() => toast.success('已保存')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Save className="w-4 h-4" />
          保存
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧单元列表 */}
        <div
          className="w-64 flex-shrink-0 flex flex-col border-r"
          style={{
            background: '#EEF2FF',
            borderColor: 'rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(99, 102, 241, 0.12)' }}>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: '#6366F1' }} />
              <span className="text-sm font-medium text-white">单元列表</span>
            </div>
            <button
              onClick={handleAddUnit}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="新增单元"
            >
              <Plus className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {units.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: '#64748B' }}>
                暂无单元<br />点击 + 创建第一个单元
              </div>
            ) : (
              units.map((unit) => (
                <div
                  key={unit.id}
                  className={`
                    group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                    ${selectedUnitId === unit.id ? '' : 'hover:bg-white/5'}
                  `}
                  style={{
                    background: selectedUnitId === unit.id
                      ? 'rgba(99, 102, 241, 0.12)'
                      : 'transparent',
                    border: selectedUnitId === unit.id
                      ? '1px solid rgba(99, 102, 241, 0.35)'
                      : '1px solid transparent',
                  }}
                  onClick={() => setSelectedUnitId(unit.id)}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{
                      background: selectedUnitId === unit.id
                        ? 'rgba(99, 102, 241, 0.25)'
                        : 'rgba(255,255,255,0.05)',
                      color: selectedUnitId === unit.id ? '#fff' : '#94A3B8',
                    }}
                  >
                    {unit.unitOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{unit.title}</div>
                    <div className="text-xs" style={{ color: '#64748B' }}>
                      {unit.wordCount} 词 · {unit.sentenceCount} 句
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditUnit(unit); }}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Edit3 className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id); }}
                      className="p-1 rounded hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedUnit ? (
            <>
              {/* Tab 切换 */}
              <div
                className="flex items-center gap-1 px-6 pt-4 pb-3"
              >
                <TabButton
                  active={activeTab === 'words'}
                  onClick={() => setActiveTab('words')}
                  icon={BookOpen}
                  label={`单词 (${words.length})`}
                />
                <TabButton
                  active={activeTab === 'sentences'}
                  onClick={() => setActiveTab('sentences')}
                  icon={Type}
                  label={`句子 (${sentences.length})`}
                />
                <div className="flex-1" />
                <button
                  onClick={() => openBatchImport(activeTab)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: '#6366F1',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  批量导入
                </button>
                <button
                  onClick={activeTab === 'words' ? handleAddWord : handleAddSentence}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {activeTab === 'words' ? '新增单词' : '新增句子'}
                </button>
              </div>

              {/* 内容列表 */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {activeTab === 'words' ? (
                  <WordList
                    words={words}
                    loading={wordsLoading}
                    onEdit={handleEditWord}
                    onDelete={handleDeleteWord}
                  />
                ) : (
                  <SentenceList
                    sentences={sentences}
                    loading={sentencesLoading}
                    onEdit={handleEditSentence}
                    onDelete={handleDeleteSentence}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#6366F1' }} />
                <p className="text-white mb-2">还没有单元</p>
                <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
                  先在左侧创建一个单元吧
                </p>
                <button
                  onClick={handleAddUnit}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  }}
                >
                  创建单元
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 单元弹窗 */}
      <UnitDialog
        open={showUnitDialog}
        editingUnit={editingUnit}
        onClose={() => setShowUnitDialog(false)}
        onSubmit={handleSubmitUnit}
        submitting={unitSubmitting}
      />

      {/* 单词弹窗 */}
      {showWordDialog && (
        <ItemDialog
          title={editingWord ? '编辑单词' : '新增单词'}
          onClose={() => setShowWordDialog(false)}
          onSubmit={handleSubmitWord}
          submitting={wordSubmitting}
        >
          <div className="space-y-3">
            <Field label="单词 *">
              <input
                type="text"
                value={wordForm.word}
                onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                placeholder="如：apple"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="音标">
                <input
                  type="text"
                  value={wordForm.phonetic}
                  onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })}
                  placeholder="如：/ˈæpl/"
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={inputStyle}
                />
              </Field>
              <Field label="词性">
                <select
                  value={wordForm.partOfSpeech}
                  onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none appearance-none cursor-pointer"
                  style={inputStyle}
                >
                  <option value="" style={optionStyle}>请选择</option>
                  {POS_OPTIONS.map((pos) => (
                    <option key={pos} value={pos} style={optionStyle}>{pos}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="释义 *">
              <input
                type="text"
                value={wordForm.meaning}
                onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                placeholder="如：苹果"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="例句">
              <textarea
                value={wordForm.example}
                onChange={(e) => setWordForm({ ...wordForm, example: e.target.value })}
                placeholder="如：I eat an apple every day."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none resize-none"
                style={inputStyle}
              />
            </Field>
          </div>
        </ItemDialog>
      )}

      {/* 句子弹窗 */}
      {showSentenceDialog && (
        <ItemDialog
          title={editingSentence ? '编辑句子' : '新增句子'}
          onClose={() => setShowSentenceDialog(false)}
          onSubmit={handleSubmitSentence}
          submitting={sentenceSubmitting}
        >
          <div className="space-y-3">
            <Field label="英文句子 *">
              <textarea
                value={sentenceForm.sentence}
                onChange={(e) => setSentenceForm({ ...sentenceForm, sentence: e.target.value })}
                placeholder="如：I have a book."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none resize-none"
                style={inputStyle}
              />
            </Field>
            <Field label="中文翻译 *">
              <input
                type="text"
                value={sentenceForm.translation}
                onChange={(e) => setSentenceForm({ ...sentenceForm, translation: e.target.value })}
                placeholder="如：我有一本书。"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="语法标签">
              <input
                type="text"
                value={sentenceForm.grammarTag}
                onChange={(e) => setSentenceForm({ ...sentenceForm, grammarTag: e.target.value })}
                placeholder="如：一般现在时、主谓宾"
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={inputStyle}
              />
            </Field>
          </div>
        </ItemDialog>
      )}

      {/* 批量导入弹窗 */}
      {showBatchImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowBatchImport(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                批量导入{batchType === 'words' ? '单词' : '句子'}
              </h2>
              <button
                onClick={() => setShowBatchImport(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 导入方式切换 */}
            <div
              className="flex rounded-xl p-1 mb-4"
              style={{ background: '#EEF2FF', border: '1px solid rgba(99, 102, 241, 0.12)' }}
            >
              <button
                onClick={() => setImportMode('paste')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${importMode === 'paste' ? '' : 'opacity-60'}`}
                style={{
                  background: importMode === 'paste'
                    ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                    : 'transparent',
                  color: 'white',
                }}
              >
                <Copy className="w-4 h-4" />
                文本粘贴
              </button>
              <button
                onClick={() => setImportMode('excel')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${importMode === 'excel' ? '' : 'opacity-60'}`}
                style={{
                  background: importMode === 'excel'
                    ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)'
                    : 'transparent',
                  color: 'white',
                }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel 导入
              </button>
            </div>

            {importMode === 'paste' ? (
              <>
                <div
                  className="rounded-xl p-4 text-sm mb-4"
                  style={{ background: '#EEF2FF', border: '1px solid rgba(99, 102, 241, 0.12)' }}
                >
                  <div className="text-gray-300 font-medium mb-2">格式说明：</div>
                  {batchType === 'words' ? (
                    <ul className="space-y-1" style={{ color: '#94A3B8' }}>
                      <li>• 每行一个单词，格式：单词,释义,音标,词性,例句</li>
                      <li>• 支持逗号或 Tab 分隔</li>
                      <li>• 单词和释义为必填，其余字段可选</li>
                      <li>• 示例：<code className="text-violet-300">apple,苹果,/ˈæpl/,n.,I eat an apple.</code></li>
                    </ul>
                  ) : (
                    <ul className="space-y-1" style={{ color: '#94A3B8' }}>
                      <li>• 每行一个句子，格式：英文句子,中文翻译,语法标签</li>
                      <li>• 支持逗号或 Tab 分隔</li>
                      <li>• 英文句子和中文翻译为必填，语法标签可选</li>
                      <li>• 示例：<code className="text-violet-300">I have a book.,我有一本书,一般现在时</code></li>
                    </ul>
                  )}
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={batchType === 'words'
                    ? 'apple,苹果,/ˈæpl/,n.,I eat an apple every day.\nbook,书,/bʊk/,n.,I have a book.'
                    : 'I have a book.,我有一本书,一般现在时\nShe is beautiful.,她很漂亮,主系表'}
                  rows={10}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none placeholder:text-gray-500 resize-none font-mono"
                  style={{
                    background: '#EEF2FF',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                />
              </>
            ) : (
              <>
                <div
                  className="rounded-xl p-4 text-sm mb-4"
                  style={{ background: '#EEF2FF', border: '1px solid rgba(99, 102, 241, 0.12)' }}
                >
                  <div className="text-gray-300 font-medium mb-2">Excel 格式说明：</div>
                  {batchType === 'words' ? (
                    <ul className="space-y-1" style={{ color: '#94A3B8' }}>
                      <li>• 第一行为表头：单词,释义,音标,词性,例句</li>
                      <li>• 从第二行开始为具体数据</li>
                      <li>• 单词和释义为必填列</li>
                      <li>• 支持 .xlsx / .xls / .csv 格式</li>
                    </ul>
                  ) : (
                    <ul className="space-y-1" style={{ color: '#94A3B8' }}>
                      <li>• 第一行为表头：英文句子,中文翻译,语法标签</li>
                      <li>• 从第二行开始为具体数据</li>
                      <li>• 英文句子和中文翻译为必填列</li>
                      <li>• 支持 .xlsx / .xls / .csv 格式</li>
                    </ul>
                  )}
                </div>
                <div
                  className="rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                  style={{
                    background: '#EEF2FF',
                    border: '2px dashed rgba(99, 102, 241, 0.25)',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: '#6366F1' }} />
                  <p className="text-white font-medium mb-1">点击选择文件</p>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    支持 .xlsx / .xls / .csv 格式
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleExcelUpload}
                  />
                </div>
              </>
            )}

            {importMode === 'paste' && (
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowBatchImport(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
                  style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                  取消
                </button>
                <button
                  onClick={handlePasteImport}
                  disabled={importing || !pasteText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  {importing ? '导入中...' : '开始导入'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ Sub-Components ============

const inputStyle: React.CSSProperties = {
  background: '#EEF2FF',
  border: '1px solid rgba(99, 102, 241, 0.2)',
};

const optionStyle: React.CSSProperties = {
  background: '#FFFFFF',
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
        border: active
          ? '1px solid rgba(99, 102, 241, 0.35)'
          : '1px solid transparent',
        color: active ? '#fff' : '#94A3B8',
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};

interface WordListProps {
  words: TextbookWord[];
  loading: boolean;
  onEdit: (word: TextbookWord) => void;
  onDelete: (id: string) => void;
}

const WordList: React.FC<WordListProps> = ({ words, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">加载中...</div>
    );
  }
  if (words.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ background: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      >
        <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: '#6366F1' }} />
        <p className="text-white mb-1">还没有单词</p>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          点击「新增单词」或使用批量导入添加
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {words.map((word, index) => (
        <div
          key={word.id}
          className="group flex items-start gap-4 p-4 rounded-xl transition-all hover:scale-[1.005]"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <span className="text-white font-semibold text-base">{word.word}</span>
              {word.phonetic && (
                <span className="text-sm" style={{ color: '#6366F1' }}>{word.phonetic}</span>
              )}
              {word.partOfSpeech && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818CF8' }}
                >
                  {word.partOfSpeech}
                </span>
              )}
            </div>
            <div className="text-sm" style={{ color: '#94A3B8' }}>{word.meaning}</div>
            {word.example && (
              <div className="text-xs mt-1.5 italic" style={{ color: '#64748B' }}>
                <Languages className="w-3 h-3 inline mr-1" />
                {word.example}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onEdit(word)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="编辑"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(word.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface SentenceListProps {
  sentences: TextbookSentence[];
  loading: boolean;
  onEdit: (s: TextbookSentence) => void;
  onDelete: (id: string) => void;
}

const SentenceList: React.FC<SentenceListProps> = ({ sentences, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">加载中...</div>
    );
  }
  if (sentences.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ background: '#FFFFFF', border: '1px solid rgba(99, 102, 241, 0.2)' }}
      >
        <Type className="w-10 h-10 mx-auto mb-3" style={{ color: '#6366F1' }} />
        <p className="text-white mb-1">还没有句子</p>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          点击「新增句子」或使用批量导入添加
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sentences.map((s, index) => (
        <div
          key={s.id}
          className="group flex items-start gap-4 p-4 rounded-xl transition-all hover:scale-[1.005]"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-base mb-1">{s.sentence}</div>
            <div className="text-sm" style={{ color: '#94A3B8' }}>{s.translation}</div>
            {s.grammarTag && (
              <div className="mt-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34, 211, 238, 0.15)', color: '#06B6D4' }}
                >
                  {s.grammarTag}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={() => onEdit(s)}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="编辑"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onDelete(s.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ItemDialogProps {
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  children: React.ReactNode;
}

const ItemDialog: React.FC<ItemDialogProps> = ({ title, onClose, onSubmit, submitting, children }) => {
  const handleSubmit = async (): Promise<void> => {
    await onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {children}

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
            style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.25)',
            }}
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, children }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
};

export default TextbookEditorPage;
