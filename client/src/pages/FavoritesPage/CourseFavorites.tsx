import React, { useState, useEffect } from 'react';
import { Heart, Users, Play, Compass, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { userCoursesApi } from '@client/src/api';
import type { CourseItem } from '@shared/api.interface';
import type { UserCourse } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

interface CourseFavoritesProps {
  items: CourseItem[];
  onRemove: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  preschool: '学前启蒙',
  beginner: '零基础',
  daily: '日常实用',
  comprehensive: '综合提升',
  business: '职场商务',
  certification: '认证备考',
  culture: '文化兴趣',
  textbook: '教材同步',
  other: '其他',
};

const CourseFavorites: React.FC<CourseFavoritesProps> = ({ items, onRemove }) => {
  const navigate = useNavigate();
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loadingEnroll, setLoadingEnroll] = useState<string | null>(null);

  // 加载用户已加入的课程
  useEffect(() => {
    let cancelled = false;
    const loadMyCourses = async (): Promise<void> => {
      try {
        const result = await userCoursesApi.getMyCourses();
        if (!cancelled) {
          const ids = new Set(result.items.map((uc: UserCourse) => uc.courseId));
          setEnrolledCourseIds(ids);
        }
      } catch (err) {
        const error = err as { response?: { status: number }; message?: string };
        // 401 表示未登录，静默忽略
        if (error.response?.status !== 401) {
          logger.error('加载我的课程失败', error.message || String(err));
        }
      }
    };
    void loadMyCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCardClick = (id: string): void => {
    navigate(`/courses/${id}`);
  };

  const handleRemoveClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ): void => {
    e.stopPropagation();
    onRemove(id);
  };

  const handleJoinClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    courseId: string,
  ): Promise<void> => {
    e.stopPropagation();
    setLoadingEnroll(courseId);
    try {
      await userCoursesApi.enrollCourse(courseId);
      setEnrolledCourseIds((prev) => new Set(prev).add(courseId));
    } catch (err) {
      const error = err as { message?: string };
      logger.error('加入课程失败', error.message || String(err));
    } finally {
      setLoadingEnroll(null);
    }
  };

  // 空状态
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 rounded-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, rgba(26, 22, 53, 0.3) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            background:
              'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          }}
        >
          <Compass className="w-14 h-14" style={{ color: '#6366F1' }} />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: '#F1F5F9' }}
        >
          暂无珍藏课程
        </h3>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          去课程广场探索感兴趣的内容，点亮❤️收入囊中
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Compass className="w-4 h-4" />
          去探索
        </button>
      </div>
    );
  }

  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
      data-ai-section-type="card-list"
    >
      {items.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        const isJoining = loadingEnroll === course.id;
        return (
          <div
            key={course.id}
            onClick={() => handleCardClick(course.id)}
            className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            style={{
              backgroundColor: 'rgba(26, 22, 53, 0.8)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 8px 30px rgba(99, 102, 241, 0.15)';
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(99, 102, 241, 0.35)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 20px rgba(0, 0, 0, 0.3)';
              (e.currentTarget as HTMLDivElement).style.borderColor =
                'rgba(99, 102, 241, 0.15)';
            }}
          >
            {/* 封面区 */}
            <div
              className="relative h-36 flex items-center justify-center overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.3) 50%, rgba(34, 211, 238, 0.2) 100%)',
              }}
            >
              {course.coverImage ? (
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.25)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Play
                      className="w-7 h-7 ml-1"
                      style={{ color: '#fff' }}
                      fill="#fff"
                    />
                  </div>
                </div>
              )}
              {/* 取消珍藏按钮 */}
              <button
                onClick={(e) => handleRemoveClick(e, course.id)}
                className="absolute top-3 right-3 p-2 rounded-full transition-all duration-300 hover:scale-110 z-10"
                style={{
                  backgroundColor: 'rgba(13, 11, 31, 0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
                title="移出珍藏"
              >
                <Heart
                  className="w-4 h-4"
                  style={{ color: '#EF476F', fill: '#EF476F' }}
                />
              </button>
              {/* 价格/免费标签 */}
              <div
                className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: course.isFree
                    ? 'rgba(34, 211, 238, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                  color: course.isFree ? '#06B6D4' : '#C4B5FD',
                  border: `1px solid ${course.isFree ? 'rgba(34, 211, 238, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {course.price}
              </div>
              {/* 已加入徽章 */}
              {isEnrolled && (
                <div
                  className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(46, 196, 182, 0.2)',
                    color: '#2EC4B6',
                    border: '1px solid rgba(46, 196, 182, 0.4)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Check className="w-3 h-3" />
                  已加入
                </div>
              )}
              {/* 分类标签 */}
              <div
                className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md text-xs"
                style={{
                  backgroundColor: 'rgba(13, 11, 31, 0.6)',
                  color: '#94A3B8',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {categoryLabels[course.category] || course.category}
              </div>
            </div>

            {/* 内容区 */}
            <div className="p-5">
              <h3
                className="font-semibold text-base mb-3 line-clamp-1 group-hover:text-violet-300 transition-colors"
                style={{ color: '#F1F5F9' }}
              >
                {course.title}
              </h3>

              {/* 底部信息 */}
              <div className="flex items-center justify-between text-xs mb-4">
                <span style={{ color: '#64748B' }}>
                  共 {course.totalLessons} 课时
                </span>
                <span
                  className="flex items-center gap-1"
                  style={{ color: '#64748B' }}
                >
                  <Users className="w-3.5 h-3.5" />
                  {course.sharedCount.toLocaleString()}人学过
                </span>
              </div>

              {/* 底部按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEnrolled) {
                    navigate(`/courses/${course.id}`);
                  } else {
                    void handleJoinClick(e, course.id);
                  }
                }}
                disabled={isJoining}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isEnrolled
                    ? 'linear-gradient(135deg, rgba(46, 196, 182, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
                  color: isEnrolled ? '#2EC4B6' : '#fff',
                  border: isEnrolled
                    ? '1px solid rgba(46, 196, 182, 0.3)'
                    : '1px solid transparent',
                  boxShadow: isEnrolled
                    ? 'none'
                    : '0 4px 15px rgba(99, 102, 241, 0.2)',
                }}
              >
                {isJoining ? '加入中...' : isEnrolled ? '继续学习' : '加入课程'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseFavorites;
