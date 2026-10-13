import React from 'react';
import { Label } from '@client/src/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import type {
  Textbook,
  TextbookUnit,
  AdminCourseItem,
  CourseLesson,
} from '@shared/api.interface';

interface TargetSelectorProps {
  targetMode: 'textbook' | 'course';
  onModeChange: (v: 'textbook' | 'course') => void;
  textbooks: Textbook[];
  textbookId: string;
  onTextbookChange: (v: string) => void;
  units: TextbookUnit[];
  unitId: string;
  onUnitChange: (v: string) => void;
  courses: AdminCourseItem[];
  courseId: string;
  onCourseChange: (v: string) => void;
  lessons: CourseLesson[];
  lessonId: string;
  onLessonChange: (v: string) => void;
  loading: boolean;
}

const TargetSelector: React.FC<TargetSelectorProps> = ({
  targetMode,
  onModeChange,
  textbooks,
  textbookId,
  onTextbookChange,
  units,
  unitId,
  onUnitChange,
  courses,
  courseId,
  onCourseChange,
  lessons,
  lessonId,
  onLessonChange,
  loading,
}) => {
  return (
    <Tabs value={targetMode} onValueChange={(v: string) => onModeChange(v as 'textbook' | 'course')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="textbook">按教材/单元导入</TabsTrigger>
        <TabsTrigger value="course">按课程/课时导入</TabsTrigger>
      </TabsList>

      <TabsContent value="textbook" className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">选择教材</Label>
            <Select value={textbookId} onValueChange={onTextbookChange}>
              <SelectTrigger>
                <SelectValue placeholder="请选择教材" />
              </SelectTrigger>
              <SelectContent>
                {textbooks.map((tb: Textbook) => (
                  <SelectItem key={tb.id} value={tb.id}>
                    {tb.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">选择单元（可选）</Label>
            <Select
              value={unitId}
              onValueChange={onUnitChange}
              disabled={!textbookId || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部单元" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u: TextbookUnit) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="course" className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">选择课程</Label>
            <Select value={courseId} onValueChange={onCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="请选择课程" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c: AdminCourseItem) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">选择课时（可选）</Label>
            <Select
              value={lessonId}
              onValueChange={onLessonChange}
              disabled={!courseId || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="全部课时" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((l: CourseLesson) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default TargetSelector;
