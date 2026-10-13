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
import type { TextbookUnit } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface UnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  textbookId: string;
  unit?: TextbookUnit | null;
  onSaved: () => void;
}

const UnitDialog: React.FC<UnitDialogProps> = ({
  open,
  onOpenChange,
  textbookId,
  unit,
  onSaved,
}) => {
  const isEdit = !!unit;
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [unitOrder, setUnitOrder] = useState('1');
  const [keyWordsStr, setKeyWordsStr] = useState('');
  const [keySentencesStr, setKeySentencesStr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (unit) {
        setTitle(unit.title);
        setTopic(unit.topic ?? '');
        setUnitOrder(String(unit.unitOrder));
        setKeyWordsStr(unit.keyWords.join(', '));
        setKeySentencesStr(unit.keySentences.join('\n'));
      } else {
        setTitle('');
        setTopic('');
        setUnitOrder('1');
        setKeyWordsStr('');
        setKeySentencesStr('');
      }
    }
  }, [open, unit]);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const keyWords = keyWordsStr
        .split(',')
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      const keySentences = keySentencesStr
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const data = {
        title,
        topic,
        unitOrder: Number(unitOrder),
        keyWords,
        keySentences,
      };
      if (isEdit && unit) {
        await adminApi.updateUnit(unit.id, data);
      } else {
        await adminApi.createUnit(textbookId, data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save unit', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑单元' : '新增单元'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="unit-title">单元标题</Label>
            <Input
              id="unit-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="如：Unit 1 Hello!"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit-topic">主题</Label>
              <Input
                id="unit-topic"
                value={topic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTopic(e.target.value)
                }
                placeholder="单元主题"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-order">排序</Label>
              <Input
                id="unit-order"
                type="number"
                min="1"
                value={unitOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUnitOrder(e.target.value)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-words">关键字（英文逗号分隔）</Label>
            <Textarea
              id="unit-words"
              value={keyWordsStr}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setKeyWordsStr(e.target.value)
              }
              placeholder="hello, world, welcome"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit-sentences">关键句子（每行一句）</Label>
            <Textarea
              id="unit-sentences"
              value={keySentencesStr}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setKeySentencesStr(e.target.value)
              }
              placeholder="Hello, how are you?&#10;I'm fine, thank you."
              rows={4}
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

export default UnitDialog;
