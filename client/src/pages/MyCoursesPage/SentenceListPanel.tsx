import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Save, Volume2 } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Spinner } from '@client/src/components/ui/spinner';
import type { UnitSentence, CreateSentenceDto } from '@client/src/api/user-created-courses';

interface SentenceListPanelProps {
  sentences: UnitSentence[];
  loading: boolean;
  onAdd: (dto: CreateSentenceDto) => Promise<void>;
  onUpdate: (sentence: UnitSentence) => Promise<void>;
  onDelete: (sentence: UnitSentence) => void;
  adding?: boolean;
}

const SentenceListPanel: React.FC<SentenceListPanelProps> = ({
  sentences,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  adding = false,
}) => {
  const [newSentence, setNewSentence] = useState<CreateSentenceDto>({ sentence: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSentences, setLocalSentences] = useState<UnitSentence[]>([]);

  React.useEffect(() => {
    setLocalSentences(sentences);
  }, [sentences]);

  const handleAdd = async (): Promise<void> => {
    if (!newSentence.sentence.trim()) return;
    await onAdd({
      ...newSentence,
      sentence: newSentence.sentence.trim(),
      translation: newSentence.translation?.trim() || undefined,
      grammarTag: newSentence.grammarTag?.trim() || undefined,
    });
    setNewSentence({ sentence: '' });
  };

  const handleFieldChange = (
    sentenceId: string,
    field: keyof UnitSentence,
    value: string,
  ): void => {
    setLocalSentences((prev) =>
      prev.map((s) => (s.id === sentenceId ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = async (sentence: UnitSentence): Promise<void> => {
    await onUpdate(sentence);
    setEditingId(null);
  };

  return (
    <div className="p-4 space-y-3">
      {/* 新增句子行 */}
      <Card className="border border-dashed border-gray-300 bg-gray-50/50">
        <CardContent className="p-3 space-y-2">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6">
              <Input
                placeholder="英文句子 *"
                value={newSentence.sentence}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewSentence({ ...newSentence, sentence: e.target.value })
                }
              />
            </div>
            <div className="col-span-4">
              <Input
                placeholder="中文翻译"
                value={newSentence.translation ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewSentence({ ...newSentence, translation: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newSentence.sentence.trim() || adding}
                className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE] w-full"
              >
                <Plus size={14} />
                添加
              </Button>
            </div>
          </div>
          <Input
            placeholder="语法标签（可选，如：一般现在时、定语从句）"
            value={newSentence.grammarTag ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewSentence({ ...newSentence, grammarTag: e.target.value })
            }
          />
        </CardContent>
      </Card>

      {/* 句子列表 */}
      {loading ? (
        <div className="py-8 flex justify-center items-center gap-2 text-gray-500">
          <Spinner />
          <span>加载中...</span>
        </div>
      ) : localSentences.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          暂无句子，在上方添加或使用批量导入
        </div>
      ) : (
        <div className="space-y-2">
          {localSentences.map((sentence: UnitSentence, idx: number) => {
            const isEditing = editingId === sentence.id;
            return (
              <Card
                key={sentence.id}
                className={`border border-gray-100 transition-colors ${
                  isEditing ? 'ring-2 ring-[#4361EE]/20' : ''
                }`}
              >
                <CardContent className="p-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">英文句子</Label>
                        <Textarea
                          value={sentence.sentence}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            handleFieldChange(sentence.id, 'sentence', e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">中文翻译</Label>
                          <Input
                            value={sentence.translation ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(sentence.id, 'translation', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">语法标签</Label>
                          <Input
                            value={sentence.grammarTag ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleFieldChange(sentence.id, 'grammarTag', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(sentence)}
                          className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]"
                        >
                          <Save size={14} />
                          保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-400 font-mono w-6 flex-shrink-0 pt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-[#1A1A2E] font-medium">
                              {sentence.sentence}
                            </p>
                            {sentence.translation && (
                              <p className="text-sm text-gray-500 mt-1">
                                {sentence.translation}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              {sentence.grammarTag && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {sentence.grammarTag}
                                </Badge>
                              )}
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Volume2 size={12} className="text-[#4361EE]" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingId(sentence.id)}
                            >
                              <Pencil size={12} className="text-[#4361EE]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onDelete(sentence)}
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SentenceListPanel;
