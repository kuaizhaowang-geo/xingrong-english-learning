import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Keyboard,
  Volume2,
  Mic,
  Eye,
  PenTool,
  type LucideIcon,
} from 'lucide-react';
import type {
  WordbookSubject,
  WordbookStudyMode,
} from '@shared/api.interface';

const STUDY_MODES: Record<
  WordbookSubject,
  { mode: WordbookStudyMode; name: string; desc: string; icon: LucideIcon; color: string }[]
> = {
  english: [
    { mode: 'typing', name: '打字练习', desc: '看释义输入单词，提升拼写能力', icon: Keyboard, color: '#6366F1' },
    { mode: 'dictation', name: '听写模式', desc: '听发音写单词，训练听力拼写', icon: Volume2, color: '#2563EB' },
    { mode: 'following', name: '跟读模式', desc: '跟读标准发音，改善口语语调', icon: Mic, color: '#06B6D4' },
    { mode: 'speaking', name: '看说模式', desc: '看图片/释义说单词，锻炼反应', icon: Eye, color: '#EC4899' },
  ],
  chinese: [
    { mode: 'pinyin', name: '拼音打字', desc: '看汉字输入拼音，巩固发音', icon: Keyboard, color: '#EC4899' },
    { mode: 'dictation', name: '生字听写', desc: '听读音写汉字，提升书写能力', icon: Volume2, color: '#F97316' },
    { mode: 'character-write', name: '看拼音写汉字', desc: '根据拼音写出正确汉字', icon: PenTool, color: '#A855F7' },
    { mode: 'text-read', name: '课文跟读', desc: '跟读课文，培养语感语调', icon: Mic, color: '#06B6D4' },
  ],
  math: [
    { mode: 'mental-math', name: '口算练习', desc: '快速心算训练，提升计算速度', icon: Keyboard, color: '#06B6D4' },
    { mode: 'formula-memory', name: '公式记忆', desc: '记忆数学公式，灵活运用', icon: Eye, color: '#6366F1' },
    { mode: 'knowledge-review', name: '知识点复习', desc: '系统复习知识点，查漏补缺', icon: Eye, color: '#2563EB' },
    { mode: 'choice', name: '选择题练习', desc: '四选一选择题，巩固知识', icon: PenTool, color: '#22C55E' },
  ],
};

interface StudyModesProps {
  subject: WordbookSubject;
  wordbookId: string;
}

const StudyModes: React.FC<StudyModesProps> = ({ subject, wordbookId }) => {
  const navigate = useNavigate();

  const handleStart = (mode: WordbookStudyMode): void => {
    navigate(`/my-wordbook/study/${wordbookId}?mode=${mode}`);
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
        选择一种学习模式开始练习
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STUDY_MODES[subject].map((mode) => {
          const Icon = mode.icon;
          return (
            <div
              key={mode.mode}
               className="rounded-xl p-5 transition-all hover:scale-[1.02] cursor-pointer group"
               style={{
                 background: 'rgba(15, 23, 42, 0.6)',
                 backdropFilter: 'blur(12px)',
                 border: '1px solid rgba(139, 92, 246, 0.25)',
               }}
              onClick={() => handleStart(mode.mode)}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${mode.color}20`,
                    boxShadow: `0 0 20px ${mode.color}30`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: mode.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{mode.name}</h3>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{mode.desc}</p>
                </div>
              </div>
              <button
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all group-hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${mode.color} 0%, #6366F1 100%)`,
                  boxShadow: `0 0 15px ${mode.color}40`,
                }}
              >
                开始学习
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyModes;
