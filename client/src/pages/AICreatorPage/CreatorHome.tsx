import React, { useState } from 'react';
import { Sparkles, Wand2, BookOpen, MessageSquare, Users, Zap, Loader2, Palette } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import type { AICourse } from '@shared/api.interface';
import MyCoursesList from './MyCoursesList';

const exampleTopics = [
  '咖啡馆点餐',
  '商务邮件写作',
  '机场值机与安检',
  '医院就医问诊',
  '酒店入住退房',
  '面试自我介绍',
];

const courseTypeOptions = [
  { value: 'word', label: '单词课', icon: BookOpen },
  { value: 'sentence', label: '句子课', icon: MessageSquare },
  { value: 'mixed', label: '混合课', icon: Sparkles },
];

const levelOptions = [
  { value: 'beginner', label: '入门' },
  { value: 'elementary', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

const audienceOptions = [
  { value: 'kids', label: '儿童', icon: Users, color: 'from-pink-400 to-rose-400' },
  { value: 'teen', label: '青少年', icon: Zap, color: 'from-cyan-400 to-blue-400' },
  { value: 'adult', label: '成人', icon: Palette, color: 'from-violet-400 to-purple-400' },
];

interface CreatorHomeProps {
  courses: AICourse[];
  loading: boolean;
  generating: boolean;
  onGenerate: (params: {
    topic: string;
    courseType: string;
    level: string;
    audience: string;
  }) => void;
  onEditCourse: (course: AICourse) => void;
  onDeleteCourse: (id: string) => void;
  onShareCourse: (course: AICourse) => void;
  onTogglePublish: (course: AICourse) => void;
}

const CreatorHome: React.FC<CreatorHomeProps> = ({
  courses,
  loading,
  generating,
  onGenerate,
  onEditCourse,
  onDeleteCourse,
  onShareCourse,
  onTogglePublish,
}) => {
  const [topic, setTopic] = useState('');
  const [courseType, setCourseType] = useState('mixed');
  const [level, setLevel] = useState('intermediate');
  const [audience, setAudience] = useState('adult');
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerate = (): void => {
    if (!topic.trim() || generating) return;
    onGenerate({ topic: topic.trim(), courseType, level, audience });
  };

  const getLevelLabel = (lv: string): string => {
    return levelOptions.find((o) => o.value === lv)?.label || lv;
  };

  return (
    <div className="space-y-6">
      {/* 顶部英雄区 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white p-8 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 backdrop-blur-xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/20 rounded-full translate-y-1/3 -translate-x-1/3 backdrop-blur-xl" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-pink-400/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">AI 创作坊</h1>
          </div>
          <p className="text-white/90 text-lg">定制你的专属英语课程</p>
          <p className="text-white/70 text-sm mt-2 max-w-lg">
            输入你感兴趣的主题，AI 将为你生成包含单词、句子、对话和语法的个性化学习内容
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card border border-white/10 shadow-sm">
          <TabsTrigger
            value="generate"
            className="data-[state=active]:text-fuchsia-400 data-[state=active]:bg-fuchsia-500/20 data-[state=active]:shadow-lg data-[state=active]:shadow-fuchsia-500/20"
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            AI 创作
          </TabsTrigger>
          <TabsTrigger
            value="mine"
            className="data-[state=active]:text-fuchsia-400 data-[state=active]:bg-fuchsia-500/20 data-[state=active]:shadow-lg data-[state=active]:shadow-fuchsia-500/20"
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            我的创作
            {courses.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-600 rounded-full">
                {courses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              生成新课程
            </h2>

            <div className="space-y-5">
              {/* 主题输入 */}
              <div>
                  <label className="text-sm font-medium text-slate-200 mb-2 block">
                    学习主题 <span className="text-red-400">*</span>
                  </label>
                <textarea
                  value={topic}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setTopic(e.target.value)
                  }
                  placeholder="请输入你想学习的主题，如：商务邮件写作、旅游英语、餐厅点餐..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50 resize-none bg-white/5"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                   <span className="text-xs text-slate-500 self-center mr-1">推荐主题：</span>
                  {exampleTopics.map((ex: string) => (
                    <button
                      key={ex}
                      onClick={() => setTopic(ex)}
                      className="px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors border border-purple-100"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* 课程类型 */}
              <div>
                 <label className="text-sm font-medium text-slate-200 mb-2 block">
                   课程类型
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {courseTypeOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setCourseType(opt.value)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1.5 border ${
                          courseType === opt.value
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white border-transparent shadow-md'
                             : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 难度选择 */}
              <div>
                 <label className="text-sm font-medium text-slate-200 mb-2 block">
                   难度选择
                </label>
                <div className="flex gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLevel(opt.value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        level === opt.value
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 目标受众 */}
              <div>
                 <label className="text-sm font-medium text-slate-200 mb-2 block">
                   目标受众
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {audienceOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAudience(opt.value)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1.5 border ${
                          audience === opt.value
                            ? `bg-gradient-to-br ${opt.color} text-white border-transparent shadow-md`
                             : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || generating}
                className="w-full py-3.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg relative overflow-hidden group"
              >
                {generating && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                )}
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10">AI 正在创作中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    立即生成课程
                  </>
                )}
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <MyCoursesList
            courses={courses}
            loading={loading}
            getLevelLabel={getLevelLabel}
            onEdit={onEditCourse}
            onDelete={onDeleteCourse}
            onShare={onShareCourse}
            onTogglePublish={onTogglePublish}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorHome;
