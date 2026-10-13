import React, { useState } from 'react';
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import type { CourseLesson } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

const CONTENT_TYPES = [
  { value: 'sentence', label: '句子' },
  { value: 'word', label: '单词' },
  { value: 'dictation', label: '听写' },
  { value: 'mixed', label: '混合' },
];

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lesson?: CourseLesson | null;
  onSaved: () => void;
}

const LessonDialog: React.FC<LessonDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  lesson,
  onSaved,
}) => {
  const isEdit = !!lesson;
  const [title, setTitle] = useState('');
  const [lessonOrder, setLessonOrder] = useState('1');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [contentType, setContentType] = useState('sentence');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      if (lesson) {
        setTitle(lesson.title);
        setLessonOrder(String(lesson.lessonOrder));
        setDurationMinutes(String(lesson.durationMinutes));
        setContentType(lesson.contentType);
        setDescription(lesson.description ?? '');
      } else {
        setTitle('');
        setLessonOrder('1');
        setDurationMinutes('10');
        setContentType('sentence');
        setDescription('');
      }
    }
  }, [open, lesson]);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const data = {
        title,
        lessonOrder: Number(lessonOrder),
        durationMinutes: Number(durationMinutes),
        contentType,
        description,
      };
      if (isEdit && lesson) {
        await adminApi.updateLesson(lesson.id, data);
      } else {
        await adminApi.createLesson(courseId, data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save lesson', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑课时' : '新增课时'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">课时标题</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="请输入课时标题"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-order">排序</Label>
              <Input
                id="lesson-order"
                type="number"
                min="1"
                value={lessonOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLessonOrder(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-duration">时长（分钟）</Label>
              <Input
                id="lesson-duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDurationMinutes(e.target.value)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>内容类型</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择内容类型" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-desc">简介</Label>
            <Textarea
              id="lesson-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="请输入课时简介"
              rows={3}
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

export default LessonDialog;
