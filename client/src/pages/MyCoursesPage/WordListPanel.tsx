import React, { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Pencil, Trash2, Plus, Save, Volume2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Spinner } from '@client/src/components/ui/spinner';
import { Textarea } from '@client/src/components/ui/textarea';
import ModalShell from '@client/src/pages/SentencePracticePage/PracticeModalShell';
import * as userCourseApi from '@client/src/api/user-created-courses';
import type {
  UnitWord,
  CreateWordDto,
  BatchGenerateResult,
} from '@client/src/api/user-created-courses';

interface WordListPanelProps {
  words: UnitWord[];
  loading: boolean;
  unitId: string;
  onAdd: (dto: CreateWordDto) => Promise<void>;
  onUpdate: (word: UnitWord) => Promise<void>;
  onDelete: (word: UnitWord) => void;
  onRefresh: () => Promise<void>;
  adding?: boolean;
}

const WordListPanel: React.FC<WordListPanelProps> = ({
  words,
  loading,
  unitId,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  adding = false,
}) => {
  const [newWord, setNewWord] = useState<CreateWordDto>({ word: '', meaning: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localWords, setLocalWords] = useState<UnitWord[]>([]);

  // AI 生成
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [aiResult, setAiResult] = useState<BatchGenerateResult | null>(null);

  // 同步外部 words
  React.useEffect(() => {
    setLocalWords(words);
  }, [words]);

  const handleAdd = async (): Promise<void> => {
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    await onAdd({
      ...newWord,
      word: newWord.word.trim(),
      meaning: newWord.meaning.trim(),
      phonetic: newWord.phonetic?.trim() || undefined,
      partOfSpeech: newWord.partOfSpeech?.trim() || undefined,
      example: newWord.example?.trim() || undefined,
    });
    setNewWord({ word: '', meaning: '' });
  };

  const handleFieldChange = (wordId: string, field: keyof UnitWord, value: string): void => {
    setLocalWords((prev) => prev.map((w) => (w.id === wordId ? { ...w, [field]: value } : w)));
  };

  const handleSave = async (word: UnitWord): Promise<void> => {
    await onUpdate(word);
    setEditingId(null);
  };

  // ===== AI 生成单词 =====
  const openAiGenerate = (): void => {
    setAiText('');
    setAiResult(null);
    setAiProgress({ current: 0, total: 0 });
    setAiOpen(true);
  };

  const handleAiGenerate = async (): Promise<void> => {
    if (!aiText.trim() || !unitId) return;

    const wordList = aiText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((w, i, arr) => arr.indexOf(w) === i); // 去重

    if (wordList.length === 0) {
      toast.error('请输入至少一个英文单词');
      return;
    }

    setAiGenerating(true);
    setAiProgress({ current: 0, total: wordList.length });
    setAiResult(null);

    try {
      const result = await userCourseApi.batchGenerateWords(unitId, wordList);
      setAiResult(result);

      if (result.success > 0) {
        await onRefresh();
        toast.success(`成功生成 ${result.success} 个单词`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} 个单词生成失败`);
      }
    } catch (err) {
      logger.error('AI generate words failed', { error: String(err) });
      toast.error('生成失败，请稍后重试');
    } finally {
      setAiGenerating(false);
      setAiProgress({ current: wordList.length, total: wordList.length });
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 {words.length} 个单词
        </div>
        <Button
          size="sm"
          onClick={openAiGenerate}
          className="bg-gradient-to-r from-[#6366F1] to-[#2563EB] hover:opacity-90 text-white border-0"
        >
          <Sparkles size={14} />
          AI 生成
        </Button>
      </div>

      {/* 新增单词行 */}
      <Card className="border border-dashed border-gray-300 bg-gray-50/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-3">
              <Input
                placeholder="单词 *"
                value={newWord.word}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewWord({ ...newWord, word: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Input
                placeholder="音标"
                value={newWord.phonetic ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewWord({ ...newWord, phonetic: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Input
                placeholder="词性"
                value={newWord.partOfSpeech ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewWord({ ...newWord, partOfSpeech: e.target.value })
                }
              />
            </div>
            <div className="col-span-3">
              <Input
                placeholder="释义 *"
                value={newWord.meaning}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewWord({ ...newWord, meaning: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newWord.word.trim() || !newWord.meaning.trim() || adding}
                className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE] w-full"
              >
                <Plus size={14} />
                添加
              </Button>
            </div>
            <div className="col-span-12">
              <Input
                placeholder="例句（可选）"
                value={newWord.example ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewWord({ ...newWord, example: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 单词列表 */}
      {loading ? (
        <div className="py-8 flex justify-center items-center gap-2 text-gray-500">
          <Spinner />
          <span>加载中...</span>
        </div>
      ) : localWords.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          暂无单词，在上方添加或使用 AI 生成
        </div>
      ) : (
        <div className="space-y-2">
          {localWords.map((word: UnitWord, idx: number) => {
            const isEditing = editingId === word.id;
            return (
              <Card
                key={word.id}
                className={`border border-gray-100 transition-colors ${
                  isEditing ? 'ring-2 ring-[#4361EE]/20' : ''
                }`}
              >
                <CardContent className="p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <Label className="text-xs text-gray-500">单词</Label>
                          <Input
                            value={word.word}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(word.id, 'word', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">音标</Label>
                          <Input
                            value={word.phonetic ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(word.id, 'phonetic', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">词性</Label>
                          <Input
                            value={word.partOfSpeech ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(word.id, 'partOfSpeech', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs text-gray-500">释义</Label>
                          <Input
                            value={word.meaning}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(word.id, 'meaning', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2 flex items-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSave(word)}
                            className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE] flex-1"
                          >
                            <Save size={14} />
                            保存
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                            取消
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">例句</Label>
                        <Input
                          value={word.example ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleFieldChange(word.id, 'example', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-400 font-mono w-6 flex-shrink-0 pt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#1A1A2E]">
                            {word.word}
                          </span>
                          {word.phonetic && (
                            <span className="text-sm text-gray-500 font-mono">
                              /{word.phonetic}/
                            </span>
                          )}
                          {word.partOfSpeech && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {word.partOfSpeech}
                            </Badge>
                          )}
                          <span className="text-sm text-gray-600">
                            {word.meaning}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => setEditingId(word.id)}
                          >
                            <Pencil size={12} className="text-[#4361EE]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onDelete(word)}
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </Button>
                        </div>
                        {word.example && (
                          <div className="mt-1.5 text-sm text-gray-500 pl-1">
                            <span className="text-gray-400">例：</span>
                            {word.example}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI 生成弹窗 */}
      <ModalShell
        open={aiOpen}
        onClose={() => !aiGenerating && setAiOpen(false)}
        title="AI 生成单词内容"
        widthClass="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-[#94A3B8] mb-2 block">
              每行输入一个英文单词，AI 将自动生成音标、词性、释义和例句
            </Label>
            <Textarea
              value={aiText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAiText(e.target.value)
              }
              placeholder={
                'apple\nbanana\nbeautiful\nknowledge\nchallenge'
              }
              rows={8}
              className="bg-[#F8FAFC] border-[rgba(124_58_237_0.3)] text-[#1E293B] placeholder:text-[#64748B] font-mono text-sm resize-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
              disabled={aiGenerating}
            />
          </div>

          {/* 进度 */}
          {aiGenerating && (
              <div className="flex items-center justify-between text-sm text-[#94A3B8]">
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4 border-[#6366F1] border-t-transparent" />
                  AI 正在生成中...
                </span>
                <span className="font-mono text-[#06B6D4]">
                  {aiProgress.current} / {aiProgress.total}
                </span>
              </div>
          )}

          {/* 结果 */}
          {aiResult && !aiGenerating && (
            <div className={`p-3 rounded-lg text-sm border ${
              aiResult.failed === 0
                ? 'bg-[rgba(34_211_238_0.1)] text-[#06B6D4] border-[rgba(34_211_238_0.3)]'
                : 'bg-[rgba(251_191_36_0.1)] text-[#FBBF24] border-[rgba(251_191_36_0.3)]'
            }`}>
              <div className="font-medium mb-1.5">
                生成完成：成功 {aiResult.success} 个，失败 {aiResult.failed} 个
                （共 {aiResult.total} 个）
              </div>
              {aiResult.errors.length > 0 && (
                <div className="space-y-0.5 text-xs max-h-32 overflow-y-auto">
                  {aiResult.errors.map((err, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#F87171] flex-shrink-0">×</span>
                      <span className="font-mono">{err.word}</span>
                      <span className="text-[#94A3B8]">— {err.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAiOpen(false)}
              disabled={aiGenerating}
              className="text-[#94A3B8] hover:text-[#1E293B] hover:bg-[rgba(124_58_237_0.2)]"
            >
              {aiResult ? '关闭' : '取消'}
            </Button>
            <Button
              onClick={handleAiGenerate}
              disabled={!aiText.trim() || aiGenerating}
              className="bg-gradient-to-r from-[#6366F1] to-[#2563EB] hover:opacity-90 text-white border-0"
            >
              {aiGenerating ? (
                <>
                  <Spinner className="w-4 h-4 border-white border-t-transparent" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  开始生成
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};

export default WordListPanel;
