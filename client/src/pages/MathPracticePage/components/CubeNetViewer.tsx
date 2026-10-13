import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Sparkles } from 'lucide-react';

interface CubeNetViewerProps {
  grade?: number;
}

// 11 种正方体展开图类型
// 用 3 行 4 列网格表示，每个面的相对位置
// U=上 D=下 F=前 B=后 L=左 R=右
interface NetType {
  id: string;
  name: string;
  category: string; // 一四一型 / 一三二型 / 三三型 / 二二二型
  layout: (string | null)[][]; // 3~4 行网格
  difficulty: number; // 1-3 难度
}

const CUBE_NETS: NetType[] = [
  // 一四一型 (6种)
  {
    id: '141-1',
    name: '一四一型 · 1',
    category: '一四一型',
    layout: [
      [null, 'U', null, null],
      ['L', 'F', 'R', 'B'],
      [null, 'D', null, null],
    ],
    difficulty: 1,
  },
  {
    id: '141-2',
    name: '一四一型 · 2',
    category: '一四一型',
    layout: [
      [null, 'U', null, null],
      ['L', 'F', 'R', 'B'],
      [null, null, 'D', null],
    ],
    difficulty: 1,
  },
  {
    id: '141-3',
    name: '一四一型 · 3',
    category: '一四一型',
    layout: [
      [null, 'U', null, null],
      ['L', 'F', 'R', 'B'],
      [null, null, null, 'D'],
    ],
    difficulty: 1,
  },
  {
    id: '141-4',
    name: '一四一型 · 4',
    category: '一四一型',
    layout: [
      ['U', null, null, null],
      ['F', 'R', 'B', 'L'],
      [null, 'D', null, null],
    ],
    difficulty: 2,
  },
  {
    id: '141-5',
    name: '一四一型 · 5',
    category: '一四一型',
    layout: [
      [null, null, 'U', null],
      ['L', 'F', 'R', 'B'],
      ['D', null, null, null],
    ],
    difficulty: 2,
  },
  {
    id: '141-6',
    name: '一四一型 · 6',
    category: '一四一型',
    layout: [
      [null, null, null, 'U'],
      ['L', 'F', 'R', 'B'],
      [null, 'D', null, null],
    ],
    difficulty: 2,
  },
  // 一三二型 (3种)
  {
    id: '132-1',
    name: '一三二型 · 1',
    category: '一三二型',
    layout: [
      [null, null, 'U', null],
      [null, 'F', 'R', 'B'],
      ['D', 'L', null, null],
    ],
    difficulty: 2,
  },
  {
    id: '132-2',
    name: '一三二型 · 2',
    category: '一三二型',
    layout: [
      [null, 'U', null, null],
      ['L', 'F', 'R', null],
      [null, null, 'B', 'D'],
    ],
    difficulty: 2,
  },
  {
    id: '132-3',
    name: '一三二型 · 3',
    category: '一三二型',
    layout: [
      [null, null, 'U', null],
      ['L', 'F', 'R', null],
      [null, null, 'B', 'D'],
    ],
    difficulty: 3,
  },
  // 三三型 (1种)
  {
    id: '33-1',
    name: '三三型',
    category: '三三型',
    layout: [
      ['U', 'F', 'R', null],
      [null, null, 'B', 'D'],
      [null, 'L', null, null],
    ],
    difficulty: 3,
  },
  // 二二二型 (1种)
  {
    id: '222-1',
    name: '二二二型',
    category: '二二二型',
    layout: [
      [null, 'U', 'R', null],
      ['L', 'F', null, null],
      [null, null, 'B', 'D'],
    ],
    difficulty: 3,
  },
];

const FACE_COLORS: Record<string, string> = {
  F: 'from-orange-400 to-orange-500', // 前 - 橙
  B: 'from-pink-400 to-pink-500', // 后 - 粉
  L: 'from-blue-400 to-blue-500', // 左 - 蓝
  R: 'from-indigo-400 to-indigo-500', // 右 - 靛
  U: 'from-green-400 to-green-500', // 上 - 绿
  D: 'from-purple-400 to-purple-500', // 下 - 紫
};

const FACE_NAMES: Record<string, string> = {
  F: '前面',
  B: '后面',
  L: '左面',
  R: '右面',
  U: '上面',
  D: '下面',
};

