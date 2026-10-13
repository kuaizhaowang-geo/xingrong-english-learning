import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, BookOpen, Sparkles, Trophy } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { preschoolApi } from '@client/src/api';
import type { PreschoolProgressSummary } from '@client/src/api/preschool';

interface ModuleCard {
  key: string;
  name: string;
  emoji: string;
  desc: string;
  count: string;
  color: string;
}

const MODULES: ModuleCard[] = [
  { key: 'alphabet', name: '字母乐园', emoji: '🔤', desc: '认识26个英文字母', count: '26课', color: 'from-pink-400 to-rose-500' },
  { key: 'phonics', name: '自然拼读', emoji: '🔊', desc: '学习自然拼读规则', count: '20课', color: 'from-purple-400 to-pink-500' },
  { key: 'words', name: '单词世界', emoji: '🍎', desc: '主题单词学习', count: '100+词', color: 'from-yellow-400 to-orange-500' },
  { key: 'sentences', name: '句子城堡', emoji: '🏰', desc: '常用句型练习', count: '50句', color: 'from-blue-400 to-indigo-500' },
  { key: 'songs', name: '儿歌天地', emoji: '🎵', desc: '英文儿歌学唱', count: '15首', color: 'from-green-400 to-teal-500' },
  { key: 'games', name: '游戏乐园', emoji: '🎮', desc: '趣味游戏练习', count: '6款', color: 'from-cyan-400 to-blue-500' },
];

const HOT_RECOMMENDS: string[] = ['alphabet', 'words', 'games'];

interface PreschoolCourseListProps {
  onBack: () => void;
}

const PreschoolCourseList: React.FC<PreschoolCourseListProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<PreschoolProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await preschoolApi.getProgressSummary();
        setProgress(data);
      } catch (err) {
        logger.error('加载学前英语进度失败', err as Error);
        setProgress({ totalStars: 0, modules: {} });
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  const totalStars = progress?.totalStars ?? 0;

  const getModuleProgress = (key: string): { completed: number; total: number; stars: number; percent: number } => {
    const mod = progress?.modules?.[key];
    if (!mod) return { completed: 0, total: 0, stars: 0, percent: 0 };
    return {
      completed: mod.completedItems ?? 0,
      total: mod.totalItems ?? 0,
      stars: mod.stars ?? 0,
      percent: mod.progressPercent ?? 0,
    };
  };

  const handleModuleClick = (key: string): void => {
    if (key === 'alphabet') {
      navigate('/practice/sentence?preschoolModule=alphabet&mode=typing');
      return;
    }
    if (key === 'phonics') {
      navigate('/practice/sentence?preschoolModule=phonics&mode=typing');
      return;
    }
    if (key === 'words') {
      navigate('/practice/sentence?preschoolModule=words&preschoolCategory=animals&mode=typing');
      return;
    }
    if (key === 'sentences') {
      navigate('/practice/sentence?preschoolModule=sentences&preschoolCategory=greetings&mode=typing');
      return;
    }
    navigate(`/preschool?view=${key}`);
  };

  // 模拟成就数据（初期前端模拟）
  const achievementStats = [
    { icon: <Calendar size={20} />, label: '学习天数', value: '7天', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: <BookOpen size={20} />, label: '已学字母', value: '26个', color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: <Sparkles size={20} />, label: '已学单词', value: '58个', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: <Trophy size={20} />, label: '获得星星', value: `${totalStars}颗`, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 顶部骨架 */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
        {/* 简介区骨架 */}
        <div className="h-32 bg-gray-200 rounded-3xl animate-pulse" />
        {/* 模块卡片骨架 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={18} className="text-[#1A1A2E]" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            学前英语
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold text-yellow-700">{totalStars}</span>
        </div>
      </div>

      {/* 简介大卡片 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-400 via-purple-400 to-yellow-400 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute -top-4 -right-4 text-8xl opacity-20">🌈</div>
        <div className="absolute bottom-2 left-4 text-5xl opacity-20">🎈</div>
        <div className="relative z-10 max-w-md">
          <div className="text-4xl mb-3">👶📚</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">专为3-6岁儿童设计</h2>
          <p className="text-sm sm:text-base opacity-95 leading-relaxed">
            趣味英语启蒙课程，让宝贝在游戏中爱上英语，轻松开启语言天赋 ✨
          </p>
        </div>
      </div>

      {/* 6大模块卡片 */}
      <div>
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> 六大学习模块
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const mp = getModuleProgress(mod.key);
            return (
              <div
                key={mod.key}
                 onClick={() => handleModuleClick(mod.key)}
                 className="glass-card rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer p-4 sm:p-5 overflow-hidden relative group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${mod.color} opacity-10 rounded-full -translate-y-8 translate-x-8`} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{mod.emoji}</div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-full">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-700">{mp.stars}</span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-[#1A1A2E] mb-1">{mod.name}</h4>
                  <p className="text-xs text-[#6B7280] mb-3">{mod.desc}</p>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-medium text-[#FF6B35]">{mod.count}</span>
                     <span className="text-xs text-[#6B7280]">进度 {mp.percent}%</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最受欢迎推荐 */}
      <div>
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
          <span className="text-xl">🔥</span> 最受欢迎
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {HOT_RECOMMENDS.map((key) => {
            const mod = MODULES.find((m) => m.key === key)!;
            const mp = getModuleProgress(key);
            return (
              <div
                key={key}
                onClick={() => handleModuleClick(key)}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${mod.color} p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer`}
              >
                <div className="absolute -bottom-4 -right-2 text-7xl opacity-20">{mod.emoji}</div>
                <div className="relative z-10">
                  <div className="text-5xl mb-3">{mod.emoji}</div>
                  <h4 className="text-lg font-bold mb-1">{mod.name}</h4>
                  <p className="text-xs opacity-90 mb-3">{mod.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">{mod.count}</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-white text-white" />
                      <span className="text-xs font-semibold">{mp.stars}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

       {/* 学习成就 */}
       <div className="glass-card rounded-3xl p-5 shadow-sm">
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">🏆</span> 学习成就
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievementStats.map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-2xl p-4 text-center`}>
              <div className={`${stat.color} flex justify-center mb-2`}>{stat.icon}</div>
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreschoolCourseList;
