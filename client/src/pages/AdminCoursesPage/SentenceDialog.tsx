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
import type { AdminSentenceItem } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface SentenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  sentence?: AdminSentenceItem | null;
  onSaved: () => void;
}

const SentenceDialog: React.FC<SentenceDialogProps> = ({
  open,
  onOpenChange,
  lessonId,
  sentence,
  onSaved,
}) => {
  const isEdit = !!sentence;

  const [sentenceText, setSentenceText] = useState('');
  const [translation, setTranslation] = useState('');
  const [sentenceAnalysis, setSentenceAnalysis] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [puzzleOrder, setPuzzleOrder] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (sentence) {
        setSentenceText(sentence.sentence);
        setTranslation(sentence.translation);
        setSentenceAnalysis(sentence.sentenceAnalysis ?? '');
        setImageUrl(sentence.imageUrl ?? '');
        setPuzzleOrder(String(sentence.puzzleOrder ?? 0));
      } else {
        setSentenceText('');
        setTranslation('');
        setSentenceAnalysis('');
        setImageUrl('');
        setPuzzleOrder('0');
      }
    }
  }, [open, sentence]);

  const handleSubmit = async (): Promise<void> => {
    if (!sentenceText.trim() || !translation.trim()) {
      return;
    }
    setLoading(true);
    try {
      const data = {
        sentence: sentenceText,
        translation,
        sentenceAnalysis: sentenceAnalysis || undefined,
        imageUrl: imageUrl || undefined,
        puzzleOrder: parseInt(puzzleOrder, 10) || 0,
      };
      if (isEdit && sentence) {
        await adminApi.updateLessonSentence(lessonId, sentence.id, data);
      } else {
        await adminApi.createLessonSentence(lessonId, data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save sentence', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑句子' : '新增句子'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="sentence-text">英文句子</Label>
            <Textarea
              id="sentence-text"
              value={sentenceText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSentenceText(e.target.value)
              }
              placeholder="请输入英文句子"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sentence-translation">中文翻译</Label>
            <Textarea
              id="sentence-translation"
              value={translation}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTranslation(e.target.value)
              }
              placeholder="请输入中文翻译"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sentence-analysis">句子解析</Label>
            <Textarea
              id="sentence-analysis"
              value={sentenceAnalysis}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSentenceAnalysis(e.target.value)
              }
              placeholder="可选：句子语法解析"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sentence-image">配图 URL</Label>
              <Input
                id="sentence-image"
                value={imageUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setImageUrl(e.target.value)
                }
                placeholder="可选"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sentence-order">排序</Label>
              <Input
                id="sentence-order"
                type="number"
                value={puzzleOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPuzzleOrder(e.target.value)
                }
                min="0"
              />
            </div>
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

export default SentenceDialog;
