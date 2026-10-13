import React from 'react';
import {
  BookOpen,
  MessageSquare,
  Clock,
  Edit3,
  Trash2,
  Share2,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { AppBadge } from '@client/src/components/ui/app-badges';
import type { AICourse } from '@shared/api.interface';

interface MyCoursesListProps {
  courses: AICourse[];
  loading: boolean;
  getLevelLabel: (lv: string) => string;
  onEdit: (course: AICourse) => void;
  onDelete: (id: string) => void;
  onShare: (course: AICourse) => void;
  onTogglePublish: (course: AICourse) => void;
}

const MyCoursesList: React.FC<MyCoursesListProps> = ({
  courses,
  loading,
  getLevelLabel,
  onEdit,
  onDelete,
  onShare,
  onTogglePublish,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i: number) => (
          <div
            key={i}
            className="rounded-xl border border-white/40 bg-white/60 backdrop-blur-sm p-5 animate-pulse"
          >
            <div className="bg-gray-200 h-28 rounded-lg mb-4" />
            <div className="bg-gray-200 h-5 rounded w-3/4 mb-2" />
            <div className="bg-gray-200 h-3 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/70 rounded-xl shadow-sm border border-white/60 p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
          <UploadCloud className="w-10 h-10 text-purple-300" />
        </div>
        <p className="text-gray-500 font-medium">还没有创作过课程</p>
        <p className="text-sm text-gray-400 mt-1">
          切换到「AI 创作」标签，生成你的第一门定制课程吧
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      data-ai-section-type="card-list"
    >
      {courses.map((course: AICourse) => {
        const wordCount = course.content.words?.length || 0;
        const sentenceCount = course.content.sentences?.length || 0;
        const isPublished = course.status === 'published';

        return (
          <div
            key={course.id}
            className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            {/* 封面 */}
            <div className="h-28 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 p-4 flex items-start justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-2">
                <AppBadge variant="badge3" size={32} />
                <span className="text-xs px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white">
                  {getLevelLabel(course.level)}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-sm relative z-10 ${
                  isPublished
                    ? 'bg-emerald-400/30 text-emerald-50 border border-emerald-300/30'
                    : 'bg-amber-400/30 text-amber-50 border border-amber-300/30'
                }`}
              >
                {isPublished ? '已发布' : '草稿'}
              </span>
            </div>

            {/* 内容 */}
            <div className="p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-1">
                {course.title || course.topic}
              </h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                {course.topic}
              </p>

              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  {wordCount} 词
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  {sentenceCount} 句
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(course)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  继续编辑
                </button>
                <button
                  onClick={() => onTogglePublish(course)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isPublished
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {isPublished ? '取消发布' : '发布'}
                </button>
                <button
                  onClick={() => onShare(course)}
                  className="p-2 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all"
                  title="分享"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(course.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => onEdit(course)}
                className="w-full mt-2 text-xs text-purple-500 hover:text-purple-600 flex items-center justify-center gap-1 py-1"
              >
                查看详情
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyCoursesList;
