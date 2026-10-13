import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BookMarked,
  GraduationCap,
  Heart,
  Edit3,
  Trash2,
  Play,
  ArrowRight,
  Sparkles,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@client/src/components/ui/tabs';
import type {
  UserWordbook,
  WordbookSubject,
  WordbookContentType,
} from '@shared/api.interface';
import { useNavigate } from 'react-router-dom';

// ===== Types =====

interface UserTextbookItem {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  unitCount: number;
  status: string;
  coverImage?: string;
  description?: string;
}

interface UserCourseItem {
  id: string;
  name: string;
  subject: string;
  category?: string;
  unitCount: number;
  status: string;
  coverImage?: string;
  description?: string;
}

interface TextbookListResponse {
  items: UserTextbookItem[];
  total: number;
}

interface CourseListResponse {
  items: UserCourseItem[];
  total: number;
}

type AssetTab = 'wordbooks' | 'textbooks' | 'courses' | 'favorites';

// ===== Constants =====

const SUBJECT_LABEL: Record<string, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '生字',
  phrase: '词语',
  formula: '公式',
  question: '题目',
};

// Status mapping: raw status → display label + color
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280', label: '私有' },
  private: { bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280', label: '私有' },
  pending: { bg: 'rgba(251, 191, 36, 0.15)', color: '#F59E0B', label: '待审核' },
  pending_audit: { bg: 'rgba(251, 191, 36, 0.15)', color: '#F59E0B', label: '待审核' },
  approved: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', label: '已公开' },
  public: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', label: '已公开' },
  rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', label: '已拒绝' },
  removed: { bg: 'rgba(107, 114, 128, 0.12)', color: '#6B7280', label: '已下架' },
};

function getStatusStyle(status: string): { bg: string; color: string; label: string } {
  return STATUS_STYLE[status] ?? STATUS_STYLE.draft;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  gradient: string;
  iconBg: string;
}

  const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, gradient, iconBg }) => (
   <div
     className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white transition-transform hover:scale-[1.02]"
     style={{ background: gradient }}
   >
    <div
      className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-20"
      style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
    />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs sm:text-sm opacity-90 mb-1 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
      </div>
       <div
         className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
         style={{ background: iconBg }}
       >
         <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    </div>
  </div>
);

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = getStatusStyle(status);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
};

interface InfoChipProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

const InfoChip: React.FC<InfoChipProps> = ({ icon: Icon, label, value }) => (
   <div className="flex items-center gap-1.5 text-sm text-slate-400">
    <Icon className="w-3.5 h-3.5" />
    <span>{label}：{value}</span>
  </div>
);

interface AssetCardProps {
  title: string;
  subtitle?: string;
  chips: { icon: LucideIcon; label: string; value: string | number }[];
  status: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onStudy?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
  title,
  subtitle,
  chips,
  status,
  onEdit,
  onDelete,
  onStudy,
}) => (
     <div
      className="bg-white/5 rounded-xl border border-white/10 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col h-full"
    >
     <div className="flex items-start justify-between mb-3 gap-2">
       <div className="flex-1 min-w-0">
         <h3 className="font-semibold text-white truncate" title={title}>
           {title}
         </h3>
         {subtitle && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{subtitle}</p>
         )}
       </div>
       <StatusBadge status={status} />
     </div>

     <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 flex-1">
      {chips.map((chip, idx: number) => (
        <InfoChip key={idx} {...chip} />
      ))}
    </div>

       <div className="flex items-center gap-1 sm:gap-2 pt-3 border-t border-white/10">
       <button
         onClick={onEdit}
          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-2 min-h-11 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex-1 sm:flex-none"
       >
         <Edit3 className="w-4 h-4" />
         <span className="hidden sm:inline">编辑</span>
       </button>
       <button
         onClick={onDelete}
          className="flex items-center justify-center gap-1 px-2 sm:px-3 py-2 min-h-11 rounded-lg text-xs font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors flex-1 sm:flex-none"
       >
         <Trash2 className="w-4 h-4" />
         <span className="hidden sm:inline">删除</span>
       </button>
       <div className="flex-1 hidden sm:block" />
       <button
         onClick={onStudy}
         className="flex items-center justify-center gap-1 px-3 sm:px-4 py-2 min-h-11 rounded-lg text-xs sm:text-sm font-medium text-white transition-all hover:opacity-90 flex-1 sm:flex-none"
         style={{ background: 'linear-gradient(135deg, #4361EE 0%, #2563EB 100%)' }}
       >
         <Play className="w-4 h-4 fill-current" />
         学习
       </button>
     </div>
  </div>
);

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
   <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
      style={{ background: 'rgba(67, 97, 238, 0.1)' }}
    >
      <Icon className="w-7 h-7" style={{ color: '#4361EE' }} />
    </div>
     <p className="font-medium text-white mb-1">{title}</p>
    <p className="text-sm text-slate-400">{description}</p>
  </div>
);

