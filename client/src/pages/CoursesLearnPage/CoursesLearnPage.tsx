import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { coursesApi } from '@client/src/api';
import type { CourseItem } from '@shared/api.interface';

const categoryToPath: Record<string, string> = {
  daily: '/practice/sentence?mode=typing',
  beginner: '/practice/sentence?mode=typing',
  comprehensive: '/practice/sentence?mode=typing',
  business: '/practice/sentence?mode=typing',
  travel: '/practice/sentence?mode=typing',
  exam: '/practice/sentence?mode=typing',
  certification: '/practice/sentence?mode=typing',
  culture: '/practice/sentence?mode=typing',
  preschool: '/phonetics',
  chinese_primary: '/chinese-practice',
  math_primary: '/math-practice',
  other: '/practice/sentence?mode=typing&contentType=word',
};

const CoursesLearnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('课程不存在');
      setLoading(false);
      return;
    }

    const fetchAndRedirect = async (): Promise<void> => {
      try {
        const res = await coursesApi.getCourseDetail(id);
        const course: CourseItem = res.course;
        const target = categoryToPath[course.category];

        if (!target) {
          setError('该分类暂未开放练习');
          setLoading(false);
          return;
        }

        const separator = target.includes('?') ? '&' : '?';
        navigate(`${target}${separator}courseId=${id}`, { replace: true });
      } catch (err) {
        logger.error('加载课程失败', err as Error);
        setError('课程不存在');
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-lg text-gray-700">{error}</p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>
    </div>
  );
};

export default CoursesLearnPage;
