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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@client/src/components/ui/select';
import { Switch } from '@client/src/components/ui/switch';
import {
  COURSE_CATEGORIES,
  type AdminCourseItem,
  type AdminUser,
} from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: AdminCourseItem | null;
  currentAdmin?: AdminUser | null;
  onSaved: (createdCourseId?: string) => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: '入门' },
  { value: 'elementary', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

const SUBJECT_OPTIONS = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
];

const CourseDialog: React.FC<CourseDialogProps> = ({
  open,
  onOpenChange,
  course,
  currentAdmin,
  onSaved,
}) => {
  const isEdit = !!course;
  const isEditor = currentAdmin?.role === 'editor';
  const defaultSubject = currentAdmin?.subject ?? 'english';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('beginner');
  const [subject, setSubject] = useState('english');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [level, setLevel] = useState('beginner');
  const [price, setPrice] = useState('0');
  const [isFree, setIsFree] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (course) {
        setTitle(course.title);
        setCategory(course.category);
        setSubject(course.subject);
        setGrade(course.grade ?? '');
        setLevel(course.category);
        setDescription(
          (course as unknown as { description?: string }).description ?? '',
        );
        setCoverImage(course.coverImage ?? '');
        setPrice(
          String((course as unknown as { price?: string | number }).price ?? 0),
        );
        setIsFree(
          (course as unknown as { isFree?: boolean }).isFree ?? true,
        );
      } else {
        setTitle('');
        setCategory('beginner');
        setSubject(defaultSubject);
        setGrade('');
        setDescription('');
        setCoverImage('');
        setLevel('beginner');
        setPrice('0');
         setIsFree(true);
       }
     }
   }, [open, course, defaultSubject]);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) {
      return;
    }
    setLoading(true);
    try {
      const data = {
        title,
        category,
        subject,
        grade: grade || undefined,
        description,
        coverImage,
        level,
        price,
        isFree,
      };
       if (isEdit && course) {
         await adminApi.updateCourse(course.id, data);
         onSaved();
       } else {
          const result = await adminApi.createCourse(data);
          const createdId = (result as { id?: string }).id;
          onSaved(createdId);
       }
       onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save course', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑课程' : '新增课程'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="course-title">课程标题</Label>
            <Input
              id="course-title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              placeholder="请输入课程标题"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>学科</Label>
              <Select
                value={subject}
                onValueChange={setSubject}
                disabled={isEditor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择学科" />
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
              <Label htmlFor="course-grade">年级</Label>
              <Input
                id="course-grade"
                value={grade}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGrade(e.target.value)
                }
                placeholder="如：三年级"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>分类</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.filter(
                    (c) => c.value !== 'all',
                  ).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>难度等级</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择难度" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-desc">简介</Label>
            <Textarea
              id="course-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="请输入课程简介"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-cover">封面图 URL</Label>
            <Input
              id="course-cover"
              value={coverImage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCoverImage(e.target.value)
              }
              placeholder="请输入封面图 URL"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-price">价格（元）</Label>
              <Input
                id="course-price"
                value={price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPrice(e.target.value)
                }
                disabled={isFree}
                type="number"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>是否免费</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch checked={isFree} onCheckedChange={setIsFree} />
                <span className="text-sm text-gray-600">
                  {isFree ? '免费课程' : '付费课程'}
                </span>
              </div>
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

export default CourseDialog;
