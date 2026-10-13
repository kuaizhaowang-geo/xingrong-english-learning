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
import type { WordItem } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface WordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  word?: WordItem | null;
  onSaved: () => void;
  lessonId?: string;
}

const WordDialog: React.FC<WordDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  word,
  onSaved,
  lessonId,
}) => {
  const isEdit = !!word;

  const [wordText, setWordText] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [meaning, setMeaning] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [wordOrder, setWordOrder] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (word) {
        setWordText(word.word);
        setPhonetic(word.phonetic ?? '');
        setPartOfSpeech(word.partOfSpeech ?? '');
        setMeaning(word.meaning);
        setExampleSentence(word.exampleSentence ?? '');
        setExampleTranslation(word.exampleTranslation ?? '');
        setWordOrder(String(word.wordOrder ?? 0));
      } else {
        setWordText('');
        setPhonetic('');
        setPartOfSpeech('');
        setMeaning('');
        setExampleSentence('');
        setExampleTranslation('');
        setWordOrder('0');
      }
    }
  }, [open, word]);

  const handleSubmit = async (): Promise<void> => {
    if (!wordText.trim() || !meaning.trim()) {
      return;
    }
    setLoading(true);
    try {
      const data = {
        word: wordText.trim(),
        phonetic: phonetic || undefined,
        partOfSpeech: partOfSpeech || undefined,
        meaning: meaning.trim(),
        exampleSentence: exampleSentence || undefined,
        exampleTranslation: exampleTranslation || undefined,
        wordOrder: parseInt(wordOrder, 10) || 0,
        tags: lessonId && !isEdit
          ? [`lesson:${lessonId}`]
          : undefined,
      };
      if (isEdit && word) {
        await adminApi.updateCourseWord(courseId, word.id, data);
      } else {
        await adminApi.createCourseWord(courseId, data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save word', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑单词' : '新增单词'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word-text">单词</Label>
              <Input
                id="word-text"
                value={wordText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWordText(e.target.value)
                }
                placeholder="请输入单词"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="word-phonetic">音标</Label>
              <Input
                id="word-phonetic"
                value={phonetic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhonetic(e.target.value)
                }
                placeholder="可选，如 /ˈæpl/"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="word-pos">词性</Label>
              <Input
                id="word-pos"
                value={partOfSpeech}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPartOfSpeech(e.target.value)
                }
                placeholder="可选，如 n. / v. / adj."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="word-order">排序</Label>
              <Input
                id="word-order"
                type="number"
                value={wordOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWordOrder(e.target.value)
                }
                min="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="word-meaning">释义</Label>
            <Textarea
              id="word-meaning"
              value={meaning}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMeaning(e.target.value)
              }
              placeholder="请输入中文释义"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="word-example">例句</Label>
            <Textarea
              id="word-example"
              value={exampleSentence}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setExampleSentence(e.target.value)
              }
              placeholder="可选：英文例句"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="word-example-trans">例句翻译</Label>
            <Input
              id="word-example-trans"
              value={exampleTranslation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setExampleTranslation(e.target.value)
              }
              placeholder="可选：例句中文翻译"
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

export default WordDialog;
