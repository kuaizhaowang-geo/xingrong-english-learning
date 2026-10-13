import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BookOpenCheck,
  Headphones,
  Keyboard,
  Feather,
  Volume2,
} from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { getSubjectIllustration } from '@client/src/utils/practice-illustrations';
import { textbooksApi } from '@client/src/api';
import type { TextbookTreeItem } from '@shared/api.interface';
import LessonReadingView from './components/LessonReadingView';
import CharacterLearningView from './components/CharacterLearningView';
import CharacterDictationView from './components/CharacterDictationView';
import PinyinTypingView from './components/PinyinTypingView';
import PoetryRecitationView from './components/PoetryRecitationView';

type TabType =
  | 'reading'
  | 'characters'
  | 'dictation'
  | 'pinyin'
  | 'poetry';

const TABS: { value: TabType; label: string; icon: React.ReactNode }[] = [
  { value: 'reading', label: '课文点读', icon: <BookOpen size={16} /> },
  { value: 'characters', label: '生字学习', icon: <Feather size={16} /> },
  { value: 'dictation', label: '生字听写', icon: <Headphones size={16} /> },
  { value: 'pinyin', label: '拼音打字', icon: <Keyboard size={16} /> },
  { value: 'poetry', label: '古诗默写', icon: <BookOpenCheck size={16} /> },
];

const CHINESE_GRADES = [
  { value: 'grade1', label: '一年级上册' },
  { value: 'grade2', label: '二年级上册' },
  { value: 'grade3', label: '三年级上册' },
  { value: 'grade4', label: '四年级上册' },
  { value: 'grade5', label: '五年级上册' },
  { value: 'grade6', label: '六年级上册' },
];

const ChinesePracticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reading');
  const [textbookTree, setTextbookTree] = useState<TextbookTreeItem[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');
  const [selectedTextbookId, setSelectedTextbookId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await textbooksApi.getTextbookTree('chinese');
        if (!cancelled) {
          setTextbookTree(data);
          // 默认选中第一个教材和单元
          if (data.length > 0) {
            const gradeMatch = data.find(
              (t: TextbookTreeItem) => t.grade === selectedGrade,
            );
            const textbook = gradeMatch || data[0];
            setSelectedTextbookId(textbook.id);
            if (textbook.units && textbook.units.length > 0) {
              setSelectedUnitId(textbook.units[0].id);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTextbook = textbookTree.find(
    (t: TextbookTreeItem) => t.id === selectedTextbookId,
  );
  const currentUnits = currentTextbook?.units ?? [];

  const handleGradeChange = (grade: string): void => {
    setSelectedGrade(grade);
    const textbook = textbookTree.find(
      (t: TextbookTreeItem) => t.grade === grade,
    );
    if (textbook) {
      setSelectedTextbookId(textbook.id);
      if (textbook.units && textbook.units.length > 0) {
        setSelectedUnitId(textbook.units[0].id);
      }
    }
  };

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'reading':
        return (
          <LessonReadingView
            textbookId={selectedTextbookId}
            unitId={selectedUnitId}
          />
        );
      case 'characters':
        return (
          <CharacterLearningView
            textbookId={selectedTextbookId}
            unitId={selectedUnitId}
          />
        );
      case 'dictation':
        return (
          <CharacterDictationView
            textbookId={selectedTextbookId}
          />
        );
      case 'pinyin':
        return (
          <PinyinTypingView
            textbookId={selectedTextbookId}
          />
        );
      case 'poetry':
        return (
          <PoetryRecitationView
            textbookId={selectedTextbookId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white">
            <Image
              src={getSubjectIllustration('chinese')}
              alt="语文练习"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white">语文练习</h1>
            <p className="text-slate-400 text-sm">听读写闭环，夯实语文基础</p>
          </div>
        </div>
      </div>

      {/* 筛选栏：年级 + 单元 */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">年级：</span>
            <div className="flex gap-1 flex-wrap">
              {CHINESE_GRADES.map((g) => {
                const isActive = selectedGrade === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => handleGradeChange(g.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-500/30'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {g.label.replace('年级上册', '年级')}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">单元：</span>
            <select
              value={selectedUnitId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedUnitId(e.target.value)
              }
              className="px-3 py-1.5 rounded-lg text-sm border border-white/10 bg-white/5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500/50"
            >
              {loading && <option>加载中...</option>}
              {currentUnits.length === 0 && !loading && (
                <option value="">暂无单元</option>
              )}
              {currentUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="glass-card rounded-2xl p-2">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区 */}
      {renderContent()}
    </div>
  );
};

export default ChinesePracticePage;
