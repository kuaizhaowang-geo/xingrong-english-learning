import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { Label } from '@client/src/components/ui/label';
import type {
  UserCreatedCourse,
  CreateCourseDto,
  UpdateCourseDto,
} from '@client/src/api/user-created-courses';

const SUBJECT_OPTIONS = [
  { value: 'english', label: '英语' },
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
];

const CATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  english: [
    { value: 'basic', label: '零基础入门' },
    { value: 'daily', label: '日常实用' },
    { value: 'comprehensive', label: '综合提升' },
    { value: 'business', label: '职场商务' },
    { value: 'culture', label: '文化兴趣' },
    { value: 'exam', label: '认证备考' },
  ],
  chinese: [
    { value: 'reading', label: '阅读理解' },
    { value: 'writing', label: '写作提升' },
    { value: 'culture', label: '文化常识' },
  ],
  math: [
    { value: 'basic', label: '基础运算' },
    { value: 'thinking', label: '思维训练' },
    { value: 'competition', label: '竞赛拓展' },
  ],
};

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: UserCreatedCourse | null;
  onSaved: () => void | Promise<void>;
  onCreate: (dto: CreateCourseDto) => Promise<UserCreatedCourse>;
  onUpdate: (id: string, dto: UpdateCourseDto) => Promise<UserCreatedCourse>;
}

const CourseDialog: React.FC<CourseDialogProps> = ({
  open,
  onOpenChange,
  course,
  onSaved,
  onCreate,
  onUpdate,
}) => {
  const isEdit = !!course;
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('english');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(course?.name ?? '');
      setSubject(course?.subject ?? 'english');
      setCategory(course?.category ?? '');
      setDescription(course?.description ?? '');
      setCoverImage(course?.coverImage ?? '');
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit && course) {
        await onUpdate(course.id, {
          name: name.trim(),
          subject,
          category: category || undefined,
          description: description.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
        });
      } else {
        await onCreate({
          name: name.trim(),
          subject,
          category: category || undefined,
          description: description.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
        });
      }
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      logger.error('Failed to save course', { error: String(err) });
    } finally {
      setSaving(false);
    }
  };

  const categories = CATEGORY_OPTIONS[subject] ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑课程' : '新建课程'}</DialogTitle>
          <DialogDescription>
            填写课程基本信息，创建后可以在编辑器中添加单元和内容。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">课程名称 <span className="text-red-500">*</span></Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="请输入课程名称"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>学科</Label>
              <Select value={subject} onValueChange={(v: string) => {
                setSubject(v);
                setCategory('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={category}
                onValueChange={(v: string) => setCategory(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">课程描述</Label>
            <Textarea
              id="course-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="请简要介绍这门课程"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-cover">封面图片链接（可选）</Label>
            <Input
              id="course-cover"
              value={coverImage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoverImage(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              <X size={14} />
              取消
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || saving}
              className="bg-[#4361EE] hover:bg-[#3a56d4] border-[#4361EE]"
            >
              {saving ? '保存中...' : isEdit ? '保存修改' : '创建课程'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDialog;