const CubeNetViewer: React.FC<CubeNetViewerProps> = ({ grade = 3 }) => {
  const [netIndex, setNetIndex] = useState(0);
  const [isFolded, setIsFolded] = useState(false); // 是否折叠为立方体
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  // 根据年级筛选难度
  const maxDifficulty = grade <= 2 ? 1 : grade <= 4 ? 2 : 3;
  const filteredNets = CUBE_NETS.filter(
    (n) => n.difficulty <= maxDifficulty,
  );

  const displayNets =
    activeCategory === '全部'
      ? filteredNets
      : filteredNets.filter((n) => n.category === activeCategory);

  const categories = ['全部', '一四一型', '一三二型', '三三型', '二二二型'].filter(
    (c) => c === '全部' || filteredNets.some((n) => n.category === c),
  );

  const currentNet = displayNets[netIndex % displayNets.length] ?? filteredNets[0];

  const goPrev = (): void => {
    setNetIndex((i) => (i - 1 + displayNets.length) % displayNets.length);
    setIsFolded(false);
  };

  const goNext = (): void => {
    setNetIndex((i) => (i + 1) % displayNets.length);
    setIsFolded(false);
  };

  const handleCategoryChange = (cat: string): void => {
    setActiveCategory(cat);
    setNetIndex(0);
    setIsFolded(false);
  };

  // 渲染展开图
  const renderNetLayout = (): React.ReactNode => {
    const layout = currentNet.layout;
    const cellSize = 60;

    return (
      <div
        className="relative transition-all duration-700 ease-out"
        style={{
          width: layout[0].length * cellSize,
          height: layout.length * cellSize,
          transformStyle: 'preserve-3d',
          perspective: '600px',
        }}
      >
        {layout.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (!cell) return null;
            const gradient = FACE_COLORS[cell] ?? 'from-gray-400 to-gray-500';

            // 折叠时：各面绕相邻边旋转成 3D 立方体
            // 以 F(前) 面为基准（中心行第二列）
            const fRow = layout.findIndex((r) => r.includes('F'));
            const fCol = layout[fRow]?.indexOf('F');
            const isFront = cell === 'F';

            let foldTransform = '';
            const d = cellSize / 2;

            if (isFolded && !isFront) {
              // 计算该面相对于前面的位置关系
              const dRow = rowIdx - fRow;
              const dCol = colIdx - fCol;

              if (cell === 'U') {
                // 上面：绕前边（底边）向上翻
                foldTransform = `rotateX(90deg) translateY(${-d}px) translateZ(${d}px)`;
              } else if (cell === 'D') {
                // 下面：绕前边（顶边）向下翻
                foldTransform = `rotateX(-90deg) translateY(${d}px) translateZ(${d}px)`;
              } else if (cell === 'L') {
                // 左面：绕前边（右边）向左翻
                foldTransform = `rotateY(-90deg) translateX(${-d}px) translateZ(${d}px)`;
              } else if (cell === 'R') {
                // 右面：绕前边（左边）向右翻
                foldTransform = `rotateY(90deg) translateX(${d}px) translateZ(${d}px)`;
              } else if (cell === 'B') {
                // 后面：通过右面/左面翻转到后面
                // 简化：直接放在对面位置
                foldTransform = `rotateY(180deg) translateZ(${cellSize}px)`;
              }
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`absolute bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center text-white font-bold shadow-md border-2 border-white/50`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  left: colIdx * cellSize,
                  top: rowIdx * cellSize,
                  transform: isFolded && cell === 'F' ? `translateZ(${d}px)` : foldTransform || 'none',
                  transformOrigin: 'center center',
                  transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: 12,
                }}
              >
                {FACE_NAMES[cell]}
              </div>
            );
          }),
        )}
      </div>
    );
  };

  return (
     <div className="glass-card p-6 space-y-5">
      {/* 标题 */}
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          正方体展开图
        </h2>
         <span className="text-xs text-slate-400">
          共 {displayNets.length} 种 · {currentNet.category}
        </span>
      </div>

      {/* 分类切换 */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                 ? 'bg-purple-500 text-white shadow-sm'
                 : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 展示区 */}
      <div
         className="relative h-64 flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-purple-900/30 rounded-xl overflow-hidden border border-white/10"
        style={{ perspective: '800px' }}
      >
        {/* 网格背景 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,116,139,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.1) 1px, transparent 1px)',
            backgroundSize: '25px 25px',
          }}
        />

        {/* 容器 - 整体居中 */}
        <div
          className="relative transition-all duration-700 ease-out"
          style={{
            transform: isFolded ? 'translateX(30px)' : 'translateX(0)',
          }}
        >
          {renderNetLayout()}
        </div>

        {/* 提示 */}
           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-slate-400 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
          {isFolded ? '已折叠为正方体' : '平面展开图状态'}
        </div>
      </div>

      {/* 展开/折叠按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsFolded(false)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            !isFolded
              ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Maximize2 size={16} />
          展开
        </button>
        <button
          onClick={() => setIsFolded(true)}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            isFolded
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Sparkles size={16} />
          合并
        </button>
      </div>

      {/* 切换控制 */}
       <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          onClick={goPrev}
           className="p-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
           <div className="text-sm font-bold text-white">
            {currentNet.name}
          </div>
           <div className="text-xs text-slate-400 mt-0.5">
            难度：{'⭐'.repeat(currentNet.difficulty)}
          </div>
        </div>

        <button
          onClick={goNext}
           className="p-2 rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 小知识 */}
       <div className="bg-purple-500/15 border border-purple-500/30 rounded-xl p-4 text-sm text-purple-300">
        <p className="font-semibold mb-1">💡 小知识</p>
        <p className="text-xs leading-relaxed">
          正方体一共有 11 种不同的展开图。可以分为四类：
          一四一型（6种）、一三二型（3种）、三三型（1种）、二二二型（1种）。
          记住口诀：「中间四个面，上下各一面；中间三个面，一二隔河见；
          中间两个面，楼梯天天见；中间没有面，三三连一线」。
        </p>
      </div>
    </div>
  );
};

export default CubeNetViewer;
