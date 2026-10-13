import React, { useState, useEffect } from 'react';
import { Calculator, BookOpen, Puzzle, Shapes, Box } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import { getSubjectIllustration } from '@client/src/utils/practice-illustrations';
import { textbooksApi } from '@client/src/api';
import type { TextbookTreeItem } from '@shared/api.interface';
import MentalArithmeticView from './components/MentalArithmeticView';
import WordProblemView from './components/WordProblemView';
import ShapeRecognitionView from './components/ShapeRecognitionView';
import ShapePuzzleView from './components/ShapePuzzleView';
import Shape3DView from './components/Shape3DView';

type TabType = 'arithmetic' | 'word_problem' | 'shapes' | 'puzzle' | '3d';

const TABS: { value: TabType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'arithmetic', label: '口算训练', icon: <Calculator size={18} />, color: 'from-orange-400 to-pink-500' },
  { value: 'word_problem', label: '应用题', icon: <BookOpen size={18} />, color: 'from-blue-400 to-indigo-500' },
  { value: 'shapes', label: '图形认知', icon: <Shapes size={18} />, color: 'from-purple-400 to-violet-500' },
  { value: 'puzzle', label: '图形拼图', icon: <Puzzle size={18} />, color: 'from-emerald-400 to-teal-500' },
  { value: '3d', label: '3D图形', icon: <Box size={18} />, color: 'from-purple-400 to-pink-500' },
];

const MATH_GRADES = [
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
];

const DIFFICULTY_LABELS = ['入门', '简单', '中等', '较难', '挑战'];

const MathPracticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('arithmetic');
  const [textbookTree, setTextbookTree] = useState<TextbookTreeItem[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('grade3');
  const [selectedTextbookId, setSelectedTextbookId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const data = await textbooksApi.getTextbookTree('math');
        if (!cancelled) {
          setTextbookTree(data);
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
      } else {
        setSelectedUnitId('');
      }
    }
  };

  const activeConfig = TABS.find((t) => t.value === activeTab) ?? TABS[0];

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'arithmetic':
        return (
          <MentalArithmeticView
            textbookId={selectedTextbookId}
            unitId={selectedUnitId}
            difficulty={difficulty}
            grade={selectedGrade}
          />
        );
      case 'word_problem':
        return (
          <WordProblemView
            textbookId={selectedTextbookId}
            unitId={selectedUnitId}
            difficulty={difficulty}
          />
        );
      case 'shapes':
        return <ShapeRecognitionView />;
      case 'puzzle':
        return (
          <ShapePuzzleView
            textbookId={selectedTextbookId}
            unitId={selectedUnitId}
            difficulty={difficulty}
            grade={selectedGrade}
          />
        );
      case '3d':
        return <Shape3DView grade={selectedGrade} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white">
            <Image
              src={getSubjectIllustration('math')}
              alt="数学练习"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">数学练习</h1>
        </div>
        <p className="text-slate-400">口算训练 · 应用题 · 图形认知 · 趣味拼图 · 3D图形</p>
      </div>

      {/* 筛选栏 */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">年级：</span>
            <div className="flex gap-1 flex-wrap">
              {MATH_GRADES.map((g) => {
                const isActive = selectedGrade === g.value;
                return (
                  <button
                    key={g.value}
                    onClick={() => handleGradeChange(g.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {g.label}
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
              className="px-3 py-1.5 rounded-lg text-sm border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/50"
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">难度：</span>
            <select
              value={difficulty}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setDifficulty(Number(e.target.value))
              }
              className="px-3 py-1.5 rounded-lg text-sm border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500/50"
            >
              {DIFFICULTY_LABELS.map((label, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="glass-card p-2">
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
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
      <div>{renderContent()}</div>
    </div>
  );
};

export default MathPracticePage;
