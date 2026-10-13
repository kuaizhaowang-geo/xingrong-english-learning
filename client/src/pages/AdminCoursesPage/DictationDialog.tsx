import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import type { DictationItem } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface DictationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  dictation?: DictationItem | null;
  onSaved: () => void;
}

const DictationDialog: React.FC<DictationDialogProps> = ({
  open,
  onOpenChange,
  lessonId,
  dictation,
  onSaved,
}) => {
  const isEdit = !!dictation;

  const [sentence, setSentence] = useState('');
  const [translation, setTranslation] = useState('');
  const [hint, setHint] = useState('');
  const [itemOrder, setItemOrder] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (dictation) {
        setSentence(dictation.sentence);
        setTranslation(dictation.translation);
        setHint(dictation.hint ?? '');
        setItemOrder(String(dictation.itemOrder ?? 0));
      } else {
        setSentence('');
        setTranslation('');
        setHint('');
        setItemOrder('0');
      }
    }
  }, [open, dictation]);

  const handleSubmit = async (): Promise<void> => {
    if (!sentence.trim() || !translation.trim()) {
      return;
    }
    setLoading(true);
    try {
      const data = {
        sentence,
        translation,
        hint: hint || undefined,
        itemOrder: parseInt(itemOrder, 10) || 0,
      };
      if (isEdit && dictation) {
        await adminApi.updateLessonDictation(lessonId, dictation.id, data);
      } else {
        await adminApi.createLessonDictation(lessonId, data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save dictation', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑听写' : '新增听写'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="dictation-sentence">英文句子</Label>
            <Textarea
              id="dictation-sentence"
              value={sentence}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSentence(e.target.value)
              }
              placeholder="请输入听写的英文句子"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictation-translation">中文翻译</Label>
            <Textarea
              id="dictation-translation"
              value={translation}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTranslation(e.target.value)
              }
              placeholder="请输入中文翻译"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictation-hint">提示</Label>
            <Input
              id="dictation-hint"
              value={hint}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setHint(e.target.value)
              }
              placeholder="可选：听写提示词"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dictation-order">排序</Label>
            <Input
              id="dictation-order"
              type="number"
              value={itemOrder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setItemOrder(e.target.value)
              }
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DictationDialog;
