import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AICourse } from '@shared/api.interface';
import { getAICourses, generateAICourse, deleteAICourse } from '@client/src/api/ai-courses';
import CourseCardGrid from './CourseCardGrid';
import CreateCourseModal from './CreateCourseModal';
import CourseDetail from './CourseDetail';

const AICreatorPage: React.FC = () => {
  const [view, setView] = useState<'home' | 'detail'>('home');
  const [courses, setCourses] = useState<AICourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AICourse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await getAICourses({ page: 1, pageSize: 50 });
      setCourses(result.items ?? []);
    } catch (err) {
      logger.error('获取 AI 课程列表失败', String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  const handleGenerate = async (params: {
    topic: string;
    learningGoal: string;
    level: string;
  }): Promise<void> => {
    if (generating) return;
    try {
      setGenerating(true);
      const newCourse = await generateAICourse({
        topic: params.topic,
        learningGoal: params.learningGoal,
        level: params.level,
      });
      setCourses((prev) => [newCourse, ...prev]);
      setShowCreateModal(false);
      setSelectedCourse(newCourse);
      setView('detail');
    } catch (err) {
      logger.error('AI 课程生成失败', String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenCourse = (course: AICourse): void => {
    setSelectedCourse(course);
    setView('detail');
  };

  const handleBackHome = (): void => {
    setView('home');
    setSelectedCourse(null);
  };

  const handleDeleteCourse = async (id: string): Promise<void> => {
    try {
      await deleteAICourse(id);
      setCourses((prev) => prev.filter((c: AICourse) => c.id !== id));
      if (selectedCourse?.id === id) {
        handleBackHome();
      }
    } catch (err) {
      logger.error('删除 AI 课程失败', String(err));
    }
  };

  if (view === 'detail' && selectedCourse) {
    return (
      <div className="min-h-screen text-white">
        <div className="fixed top-0 left-1/4 w-96 h-96
          rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="fixed top-0 right-1/4 w-96 h-96
          rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto p-6">
          <CourseDetail
            course={selectedCourse}
            onBack={handleBackHome}
            onDelete={handleDeleteCourse}
            onShare={(courseId: string) => logger.info(`分享课程: ${courseId}`)}
            onEdit={(courseId: string) => logger.info(`编辑课程: ${courseId}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="fixed top-0 left-1/4 w-96 h-96
        rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96
        rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto p-6">
        {/* 顶部标题区 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl
              bg-gradient-to-br from-violet-500 to-cyan-500
              flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
               <h1 className="text-2xl font-bold bg-clip-text text-transparent
                 bg-gradient-to-r from-violet-600 to-cyan-600">
                AI 创课坊
              </h1>
              <p className="text-xs text-slate-400">
                AI 智能生成，一键打造专属课程
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-gradient-to-r from-violet-500 to-cyan-500
              text-white font-medium text-sm
              shadow-lg shadow-violet-500/30
              hover:shadow-violet-500/50 hover:scale-[1.02]
              active:scale-[0.98] transition-all duration-300">
            <Plus size={18} />
            创建新课
          </button>
        </div>

        <div className="mb-3">
           <h2 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <span className="w-1 h-4 bg-gradient-to-b from-violet-400 to-cyan-400 rounded-full" />
             我的课程
             <span className="text-xs text-slate-400 ml-1">
              （共 {courses.length} 门）
            </span>
          </h2>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20
              rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
             <Loader2 size={28} className="text-violet-400 animate-spin mb-3" />
             <p className="text-sm text-slate-400">加载中...</p>
          </div>
        ) : (
          <CourseCardGrid
            courses={courses}
            onOpenCourse={handleOpenCourse}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateCourseModal
          generating={generating}
          onClose={() => !generating && setShowCreateModal(false)}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
};

export default AICreatorPage;
