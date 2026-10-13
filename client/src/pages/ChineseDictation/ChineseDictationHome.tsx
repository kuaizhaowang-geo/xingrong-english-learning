import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  BookOpen,
  Target,
  Award,
  BookX,
  Volume2,
  Keyboard,
  PenTool,
  Loader2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { chineseDictationApi } from '@client/src/api';
import type { ChineseDictationStats } from '@shared/api.interface';

const GRADE_OPTIONS = [
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const COUNT_OPTIONS = [10, 20, 50];

const MODES = [
  {
    id: 'pinyin_to_char',
    icon: PenTool,
    title: '看拼音写汉字',
    desc: '根据拼音输入正确的汉字',
    color: 'from-[#FF6B35] to-[#FF8C5A]',
  },
  {
    id: 'audio_to_char',
    icon: Volume2,
    title: '听写生词',
    desc: '听发音写出正确的词语',
    color: 'from-[#4361EE] to-[#6B8AFF]',
  },
  {
    id: 'char_to_pinyin',
    icon: Keyboard,
    title: '拼音打字',
    desc: '看汉字输入对应的拼音',
    color: 'from-[#2EC4B6] to-[#5DD8CC]',
  },
];

const ChineseDictationHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ChineseDictationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedMode, setSelectedMode] = useState('pinyin_to_char');
  const [grade, setGrade] = useState('grade1');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async (): Promise<void> => {
    try {
      const data = await chineseDictationApi.getDictationStats();
      setStats(data);
    } catch (err) {
      logger.error('加载听写统计失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (): Promise<void> => {
    setStarting(true);
    try {
      const result = await chineseDictationApi.startDictationSession({
        grade,
        difficulty,
        count,
        mode: selectedMode,
      });
      // 保存 session 和字符列表到 localStorage
      localStorage.setItem(
        'chineseDictationSession',
        JSON.stringify({
          session: result.session,
          characters: result.characters,
          currentIndex: 0,
        }),
      );
      navigate('/chinese-dictation/practice');
    } catch (err) {
      logger.error('开始听写失败', err as Error);
      toast.error('开始听写失败，请重试');
    } finally {
      setStarting(false);
    }
  };

  const statCards = [
    {
      label: '累计听写',
      value: stats?.totalSessions ?? 0,
      unit: '次',
      icon: BookOpen,
      color: 'text-[#FF6B35]',
      bg: 'bg-[#FFF4EF]',
    },
    {
      label: '正确率',
      value: stats ? Math.round(stats.accuracy * 100) : 0,
      unit: '%',
      icon: Target,
      color: 'text-[#4361EE]',
      bg: 'bg-[#EEF2FF]',
    },
    {
      label: '已掌握生字',
      value: stats?.masteredCount ?? 0,
      unit: '个',
      icon: Award,
      color: 'text-[#2EC4B6]',
      bg: 'bg-[#E8FAF7]',
    },
    {
      label: '错字本',
      value: stats?.wrongCount ?? 0,
      unit: '个',
      icon: BookX,
      color: 'text-[#EF476F]',
      bg: 'bg-[#FDE7EC]',
      onClick: () => navigate('/chinese-dictation/wrong-book'),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">生字听写</h1>
        <p className="text-slate-400">轻松掌握每一个汉字</p>
      </div>

      {/* 统计区 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
             <div
               key={card.label}
               onClick={card.onClick}
               className={`glass-card rounded-xl p-5
                 ${card.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
             >
               <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-white/5 border border-white/10 ${card.color.replace('text-', 'text-')}`}>
                 <card.icon className={`w-5 h-5 ${card.color}`} />
               </div>
               <div className="text-2xl font-bold text-white">
                 {card.value}
                 <span className="text-sm font-normal text-slate-400 ml-1">{card.unit}</span>
               </div>
               <div className="text-sm text-slate-400 mt-1">{card.label}</div>
             </div>
          ))}
        </div>
      )}

      {/* 模式选择 */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">选择模式</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
               <div
                 key={mode.id}
                 onClick={() => setSelectedMode(mode.id)}
                 className={`glass-card rounded-xl p-5 cursor-pointer
                   transition-all hover:shadow-lg
                   ${isSelected ? 'border-[#FF6B35] ring-2 ring-[#FF6B35]/30' : 'border-white/10'}`}
               >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color}
                  flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                 <h3 className="font-semibold text-white mb-1">{mode.title}</h3>
                 <p className="text-sm text-slate-400">{mode.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 设置区 */}
       <div className="glass-card rounded-xl p-5">
         <h2 className="text-lg font-semibold text-white mb-4">听写设置</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
             <label className="block text-sm text-slate-300 mb-2">年级</label>
             <select
               value={grade}
               onChange={(e) => setGrade(e.target.value)}
               className="w-full px-4 py-2.5 rounded-lg border border-white/10
                 bg-white/5 text-slate-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
            >
              {GRADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
             <label className="block text-sm text-slate-300 mb-2">难度</label>
             <select
               value={difficulty}
               onChange={(e) => setDifficulty(e.target.value)}
               className="w-full px-4 py-2.5 rounded-lg border border-white/10
                 bg-white/5 text-slate-200 text-sm
                 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
             <label className="block text-sm text-slate-300 mb-2">数量</label>
             <div className="flex gap-2">
               {COUNT_OPTIONS.map((num) => (
                 <button
                   key={num}
                   type="button"
                   onClick={() => setCount(num)}
                   className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors
                     ${count === num
                       ? 'bg-[#FF6B35] text-white'
                       : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                     }`}
                 >
                   {num}个
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        type="button"
        onClick={handleStart}
        disabled={starting}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]
          text-white text-lg font-semibold shadow-md hover:shadow-lg transition-shadow
          flex items-center justify-center gap-2
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {starting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        开始听写
      </button>
    </div>
  );
};

export default ChineseDictationHome;