interface JumpButtonProps {
  label: string;
  onClick: () => void;
}

  const JumpButton: React.FC<JumpButtonProps> = ({ label, onClick }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-11 rounded-lg text-sm font-medium border transition-all hover:border-[#4361EE] hover:text-[#4361EE]"
       style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8', background: 'rgba(255,255,255,0.05)' }}
    >
      {label}
      <ArrowRight className="w-4 h-4" />
    </button>
  );

const AssetsCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AssetTab>('wordbooks');

  // Stats
  const [stats, setStats] = useState({
    wordbooks: 0,
    textbooks: 0,
    courses: 0,
    favorites: 0,
  });

  // Wordbooks
  const [wordbooks, setWordbooks] = useState<UserWordbook[]>([]);
  const [wordbooksLoading, setWordbooksLoading] = useState(false);

  // Textbooks
  const [textbooks, setTextbooks] = useState<UserTextbookItem[]>([]);
  const [textbooksLoading, setTextbooksLoading] = useState(false);

  // Courses
  const [courses, setCourses] = useState<UserCourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Load wordbooks
  const loadWordbooks = async (): Promise<void> => {
    setWordbooksLoading(true);
    try {
      const res = await wordbookApi.getWordbooks({ pageSize: 50 });
      setWordbooks(res.items);
      setStats((prev) => ({ ...prev, wordbooks: res.total ?? res.items.length }));
    } catch (err) {
      logger.error('加载我的词库失败', { error: String(err) });
    } finally {
      setWordbooksLoading(false);
    }
  };

  // Load textbooks
  const loadTextbooks = async (): Promise<void> => {
    setTextbooksLoading(true);
    try {
      const res = await axiosForBackend.get<TextbookListResponse>(
        '/api/user-textbooks',
        { params: { pageSize: 50 } },
      );
      setTextbooks(res.data.items);
      setStats((prev) => ({ ...prev, textbooks: res.data.total ?? res.data.items.length }));
    } catch (err) {
      logger.error('加载我的教材失败', { error: String(err) });
    } finally {
      setTextbooksLoading(false);
    }
  };

  // Load courses
  const loadCourses = async (): Promise<void> => {
    setCoursesLoading(true);
    try {
      const res = await axiosForBackend.get<CourseListResponse>(
        '/api/user-created-courses',
        { params: { pageSize: 50 } },
      );
      setCourses(res.data.items);
      setStats((prev) => ({ ...prev, courses: res.data.total ?? res.data.items.length }));
    } catch (err) {
      logger.error('加载我的课程失败', { error: String(err) });
    } finally {
      setCoursesLoading(false);
    }
  };

  // Load favorites placeholder (no dedicated API yet)
  const loadFavorites = async (): Promise<void> => {
    // 暂无收藏列表接口，使用占位数据
    setStats((prev) => ({ ...prev, favorites: 0 }));
  };

  useEffect(() => {
    loadWordbooks();
    loadTextbooks();
    loadCourses();
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteWordbook = async (id: string): Promise<void> => {
    try {
      await wordbookApi.deleteWordbook(id);
      setWordbooks((prev) => prev.filter((wb) => wb.id !== id));
      setStats((prev) => ({ ...prev, wordbooks: prev.wordbooks - 1 }));
    } catch (err) {
      logger.error('删除词库失败', { error: String(err) });
    }
  };

  const handleDeleteTextbook = async (id: string): Promise<void> => {
    try {
      await axiosForBackend.delete(`/api/user-textbooks/${id}`);
      setTextbooks((prev) => prev.filter((tb) => tb.id !== id));
      setStats((prev) => ({ ...prev, textbooks: Math.max(0, prev.textbooks - 1) }));
    } catch (err) {
      logger.error('删除教材失败', { error: String(err) });
    }
  };

  const handleDeleteCourse = async (id: string): Promise<void> => {
    try {
      await axiosForBackend.delete(`/api/user-created-courses/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      setStats((prev) => ({ ...prev, courses: Math.max(0, prev.courses - 1) }));
    } catch (err) {
      logger.error('删除课程失败', { error: String(err) });
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #4361EE 0%, #2563EB 100%)',
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">我的资产</h1>
              <p className="text-sm text-slate-400 truncate">统一管理你创建的所有学习内容</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard
            icon={BookOpen}
            label="我的词库"
            value={stats.wordbooks}
            gradient="linear-gradient(135deg, #4361EE 0%, #2563EB 100%)"
            iconBg="rgba(255,255,255,0.2)"
          />
          <StatCard
            icon={BookMarked}
            label="我的教材"
            value={stats.textbooks}
            gradient="linear-gradient(135deg, #6366F1 0%, #A855F7 100%)"
            iconBg="rgba(255,255,255,0.2)"
          />
          <StatCard
            icon={GraduationCap}
            label="我的课程"
            value={stats.courses}
            gradient="linear-gradient(135deg, #22C55E 0%, #10B981 100%)"
            iconBg="rgba(255,255,255,0.2)"
          />
          <StatCard
            icon={Heart}
            label="我的收藏"
            value={stats.favorites}
            gradient="linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
            iconBg="rgba(255,255,255,0.2)"
          />
        </div>

         {/* Tab 切换区 */}
           <div className="bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-5 shadow-sm">
          <Tabs
            defaultValue="wordbooks"
            value={activeTab}
            onValueChange={(val: string) => setActiveTab(val as AssetTab)}
            className="w-full"
          >
             <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-4 sm:mb-6 scrollbar-hide">
             <TabsList
               className="w-max min-w-full justify-start h-auto p-1"
                 style={{ background: 'rgba(255,255,255,0.05)' }}
             >
               <TabsTrigger
                   value="wordbooks"
                  className="px-4 py-2 min-h-11 whitespace-nowrap data-[state=active]:bg-white/10"
               >
                 <BookOpen className="w-4 h-4 mr-1.5" />
                 词库
               </TabsTrigger>
               <TabsTrigger
                   value="textbooks"
                  className="px-4 py-2 min-h-11 whitespace-nowrap data-[state=active]:bg-white/10"
               >
                 <BookMarked className="w-4 h-4 mr-1.5" />
                 教材
               </TabsTrigger>
               <TabsTrigger
                   value="courses"
                  className="px-4 py-2 min-h-11 whitespace-nowrap data-[state=active]:bg-white/10"
               >
                 <GraduationCap className="w-4 h-4 mr-1.5" />
                 课程
               </TabsTrigger>
               <TabsTrigger
                   value="favorites"
                  className="px-4 py-2 min-h-11 whitespace-nowrap data-[state=active]:bg-white/10"
               >
                 <Heart className="w-4 h-4 mr-1.5" />
                 收藏
               </TabsTrigger>
             </TabsList>
             </div>

            {/* 词库 Tab */}
            <TabsContent value="wordbooks">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-base font-semibold text-white">我的词库</h2>
                <JumpButton label="去我的词库" onClick={() => navigate('/my-wordbook')} />
              </div>
              {wordbooksLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4361EE]" />
                </div>
              ) : wordbooks.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="还没有词库"
                  description="前往「我的词库」创建你的第一个学习词库吧"
                />
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   {wordbooks.map((wb: UserWordbook) => (
                    <AssetCard
                      key={wb.id}
                      title={wb.name}
                      subtitle={wb.description}
                      status="draft"
                      chips={[
                        { icon: BookOpen, label: '学科', value: SUBJECT_LABEL[wb.subject] ?? wb.subject },
                        { icon: Sparkles, label: '类型', value: CONTENT_TYPE_LABEL[wb.contentType] ?? wb.contentType },
                        { icon: Play, label: '词条数', value: wb.itemCount },
                      ]}
                      onEdit={() => navigate('/my-wordbook')}
                      onDelete={() => handleDeleteWordbook(wb.id)}
                      onStudy={() => navigate('/my-wordbook')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 教材 Tab */}
            <TabsContent value="textbooks">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-base font-semibold text-white">我的教材</h2>
                <JumpButton label="去我的教材" onClick={() => navigate('/my-textbooks')} />
              </div>
              {textbooksLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4361EE]" />
                </div>
              ) : textbooks.length === 0 ? (
                <EmptyState
                  icon={BookMarked}
                  title="还没有教材"
                  description="前往「我的教材」创建你的第一本教材吧"
                />
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   {textbooks.map((tb: UserTextbookItem) => (
                    <AssetCard
                      key={tb.id}
                      title={tb.name}
                      subtitle={tb.description}
                      status={tb.status}
                      chips={[
                        { icon: BookOpen, label: '学科', value: SUBJECT_LABEL[tb.subject] ?? tb.subject },
                        { icon: GraduationCap, label: '年级', value: tb.grade ?? '未设置' },
                        { icon: BookMarked, label: '单元数', value: tb.unitCount },
                      ]}
                      onEdit={() => navigate('/my-textbooks')}
                      onDelete={() => handleDeleteTextbook(tb.id)}
                      onStudy={() => navigate('/my-textbooks')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 课程 Tab */}
            <TabsContent value="courses">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-base font-semibold text-white">我的课程</h2>
                <JumpButton label="去我的课程" onClick={() => navigate('/my-courses')} />
              </div>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4361EE]" />
                </div>
              ) : courses.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="还没有课程"
                  description="前往「我的课程」创建你的第一门课程吧"
                />
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   {courses.map((course: UserCourseItem) => (
                    <AssetCard
                      key={course.id}
                      title={course.name}
                      subtitle={course.description}
                      status={course.status}
                      chips={[
                        { icon: BookOpen, label: '学科', value: SUBJECT_LABEL[course.subject] ?? course.subject },
                        { icon: Sparkles, label: '分类', value: course.category ?? '未分类' },
                        { icon: BookMarked, label: '单元数', value: course.unitCount },
                      ]}
                      onEdit={() => navigate('/my-courses')}
                      onDelete={() => handleDeleteCourse(course.id)}
                      onStudy={() => navigate('/my-courses')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 收藏 Tab */}
            <TabsContent value="favorites">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-base font-semibold text-white">我的收藏</h2>
              </div>
              <EmptyState
                icon={Heart}
                title="收藏功能开发中"
                description="敬请期待，收藏的内容市场词库将在这里展示"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AssetsCenterPage;
