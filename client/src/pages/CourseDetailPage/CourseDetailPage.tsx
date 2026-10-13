import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Users,
  Play,
  Tag,
  CheckCircle,
  Loader2,
  Plus,
  X,
  CreditCard,
  CheckCircle2,
  Heart,
  MoreHorizontal,
  Trash2,
  Flame,
  Zap,
  Calendar,
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { coursesApi, userCoursesApi, courseFavoritesApi } from '@client/src/api';
import type { CourseItem, CourseLesson, UserCourse } from '@shared/api.interface';
import { COURSE_CATEGORIES } from '@shared/api.interface';
import { AppBadge } from '@client/src/components/ui/app-badges';
import { Image } from '@client/src/components/ui/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';

const categoryGradients: Record<string, string> = {
  preschool: 'from-pink-400 to-rose-500',
  beginner: 'from-green-400 to-teal-500',
  daily: 'from-blue-400 to-indigo-500',
  comprehensive: 'from-purple-400 to-pink-500',
  business: 'from-gray-700 to-gray-900',
  travel: 'from-cyan-400 to-blue-500',
  exam: 'from-red-400 to-rose-500',
  certification: 'from-yellow-400 to-orange-500',
  culture: 'from-pink-400 to-rose-500',
  other: 'from-gray-400 to-gray-600',
};

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [payStatus, setPayStatus] = useState<'idle' | 'paying' | 'success'>('idle');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userCourse, setUserCourse] = useState<UserCourse | null>(null);

  const isValidUuid = (value: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  };

  useEffect(() => {
    if (!id) return;
    // 无效 UUID 不发起请求，直接标记课程不存在
    if (!isValidUuid(id)) {
      setCourse(null);
      setLessons([]);
      setIsEnrolled(false);
      setLoading(false);
      return;
    }
    const fetchDetail = async (): Promise<void> => {
      try {
        const res = await coursesApi.getCourseDetail(id);
        setCourse(res.course);
        setLessons(res.lessons);
      } catch (err) {
        logger.error('加载课程详情失败', err as Error);
        sonnerToast.error('加载失败，请返回重试');
      } finally {
        setLoading(false);
      }
    };
    const fetchEnrollStatus = async (): Promise<void> => {
      if (!id || !isValidUuid(id)) return;
      try {
        const res = await userCoursesApi.getCourseProgress(id);
        setIsEnrolled(res.isEnrolled);
        if (res.userCourse) {
          setUserCourse(res.userCourse);
        }
        // 如果已加入且接口返回了进度数据，刷新课时列表（带进度信息）
        if (res.isEnrolled && res.lessons.length > 0) {
          setLessons(res.lessons as CourseLesson[]);
        }
      } catch {
        setIsEnrolled(false);
      }
    };
    fetchDetail();
    fetchEnrollStatus();
    const fetchFavoriteStatus = async (): Promise<void> => {
      if (!id || !isValidUuid(id)) return;
      try {
        const res = await courseFavoritesApi.checkFavorite(id);
        setIsFavorite(res.isFavorite);
      } catch {
        setIsFavorite(false);
      }
    };
    fetchFavoriteStatus();
  }, [id]);

  const showToast = (msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // 单元状态类型
  type LessonStatus = 'completed' | 'recent' | 'pending' | 'not_started';

  const getLessonStatus = (lesson: CourseLesson & { progress?: { status: string; completedAt?: string } }): LessonStatus => {
    if (!isEnrolled) return 'not_started';
    const status = lesson.progress?.status;
    if (status === 'completed') {
      // 判断是否为最近完成（24小时内）
      if (lesson.progress?.completedAt) {
        const completedAt = new Date(lesson.progress.completedAt).getTime();
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (completedAt > oneDayAgo) return 'recent';
      }
      return 'completed';
    }
    if (status === 'in_progress') return 'recent';
    return 'pending';
  };

  const statusConfig: Record<LessonStatus, { label: string; className: string; icon?: React.ReactNode }> = {
    completed: {
      label: '已完成练习',
      className: 'bg-green-50 text-green-600 border-green-200',
    },
    recent: {
      label: '最近练习',
      className: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    pending: {
      label: '待完成练习',
      className: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    not_started: {
      label: '暂未练习',
      className: 'bg-gray-50 text-gray-500 border-gray-200',
    },
  };

  // 获取每单元的学习时长和完成次数（来自真实进度数据）
  const getLessonProgressData = (lesson: CourseLesson & { progress?: { studyMinutes?: number; status?: string; completedCount?: number } }) => {
    const studyMinutes = lesson.progress?.studyMinutes ?? 0;
    const completionCount = lesson.progress?.status === 'completed' ? 1 : 0;
    return { practiceMinutes: studyMinutes, completionCount };
  };

  // 生成英文标题（简单翻译/拼音占位）
  const getLessonEnTitle = (title: string, idx: number): string => {
    // 简单的英文占位映射，按序号生成
    const enTitles = [
      'Greetings and Farewells',
      'Introductions',
      'Numbers and Counting',
      'Colors and Shapes',
      'Daily Routines',
      'Food and Drinks',
      'Family Members',
      'Weather and Seasons',
      'Hobbies and Interests',
      'Travel and Places',
      'School and Learning',
      'Shopping and Money',
    ];
    return enTitles[idx % enTitles.length];
  };

  const handleDeleteCourse = (): void => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setDeleteDialogOpen(false);
      sonnerToast.success('已从我的课程中删除');
      setTimeout(() => navigate(-1), 500);
    }, 800);
  };

  const handleToggleFavorite = async (): Promise<void> => {
    if (!id || favLoading) return;
    setFavLoading(true);
    const wasFav = isFavorite;
        setIsFavorite(!wasFav);
    try {
      if (wasFav) {
        await courseFavoritesApi.removeFavorite(id);
        sonnerToast.success('已取消收藏');
      } else {
        await courseFavoritesApi.addFavorite(id);
        sonnerToast.success('已收藏');
      }
    } catch (err) {
      logger.error('切换收藏状态失败', err as Error);
      setIsFavorite(wasFav);
      sonnerToast.error('操作失败，请稍后再试');
    } finally {
      setFavLoading(false);
    }
  };

  const handleEnroll = async (): Promise<void> => {
    if (!id || enrolling) return;
    setEnrolling(true);
    try {
      await userCoursesApi.enrollCourse(id);
      setIsEnrolled(true);
      sonnerToast.success('加入成功！开始学习吧 🎉');
    } catch (err) {
      logger.error('加入课程失败', err as Error);
      sonnerToast.error('加入失败，请稍后再试');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = (): void => {
    if (!id) return;
    if (!isEnrolled) {
      if (course && !course.isFree) {
        setPayStatus('idle');
        setPayDialogOpen(true);
      } else {
        handleEnroll();
      }
      return;
    }
    navigate(`/courses/${id}/learn`);
  };

  const handleLessonStart = (lesson: CourseLesson): void => {
    if (!id) return;
    if (!isEnrolled) {
      if (course && !course.isFree) {
        setPayStatus('idle');
        setPayDialogOpen(true);
      } else {
        handleEnroll();
      }
      return;
    }
    const contentType = lesson.contentType === 'words' ? 'word' : 'sentence';
    navigate(`/practice/sentence?mode=typing&contentType=${contentType}&courseId=${id}&lessonId=${lesson.lessonOrder}`);
  };

  const handleConfirmPay = (): void => {
    if (payStatus !== 'idle') return;
    setPayStatus('paying');
    setTimeout(() => {
      setPayStatus('success');
      setTimeout(() => {
        setPayDialogOpen(false);
        handleEnroll();
      }, 800);
    }, 1500);
  };

  const getGradient = (category: string): string => {
    return categoryGradients[category] || categoryGradients.other;
  };

  const formatMinutes = (min: number): string => {
    if (min < 60) return `${min}分钟`;
    const hours = Math.floor(min / 60);
    const mins = min % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">课程不存在</p>
        <button
          onClick={() => navigate('/courses')}
          className="mt-4 text-orange-500 hover:text-orange-600"
        >
          返回课程广场
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white rounded-full shadow-lg text-sm">
          {toast}
        </div>
      )}

      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
      >
        <ArrowLeft size={16} />
        返回课程广场
      </button>

      <div className="glass-card overflow-hidden">
        <div
          className={`relative h-56 bg-gradient-to-br ${getGradient(course.category)} flex items-center justify-center overflow-hidden`}
        >
          {course.coverImage ? (
            <Image
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <AppBadge variant="badge1" size={96} />
          )}
          <span className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-sm rounded-full">
            <AppBadge variant="badge2" size={20} rounded />
            {course.level}
          </span>
          {course.isFree && (
            <span className="absolute top-5 right-5 px-3 py-1 bg-white/25 backdrop-blur-sm text-white text-sm rounded-full font-medium">
              免费课程
            </span>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white flex-1">{course.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0 relative">
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-70"
                aria-label={isFavorite ? '取消收藏' : '收藏'}
              >
                {favLoading ? (
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                ) : (
                  <Heart
                    size={20}
                    className={
                      isFavorite
                        ? 'fill-pink-400 text-pink-400'
                        : 'text-slate-400'
                    }
                  />
                )}
              </button>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="更多操作"
              >
                <MoreHorizontal size={20} className="text-slate-400" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-44 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-lg border border-fuchsia-500/20 py-2 z-20">
                    {isEnrolled && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setDeleteDialogOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-pink-400 hover:bg-pink-500/10 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        删除课程
                      </button>
                    )}
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                    >
                      <Tag size={16} />
                      分享课程
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {course.subtitle && (
            <p className="text-slate-300 mb-4">{course.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-orange-500/10 text-orange-300 text-sm rounded-full font-medium border border-orange-500/20">
              {COURSE_CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
            </span>
            <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 text-blue-300 text-sm rounded-full font-medium border border-blue-500/20">
              {course.level}
            </span>
          </div>
           <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mb-4">
               <div className="flex items-center gap-1.5">
                 <Clock size={16} className="text-slate-500" />
                 <span>共 {course.totalLessons} 课时 · {formatMinutes(course.totalMinutes)}</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <Users size={16} className="text-slate-500" />
                 <span>{course.sharedCount} 人已加入</span>
               </div>
             </div>
           {isEnrolled && (
             <div className="flex flex-wrap items-center gap-4 text-sm mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
               <div className="flex items-center gap-1.5 text-orange-300">
                 <Flame size={16} />
                 <span>{
                   userCourse && userCourse.totalStudyMinutes > 0
                     ? `学习 ${userCourse.totalStudyMinutes} 分钟`
                     : '尚未开始学习'
                 }</span>
               </div>
               <div className="flex items-center gap-1.5 text-slate-400">
                 <Calendar size={16} className="text-slate-500" />
                 <span>{
                   userCourse?.lastStudyAt
                     ? `最近学习：${new Date(userCourse.lastStudyAt).toLocaleDateString('zh-CN')}`
                     : '最近学习：暂无记录'
                 }</span>
               </div>
             </div>
           )}
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-orange-500">
              {course.isFree ? '免费' : course.price}
            </span>
            {!course.isFree && course.originalPrice && (
              <span className="text-gray-400 line-through text-sm">
                {course.originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>

      {course.tags.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 text-slate-300 text-sm rounded-full border border-white/10"
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold mb-3 text-white">课程简介</h2>
        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
          {course.description || '暂无课程简介'}
        </p>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-lg font-semibold mb-4 text-white">
          课时目录
          <span className="ml-2 text-sm font-normal text-slate-400">
            共 {lessons.length} 课时
          </span>
        </h2>
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
             const status = getLessonStatus(lesson);
            const statusInfo = statusConfig[status];
             const { practiceMinutes, completionCount } = getLessonProgressData(lesson);
            const enTitle = getLessonEnTitle(lesson.title, index);
            const cnNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
            const cnIndex = cnNums[index % cnNums.length];
            return (
               <div
                 key={lesson.id}
                 className="flex items-stretch gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/10 hover:border-fuchsia-500/30"
               >
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                   {index + 1}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="font-semibold text-white truncate flex items-center gap-2 flex-wrap">
                     <span>{cnIndex}、{lesson.title}</span>
                     <span className="text-slate-400 font-normal text-sm">· {enTitle}</span>
                   </div>
                   {lesson.description && (
                     <div className="text-sm text-slate-400 truncate mt-1">
                       {lesson.description}
                     </div>
                   )}
                   <div className="flex items-center gap-3 mt-2 flex-wrap">
                     <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${statusInfo.className}`}>
                       {status === 'completed' && <CheckCircle2 size={12} />}
                       {status === 'recent' && <Zap size={12} />}
                       {statusInfo.label}
                     </span>
                     <span className="text-xs text-slate-400 flex items-center gap-1">
                       <Clock size={12} />
                       练习 {practiceMinutes} 分钟
                     </span>
                     {completionCount > 0 && (
                       <span className="text-xs text-green-400 flex items-center gap-1">
                         <CheckCircle2 size={12} />
                         已完成 {completionCount} 次
                       </span>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                   <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs rounded-full border border-blue-500/20 hidden sm:inline-block">
                     {lesson.contentType}
                   </span>
                   <span className="text-sm text-slate-400 flex items-center gap-1 hidden sm:flex">
                     <Clock size={12} />
                     {lesson.durationMinutes}分钟
                   </span>
                   {isEnrolled ? (
                     <div
                       onClick={() => handleLessonStart(lesson)}
                       className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center hover:bg-orange-500/30 cursor-pointer transition-colors"
                     >
                       <Play size={16} className="text-orange-400 ml-0.5" />
                     </div>
                   ) : (
                     <CheckCircle size={20} className="text-slate-600" />
                   )}
                 </div>
               </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 ml-64 bg-slate-900/90 backdrop-blur-xl border-t border-fuchsia-500/20 p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-orange-500">
              {course.isFree ? '免费' : course.price}
            </span>
             <span className="text-sm text-slate-400 ml-2">
               · {course.totalLessons}课时
             </span>
          </div>
          <button
            onClick={handleStartLearning}
            disabled={enrolling}
            className="px-8 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
          >
            {enrolling ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                加入中...
              </>
            ) : isEnrolled ? (
              <>
                <Play size={16} />
                开始学习
              </>
             ) : (
               <>
                 <Plus size={16} />
                 {course.isFree ? '立即加入' : '立即购买'}
               </>
             )}
          </button>
        </div>
      </div>
      {/* 支付弹窗 */}
      {/* 删除课程确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">删除课程</DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              确定要从我的课程中删除这门课程吗？删除后学习记录将保留，可随时重新加入。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={handleDeleteCourse}
              disabled={deleting}
              className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  删除中...
                </>
              ) : (
                <>确认删除</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {payDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {payStatus === 'success' ? (
              <div className="p-10 text-center">
                 <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                   <CheckCircle2 size={48} className="text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">支付成功</h3>
                 <p className="text-sm text-slate-400">正在加入课程...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">确认支付</h3>
                  <button
                    onClick={() => setPayDialogOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 订单信息 */}
                <div className="p-5 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      <AppBadge variant="badge1" size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {course?.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        共 {course?.totalLessons} 课时
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-end gap-2">
                    <span className="text-2xl font-bold text-orange-400">
                      {course?.price}
                    </span>
                    {course?.originalPrice && (
                      <span className="text-sm text-slate-500 line-through">
                        {course.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* 支付方式 */}
                <div className="p-5">
                  <div className="text-sm font-medium text-slate-300 mb-3">
                    选择支付方式
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPayMethod('wechat')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        payMethod === 'wechat'
                          ? 'border-green-400 bg-green-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CreditCard size={16} className="text-white" />
                      </div>
                      <span className="flex-1 text-left font-medium text-slate-200">
                        微信支付
                      </span>
                      {payMethod === 'wechat' && (
                        <CheckCircle2 size={20} className="text-green-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setPayMethod('alipay')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        payMethod === 'alipay'
                          ? 'border-blue-400 bg-blue-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <CreditCard size={16} className="text-white" />
                      </div>
                      <span className="flex-1 text-left font-medium text-slate-200">
                        支付宝
                      </span>
                      {payMethod === 'alipay' && (
                        <CheckCircle2 size={20} className="text-blue-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 底部支付按钮 */}
                <div className="p-5 border-t border-white/10">
                  <button
                    onClick={handleConfirmPay}
                    disabled={payStatus === 'paying'}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {payStatus === 'paying' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        支付中...
                      </>
                    ) : (
                      <>确认支付 {course?.price}</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
