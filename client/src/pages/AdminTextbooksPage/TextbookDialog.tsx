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
import { Switch } from '@client/src/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import type { TextbookTreeItem } from '@shared/api.interface';

interface TextbookDialogItem extends TextbookTreeItem {
  isPublished?: boolean;
}
import * as adminApi from '@client/src/api/admin';

const SUBJECT_OPTIONS = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
  value: `grade${n}`,
  label: `${n}年级`,
}));

const SEMESTER_OPTIONS = [
  { value: 'upper', label: '上册' },
  { value: 'lower', label: '下册' },
];

interface TextbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  textbook?: TextbookDialogItem | null;
  defaultSubject?: string;
  onSaved: () => void;
}

const TextbookDialog: React.FC<TextbookDialogProps> = ({
  open,
  onOpenChange,
  textbook,
  defaultSubject = 'chinese',
  onSaved,
}) => {
  const isEdit = !!textbook;
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [grade, setGrade] = useState('grade1');
  const [semester, setSemester] = useState('upper');
  const [subject, setSubject] = useState(defaultSubject);
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (textbook) {
        setTitle(textbook.title);
        setPublisher(textbook.publisher);
        setGrade(textbook.grade);
        setSemester(textbook.semester);
        setSubject(
          SUBJECT_OPTIONS.some((s) => s.value === textbook.subject)
            ? textbook.subject
            : defaultSubject,
        );
        setCoverImage(textbook.coverImage ?? '');
        setDescription(textbook.description ?? '');
        setSortOrder(String(textbook.sortOrder));
        setIsPublished(textbook.isPublished);
      } else {
        setTitle('');
        setPublisher('');
        setGrade('grade1');
        setSemester('upper');
        setSubject(defaultSubject);
        setCoverImage('');
        setDescription('');
        setSortOrder('1');
        setIsPublished(false);
      }
    }
  }, [open, textbook, defaultSubject]);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const data = {
        title,
        publisher,
        grade,
        semester,
        subject,
        coverImage,
        description,
        sortOrder: Number(sortOrder),
        isPublished,
      };
      if (isEdit && textbook) {
        await adminApi.updateTextbook(textbook.id, data);
      } else {
        await adminApi.createTextbook(data);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save textbook', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑教材' : '新增教材'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="tb-title">教材名称</Label>
            <Input
              id="tb-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="请输入教材名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>学科</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>版本</Label>
              <Input
                value={publisher}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPublisher(e.target.value)
                }
                placeholder="如：人教版PEP"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>年级</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>学期</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTER_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tb-sort">排序</Label>
              <Input
                id="tb-sort"
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSortOrder(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>是否发布</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <span className="text-sm text-gray-600">
                  {isPublished ? '已发布' : '未发布'}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tb-cover">封面图 URL</Label>
            <Input
              id="tb-cover"
              value={coverImage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCoverImage(e.target.value)
              }
              placeholder="请输入封面图 URL"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tb-desc">简介</Label>
            <Textarea
              id="tb-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="请输入教材简介"
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

export default TextbookDialog;
